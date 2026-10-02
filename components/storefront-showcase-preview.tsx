'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Check, ShieldCheck, Sparkles } from 'lucide-react'
import { StorefrontThemePreview } from '@/components/dashboard/storefront-theme-preview'

const showcaseThemes = ['editorial', 'botanical', 'bold', 'classic']

export function StorefrontShowcasePreview() {
  const [themeIndex, setThemeIndex] = useState(0)
  const reducedMotion = useReducedMotion()
  const themeKey = showcaseThemes[themeIndex]

  useEffect(() => {
    if (reducedMotion) return
    const interval = window.setInterval(() => setThemeIndex((current) => (current + 1) % showcaseThemes.length), 4600)
    return () => window.clearInterval(interval)
  }, [reducedMotion])

  return (
    <div className="relative mx-auto w-full max-w-2xl px-1 pb-10 pt-4 sm:px-3 sm:pb-12">
      <motion.div
        className="relative z-10 rounded-[1.75rem] border border-white/80 bg-white/80 p-2.5 shadow-[0_28px_90px_-32px_rgba(15,29,61,0.38)] ring-1 ring-slate-900/5 backdrop-blur sm:p-4"
        animate={reducedMotion ? undefined : { y: [0, -8, 0], rotate: [0, 0.25, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="mb-2 flex items-center justify-between px-1 sm:mb-3 sm:px-2">
          <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-gradient text-[10px] font-bold text-white">V</span><div><p className="text-[10px] font-bold text-ink sm:text-xs">Your online storefront</p><p className="text-[8px] text-text-muted sm:text-[10px]">One beautiful link. Ready to share.</p></div></div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[8px] font-semibold text-emerald-700 sm:text-[10px]"><i className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> LIVE PREVIEW</span>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={themeKey}
            initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: reducedMotion ? 0 : 0.45, ease: 'easeOut' }}
          >
            <StorefrontThemePreview themeKey={themeKey} businessName="Emmanuel's Store" description="Beautiful everyday finds, thoughtfully selected and delivered with care." variant="showcase" />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <motion.div
        className="absolute -left-1 top-[24%] z-20 hidden items-center gap-2.5 rounded-2xl border border-white/80 bg-white/95 px-3 py-2.5 shadow-xl shadow-slate-900/10 sm:flex lg:-left-10"
        animate={reducedMotion ? undefined : { y: [0, -5, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue/10 text-blue"><Sparkles className="h-4 w-4" /></span>
        <span><span className="block text-[9px] font-medium text-text-muted">Store design</span><span className="mt-0.5 block text-[11px] font-semibold text-ink">{['Editorial', 'Botanical', 'Bold Market', 'Classic'][themeIndex]}</span></span>
      </motion.div>

      <motion.div
        className="absolute -right-1 bottom-0 z-20 flex items-center gap-2 rounded-2xl border border-white/80 bg-white/95 px-3 py-2.5 shadow-xl shadow-slate-900/10 sm:-right-2 lg:-right-7"
        animate={reducedMotion ? undefined : { y: [0, 5, 0] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><ShieldCheck className="h-4 w-4" /></span>
        <span><span className="block text-[9px] font-medium text-text-muted">Customer-ready</span><span className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-ink">Browse, trust & shop <Check className="h-3 w-3 text-emerald-600" /></span></span>
        <ArrowUpRight className="ml-1 h-4 w-4 text-blue" />
      </motion.div>

      <div className="absolute inset-x-10 bottom-10 -z-10 h-32 rounded-full bg-blue/15 blur-3xl" aria-hidden="true" />
    </div>
  )
}
