'use client'

import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export function BackButton({ fallback = '/dashboard', children = 'Back' }: { fallback?: string; children?: ReactNode }) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back()
        else router.push(fallback)
      }}
      className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-ink"
    >
      <ArrowLeft className="h-4 w-4" />
      {children}
    </button>
  )
}
