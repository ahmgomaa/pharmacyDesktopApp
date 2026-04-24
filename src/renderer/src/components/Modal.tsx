import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  widthClass?: string
}

export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  widthClass = 'max-w-lg'
}: Props): JSX.Element | null {
  const { t } = useTranslation()
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className={`w-full ${widthClass} rounded-lg bg-white shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button
            className="text-slate-500 hover:text-slate-900"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">{footer}</div>
        ) : null}
      </div>
    </div>
  )
}
