'use client'

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import type { ReactNode } from 'react'
import { useRef } from 'react'

const revealDirections = {
  up: { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } },
  left: { hidden: { opacity: 0, x: -24 }, visible: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 24 }, visible: { opacity: 1, x: 0 } },
} as const

export function HeroMotion({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : 'hidden'}
      animate="visible"
      variants={revealDirections.up}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.55, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export function ScrollReveal({ children, className, direction = 'up', delay = 0 }: { children: ReactNode; className?: string; direction?: keyof typeof revealDirections; delay?: number }) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={revealDirections[direction]}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.55, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export function ParallaxMockup({ children, className }: { children: ReactNode; className?: string }) {
  const reducedMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const rotate = useTransform(scrollYProgress, [0, 0.5, 1], reducedMotion ? [0, 0, 0] : [2, 0, -2])
  const y = useTransform(scrollYProgress, [0, 0.5, 1], reducedMotion ? [0, 0, 0] : [18, 0, -18])

  return <motion.div ref={ref} style={{ rotate, y }} className={className}>{children}</motion.div>
}