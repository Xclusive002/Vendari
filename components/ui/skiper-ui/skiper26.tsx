"use client"

import { motion, useReducedMotion } from 'framer-motion'

type Skiper26Props = {
  eyebrow?: string
  title: string
  copy: string
  image: string
  alt: string
  className?: string
}

export function Skiper26({ eyebrow, title, copy, image, alt, className = '' }: Skiper26Props) {
  const reducedMotion = useReducedMotion()

  return (
    <article className={`grid items-center gap-8 overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-8 lg:grid-cols-[0.82fr_1.18fr] ${className}`}>
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, x: -24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.55, ease: 'easeOut' }}
      >
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">{eyebrow}</p>}
        <h3 className="mt-3 font-display text-2xl font-semibold leading-tight text-ink sm:text-3xl">{title}</h3>
        <p className="mt-4 max-w-md text-sm leading-6 text-text-secondary">{copy}</p>
      </motion.div>
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
        whileInView={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
        viewport={{ once: true, amount: 0.25 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-lg bg-ink-soft"
      >
        <img src={image} alt={alt} className="aspect-[4/3] h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 bg-brand-gradient opacity-10" aria-hidden="true" />
      </motion.div>
    </article>
  )
}
