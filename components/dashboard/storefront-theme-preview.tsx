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
}

const featuredProducts = [
  { name: 'The everyday essential', price: '₦8,500', label: 'BESTSELLER', tone: 'from-amber-100 via-orange-50 to-rose-100', color: '#b86a3c' },
  { name: 'Made with intention', price: '₦12,000', label: 'NEW ARRIVAL', tone: 'from-emerald-100 via-lime-50 to-yellow-100', color: '#47765b' },
  { name: 'A little something special', price: '₦6,200', label: 'CUSTOMER FAVOURITE', tone: 'from-violet-100 via-fuchsia-50 to-pink-100', color: '#8c5f91' },
]

function ProductArtwork({ index, color }: { index: number; color: string }) {
  return (
    <div className={`relative flex h-full min-h-16 items-center justify-center overflow-hidden bg-gradient-to-br ${featuredProducts[index].tone}`}>
      <span className="absolute -right-3 -top-5 h-16 w-16 rounded-full bg-white/45 blur-sm" />
      <span className="absolute -bottom-7 -left-3 h-16 w-16 rounded-full bg-white/50" />
      {index === 0 ? (
        <div className="relative flex h-12 w-10 items-center justify-center rounded-[35%_35%_28%_28%] border border-white/70 shadow-lg" style={{ background: `linear-gradient(145deg, #fff7ed, ${color})` }}>
          <span className="absolute -top-1 h-2 w-4 rounded-t-sm bg-stone-700/80" /><span className="text-[6px] font-bold tracking-widest text-white">VENDARI</span>
        </div>
      ) : index === 1 ? (
        <div className="relative flex h-11 w-9 items-center justify-center rounded-xl border border-white/70 shadow-lg" style={{ background: `linear-gradient(145deg, #f8fafc, ${color})` }}>
          <span className="absolute -top-2 h-3 w-3 rounded-t-sm bg-stone-700/70" /><span className="text-[6px] font-semibold text-white">PURE</span>
        </div>
      ) : (
        <div className="relative flex h-10 w-12 items-center justify-center rounded-xl border border-white/70 shadow-lg" style={{ background: `linear-gradient(145deg, #fff, ${color})` }}>
          <span className="absolute -top-2 h-3 w-6 rounded-t-md bg-white/80" /><span className="text-[6px] font-bold text-white">STUDIO</span>
        </div>
      )}
    </div>
  )
}

export function StorefrontThemePreview({ themeKey, businessName = 'Your business', description, primaryColor, accentColor, className = '' }: StorefrontThemePreviewProps) {
  const theme = getStorefrontTheme(themeKey)
  const primary = primaryColor || theme.primary
  const accent = accentColor || theme.accent
  const isDark = theme.key === 'noir'
  const isEditorial = theme.key === 'editorial' || theme.key === 'terracotta'
  const isBold = theme.key === 'bold' || theme.key === 'sunset'

  return (
    <div className={`overflow-hidden border border-slate-200/80 shadow-sm ${className}`} style={{ background: theme.surface, color: theme.ink, borderRadius: theme.key === 'minimal' ? 0 : 14 }}>
      <div className="flex h-7 items-center gap-1.5 border-b border-black/5 bg-white/90 px-3">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span className="ml-2 flex-1 truncate rounded bg-slate-100 px-2 py-0.5 text-[7px] text-slate-400">vendari.store/{businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}</span>
        <ShoppingBag className="h-3 w-3 text-slate-500" />
      </div>
      <div className="flex h-9 items-center justify-between border-b border-black/5 px-3" style={{ backgroundColor: isDark ? '#18181b' : '#fff', color: isDark ? '#fff' : theme.ink }}>
        <div className="flex min-w-0 items-center gap-1.5"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white" style={{ backgroundColor: primary }}>{businessName.trim().slice(0, 1).toUpperCase() || 'V'}</span><span className="truncate text-[9px] font-bold">{businessName}</span></div>
        <div className="flex items-center gap-2"><span className="hidden text-[7px] text-current/65 sm:inline">Shop&nbsp;&nbsp; Our story</span><Search className="h-3 w-3 opacity-60" /><span className="relative"><ShoppingBag className="h-3 w-3" /><i className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full" style={{ background: accent }} /></span></div>
      </div>
      <div className="p-3 sm:p-4">
        <div className={`relative flex min-h-[96px] items-center overflow-hidden p-3 ${isEditorial ? 'border-b border-current/15' : ''}`} style={{ borderRadius: isEditorial || theme.key === 'minimal' ? 0 : 10, background: isBold ? `linear-gradient(125deg, ${primary}, ${accent})` : isDark ? 'linear-gradient(135deg, #27272a, #3f1d24)' : `linear-gradient(125deg, ${theme.surface}, ${primary}18)` }}>
          {!isEditorial && <><span className="absolute -right-5 -top-10 h-28 w-28 rounded-full border-[14px] border-white/20" /><span className="absolute -bottom-10 right-12 h-24 w-24 rounded-full bg-white/15 blur-md" /></>}
          <div className="relative z-10 max-w-[75%]">
            <div className="mb-1 flex items-center gap-1 text-[7px] font-semibold uppercase tracking-[.18em]" style={{ color: isBold ? '#fff' : accent }}><Sparkles className="h-2 w-2" /> {theme.label} collection</div>
            <h3 className={`${isEditorial ? 'font-serif italic' : 'font-semibold'} text-[15px] leading-tight`} style={{ color: isBold ? '#fff' : theme.ink }}>{businessName}</h3>
            <p className="mt-1 line-clamp-2 text-[8px] leading-relaxed" style={{ color: isBold ? 'rgba(255,255,255,.82)' : `${theme.ink}a8` }}>{description || theme.description}</p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[7px] font-semibold text-white" style={{ backgroundColor: isBold ? 'rgba(255,255,255,.2)' : primary }}>Explore the shop <ArrowUpRight className="h-2 w-2" /></span>
          </div>
          <div className="absolute bottom-2 right-3 flex h-16 w-12 rotate-6 items-center justify-center rounded-t-[40%] rounded-b-xl border border-white/70 shadow-lg" style={{ background: `linear-gradient(145deg, #fff9, ${accent})` }}><span className="text-[6px] font-bold tracking-wider text-white">LOCAL<br />GOOD</span></div>
        </div>
        <div className="mb-2 mt-3 flex items-end justify-between"><div><p className="text-[7px] font-semibold uppercase tracking-[.15em]" style={{ color: accent }}>Curated for you</p><p className="mt-0.5 text-[10px] font-semibold">Customer favourites</p></div><span className="flex items-center gap-0.5 text-[7px] text-amber-500"><Star className="h-2 w-2 fill-current" /> Loved locally</span></div>
        <div className="grid grid-cols-3 gap-1.5">
          {featuredProducts.map((product, index) => <div key={product.name} className="min-w-0 overflow-hidden border border-black/5 bg-white" style={{ borderRadius: theme.key === 'minimal' ? 0 : 7 }}>
            <div className="h-16"><ProductArtwork index={index} color={product.color} /></div>
            <div className="p-1.5"><p className="truncate text-[6px] font-semibold uppercase tracking-wide" style={{ color: accent }}>{product.label}</p><p className="mt-0.5 line-clamp-1 text-[8px] font-medium">{product.name}</p><p className="mt-1 text-[8px] font-bold" style={{ color: primary }}>{product.price}</p></div>
          </div>)}
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-2 text-[7px] text-white" style={{ background: isDark ? '#18181b' : primary }}><span>Thoughtfully made. Ready for you.</span><span className="font-semibold">Shop with confidence</span></div>
    </div>
  )
}
