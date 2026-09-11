import React from "react"
import type { Metadata } from 'next'
import type { Viewport } from 'next'

import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const siteUrl = 'https://www.vendari.name.ng'
const siteDescription = 'All-in-one business management software for retailers and service businesses.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Vendari - Business Management Software',
  description: siteDescription,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    title: 'Vendari - Business Management Software',
    description: siteDescription,
    url: siteUrl,
    siteName: 'Vendari',
    images: [
      {
        url: '/vendari-logo-png.png',
        alt: 'Vendari logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Vendari - Business Management Software',
    description: siteDescription,
    images: ['/vendari-logo-png.png'],
  },
  generator: 'v0.app',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Vendari',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'mobile-web-app-status-bar-style': 'black-translucent',
    'google-site-verification': 'e3Td5zQws0eWm1p-GORToY8Hjs20FJmXJsgz2ORne8I',
  },
}

export function generateViewport(): Viewport {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    viewportFit: 'cover',
    themeColor: '#06122B',
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Vendari',
    url: siteUrl,
    logo: `${siteUrl}/vendari-logo-png.png`,
    sameAs: [
      'https://www.tiktok.com/@vendari_ng?_r=1&_t=ZS-99dm8ICiMdT',
      'https://x.com/vendarihq?s=11',
    ],
    description: siteDescription,
  }

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <meta name="theme-color" content="#06122B" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Vendari" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" />
        <meta name="msapplication-TileColor" content="#06122B" />
        <meta name="google-site-verification" content="e3Td5zQws0eWm1p-GORToY8Hjs20FJmXJsgz2ORne8I" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  )
}
