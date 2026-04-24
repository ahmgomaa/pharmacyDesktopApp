import { getDb } from '../db/database'
import { handle } from './util'
import { requireUser } from '../session'
import { IPC } from '@shared/ipcChannels'
import type {
  DailySalesReportRow,
  DashboardStats,
  ExpiringSoonRow,
  LowStockRow
} from '@shared/types'

export function registerReportHandlers(): void {
  handle<[{ days?: number }], DailySalesReportRow[]>(IPC.reports.dailySales, (_event, opts) => {
    requireUser()
    const days = opts?.days ?? 14
    const rows = getDb()
      .prepare(
        `SELECT DATE(created_at) AS date,
                COUNT(*) AS salesCount,
                COALESCE(SUM(total), 0) AS total
         FROM sales
         WHERE DATE(created_at) >= DATE('now', ?)
         GROUP BY DATE(created_at)
         ORDER BY date DESC`
      )
      .all(`-${days} days`) as DailySalesReportRow[]
    return rows
  })

  handle<[], LowStockRow[]>(IPC.reports.lowStock, () => {
    requireUser()
    return getDb()
      .prepare(
        `SELECT id, name, stock, reorder_level AS reorderLevel
         FROM medicines
         WHERE stock <= reorder_level
         ORDER BY stock ASC, name ASC`
      )
      .all() as LowStockRow[]
  })

  handle<[{ days?: number }], ExpiringSoonRow[]>(IPC.reports.expiringSoon, (_event, opts) => {
    requireUser()
    const days = opts?.days ?? 60
    return getDb()
      .prepare(
        `SELECT id, name, expiry_date AS expiryDate, stock,
                CAST(julianday(expiry_date) - julianday('now') AS INTEGER) AS daysUntilExpiry
         FROM medicines
         WHERE expiry_date IS NOT NULL
           AND DATE(expiry_date) <= DATE('now', ?)
           AND stock > 0
         ORDER BY expiry_date ASC`
      )
      .all(`+${days} days`) as ExpiringSoonRow[]
  })

  handle<[], DashboardStats>(IPC.reports.dashboardStats, () => {
    requireUser()
    const db = getDb()
    const totalMedicines = (
      db.prepare('SELECT COUNT(*) AS c FROM medicines').get() as {
        c: number
      }
    ).c
    const lowStockCount = (
      db.prepare('SELECT COUNT(*) AS c FROM medicines WHERE stock <= reorder_level').get() as {
        c: number
      }
    ).c
    const expiringSoonCount = (
      db
        .prepare(
          `SELECT COUNT(*) AS c FROM medicines
         WHERE expiry_date IS NOT NULL
           AND DATE(expiry_date) <= DATE('now', '+60 days')
           AND stock > 0`
        )
        .get() as { c: number }
    ).c
    const todaySales = db
      .prepare(
        `SELECT COUNT(*) AS c, COALESCE(SUM(total), 0) AS t
         FROM sales
         WHERE DATE(created_at) = DATE('now')`
      )
      .get() as { c: number; t: number }
    return {
      totalMedicines,
      lowStockCount,
      expiringSoonCount,
      todaySalesCount: todaySales.c,
      todaySalesTotal: todaySales.t
    }
  })
}
