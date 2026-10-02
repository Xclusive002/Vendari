'use client'

import { ArrowUpRight, Search, ShoppingBag, Sparkles, Star } from 'lucide-react'
import { getStorefrontTheme } from '@/lib/storefront-themes'

type StorefrontThemePreviewProps = {
  themeKey: string
  businessName?: string
  description?: string
  primaryColor?: string
  accentColor?: string
  className?: string
  variant?: 'compact' | 'showcase'
}

const featuredProducts = [
  { name: 'The everyday essential', price: '₦8,500', label: 'BESTSELLER', tone: 'from-amber-100 via-orange-50 to-rose-100', color: '#b86a3c' },
  { name: 'Made with intention', price: '₦12,000', label: 'NEW ARRIVAL', tone: 'from-emerald-100 via-lime-50 to-yellow-100', color: '#47765b' },
  { name: 'A little something special', price: '₦6,200', label: 'CUSTOMER FAVOURITE', tone: 'from-violet-100 via-fuchsia-50 to-pink-100', color: '#8c5f91' },
]

function ProductArtwork({ index, color, showcase }: { index: number; color: string; showcase: boolean }) {
  return (
    <div className={`relative flex h-full min-h-16 items-center justify-center overflow-hidden bg-gradient-to-br ${featuredProducts[index].tone}`}>
      <span className="absolute -right-3 -top-5 h-16 w-16 rounded-full bg-white/45 blur-sm" />
      <span className="absolute -bottom-7 -left-3 h-16 w-16 rounded-full bg-white/50" />
      {index === 0 ? (
        <div className={`relative flex ${showcase ? 'h-16 w-14 sm:h-20 sm:w-16' : 'h-12 w-10'} items-center justify-center rounded-[35%_35%_28%_28%] border border-white/70 shadow-lg`} style={{ background: `linear-gradient(145deg, #fff7ed, ${color})` }}>
          <span className={`absolute ${showcase ? '-top-1 h-3 w-6' : '-top-1 h-2 w-4'} rounded-t-sm bg-stone-700/80`} /><span className={`${showcase ? 'text-[8px]' : 'text-[6px]'} font-bold tracking-widest text-white`}>VENDARI</span>
        </div>
      ) : index === 1 ? (
        <div className={`relative flex ${showcase ? 'h-16 w-14 sm:h-20 sm:w-16' : 'h-11 w-9'} items-center justify-center rounded-xl border border-white/70 shadow-lg`} style={{ background: `linear-gradient(145deg, #f8fafc, ${color})` }}>
          <span className={`absolute ${showcase ? '-top-2 h-4 w-4' : '-top-2 h-3 w-3'} rounded-t-sm bg-stone-700/70`} /><span className={`${showcase ? 'text-[8px]' : 'text-[6px]'} font-semibold text-white`}>PURE</span>
        </div>
      ) : (
        <div className={`relative flex ${showcase ? 'h-14 w-16 sm:h-16 sm:w-20' : 'h-10 w-12'} items-center justify-center rounded-xl border border-white/70 shadow-lg`} style={{ background: `linear-gradient(145deg, #fff, ${color})` }}>
          <span className={`absolute ${showcase ? '-top-2 h-4 w-8' : '-top-2 h-3 w-6'} rounded-t-md bg-white/80`} /><span className={`${showcase ? 'text-[8px]' : 'text-[6px]'} font-bold text-white`}>STUDIO</span>
        </div>
      )}
    </div>
  )
}

