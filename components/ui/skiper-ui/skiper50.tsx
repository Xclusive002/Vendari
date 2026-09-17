"use client"

import { useReducedMotion, motion } from 'framer-motion'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useRef } from 'react'
import { Autoplay, EffectCreative, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { Swiper as SwiperInstance } from 'swiper'
import 'swiper/css'
import 'swiper/css/effect-creative'
import 'swiper/css/pagination'
import 'swiper/css/autoplay'

import { cn } from '@/lib/utils'

type ShowcaseImage = { src: string; alt: string; title: string; detail: string }

type Skiper50Props = {
  images: ShowcaseImage[]
  className?: string
}

export function Skiper50({ images, className }: Skiper50Props) {
  const reducedMotion = useReducedMotion()
  const previous = useRef<SwiperInstance | null>(null)
  const next = useRef<SwiperInstance | null>(null)

  return (
    <div className={cn('relative w-full overflow-hidden', className)}>
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.45, ease: 'easeOut' }}
        className="relative px-5"
      >
        <Swiper
          onBeforeInit={(swiper) => {
            previous.current = swiper
            next.current = swiper
          }}
          modules={[EffectCreative, Pagination, Autoplay]}
          effect="creative"
          grabCursor={!reducedMotion}
          slidesPerView="auto"
          centeredSlides
          loop={images.length > 2}
          spaceBetween={16}
          speed={reducedMotion ? 0 : 650}
          autoplay={reducedMotion ? false : { delay: 4200, disableOnInteraction: true }}
          pagination={{ clickable: true, dynamicBullets: true }}
          className="vendari-carousel"
          creativeEffect={{
            prev: { shadow: true, origin: 'left center', translate: ['-5%', 0, -180], rotate: [0, 8, 0] },
            next: { origin: 'right center', translate: ['5%', 0, -180], rotate: [0, -8, 0] },
          }}
        >
          {images.map((image) => (
            <SwiperSlide key={image.title} className="!h-auto !w-[min(78vw,22rem)] sm:!w-[min(46vw,25rem)]">
              <article className="h-full overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-card)]">
                <div className="aspect-[4/3] overflow-hidden bg-ink-soft">
                  <img src={image.src} alt={image.alt} className="h-full w-full object-cover" />
                </div>
                <div className="border-t border-border p-4">
                  <h3 className="font-display text-base font-semibold text-ink">{image.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-text-secondary">{image.detail}</p>
                </div>
              </article>
            </SwiperSlide>
          ))}
        </Swiper>
        <button type="button" aria-label="Previous storefront example" onClick={() => previous.current?.slidePrev()} className="absolute left-6 top-[38%] z-10 hidden h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-ink/80 text-white shadow-lg transition hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue sm:flex">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <button type="button" aria-label="Next storefront example" onClick={() => next.current?.slideNext()} className="absolute right-6 top-[38%] z-10 hidden h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-ink/80 text-white shadow-lg transition hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue sm:flex">
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </motion.div>
      <style jsx global>{`
        .vendari-carousel { padding: 0.25rem 0 2.5rem !important; }
        .vendari-carousel .swiper-pagination-bullet { background: var(--blue); opacity: 0.3; }
        .vendari-carousel .swiper-pagination-bullet-active { opacity: 1; }
      `}</style>
    </div>
  )
}
