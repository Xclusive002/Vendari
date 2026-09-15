'use client'

import { useEffect, useState } from 'react'
import { Check, Clock3, Copy, MailPlus, ShieldCheck, Trash2, UserRound, Users, X } from 'lucide-react'
import { createBusinessInvite, getBusiness, getBusinessMembers, removeBusinessMember, revokeBusinessInvite, updateBusinessMemberRole } from '@/app/actions/business'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/ui/loading-button'
import { toast } from 'sonner'

const roleLabels: Record<string, string> = { owner: 'Owner', staff: 'Staff', accountant: 'Accountant' }

export default function TeamPage() {
  const [businessId, setBusinessId] = useState('')
  const [members, setMembers] = useState<any[]>([])
  const [invites, setInvites] = useState<any[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('staff')
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [workingId, setWorkingId] = useState<number | null>(null)

  const load = async () => {
    const business = await getBusiness()
    if (!business) return
    setBusinessId(String(business.id))
    const result = await getBusinessMembers(String(business.id))
    if (result.success) {
      setMembers(result.data.members || [])
      setInvites(result.data.invites || [])
    } else if ('error' in result) toast.error(result.error)
  }

  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  const invite = async (event: React.FormEvent) => {
    event.preventDefault()
    setInviting(true)
    const result = await createBusinessInvite(businessId, email, role)
    if (result.success) {
      await navigator.clipboard?.writeText(result.data.code)
      toast.success('Invite created and code copied')
      setEmail('')
      await load()
    } else toast.error(result.error)
    setInviting(false)
  }

  const withWorking = async (id: number, action: () => Promise<any>, success: string) => {
    setWorkingId(id)
    const result = await action()
    if (result.success) { toast.success(success); await load() } else toast.error(result.error)
    setWorkingId(null)
  }

  return (
    <div className="dashboard-page md:pl-8">
      <main className="mx-auto max-w-6xl space-y-6">
        <header className="relative overflow-hidden rounded-2xl border border-blue/20 bg-[linear-gradient(120deg,#0b1733,#163d67)] px-6 py-8 text-white shadow-sm sm:px-8">
          <div className="relative max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Workspace access</p>
            <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Build a team that moves with you.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100">Invite trusted people, give them the right level of access, and keep every role visible as your business grows.</p>
          </div>
          <Users className="absolute -right-4 -top-5 h-40 w-40 text-white/10" />
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="flex items-center gap-3 p-5"><Users className="h-5 w-5 text-blue" /><div><p className="text-2xl font-semibold text-ink">{members.length}</p><p className="text-xs text-text-muted">Active members</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-5"><Clock3 className="h-5 w-5 text-amber-600" /><div><p className="text-2xl font-semibold text-ink">{invites.length}</p><p className="text-xs text-text-muted">Pending invites</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-5"><ShieldCheck className="h-5 w-5 text-emerald-600" /><div><p className="text-2xl font-semibold text-ink">{members.filter((member) => member.role === 'owner').length}</p><p className="text-xs text-text-muted">Workspace owners</p></div></CardContent></Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <Card className="border-blue/20">
            <CardHeader><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue/10 text-blue"><MailPlus className="h-5 w-5" /></span><div><CardTitle className="text-ink">Invite a teammate</CardTitle><p className="mt-1 text-xs text-text-muted">They will join with the role you choose.</p></div></div></CardHeader>
            <CardContent><form onSubmit={invite} className="space-y-4"><div><label className="text-sm font-medium text-text-secondary">Email address</label><Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="teammate@example.com" className="dashboard-input mt-2" /></div><div><label className="text-sm font-medium text-text-secondary">Workspace role</label><select value={role} onChange={(event) => setRole(event.target.value)} className="dashboard-input mt-2 w-full px-3 py-2"><option value="staff">Staff · daily operations</option><option value="accountant">Accountant · money and reports</option></select></div><LoadingButton loading={inviting} type="submit" className="dashboard-primary w-full"><MailPlus className="mr-2 h-4 w-4" />Create invite</LoadingButton></form></CardContent>
          </Card>

          <Card><CardHeader><CardTitle className="text-ink">People with access</CardTitle><p className="text-sm text-text-secondary">Manage roles without losing sight of who is working in the workspace.</p></CardHeader><CardContent>{loading ? <p className="text-sm text-text-secondary">Loading team...</p> : members.length ? <div className="space-y-3">{members.map((member) => <div key={member.id} className="flex flex-col gap-3 rounded-xl border border-border bg-bg p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue/10 text-blue"><UserRound className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{member.email}</p><p className="mt-1 text-xs text-text-muted">Added {new Date(member.created_at).toLocaleDateString()}</p></div></div><div className="flex items-center gap-2">{member.role === 'owner' ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"><Check className="h-3 w-3" />Owner</span> : <><select value={member.role} onChange={(event) => withWorking(member.id, () => updateBusinessMemberRole(businessId, member.id, event.target.value), 'Role updated')} className="dashboard-input px-2 py-1.5 text-xs"><option value="staff">Staff</option><option value="accountant">Accountant</option></select><Button type="button" variant="ghost" size="sm" disabled={workingId === member.id} onClick={() => withWorking(member.id, () => removeBusinessMember(businessId, member.id), 'Team member removed')} className="text-negative hover:bg-negative/10" aria-label={`Remove ${member.email}`}><Trash2 className="h-4 w-4" /></Button></>}</div></div>)}</div> : <div className="rounded-xl border border-dashed border-border px-5 py-10 text-center"><Users className="mx-auto h-8 w-8 text-text-muted" /><p className="mt-3 text-sm font-semibold text-ink">You are the only member</p><p className="mt-1 text-sm text-text-secondary">Invite someone to share the work.</p></div>}</CardContent></Card>
        </div>

        <Card><CardHeader><CardTitle className="text-ink">Pending invites</CardTitle><p className="text-sm text-text-secondary">Share a code with each teammate. Codes expire after seven days.</p></CardHeader><CardContent>{invites.length ? <div className="grid gap-3 md:grid-cols-2">{invites.map((invite) => <div key={invite.id} className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4"><div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{invite.email}</p><p className="mt-1 text-xs text-amber-800">{roleLabels[invite.role] || invite.role} · expires {new Date(invite.expires_at).toLocaleDateString()}</p><p className="mt-2 font-mono text-xs text-text-secondary">{invite.code}</p></div><div className="flex shrink-0 gap-1"><Button type="button" variant="ghost" size="sm" onClick={() => navigator.clipboard?.writeText(invite.code).then(() => toast.success('Invite code copied'))} aria-label={`Copy invite for ${invite.email}`}><Copy className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="sm" onClick={() => withWorking(invite.id, () => revokeBusinessInvite(businessId, invite.id), 'Invite revoked')} className="text-negative hover:bg-negative/10" aria-label={`Revoke invite for ${invite.email}`}><X className="h-4 w-4" /></Button></div></div>)}</div> : <p className="py-8 text-center text-sm text-text-secondary">No pending invites right now.</p>}</CardContent></Card>
      </main>
    </div>
  )
}
