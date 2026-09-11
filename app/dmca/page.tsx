import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal-page'

export const metadata: Metadata = {
  title: 'DMCA Policy | Vendari',
  description: 'Vendari’s copyright and DMCA policy for reporting alleged infringement and submitting a counter-notice.',
  alternates: { canonical: 'https://www.vendari.name.ng/dmca' },
}

export default function DmcaPage() {
  return (
    <LegalPage
      title="DMCA Policy"
      description="How to report copyright concerns involving content made available through Vendari."
      lastUpdated="September 11, 2026"
      intro="Vendari respects intellectual property rights and expects users to do the same. This policy describes the information a copyright owner or authorized agent should provide when reporting alleged infringement and how an affected user may respond. This policy is intended to provide a practical reporting process and does not replace legal advice."
      sections={[
        {
          heading: 'Submitting a copyright notice',
          paragraphs: [
            'If you believe that material available through Vendari infringes your copyright, send a written notice containing all of the information below. A notice that does not contain enough detail may not be actionable, and we may ask for clarification before taking action.',
            'Your notice should include: a physical or electronic signature of the copyright owner or authorized agent; identification of the copyrighted work claimed to have been infringed; identification of the material to be removed or disabled and enough information for us to locate it; your name, address, telephone number, and email address; a statement that you have a good-faith belief the use is not authorized by the copyright owner, agent, or law; and a statement, under penalty of perjury, that the information is accurate and that you are authorized to act for the copyright owner.',
          ],
        },
        {
          heading: 'Where to send a notice',
          paragraphs: [
            'Send copyright notices through the support or contact channel provided at https://www.vendari.name.ng, with the subject line “DMCA Copyright Notice.” Include “DMCA” in the subject so the request can be routed promptly. We may share a notice with the affected user or relevant service providers when necessary to investigate or process it.',
            'Do not use this process for ordinary customer disputes, trademark complaints, privacy complaints, or content that you simply dislike. Those requests should identify the relevant issue and be sent through the appropriate support channel.',
          ],
        },
        {
          heading: 'Our response',
          paragraphs: [
            'After receiving a substantially complete notice, Vendari may remove or restrict access to the reported material, notify the account holder, request more information, and take other action permitted by law. We may terminate accounts of users who repeatedly infringe intellectual property rights or who misuse this reporting process.',
            'We do not decide complex ownership disputes. We may restore material when a counter-notice is received or when the parties resolve the matter, subject to applicable law and the requirements of any valid court or administrative order.',
          ],
        },
        {
          heading: 'Counter-notice',
          paragraphs: [
            'If you believe material was removed or restricted by mistake or misidentification, you may send a counter-notice. It should identify the removed material and its former location, include your physical or electronic signature, state under penalty of perjury that you have a good-faith belief the material was removed because of a mistake or misidentification, and provide your name, address, telephone number, and email address.',
            'Your counter-notice must also include a statement that you consent to the jurisdiction of the appropriate court for your address, or the jurisdiction where Vendari is located if you are outside that jurisdiction, and that you will accept service of process from the complaining party. We may forward a valid counter-notice to the original complainant. Restoration may occur after the period required by applicable law unless the complainant provides notice of a court action.',
          ],
        },
        {
          heading: 'Good-faith reporting',
          paragraphs: [
            'Only copyright owners or authorized agents should submit notices. Knowingly submitting materially false claims may create legal liability. If you are unsure whether a use is infringing, consider obtaining independent legal advice before sending a notice.',
            'Vendari may preserve records related to a notice and disclose information when required by law or when reasonably necessary to protect the rights and safety of users, Vendari, or others.',
          ],
        },
      ]}
    />
  )
}
