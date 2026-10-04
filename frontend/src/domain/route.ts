import { distanceMeters } from './geo'
import type { Order } from '../types'

interface Point {
  lat: number
  lng: number
}

export interface RouteStop {
  order: Order
  legMeters: number
}

/** Vizinho mais próximo: parte da origem e visita sempre a parada mais próxima da posição atual. */
export function planRoute(origin: Point, orders: Order[]): RouteStop[] {
  const remaining = [...orders]
  const stops: RouteStop[] = []
  let current: Point = origin

  while (remaining.length > 0) {
    let nearestIndex = 0
    let nearestMeters = Infinity
    remaining.forEach((order, index) => {
      const meters = distanceMeters(current, order.address)
      if (meters < nearestMeters || (meters === nearestMeters && order.id < remaining[nearestIndex].id)) {
        nearestMeters = meters
        nearestIndex = index
      }
    })
    const [order] = remaining.splice(nearestIndex, 1)
    stops.push({ order, legMeters: nearestMeters })
    current = order.address
  }

  return stops
}

export function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters / 10) * 10} m` : `${(meters / 1000).toFixed(1).replace('.', ',')} km`
}
