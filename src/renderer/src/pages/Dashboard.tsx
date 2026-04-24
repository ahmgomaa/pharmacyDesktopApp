import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../contexts/AuthContext'
import type { DashboardStats } from '@shared/types'

export default function Dashboard(): JSX.Element {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.api.reports
      .dashboardStats()
      .then(setStats)
      .catch((e: Error) => setError(e.message))
  }, [])

  const cards = stats
    ? [
        { label: t('dashboard.totalMedicines'), value: stats.totalMedicines },
        { label: t('dashboard.lowStock'), value: stats.lowStockCount },
        { label: t('dashboard.expiringSoon'), value: stats.expiringSoonCount },
        { label: t('dashboard.todaySalesCount'), value: stats.todaySalesCount },
        { label: t('dashboard.todaySalesTotal'), value: stats.todaySalesTotal.toFixed(2) }
      ]
    : []

  return (
    <div>
      <PageHeader title={t('dashboard.title')} />
      <p className="mb-6 text-slate-600">
        {t('dashboard.welcome', { name: user?.fullName ?? '' })}
      </p>
      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <div className="text-xs uppercase tracking-wide text-slate-500">{c.label}</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{c.value}</div>
          </div>
        ))}
        {!stats && !error && <div className="text-slate-500">{t('common.loading')}</div>}
      </div>
    </div>
  )
}
