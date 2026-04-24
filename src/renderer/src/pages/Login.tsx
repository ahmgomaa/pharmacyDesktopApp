import { FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login(): JSX.Element {
  const { t, i18n } = useTranslation()
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  const onSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(username, password)
      navigate('/')
    } catch {
      setError(t('login.invalid'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow"
      >
        <div className="text-center">
          <h1 className="text-xl font-semibold">{t('app.name')}</h1>
          <p className="text-sm text-slate-500">{t('login.title')}</p>
        </div>
        <div>
          <label className="label">{t('login.username')}</label>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div>
          <label className="label">{t('login.password')}</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {t('login.submit')}
        </button>
        <div className="text-center text-xs text-slate-400">{t('login.defaultHint')}</div>
        <div className="flex justify-center">
          <button
            type="button"
            className="text-xs text-slate-500 underline"
            onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}
          >
            {i18n.language === 'ar' ? t('common.english') : t('common.arabic')}
          </button>
        </div>
      </form>
    </div>
  )
}
