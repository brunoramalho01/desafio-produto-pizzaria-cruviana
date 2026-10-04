import { CircleCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { Notice } from '../components/Notice'
import { useOperation } from '../context/OperationContext'
import { formatDistance, planRoute } from '../domain/route'
import { useNotice } from '../hooks/useNotice'

export function DriverDeliveriesPage() {
  const { id } = useParams()
  const { drivers, orders, pizzaria } = useOperation()
  const { notice, show } = useNotice()
  const [deliveringId, setDeliveringId] = useState<number | null>(null)

  const driver = drivers[Number(id)]
  const route = useMemo(() => {
    if (!pizzaria || !driver) return []
    const mine = Object.values(orders).filter((order) => order.driverId === driver.id && order.stage === 'OUT_DELIVERY')
    return planRoute(pizzaria, mine)
  }, [orders, pizzaria, driver])

  if (!pizzaria) {
    return <p role="status" className="p-8 text-center text-stone-600">Carregando…</p>
  }
  if (!driver) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-stone-700">Entregador não encontrado.</p>
        <Link to="/entregador" className="font-semibold text-brand-700 underline">Escolher outro entregador</Link>
      </div>
    )
  }

  async function handleDelivered(orderId: number, reference: string) {
    setDeliveringId(orderId)
    try {
      await api.updateOrder(orderId, { stage: 'DELIVERED' })
      show({ type: 'success', text: `${reference} entregue. Bom trabalho!` })
    } catch (error) {
      show({ type: 'error', text: error instanceof ApiError ? error.message : 'Não foi possível registrar a entrega.' })
    } finally {
      setDeliveringId(null)
    }
  }

  const [current, ...next] = route

  return (
    <div className="mx-auto max-w-md space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Olá, {driver.name}</h1>
          <p className="text-stone-600">
            {route.length === 0 ? 'Nenhuma entrega agora' : `${route.length} ${route.length === 1 ? 'entrega' : 'entregas'} na rota`}
          </p>
        </div>
        <Link to="/entregador" className="text-sm font-medium text-stone-600 underline">Trocar</Link>
      </header>

      {!current && (
        <p className="flex items-center justify-center gap-2 rounded-xl bg-white p-8 text-center text-stone-600 ring-1 ring-stone-200">
          <CircleCheck className="size-6 shrink-0 text-emerald-600" aria-hidden="true" />
          Tudo entregue por aqui. Novas entregas aparecem automaticamente.
        </p>
      )}

      {current && (
        <section aria-label="Próxima parada" className="space-y-4 rounded-2xl bg-white p-5 shadow-md ring-2 ring-brand-600">
          <p className="text-sm font-bold uppercase tracking-wide text-brand-700">Próxima parada · {formatDistance(current.legMeters)}</p>
          <div>
            <p className="text-xl font-bold">{current.order.reference} · {current.order.customer.name}</p>
            <p className="text-lg">
              {current.order.address.street}, {current.order.address.number}
            </p>
            <p className="text-stone-600">{current.order.address.neighborhood}</p>
          </div>
          <ul className="text-sm text-stone-700">
            {current.order.items.map((item) => (
              <li key={item.name}>{item.quantity}× {item.name}</li>
            ))}
          </ul>
          <button
            type="button"
            disabled={deliveringId === current.order.id}
            onClick={() => handleDelivered(current.order.id, current.order.reference)}
            className="w-full rounded-xl bg-emerald-700 px-4 py-5 text-xl font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:opacity-60"
          >
            {deliveringId === current.order.id ? 'Registrando…' : 'Entreguei'}
          </button>
        </section>
      )}

      {next.length > 0 && (
        <section aria-label="Paradas seguintes" className="space-y-2">
          <h2 className="font-semibold text-stone-700">Depois</h2>
          <ol className="space-y-2">
            {next.map(({ order, legMeters }, index) => (
              <li key={order.id} className="flex items-center justify-between rounded-xl bg-white p-4 ring-1 ring-stone-200">
                <span>
                  <span className="mr-2 font-bold text-stone-500">{index + 2}.</span>
                  <span className="font-semibold">{order.reference}</span> · {order.address.street}, {order.address.number}
                </span>
                <span className="text-sm text-stone-600">{formatDistance(legMeters)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
      <Notice notice={notice} />
    </div>
  )
}
