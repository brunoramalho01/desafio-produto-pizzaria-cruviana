import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../api/client'
import { OperationContext } from '../context/OperationContext'
import { initialOperationState, type OperationState } from '../domain/operationReducer'
import { makeDriver, makeOrder } from '../test/factories'
import { DispatchPage } from './DispatchPage'

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  api: { updateOrder: vi.fn(), sendFeedback: vi.fn() },
}))

const recent = () => new Date(Date.now() - 5 * 60_000).toISOString().slice(0, 19)

function renderPage(state: Partial<OperationState>) {
  const value: OperationState = {
    ...initialOperationState,
    pizzaria: { name: 'Pizzaria Cruviana', lat: -23.548, lng: -46.635 },
    connection: 'online',
    ...state,
  }
  return render(
    <OperationContext.Provider value={value}>
      <MemoryRouter>
        <DispatchPage />
      </MemoryRouter>
    </OperationContext.Provider>,
  )
}

describe('DispatchPage', () => {
  beforeEach(() => {
    vi.mocked(api.updateOrder).mockReset()
  })

  it('mostra os pedidos na coluna da sua etapa e o alerta de atraso', () => {
    renderPage({
      orders: {
        1: makeOrder({ id: 1, reference: '#0001', stage: 'PREPARING', createdAt: recent() }),
        2: makeOrder({ id: 2, reference: '#0002', stage: 'PENDING', createdAt: '2020-01-01T00:00:00' }),
      },
    })

    const preparing = screen.getByRole('region', { name: /em preparo/i })
    expect(within(preparing).getByText('#0001')).toBeInTheDocument()
    const pending = screen.getByRole('region', { name: /recebido/i })
    expect(within(pending).getByText(/atrasado/i)).toBeInTheDocument()
  })

  it('despacha um pedido pronto com um clique no entregador', async () => {
    vi.mocked(api.updateOrder).mockResolvedValue(makeOrder({ id: 1, stage: 'OUT_DELIVERY', driverId: 2 }))
    renderPage({
      orders: { 1: makeOrder({ id: 1, reference: '#0001', stage: 'READY', createdAt: recent() }) },
      drivers: { 1: makeDriver({ id: 1, name: 'Beto' }), 2: makeDriver({ id: 2, name: 'Rodrigo' }) },
    })

    await userEvent.click(screen.getByRole('button', { name: 'Despachar' }))
    const dialog = screen.getByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: /rodrigo/i }))

    expect(api.updateOrder).toHaveBeenCalledWith(1, { stage: 'OUT_DELIVERY', driverId: 2 })
    expect(await screen.findByText(/#0001 despachado com Rodrigo/)).toBeInTheDocument()
  })

  it('avisa quando o despacho falha', async () => {
    const { ApiError } = await import('../api/client')
    vi.mocked(api.updateOrder).mockRejectedValue(new ApiError('Falha no servidor', 500))
    renderPage({
      orders: { 1: makeOrder({ id: 1, stage: 'READY', createdAt: recent() }) },
      drivers: { 1: makeDriver({ id: 1, name: 'Beto' }) },
    })

    await userEvent.click(screen.getByRole('button', { name: 'Despachar' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /beto/i }))

    expect(await screen.findByText('Falha no servidor')).toBeInTheDocument()
  })

  it('sugere agrupar quando o entregador já leva pedido para o mesmo bairro', async () => {
    renderPage({
      orders: {
        1: makeOrder({ id: 1, reference: '#0001', stage: 'READY', createdAt: recent() }),
        2: makeOrder({
          id: 2,
          reference: '#0002',
          stage: 'OUT_DELIVERY',
          driverId: 2,
          createdAt: recent(),
          address: { street: 'Rua Z', number: '5', neighborhood: 'Jardim', lat: -23.5, lng: -46.6 },
        }),
      },
      drivers: { 1: makeDriver({ id: 1, name: 'Beto' }), 2: makeDriver({ id: 2, name: 'Rodrigo' }) },
    })

    await userEvent.click(screen.getByRole('button', { name: 'Despachar' }))

    expect(within(screen.getByRole('dialog')).getByText(/já leva 1 pedido para essa região/)).toBeInTheDocument()
  })

  it('sinaliza pedidos ativos na mesma região', () => {
    renderPage({
      orders: {
        1: makeOrder({ id: 1, reference: '#0001', stage: 'PREPARING', createdAt: recent() }),
        2: makeOrder({ id: 2, reference: '#0002', stage: 'CONFIRMED', createdAt: recent() }),
      },
    })

    expect(screen.getAllByText(/Mesma região de/)).toHaveLength(2)
  })
})
