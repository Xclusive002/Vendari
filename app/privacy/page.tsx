import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal-page'

export const metadata: Metadata = {
  title: 'Privacy Policy | Vendari',
  description: 'Learn how Vendari collects, uses, stores, and protects information when you use our business management app.',
  alternates: { canonical: 'https://www.vendari.name.ng/privacy' },
}

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="How Vendari handles information for business owners, team members, and visitors to our website."
      lastUpdated="September 11, 2026"
      intro="Vendari helps retailers and service businesses manage sales, inventory, customers, expenses, and operations. This Privacy Policy explains what information we collect, why we use it, how we protect it, and the choices available to you. By using Vendari, you agree to the practices described here."
      sections={[
        {
          heading: 'Information we collect',
          paragraphs: [
            'Account information may include your name, email address, phone number, business name, role, and login credentials. When you create a business account, we also receive the business details and preferences you choose to provide.',
            'Business data may include products, sales, inventory records, customers, suppliers, expenses, invoices, receipts, team activity, and other information that you or your authorized team members enter into Vendari. Please only add personal information that you have a lawful basis to use and share.',
            'We collect technical information such as device type, browser, IP address, approximate location, pages visited, and activity timestamps. We use cookies and similar technologies that are necessary for authentication, security, preferences, and service performance.',
          ],
        },
        {
          heading: 'How we use information',
          paragraphs: [
            'We use information to provide, maintain, secure, and improve Vendari; authenticate users; process requests and payments; provide support; send service and account notices; prevent abuse; and understand how the product is used.',
            'Where you enable AI or insight features, relevant business data is processed to generate requested explanations, summaries, or recommendations. Vendari does not sell your business data or use it to make decisions about your customers.',
            'We may use aggregated or de-identified information for analytics, reliability, and product improvement when it cannot reasonably be used to identify you or your customers.',
          ],
        },
        {
          heading: 'Sharing and service providers',
          paragraphs: [
            'We may share information with trusted vendors that help us host the service, deliver email, process payments, provide analytics, protect security, or support customer requests. These providers may only process information as needed to provide their services to Vendari.',
            'We may disclose information when required by law, to respond to valid legal process, to protect the rights and safety of Vendari or others, or in connection with a merger, acquisition, financing, or sale of assets. We do not rent or sell personal information for advertising.',
          ],
        },
        {
          heading: 'Retention and security',
          paragraphs: [
            'We retain account and business information while your account is active and for a reasonable period afterward when needed for legal, security, accounting, dispute-resolution, or backup purposes. You can contact us to request account deletion, subject to information we must retain by law or for legitimate business purposes.',
            'We use access controls, encryption where appropriate, monitoring, and other administrative and technical safeguards designed to protect information. No internet service can guarantee absolute security, so keep your credentials confidential and tell us promptly about suspected unauthorized access.',
          ],
        },
        {
          heading: 'Your choices and rights',
          paragraphs: [
            'Depending on where you live, you may have rights to access, correct, export, delete, or restrict the processing of your personal information. You may also opt out of non-essential marketing messages by using the unsubscribe link or contacting us. We may need to verify your identity before completing a request.',
            'You can manage cookies through your browser settings, though disabling necessary cookies may affect sign-in and core functionality. To make a privacy request, contact us through the support channel available in your Vendari account.',
          ],
        },
        {
          heading: 'Children and international use',
          paragraphs: [
            'Vendari is a business service and is not directed to children under 18. We do not knowingly collect personal information from children. If you believe a child has provided information, contact us so we can review and remove it where appropriate.',
            'Vendari may process information in countries where we or our service providers operate. We take reasonable steps to protect information when it is transferred across borders and apply the safeguards required by applicable law.',
          ],
        },
        {
          heading: 'Changes and contact',
          paragraphs: [
            'We may update this policy as Vendari changes or legal requirements develop. We will post the revised version here and update the date above. Material changes may also be communicated through the service or by email.',
            'Questions or privacy requests should be directed to Vendari through the contact details provided in the application or on the Vendari website at https://www.vendari.name.ng.',
          ],
        },
      ]}
    />
  )
}
