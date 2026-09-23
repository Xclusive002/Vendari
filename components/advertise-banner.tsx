'use client'

import { ArrowUpRight, Megaphone, MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useCountUp } from '@/hooks/use-count-up'

const audienceSize = 76984

export function AdvertiseBanner() {
  const viewers = useCountUp(audienceSize, 1800)
  const whatsappUrl = 'https://wa.me/2348031642354?text=Hello%20Vendari%2C%20I%27d%20like%20to%20advertise%20my%20business%20on%20your%20landing%20page.'

  return (
    <section className="overflow-hidden border-y border-ink/10 bg-ink px-5 py-16 text-white sm:px-8 sm:py-20" aria-labelledby="advertise-heading">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue/30 bg-blue/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue">
            <Megaphone className="h-3.5 w-3.5" /> Partner spotlight
          </div>
          <h2 id="advertise-heading" className="mt-5 max-w-2xl font-display text-3xl font-semibold leading-tight sm:text-5xl">
            Put your business in front of people already looking for better ways to grow.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/65 sm:text-lg">
            Advertise with Vendari and give your business a focused introduction inside a growing business community. We will help you shape a clear, useful placement that earns attention instead of getting lost in the noise.
          </p>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3.5 text-sm font-semibold text-ink shadow-lg shadow-black/20 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <MessageCircle className="h-4 w-4 text-[#25D366]" /> WhatsApp to advertise <ArrowUpRight className="h-4 w-4" />
          </a>
          <p className="mt-3 text-xs text-white/45">0803 164 2354 · Tap to start the conversation</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-5 sm:p-7">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full border border-blue/20" aria-hidden="true" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Average monthly landing-page viewers</p>
            <p className="mt-3 font-mono text-5xl font-semibold tracking-tight text-white sm:text-7xl" aria-label={`${audienceSize.toLocaleString()} average monthly viewers`}>
              {viewers.toLocaleString('en-NG')}
            </p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/60">A strong opportunity to introduce your offer to an audience interested in practical business growth.</p>
            <div className="mt-8 flex h-20 items-end gap-1.5" aria-hidden="true">
              {[35, 48, 42, 64, 55, 72, 61, 84, 68, 92, 78, 100].map((height, index) => (
                <motion.span key={height} className="flex-1 rounded-t-sm bg-blue" initial={{ height: 0, opacity: 0.35 }} whileInView={{ height: `${height}%`, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: index * 0.045, ease: 'easeOut' }} />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35"><span>Reach</span><span>Attention</span><span>Action</span></div>
          </div>
        </div>
      </div>
    </section>
  )
}
