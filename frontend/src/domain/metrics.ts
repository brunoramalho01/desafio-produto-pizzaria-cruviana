import type { Driver, Order } from '../types'
import { parseServerDate } from './time'

export interface DriverDeliveries {
  driverId: number | null
  name: string
  count: number
}

export interface Metrics {
  deliveredCount: number
  /** Entregas com instante de conclusão observado (base de tempo e prazo). */
  measuredCount: number
  averageMinutes: number | null
  onTimePercent: number | null
  averageRating: number | null
  ratingCount: number
  byDriver: DriverDeliveries[]
}

export const ALL_NEIGHBORHOODS = ''

export function listNeighborhoods(orders: Order[]): string[] {
  return [...new Set(orders.map((order) => order.address.neighborhood))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export function computeMetrics(
  orders: Order[],
  drivers: Driver[],
  deliveredAt: Record<number, string>,
  neighborhood: string = ALL_NEIGHBORHOODS,
): Metrics {
  const delivered = orders.filter(
    (order) => order.stage === 'DELIVERED' && (!neighborhood || order.address.neighborhood === neighborhood),
  )

  const durations = delivered.flatMap((order) => {
    const finished = deliveredAt[order.id]
    if (!finished) return []
    const minutes = (new Date(finished).getTime() - parseServerDate(order.createdAt).getTime()) / 60_000
    return [{ minutes: Math.max(0, minutes), promised: order.promisedMinutes }]
  })

  const ratings = delivered.flatMap((order) => (order.feedback ? [order.feedback.rating] : []))

  const counts = new Map<number | null, number>()
  for (const order of delivered) counts.set(order.driverId, (counts.get(order.driverId) ?? 0) + 1)
  const nameOf = (id: number | null) => (id === null ? 'Sem entregador' : (drivers.find((d) => d.id === id)?.name ?? `Entregador ${id}`))
  const byDriver = [...counts.entries()]
    .map(([driverId, count]) => ({ driverId, name: nameOf(driverId), count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR'))

  const average = (values: number[]) => (values.length === 0 ? null : values.reduce((sum, v) => sum + v, 0) / values.length)

  return {
    deliveredCount: delivered.length,
    measuredCount: durations.length,
    averageMinutes: average(durations.map((d) => d.minutes)),
    onTimePercent:
      durations.length === 0 ? null : (durations.filter((d) => d.minutes <= d.promised).length / durations.length) * 100,
    averageRating: average(ratings),
    ratingCount: ratings.length,
    byDriver,
  }
}
