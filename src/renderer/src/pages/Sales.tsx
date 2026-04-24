import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import type { Sale, SaleDetail } from '@shared/types'

export default function Sales(): JSX.Element {
  const { t } = useTranslation()
  const [sales, setSales] = useState<Sale[]>([])
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<SaleDetail | null>(null)

  useEffect(() => {
    window.api.sales
      .list()
      .then(setSales)
      .catch((e: Error) => setError(e.message))
  }, [])

  const view = async (id: number): Promise<void> => {
    try {
      const d = await window.api.sales.get(id)
      setDetail(d)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div>
      <PageHeader title={t('sales.title')} />
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              <th>{t('sales.id')}</th>
              <th>{t('sales.date')}</th>
              <th>{t('sales.cashier')}</th>
              <th>{t('sales.customer')}</th>
              <th>{t('sales.items')}</th>
              <th>{t('sales.total')}</th>
              <th className="text-right">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-400">
                  {t('common.noData')}
                </td>
              </tr>
            )}
            {sales.map((s) => (
              <tr key={s.id}>
                <td>#{s.id}</td>
                <td>{new Date(s.createdAt).toLocaleString()}</td>
                <td>{s.userName}</td>
                <td>{s.customerName ?? '—'}</td>
                <td>{s.itemCount}</td>
                <td>{s.total.toFixed(2)}</td>
                <td className="text-right">
                  <button className="btn-secondary" onClick={() => view(s.id)}>
                    {t('common.edit')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!detail}
        title={detail ? `#${detail.id}` : ''}
        onClose={() => setDetail(null)}
        widthClass="max-w-2xl"
      >
        {detail && (
          <table className="table">
            <thead>
              <tr>
                <th>{t('medicines.name')}</th>
                <th>{t('pos.quantity')}</th>
                <th>{t('pos.unitPrice')}</th>
                <th>{t('pos.lineTotal')}</th>
              </tr>
            </thead>
            <tbody>
              {detail.items.map((it) => (
                <tr key={it.medicineId}>
                  <td>{it.medicineName}</td>
                  <td>{it.quantity}</td>
                  <td>{it.unitPrice.toFixed(2)}</td>
                  <td>{it.lineTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>
    </div>
  )
}
