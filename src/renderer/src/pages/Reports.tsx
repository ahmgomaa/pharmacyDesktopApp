import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../components/PageHeader'
import type { DailySalesReportRow, ExpiringSoonRow, LowStockRow } from '@shared/types'

export default function Reports(): JSX.Element {
  const { t } = useTranslation()
  const [daily, setDaily] = useState<DailySalesReportRow[]>([])
  const [lowStock, setLowStock] = useState<LowStockRow[]>([])
  const [expiring, setExpiring] = useState<ExpiringSoonRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const days = 14

  useEffect(() => {
    Promise.all([
      window.api.reports.dailySales(days),
      window.api.reports.lowStock(),
      window.api.reports.expiringSoon(60)
    ])
      .then(([d, l, e]) => {
        setDaily(d)
        setLowStock(l)
        setExpiring(e)
      })
      .catch((err: Error) => setError(err.message))
  }, [])

  return (
    <div>
      <PageHeader title={t('reports.title')} />
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold">{t('reports.dailySales', { days })}</h3>
          <table className="table">
            <thead>
              <tr>
                <th>{t('reports.date')}</th>
                <th>{t('reports.salesCount')}</th>
                <th>{t('reports.total')}</th>
              </tr>
            </thead>
            <tbody>
              {daily.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-slate-400">
                    {t('common.noData')}
                  </td>
                </tr>
              )}
              {daily.map((d) => (
                <tr key={d.date}>
                  <td>{d.date}</td>
                  <td>{d.salesCount}</td>
                  <td>{d.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 className="mb-3 text-sm font-semibold">{t('reports.lowStock')}</h3>
          <table className="table">
            <thead>
              <tr>
                <th>{t('reports.medicine')}</th>
                <th>{t('reports.stock')}</th>
                <th>{t('reports.reorderLevel')}</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-slate-400">
                    {t('common.noData')}
                  </td>
                </tr>
              )}
              {lowStock.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td className="font-semibold text-red-600">{r.stock}</td>
                  <td>{r.reorderLevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 className="mb-3 text-sm font-semibold">{t('reports.expiringSoon')}</h3>
          <table className="table">
            <thead>
              <tr>
                <th>{t('reports.medicine')}</th>
                <th>{t('reports.expiryDate')}</th>
                <th>{t('reports.daysLeft')}</th>
              </tr>
            </thead>
            <tbody>
              {expiring.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-slate-400">
                    {t('common.noData')}
                  </td>
                </tr>
              )}
              {expiring.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.expiryDate}</td>
                  <td className={r.daysUntilExpiry <= 14 ? 'font-semibold text-red-600' : ''}>
                    {r.daysUntilExpiry}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
