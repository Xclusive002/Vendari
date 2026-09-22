import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign in to Vendari | Business management workspace',
  description: 'Sign in to your Vendari workspace to manage sales, inventory, customers, expenses, reports, and your storefront.',
  alternates: { canonical: 'https://www.vendari.name.ng/login' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Sign in to Vendari',
    description: 'Access your Vendari business management workspace.',
    url: 'https://www.vendari.name.ng/login',
    type: 'website',
  },
}

export default function LoginLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
