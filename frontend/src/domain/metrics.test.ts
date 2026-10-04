import { computeMetrics, listNeighborhoods } from './metrics'
import { makeDriver, makeOrder } from '../test/factories'

const base = (id: number, extra = {}) =>
  makeOrder({ id, stage: 'DELIVERED', createdAt: '2026-09-23T13:00:00', promisedMinutes: 30, driverId: 1, ...extra })

const drivers = [makeDriver({ id: 1, name: 'Beto' }), makeDriver({ id: 2, name: 'Ana' })]

describe('computeMetrics', () => {
  it('retorna valores nulos sem entregas', () => {
    const metrics = computeMetrics([makeOrder({ stage: 'PREPARING' })], drivers, {})

    expect(metrics).toMatchObject({ deliveredCount: 0, averageMinutes: null, onTimePercent: null, averageRating: null, byDriver: [] })
  })

  it('calcula tempo médio e % no prazo a partir do instante observado', () => {
    const orders = [base(1), base(2)]
    const deliveredAt = { 1: '2026-09-23T13:20:00Z', 2: '2026-09-23T13:40:00Z' }

    const metrics = computeMetrics(orders, drivers, deliveredAt)

    expect(metrics.averageMinutes).toBe(30)
    expect(metrics.onTimePercent).toBe(50)
    expect(metrics.measuredCount).toBe(2)
  })

  it('considera no prazo quando conclui exatamente no limite', () => {
    const metrics = computeMetrics([base(1)], drivers, { 1: '2026-09-23T13:30:00Z' })
    expect(metrics.onTimePercent).toBe(100)
  })

  it('ignora para tempo as entregas sem instante observado, mas conta no total', () => {
    const metrics = computeMetrics([base(1), base(2)], drivers, { 1: '2026-09-23T13:10:00Z' })

    expect(metrics.deliveredCount).toBe(2)
    expect(metrics.measuredCount).toBe(1)
    expect(metrics.averageMinutes).toBe(10)
  })

  it('calcula a nota média só com pedidos avaliados', () => {
    const fb = (rating: number) => ({ rating, comment: null, at: '2026-09-23T14:00:00' })
    const metrics = computeMetrics([base(1, { feedback: fb(5) }), base(2, { feedback: fb(4) }), base(3)], drivers, {})

    expect(metrics.averageRating).toBe(4.5)
    expect(metrics.ratingCount).toBe(2)
  })

  it('conta entregas por entregador em ordem decrescente', () => {
    const metrics = computeMetrics([base(1, { driverId: 2 }), base(2), base(3), base(4, { driverId: null })], drivers, {})

    expect(metrics.byDriver.map((d) => [d.name, d.count])).toEqual([
      ['Beto', 2],
      ['Ana', 1],
      ['Sem entregador', 1],
    ])
  })

  it('filtra por bairro', () => {
    const at = (neighborhood: string) => ({ street: 'R', number: '1', neighborhood, lat: 0, lng: 0 })
    const orders = [base(1, { address: at('Centro') }), base(2, { address: at('Jardim') })]

    expect(computeMetrics(orders, drivers, {}, 'Jardim').deliveredCount).toBe(1)
    expect(computeMetrics(orders, drivers, {}).deliveredCount).toBe(2)
  })
})

describe('listNeighborhoods', () => {
  it('lista bairros únicos ordenados', () => {
    const at = (neighborhood: string) => makeOrder({ address: { street: 'R', number: '1', neighborhood, lat: 0, lng: 0 } })
    expect(listNeighborhoods([at('Jardim'), at('Centro'), at('Jardim')])).toEqual(['Centro', 'Jardim'])
  })
})
