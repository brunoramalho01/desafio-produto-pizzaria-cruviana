import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../api/client'
import { OperationContext } from '../context/OperationContext'
import { initialOperationState, type OperationState } from '../domain/operationReducer'
import { makeDriver, makeOrder } from '../test/factories'
import { DriverDeliveriesPage } from './DriverDeliveriesPage'

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  api: { updateOrder: vi.fn(), sendFeedback: vi.fn() },
}))

const address = (lat: number) => ({ street: 'Rua', number: String(Math.abs(Math.round(lat * 100))), neighborhood: 'Centro', lat, lng: -46.63 })

function renderPage(state: Partial<OperationState>, path = '/entregador/1') {
  const value: OperationState = {
    ...initialOperationState,
    pizzaria: { name: 'Pizzaria Cruviana', lat: -23.55, lng: -46.63 },
    connection: 'online',
    drivers: { 1: makeDriver({ id: 1, name: 'Beto' }) },
    ...state,
  }
  return render(
    <OperationContext.Provider value={value}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/entregador/:id" element={<DriverDeliveriesPage />} />
        </Routes>
      </MemoryRouter>
    </OperationContext.Provider>,
  )
}

describe('DriverDeliveriesPage', () => {
  beforeEach(() => {
    vi.mocked(api.updateOrder).mockReset()
  })

  it('destaca a parada mais próxima da pizzaria e lista as demais', () => {
    renderPage({
      orders: {
        1: makeOrder({ id: 1, reference: '#0001', stage: 'OUT_DELIVERY', driverId: 1, address: address(-23.6) }),
        2: makeOrder({ id: 2, reference: '#0002', stage: 'OUT_DELIVERY', driverId: 1, address: address(-23.551) }),
        3: makeOrder({ id: 3, reference: '#0003', stage: 'OUT_DELIVERY', driverId: 2, address: address(-23.5505) }),
      },
    })

    const current = screen.getByRole('region', { name: /próxima parada/i })
    expect(current).toHaveTextContent('#0002')
    expect(screen.getByRole('region', { name: /seguintes/i })).toHaveTextContent('#0001')
    expect(screen.queryByText(/#0003/)).not.toBeInTheDocument()
  })

  it('registra a entrega como DELIVERED', async () => {
    vi.mocked(api.updateOrder).mockResolvedValue(makeOrder())
    renderPage({ orders: { 1: makeOrder({ id: 1, reference: '#0001', stage: 'OUT_DELIVERY', driverId: 1 }) } })

    await userEvent.click(screen.getByRole('button', { name: 'Entreguei' }))

    expect(api.updateOrder).toHaveBeenCalledWith(1, { stage: 'DELIVERED' })
    expect(await screen.findByText(/#0001 entregue/)).toBeInTheDocument()
  })

  it('mostra estado vazio sem entregas', () => {
    renderPage({ orders: {} })
    expect(screen.getByText(/Tudo entregue/)).toBeInTheDocument()
  })

  it('avisa quando o entregador não existe', () => {
    renderPage({ orders: {} }, '/entregador/99')
    expect(screen.getByText(/não encontrado/i)).toBeInTheDocument()
  })
})
