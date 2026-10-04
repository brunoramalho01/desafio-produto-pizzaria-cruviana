export interface NoticeMessage {
  type: 'success' | 'error'
  text: string
}

export function Notice({ notice }: { notice: NoticeMessage | null }) {
  return (
    <div role="status" aria-live="polite" className="fixed inset-x-0 bottom-4 z-20 flex justify-center px-4">
      {notice && (
        <p
          className={`rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
            notice.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {notice.text}
        </p>
      )}
    </div>
  )
}
