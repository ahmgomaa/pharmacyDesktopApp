import { getDb } from '../db/database'
import { handle } from './util'
import { requireUser } from '../session'
import { IPC } from '@shared/ipcChannels'
import type { CreateSaleInput, Sale, SaleDetail, SaleItem } from '@shared/types'

interface SaleRow {
  id: number
  customer_id: number | null
  customer_name: string | null
  user_id: number
  user_name: string
  total: number
  discount: number
  paid: number
  created_at: string
  item_count: number
}

interface SaleItemRow {
  medicine_id: number
  medicine_name: string
  quantity: number
  unit_price: number
  line_total: number
}

function toSale(row: SaleRow): Sale {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    userId: row.user_id,
    userName: row.user_name,
    total: row.total,
    discount: row.discount,
    paid: row.paid,
    createdAt: row.created_at,
    itemCount: row.item_count
  }
}

function toItem(row: SaleItemRow): SaleItem {
  return {
    medicineId: row.medicine_id,
    medicineName: row.medicine_name,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    lineTotal: row.line_total
  }
}

const BASE_SELECT = `
  SELECT s.id, s.customer_id, c.name AS customer_name, s.user_id, u.full_name AS user_name,
         s.total, s.discount, s.paid, s.created_at,
         (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) AS item_count
  FROM sales s
  LEFT JOIN customers c ON c.id = s.customer_id
  JOIN users u ON u.id = s.user_id
`

export function registerSaleHandlers(): void {
  handle<[], Sale[]>(IPC.sales.list, () => {
    requireUser()
    const rows = getDb()
      .prepare(`${BASE_SELECT} ORDER BY s.created_at DESC LIMIT 200`)
      .all() as SaleRow[]
    return rows.map(toSale)
  })

  handle<[number], SaleDetail | null>(IPC.sales.get, (_event, id) => {
    requireUser()
    const row = getDb().prepare(`${BASE_SELECT} WHERE s.id = ?`).get(id) as SaleRow | undefined
    if (!row) return null
    const items = getDb()
      .prepare(
        `SELECT si.medicine_id, m.name AS medicine_name, si.quantity, si.unit_price, si.line_total
         FROM sale_items si JOIN medicines m ON m.id = si.medicine_id
         WHERE si.sale_id = ?`
      )
      .all(id) as SaleItemRow[]
    return { ...toSale(row), items: items.map(toItem) }
  })

  handle<[CreateSaleInput], SaleDetail>(IPC.sales.create, (_event, input) => {
    const user = requireUser()
    if (!input.items || input.items.length === 0) {
      throw new Error('Sale must include at least one item')
    }
    const discount = Number(input.discount) || 0
    const paid = Number(input.paid) || 0
    if (discount < 0) throw new Error('Discount must be non-negative')
    if (paid < 0) throw new Error('Paid amount must be non-negative')
    for (const item of input.items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new Error('Quantity must be a positive integer')
      }
      if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
        throw new Error('Unit price must be non-negative')
      }
    }

    const totalByMedicine = new Map<number, number>()
    for (const item of input.items) {
      totalByMedicine.set(
        item.medicineId,
        (totalByMedicine.get(item.medicineId) || 0) + item.quantity
      )
    }

    const db = getDb()

    const tx = db.transaction((payload: CreateSaleInput): number => {
      for (const [medicineId, totalQty] of totalByMedicine) {
        const med = db
          .prepare('SELECT id, name, stock FROM medicines WHERE id = ?')
          .get(medicineId) as { id: number; name: string; stock: number } | undefined
        if (!med) throw new Error(`Medicine ${medicineId} not found`)
        if (med.stock < totalQty) {
          throw new Error(`Insufficient stock for ${med.name}`)
        }
      }

      const subtotal = payload.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
      const effectiveDiscount = Math.min(discount, subtotal)
      const grandTotal = subtotal - effectiveDiscount
      const info = db
        .prepare(
          `INSERT INTO sales (customer_id, user_id, total, discount, paid)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run(payload.customerId, user.id, grandTotal, effectiveDiscount, paid)
      const saleId = info.lastInsertRowid as number

      const insertItem = db.prepare(
        `INSERT INTO sale_items (sale_id, medicine_id, quantity, unit_price, line_total)
         VALUES (?, ?, ?, ?, ?)`
      )
      const decStock = db.prepare('UPDATE medicines SET stock = stock - ? WHERE id = ?')
      for (const item of payload.items) {
        insertItem.run(
          saleId,
          item.medicineId,
          item.quantity,
          item.unitPrice,
          item.quantity * item.unitPrice
        )
        decStock.run(item.quantity, item.medicineId)
      }
      return saleId
    })

    const saleId = tx(input)
    const row = getDb().prepare(`${BASE_SELECT} WHERE s.id = ?`).get(saleId) as SaleRow
    const items = getDb()
      .prepare(
        `SELECT si.medicine_id, m.name AS medicine_name, si.quantity, si.unit_price, si.line_total
         FROM sale_items si JOIN medicines m ON m.id = si.medicine_id
         WHERE si.sale_id = ?`
      )
      .all(saleId) as SaleItemRow[]
    return { ...toSale(row), items: items.map(toItem) }
  })
}
