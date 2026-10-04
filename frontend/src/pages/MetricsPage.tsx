import { ArrowLeft } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useOperation } from '../context/OperationContext'
import { ALL_NEIGHBORHOODS, computeMetrics, listNeighborhoods } from '../domain/metrics'

const formatNumber = (value: number, digits = 1) => value.toFixed(digits).replace('.', ',')

export function MetricsPage() {
  const { orders, drivers, deliveredAt, pizzaria } = useOperation()
  const [neighborhood, setNeighborhood] = useState(ALL_NEIGHBORHOODS)

  const orderList = useMemo(() => Object.values(orders), [orders])
  const neighborhoods = useMemo(() => listNeighborhoods(orderList), [orderList])
  const metrics = useMemo(
    () => computeMetrics(orderList, Object.values(drivers), deliveredAt, neighborhood),
    [orderList, drivers, deliveredAt, neighborhood],
  )

  if (!pizzaria) {
    return <p role="status" className="p-8 text-center text-stone-600">Carregando…</p>
  }

  const maxCount = Math.max(1, ...metrics.byDriver.map((d) => d.count))

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Métricas</h1>
          <p className="text-stone-600">
            <Link to="/despacho" className="inline-flex items-center gap-1 underline">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Painel de despacho
            </Link>
          </p>
        </div>
        <div>
          <label htmlFor="neighborhood" className="block text-sm font-medium text-stone-700">Bairro</label>
          <select
            id="neighborhood"
            value={neighborhood}
            onChange={(event) => setNeighborhood(event.target.value)}
            className="mt-1 rounded-lg border border-stone-300 bg-white px-3 py-2"
          >
            <option value={ALL_NEIGHBORHOODS}>Todos os bairros</option>
            {neighborhoods.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </header>

      {metrics.deliveredCount === 0 ? (
        <p className="rounded-xl bg-white p-8 text-center text-stone-600 ring-1 ring-stone-200">
          Ainda não há entregas concluídas{neighborhood ? ` em ${neighborhood}` : ''}. Os números aparecem aqui assim que a primeira for entregue.
        </p>
      ) : (
        <>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Tile label="Entregas concluídas" value={String(metrics.deliveredCount)} />
            <Tile
              label="Tempo médio porta a porta"
              value={metrics.averageMinutes === null ? '—' : `${formatNumber(metrics.averageMinutes)} min`}
              hint={`${metrics.measuredCount} medidas nesta sessão`}
            />
            <Tile
              label="Entregas no prazo"
              value={metrics.onTimePercent === null ? '—' : `${Math.round(metrics.onTimePercent)}%`}
              hint="dentro do tempo prometido"
            />
            <Tile
              label="Nota média"
              value={metrics.averageRating === null ? '—' : `${formatNumber(metrics.averageRating)} / 5`}
              hint={`${metrics.ratingCount} ${metrics.ratingCount === 1 ? 'avaliação' : 'avaliações'}`}
            />
          </dl>

          <section aria-label="Entregas por entregador" className="space-y-3 rounded-xl bg-white p-5 ring-1 ring-stone-200">
            <h2 className="font-semibold">Entregas por entregador</h2>
            <ul className="space-y-3">
              {metrics.byDriver.map((item) => (
                <li key={item.driverId ?? 'none'}>
                  <div className="flex justify-between text-sm font-medium">
                    <span>{item.name}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="mt-1 h-3 rounded bg-stone-100" aria-hidden="true">
                    <div className="h-3 rounded bg-brand-600" style={{ width: `${(item.count / maxCount) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <p className="text-sm text-stone-500">
            Tempo e prazo consideram só entregas concluídas com esta tela aberta (o mock não informa o horário de entrega). Ao recarregar, essa medição recomeça.
          </p>
        </>
      )}
    </div>
  )
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-white p-5 ring-1 ring-stone-200">
      <dt className="text-sm font-medium text-stone-600">{label}</dt>
      <dd className="mt-1 text-3xl font-bold">{value}</dd>
      {hint && <p className="text-xs text-stone-500">{hint}</p>}
    </div>
  )
}
