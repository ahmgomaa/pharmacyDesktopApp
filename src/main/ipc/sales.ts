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
    const db = getDb()

    const tx = db.transaction((payload: CreateSaleInput): number => {
      let total = 0
      for (const item of payload.items) {
        if (item.quantity <= 0) throw new Error('Quantity must be positive')
        const med = db
          .prepare('SELECT id, name, stock FROM medicines WHERE id = ?')
          .get(item.medicineId) as { id: number; name: string; stock: number } | undefined
        if (!med) throw new Error(`Medicine ${item.medicineId} not found`)
        if (med.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${med.name}`)
        }
        total += item.quantity * item.unitPrice
      }
      const grandTotal = Math.max(0, total - (payload.discount || 0))
      const info = db
        .prepare(
          `INSERT INTO sales (customer_id, user_id, total, discount, paid)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run(payload.customerId, user.id, grandTotal, payload.discount || 0, payload.paid || 0)
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
