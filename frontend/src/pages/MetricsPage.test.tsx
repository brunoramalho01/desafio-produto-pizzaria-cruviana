import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { OperationContext } from '../context/OperationContext'
import { initialOperationState, type OperationState } from '../domain/operationReducer'
import { makeDriver, makeOrder } from '../test/factories'
import { MetricsPage } from './MetricsPage'

const at = (neighborhood: string) => ({ street: 'R', number: '1', neighborhood, lat: 0, lng: 0 })
const delivered = (id: number, neighborhood: string) =>
  makeOrder({ id, stage: 'DELIVERED', driverId: 1, createdAt: '2026-09-23T13:00:00', address: at(neighborhood) })

function renderPage(state: Partial<OperationState>) {
  const value: OperationState = {
    ...initialOperationState,
    pizzaria: { name: 'Pizzaria Cruviana', lat: 0, lng: 0 },
    connection: 'online',
    drivers: { 1: makeDriver({ id: 1, name: 'Beto' }) },
    ...state,
  }
  return render(
    <OperationContext.Provider value={value}>
      <MemoryRouter>
        <MetricsPage />
      </MemoryRouter>
    </OperationContext.Provider>,
  )
}

describe('MetricsPage', () => {
  it('mostra estado vazio sem entregas', () => {
    renderPage({ orders: { 1: makeOrder({ stage: 'PREPARING' }) } })
    expect(screen.getByText(/Ainda não há entregas concluídas/)).toBeInTheDocument()
  })

  it('mostra os indicadores e atualiza ao filtrar por bairro', async () => {
    renderPage({
      orders: { 1: delivered(1, 'Centro'), 2: delivered(2, 'Jardim') },
      deliveredAt: { 1: '2026-09-23T13:20:00Z', 2: '2026-09-23T13:40:00Z' },
    })

    expect(screen.getByText('30,0 min')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()

    await userEvent.selectOptions(screen.getByLabelText('Bairro'), 'Jardim')

    expect(screen.getByText('40,0 min')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })
})
