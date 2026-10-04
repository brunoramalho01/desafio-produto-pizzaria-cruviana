import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { AssignDialog } from '../components/AssignDialog'
import { Notice } from '../components/Notice'
import { OrderCard } from '../components/OrderCard'
import { useOperation } from '../context/OperationContext'
import { getDriverOptions } from '../domain/dispatch'
import { groupNearbyOrders } from '../domain/grouping'
import { getSlaLevel } from '../domain/sla'
import { BOARD_STAGES, isActiveStage, STAGE_LABELS } from '../domain/stages'
import { useNotice } from '../hooks/useNotice'
import { useNow } from '../hooks/useNow'
import type { Driver, Order, Stage } from '../types'

const DELIVERED_VISIBLE = 5

export function DispatchPage() {
  const { orders, drivers, pizzaria, connection } = useOperation()
  const now = useNow()
  const { notice, show } = useNotice()
  const [selected, setSelected] = useState<Order | null>(null)
  const [dispatchingId, setDispatchingId] = useState<number | null>(null)

  const allOrders = useMemo(() => Object.values(orders), [orders])
  const driverList = useMemo(() => Object.values(drivers), [drivers])

  const byStage = useMemo(() => {
    const grouped = Object.fromEntries(BOARD_STAGES.map((stage) => [stage, [] as Order[]])) as Record<Stage, Order[]>
    for (const order of allOrders) grouped[order.stage]?.push(order)
    for (const stage of BOARD_STAGES) {
      grouped[stage].sort((a, b) => (stage === 'DELIVERED' ? b.id - a.id : a.id - b.id))
    }
    return grouped
  }, [allOrders])

  const nearbyReferences = useMemo(() => {
    const map = new Map<number, string[]>()
    for (const group of groupNearbyOrders(allOrders)) {
      for (const order of group) {
        map.set(order.id, group.filter((other) => other.id !== order.id).map((other) => other.reference))
      }
    }
    return map
  }, [allOrders])

  const summary = useMemo(() => {
    const active = allOrders.filter((order) => isActiveStage(order.stage))
    const levels = active.map((order) => getSlaLevel(order, now))
    return {
      active: active.length,
      warning: levels.filter((level) => level === 'warning').length,
      critical: levels.filter((level) => level === 'critical').length,
    }
  }, [allOrders, now])

  async function handleAssign(order: Order, driver: Driver) {
    setSelected(null)
    setDispatchingId(order.id)
    try {
      await api.updateOrder(order.id, { stage: 'OUT_DELIVERY', driverId: driver.id })
      show({ type: 'success', text: `${order.reference} despachado com ${driver.name}.` })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Não foi possível despachar o pedido.'
      show({ type: 'error', text: message })
    } finally {
      setDispatchingId(null)
    }
  }

  if (!pizzaria) {
    return (
      <p role="status" className="rounded-xl bg-white p-8 text-center text-stone-600 ring-1 ring-stone-200">
        {connection === 'online' || connection === 'connecting'
          ? 'Carregando pedidos…'
          : 'Sem conexão com o servidor. Inicie o mock com node mock/server.js.'}
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Painel de despacho</h1>
          <p className="text-stone-600">Todos os pedidos, de qualquer canal, em um só lugar. <Link to="/metricas" className="font-medium text-brand-700 underline">Ver métricas</Link></p>
        </div>
        <dl className="flex gap-3 text-center">
          <SummaryTile label="Ativos" value={summary.active} className="bg-white text-stone-900" />
          <SummaryTile label="Atenção" value={summary.warning} className="bg-amber-100 text-amber-900" />
          <SummaryTile label="Atrasados" value={summary.critical} className="bg-red-100 text-red-800" />
        </dl>
      </header>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {BOARD_STAGES.map((stage) => {
          const stageOrders = stage === 'DELIVERED' ? byStage[stage].slice(0, DELIVERED_VISIBLE) : byStage[stage]
          return (
            <section key={stage} aria-labelledby={`col-${stage}`} className="w-72 shrink-0 space-y-3">
              <h2 id={`col-${stage}`} className="flex items-center justify-between font-semibold text-stone-700">
                {STAGE_LABELS[stage]}
                <span className="rounded-full bg-stone-200 px-2 text-sm">{byStage[stage].length}</span>
              </h2>
              {stageOrders.length === 0 && <p className="text-sm text-stone-500">Nenhum pedido.</p>}
              {stageOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  now={now}
                  driver={order.driverId === null ? undefined : drivers[order.driverId]}
                  nearbyReferences={nearbyReferences.get(order.id) ?? []}
                  dispatching={dispatchingId === order.id}
                  onDispatch={order.stage === 'READY' && order.driverId === null ? setSelected : undefined}
                />
              ))}
              {stage === 'DELIVERED' && byStage[stage].length > DELIVERED_VISIBLE && (
                <p className="text-xs text-stone-500">Mostrando os {DELIVERED_VISIBLE} mais recentes.</p>
              )}
            </section>
          )
        })}
      </div>

      {selected && (
        <AssignDialog
          order={selected}
          options={getDriverOptions(selected, driverList, allOrders)}
          onSelect={(driver) => handleAssign(selected, driver)}
          onClose={() => setSelected(null)}
        />
      )}
      <Notice notice={notice} />
    </div>
  )
}

function SummaryTile({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className={`min-w-20 rounded-lg px-3 py-2 ring-1 ring-stone-200 ${className}`}>
      <dt className="text-xs font-medium">{label}</dt>
      <dd className="text-2xl font-bold">{value}</dd>
    </div>
  )
}
