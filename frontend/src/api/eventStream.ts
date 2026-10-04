import type {
  ConnectionStatus,
  DriverMoved,
  FeedbackCreated,
  Order,
  Snapshot,
  StreamEvent,
} from '../types'
import { API_URL } from './client'

const EVENT_TYPES = [
  'snapshot',
  'order.created',
  'order.updated',
  'driver.moved',
  'feedback.created',
] as const

type EventPayloads = {
  snapshot: Snapshot
  'order.created': Order
  'order.updated': Order
  'driver.moved': DriverMoved
  'feedback.created': FeedbackCreated
}

export interface EventStreamHandlers {
  onEvent: (event: StreamEvent) => void
  onStatus: (status: ConnectionStatus) => void
}

/**
 * Abre o stream SSE. O EventSource reconecta sozinho e o servidor reenvia o
 * `snapshot` a cada conexão, o que resincroniza o estado após uma queda.
 */
export function openEventStream({ onEvent, onStatus }: EventStreamHandlers): () => void {
  const source = new EventSource(`${API_URL}/events`)

  source.onopen = () => onStatus('online')
  source.onerror = () => onStatus(source.readyState === EventSource.CLOSED ? 'offline' : 'connecting')

  for (const type of EVENT_TYPES) {
    source.addEventListener(type, (message) => {
      const data = JSON.parse((message as MessageEvent<string>).data) as EventPayloads[typeof type]
      onEvent({ type, data } as StreamEvent)
    })
  }

  return () => source.close()
}
