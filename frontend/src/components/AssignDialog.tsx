import { Bike, Lightbulb } from 'lucide-react'
import { useEffect } from 'react'
import type { DriverOption } from '../domain/dispatch'
import type { Driver, Order } from '../types'

interface AssignDialogProps {
  order: Order
  options: DriverOption[]
  onSelect: (driver: Driver) => void
  onClose: () => void
}

export function AssignDialog({ order, options, onSelect, onClose }: AssignDialogProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const suggested = options[0]?.sameAreaOrders.length ? options[0] : null

  return (
    <div className="fixed inset-0 z-10 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-title"
        className="w-full max-w-md space-y-4 rounded-xl bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <h2 id="assign-title" className="text-lg font-bold">
            Despachar {order.reference}
          </h2>
          <p className="text-sm text-stone-600">
            {order.customer.name} · {order.address.neighborhood}
          </p>
        </header>

        {suggested && (
          <p className="flex items-start gap-2 rounded-md bg-sky-100 p-3 text-sm text-sky-900">
            <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
            <strong>{suggested.driver.name}</strong> já leva {suggested.sameAreaOrders.length}{' '}
            {suggested.sameAreaOrders.length === 1 ? 'pedido' : 'pedidos'} para essa região. Agrupar economiza uma viagem.
                        </span>
                      </p>
        )}

        <ul className="space-y-2">
          {options.map(({ driver, activeOrders, sameAreaOrders }, index) => (
            <li key={driver.id}>
              <button
                type="button"
                autoFocus={index === 0}
                onClick={() => onSelect(driver)}
                className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left ring-1 ring-stone-300 transition hover:bg-brand-50 hover:ring-brand-500 focus-visible:outline-2 focus-visible:outline-brand-600"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <Bike className="size-4 text-slate-500" aria-hidden="true" />
                  {driver.name}
                  {sameAreaOrders.length > 0 && (
                    <span className="ml-2 rounded bg-sky-100 px-1.5 py-0.5 text-xs font-medium text-sky-900">mesma região</span>
                  )}
                </span>
                <span className="text-sm text-stone-600">
                  {activeOrders.length === 0 ? 'Livre' : `${activeOrders.length} em rota`}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <button type="button" onClick={onClose} className="w-full rounded-md px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">
          Cancelar
        </button>
      </div>
    </div>
  )
}
