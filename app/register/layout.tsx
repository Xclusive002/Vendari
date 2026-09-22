import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create your Vendari account | Business management app',
  description: 'Create a Vendari workspace and start managing sales, inventory, customers, expenses, reports, and storefront operations in one place.',
  alternates: { canonical: 'https://www.vendari.name.ng/register' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Create your Vendari account',
    description: 'Start a clearer business management workspace with Vendari.',
    url: 'https://www.vendari.name.ng/register',
    type: 'website',
  },
}

export default function RegisterLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
