import bcrypt from 'bcryptjs'
import { getDb } from '../db/database'
import { handle } from './util'
import { requireAdmin } from '../session'
import { IPC } from '@shared/ipcChannels'
import type { CreateUserInput, UpdateUserInput, User, UserRole } from '@shared/types'

interface UserRow {
  id: number
  username: string
  full_name: string
  role: UserRole
  active: number
  created_at: string
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    role: row.role,
    active: row.active,
    createdAt: row.created_at
  }
}

export function registerUserHandlers(): void {
  handle<[], User[]>(IPC.users.list, () => {
    requireAdmin()
    const rows = getDb()
      .prepare(
        'SELECT id, username, full_name, role, active, created_at FROM users ORDER BY created_at DESC'
      )
      .all() as UserRow[]
    return rows.map(toUser)
  })

  handle<[CreateUserInput], User>(IPC.users.create, (_event, input) => {
    requireAdmin()
    if (!input.username || !input.password || !input.fullName) {
      throw new Error('username, fullName, and password are required')
    }
    const hash = bcrypt.hashSync(input.password, 10)
    const info = getDb()
      .prepare(
        `INSERT INTO users (username, full_name, password_hash, role, active)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(input.username, input.fullName, hash, input.role, input.active === false ? 0 : 1)
    const row = getDb()
      .prepare('SELECT id, username, full_name, role, active, created_at FROM users WHERE id = ?')
      .get(info.lastInsertRowid) as UserRow
    return toUser(row)
  })

  handle<[UpdateUserInput], User>(IPC.users.update, (_event, input) => {
    requireAdmin()
    const fields: string[] = []
    const values: (string | number)[] = []
    if (input.fullName !== undefined) {
      fields.push('full_name = ?')
      values.push(input.fullName)
    }
    if (input.role !== undefined) {
      fields.push('role = ?')
      values.push(input.role)
    }
    if (input.active !== undefined) {
      fields.push('active = ?')
      values.push(input.active ? 1 : 0)
    }
    if (input.password) {
      fields.push('password_hash = ?')
      values.push(bcrypt.hashSync(input.password, 10))
    }
    if (fields.length === 0) {
      throw new Error('No fields to update')
    }
    values.push(input.id)
    getDb()
      .prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`)
      .run(...values)
    const row = getDb()
      .prepare('SELECT id, username, full_name, role, active, created_at FROM users WHERE id = ?')
      .get(input.id) as UserRow | undefined
    if (!row) throw new Error('User not found')
    return toUser(row)
  })

  handle<[number], true>(IPC.users.remove, (_event, id) => {
    const admin = requireAdmin()
    if (admin.id === id) {
      throw new Error('Cannot delete the currently logged-in user')
    }
    const info = getDb().prepare('DELETE FROM users WHERE id = ?').run(id)
    if (info.changes === 0) throw new Error('User not found')
    return true
  })
}
