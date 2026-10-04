import type { Order } from '../types'
import { distanceMeters } from './geo'
import { isActiveStage } from './stages'

export const GROUPING_RADIUS_METERS = 150

/** Agrupa pedidos ativos cujos endereços estão a no máximo `radius` metros (encadeado). */
export function groupNearbyOrders(orders: Order[], radius = GROUPING_RADIUS_METERS): Order[][] {
  const active = orders.filter((order) => isActiveStage(order.stage))
  const parent = active.map((_, index) => index)

  const find = (index: number): number => {
    while (parent[index] !== index) {
      parent[index] = parent[parent[index]]
      index = parent[index]
    }
    return index
  }

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      if (distanceMeters(active[i].address, active[j].address) <= radius) {
        parent[find(i)] = find(j)
      }
    }
  }

  const groups = new Map<number, Order[]>()
  active.forEach((order, index) => {
    const root = find(index)
    groups.set(root, [...(groups.get(root) ?? []), order])
  })

  return [...groups.values()]
    .filter((group) => group.length > 1)
    .map((group) => group.sort((a, b) => a.id - b.id))
}
