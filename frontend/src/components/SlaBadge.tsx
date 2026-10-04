import type { SlaLevel } from '../domain/sla'

const STYLES: Record<Exclude<SlaLevel, 'none'>, { label: string; className: string }> = {
  ok: { label: 'No prazo', className: 'bg-emerald-100 text-emerald-800' },
  warning: { label: 'Atenção', className: 'bg-amber-100 text-amber-900' },
  critical: { label: 'Atrasado', className: 'bg-red-100 text-red-800' },
}

export function SlaBadge({ level, minutes, promised }: { level: SlaLevel; minutes: number; promised: number }) {
  if (level === 'none') return null
  const { label, className } = STYLES[level]

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>
      {label} · {Math.floor(minutes)}/{promised} min
    </span>
  )
}
