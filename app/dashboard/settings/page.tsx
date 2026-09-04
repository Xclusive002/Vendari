'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2, LogOut, Save } from 'lucide-react'
import Link from 'next/link'
import { getBusiness, getPaystackBanks, createPaystackSubaccount, verifyBankAccount, type PaystackBank, updateBusiness } from '@/app/actions/business'
import { logout } from '@/app/actions/auth'
import { toast } from 'sonner'
import { LoadingButton } from '@/components/ui/loading-button'
import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsPage() {
  const [businessId, setBusinessId] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [businessEmail, setBusinessEmail] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')
  const [logo, setLogo] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const savingRef = useRef(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [banks, setBanks] = useState<PaystackBank[]>([])
  const [loadingBanks, setLoadingBanks] = useState(true)
  const [bankLoadError, setBankLoadError] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [verificationToken, setVerificationToken] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const [verifyingAccount, setVerifyingAccount] = useState(false)
  const [linkingAccount, setLinkingAccount] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [linkedPayment, setLinkedPayment] = useState({ bankCode: '', accountNumber: '', accountName: '', subaccountCode: '' })
  useEffect(() => {
    getBusiness().then((business) => {
      if (business) {
        setBusinessId(business.id)
        setBusinessName(business.name || '')
        setBusinessEmail(business.email || '')
        setBusinessPhone(business.phone || '')
        setBusinessAddress(business.address || '')
        setLogoPreview(business.logo || '')
        setLinkedPayment({ bankCode: business.bank_code || '', accountNumber: business.bank_account_number || '', accountName: business.bank_account_name || '', subaccountCode: business.paystack_subaccount_code || '' })
      }
    }).finally(() => setLoadingProfile(false))
    loadBanks()
  }, [])

  const loadBanks = async () => {
    setLoadingBanks(true)
    setBankLoadError('')
    const result = await getPaystackBanks()
    if (result.success) {
      setBanks(result.data)
    } else {
      setBankLoadError(result.error || 'Bank names could not be loaded.')
    }
    setLoadingBanks(false)
  }

  useEffect(() => {
    if (!businessId || !bankCode || accountNumber.length !== 10 || accountNumber === linkedPayment.accountNumber) return
    setPaymentError('')
    setAccountName('')
    setVerificationToken('')
    const timeoutId = window.setTimeout(async () => {
      setVerifyingAccount(true)
      try {
        const result = await verifyBankAccount(businessId, bankCode, accountNumber)
        if (result.success) {
          setAccountName(result.data.account_name)
          setVerificationToken(result.data.verification_token)
        } else {
          setPaymentError(result.error || 'We could not verify this account. Check the bank and account number.')
        }
      } finally {
        setVerifyingAccount(false)
      }
    }, 400)
    return () => window.clearTimeout(timeoutId)
  }, [accountNumber, bankCode, businessId, linkedPayment.accountNumber])

  const selectedBankName = banks.find((bank) => bank.code === (linkedPayment.bankCode || bankCode))?.name || linkedPayment.bankCode
  const maskedAccountNumber = linkedPayment.accountNumber ? `••••••${linkedPayment.accountNumber.slice(-4)}` : ''

  const startPaymentSetup = () => {
    setShowPaymentForm(true)
    setBankCode('')
    setAccountNumber('')
    setAccountName('')
    setVerificationToken('')
    setPaymentError('')
  }

  const confirmPaymentSetup = async () => {
    if (!businessId || !bankCode || !accountNumber || !verificationToken) return
    setLinkingAccount(true)
    setPaymentError('')
    try {
      const result = await createPaystackSubaccount(businessId, bankCode, accountNumber, verificationToken)
      if (result.success) {
        setLinkedPayment({ bankCode, accountNumber, accountName: result.data.account_name, subaccountCode: result.data.subaccount_code })
        setShowPaymentForm(false)
        toast.success('Payment account linked successfully')
      } else {
        setPaymentError(result.error || 'Unable to link this account. Please try again.')
      }
    } finally {
      setLinkingAccount(false)
    }
  }

  const handleSave = async () => {
    if (!businessId) return
    if (savingRef.current) return
    savingRef.current = true
    setLoading(true)
    try {
      const result = await updateBusiness(businessId, {
        business_name: businessName,
        business_email: businessEmail,
        business_phone: businessPhone,
        business_address: businessAddress,
        logo,
      })
      if (result.success) {
        const savedBusiness = result.data as { logo?: string }
        if (savedBusiness.logo) setLogoPreview(savedBusiness.logo)
        setLogo(null)
        toast.success('Business details saved')
      } else toast.error(result.error || 'Unable to save business details')
    } catch (error) {
      console.error('[Settings] Error saving settings:', error)
      toast.error(error instanceof Error ? error.message : 'Unable to save business details')
    } finally {
      savingRef.current = false
      setLoading(false)
    }
  }

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setLogo(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="dashboard-page md:pl-8">
      <div className="mx-auto max-w-4xl">
      <div className="grid grid-cols-1 gap-8">
        <div><h1 className="font-display text-3xl font-semibold text-ink">Settings</h1><p className="mt-2 text-text-secondary">Keep your business details and account access up to date.</p></div>
        {/* Business Settings */}
        <Card className="dashboard-panel">
          <CardHeader>
            <CardTitle className="font-display text-ink">Business settings</CardTitle>
            <CardDescription>Manage the business information your team sees.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loadingProfile ? <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> : <>
            <div>
              <Label htmlFor="businessName" className="text-text-secondary">
                Business name
              </Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Enter business name"
                className="dashboard-input mt-2"
              />
            </div>

            <div>
              <Label htmlFor="businessAddress" className="text-text-secondary">Business address</Label>
              <Input id="businessAddress" value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} placeholder="Enter business address" className="dashboard-input mt-2" />
            </div>

            <div>
              <Label htmlFor="businessLogo" className="text-text-secondary">Business logo</Label>
              <Input id="businessLogo" type="file" accept="image/*" onChange={handleLogoChange} className="dashboard-input mt-2" />
              {logoPreview && <div className="mt-3 rounded-lg border border-border bg-bg p-3"><img src={logoPreview} alt="Business logo preview" className="h-20 w-20 object-contain" /></div>}
              <p className="mt-1.5 text-xs text-text-muted">Upload an image for professional receipts and invoices.</p>
            </div>

            <div>
              <Label htmlFor="businessEmail" className="text-text-secondary">
                Business email
              </Label>
              <Input
                id="businessEmail"
                type="email"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                placeholder="Enter business email"
                className="dashboard-input mt-2"
              />
            </div>

            <div>
              <Label htmlFor="businessPhone" className="text-text-secondary">
                Business phone
              </Label>
              <Input
                id="businessPhone"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                placeholder="Enter business phone"
                className="dashboard-input mt-2"
              />
            </div>

            <LoadingButton
              onClick={handleSave}
              loading={loading}
              className="dashboard-primary w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save business settings'}
            </LoadingButton>
            </>}
          </CardContent>
        </Card>

        <Card className="dashboard-panel">
          <CardHeader>
            <CardTitle className="font-display text-ink">Payment settings</CardTitle>
            <CardDescription>Link a Nigerian bank account to receive invoice payments through Paystack.</CardDescription>
          </CardHeader>
          <CardContent>
            {linkedPayment.subaccountCode && !showPaymentForm ? (
              <div className="flex flex-col gap-4 rounded-xl border border-positive/20 bg-positive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-positive" />
                  <div>
                    <p className="font-semibold text-ink">{selectedBankName || 'Linked bank account'}</p>
                    <p className="mt-1 text-sm text-text-secondary">{maskedAccountNumber} · {linkedPayment.accountName}</p>
                    <p className="mt-2 text-xs text-positive">Customers can pay your invoices online.</p>
                  </div>
                </div>
                <Button type="button" variant="outline" onClick={startPaymentSetup}>Change bank details</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {bankLoadError && (
                  <div className="flex items-start justify-between gap-3 rounded-xl border border-negative/20 bg-negative/5 p-4">
                    <div>
                      <p className="font-medium text-negative">Bank list unavailable</p>
                      <p className="mt-1 text-sm text-text-secondary">{bankLoadError}</p>
                    </div>
                    <Button type="button" variant="outline" onClick={loadBanks}>Retry</Button>
                  </div>
                )}
                <div>
                  <Label htmlFor="paymentBank" className="text-text-secondary">Bank</Label>
                  <select id="paymentBank" value={bankCode} onChange={(event) => setBankCode(event.target.value)} disabled={loadingBanks || banks.length === 0} className="dashboard-input mt-2 w-full px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60">
                    <option value="">{loadingBanks ? 'Loading Nigerian banks...' : banks.length ? 'Select your bank' : 'Bank list unavailable'}</option>
                    {banks.map((bank) => <option key={bank.code} value={bank.code}>{bank.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="paymentAccountNumber" className="text-text-secondary">Account number</Label>
                  <div className="relative mt-2">
                    <Input id="paymentAccountNumber" inputMode="numeric" maxLength={10} value={accountNumber} onChange={(event) => setAccountNumber(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit NUBAN account number" className={`dashboard-input pr-12 ${paymentError ? 'border-negative' : ''}`} />
                    {verifyingAccount && <span className="absolute right-3 top-1/2 -translate-y-1/2"><span className="block h-4 w-4 animate-spin rounded-full border-2 border-blue/25 border-t-blue" aria-label="Verifying account" /></span>}
                  </div>
                  {paymentError && <p className="mt-2 text-sm text-negative">{paymentError}</p>}
                </div>
                {accountName && verificationToken && <div className="flex items-start gap-3 rounded-xl border border-positive/20 bg-positive/5 p-4"><CheckCircle2 className="mt-0.5 h-5 w-5 text-positive" /><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-positive">Account verified</p><p className="mt-1 font-semibold text-ink">{accountName}</p><p className="mt-1 text-sm text-text-secondary">Confirm this is the account you want to receive invoice payments.</p></div></div>}
                <div className="flex flex-wrap gap-3">
                  {linkedPayment.subaccountCode && <Button type="button" variant="outline" onClick={() => setShowPaymentForm(false)}>Cancel</Button>}
                  <LoadingButton type="button" loading={linkingAccount} disabled={!verificationToken || verifyingAccount} onClick={confirmPaymentSetup} className="dashboard-primary">{linkingAccount ? 'Linking account...' : 'Confirm and link account'}</LoadingButton>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Security */}
        <Card className="dashboard-panel">
          <CardHeader>
            <CardTitle className="font-display text-ink">Account security</CardTitle>
            <CardDescription>Manage your account access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4 rounded-lg border border-blue/20 bg-blue/5 p-4">
              <AlertCircle className="w-5 h-5 text-blue mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-text-secondary">
                  Your account is protected by secure credentials. If you suspect unauthorized access, contact support immediately.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="dashboard-panel">
          <CardHeader>
            <CardTitle className="font-display text-ink">Danger zone</CardTitle>
            <CardDescription>Actions that cannot be undone.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => { if (window.confirm('Log out of Vendari?')) handleLogout() }}
              variant="destructive"
              className="w-full bg-negative text-white hover:bg-negative/90"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </Button>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  )
}
