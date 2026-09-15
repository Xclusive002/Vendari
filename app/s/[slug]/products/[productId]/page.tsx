import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { apiFetch } from '@/lib/api-client'
import { getStorefrontUrl } from '@/lib/storefront'
import ProductDetailClient from './ProductDetailClient'

type ProductDetailData = {
  product_name: string
  description: string
  image: string | null
  images?: string[]
  selling_price: string | number
  in_stock: boolean
}

type StorefrontDetailData = {
  business_name: string
  storefront: {
    slug: string
    logo: string | null
    theme: string
    primary_color: string
    accent_color: string
    banner_image: string | null
  }
  product: ProductDetailData
}

async function getProduct(slug: string, productId: string): Promise<StorefrontDetailData | null> {
  const response = await apiFetch(`/storefronts/${encodeURIComponent(slug)}/products/${encodeURIComponent(productId)}/`, { skipRefresh: true })
  if (response.status === 404) return null
  if (!response.ok) throw new Error('Unable to load product')
  return response.json() as Promise<StorefrontDetailData>
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; productId: string }> }): Promise<Metadata> {
  const { slug, productId } = await params
  const data = await getProduct(slug, productId)
  if (!data) return { title: 'Product not found | Vendari' }
  return {
    title: `${data.product.product_name} | ${data.business_name}`,
    description: data.product.description || `Shop ${data.product.product_name} from ${data.business_name}.`,
    alternates: { canonical: `${getStorefrontUrl(slug)}/products/${productId}` },
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string; productId: string }> }) {
  const { slug, productId } = await params
  const data = await getProduct(slug, productId)
  if (!data) notFound()
  return <ProductDetailClient data={data} />
}