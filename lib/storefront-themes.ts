export type StorefrontTheme = {
  key: string
  label: string
  description: string
  mood: string
  preview: string
  primary: string
  accent: string
  surface: string
  ink: string
  radius: string
  hero: string
  card: string
}

export const STOREFRONT_THEMES: StorefrontTheme[] = [
  { key: 'classic', label: 'Classic', description: 'Warm, balanced, and easy to browse.', mood: 'Trusted and welcoming', preview: 'bg-gradient-to-br from-blue-600 to-cyan-500', primary: '#2563eb', accent: '#0f766e', surface: '#f8fafc', ink: '#0f172a', radius: 'rounded-2xl', hero: 'split', card: 'soft' },
  { key: 'bold', label: 'Bold Market', description: 'High-contrast energy for confident brands.', mood: 'Loud and expressive', preview: 'bg-gradient-to-br from-orange-500 to-rose-500', primary: '#ea580c', accent: '#be123c', surface: '#fff7ed', ink: '#431407', radius: 'rounded-3xl', hero: 'panel', card: 'lifted' },
  { key: 'minimal', label: 'Minimal', description: 'Quiet typography and product-first restraint.', mood: 'Calm and precise', preview: 'bg-gradient-to-br from-slate-800 to-slate-500', primary: '#1f2937', accent: '#111827', surface: '#ffffff', ink: '#111827', radius: 'rounded-none', hero: 'clean', card: 'flat' },
  { key: 'editorial', label: 'Editorial', description: 'Magazine-like rhythm for considered businesses.', mood: 'Curated and premium', preview: 'bg-gradient-to-br from-stone-900 to-amber-700', primary: '#292524', accent: '#b45309', surface: '#fafaf9', ink: '#292524', radius: 'rounded-lg', hero: 'editorial', card: 'flat' },
  { key: 'botanical', label: 'Botanical', description: 'Fresh greens and generous breathing room.', mood: 'Natural and thoughtful', preview: 'bg-gradient-to-br from-emerald-700 to-lime-500', primary: '#166534', accent: '#65a30d', surface: '#f7fee7', ink: '#14332a', radius: 'rounded-2xl', hero: 'split', card: 'soft' },
  { key: 'atelier', label: 'Atelier', description: 'A gallery-led canvas for makers and studios.', mood: 'Crafted and artistic', preview: 'bg-gradient-to-br from-violet-800 to-fuchsia-500', primary: '#581c87', accent: '#c026d3', surface: '#fdf4ff', ink: '#3b0764', radius: 'rounded-xl', hero: 'panel', card: 'lifted' },
  { key: 'coastal', label: 'Coastal', description: 'Bright, airy, and friendly for everyday services.', mood: 'Open and optimistic', preview: 'bg-gradient-to-br from-sky-600 to-teal-400', primary: '#0369a1', accent: '#0f766e', surface: '#f0fdfa', ink: '#164e63', radius: 'rounded-2xl', hero: 'split', card: 'soft' },
  { key: 'noir', label: 'Noir', description: 'Dark, cinematic contrast for standout brands.', mood: 'Confident and dramatic', preview: 'bg-gradient-to-br from-zinc-950 to-red-700', primary: '#18181b', accent: '#dc2626', surface: '#27272a', ink: '#fafafa', radius: 'rounded-xl', hero: 'panel', card: 'lifted' },
  { key: 'sunset', label: 'Sunset', description: 'Warm color and approachable commerce energy.', mood: 'Warm and social', preview: 'bg-gradient-to-br from-amber-500 to-pink-500', primary: '#c2410c', accent: '#db2777', surface: '#fff7ed', ink: '#431407', radius: 'rounded-3xl', hero: 'panel', card: 'lifted' },
  { key: 'cobalt', label: 'Cobalt', description: 'Sharp blue structure for modern operators.', mood: 'Focused and modern', preview: 'bg-gradient-to-br from-indigo-800 to-blue-500', primary: '#3730a3', accent: '#0284c7', surface: '#eff6ff', ink: '#172554', radius: 'rounded-xl', hero: 'clean', card: 'soft' },
  { key: 'terracotta', label: 'Terracotta', description: 'Human, tactile, and full of character.', mood: 'Grounded and personable', preview: 'bg-gradient-to-br from-red-800 to-orange-500', primary: '#9a3412', accent: '#d97706', surface: '#fff7ed', ink: '#431407', radius: 'rounded-2xl', hero: 'editorial', card: 'soft' },
  { key: 'lavender', label: 'Lavender', description: 'Soft sophistication for beauty and care brands.', mood: 'Gentle and polished', preview: 'bg-gradient-to-br from-purple-700 to-pink-400', primary: '#7e22ce', accent: '#db2777', surface: '#fdf4ff', ink: '#3b0764', radius: 'rounded-3xl', hero: 'split', card: 'lifted' },
]

export function getStorefrontTheme(key: string) {
  return STOREFRONT_THEMES.find((theme) => theme.key === key) || STOREFRONT_THEMES[0]
}
