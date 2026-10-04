import { useCallback, useEffect, useRef, useState } from 'react'
import type { NoticeMessage } from '../components/Notice'

export function useNotice(durationMs = 4_000) {
  const [notice, setNotice] = useState<NoticeMessage | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const show = useCallback(
    (next: NoticeMessage) => {
      clearTimeout(timer.current)
      setNotice(next)
      timer.current = setTimeout(() => setNotice(null), durationMs)
    },
    [durationMs],
  )

  return { notice, show }
}
