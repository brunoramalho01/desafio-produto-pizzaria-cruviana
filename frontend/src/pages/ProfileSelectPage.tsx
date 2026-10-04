import { Bike, ChefHat, ChevronRight, MapPin, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useOperation } from '../context/OperationContext'

const PROFILES: { to: string; icon: LucideIcon; title: string; description: string }[] = [
  { to: '/despacho', icon: ChefHat, title: 'Téo · Despacho', description: 'Pedidos, SLA e atribuição de entregadores' },
  { to: '/entregador', icon: Bike, title: 'Entregador', description: 'Minhas entregas na ordem da rota' },
  { to: '/pedido', icon: MapPin, title: 'Cliente', description: 'Acompanhar meu pedido e avaliar' },
]

export function ProfileSelectPage() {
  const { orders, drivers, connection } = useOperation()

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold">Quem é você?</h1>
        <p className="mt-1 text-stone-600">Escolha o seu perfil para começar.</p>
      </section>

      <ul className="grid gap-4 sm:grid-cols-3">
        {PROFILES.map(({ to, icon: Icon, title, description }) => (
          <li key={to}>
            <Link
              to={to}
              className="group flex h-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 transition hover:border-brand-500"
            >
              <span className="flex size-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <span className="flex items-center justify-between text-lg font-semibold">
                {title}
                <ChevronRight className="size-5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600" aria-hidden="true" />
              </span>
              <span className="text-sm text-slate-600">{description}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section aria-label="Diagnóstico da conexão" className="rounded-xl bg-white p-5 ring-1 ring-stone-200">
        <h2 className="font-semibold">Diagnóstico</h2>
        <dl className="mt-3 grid grid-cols-3 gap-4 text-center">
          <div>
            <dt className="text-sm text-stone-500">Conexão</dt>
            <dd className="text-lg font-semibold">{connection}</dd>
          </div>
          <div>
            <dt className="text-sm text-stone-500">Pedidos</dt>
            <dd className="text-lg font-semibold">{Object.keys(orders).length}</dd>
          </div>
          <div>
            <dt className="text-sm text-stone-500">Entregadores</dt>
            <dd className="text-lg font-semibold">{Object.keys(drivers).length}</dd>
          </div>
        </dl>
        {connection !== 'online' && (
          <p className="mt-4 text-sm text-amber-700">
            Inicie o mock com <code className="rounded bg-stone-100 px-1">node mock/server.js</code> na raiz do projeto.
          </p>
        )}
      </section>
    </div>
  )
}
