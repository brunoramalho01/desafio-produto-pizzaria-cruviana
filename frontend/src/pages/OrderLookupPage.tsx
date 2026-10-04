import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useOperation } from '../context/OperationContext'
import { STAGE_LABELS } from '../domain/stages'

const SAMPLE_COUNT = 4

export function OrderLookupPage() {
  const { orders } = useOperation()
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Atalhos de demonstração: pedidos a caminho primeiro.
  const samples = Object.values(orders)
    .filter((order) => order.stage === 'OUT_DELIVERY' || order.stage === 'DELIVERED')
    .sort((a, b) => Number(b.stage === 'OUT_DELIVERY') - Number(a.stage === 'OUT_DELIVERY') || b.id - a.id)
    .slice(0, SAMPLE_COUNT)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const number = Number(value.replace(/\D/g, ''))
    if (!number || !orders[number]) {
      setError('Não encontramos esse pedido. Confira o número e tente de novo.')
      return
    }
    navigate(`/pedido/${number}`)
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Acompanhar pedido</h1>
        <p className="text-stone-600">Digite o número do seu pedido.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <label htmlFor="order-number" className="block text-sm font-medium text-stone-700">Número do pedido</label>
        <input
          id="order-number"
          inputMode="numeric"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Ex.: 0070"
          aria-describedby={error ? 'order-error' : undefined}
          className="w-full rounded-lg border border-stone-300 p-3 text-lg"
        />
        {error && <p id="order-error" role="alert" className="text-sm font-medium text-red-700">{error}</p>}
        <button type="submit" className="w-full rounded-xl bg-brand-600 px-4 py-3 text-lg font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700">
          Acompanhar
        </button>
      </form>

      {samples.length > 0 && (
        <section aria-label="Pedidos de exemplo" className="space-y-2">
          <h2 className="text-sm font-semibold text-stone-600">Pedidos de exemplo (demonstração)</h2>
          <ul className="space-y-2">
            {samples.map((order) => (
              <li key={order.id}>
                <Link to={`/pedido/${order.id}`} className="flex justify-between rounded-lg bg-white px-4 py-3 ring-1 ring-stone-200 focus-visible:outline-2 focus-visible:outline-brand-600">
                  <span className="font-semibold">{order.reference}</span>
                  <span className="text-stone-600">{STAGE_LABELS[order.stage]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
