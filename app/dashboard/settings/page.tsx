'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, LogOut, Save } from 'lucide-react'
import Link from 'next/link'
import { createPaystackSubaccount, getBusiness, getPaystackBanks, updateBusiness, verifyBankAccount } from '@/app/actions/business'
import { logout } from '@/app/actions/auth'
import { toast } from 'sonner'

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
  const [banks, setBanks] = useState<{ name: string; code: string }[]>([])
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [verificationToken, setVerificationToken] = useState('')
  const [bankLoading, setBankLoading] = useState(false)

  useEffect(() => {
    getBusiness().then((business) => {
      if (business) {
        setBusinessId(business.id)
        setBusinessName(business.name || '')
        setBusinessEmail(business.email || '')
        setBusinessPhone(business.phone || '')
        setBusinessAddress(business.address || '')
        setLogoPreview(business.logo || '')
        setBankCode(business.bank_code || '')
        setAccountNumber(business.bank_account_number || '')
        setAccountName(business.bank_account_name || '')
      }
    }).finally(() => setLoadingProfile(false))
    getPaystackBanks().then((result) => { if (result.success) setBanks(result.data) })
  }, [])

  const handleVerifyBank = async () => {
    if (!businessId || !bankCode || !accountNumber) return
    setBankLoading(true)
    const result = await verifyBankAccount(businessId, bankCode, accountNumber)
    if (result.success) { setAccountName(result.data.account_name); setVerificationToken(result.data.verification_token); toast.success(`Account verified: ${result.data.account_name}`) }
    else toast.error(result.error)
    setBankLoading(false)
  }

  const handleSaveBank = async () => {
    if (!businessId || !verificationToken) return
    setBankLoading(true)
    const result = await createPaystackSubaccount(businessId, bankCode, accountNumber, verificationToken)
    if (result.success) { setAccountName(result.data.account_name); toast.success('Payment account connected successfully.') }
    else toast.error(result.error)
    setBankLoading(false)
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
        toast.success('Business settings saved successfully!')
      } else toast.error(result.error)
    } catch (error) {
      console.error('[Settings] Error saving settings:', error)
      toast.error('Failed to save settings')
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
        <Link href="/dashboard/settings/billing" className="w-fit rounded-md text-sm font-semibold text-blue hover:text-violet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue">Manage billing</Link>
        <Card className="dashboard-panel">
          <CardHeader><CardTitle className="font-display text-ink">Payment Settings</CardTitle><CardDescription>Connect the bank account where invoice payments should settle.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div><Label htmlFor="bankCode" className="text-text-secondary">Bank</Label><select id="bankCode" value={bankCode} onChange={(e) => { setBankCode(e.target.value); setVerificationToken(''); setAccountName('') }} className="dashboard-input mt-2 w-full"><option value="">Select a bank</option>{banks.map((bank) => <option key={bank.code} value={bank.code}>{bank.name}</option>)}</select></div>
            <div><Label htmlFor="accountNumber" className="text-text-secondary">Account number</Label><Input id="accountNumber" value={accountNumber} onChange={(e) => { setAccountNumber(e.target.value); setVerificationToken(''); setAccountName('') }} className="dashboard-input mt-2" inputMode="numeric" maxLength={10} /></div>
            {accountName && <p className="rounded-md border border-positive/30 bg-positive/10 px-3 py-2 text-sm text-positive">Verified account holder: <strong>{accountName}</strong></p>}
            <div className="flex flex-wrap gap-3"><Button type="button" onClick={handleVerifyBank} disabled={bankLoading || !bankCode || accountNumber.length !== 10} variant="outline">{bankLoading ? 'Checking...' : 'Verify Account'}</Button>{verificationToken && <Button type="button" onClick={handleSaveBank} disabled={bankLoading} className="dashboard-primary">Save Bank Details</Button>}</div>
          </CardContent>
        </Card>
        {/* Business Settings */}
        <Card className="dashboard-panel">
          <CardHeader>
            <CardTitle className="font-display text-ink">Business settings</CardTitle>
            <CardDescription>Manage the business information your team sees.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loadingProfile ? <p className="text-sm text-text-secondary">Loading business profile...</p> : <>
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

            <Button
              onClick={handleSave}
              disabled={loading}
              className="dashboard-primary w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save business settings'}
            </Button>
            </>}
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
