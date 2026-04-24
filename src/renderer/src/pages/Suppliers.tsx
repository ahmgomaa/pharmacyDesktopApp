import { FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import type { CreateSupplierInput, Supplier } from '@shared/types'

interface FormState extends CreateSupplierInput {
  id?: number
}

const emptyForm: FormState = {
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: ''
}

export default function Suppliers(): JSX.Element {
  const { t } = useTranslation()
  const [items, setItems] = useState<Supplier[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)

  const load = async (): Promise<void> => {
    setItems(await window.api.suppliers.list())
  }

  useEffect(() => {
    load().catch((e: Error) => setError(e.message))
  }, [])

  const openNew = (): void => {
    setForm(emptyForm)
    setError(null)
    setOpen(true)
  }

  const openEdit = (s: Supplier): void => {
    setForm({
      id: s.id,
      name: s.name,
      phone: s.phone,
      email: s.email,
      address: s.address,
      notes: s.notes
    })
    setError(null)
    setOpen(true)
  }

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        notes: form.notes || null
      }
      if (form.id) {
        await window.api.suppliers.update({ id: form.id, ...payload })
      } else {
        await window.api.suppliers.create(payload)
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
      await window.api.suppliers.remove(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div>
      <PageHeader
        title={t('suppliers.title')}
        actions={
          <button className="btn-primary" onClick={openNew}>
            {t('suppliers.addNew')}
          </button>
        }
      />
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              <th>{t('suppliers.name')}</th>
              <th>{t('suppliers.phone')}</th>
              <th>{t('suppliers.email')}</th>
              <th>{t('suppliers.address')}</th>
              <th className="text-right">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">
                  {t('common.noData')}
                </td>
              </tr>
            )}
            {items.map((s) => (
              <tr key={s.id}>
                <td className="font-medium">{s.name}</td>
                <td>{s.phone ?? '—'}</td>
                <td>{s.email ?? '—'}</td>
                <td className="max-w-xs truncate">{s.address ?? '—'}</td>
                <td className="text-right">
                  <button className="btn-secondary mr-2" onClick={() => openEdit(s)}>
                    {t('common.edit')}
                  </button>
                  <button className="btn-danger" onClick={() => remove(s.id)}>
                    {t('common.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        title={form.id ? t('suppliers.edit') : t('suppliers.addNew')}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </button>
            <button className="btn-primary" form="supplier-form" type="submit">
              {t('common.save')}
            </button>
          </>
        }
      >
        <form id="supplier-form" onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">{t('suppliers.name')}</label>
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t('suppliers.phone')}</label>
            <input
              className="input"
              value={form.phone ?? ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t('suppliers.email')}</label>
            <input
              className="input"
              type="email"
              value={form.email ?? ''}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t('suppliers.address')}</label>
            <input
              className="input"
              value={form.address ?? ''}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t('suppliers.notes')}</label>
            <textarea
              className="input"
              rows={3}
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
        </form>
      </Modal>
    </div>
  )
}
