import LegalPage, { SupportContact } from "../legal-page";
import { policyAlternates } from "@/lib/policy-metadata";

export const metadata = { title: "Cancellation and Refund Policy", robots: { index: true, follow: true }, alternates: policyAlternates("en", "refund-policy") };

export default function RefundPolicyPage() {
  return (
    <LegalPage eyebrow="Billing policy" title="Cancellation and Refund Policy" summary="Subscriptions can be canceled through Stripe and normally remain active through the paid period.">
      <h2>Cancellation</h2>
      <p>Customers may cancel at any time through the billing portal. Cancellation stops future renewals. Unless a different date is shown in Stripe, the site remains published through the current paid period and is then unpublished.</p>
      <h2>Failed payments</h2>
      <p>When a renewal fails, ProNeurs™ may keep the site available during a seven-day recovery period. If payment is not recovered, the site may be suspended until billing is corrected.</p>
      <h2>Refunds</h2>
      <p>Subscription charges are generally non-refundable after the service period begins. ProNeurs™ will review duplicate charges, unauthorized charges, material service failures, and refunds required by applicable law. Canceling does not automatically refund the current period.</p>
      <h2>Requesting review</h2>
      <p>Contact <SupportContact /> with the account email, charge date, and reason for the request. Do not send card numbers, wallet credentials, or passwords.</p>
    </LegalPage>
  );
}
