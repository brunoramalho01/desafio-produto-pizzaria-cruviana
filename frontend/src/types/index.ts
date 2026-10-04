export type Stage =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_DELIVERY'
  | 'DELIVERED'
  | 'CANCELED'

export type Channel = 'TELEFONE' | 'WHATSAPP' | 'APP'

export type DriverStatus = 'IDLE' | 'ON_ROUTE'

export interface Pizzaria {
  name: string
  lat: number
  lng: number
}

export interface Address {
  street: string
  number: string
  neighborhood: string
  lat: number
  lng: number
}

export interface OrderItem {
  name: string
  quantity: number
}

export interface Feedback {
  rating: number
  comment: string | null
  at: string
}

export interface Order {
  id: number
  reference: string
  channel: Channel
  customer: { name: string; phone: string }
  address: Address
  items: OrderItem[]
  total: string
  stage: Stage
  createdAt: string
  promisedMinutes: number
  driverId: number | null
  feedback: Feedback | null
}

export interface Driver {
  id: number
  name: string
  status: DriverStatus
  lat: number
  lng: number
  orderIds: number[]
}

export interface DriverMoved {
  id: number
  lat: number
  lng: number
  orderId: number
}

export interface FeedbackCreated extends Feedback {
  orderId: number
}

export interface Snapshot {
  pizzaria: Pizzaria
  orders: Order[]
  drivers: Driver[]
}

export interface ApiErrorBody {
  error: string
  code?: string
}

export type StreamEvent =
  | { type: 'snapshot'; data: Snapshot }
  | { type: 'order.created'; data: Order }
  | { type: 'order.updated'; data: Order }
  | { type: 'driver.moved'; data: DriverMoved }
  | { type: 'feedback.created'; data: FeedbackCreated }

export type ConnectionStatus = 'connecting' | 'online' | 'offline'
