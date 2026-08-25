'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, LogOut, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SettingsPage() {
  const router = useRouter()
  const [businessName, setBusinessName] = useState('')
  const [businessEmail, setBusinessEmail] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      // Save business settings to localStorage for now
      localStorage.setItem('profitpilot_business_name', businessName)
      localStorage.setItem('profitpilot_business_email', businessEmail)
      localStorage.setItem('profitpilot_business_phone', businessPhone)
      
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('[v0] Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('profitpilot_access_token')
    localStorage.removeItem('profitpilot_business_id')
    localStorage.removeItem('profitpilot_user_has_paid')
    router.push('/login')
  }

  return (
    <div className="dashboard-page md:pl-8">
      <div className="mx-auto max-w-4xl">
      <div className="grid grid-cols-1 gap-8">
        <div><h1 className="font-display text-3xl font-semibold text-ink">Settings</h1><p className="mt-2 text-text-secondary">Keep your business details and account access up to date.</p></div>
        <Link href="/dashboard/settings/billing" className="w-fit rounded-md text-sm font-semibold text-blue hover:text-violet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue">Manage billing</Link>
        {/* Business Settings */}
        <Card className="dashboard-panel">
          <CardHeader>
            <CardTitle className="font-display text-ink">Business settings</CardTitle>
            <CardDescription>Manage the business information your team sees.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
