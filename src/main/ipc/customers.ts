import { getDb } from '../db/database'
import { handle } from './util'
import { requireUser } from '../session'
import { IPC } from '@shared/ipcChannels'
import type { CreateCustomerInput, Customer } from '@shared/types'

interface CustomerRow {
  id: number
  name: string
  phone: string | null
  email: string | null
  notes: string | null
  created_at: string
}

function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    createdAt: row.created_at
  }
}

export function registerCustomerHandlers(): void {
  handle<[], Customer[]>(IPC.customers.list, () => {
    requireUser()
    const rows = getDb().prepare('SELECT * FROM customers ORDER BY name ASC').all() as CustomerRow[]
    return rows.map(toCustomer)
  })

  handle<[CreateCustomerInput], Customer>(IPC.customers.create, (_event, input) => {
    requireUser()
    if (!input.name) throw new Error('Customer name is required')
    const info = getDb()
      .prepare(`INSERT INTO customers (name, phone, email, notes) VALUES (?, ?, ?, ?)`)
      .run(input.name, input.phone ?? null, input.email ?? null, input.notes ?? null)
    const row = getDb()
      .prepare('SELECT * FROM customers WHERE id = ?')
      .get(info.lastInsertRowid) as CustomerRow
    return toCustomer(row)
  })

  handle<[{ id: number } & CreateCustomerInput], Customer>(
    IPC.customers.update,
    (_event, input) => {
      requireUser()
      getDb()
        .prepare(`UPDATE customers SET name = ?, phone = ?, email = ?, notes = ? WHERE id = ?`)
        .run(input.name, input.phone ?? null, input.email ?? null, input.notes ?? null, input.id)
      const row = getDb().prepare('SELECT * FROM customers WHERE id = ?').get(input.id) as
        | CustomerRow
        | undefined
      if (!row) throw new Error('Customer not found')
      return toCustomer(row)
    }
  )

  handle<[number], true>(IPC.customers.remove, (_event, id) => {
    requireUser()
    const info = getDb().prepare('DELETE FROM customers WHERE id = ?').run(id)
    if (info.changes === 0) throw new Error('Customer not found')
    return true
  })
}
