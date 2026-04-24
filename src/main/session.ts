import type { AuthenticatedUser } from '@shared/types'

let currentUser: AuthenticatedUser | null = null

export function setCurrentUser(user: AuthenticatedUser | null): void {
  currentUser = user
}

export function getCurrentUser(): AuthenticatedUser | null {
  return currentUser
}

export function requireUser(): AuthenticatedUser {
  if (!currentUser) {
    throw new Error('Not authenticated')
  }
  return currentUser
}

export function requireAdmin(): AuthenticatedUser {
  const user = requireUser()
  if (user.role !== 'admin') {
    throw new Error('Admin privileges required')
  }
  return user
}
