import Link from "next/link";

export const dynamic = "force-dynamic";

export default function CheckoutSuccessPage() {
  return (
    <main className="checkout-success-page">
      <div>
        <span className="checkout-success-mark">✓</span>
        <p className="eyebrow">Payment received</p>
        <h1>Your personal site is being activated.</h1>
        <p>
          Stripe has returned you safely to ProNeurs. The signed payment notification is now
          completing your site setup. You will receive your public URL and secure management link by email.
        </p>
        <Link className="join-button" href="/get-your-site">Return to Personal CBP Sites <i aria-hidden="true">→</i></Link>
      </div>
    </main>
  );
}

