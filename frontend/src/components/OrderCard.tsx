import { MapPin, Bike } from 'lucide-react'
import type { SlaLevel } from '../domain/sla'
import { elapsedMinutes } from '../domain/time'
import { getSlaLevel } from '../domain/sla'
import type { Driver, Order } from '../types'
import { SlaBadge } from './SlaBadge'

const CARD_STYLES: Record<SlaLevel, string> = {
  none: 'bg-stone-100 ring-stone-200',
  ok: 'bg-white ring-stone-200',
  warning: 'bg-amber-50 ring-2 ring-amber-400',
  critical: 'bg-red-50 ring-2 ring-red-500',
}

interface OrderCardProps {
  order: Order
  now: Date
  driver?: Driver
  /** Referências dos outros pedidos ativos na mesma região (< 150 m). */
  nearbyReferences: string[]
  dispatching: boolean
  onDispatch?: (order: Order) => void
}

export function OrderCard({ order, now, driver, nearbyReferences, dispatching, onDispatch }: OrderCardProps) {
  const level = getSlaLevel(order, now)
  const minutes = elapsedMinutes(order.createdAt, now)
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <article className={`space-y-2 rounded-lg p-3 ring-1 ${CARD_STYLES[level]}`}>
      <header className="flex items-center justify-between gap-2">
        <h3 className="font-bold">{order.reference}</h3>
        <span className="rounded bg-stone-200 px-1.5 py-0.5 text-xs font-medium text-stone-700">{order.channel}</span>
      </header>

      <div className="text-sm">
        <p className="font-medium">{order.customer.name}</p>
        <p className="text-stone-600">
          {order.address.neighborhood} · {itemCount} {itemCount === 1 ? 'pizza' : 'pizzas'}
        </p>
      </div>

      <SlaBadge level={level} minutes={minutes} promised={order.promisedMinutes} />

      {nearbyReferences.length > 0 && (
        <p className="flex items-start gap-1.5 rounded bg-sky-100 px-2 py-1 text-xs font-medium text-sky-900">
          <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>Mesma região de {nearbyReferences.join(', ')} — considere o mesmo entregador</span>
        </p>
      )}

      {driver && (
        <p className="flex items-center gap-1.5 text-sm text-stone-700">
          <Bike className="size-4 text-slate-500" aria-hidden="true" />
          {driver.name}
        </p>
      )}

      {onDispatch && (
        <button
          type="button"
          disabled={dispatching}
          onClick={() => onDispatch(order)}
          className="w-full rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-wait disabled:opacity-60"
        >
          {dispatching ? 'Despachando…' : 'Despachar'}
        </button>
      )}
    </article>
  )
}
