import type { Order } from '../types'
import { isActiveStage } from './stages'
import { elapsedMinutes } from './time'

export type SlaLevel = 'none' | 'ok' | 'warning' | 'critical'

export const SLA_WARNING_RATIO = 0.7

export function getSlaLevel(order: Order, now: Date): SlaLevel {
  if (!isActiveStage(order.stage)) return 'none'

  const ratio = elapsedMinutes(order.createdAt, now) / order.promisedMinutes
  if (ratio >= 1) return 'critical'
  if (ratio >= SLA_WARNING_RATIO) return 'warning'
  return 'ok'
}
