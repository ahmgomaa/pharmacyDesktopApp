import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import { getDb } from '../db/database'
import { handle } from './util'
import { setCurrentUser, getCurrentUser } from '../session'
import { IPC } from '@shared/ipcChannels'
import type { AuthenticatedUser, User, UserRole } from '@shared/types'

interface UserRow {
  id: number
  username: string
  full_name: string
  password_hash: string
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

export function registerAuthHandlers(): void {
  handle<[{ username: string; password: string }], AuthenticatedUser>(
    IPC.auth.login,
    (_event, { username, password }) => {
      const row = getDb()
        .prepare('SELECT * FROM users WHERE username = ? AND active = 1')
        .get(username) as UserRow | undefined
      if (!row) throw new Error('Invalid credentials')
      if (!bcrypt.compareSync(password, row.password_hash)) {
        throw new Error('Invalid credentials')
      }
      const auth: AuthenticatedUser = {
        ...toUser(row),
        token: randomBytes(24).toString('hex')
      }
      setCurrentUser(auth)
      return auth
    }
  )

  handle<[], true>(IPC.auth.logout, () => {
    setCurrentUser(null)
    return true
  })

  handle<[], AuthenticatedUser | null>(IPC.auth.currentUser, () => {
    return getCurrentUser()
  })
}
