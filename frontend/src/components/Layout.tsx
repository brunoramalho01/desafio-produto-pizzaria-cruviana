import { BarChart3, Bike, Home, LayoutDashboard, type LucideIcon, MapPin, Menu, Pizza, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useOperation } from '../context/OperationContext'
import { ConnectionBadge } from './ConnectionBadge'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Início', icon: Home, end: true },
  { to: '/despacho', label: 'Despacho', icon: LayoutDashboard },
  { to: '/metricas', label: 'Métricas', icon: BarChart3 },
  { to: '/entregador', label: 'Entregador', icon: Bike },
  { to: '/pedido', label: 'Acompanhar pedido', icon: MapPin },
]

export function Layout() {
  const { pizzaria, connection } = useOperation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    closeButton.current?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuButton.current?.focus()
      }
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  return (
    <div className="min-h-screen">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:font-semibold focus:text-brand-700 focus:shadow"
      >
        Ir para o conteúdo
      </a>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              ref={menuButton}
              type="button"
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
              aria-controls="menu-lateral"
              onClick={() => setMenuOpen(true)}
              className="rounded-md p-2 text-slate-700 hover:bg-slate-100"
            >
              <Menu className="size-6" aria-hidden="true" />
            </button>
            <Link to="/" className="flex items-center gap-2 font-semibold text-slate-900">
              <Pizza className="size-6 text-brand-600" aria-hidden="true" />
              {pizzaria?.name ?? 'Pizzaria Cruviana'}
            </Link>
          </div>
          <ConnectionBadge status={connection} />
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-slate-900/40" aria-hidden="true" onClick={() => setMenuOpen(false)} />
          <nav
            id="menu-lateral"
            aria-label="Menu principal"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <span className="flex items-center gap-2 font-semibold text-slate-900">
                <Pizza className="size-6 text-brand-600" aria-hidden="true" />
                Cruviana
              </span>
              <button
                ref={closeButton}
                type="button"
                aria-label="Fechar menu"
                onClick={() => setMenuOpen(false)}
                className="rounded-md p-2 text-slate-700 hover:bg-slate-100"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <ul className="flex-1 space-y-1 p-3">
              {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium ${
                        isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Icon className="size-5" aria-hidden="true" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      <main id="conteudo" className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
