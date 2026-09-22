import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function normalizeAmountInput(value: string) {
  const normalized = value.replace(/^0+(?=\d|$)/, '')
  return normalized ? Number(normalized) || 0 : 0
}
