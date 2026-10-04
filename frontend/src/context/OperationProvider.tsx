import { useEffect, useReducer, type ReactNode } from 'react'
import { openEventStream } from '../api/eventStream'
import { initialOperationState, operationReducer } from '../domain/operationReducer'
import { OperationContext } from './OperationContext'

export function OperationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(operationReducer, initialOperationState)

  useEffect(
    () =>
      openEventStream({
        onEvent: (event) => dispatch({ type: 'stream', event, now: new Date() }),
        onStatus: (status) => dispatch({ type: 'connection', status }),
      }),
    [],
  )

  return <OperationContext.Provider value={state}>{children}</OperationContext.Provider>
}
