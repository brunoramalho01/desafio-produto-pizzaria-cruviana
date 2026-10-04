import { etaMinutes, formatEta } from './eta'

const origin = { lat: -23.55, lng: -46.63 }

describe('etaMinutes', () => {
  it('divide a distância pela velocidade média', () => {
    // ~2,2 km a 25 km/h ≈ 5,3 min → arredonda para cima
    expect(etaMinutes(origin, { lat: -23.57, lng: -46.63 })).toBe(6)
  })

  it('nunca retorna menos de 1 minuto', () => {
    expect(etaMinutes(origin, origin)).toBe(1)
  })

  it('aceita outra velocidade', () => {
    expect(etaMinutes(origin, { lat: -23.57, lng: -46.63 }, 50)).toBe(3)
  })
})

describe('formatEta', () => {
  it('formata o texto', () => {
    expect(formatEta(1)).toBe('menos de 1 min')
    expect(formatEta(7)).toBe('7 min')
  })
})
