import type { Driver, Order } from '../types'

export const makeOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 1,
  reference: '#0001',
  channel: 'APP',
  customer: { name: 'Ana', phone: '(11) 90000-0000' },
  address: { street: 'Rua A', number: '1', neighborhood: 'Jardim', lat: -23.54, lng: -46.64 },
  items: [{ name: 'Pizza Pepperoni', quantity: 1 }],
  total: '78.00',
  stage: 'PENDING',
  createdAt: '2026-09-23T13:00:00',
  promisedMinutes: 30,
  driverId: null,
  feedback: null,
  ...overrides,
})

export const makeDriver = (overrides: Partial<Driver> = {}): Driver => ({
  id: 1,
  name: 'Beto',
  status: 'IDLE',
  lat: -23.548,
  lng: -46.635,
  orderIds: [],
  ...overrides,
})
