import { getDb } from '../db/database'
import { handle } from './util'
import { requireUser } from '../session'
import { IPC } from '@shared/ipcChannels'
import type { CreateSupplierInput, Supplier } from '@shared/types'

interface SupplierRow {
  id: number
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  created_at: string
}

function toSupplier(row: SupplierRow): Supplier {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    notes: row.notes,
    createdAt: row.created_at
  }
}

export function registerSupplierHandlers(): void {
  handle<[], Supplier[]>(IPC.suppliers.list, () => {
    requireUser()
    const rows = getDb().prepare('SELECT * FROM suppliers ORDER BY name ASC').all() as SupplierRow[]
    return rows.map(toSupplier)
  })

  handle<[CreateSupplierInput], Supplier>(IPC.suppliers.create, (_event, input) => {
    requireUser()
    if (!input.name) throw new Error('Supplier name is required')
    const info = getDb()
      .prepare(`INSERT INTO suppliers (name, phone, email, address, notes) VALUES (?, ?, ?, ?, ?)`)
      .run(
        input.name,
        input.phone ?? null,
        input.email ?? null,
        input.address ?? null,
        input.notes ?? null
      )
    const row = getDb()
      .prepare('SELECT * FROM suppliers WHERE id = ?')
      .get(info.lastInsertRowid) as SupplierRow
    return toSupplier(row)
  })

  handle<[{ id: number } & CreateSupplierInput], Supplier>(
    IPC.suppliers.update,
    (_event, input) => {
      requireUser()
      getDb()
        .prepare(
          `UPDATE suppliers SET name = ?, phone = ?, email = ?, address = ?, notes = ? WHERE id = ?`
        )
        .run(
          input.name,
          input.phone ?? null,
          input.email ?? null,
          input.address ?? null,
          input.notes ?? null,
          input.id
        )
      const row = getDb().prepare('SELECT * FROM suppliers WHERE id = ?').get(input.id) as
        | SupplierRow
        | undefined
      if (!row) throw new Error('Supplier not found')
      return toSupplier(row)
    }
  )

  handle<[number], true>(IPC.suppliers.remove, (_event, id) => {
    requireUser()
    const info = getDb().prepare('DELETE FROM suppliers WHERE id = ?').run(id)
    if (info.changes === 0) throw new Error('Supplier not found')
    return true
  })
}
