'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Copy, Facebook, Gift, Info, MessageCircle, TrendingUp, Wallet, X, ChevronRight, ShieldCheck } from 'lucide-react'
import { getReferralDashboardData, getReferralLists, requestWithdrawal, savePayoutAccount } from '@/app/actions/referrals'
import { toast } from 'sonner'

const shareMessages = [
  'Join my membership and get a 14-day free trial with no card needed. Use my link to get started: ',
  'I’m a Vendari member and you can try it free for 14 days with no card needed. Start here: ',
  'Try Vendari with a 14-day free trial and no card needed. Join as a member using my referral link: ',
]

const PAGE_SIZE = 20

function formatKobo(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value / 100)
}

function getStatusTone(status: string) {
  const normalized = status.toLowerCase()
  if (normalized.includes('paid') || normalized.includes('success') || normalized.includes('approved')) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  if (normalized.includes('trial') || normalized.includes('processing')) return 'bg-amber-100 text-amber-700 border-amber-200'
  if (normalized.includes('rejected') || normalized.includes('failed') || normalized.includes('expired')) return 'bg-rose-100 text-rose-700 border-rose-200'
  return 'bg-slate-100 text-slate-700 border-slate-200'
}

function PaginationControls({ data, page, onChange, loading }: { data: any; page: number; onChange: (page: number) => void; loading: boolean }) {
  if (!data || typeof data.count !== 'number') return null

  const pageCount = Math.max(1, Math.ceil(data.count / PAGE_SIZE))
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-sm text-text-secondary">
      <span>{data.count} {data.count === 1 ? 'result' : 'results'} · Page {page} of {pageCount}</span>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => onChange(page - 1)} disabled={loading || !data.previous}>Previous</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange(page + 1)} disabled={loading || !data.next}>Next</Button>
      </div>
    </div>
  )
}

