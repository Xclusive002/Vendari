import React from "react"
import type { Metadata } from 'next'
import type { Viewport } from 'next'

import { Toaster } from '@/components/ui/sonner'
import { AppInstallPrompt } from '@/components/ui/app-install-prompt'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vendari - Business Management Software',
  description: 'Modern business management software for sales tracking, inventory management, and operational insight',
  generator: 'v0.app',
  manifest: '/manifest.json',
  icons: {
    icon: '/vendari-app-logo.jpeg',
    apple: '/vendari-app-logo.jpeg',
    shortcut: '/vendari-app-logo.jpeg',
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
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#06122B" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Vendari" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" />
        <meta name="msapplication-TileColor" content="#06122B" />
      </head>
      <body className="font-body antialiased">
        {children}
        <AppInstallPrompt />
        <Toaster richColors closeButton position="top-right" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('[PWA] ServiceWorker registration failed: ', err)
                  })
                })
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
