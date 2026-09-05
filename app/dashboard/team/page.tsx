'use client'

import { useEffect, useState } from 'react'
import { createBusinessInvite, getBusiness, getBusinessMembers, removeBusinessMember } from '@/app/actions/business'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/ui/loading-button'
import { Users, UserPlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function TeamPage() {
  const [businessId, setBusinessId] = useState('')
  const [members, setMembers] = useState<any[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('staff')
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)

  const load = async () => {
    const business = await getBusiness()
    if (!business) return
    setBusinessId(String(business.id))
    const result = await getBusinessMembers(String(business.id))
    if (result.success) setMembers(result.data)
  }

  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  const invite = async (event: React.FormEvent) => {
    event.preventDefault()
    setInviting(true)
    const result = await createBusinessInvite(businessId, email, role)
    if (result.success) {
      await navigator.clipboard?.writeText(result.data.code)
      toast.success(`Invite created. Code copied: ${result.data.code}`)
      setEmail('')
      await load()
    } else toast.error(result.error)
    setInviting(false)
  }

  const remove = async (memberId: number) => {
    const result = await removeBusinessMember(businessId, memberId)
    if (result.success) { toast.success('Team member removed'); await load() } else toast.error(result.error)
  }

  return <div className="dashboard-page md:pl-8"><main className="mx-auto max-w-4xl"><div className="mb-8"><h1 className="font-display text-3xl font-semibold text-ink">Team</h1><p className="mt-2 text-text-secondary">Invite staff and accountants to help run the business.</p></div><div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]"><Card className="dashboard-panel"><CardHeader><CardTitle className="font-display text-ink">Invite a teammate</CardTitle></CardHeader><CardContent><form onSubmit={invite} className="space-y-4"><Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="teammate@example.com" className="dashboard-input" /><select value={role} onChange={(event) => setRole(event.target.value)} className="dashboard-input w-full px-3 py-2"><option value="staff">Staff</option><option value="accountant">Accountant</option></select><LoadingButton loading={inviting} type="submit" className="dashboard-primary w-full"><UserPlus className="mr-2 h-4 w-4" />Create invite</LoadingButton></form></CardContent></Card><Card className="dashboard-panel"><CardHeader><CardTitle className="font-display text-ink">Members</CardTitle></CardHeader><CardContent>{loading ? <p className="text-sm text-text-secondary">Loading team...</p> : members.length ? <div className="space-y-3">{members.map((member) => <div key={member.id} className="flex items-center justify-between rounded-xl border border-border bg-bg p-3"><div className="flex items-center gap-3"><Users className="h-4 w-4 text-blue" /><div><p className="text-sm font-semibold text-ink">{member.email}</p><p className="text-xs capitalize text-text-muted">{member.role}</p></div></div>{member.role !== 'owner' && <Button type="button" variant="ghost" onClick={() => remove(member.id)} aria-label="Remove team member" className="text-negative"><Trash2 className="h-4 w-4" /></Button>}</div>)}</div> : <p className="text-sm text-text-secondary">No team members yet.</p>}</CardContent></Card></div></main></div>
}
