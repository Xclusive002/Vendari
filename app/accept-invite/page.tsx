import { Suspense } from 'react'
import AcceptInviteForm from './AcceptInviteForm'

function AcceptInviteFallback() {
  return <main className="auth-shell"><div className="auth-card"><section className="border-t border-border bg-surface"><div className="auth-inner"><div className="h-48 animate-pulse rounded-lg bg-bg" /></div></section></div></main>
}

export default function AcceptInvitePage() {
  return <Suspense fallback={<AcceptInviteFallback />}><AcceptInviteForm /></Suspense>
}
