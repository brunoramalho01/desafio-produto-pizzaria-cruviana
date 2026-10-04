import { Star } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { api, ApiError } from '../api/client'

const MAX_COMMENT = 300

export function FeedbackForm({ orderId }: { orderId: number }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (rating === 0) {
      setError('Escolha de 1 a 5 estrelas.')
      return
    }
    setError(null)
    setSending(true)
    try {
      await api.sendFeedback(orderId, rating, comment.trim() || undefined)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível enviar. Tente novamente.')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200" noValidate>
      <h2 className="text-lg font-bold">Como foi sua entrega?</h2>
      <fieldset>
        <legend className="sr-only">Nota de 1 a 5</legend>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`${value} ${value === 1 ? 'estrela' : 'estrelas'}`}
              aria-pressed={rating === value}
              onClick={() => setRating(value)}
              className="flex h-12 w-12 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-brand-600"
            >
              <Star
                className={`size-7 ${value <= rating ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="feedback-comment" className="block text-sm font-medium text-stone-700">
          Comentário (opcional)
        </label>
        <textarea
          id="feedback-comment"
          value={comment}
          maxLength={MAX_COMMENT}
          onChange={(event) => setComment(event.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-stone-300 p-3"
        />
        <p className="text-right text-xs text-stone-500">{comment.length}/{MAX_COMMENT}</p>
      </div>
      {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={sending}
        className="w-full rounded-xl bg-brand-600 px-4 py-3 font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:opacity-60"
      >
        {sending ? 'Enviando…' : 'Enviar avaliação'}
      </button>
    </form>
  )
}
