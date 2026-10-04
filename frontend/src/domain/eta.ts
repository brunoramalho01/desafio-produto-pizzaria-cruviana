import { distanceMeters } from './geo'

export const AVERAGE_SPEED_KMH = 25

interface Point {
  lat: number
  lng: number
}

export function etaMinutes(from: Point, to: Point, speedKmh = AVERAGE_SPEED_KMH): number {
  const metersPerMinute = (speedKmh * 1000) / 60
  return Math.max(1, Math.ceil(distanceMeters(from, to) / metersPerMinute))
}

export function formatEta(minutes: number): string {
  return minutes <= 1 ? 'menos de 1 min' : `${minutes} min`
}
