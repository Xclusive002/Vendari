'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Quote, Star } from 'lucide-react'

const stories = [
  {
    quote: 'Before Vendari, I could see money coming in but I could not tell which products were actually carrying the business. During early access, I started recording sales properly and the weekly view made the pattern obvious. I stopped restocking based on guesswork and started buying the products my customers were already asking for.',
    role: 'Fashion retailer',
    location: 'Lagos',
    result: 'Clearer restock decisions',
    color: 'bg-[#f3e8d2]',
  },
  {
    quote: 'My staff used to send sales updates in different WhatsApp chats, and I would spend evenings trying to put them together. Vendari gave us one shared place to record the day. The biggest difference was not a fancy report; it was knowing that the numbers I was looking at came from the same record.',
    role: 'Beauty and cosmetics business',
    location: 'Abuja',
    result: 'One shared daily record',
    color: 'bg-[#dfeaf7]',
  },
  {
    quote: 'I run a small food supply business, so stock can move quickly and quietly. The low-stock view helped me notice what was close to finishing before a customer placed an order. I also liked that I could check the business from my phone instead of waiting until I got back to the shop.',
    role: 'Food supply owner',
    location: 'Ibadan',
    result: 'Earlier stock warnings',
    color: 'bg-[#e3eee2]',
  },
  {
    quote: 'The useful part for me was the explanation behind the numbers. I did not need another screen full of charts. Vendari helped me understand that a busy week was not automatically a profitable week because one expense had moved up. That changed the way I review sales every Monday.',
    role: 'Home goods seller',
    location: 'Port Harcourt',
    result: 'Better weekly decisions',
    color: 'bg-[#eee3f0]',
  },
  {
    quote: 'I was worried that setting up another business tool would become another job. The early access version felt practical because I could start with products, customers, and sales without changing everything at once. Now I have a clearer place to return to when I need to answer a question about the business.',
    role: 'Independent retailer',
    location: 'Kano',
    result: 'A calmer operating routine',
    color: 'bg-[#f5e5d9]',
  },
]

export function TestimonialCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeStory = stories[activeIndex]

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % stories.length)
    }, 7000)

    return () => window.clearInterval(timer)
  }, [])

  const move = (direction: number) => {
    setActiveIndex((current) => (current + direction + stories.length) % stories.length)
  }

  return (
    <section className="overflow-hidden border-y border-border bg-bg px-5 py-20 sm:px-8 sm:py-28" aria-labelledby="testimonials-title">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">Early access voices</p>
            <h2 id="testimonials-title" className="mt-4 font-display text-3xl font-semibold leading-tight text-ink sm:text-5xl">Built around the real rhythm of Nigerian businesses.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-text-secondary">These anonymised early-access stories show the kind of change Vendari is designed to create. Customer names and approved quotes will be added as each business gives permission to publish.</p>
          </div>
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <button type="button" onClick={() => move(-1)} aria-label="Previous story" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-ink transition hover:border-blue hover:text-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"><ArrowLeft className="h-4 w-4" /></button>
            <button type="button" onClick={() => move(1)} aria-label="Next story" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-ink transition hover:border-blue hover:text-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"><ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-[0.35fr_1fr]">
          <div className={`relative min-h-56 overflow-hidden rounded-3xl ${activeStory.color} p-6 sm:min-h-72 sm:p-8`}>
            <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full border border-white/70" />
            <div className="absolute bottom-7 right-7 h-16 w-16 rounded-full border border-white/60" />
            <div className="relative flex h-full flex-col justify-between">
              <Quote className="h-9 w-9 text-ink/70" />
              <div>
                <p className="font-display text-2xl font-semibold text-ink sm:text-3xl">{activeStory.result}</p>
                <p className="mt-2 text-sm font-medium text-ink/65">{activeStory.location}</p>
              </div>
            </div>
          </div>

          <article className="relative rounded-3xl border border-border bg-surface p-6 shadow-[var(--shadow-modal)] sm:p-10">
            <div className="flex items-center gap-1 text-[#e2a72e]" aria-label="Five stars"><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /></div>
            <p className="mt-6 max-w-3xl font-display text-2xl font-semibold leading-[1.18] text-ink sm:text-4xl">“{activeStory.quote}”</p>
            <div className="mt-8 flex flex-col gap-1 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-ink">{activeStory.role}</p><p className="text-sm text-text-secondary">Early access participant · {activeStory.location}</p></div><span className="text-xs font-semibold uppercase tracking-[0.14em] text-blue">Story {String(activeIndex + 1).padStart(2, '0')} / {String(stories.length).padStart(2, '0')}</span></div>
          </article>
        </div>

        <div className="mt-6 flex items-center gap-2" role="tablist" aria-label="Choose an early access story">
          {stories.map((story, index) => <button key={story.role} type="button" role="tab" aria-selected={index === activeIndex} aria-label={`Show story ${index + 1}`} onClick={() => setActiveIndex(index)} className={`h-2 rounded-full transition-all ${index === activeIndex ? 'w-10 bg-blue' : 'w-2 bg-border hover:bg-blue/50'}`} />)}
        </div>
      </div>
    </section>
  )
}
