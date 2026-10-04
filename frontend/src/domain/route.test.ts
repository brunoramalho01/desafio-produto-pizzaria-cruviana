import { formatDistance, planRoute } from './route'
import { makeOrder } from '../test/factories'

const origin = { lat: -23.55, lng: -46.63 }
const at = (id: number, lat: number, lng: number) =>
  makeOrder({ id, address: { street: 'R', number: '1', neighborhood: 'Centro', lat, lng } })

describe('planRoute', () => {
  it('retorna vazio sem pedidos', () => {
    expect(planRoute(origin, [])).toEqual([])
  })

  it('visita sempre a parada mais próxima da posição atual', () => {
    const far = at(1, -23.6, -46.63)
    const near = at(2, -23.551, -46.63)
    const middle = at(3, -23.57, -46.63)

    const route = planRoute(origin, [far, near, middle])

    expect(route.map((stop) => stop.order.id)).toEqual([2, 3, 1])
  })

  it('calcula a distância de cada trecho a partir da parada anterior', () => {
    const route = planRoute(origin, [at(1, -23.551, -46.63), at(2, -23.552, -46.63)])

    expect(route[0].legMeters).toBeGreaterThan(100)
    expect(route[1].legMeters).toBeLessThan(route[0].legMeters + 1)
  })

  it('não altera a lista original', () => {
    const orders = [at(1, -23.6, -46.63), at(2, -23.551, -46.63)]
    planRoute(origin, orders)
    expect(orders.map((o) => o.id)).toEqual([1, 2])
  })
})

describe('formatDistance', () => {
  it('formata metros e quilômetros', () => {
    expect(formatDistance(432)).toBe('430 m')
    expect(formatDistance(1520)).toBe('1,5 km')
  })
})
