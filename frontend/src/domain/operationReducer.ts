import type { ConnectionStatus, Driver, Order, Pizzaria, StreamEvent } from '../types'

export interface OperationState {
  pizzaria: Pizzaria | null
  orders: Record<number, Order>
  drivers: Record<number, Driver>
  /** Instante (ISO) em que o front viu o pedido virar DELIVERED; base das métricas. */
  deliveredAt: Record<number, string>
  connection: ConnectionStatus
}

export type OperationAction =
  | { type: 'stream'; event: StreamEvent; now: Date }
  | { type: 'connection'; status: ConnectionStatus }

export const initialOperationState: OperationState = {
  pizzaria: null,
  orders: {},
  drivers: {},
  deliveredAt: {},
  connection: 'connecting',
}

function indexById<T extends { id: number }>(items: T[]): Record<number, T> {
  return Object.fromEntries(items.map((item) => [item.id, item]))
}

function withDeliveryInstant(
  deliveredAt: Record<number, string>,
  order: Order,
  now: Date,
): Record<number, string> {
  if (order.stage !== 'DELIVERED' || deliveredAt[order.id]) return deliveredAt
  return { ...deliveredAt, [order.id]: now.toISOString() }
}

function applyStreamEvent(state: OperationState, event: StreamEvent, now: Date): OperationState {
  switch (event.type) {
    case 'snapshot':
      return {
        ...state,
        pizzaria: event.data.pizzaria,
        orders: indexById(event.data.orders),
        drivers: indexById(event.data.drivers),
      }

    case 'order.created':
    case 'order.updated':
      return {
        ...state,
        orders: { ...state.orders, [event.data.id]: event.data },
        deliveredAt: withDeliveryInstant(state.deliveredAt, event.data, now),
      }

    case 'driver.moved': {
      const driver = state.drivers[event.data.id]
      if (!driver) return state
      return {
        ...state,
        drivers: {
          ...state.drivers,
          [driver.id]: { ...driver, lat: event.data.lat, lng: event.data.lng },
        },
      }
    }

    case 'feedback.created': {
      const { orderId, ...feedback } = event.data
      const order = state.orders[orderId]
      if (!order) return state
      return { ...state, orders: { ...state.orders, [orderId]: { ...order, feedback } } }
    }
  }
}

export function operationReducer(state: OperationState, action: OperationAction): OperationState {
  switch (action.type) {
    case 'stream':
      return applyStreamEvent(state, action.event, action.now)
    case 'connection':
      return { ...state, connection: action.status }
  }
}
