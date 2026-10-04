import type { ApiErrorBody, Order, Stage } from '../types'

export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor.', 0)
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null
    throw new ApiError(body?.error ?? 'Erro inesperado.', response.status, body?.code)
  }
  return (await response.json()) as T
}

export interface OrderPatch {
  stage?: Stage
  driverId?: number | null
}

export const api = {
  updateOrder: (id: number, patch: OrderPatch) =>
    request<Order>(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  sendFeedback: (id: number, rating: number, comment?: string) =>
    request<Order>(`/orders/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    }),
}
