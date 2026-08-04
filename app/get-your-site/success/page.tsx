import Link from "next/link";
import ProvisioningStatus from "./ProvisioningStatus";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const sessionId = (await searchParams).session_id ?? "";
  return (
    <main className="checkout-success-page">
      <div>
        <span className="checkout-success-mark">✓</span>
        <p className="eyebrow">Payment received</p>
        <h1>Your personal site is being activated.</h1>
        <p>
          Stripe has returned you safely to ProNeurs™. The signed payment notification is now
          completing your site setup. You will receive your public URL and secure management link by email.
        </p>
        {sessionId ? (
          <ProvisioningStatus sessionId={sessionId} />
        ) : (
          <div className="checkout-success-actions">
            <Link className="join-button" href="/manage/sign-in">Manage my page <i aria-hidden="true">→</i></Link>
            <Link href="/get-your-site">Return to Personal CBP Sites</Link>
          </div>
        )}
      </div>
    </main>
  );
}
