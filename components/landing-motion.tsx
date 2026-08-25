'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

const rise = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

export function HeroMotion({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : 'hidden'}
      animate="visible"
      variants={rise}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.55, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export function ScrollReveal({ children, className }: { children: ReactNode; className?: string }) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={rise}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.55, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}