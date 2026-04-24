import { getDb } from '../db/database'
import { handle } from './util'
import { requireUser } from '../session'
import { IPC } from '@shared/ipcChannels'
import type { CreateMedicineInput, Medicine } from '@shared/types'

interface MedicineRow {
  id: number
  name: string
  barcode: string | null
  stock: number
  reorder_level: number
  expiry_date: string | null
  price: number
  cost_price: number
  supplier_id: number | null
  created_at: string
  updated_at: string
}

function toMedicine(row: MedicineRow): Medicine {
  return {
    id: row.id,
    name: row.name,
    barcode: row.barcode,
    stock: row.stock,
    reorderLevel: row.reorder_level,
    expiryDate: row.expiry_date,
    price: row.price,
    costPrice: row.cost_price,
    supplierId: row.supplier_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function registerMedicineHandlers(): void {
  handle<[], Medicine[]>(IPC.medicines.list, () => {
    requireUser()
    const rows = getDb().prepare('SELECT * FROM medicines ORDER BY name ASC').all() as MedicineRow[]
    return rows.map(toMedicine)
  })

  handle<[string], Medicine[]>(IPC.medicines.search, (_event, query) => {
    requireUser()
    const like = `%${query}%`
    const rows = getDb()
      .prepare(
        `SELECT * FROM medicines
         WHERE name LIKE ? OR barcode LIKE ?
         ORDER BY name ASC LIMIT 50`
      )
      .all(like, like) as MedicineRow[]
    return rows.map(toMedicine)
  })

  handle<[number], Medicine | null>(IPC.medicines.get, (_event, id) => {
    requireUser()
    const row = getDb().prepare('SELECT * FROM medicines WHERE id = ?').get(id) as
      | MedicineRow
      | undefined
    return row ? toMedicine(row) : null
  })

  handle<[string], Medicine | null>(IPC.medicines.getByBarcode, (_event, barcode) => {
    requireUser()
    const row = getDb().prepare('SELECT * FROM medicines WHERE barcode = ?').get(barcode) as
      | MedicineRow
      | undefined
    return row ? toMedicine(row) : null
  })

  handle<[CreateMedicineInput], Medicine>(IPC.medicines.create, (_event, input) => {
    requireUser()
    if (!input.name) throw new Error('Medicine name is required')
    const info = getDb()
      .prepare(
        `INSERT INTO medicines (name, barcode, stock, reorder_level, expiry_date, price, cost_price, supplier_id, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      )
      .run(
        input.name,
        input.barcode ?? null,
        input.stock,
        input.reorderLevel,
        input.expiryDate ?? null,
        input.price,
        input.costPrice,
        input.supplierId ?? null
      )
    const row = getDb()
      .prepare('SELECT * FROM medicines WHERE id = ?')
      .get(info.lastInsertRowid) as MedicineRow
    return toMedicine(row)
  })

  handle<[{ id: number } & CreateMedicineInput], Medicine>(
    IPC.medicines.update,
    (_event, input) => {
      requireUser()
      getDb()
        .prepare(
          `UPDATE medicines
           SET name = ?, barcode = ?, stock = ?, reorder_level = ?, expiry_date = ?,
               price = ?, cost_price = ?, supplier_id = ?, updated_at = datetime('now')
           WHERE id = ?`
        )
        .run(
          input.name,
          input.barcode ?? null,
          input.stock,
          input.reorderLevel,
          input.expiryDate ?? null,
          input.price,
          input.costPrice,
          input.supplierId ?? null,
          input.id
        )
      const row = getDb().prepare('SELECT * FROM medicines WHERE id = ?').get(input.id) as
        | MedicineRow
        | undefined
      if (!row) throw new Error('Medicine not found')
      return toMedicine(row)
    }
  )

  handle<[number], true>(IPC.medicines.remove, (_event, id) => {
    requireUser()
    const info = getDb().prepare('DELETE FROM medicines WHERE id = ?').run(id)
    if (info.changes === 0) throw new Error('Medicine not found')
    return true
  })
}
