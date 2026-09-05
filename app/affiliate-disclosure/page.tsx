import LegalPage, { SupportContact } from "../legal-page";
import { policyAlternates } from "@/lib/policy-metadata";

export const metadata = { title: "Affiliate Disclosure", robots: { index: true, follow: true }, alternates: policyAlternates("en", "affiliate-disclosure") };

export default function AffiliateDisclosurePage() {
  return (
    <LegalPage eyebrow="Relationship disclosure" title="Affiliate Disclosure" summary="Personal CBP Sites are independent sponsor pages and may contain compensated referral links.">
      <h2>Independent site</h2>
      <p>ProNeurs™ and each personal sponsor page are independent from ClickBaitPays. References to ClickBaitPays do not imply ownership, operation, endorsement, or control by ClickBaitPays.</p>
      <h2>Referral compensation</h2>
      <p>If a visitor follows a sponsor’s referral link and later participates, the sponsor may receive compensation under the third party’s current referral rules. That possibility does not increase the price of the ProNeurs™ website subscription and does not guarantee any visitor or sponsor result.</p>
      <h2>Risk and results</h2>
      <p>Third-party participation can involve cryptocurrency, fees, loss, changing rules, and operational risk. Earnings and withdrawals are not guaranteed. Review current official terms and conduct independent diligence before acting.</p>
      <h2>Questions</h2>
      <p>Questions about this disclosure may be sent to <SupportContact />.</p>
    </LegalPage>
  );
}
