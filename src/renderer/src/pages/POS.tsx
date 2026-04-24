import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import type { CartItem, Customer, Medicine, SaleDetail } from '@shared/types'

export default function POS(): JSX.Element {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Medicine[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [discount, setDiscount] = useState('0')
  const [paid, setPaid] = useState('0')
  const [error, setError] = useState<string | null>(null)
  const [lastSale, setLastSale] = useState<SaleDetail | null>(null)

  useEffect(() => {
    window.api.customers
      .list()
      .then(setCustomers)
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    let cancelled = false
    const query = search.trim()
    if (!query) {
      setResults([])
      return
    }
    window.api.medicines.search(query).then((r) => {
      if (!cancelled) setResults(r)
    })
    return (): void => {
      cancelled = true
    }
  }, [search])

  const subtotal = useMemo(() => cart.reduce((sum, c) => sum + c.unitPrice * c.quantity, 0), [cart])
  const grandTotal = Math.max(0, subtotal - (Number(discount) || 0))
  const change = Math.max(0, (Number(paid) || 0) - grandTotal)

  const addToCart = (m: Medicine): void => {
    setError(null)
    setCart((prev) => {
      const existing = prev.find((c) => c.medicineId === m.id)
      if (existing) {
        if (existing.quantity + 1 > m.stock) {
          setError(t('pos.notEnoughStock'))
          return prev
        }
        return prev.map((c) => (c.medicineId === m.id ? { ...c, quantity: c.quantity + 1 } : c))
      }
      if (m.stock < 1) {
        setError(t('pos.notEnoughStock'))
        return prev
      }
      return [
        ...prev,
        {
          medicineId: m.id,
          medicineName: m.name,
          unitPrice: m.price,
          quantity: 1,
          availableStock: m.stock
        }
      ]
    })
    setSearch('')
    setResults([])
  }

  const handleScan = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    const query = search.trim()
    if (!query) return
    try {
      const byBarcode = await window.api.medicines.getByBarcode(query)
      if (byBarcode) {
        addToCart(byBarcode)
      } else if (results.length === 1) {
        addToCart(results[0])
      }
    } catch {
      // ignore
    }
  }

  const updateQty = (medicineId: number, qty: number): void => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.medicineId !== medicineId) return c
          const clamped = Math.max(1, Math.min(c.availableStock, qty))
          return { ...c, quantity: clamped }
        })
        .filter((c) => c.quantity > 0)
    )
  }

  const remove = (medicineId: number): void => {
    setCart((prev) => prev.filter((c) => c.medicineId !== medicineId))
  }

  const complete = async (): Promise<void> => {
    setError(null)
    try {
      const sale = await window.api.sales.create({
        customerId,
        discount: Number(discount) || 0,
        paid: Number(paid) || 0,
        items: cart.map((c) => ({
          medicineId: c.medicineId,
          quantity: c.quantity,
          unitPrice: c.unitPrice
        }))
      })
      setLastSale(sale)
      setCart([])
      setCustomerId(null)
      setDiscount('0')
      setPaid('0')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div>
      <PageHeader title={t('pos.title')} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="card lg:col-span-3">
          <form onSubmit={handleScan} className="mb-3">
            <input
              className="input"
              placeholder={t('pos.scanOrSearch')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </form>
          {results.length > 0 && (
            <div className="mb-3 max-h-56 overflow-auto rounded border border-slate-200">
              {results.map((m) => (
                <button
                  key={m.id}
                  className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-50"
                  onClick={() => addToCart(m)}
                >
                  <span className="font-medium">{m.name}</span>
                  <span className="text-sm text-slate-500">
                    {m.stock} @ {m.price.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          )}
          <h3 className="mb-2 text-sm font-semibold text-slate-700">{t('pos.cart')}</h3>
          {cart.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-400">{t('pos.emptyCart')}</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t('medicines.name')}</th>
                  <th>{t('pos.quantity')}</th>
                  <th>{t('pos.unitPrice')}</th>
                  <th>{t('pos.lineTotal')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((c) => (
                  <tr key={c.medicineId}>
                    <td>{c.medicineName}</td>
                    <td className="w-24">
                      <input
                        className="input py-1"
                        type="number"
                        min={1}
                        max={c.availableStock}
                        value={c.quantity}
                        onChange={(e) => updateQty(c.medicineId, Number(e.target.value) || 1)}
                      />
                    </td>
                    <td>{c.unitPrice.toFixed(2)}</td>
                    <td>{(c.unitPrice * c.quantity).toFixed(2)}</td>
                    <td>
                      <button className="btn-secondary" onClick={() => remove(c.medicineId)}>
                        {t('pos.remove')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card lg:col-span-2 space-y-3">
          <div>
            <label className="label">{t('pos.customer')}</label>
            <select
              className="input"
              value={customerId ?? ''}
              onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">{t('pos.walkIn')}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-between text-sm">
            <span>{t('pos.subtotal')}</span>
            <span>{subtotal.toFixed(2)}</span>
          </div>
          <div>
            <label className="label">{t('pos.discount')}</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>{t('pos.grandTotal')}</span>
            <span>{grandTotal.toFixed(2)}</span>
          </div>
          <div>
            <label className="label">{t('pos.paid')}</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={paid}
              onChange={(e) => setPaid(e.target.value)}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span>{t('pos.change')}</span>
            <span>{change.toFixed(2)}</span>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button className="btn-primary w-full" disabled={cart.length === 0} onClick={complete}>
            {t('pos.complete')}
          </button>
        </div>
      </div>

      <Modal
        open={!!lastSale}
        title={t('pos.receipt', { id: lastSale?.id ?? '' })}
        onClose={() => setLastSale(null)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => window.print()}>
              {t('pos.print')}
            </button>
            <button className="btn-primary" onClick={() => setLastSale(null)}>
              {t('common.close')}
            </button>
          </>
        }
      >
        {lastSale && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">{t('sales.date')}</span>
              <span>{new Date(lastSale.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('sales.cashier')}</span>
              <span>{lastSale.userName}</span>
            </div>
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
                {lastSale.items.map((it) => (
                  <tr key={it.medicineId}>
                    <td>{it.medicineName}</td>
                    <td>{it.quantity}</td>
                    <td>{it.unitPrice.toFixed(2)}</td>
                    <td>{it.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>{t('pos.grandTotal')}</span>
              <span>{lastSale.total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