export default function ReferralDashboardPage() {
  const [summary, setSummary] = useState<any>(null)
  const [referralsData, setReferralsData] = useState<any>(null)
  const [commissionsData, setCommissionsData] = useState<any>(null)
  const [payoutsData, setPayoutsData] = useState<any>(null)
  const [banks, setBanks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [referralsPage, setReferralsPage] = useState(1)
  const [commissionsPage, setCommissionsPage] = useState(1)
  const [payoutsPage, setPayoutsPage] = useState(1)
  const [commissionStatus, setCommissionStatus] = useState('all')
  const [payoutStatus, setPayoutStatus] = useState('all')
  const [activeTab, setActiveTab] = useState('referrals')
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [copyState, setCopyState] = useState(false)
  const [accountNumber, setAccountNumber] = useState('')
  const [accountPassword, setAccountPassword] = useState('')
  const [selectedBankCode, setSelectedBankCode] = useState('')
  const [resolvedName, setResolvedName] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawMessage, setWithdrawMessage] = useState('')
  const [withdrawError, setWithdrawError] = useState('')
  const [savingAccount, setSavingAccount] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const summaryResult = await getReferralDashboardData()
        setSummary(summaryResult)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to load referral summary')
      }
    }
    void load()
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const listsResult = await getReferralLists({
          referralsPage,
          commissionsPage,
          payoutsPage,
          commissionStatus,
          payoutStatus,
        })
        setReferralsData(listsResult.referrals)
        setCommissionsData(listsResult.commissions)
        setPayoutsData(listsResult.payouts)
        setBanks(listsResult.banks || [])
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to load referral data')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [referralsPage, commissionsPage, payoutsPage, commissionStatus, payoutStatus])

  const shareLink = summary?.share_link || ''
  const balance = summary?.balance || { pending: 0, approved: 0, paid_total: 0 }
  const counts = summary?.counts || { signups: 0, trials: 0, paid_conversions: 0 }
  const nextTierThreshold = summary?.next_tier_threshold ?? 0
  const currentRate = summary?.current_rate ?? 0
  const nextTierRate = summary?.next_tier?.rate_percent ?? currentRate
  const paidCount = counts.paid_conversions || 0
  const availableForPayout = balance.available ?? balance.approved ?? 0
  const minimumPayout = summary?.minimum_payout ?? 500000
  const progressPercent = Math.min((paidCount / Math.max(nextTierThreshold || paidCount || 1, 1)) * 100, 100)

  const referralRows = referralsData?.results || referralsData || []
  const commissionRows = commissionsData?.results || commissionsData || []
  const payoutRows = payoutsData?.results || payoutsData || []

  const nudgeMessage = useMemo(() => {
    return `Hi there! Just checking in — you can try Vendari with a 14-day free trial and no card needed. Here’s my link: ${shareLink}`
  }, [shareLink])

  async function copyLink() {
    if (!shareLink) {
      toast.error('Your referral link is not ready yet')
      return
    }
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopyState(true)
      toast.success('Referral link copied')
      setTimeout(() => setCopyState(false), 1400)
    } catch {
      toast.error('Copy failed. Please copy the link manually.')
    }
  }

  async function copyShareText() {
    if (!shareLink) {
      toast.error('Your referral link is not ready yet')
      return
    }
    try {
      await navigator.clipboard.writeText(`${shareMessages[0]}${shareLink}`)
      toast.success('Ready-made message copied')
    } catch {
      toast.error('Copy failed. Please try again.')
    }
  }

  function shareNetwork(network: 'whatsapp' | 'facebook' | 'x') {
    if (!shareLink) {
      toast.error('Your referral link is not ready yet')
      return
    }
    const shareText = `${shareMessages[Math.floor(Math.random() * shareMessages.length)]}${shareLink}`
    const encoded = encodeURIComponent(shareText)
    const urls = {
      whatsapp: `https://wa.me/?text=${encoded}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`,
      x: `https://twitter.com/intent/tweet?text=${encoded}`,
    }
    window.open(urls[network], '_blank', 'noopener,noreferrer')
  }

  async function handleWithdraw() {
    if (!resolvedName) {
      setWithdrawError('Verify and save your bank account before withdrawing')
      return
    }
    if (!withdrawAmount) {
      setWithdrawError('Enter an amount to withdraw')
      return
    }

    const amount = Number(withdrawAmount)
    if (Number.isNaN(amount) || amount <= 0) {
      setWithdrawError('Amount must be greater than zero')
      return
    }

    const amountKobo = Math.round(amount * 100)
    if (amountKobo < minimumPayout) {
      setWithdrawError(`Minimum withdrawal is ${formatKobo(minimumPayout)}`)
      return
    }

    if (amountKobo > availableForPayout) {
      setWithdrawError(`You can only withdraw up to ${formatKobo(availableForPayout)}`)
      return
    }

    setWithdrawing(true)
    setWithdrawError('')
    try {
      const result = await requestWithdrawal(amountKobo)
      toast.success('Withdrawal request created')
      setWithdrawMessage(`Your withdrawal is processing. Reference: ${result.reference || 'pending'}`)
      setWithdrawAmount('')
    } catch (error) {
      setWithdrawError(error instanceof Error ? error.message : 'Withdrawal failed')
    } finally {
      setWithdrawing(false)
    }
  }

  async function handleAccountSave() {
    if (!selectedBankCode || !accountNumber) {
      setWithdrawError('Select a bank and enter your account number')
      return
    }
    if (!/^\d{10}$/.test(accountNumber)) {
      setWithdrawError('Enter a valid 10-digit bank account number')
      return
    }

    setSavingAccount(true)
    setWithdrawError('')
    try {
      const result = await savePayoutAccount(selectedBankCode, accountNumber, accountPassword)
      setResolvedName(result.account_name || '')
      setAccountPassword('')
      if (!result.account_name) setWithdrawError('The bank did not return an account name. Please try again.')
      toast.success('Payout account saved')
    } catch (error) {
      setResolvedName('')
      setWithdrawError(error instanceof Error ? error.message : 'Could not save payout account')
      toast.error(error instanceof Error ? error.message : 'Could not save payout account')
    } finally {
      setSavingAccount(false)
    }
  }

  const referralTable = (
    <div className="space-y-4">
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="grid animate-pulse gap-3 rounded-xl border border-border bg-surface p-3 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
              <div className="h-4 w-24 rounded bg-bg" />
              <div className="h-4 w-20 rounded bg-bg" />
              <div className="h-4 w-16 rounded bg-bg" />
              <div className="h-4 w-14 rounded bg-bg" />
            </div>
          ))}
        </div>
      ) : referralRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-bg p-6 text-center text-sm text-text-secondary">No referrals yet. Share your link to get started.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-text-secondary">
              <tr><th className="px-3 py-3 font-medium">Member</th><th className="px-3 py-3 font-medium">Status</th><th className="px-3 py-3 font-medium">Commission earned</th><th className="px-3 py-3 text-right font-medium">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {referralRows.map((entry: any) => (
                <tr key={entry.id}>
                  <td className="px-3 py-3">
                    <p className="font-medium text-ink">{entry.referred_name}</p>
                    <p className="text-xs text-text-secondary">Joined {entry.joined_date}</p>
                  </td>
                  <td className="px-3 py-3"><Badge className={getStatusTone(entry.status)}>{entry.status}</Badge></td>
                  <td className="px-3 py-3 font-medium text-ink">{formatKobo(entry.commission_earned || 0)}</td>
                  <td className="px-3 py-3 text-right">
                    {entry.status === 'Trial' ? (
                      <a href={`https://wa.me/?text=${encodeURIComponent(nudgeMessage)}`} target="_blank" rel="noreferrer" aria-disabled={!shareLink} onClick={(event) => { if (!shareLink) event.preventDefault() }} className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2 text-sm font-medium text-ink aria-disabled:cursor-not-allowed aria-disabled:opacity-50">
                        <MessageCircle className="h-4 w-4" /> Nudge on WhatsApp
                      </a>
                    ) : <span className="text-text-secondary">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <PaginationControls data={referralsData} page={referralsPage} onChange={setReferralsPage} loading={loading} />
    </div>
  )

  const commissionTable = (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-text-secondary">Filter by status</span>
        <select aria-label="Filter commissions by status" value={commissionStatus} onChange={(event) => { setCommissionStatus(event.target.value); setCommissionsPage(1) }} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink">
          <option value="all">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="paid">Paid</option><option value="reversed">Reversed</option>
        </select>
      </div>
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="grid animate-pulse gap-3 rounded-xl border border-border bg-surface p-3 md:grid-cols-[1.4fr_1fr_1fr_1fr]"><div className="h-4 w-24 rounded bg-bg" /><div className="h-4 w-20 rounded bg-bg" /><div className="h-4 w-16 rounded bg-bg" /><div className="h-4 w-20 rounded bg-bg" /></div>)}</div>
      ) : commissionRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-bg p-6 text-center text-sm text-text-secondary">No commission activity yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-text-secondary">
              <tr><th className="px-3 py-3 font-medium">Member</th><th className="px-3 py-3 font-medium">Status</th><th className="px-3 py-3 font-medium">Source</th><th className="px-3 py-3 text-right font-medium">Amount</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {commissionRows.map((entry: any) => (
                <tr key={entry.id}>
                  <td className="px-3 py-3"><p className="font-medium text-ink">{entry.referred_name}</p><p className="text-xs text-text-secondary">{entry.payment_reference}</p></td>
                  <td className="px-3 py-3"><Badge className={getStatusTone(entry.status)}>{entry.status}</Badge></td>
                  <td className="px-3 py-3"><p className="font-medium text-ink">{entry.source}</p><p className="text-xs text-text-secondary">{entry.rate_percent}% rate</p></td>
                  <td className="px-3 py-3 text-right font-medium text-ink">{formatKobo(entry.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <PaginationControls data={commissionsData} page={commissionsPage} onChange={setCommissionsPage} loading={loading} />
    </div>
  )

  const payoutTable = (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-text-secondary">Filter by status</span>
        <select aria-label="Filter payouts by status" value={payoutStatus} onChange={(event) => { setPayoutStatus(event.target.value); setPayoutsPage(1) }} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink">
          <option value="all">All statuses</option><option value="processing">Processing</option><option value="success">Success</option><option value="failed">Failed</option><option value="reversed">Reversed</option>
        </select>
      </div>
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="grid animate-pulse gap-3 rounded-xl border border-border bg-surface p-3 md:grid-cols-[1.5fr_1fr_1fr_1fr]"><div className="h-4 w-24 rounded bg-bg" /><div className="h-4 w-20 rounded bg-bg" /><div className="h-4 w-20 rounded bg-bg" /><div className="h-4 w-18 rounded bg-bg" /></div>)}</div>
      ) : payoutRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-bg p-6 text-center text-sm text-text-secondary">No payouts yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-text-secondary">
              <tr><th className="px-3 py-3 font-medium">Reference</th><th className="px-3 py-3 font-medium">Status</th><th className="px-3 py-3 font-medium">Transfer</th><th className="px-3 py-3 text-right font-medium">Amount</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payoutRows.map((entry: any) => (
                <tr key={entry.id}>
                  <td className="px-3 py-3"><p className="font-medium text-ink">{entry.reference}</p><p className="text-xs text-text-secondary">{entry.created_at?.slice(0, 10)}</p></td>
                  <td className="px-3 py-3"><Badge className={getStatusTone(entry.status)}>{entry.status}</Badge></td>
                  <td className="px-3 py-3 text-text-secondary">{entry.paystack_transfer_code || '—'}</td>
                  <td className="px-3 py-3 text-right font-medium text-ink">{formatKobo(entry.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <PaginationControls data={payoutsData} page={payoutsPage} onChange={setPayoutsPage} loading={loading} />
    </div>
  )

  return (
    <main className="min-h-screen bg-bg px-4 pb-16 pt-20 sm:px-6 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="overflow-hidden border-blue/20 bg-gradient-to-br from-blue-50 via-surface to-brand/5">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue/20 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue">
                  <Gift className="h-3.5 w-3.5" /> Refer & Earn
                </div>
                <div>
                  <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Invite friends. Earn when they become members.</h1>
                  <p className="mt-2 max-w-xl text-sm text-text-secondary">Share your link, give a friend 14 days free with no card required, and earn when they become a paying member.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={copyLink} disabled={!shareLink} className="gap-2"><Copy className="h-4 w-4" /> {copyState ? 'Copied' : 'Copy link'}</Button>
                <Button type="button" onClick={() => shareNetwork('whatsapp')} disabled={!shareLink} className="gap-2"><MessageCircle className="h-4 w-4" /> WhatsApp</Button>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-white/80 p-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex-1 break-all text-sm font-medium text-ink">{shareLink || 'Preparing your referral link…'}</div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={!shareLink} onClick={() => shareNetwork('whatsapp')} className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2 text-xs font-semibold text-ink disabled:opacity-50"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</button>
                  <button type="button" disabled={!shareLink} onClick={() => shareNetwork('facebook')} className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2 text-xs font-semibold text-ink disabled:opacity-50"><Facebook className="h-3.5 w-3.5" /> Facebook</button>
                  <button type="button" disabled={!shareLink} onClick={() => shareNetwork('x')} className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2 text-xs font-semibold text-ink disabled:opacity-50"><X className="h-3.5 w-3.5" /> X</button>
                  <button type="button" disabled={!shareLink} onClick={copyShareText} className="inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><Copy className="h-3.5 w-3.5" /> Copy text</button>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {shareMessages.map((message, index) => (
                <button key={message} type="button" disabled={!shareLink} onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(`${message}${shareLink}`)
                    toast.success(`Message ${index + 1} copied`)
                  } catch {
                    toast.error('Copy failed. Please try again.')
                  }
                }} className="rounded-xl border border-border bg-surface/80 px-3 py-2 text-left text-sm text-text-secondary hover:bg-bg disabled:opacity-50">
                  {message}{shareLink || 'Your referral link will appear here'}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Pending</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="rounded-full border border-border p-1 text-text-secondary"><Info className="h-3.5 w-3.5" /></button>
                    </TooltipTrigger>
                    <TooltipContent>We hold earnings for 14 days before approval, and you earn when a referral becomes a paying member.</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="mt-4 font-display text-2xl font-semibold text-ink">{formatKobo(balance.pending || 0)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Available</span>
                <Wallet className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-4 font-display text-2xl font-semibold text-ink">{formatKobo(availableForPayout)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Paid out</span>
                <TrendingUp className="h-4 w-4 text-blue" />
              </div>
              <p className="mt-4 font-display text-2xl font-semibold text-ink">{formatKobo(balance.paid_total || 0)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-xl">Tier progress</CardTitle>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="font-medium text-ink">{currentRate}%</span>
                <span>rate</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Progress value={progressPercent} className="h-3" />
              <div className="flex items-center justify-between text-sm text-text-secondary">
                <span>{paidCount} paid referrals</span>
                <span>{nextTierThreshold ? `${Math.max(0, nextTierThreshold - paidCount)} more to unlock ${nextTierRate}%` : 'Top tier unlocked'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-bg">
                <TabsTrigger value="referrals">Referrals</TabsTrigger>
                <TabsTrigger value="commissions">Commissions</TabsTrigger>
                <TabsTrigger value="payouts">Payouts</TabsTrigger>
              </TabsList>

              <TabsContent value="referrals" className="mt-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Referrals</p>
                    <p className="mt-1 text-sm text-text-secondary">{counts.signups} total · {counts.trials} active trial · {counts.paid_conversions} paid</p>
                  </div>
                  <Button type="button" variant="outline" className="gap-2" onClick={() => { setWithdrawError(''); setWithdrawMessage(''); setShowWithdraw(true) }} disabled={Boolean(summary?.payout_held)}>
                    <Wallet className="h-4 w-4" /> Withdraw
                  </Button>
                </div>
                {summary?.payout_held && <p role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Withdrawals are temporarily paused while your referral account is reviewed.</p>}
                {summary?.payout_lock_until && new Date(summary.payout_lock_until) > new Date() && <p role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Bank account changed recently. Withdrawals unlock {new Date(summary.payout_lock_until).toLocaleString()}.</p>}
                {referralTable}
              </TabsContent>

              <TabsContent value="commissions" className="mt-4">{commissionTable}</TabsContent>
              <TabsContent value="payouts" className="mt-4">{payoutTable}</TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><ShieldCheck className="h-5 w-5 text-emerald-600" /> How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-text-secondary">
            <ol className="space-y-3 list-decimal pl-5">
              <li>Share your referral link with a friend.</li>
              <li>They get a 14-day free trial with no card needed.</li>
              <li>You earn when they become a paying member.</li>
              <li>We hold earnings for 14 days before approval, then you can withdraw once you hit the minimum.</li>
            </ol>
            <Link href="/referral-terms" className="inline-flex items-center gap-2 text-sm font-medium text-blue hover:underline">
              Read referral terms <ChevronRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 md:items-center">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-modal)]">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-ink">Withdraw</h2>
              <button type="button" onClick={() => setShowWithdraw(false)} className="rounded-full border border-border p-2 text-text-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">Bank</label>
                <select value={selectedBankCode} onChange={(event) => { setSelectedBankCode(event.target.value); setResolvedName(''); setWithdrawError('') }} className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-ink outline-none ring-0 focus:border-blue">
                  <option value="">Select your bank</option>
                  {(banks || []).map((bank: any) => (
                    <option key={bank.code} value={bank.code}>{bank.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">Account number</label>
                <input value={accountNumber} onChange={(event) => { setAccountNumber(event.target.value.replace(/\D/g, '').slice(0, 10)); setResolvedName(''); setWithdrawError('') }} inputMode="numeric" autoComplete="off" maxLength={10} placeholder="0123456789" className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-ink outline-none focus:border-blue" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">Password confirmation (for account changes)</label>
                <input type="password" value={accountPassword} onChange={(event) => setAccountPassword(event.target.value)} autoComplete="current-password" className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-ink outline-none focus:border-blue" />
              </div>

              <Button type="button" variant="outline" className="w-full gap-2" onClick={handleAccountSave} disabled={savingAccount || accountNumber.length !== 10 || !selectedBankCode}>
                {savingAccount ? 'Checking account...' : 'Verify and save account'}
              </Button>

              {resolvedName && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Account name: {resolvedName}</div>}

              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">Amount to withdraw</label>
                <input value={withdrawAmount} onChange={(event) => { setWithdrawAmount(event.target.value); setWithdrawError(''); setWithdrawMessage('') }} inputMode="decimal" placeholder="5000" className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-ink outline-none focus:border-blue" />
                <p className="mt-2 text-xs text-text-secondary">Minimum: {formatKobo(minimumPayout)} · Available: {formatKobo(availableForPayout)}</p>
              </div>

              {withdrawError && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{withdrawError}</div>}
              {withdrawMessage && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{withdrawMessage}</div>}

              <Button type="button" onClick={handleWithdraw} className="w-full gap-2" disabled={withdrawing || !resolvedName || Boolean(summary?.payout_held) || Boolean(summary?.payout_lock_until && new Date(summary.payout_lock_until) > new Date())}>
                {withdrawing ? 'Submitting...' : 'Withdraw now'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
