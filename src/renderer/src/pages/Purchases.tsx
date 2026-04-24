import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import type { Medicine, PurchaseOrder, PurchaseOrderDetail, Supplier } from '@shared/types'

interface POItemDraft {
  medicineId: number
  medicineName: string
  quantity: number
  unitCost: number
}

export default function Purchases(): JSX.Element {
  const { t } = useTranslation()
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [open, setOpen] = useState(false)
  const [supplierId, setSupplierId] = useState<number | ''>('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<POItemDraft[]>([])
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<PurchaseOrderDetail | null>(null)

  const load = async (): Promise<void> => {
    const [os, ss, ms] = await Promise.all([
      window.api.purchases.list(),
      window.api.suppliers.list(),
      window.api.medicines.list()
    ])
    setOrders(os)
    setSuppliers(ss)
    setMedicines(ms)
  }

  useEffect(() => {
    load().catch((e: Error) => setError(e.message))
  }, [])

  const total = useMemo(() => items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0), [items])

  const openNew = (): void => {
    setSupplierId('')
    setNotes('')
    setItems([])
    setError(null)
    setOpen(true)
  }

  const addItem = (): void => {
    if (medicines.length === 0) return
    const first = medicines[0]
    setItems((prev) => [
      ...prev,
      {
        medicineId: first.id,
        medicineName: first.name,
        quantity: 1,
        unitCost: first.costPrice
      }
    ])
  }

  const updateItem = (index: number, patch: Partial<POItemDraft>): void => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  const removeItem = (index: number): void => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)
    if (!supplierId) {
      setError('Supplier is required')
      return
    }
    if (items.length === 0) {
      setError('Add at least one item')
      return
    }
    try {
      await window.api.purchases.create({
        supplierId: Number(supplierId),
        notes: notes || null,
        items: items.map((i) => ({
          medicineId: i.medicineId,
          quantity: i.quantity,
          unitCost: i.unitCost
        }))
      })
      setOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const view = async (id: number): Promise<void> => {
    const d = await window.api.purchases.get(id)
    setDetail(d)
  }

  return (
    <div>
      <PageHeader
        title={t('purchases.title')}
        actions={
          <button className="btn-primary" onClick={openNew}>
            {t('purchases.new')}
          </button>
        }
      />
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              <th>{t('sales.id')}</th>
              <th>{t('sales.date')}</th>
              <th>{t('purchases.supplier')}</th>
              <th>{t('sales.items')}</th>
              <th>{t('purchases.total')}</th>
              <th className="text-right">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400">
                  {t('common.noData')}
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td>{new Date(o.createdAt).toLocaleString()}</td>
                <td>{o.supplierName}</td>
                <td>{o.itemCount}</td>
                <td>{o.total.toFixed(2)}</td>
                <td className="text-right">
                  <button className="btn-secondary" onClick={() => view(o.id)}>
                    {t('common.edit')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        title={t('purchases.new')}
        onClose={() => setOpen(false)}
        widthClass="max-w-3xl"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </button>
            <button className="btn-primary" form="purchase-form" type="submit">
              {t('purchases.submit')}
            </button>
          </>
        }
      >
        <form id="purchase-form" onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('purchases.supplier')}</label>
              <select
                className="input"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : '')}
                required
              >
                <option value="">—</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t('purchases.notes')}</label>
              <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">{t('purchases.items')}</h4>
            <button type="button" className="btn-secondary" onClick={addItem}>
              {t('purchases.addItem')}
            </button>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>{t('purchases.pickMedicine')}</th>
                <th>{t('purchases.quantity')}</th>
                <th>{t('purchases.unitCost')}</th>
                <th>{t('purchases.total')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-3 text-center text-slate-400">
                    {t('common.noData')}
                  </td>
                </tr>
              )}
              {items.map((it, i) => (
                <tr key={i}>
                  <td className="w-1/2">
                    <select
                      className="input py-1"
                      value={it.medicineId}
                      onChange={(e) => {
                        const m = medicines.find((mm) => mm.id === Number(e.target.value))
                        if (!m) return
                        updateItem(i, {
                          medicineId: m.id,
                          medicineName: m.name,
                          unitCost: m.costPrice
                        })
                      }}
                    >
                      {medicines.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="input py-1"
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) => updateItem(i, { quantity: Number(e.target.value) || 1 })}
                    />
                  </td>
                  <td>
                    <input
                      className="input py-1"
                      type="number"
                      min={0}
                      step="0.01"
                      value={it.unitCost}
                      onChange={(e) => updateItem(i, { unitCost: Number(e.target.value) || 0 })}
                    />
                  </td>
                  <td>{(it.quantity * it.unitCost).toFixed(2)}</td>
                  <td>
                    <button type="button" className="btn-secondary" onClick={() => removeItem(i)}>
                      {t('pos.remove')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end text-base font-semibold">
            <span className="mr-4">{t('purchases.total')}:</span>
            <span>{total.toFixed(2)}</span>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
        </form>
      </Modal>

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
                <th>{t('purchases.quantity')}</th>
                <th>{t('purchases.unitCost')}</th>
                <th>{t('purchases.total')}</th>
              </tr>
            </thead>
            <tbody>
              {detail.items.map((it) => (
                <tr key={it.medicineId}>
                  <td>{it.medicineName}</td>
                  <td>{it.quantity}</td>
                  <td>{it.unitCost.toFixed(2)}</td>
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
