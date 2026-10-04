import { describe, expect, it } from 'vitest'
import { makeDriver, makeOrder } from '../test/factories'
import { getDriverOptions } from './dispatch'
import { distanceMeters } from './geo'
import { groupNearbyOrders } from './grouping'

const near = (id: number, lngOffset = 0, overrides = {}) =>
  makeOrder({
    id,
    reference: `#000${id}`,
    address: { street: 'Rua A', number: String(id), neighborhood: 'Jardim', lat: -23.54, lng: -46.64 + lngOffset },
    ...overrides,
  })

describe('distanceMeters', () => {
  it('é zero para o mesmo ponto', () => {
    expect(distanceMeters({ lat: -23.54, lng: -46.64 }, { lat: -23.54, lng: -46.64 })).toBe(0)
  })

  it('aproxima ~111 m para 0,001° de latitude', () => {
    const meters = distanceMeters({ lat: -23.54, lng: -46.64 }, { lat: -23.539, lng: -46.64 })
    expect(meters).toBeGreaterThan(105)
    expect(meters).toBeLessThan(115)
  })
})

describe('groupNearbyOrders', () => {
  it('agrupa pedidos ativos a menos de 150 m', () => {
    const groups = groupNearbyOrders([near(1), near(2, 0.001), near(3, 0.05)])

    expect(groups).toHaveLength(1)
    expect(groups[0].map((o) => o.id)).toEqual([1, 2])
  })

  it('ignora pedidos entregues ou cancelados', () => {
    const groups = groupNearbyOrders([near(1), near(2, 0.0005, { stage: 'DELIVERED' }), near(3, 0.0005, { stage: 'CANCELED' })])

    expect(groups).toEqual([])
  })

  it('encadeia pedidos vizinhos em um único grupo', () => {
    const groups = groupNearbyOrders([near(1), near(2, 0.001), near(3, 0.002)])

    expect(groups).toHaveLength(1)
    expect(groups[0]).toHaveLength(3)
  })
})

describe('getDriverOptions', () => {
  const drivers = [makeDriver({ id: 1, name: 'Beto' }), makeDriver({ id: 2, name: 'Rodrigo' }), makeDriver({ id: 3, name: 'Wesley' })]

  it('sugere primeiro quem já leva pedido para o mesmo bairro', () => {
    const toDispatch = near(10, 0, { stage: 'READY' })
    const orders = [
      toDispatch,
      near(11, 0.05, { stage: 'OUT_DELIVERY', driverId: 2 }),
      makeOrder({
        id: 12,
        stage: 'OUT_DELIVERY',
        driverId: 1,
        address: { street: 'Rua B', number: '9', neighborhood: 'Centro', lat: -23.547, lng: -46.636 },
      }),
    ]

    const options = getDriverOptions(toDispatch, drivers, orders)

    expect(options[0].driver.id).toBe(2)
    expect(options[0].sameAreaOrders).toHaveLength(1)
  })

  it('sem pedidos na região, prefere quem tem menos entregas e desempata pelo nome', () => {
    const toDispatch = near(10, 0, { stage: 'READY' })
    const orders = [
      toDispatch,
      makeOrder({
        id: 12,
        stage: 'OUT_DELIVERY',
        driverId: 1,
        address: { street: 'Rua B', number: '9', neighborhood: 'Centro', lat: -23.547, lng: -46.636 },
      }),
    ]

    const options = getDriverOptions(toDispatch, drivers, orders)

    expect(options.map((o) => o.driver.name)).toEqual(['Rodrigo', 'Wesley', 'Beto'])
  })

  it('conta apenas pedidos a caminho', () => {
    const toDispatch = near(10, 0, { stage: 'READY' })
    const orders = [toDispatch, near(11, 0, { stage: 'DELIVERED', driverId: 1 })]

    const options = getDriverOptions(toDispatch, drivers, orders)

    expect(options.every((o) => o.activeOrders.length === 0)).toBe(true)
  })
})
