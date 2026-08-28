'use client'

import React from "react"

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createBusiness } from '@/app/actions/business'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { LoadingButton } from '@/components/ui/loading-button'

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const submittingRef = useRef(false)
  const router = useRouter()
  const [formData, setFormData] = useState({
    business_name: '',
    business_email: '',
    business_phone: '',
    business_address: '',
    business_type: '',
    registration_number: '',
    tax_id: '',
    industry: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submittingRef.current) return

    if (!formData.business_name.trim()) {
      toast.error('Business name is required')
      return
    }

    submittingRef.current = true
    setLoading(true)

    try {
      const result = await createBusiness(formData)

      if (result.success) {
        toast.success('Business setup completed!')
        router.push('/dashboard')
      } else {
        toast.error(result.error || 'Failed to setup business')
      }
    } catch (error) {
      console.error('[Setup] Error:', error)
      toast.error('An error occurred')
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="text-3xl text-white">Set Up Your Business</CardTitle>
            <CardDescription className="text-slate-400">
              Provide your business details to get started with Vendari
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Business Name - Required */}
              <div className="space-y-2">
                <label htmlFor="businessName" className="text-sm font-medium text-slate-300">
                  Business Name <span className="text-red-400">*</span>
                </label>
                <Input
                  id="businessName"
                  name="business_name"
                  placeholder="Your Business Name"
                  value={formData.business_name}
                  onChange={handleChange}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  disabled={loading}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Business Email */}
                <div className="space-y-2">
                  <label htmlFor="businessEmail" className="text-sm font-medium text-slate-300">
                    Business Email
                  </label>
                  <Input
                    id="businessEmail"
                    name="business_email"
                    type="email"
                    placeholder="business@example.com"
                    value={formData.business_email}
                    onChange={handleChange}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                    disabled={loading}
                  />
                </div>

                {/* Business Phone */}
                <div className="space-y-2">
                  <label htmlFor="businessPhone" className="text-sm font-medium text-slate-300">
                    Business Phone
                  </label>
                  <Input
                    id="businessPhone"
                    name="business_phone"
                    placeholder="+234 (0) 123-4567"
                    value={formData.business_phone}
                    onChange={handleChange}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Business Address */}
              <div className="space-y-2">
                <label htmlFor="businessAddress" className="text-sm font-medium text-slate-300">
                  Business Address
                </label>
                <Input
                  id="businessAddress"
                  name="business_address"
                  placeholder="123 Main Street, City, State"
                  value={formData.business_address}
                  onChange={handleChange}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Business Type */}
                <div className="space-y-2">
                  <label htmlFor="businessType" className="text-sm font-medium text-slate-300">
                    Business Type
                  </label>
                  <Input
                    id="businessType"
                    name="business_type"
                    placeholder="e.g., Retail, Manufacturing"
                    value={formData.business_type}
                    onChange={handleChange}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                    disabled={loading}
                  />
                </div>

                {/* Industry */}
                <div className="space-y-2">
                  <label htmlFor="industry" className="text-sm font-medium text-slate-300">
                    Industry
                  </label>
                  <Input
                    id="industry"
                    name="industry"
                    placeholder="e.g., Technology, Fashion"
                    value={formData.industry}
                    onChange={handleChange}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Registration Number */}
                <div className="space-y-2">
                  <label htmlFor="registrationNumber" className="text-sm font-medium text-slate-300">
                    Registration Number
                  </label>
                  <Input
                    id="registrationNumber"
                    name="registration_number"
                    placeholder="Optional"
                    value={formData.registration_number}
                    onChange={handleChange}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                    disabled={loading}
                  />
                </div>

                {/* Tax ID */}
                <div className="space-y-2">
                  <label htmlFor="taxId" className="text-sm font-medium text-slate-300">
                    Tax ID
                  </label>
                  <Input
                    id="taxId"
                    name="tax_id"
                    placeholder="Optional"
                    value={formData.tax_id}
                    onChange={handleChange}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                    disabled={loading}
                  />
                </div>
              </div>

              <LoadingButton
                type="submit"
                disabled={loading || !formData.business_name}
                loading={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white h-11"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </LoadingButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
