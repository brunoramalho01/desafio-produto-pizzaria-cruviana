import { Check, Circle, Pizza, Star } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FeedbackForm } from '../components/FeedbackForm'
import { TrackingMap } from '../components/TrackingMap'
import { useOperation } from '../context/OperationContext'
import { etaMinutes, formatEta } from '../domain/eta'
import { STAGE_LABELS } from '../domain/stages'
import type { Stage } from '../types'

const TIMELINE: Stage[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_DELIVERY', 'DELIVERED']

export function TrackingPage() {
  const { id } = useParams()
  const { orders, drivers, pizzaria } = useOperation()

  const order = orders[Number(id)]
  const driver = order?.driverId == null ? undefined : drivers[order.driverId]
  const currentIndex = order ? TIMELINE.indexOf(order.stage) : -1

  const eta = useMemo(
    () => (order && driver ? etaMinutes(driver, order.address) : null),
    [order, driver],
  )

  if (!pizzaria) {
    return <p role="status" className="p-8 text-center text-stone-600">Carregando…</p>
  }
  if (!order) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-stone-700">Não encontramos o pedido {id}.</p>
        <Link to="/pedido" className="font-semibold text-brand-700 underline">Buscar outro pedido</Link>
      </div>
    )
  }

  const firstName = order.customer.name.split(' ')[0]
  const onTheWay = order.stage === 'OUT_DELIVERY'

  return (
    <div className="mx-auto max-w-md space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Olá, {firstName}!</h1>
        <p className="text-stone-600">Pedido {order.reference} · {STAGE_LABELS[order.stage]}</p>
      </header>

      {onTheWay && (
        <section aria-label="Entrega em andamento" className="space-y-3">
          <p className="rounded-xl bg-emerald-50 p-4 text-lg font-semibold text-emerald-900 ring-1 ring-emerald-200">
            {eta === null ? 'Seu pedido está a caminho.' : `Chega em ${formatEta(eta)}`}
          </p>
          {driver && (
            <TrackingMap pizzaria={pizzaria} destination={order.address} driver={driver} />
          )}
        </section>
      )}

      {order.stage !== 'CANCELED' && (
        <ol aria-label="Etapas do pedido" className="space-y-3">
          {TIMELINE.map((stage, index) => {
            const done = index < currentIndex
            const current = index === currentIndex
            return (
              <li
                key={stage}
                aria-current={current ? 'step' : undefined}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
                  current ? 'bg-brand-50 font-bold text-brand-800 ring-2 ring-brand-500' : done ? 'text-stone-700' : 'text-stone-500'
                }`}
              >
                {done || (current && stage === 'DELIVERED') ? (
                  <Check className="size-5 text-emerald-600" aria-hidden="true" />
                ) : current ? (
                  <Pizza className="size-5 text-brand-600" aria-hidden="true" />
                ) : (
                  <Circle className="size-5" aria-hidden="true" />
                )}
                {STAGE_LABELS[stage]}
                {done && <span className="sr-only"> (concluído)</span>}
              </li>
            )
          })}
        </ol>
      )}

      {order.stage === 'CANCELED' && (
        <p className="rounded-xl bg-red-50 p-4 font-semibold text-red-800">Este pedido foi cancelado.</p>
      )}

      {order.stage === 'DELIVERED' &&
        (order.feedback ? (
          <p role="status" className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 p-4 text-center font-semibold text-emerald-900">
            Obrigado pela avaliação!
            <span className="inline-flex" aria-label={`${order.feedback.rating} de 5 estrelas`}>
              {Array.from({ length: order.feedback.rating }, (_, index) => (
                <Star key={index} className="size-4 fill-amber-400 text-amber-500" aria-hidden="true" />
              ))}
            </span>
          </p>
        ) : (
          <FeedbackForm orderId={order.id} />
        ))}
    </div>
  )
}
