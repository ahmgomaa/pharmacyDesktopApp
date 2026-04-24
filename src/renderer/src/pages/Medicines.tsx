import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import type { CreateMedicineInput, Medicine, Supplier } from '@shared/types'

interface FormState {
  id?: number
  name: string
  barcode: string
  stock: string
  reorderLevel: string
  expiryDate: string
  price: string
  costPrice: string
  supplierId: string
}

const emptyForm: FormState = {
  name: '',
  barcode: '',
  stock: '0',
  reorderLevel: '0',
  expiryDate: '',
  price: '0',
  costPrice: '0',
  supplierId: ''
}

function toInput(form: FormState): CreateMedicineInput {
  return {
    name: form.name.trim(),
    barcode: form.barcode.trim() || null,
    stock: Number(form.stock) || 0,
    reorderLevel: Number(form.reorderLevel) || 0,
    expiryDate: form.expiryDate || null,
    price: Number(form.price) || 0,
    costPrice: Number(form.costPrice) || 0,
    supplierId: form.supplierId ? Number(form.supplierId) : null
  }
}

export default function Medicines(): JSX.Element {
  const { t } = useTranslation()
  const [items, setItems] = useState<Medicine[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)

  const load = async (): Promise<void> => {
    const [meds, sups] = await Promise.all([
      window.api.medicines.list(),
      window.api.suppliers.list()
    ])
    setItems(meds)
    setSuppliers(sups)
  }

  useEffect(() => {
    load().catch((e: Error) => setError(e.message))
  }, [])

  const filtered = useMemo(() => {
    if (!query) return items
    const q = query.toLowerCase()
    return items.filter(
      (m) => m.name.toLowerCase().includes(q) || (m.barcode ?? '').toLowerCase().includes(q)
    )
  }, [items, query])

  const openNew = (): void => {
    setForm(emptyForm)
    setError(null)
    setOpen(true)
  }

  const openEdit = (m: Medicine): void => {
    setForm({
      id: m.id,
      name: m.name,
      barcode: m.barcode ?? '',
      stock: String(m.stock),
      reorderLevel: String(m.reorderLevel),
      expiryDate: m.expiryDate ?? '',
      price: String(m.price),
      costPrice: String(m.costPrice),
      supplierId: m.supplierId ? String(m.supplierId) : ''
    })
    setError(null)
    setOpen(true)
  }

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)
    try {
      const input = toInput(form)
      if (form.id) {
        await window.api.medicines.update({ id: form.id, ...input })
      } else {
        await window.api.medicines.create(input)
      }
      setOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const remove = async (id: number): Promise<void> => {
    if (!confirm(t('common.confirmDelete'))) return
    try {
      await window.api.medicines.remove(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div>
      <PageHeader
        title={t('medicines.title')}
        actions={
          <button className="btn-primary" onClick={openNew}>
            {t('medicines.addNew')}
          </button>
        }
      />
      <div className="mb-4">
        <input
          className="input max-w-sm"
          placeholder={t('medicines.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              <th>{t('medicines.name')}</th>
              <th>{t('medicines.barcode')}</th>
              <th>{t('medicines.stock')}</th>
              <th>{t('medicines.price')}</th>
              <th>{t('medicines.expiryDate')}</th>
              <th>{t('medicines.supplier')}</th>
              <th className="text-right">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-400">
                  {t('common.noData')}
                </td>
              </tr>
            )}
            {filtered.map((m) => {
              const supplier = suppliers.find((s) => s.id === m.supplierId)
              return (
                <tr key={m.id}>
                  <td className="font-medium">{m.name}</td>
                  <td>{m.barcode ?? '—'}</td>
                  <td>
                    <span className={m.stock <= m.reorderLevel ? 'text-red-600 font-semibold' : ''}>
                      {m.stock}
                    </span>
                  </td>
                  <td>{m.price.toFixed(2)}</td>
                  <td>{m.expiryDate ?? '—'}</td>
                  <td>{supplier?.name ?? '—'}</td>
                  <td className="text-right">
                    <button className="btn-secondary mr-2" onClick={() => openEdit(m)}>
                      {t('common.edit')}
                    </button>
                    <button className="btn-danger" onClick={() => remove(m.id)}>
                      {t('common.delete')}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        title={form.id ? t('medicines.edit') : t('medicines.addNew')}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </button>
            <button className="btn-primary" form="medicine-form" type="submit">
              {t('common.save')}
            </button>
          </>
        }
      >
        <form id="medicine-form" className="grid grid-cols-2 gap-3" onSubmit={submit}>
          <div className="col-span-2">
            <label className="label">{t('medicines.name')}</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">{t('medicines.barcode')}</label>
            <input
              className="input"
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t('medicines.supplier')}</label>
            <select
              className="input"
              value={form.supplierId}
              onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
            >
              <option value="">{t('medicines.none')}</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t('medicines.stock')}</label>
            <input
              className="input"
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t('medicines.reorderLevel')}</label>
            <input
              className="input"
              type="number"
              min="0"
              value={form.reorderLevel}
              onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t('medicines.price')}</label>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t('medicines.costPrice')}</label>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <label className="label">{t('medicines.expiryDate')}</label>
            <input
              className="input"
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
            />
          </div>
          {error && <div className="col-span-2 text-sm text-red-600">{error}</div>}
        </form>
      </Modal>
    </div>
  )
}
