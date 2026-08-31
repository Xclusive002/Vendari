'use client'

import { useEffect, useRef, useState } from 'react'
import { askBusiness } from '@/app/actions/query'
import { getBusiness } from '@/app/actions/business'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/ui/loading-button'
import { Sparkles, TrendingUp, Users, ShoppingBag } from 'lucide-react'

const promptSuggestions = [
  'Which products sold the most this month?',
  'Which customers are repeat buyers?',
  'How much revenue did we make in the last 30 days?',
  'What inventory items need attention?',
]

export default function AskPage() {
  const [businessId, setBusinessId] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<{ text: string; data: Record<string, unknown> } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const askingRef = useRef(false)

  useEffect(() => {
    getBusiness().then((business) => business && setBusinessId(String(business.id)))
  }, [])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (askingRef.current || !businessId || !question.trim()) return

    askingRef.current = true
    setLoading(true)
    setError('')

    try {
      const result = await askBusiness(businessId, question)
      if ('answer' in result) {
        setAnswer({ text: result.answer, data: result.data_used || {} })
      } else {
        setError(result.error || 'Unable to answer this question right now.')
        setAnswer(null)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to answer this question right now.'
      setError(message)
      setAnswer(null)
    } finally {
      askingRef.current = false
      setLoading(false)
    }
  }

  const summaryCards = [
    { label: 'Sales pulse', value: 'Live', icon: TrendingUp },
    { label: 'Repeat buyers', value: 'Customer health', icon: Users },
    { label: 'Inventory', value: 'Stock watch', icon: ShoppingBag },
  ]

  return (
    <div className="dashboard-page md:pl-8">
      <main className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 shadow-lg shadow-blue-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Ask Vendari</h1>
            <p className="mt-1 text-text-secondary">Turn your sales, inventory, and customer data into clear business guidance.</p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {summaryCards.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="dashboard-panel">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-text-muted">{label}</p>
                  <p className="mt-3 text-lg font-semibold text-ink">{value}</p>
                </div>
                <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-500">
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="dashboard-panel">
          <CardHeader>
            <CardTitle className="font-display text-ink">Business question</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={submit} className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row">
                <Input
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Ask about sales, inventory, or customer repeat purchases..."
                  className="dashboard-input flex-1"
                  required
                />
                <LoadingButton type="submit" loading={loading} disabled={!businessId || !question.trim()} className="dashboard-primary whitespace-nowrap">
                  Ask Vendari
                </LoadingButton>
              </div>

              <div className="flex flex-wrap gap-2">
                {promptSuggestions.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setQuestion(prompt)}
                    className="rounded-full border border-border bg-slate-50 px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:border-blue-200 hover:text-blue-600"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </form>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {answer && (
              <div className="space-y-5 pt-2">
                <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-violet-50 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-blue-600">AI answer</p>
                  <p className="mt-3 text-base leading-7 text-slate-800">{answer.text}</p>
                </div>

                <details className="rounded-2xl border border-border bg-slate-50 p-4">
                  <summary className="cursor-pointer list-none text-sm font-medium text-ink">View raw business data used</summary>
                  <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-200">
                    {JSON.stringify(answer.data, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}