import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { apiFetch } from '@/lib/api-client'
import { getStorefrontUrl } from '@/lib/storefront'
import StorefrontClient from './StorefrontClient'

type StorefrontData = {
  business_name: string
  address: string
  phone: string
  has_payments_enabled: boolean
  storefront: {
    slug: string
    logo: string | null
    social_links: Record<string, string>
    theme: string
    primary_color: string
    accent_color: string
    banner_image: string | null
    description: string
    about: string
    whatsapp_number: string
    delivery_option: string
    opening_hours: Record<string, string>
    business_type_hint: 'products' | 'services' | 'both' | ''
    product_display_mode: 'flexed' | 'block'
  }
  items: Array<{
    id: number
    product_name: string
    description: string
    image: string | null
    images?: string[]
    selling_price: string | number | null
    in_stock: boolean
  }>
  services: Array<{
    name: string
    description: string
    price: string | number | null
    image: string | null
  }>
  gallery_images: Array<{
    image: string
    caption: string
  }>
  opening_hours: Record<string, string>
}

async function getStorefront(slug: string): Promise<StorefrontData | null> {
  const response = await apiFetch(`/storefronts/${encodeURIComponent(slug)}/`, { skipRefresh: true })
  if (response.status === 404) return null
  if (!response.ok) throw new Error('Unable to load storefront')
  return response.json() as Promise<StorefrontData>
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const storefront = await getStorefront(slug)
  if (!storefront) return { title: 'Storefront not found | Vendari' }
  return {
    title: `${storefront.business_name} | Vendari storefront`,
    description: storefront.storefront.description || `Shop ${storefront.business_name} online.`,
    alternates: { canonical: getStorefrontUrl(slug) },
  }
}

export default async function PublicStorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const storefront = await getStorefront(slug)
  if (!storefront) notFound()
  return <StorefrontClient data={storefront} />
}