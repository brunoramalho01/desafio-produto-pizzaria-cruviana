import { describe, expect, it } from 'vitest'
import { makeOrder } from '../test/factories'
import { getSlaLevel } from './sla'
import { elapsedMinutes, parseServerDate } from './time'

describe('time', () => {
  it('interpreta datas sem fuso como UTC', () => {
    expect(parseServerDate('2026-09-23T13:00:00').toISOString()).toBe('2026-09-23T13:00:00.000Z')
  })

  it('respeita datas que já trazem fuso', () => {
    expect(parseServerDate('2026-09-23T13:00:00-03:00').toISOString()).toBe('2026-09-23T16:00:00.000Z')
  })

  it('calcula minutos decorridos e nunca retorna negativo', () => {
    const now = new Date('2026-09-23T13:12:00Z')
    expect(elapsedMinutes('2026-09-23T13:00:00', now)).toBe(12)
    expect(elapsedMinutes('2026-09-23T13:30:00', now)).toBe(0)
  })
})

describe('getSlaLevel', () => {
  const at = (minutes: number) => new Date(Date.parse('2026-09-23T13:00:00Z') + minutes * 60_000)
  const order = makeOrder({ createdAt: '2026-09-23T13:00:00', promisedMinutes: 30 })

  it('fica ok abaixo de 70% do prazo', () => {
    expect(getSlaLevel(order, at(20))).toBe('ok')
  })

  it('entra em atenção a partir de 70% (21 min)', () => {
    expect(getSlaLevel(order, at(21))).toBe('warning')
  })

  it('fica crítico ao atingir o prazo prometido', () => {
    expect(getSlaLevel(order, at(30))).toBe('critical')
    expect(getSlaLevel(order, at(120))).toBe('critical')
  })

  it.each(['DELIVERED', 'CANCELED'] as const)('não alerta pedidos %s', (stage) => {
    expect(getSlaLevel({ ...order, stage }, at(120))).toBe('none')
  })
})
