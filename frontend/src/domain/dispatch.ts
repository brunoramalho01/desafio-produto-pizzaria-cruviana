import type { Driver, Order } from '../types'
import { distanceMeters } from './geo'
import { GROUPING_RADIUS_METERS } from './grouping'

export interface DriverOption {
  driver: Driver
  /** Pedidos que o entregador já leva (a caminho). */
  activeOrders: Order[]
  /** Pedidos dele no mesmo bairro ou a poucos metros do pedido a despachar. */
  sameAreaOrders: Order[]
}

/**
 * A carga vem dos pedidos, não de `driver.orderIds`: o mock não atualiza o
 * entregador quando a atribuição é feita via PATCH no pedido.
 */
export function getDriverOptions(order: Order, drivers: Driver[], orders: Order[]): DriverOption[] {
  const onRoute = orders.filter((o) => o.stage === 'OUT_DELIVERY' && o.driverId !== null)

  return drivers
    .map((driver) => {
      const activeOrders = onRoute.filter((o) => o.driverId === driver.id)
      const sameAreaOrders = activeOrders.filter(
        (o) =>
          o.address.neighborhood === order.address.neighborhood ||
          distanceMeters(o.address, order.address) <= GROUPING_RADIUS_METERS,
      )
      return { driver, activeOrders, sameAreaOrders }
    })
    .sort(
      (a, b) =>
        b.sameAreaOrders.length - a.sameAreaOrders.length ||
        a.activeOrders.length - b.activeOrders.length ||
        a.driver.name.localeCompare(b.driver.name),
    )
}
