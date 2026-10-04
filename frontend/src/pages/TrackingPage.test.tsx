import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError } from '../api/client'
import { OperationContext } from '../context/OperationContext'
import { initialOperationState, type OperationState } from '../domain/operationReducer'
import { makeDriver, makeOrder } from '../test/factories'
import { OrderLookupPage } from './OrderLookupPage'
import { TrackingPage } from './TrackingPage'

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  api: { updateOrder: vi.fn(), sendFeedback: vi.fn() },
}))
vi.mock('../components/TrackingMap', () => ({ TrackingMap: () => <div data-testid="map" /> }))

function renderAt(path: string, state: Partial<OperationState>) {
  const value: OperationState = {
    ...initialOperationState,
    pizzaria: { name: 'Pizzaria Cruviana', lat: -23.55, lng: -46.63 },
    connection: 'online',
    ...state,
  }
  return render(
    <OperationContext.Provider value={value}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/pedido" element={<OrderLookupPage />} />
          <Route path="/pedido/:id" element={<TrackingPage />} />
        </Routes>
      </MemoryRouter>
    </OperationContext.Provider>,
  )
}

describe('TrackingPage', () => {
  beforeEach(() => {
    vi.mocked(api.sendFeedback).mockReset()
  })

  it('antes de sair mostra a linha do tempo e não mostra mapa nem dados sensíveis', () => {
    renderAt('/pedido/1', { orders: { 1: makeOrder({ id: 1, stage: 'PREPARING' }) } })

    expect(screen.getByRole('listitem', { current: 'step' })).toHaveTextContent('Em preparo')
    expect(screen.queryByTestId('map')).not.toBeInTheDocument()
    expect(screen.queryByText(/90000/)).not.toBeInTheDocument()
  })

  it('a caminho mostra mapa e ETA', () => {
    renderAt('/pedido/1', {
      orders: { 1: makeOrder({ id: 1, stage: 'OUT_DELIVERY', driverId: 1 }) },
      drivers: { 1: makeDriver({ id: 1, lat: -23.55, lng: -46.63 }) },
    })

    expect(screen.getByTestId('map')).toBeInTheDocument()
    expect(screen.getByText(/Chega em/)).toBeInTheDocument()
  })

  it('entregue exige nota antes de enviar a avaliação', async () => {
    renderAt('/pedido/1', { orders: { 1: makeOrder({ id: 1, stage: 'DELIVERED' }) } })

    await userEvent.click(screen.getByRole('button', { name: 'Enviar avaliação' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Escolha de 1 a 5 estrelas')
    expect(api.sendFeedback).not.toHaveBeenCalled()
  })

  it('envia nota e comentário', async () => {
    vi.mocked(api.sendFeedback).mockResolvedValue(makeOrder())
    renderAt('/pedido/1', { orders: { 1: makeOrder({ id: 1, stage: 'DELIVERED' }) } })

    await userEvent.click(screen.getByRole('button', { name: '4 estrelas' }))
    await userEvent.type(screen.getByLabelText(/Comentário/), 'Chegou quente')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar avaliação' }))

    expect(api.sendFeedback).toHaveBeenCalledWith(1, 4, 'Chegou quente')
  })

  it('mostra erro do servidor ao avaliar', async () => {
    vi.mocked(api.sendFeedback).mockRejectedValue(new ApiError('rating inválido', 400))
    renderAt('/pedido/1', { orders: { 1: makeOrder({ id: 1, stage: 'DELIVERED' }) } })

    await userEvent.click(screen.getByRole('button', { name: '5 estrelas' }))
    await userEvent.click(screen.getByRole('button', { name: 'Enviar avaliação' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('rating inválido')
  })

  it('agradece quando já há avaliação', () => {
    renderAt('/pedido/1', {
      orders: { 1: makeOrder({ id: 1, stage: 'DELIVERED', feedback: { rating: 5, comment: null, at: '2026-09-23T13:00:00' } }) },
    })
    expect(screen.getByText(/Obrigado pela avaliação/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Enviar avaliação' })).not.toBeInTheDocument()
  })

  it('avisa quando o pedido não existe', () => {
    renderAt('/pedido/99', { orders: {} })
    expect(screen.getByText(/Não encontramos o pedido 99/)).toBeInTheDocument()
  })
})

describe('OrderLookupPage', () => {
  it('abre o pedido digitado', async () => {
    renderAt('/pedido', { orders: { 70: makeOrder({ id: 70, reference: '#0070', stage: 'PREPARING', customer: { name: 'Bruno Souza', phone: '1' } }) } })

    await userEvent.type(screen.getByLabelText('Número do pedido'), '0070')
    await userEvent.click(screen.getByRole('button', { name: 'Acompanhar' }))

    expect(await screen.findByText(/Olá, Bruno!/)).toBeInTheDocument()
  })

  it('avisa quando o número não existe', async () => {
    renderAt('/pedido', { orders: {} })

    await userEvent.type(screen.getByLabelText('Número do pedido'), '5')
    await userEvent.click(screen.getByRole('button', { name: 'Acompanhar' }))

    expect(screen.getByRole('alert')).toHaveTextContent(/Não encontramos/)
  })
})
