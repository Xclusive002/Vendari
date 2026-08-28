'use client'

import * as React from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function LoadingButton({ loading = false, children, className, disabled, ...props }: ButtonProps & { loading?: boolean }) {
  return (
    <Button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn(className)}
    >
      {loading && <span className="loading-spinner" aria-hidden="true" />}
      <span className={loading ? 'sr-only' : undefined}>{children}</span>
      {loading && <span className="sr-only">Working</span>}
    </Button>
  )
}
