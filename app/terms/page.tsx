import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal-page'

export const metadata: Metadata = {
  title: 'Terms and Conditions | Vendari',
  description: 'The terms and conditions that apply when you access or use the Vendari business management app.',
  alternates: { canonical: 'https://www.vendari.name.ng/terms' },
}

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms and Conditions"
      description="The rules for accessing and using Vendari, including accounts, subscriptions, business data, and acceptable use."
      lastUpdated="September 11, 2026"
      intro="These Terms and Conditions govern your access to and use of Vendari, a business management app for retailers and service businesses. By creating an account or using the app, you agree to these terms. If you use Vendari for an organization, you confirm that you have authority to accept these terms on its behalf."
      sections={[
        {
          heading: 'The Vendari service',
          paragraphs: [
            'Vendari provides tools for recording and understanding sales, inventory, customers, purchases, expenses, reports, team activity, and related business operations. Features may vary by plan, location, device, and availability, and we may improve, change, or discontinue features from time to time.',
            'Vendari is a software tool, not an accountant, lawyer, financial adviser, tax adviser, or guarantee of business performance. You are responsible for reviewing records and decisions made using information or insights provided by the service.',
          ],
        },
        {
          heading: 'Accounts and security',
          paragraphs: [
            'You must provide accurate account information and keep it up to date. Keep your password, session, and authentication details secure, and notify us promptly if you suspect unauthorized access. You are responsible for activity performed through your account unless it resulted from Vendari’s failure to use reasonable security measures.',
            'You may invite team members only when you have permission to give them access. You are responsible for assigning appropriate roles, reviewing activity, and removing access when a person no longer works with your business.',
          ],
        },
        {
          heading: 'Your data and responsibilities',
          paragraphs: [
            'You retain ownership of the business data you submit to Vendari. You grant Vendari a limited license to host, copy, transmit, display, and process that data only as needed to operate, secure, support, and improve the service and to comply with law.',
            'You are responsible for the accuracy, legality, and permissions associated with your data. Do not upload information that you are not authorized to use, malware, unlawful content, or sensitive information that is unnecessary for the service.',
            'You should maintain your own appropriate records and backups. We use reasonable measures to protect the service, but Vendari is not a replacement for your business continuity, accounting, tax, or document-retention practices.',
          ],
        },
        {
          heading: 'Plans, payments, and refunds',
          paragraphs: [
            'Some features require an active membership. Prices, membership intervals, taxes, payment terms, and included limits are shown at checkout or in your account. You authorize Vendari or its payment provider to charge the selected payment method for applicable fees.',
            'Unless a plan or written agreement says otherwise, memberships renew for the same membership period until cancelled. You can cancel future renewals through the available account controls or by contacting support. Fees already charged are generally non-refundable except where required by law or expressly stated at purchase.',
            'We may suspend or limit access for overdue payments after reasonable notice. If pricing or plan features change, we will provide notice where required and the change will generally apply at the next renewal.',
          ],
        },
        {
          heading: 'Acceptable use',
          paragraphs: [
            'You may not misuse Vendari, interfere with its operation, bypass security or plan limits, probe or scan systems without authorization, reverse engineer the service except where the law permits, resell access without permission, or use the service to violate another person’s rights or applicable law.',
            'We may investigate suspected misuse and suspend or terminate access when reasonably necessary to protect users, Vendari, or the public, or when you materially breach these terms. Where practical, we will provide notice and an opportunity to address the issue.',
          ],
        },
        {
          heading: 'Intellectual property',
          paragraphs: [
            'Vendari and its software, branding, interface, documentation, and content are owned by Vendari or its licensors and are protected by applicable intellectual property laws. These terms give you a limited, non-exclusive, non-transferable right to use the service during your account term; they do not transfer ownership to you.',
            'You may send suggestions or feedback. You agree that Vendari may use feedback without restriction or payment, provided it does not identify you as the source without permission.',
          ],
        },
        {
          heading: 'Disclaimers and limits',
          paragraphs: [
            'To the extent permitted by law, Vendari is provided on an “as available” basis without warranties that it will be uninterrupted, error-free, or suitable for every purpose. We do not guarantee specific revenue, savings, compliance outcome, or business result.',
            'To the extent permitted by law, Vendari will not be liable for indirect, incidental, special, consequential, or loss-of-profit damages arising from use of the service. Vendari’s total liability for a claim relating to the service will not exceed the fees you paid to Vendari for the service during the three months before the event giving rise to the claim, except where applicable law does not allow that limitation.',
          ],
        },
        {
          heading: 'Termination and changes',
          paragraphs: [
            'You may stop using Vendari or close your account at any time. We may suspend or terminate access for a material breach, legal requirement, security risk, or discontinuation of the service. After termination, your right to use Vendari ends and our data-retention obligations are governed by the Privacy Policy and applicable law.',
            'We may update these terms by posting a revised version and changing the date above. Continued use after an update takes effect means you accept the revised terms. If a provision is unenforceable, the remaining provisions will continue to apply.',
          ],
        },
        {
          heading: 'Contact',
          paragraphs: [
            'Questions about these terms should be sent through the support channel in your Vendari account or through https://www.vendari.name.ng. We will use the contact information associated with your account for service notices where appropriate.',
          ],
        },
      ]}
    />
  )
}
