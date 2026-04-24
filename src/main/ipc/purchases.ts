import { getDb } from '../db/database'
import { handle } from './util'
import { requireUser } from '../session'
import { IPC } from '@shared/ipcChannels'
import type {
  CreatePurchaseOrderInput,
  PurchaseOrder,
  PurchaseOrderDetail,
  PurchaseOrderItem
} from '@shared/types'

interface POrderRow {
  id: number
  supplier_id: number
  supplier_name: string
  total: number
  notes: string | null
  created_at: string
  item_count: number
}

interface POItemRow {
  medicine_id: number
  medicine_name: string
  quantity: number
  unit_cost: number
  line_total: number
}

function toOrder(row: POrderRow): PurchaseOrder {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    supplierName: row.supplier_name,
    total: row.total,
    notes: row.notes,
    createdAt: row.created_at,
    itemCount: row.item_count
  }
}

function toItem(row: POItemRow): PurchaseOrderItem {
  return {
    medicineId: row.medicine_id,
    medicineName: row.medicine_name,
    quantity: row.quantity,
    unitCost: row.unit_cost,
    lineTotal: row.line_total
  }
}

const BASE_SELECT = `
  SELECT po.id, po.supplier_id, s.name AS supplier_name, po.total, po.notes, po.created_at,
         (SELECT COUNT(*) FROM purchase_order_items i WHERE i.purchase_order_id = po.id) AS item_count
  FROM purchase_orders po
  JOIN suppliers s ON s.id = po.supplier_id
`

export function registerPurchaseHandlers(): void {
  handle<[], PurchaseOrder[]>(IPC.purchases.list, () => {
    requireUser()
    const rows = getDb()
      .prepare(`${BASE_SELECT} ORDER BY po.created_at DESC LIMIT 200`)
      .all() as POrderRow[]
    return rows.map(toOrder)
  })

  handle<[number], PurchaseOrderDetail | null>(IPC.purchases.get, (_event, id) => {
    requireUser()
    const row = getDb().prepare(`${BASE_SELECT} WHERE po.id = ?`).get(id) as POrderRow | undefined
    if (!row) return null
    const items = getDb()
      .prepare(
        `SELECT poi.medicine_id, m.name AS medicine_name, poi.quantity, poi.unit_cost, poi.line_total
         FROM purchase_order_items poi JOIN medicines m ON m.id = poi.medicine_id
         WHERE poi.purchase_order_id = ?`
      )
      .all(id) as POItemRow[]
    return { ...toOrder(row), items: items.map(toItem) }
  })

  handle<[CreatePurchaseOrderInput], PurchaseOrderDetail>(IPC.purchases.create, (_event, input) => {
    requireUser()
    if (!input.items || input.items.length === 0) {
      throw new Error('Purchase order must include at least one item')
    }
    const db = getDb()
    const tx = db.transaction((payload: CreatePurchaseOrderInput): number => {
      let total = 0
      for (const item of payload.items) {
        if (item.quantity <= 0) throw new Error('Quantity must be positive')
        total += item.quantity * item.unitCost
      }
      const info = db
        .prepare(`INSERT INTO purchase_orders (supplier_id, total, notes) VALUES (?, ?, ?)`)
        .run(payload.supplierId, total, payload.notes ?? null)
      const poId = info.lastInsertRowid as number

      const insertItem = db.prepare(
        `INSERT INTO purchase_order_items (purchase_order_id, medicine_id, quantity, unit_cost, line_total)
         VALUES (?, ?, ?, ?, ?)`
      )
      const incStock = db.prepare(
        `UPDATE medicines SET stock = stock + ?, cost_price = ?, supplier_id = ?, updated_at = datetime('now')
         WHERE id = ?`
      )
      for (const item of payload.items) {
        insertItem.run(
          poId,
          item.medicineId,
          item.quantity,
          item.unitCost,
          item.quantity * item.unitCost
        )
        incStock.run(item.quantity, item.unitCost, payload.supplierId, item.medicineId)
      }
      return poId
    })

    const poId = tx(input)
    const row = getDb().prepare(`${BASE_SELECT} WHERE po.id = ?`).get(poId) as POrderRow
    const items = getDb()
      .prepare(
        `SELECT poi.medicine_id, m.name AS medicine_name, poi.quantity, poi.unit_cost, poi.line_total
         FROM purchase_order_items poi JOIN medicines m ON m.id = poi.medicine_id
         WHERE poi.purchase_order_id = ?`
      )
      .all(poId) as POItemRow[]
    return { ...toOrder(row), items: items.map(toItem) }
  })
}
