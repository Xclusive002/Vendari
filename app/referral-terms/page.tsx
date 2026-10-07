import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal-page'

export const metadata: Metadata = {
  title: 'Referral Terms | Vendari',
  description: 'Terms for the Vendari member referral programme.',
  alternates: { canonical: 'https://www.vendari.name.ng/referral-terms' },
}

export default function ReferralTermsPage() {
  return (
    <LegalPage
      title="Referral Programme Terms"
      description="How referrals are tracked, how commissions are earned, and when you can withdraw them."
      lastUpdated="October 7, 2026"
      intro="These terms apply to Vendari’s referral programme. By sharing a referral link or accepting a referral commission, you agree to follow these rules and the general Vendari Terms and Conditions."
      sections={[
        {
          heading: 'One level of referrals',
          paragraphs: [
            'The programme is single-level only. You can earn from eligible people who sign up directly through your referral link. You do not earn from referrals made by those people.',
          ],
        },
        {
          heading: 'Membership commissions',
          paragraphs: [
            'Commission is calculated on cleared membership payments actually received by Vendari, after payment-provider fees. Commission may be earned on eligible payments made during the 12 months beginning on the referred member’s first cleared membership payment. A signup or free trial by itself does not earn commission.',
            'A commission is held for 14 days before it can be approved. The hold allows time to identify payment reversals, refunds, and suspicious activity. Refunded payments do not earn commission. If a payment is refunded after commission has been paid, Vendari may reverse or offset the related amount.',
          ],
        },
        {
          heading: 'Concierge setup commissions',
          paragraphs: [
            'For an eligible Concierge referral, commission is a flat 10% of the setup fee actually received by Vendari. No commission is earned on an unpaid, waived, refunded, or otherwise uncollected part of a setup fee. The same 14-day hold applies.',
          ],
        },
        {
          heading: 'Fair use and account review',
          paragraphs: [
            'Referrals must be real, independent people and businesses. Self-referrals, fake or duplicate accounts, misleading promotion, and attempts to manipulate the programme are not allowed. Vendari may investigate suspicious activity, place payouts on hold for review, reject or reverse commissions, and suspend or remove programme access when abuse or fake accounts are found.',
          ],
        },
        {
          heading: 'Withdrawals',
          paragraphs: [
            'Approved commissions can be withdrawn to a verified bank account once your available balance reaches the minimum withdrawal shown in your referral dashboard (currently ₦5,000). Bank-account changes require password confirmation and are followed by a 24-hour withdrawal lock. Payouts can also be paused for account or fraud review.',
          ],
        },
        {
          heading: 'Programme changes and questions',
          paragraphs: [
            'Vendari may update or end the referral programme. Changes will not remove commissions already approved, except where reversal is allowed under these terms. Contact Vendari support if you have a question about a referral or payout.',
          ],
        },
      ]}
    />
  )
}
