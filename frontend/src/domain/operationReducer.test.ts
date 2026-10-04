import { describe, expect, it } from 'vitest'
import type { Driver, Order, Snapshot } from '../types'
import { initialOperationState, operationReducer } from './operationReducer'

const order = (overrides: Partial<Order> = {}): Order => ({
  id: 1,
  reference: '#0001',
  channel: 'APP',
  customer: { name: 'Ana', phone: '(11) 90000-0000' },
  address: { street: 'Rua A', number: '1', neighborhood: 'Jardim', lat: -23.54, lng: -46.64 },
  items: [{ name: 'Pizza Pepperoni', quantity: 1 }],
  total: '78.00',
  stage: 'PENDING',
  createdAt: '2026-09-23T13:51:57',
  promisedMinutes: 30,
  driverId: null,
  feedback: null,
  ...overrides,
})

const driver: Driver = { id: 1, name: 'Beto', status: 'IDLE', lat: -23.548, lng: -46.635, orderIds: [] }

const snapshot: Snapshot = {
  pizzaria: { name: 'Pizzaria Cruviana', lat: -23.548, lng: -46.635 },
  orders: [order()],
  drivers: [driver],
}

const now = new Date('2026-09-23T14:00:00Z')

describe('operationReducer', () => {
  it('carrega o snapshot indexando pedidos e entregadores', () => {
    const state = operationReducer(initialOperationState, {
      type: 'stream',
      event: { type: 'snapshot', data: snapshot },
      now,
    })

    expect(state.pizzaria?.name).toBe('Pizzaria Cruviana')
    expect(state.orders[1].reference).toBe('#0001')
    expect(state.drivers[1].name).toBe('Beto')
  })

  it('substitui o estado ao receber um novo snapshot (resincronização)', () => {
    const loaded = operationReducer(initialOperationState, {
      type: 'stream',
      event: { type: 'snapshot', data: snapshot },
      now,
    })
    const resynced = operationReducer(loaded, {
      type: 'stream',
      event: { type: 'snapshot', data: { ...snapshot, orders: [order({ id: 2 })] } },
      now,
    })

    expect(Object.keys(resynced.orders)).toEqual(['2'])
  })

  it('adiciona e atualiza pedidos', () => {
    const created = operationReducer(initialOperationState, {
      type: 'stream',
      event: { type: 'order.created', data: order() },
      now,
    })
    const updated = operationReducer(created, {
      type: 'stream',
      event: { type: 'order.updated', data: order({ stage: 'PREPARING' }) },
      now,
    })

    expect(updated.orders[1].stage).toBe('PREPARING')
  })

  it('registra o instante da entrega apenas na primeira vez', () => {
    const delivered = order({ stage: 'DELIVERED' })
    const first = operationReducer(initialOperationState, {
      type: 'stream',
      event: { type: 'order.updated', data: delivered },
      now,
    })
    const second = operationReducer(first, {
      type: 'stream',
      event: { type: 'order.updated', data: delivered },
      now: new Date('2026-09-23T15:00:00Z'),
    })

    expect(second.deliveredAt[1]).toBe(now.toISOString())
  })

  it('move o entregador sem alterar os demais campos', () => {
    const loaded = operationReducer(initialOperationState, {
      type: 'stream',
      event: { type: 'snapshot', data: snapshot },
      now,
    })
    const moved = operationReducer(loaded, {
      type: 'stream',
      event: { type: 'driver.moved', data: { id: 1, lat: -23.5, lng: -46.6, orderId: 1 } },
      now,
    })

    expect(moved.drivers[1]).toMatchObject({ lat: -23.5, lng: -46.6, name: 'Beto' })
  })

  it('ignora movimento de entregador desconhecido', () => {
    const state = operationReducer(initialOperationState, {
      type: 'stream',
      event: { type: 'driver.moved', data: { id: 99, lat: 0, lng: 0, orderId: 1 } },
      now,
    })

    expect(state).toBe(initialOperationState)
  })

  it('anexa a avaliação ao pedido', () => {
    const loaded = operationReducer(initialOperationState, {
      type: 'stream',
      event: { type: 'snapshot', data: snapshot },
      now,
    })
    const rated = operationReducer(loaded, {
      type: 'stream',
      event: {
        type: 'feedback.created',
        data: { orderId: 1, rating: 5, comment: 'Quente!', at: '2026-09-23T14:10:00' },
      },
      now,
    })

    expect(rated.orders[1].feedback).toEqual({ rating: 5, comment: 'Quente!', at: '2026-09-23T14:10:00' })
  })

  it('atualiza o status da conexão', () => {
    const state = operationReducer(initialOperationState, { type: 'connection', status: 'online' })

    expect(state.connection).toBe('online')
  })
})
