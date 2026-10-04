import type { Stage } from '../types'

export const BOARD_STAGES: Stage[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_DELIVERY', 'DELIVERED']

export const STAGE_LABELS: Record<Stage, string> = {
  PENDING: 'Recebido',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Em preparo',
  READY: 'Pronto',
  OUT_DELIVERY: 'A caminho',
  DELIVERED: 'Entregue',
  CANCELED: 'Cancelado',
}

export function isActiveStage(stage: Stage): boolean {
  return stage !== 'DELIVERED' && stage !== 'CANCELED'
}