export function StorefrontThemePreview({ themeKey, businessName = 'Your business', description, primaryColor, accentColor, className = '', variant = 'compact' }: StorefrontThemePreviewProps) {
  const theme = getStorefrontTheme(themeKey)
  const showcase = variant === 'showcase'
  const primary = primaryColor || theme.primary
  const accent = accentColor || theme.accent
  const isDark = theme.key === 'noir'
  const isEditorial = theme.key === 'editorial' || theme.key === 'terracotta'
  const isBold = theme.key === 'bold' || theme.key === 'sunset'

  return (
    <div className={`overflow-hidden border border-slate-200/80 shadow-sm ${className}`} style={{ background: theme.surface, color: theme.ink, borderRadius: theme.key === 'minimal' ? 0 : 14 }}>
      <div className={`flex ${showcase ? 'h-9 sm:h-11' : 'h-7'} items-center gap-1.5 border-b border-black/5 bg-white/90 px-3`}>
        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span className="ml-2 flex-1 truncate rounded bg-slate-100 px-2 py-0.5 text-[7px] text-slate-400">vendari.store/{businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}</span>
        <ShoppingBag className="h-3 w-3 text-slate-500" />
      </div>
      <div className={`flex ${showcase ? 'h-11 sm:h-14 px-4 sm:px-6' : 'h-9 px-3'} items-center justify-between border-b border-black/5`} style={{ backgroundColor: isDark ? '#18181b' : '#fff', color: isDark ? '#fff' : theme.ink }}>
        <div className="flex min-w-0 items-center gap-2"><span className={`flex ${showcase ? 'h-7 w-7 sm:h-9 sm:w-9 text-xs sm:text-sm' : 'h-5 w-5 text-[8px]'} shrink-0 items-center justify-center rounded-full font-bold text-white`} style={{ backgroundColor: primary }}>{businessName.trim().slice(0, 1).toUpperCase() || 'V'}</span><span className={`${showcase ? 'text-xs sm:text-sm' : 'text-[9px]'} truncate font-bold`}>{businessName}</span></div>
        <div className={`flex items-center ${showcase ? 'gap-4 sm:gap-5' : 'gap-2'}`}><span className={`${showcase ? 'text-[9px] sm:text-[11px]' : 'hidden text-[7px] sm:inline'} text-current/65`}>Shop&nbsp;&nbsp; Our story</span><Search className={`${showcase ? 'h-4 w-4' : 'h-3 w-3'} opacity-60`} /><span className="relative"><ShoppingBag className={`${showcase ? 'h-4 w-4' : 'h-3 w-3'}`} /><i className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full" style={{ background: accent }} /></span></div>
      </div>
      <div className={showcase ? 'p-4 sm:p-6' : 'p-3 sm:p-4'}>
        <div className={`relative flex ${showcase ? 'min-h-[150px] sm:min-h-[190px] p-5 sm:p-7' : 'min-h-[96px] p-3'} items-center overflow-hidden ${isEditorial ? 'border-b border-current/15' : ''}`} style={{ borderRadius: isEditorial || theme.key === 'minimal' ? 0 : 10, background: isBold ? `linear-gradient(125deg, ${primary}, ${accent})` : isDark ? 'linear-gradient(135deg, #27272a, #3f1d24)' : `linear-gradient(125deg, ${theme.surface}, ${primary}18)` }}>
          {!isEditorial && <><span className={`absolute ${showcase ? '-right-7 -top-14 h-44 w-44 border-[20px]' : '-right-5 -top-10 h-28 w-28 border-[14px]'} rounded-full border-white/20`} /><span className={`absolute ${showcase ? '-bottom-14 right-20 h-36 w-36' : '-bottom-10 right-12 h-24 w-24'} rounded-full bg-white/15 blur-md`} /></>}
          <div className="relative z-10 max-w-[75%]">
            <div className={`mb-1 flex items-center gap-1 ${showcase ? 'text-[9px] sm:text-[11px]' : 'text-[7px]'} font-semibold uppercase tracking-[.18em]`} style={{ color: isBold ? '#fff' : accent }}><Sparkles className={showcase ? 'h-3 w-3' : 'h-2 w-2'} /> {theme.label} collection</div>
            <h3 className={`${isEditorial ? 'font-serif italic' : 'font-semibold'} ${showcase ? 'text-2xl sm:text-4xl' : 'text-[15px]'} leading-tight`} style={{ color: isBold ? '#fff' : theme.ink }}>{businessName}</h3>
            <p className={`mt-1 line-clamp-2 ${showcase ? 'max-w-sm text-[10px] leading-relaxed sm:mt-2 sm:text-sm' : 'text-[8px] leading-relaxed'}`} style={{ color: isBold ? 'rgba(255,255,255,.82)' : `${theme.ink}a8` }}>{description || theme.description}</p>
            <span className={`mt-2 inline-flex items-center gap-1 rounded-full ${showcase ? 'px-3 py-2 text-[9px] sm:mt-4 sm:px-4 sm:text-xs' : 'px-2 py-1 text-[7px]'} font-semibold text-white`} style={{ backgroundColor: isBold ? 'rgba(255,255,255,.2)' : primary }}>Explore the shop <ArrowUpRight className={showcase ? 'h-3 w-3' : 'h-2 w-2'} /></span>
          </div>
          <div className={`absolute ${showcase ? 'bottom-4 right-6 h-28 w-20 sm:bottom-5 sm:right-10 sm:h-40 sm:w-28' : 'bottom-2 right-3 h-16 w-12'} flex rotate-6 items-center justify-center rounded-t-[40%] rounded-b-xl border border-white/70 shadow-lg`} style={{ background: `linear-gradient(145deg, #fff9, ${accent})` }}><span className={`${showcase ? 'text-[9px] sm:text-xs' : 'text-[6px]'} font-bold tracking-wider text-white`}>LOCAL<br />GOOD</span></div>
        </div>
        <div className={`mb-2 flex items-end justify-between ${showcase ? 'mt-5 sm:mt-7' : 'mt-3'}`}><div><p className={`${showcase ? 'text-[9px] sm:text-[10px]' : 'text-[7px]'} font-semibold uppercase tracking-[.15em]`} style={{ color: accent }}>Curated for you</p><p className={`${showcase ? 'text-sm sm:text-lg' : 'text-[10px]'} mt-0.5 font-semibold`}>Customer favourites</p></div><span className={`flex items-center gap-1 ${showcase ? 'text-[9px] sm:text-[11px]' : 'text-[7px]'} text-amber-500`}><Star className={`${showcase ? 'h-3 w-3' : 'h-2 w-2'} fill-current`} /> Loved locally</span></div>
        <div className={`grid grid-cols-3 ${showcase ? 'gap-2 sm:gap-3' : 'gap-1.5'}`}>
          {featuredProducts.map((product, index) => <div key={product.name} className="min-w-0 overflow-hidden border border-black/5 bg-white" style={{ borderRadius: theme.key === 'minimal' ? 0 : 7 }}>
            <div className={showcase ? 'h-24 sm:h-36' : 'h-16'}><ProductArtwork index={index} color={product.color} showcase={showcase} /></div>
            <div className={showcase ? 'p-2 sm:p-3' : 'p-1.5'}><p className={`${showcase ? 'text-[8px] sm:text-[10px]' : 'text-[6px]'} truncate font-semibold uppercase tracking-wide`} style={{ color: accent }}>{product.label}</p><p className={`${showcase ? 'text-[10px] sm:text-sm' : 'text-[8px]'} mt-0.5 line-clamp-1 font-medium`}>{product.name}</p><p className={`${showcase ? 'text-[10px] sm:text-sm' : 'text-[8px]'} mt-1 font-bold`} style={{ color: primary }}>{product.price}</p></div>
          </div>)}
        </div>
      </div>
      <div className={`flex items-center justify-between ${showcase ? 'px-4 py-3 text-[9px] sm:px-6 sm:py-4 sm:text-[11px]' : 'px-3 py-2 text-[7px]'} text-white`} style={{ background: isDark ? '#18181b' : primary }}><span>Thoughtfully made. Ready for you.</span><span className="font-semibold">Shop with confidence</span></div>
    </div>
  )
}
