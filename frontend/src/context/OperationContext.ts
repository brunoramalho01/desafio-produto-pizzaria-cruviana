import { createContext, useContext } from 'react'
import type { OperationState } from '../domain/operationReducer'

export const OperationContext = createContext<OperationState | null>(null)

export function useOperation(): OperationState {
  const value = useContext(OperationContext)
  if (!value) throw new Error('useOperation deve ser usado dentro de <OperationProvider>.')
  return value
}
