import { ReactNode } from 'react'

interface Props {
  title: string
  actions?: ReactNode
}

export default function PageHeader({ title, actions }: Props): JSX.Element {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </div>
  )
}
