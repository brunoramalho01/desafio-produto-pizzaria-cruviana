import { ChevronRight, Bike } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useOperation } from '../context/OperationContext'

export function DriverSelectPage() {
  const { drivers, orders, connection } = useOperation()
  const list = Object.values(drivers)

  if (list.length === 0) {
    return (
      <p role="status" className="rounded-xl bg-white p-8 text-center text-stone-600 ring-1 ring-stone-200">
        {connection === 'offline' ? 'Sem conexão com o servidor.' : 'Carregando entregadores…'}
      </p>
    )
  }

  const stopsOf = (driverId: number) =>
    Object.values(orders).filter((order) => order.driverId === driverId && order.stage === 'OUT_DELIVERY').length

  return (
    <div className="mx-auto max-w-md space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Quem é você?</h1>
        <p className="text-stone-600">Escolha o seu nome para ver suas entregas.</p>
      </header>
      <ul className="space-y-3">
        {list.map((driver) => {
          const stops = stopsOf(driver.id)
          return (
            <li key={driver.id}>
              <Link
                to={`/entregador/${driver.id}`}
                className="flex items-center justify-between rounded-xl bg-white p-5 text-lg font-semibold shadow-sm ring-1 ring-stone-300 focus-visible:outline-2 focus-visible:outline-brand-600"
              >
                <span className="flex items-center gap-3">
                  <Bike className="size-5 text-brand-600" aria-hidden="true" />
                  {driver.name}
                </span>
                <span className="flex items-center gap-1 text-sm font-medium text-stone-600">
                  {stops === 0 ? 'Sem entregas' : `${stops} ${stops === 1 ? 'entrega' : 'entregas'}`}
                  <ChevronRight className="size-4" aria-hidden="true" />
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
