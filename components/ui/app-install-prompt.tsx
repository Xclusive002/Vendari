'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, Share2, Smartphone, X } from 'lucide-react'

const APP_NAME = 'Vendari NG'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function AppInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const userAgent = navigator.userAgent || ''
    const mobile = /Android|iPhone|iPad|iPod/i.test(userAgent)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true

    setIsMobile(mobile)
    setIsStandalone(standalone)

    if (mobile && !standalone) {
      window.setTimeout(() => {
        setShowPrompt(true)
      }, 1800)
    }

    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const onChange = () => setIsStandalone(mediaQuery.matches)
    mediaQuery.addEventListener?.('change', onChange)

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setPromptEvent(event as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      mediaQuery.removeEventListener?.('change', onChange)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const shouldRender = useMemo(() => isMobile && !isStandalone, [isMobile, isStandalone])

  if (!shouldRender) return null

  const handleInstall = async () => {
    if (!promptEvent) {
      setShowInstructions(true)
      return
    }

    await promptEvent.prompt()
    const choice = await promptEvent.userChoice
    if (choice.outcome === 'accepted') {
      setShowPrompt(false)
    } else {
      setShowPrompt(false)
    }
  }

  return (
    <>
      {showPrompt && (
        <div className="install-prompt-wrap">
          <div className="install-prompt-card welcome-modal">
            <button type="button" aria-label="Dismiss install prompt" className="install-prompt-close" onClick={() => setShowPrompt(false)}>
              <X className="h-4 w-4" />
            </button>

            <div className="install-prompt-icon">
              <Download className="h-5 w-5" />
            </div>

            <div>
              <p className="install-prompt-label">Better access</p>
              <h3 className="install-prompt-title">Install {APP_NAME}</h3>
              <p className="install-prompt-copy">Add Vendari NG to your home screen for a faster, app-like experience without an App Store or Play Store.</p>
            </div>

            <div className="install-prompt-actions">
              <button type="button" className="install-prompt-primary" onClick={handleInstall}>
                Install app
              </button>
              <button type="button" className="install-prompt-secondary" onClick={() => setShowInstructions(true)}>
                How it works
              </button>
            </div>
          </div>
        </div>
      )}

      {showInstructions && (
        <div className="install-guide-backdrop" onClick={() => setShowInstructions(false)}>
          <div className="install-guide-modal welcome-modal" onClick={(event) => event.stopPropagation()}>
            <div className="install-guide-header">
              <div>
                <p className="install-prompt-label">Install guide</p>
                <h3 className="install-prompt-title">Add {APP_NAME} to your home screen</h3>
              </div>
              <button type="button" aria-label="Close install guide" className="install-prompt-close" onClick={() => setShowInstructions(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="install-guide-grid">
              <div className="install-guide-panel">
                <div className="install-guide-icon"><Share2 className="h-5 w-5" /></div>
                <h4>iPhone / iPad</h4>
                <ol>
                  <li>Open Vendari in Safari.</li>
                  <li>Tap the Share button.</li>
                  <li>Select “Add to Home Screen”.</li>
                  <li>Tap “Add” to finish.</li>
                </ol>
              </div>

              <div className="install-guide-panel">
                <div className="install-guide-icon"><Smartphone className="h-5 w-5" /></div>
                <h4>Android</h4>
                <ol>
                  <li>Open Vendari in Chrome.</li>
                  <li>Tap the three-dot menu.</li>
                  <li>Select “Install app” or “Add to Home screen”.</li>
                  <li>Confirm the installation.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
