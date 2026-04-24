import { FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import type { CreateCustomerInput, Customer } from '@shared/types'

interface FormState extends CreateCustomerInput {
  id?: number
}

const emptyForm: FormState = { name: '', phone: '', email: '', notes: '' }

export default function Customers(): JSX.Element {
  const { t } = useTranslation()
  const [items, setItems] = useState<Customer[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)

  const load = async (): Promise<void> => {
    setItems(await window.api.customers.list())
  }

  useEffect(() => {
    load().catch((e: Error) => setError(e.message))
  }, [])

  const openNew = (): void => {
    setForm(emptyForm)
    setError(null)
    setOpen(true)
  }

  const openEdit = (c: Customer): void => {
    setForm({ id: c.id, name: c.name, phone: c.phone, email: c.email, notes: c.notes })
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
        notes: form.notes || null
      }
      if (form.id) {
        await window.api.customers.update({ id: form.id, ...payload })
      } else {
        await window.api.customers.create(payload)
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
      await window.api.customers.remove(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div>
      <PageHeader
        title={t('customers.title')}
        actions={
          <button className="btn-primary" onClick={openNew}>
            {t('customers.addNew')}
          </button>
        }
      />
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              <th>{t('customers.name')}</th>
              <th>{t('customers.phone')}</th>
              <th>{t('customers.email')}</th>
              <th>{t('customers.notes')}</th>
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
            {items.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.name}</td>
                <td>{c.phone ?? '—'}</td>
                <td>{c.email ?? '—'}</td>
                <td className="max-w-xs truncate">{c.notes ?? '—'}</td>
                <td className="text-right">
                  <button className="btn-secondary mr-2" onClick={() => openEdit(c)}>
                    {t('common.edit')}
                  </button>
                  <button className="btn-danger" onClick={() => remove(c.id)}>
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
        title={form.id ? t('customers.edit') : t('customers.addNew')}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </button>
            <button className="btn-primary" form="customer-form" type="submit">
              {t('common.save')}
            </button>
          </>
        }
      >
        <form id="customer-form" onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">{t('customers.name')}</label>
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t('customers.phone')}</label>
            <input
              className="input"
              value={form.phone ?? ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t('customers.email')}</label>
            <input
              className="input"
              type="email"
              value={form.email ?? ''}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t('customers.notes')}</label>
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
