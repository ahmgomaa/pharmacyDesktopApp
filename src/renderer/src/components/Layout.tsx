import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'

export default function Layout(): JSX.Element {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const isAdmin = user?.role === 'admin'

  const items: Array<{ to: string; label: string; adminOnly?: boolean }> = [
    { to: '/', label: t('nav.dashboard') },
    { to: '/pos', label: t('nav.pos') },
    { to: '/medicines', label: t('nav.medicines') },
    { to: '/sales', label: t('nav.sales') },
    { to: '/customers', label: t('nav.customers') },
    { to: '/suppliers', label: t('nav.suppliers') },
    { to: '/purchases', label: t('nav.purchases') },
    { to: '/reports', label: t('nav.reports') },
    { to: '/users', label: t('nav.users'), adminOnly: true }
  ]

  const handleLogout = async (): Promise<void> => {
    await logout()
    navigate('/login')
  }

  const toggleLang = (): void => {
    i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')
  }

  return (
    <div className="flex h-full min-h-screen">
      <aside className="flex w-56 flex-col bg-slate-900 text-slate-100">
        <div className="border-b border-slate-800 px-4 py-5">
          <div className="text-lg font-semibold">{t('app.name')}</div>
          <div className="text-xs text-slate-400">{t('app.tagline')}</div>
        </div>
        <nav className="flex-1 space-y-1 px-2 py-4">
          {items
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
        </nav>
        <div className="space-y-2 border-t border-slate-800 px-3 py-3 text-sm">
          <div className="truncate text-slate-300">
            {user?.fullName} ({user?.role})
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary flex-1" onClick={toggleLang}>
              {i18n.language === 'ar' ? t('common.english') : t('common.arabic')}
            </button>
            <button className="btn-danger" onClick={handleLogout}>
              {t('common.logout')}
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-slate-50 p-6">
        <Outlet />
      </main>
    </div>
  )
}
