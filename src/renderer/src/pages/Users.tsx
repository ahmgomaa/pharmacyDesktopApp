import { FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import type { CreateUserInput, User, UserRole } from '@shared/types'

interface FormState {
  id?: number
  username: string
  fullName: string
  password: string
  role: UserRole
  active: boolean
}

const emptyForm: FormState = {
  username: '',
  fullName: '',
  password: '',
  role: 'cashier',
  active: true
}

export default function Users(): JSX.Element {
  const { t } = useTranslation()
  const [items, setItems] = useState<User[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)

  const load = async (): Promise<void> => {
    setItems(await window.api.users.list())
  }

  useEffect(() => {
    load().catch((e: Error) => setError(e.message))
  }, [])

  const openNew = (): void => {
    setForm(emptyForm)
    setError(null)
    setOpen(true)
  }

  const openEdit = (u: User): void => {
    setForm({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      password: '',
      role: u.role,
      active: u.active === 1
    })
    setError(null)
    setOpen(true)
  }

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)
    try {
      if (form.id) {
        await window.api.users.update({
          id: form.id,
          fullName: form.fullName,
          password: form.password || undefined,
          role: form.role,
          active: form.active
        })
      } else {
        const payload: CreateUserInput = {
          username: form.username.trim(),
          fullName: form.fullName.trim(),
          password: form.password,
          role: form.role,
          active: form.active
        }
        await window.api.users.create(payload)
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
      await window.api.users.remove(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div>
      <PageHeader
        title={t('users.title')}
        actions={
          <button className="btn-primary" onClick={openNew}>
            {t('users.addNew')}
          </button>
        }
      />
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              <th>{t('users.username')}</th>
              <th>{t('users.fullName')}</th>
              <th>{t('users.role')}</th>
              <th>{t('users.active')}</th>
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
            {items.map((u) => (
              <tr key={u.id}>
                <td className="font-medium">{u.username}</td>
                <td>{u.fullName}</td>
                <td>{u.role === 'admin' ? t('users.admin') : t('users.cashier')}</td>
                <td>{u.active ? '✓' : '—'}</td>
                <td className="text-right">
                  <button className="btn-secondary mr-2" onClick={() => openEdit(u)}>
                    {t('common.edit')}
                  </button>
                  <button className="btn-danger" onClick={() => remove(u.id)}>
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
        title={form.id ? t('users.edit') : t('users.addNew')}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </button>
            <button className="btn-primary" form="user-form" type="submit">
              {t('common.save')}
            </button>
          </>
        }
      >
        <form id="user-form" onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">{t('users.username')}</label>
            <input
              className="input"
              required
              disabled={!!form.id}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t('users.fullName')}</label>
            <input
              className="input"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t('users.password')}</label>
            <input
              className="input"
              type="password"
              required={!form.id}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {form.id && (
              <div className="mt-1 text-xs text-slate-500">{t('users.passwordLeaveBlank')}</div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('users.role')}</label>
              <select
                className="input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              >
                <option value="admin">{t('users.admin')}</option>
                <option value="cashier">{t('users.cashier')}</option>
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                {t('users.active')}
              </label>
            </div>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
        </form>
      </Modal>
    </div>
  )
}
