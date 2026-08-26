'use client'

import { useEffect, useRef, useState } from 'react'
import { askBusiness } from '@/app/actions/query'
import { getBusiness } from '@/app/actions/business'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function AskPage() {
  const [businessId, setBusinessId] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<{ text: string; data: Record<string, unknown> } | null>(null)
  const [loading, setLoading] = useState(false)
  const askingRef = useRef(false)

  useEffect(() => {
    getBusiness().then((business) => business && setBusinessId(String(business.id)))
  }, [])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (askingRef.current) return
    askingRef.current = true
    setLoading(true)
    try {
      const result = await askBusiness(businessId, question)
      if ('answer' in result) setAnswer({ text: result.answer, data: result.data_used })
    } finally {
      askingRef.current = false
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <main className="p-4 md:p-8 max-w-4xl">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader><CardTitle className="text-white">Ask Vendari</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex gap-3">
              <Input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="How did sales perform this month?" className="bg-slate-700 border-slate-600 text-white" required />
              <Button type="submit" disabled={loading || !businessId}>{loading ? 'Thinking...' : 'Ask'}</Button>
            </form>
            {answer && (
              <div className="mt-6 space-y-4">
                <div><p className="text-xs uppercase tracking-wide text-blue-300">AI answer</p><p className="mt-1 text-slate-200">{answer.text}</p></div>
                <details className="border border-slate-700 rounded-lg p-4"><summary className="cursor-pointer text-sm text-emerald-300">Data used</summary><pre className="mt-3 overflow-x-auto text-xs text-slate-400">{JSON.stringify(answer.data, null, 2)}</pre></details>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}