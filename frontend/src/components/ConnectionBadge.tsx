import type { ConnectionStatus } from '../types'

const LABELS: Record<ConnectionStatus, { text: string; dot: string }> = {
  online: { text: 'Ao vivo', dot: 'bg-emerald-500' },
  connecting: { text: 'Reconectando…', dot: 'bg-amber-500 animate-pulse' },
  offline: { text: 'Sem conexão', dot: 'bg-red-500' },
}

export function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  const { text, dot } = LABELS[status]
  return (
    <span
      role="status"
      className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-stone-700 shadow-sm ring-1 ring-stone-200"
    >
      <span className={`size-2.5 rounded-full ${dot}`} aria-hidden="true" />
      {text}
    </span>
  )
}
