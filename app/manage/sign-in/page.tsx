import Link from "next/link";
import SignInForm from "./SignInForm";

export const metadata = {
  title: "Manage Your Personal CBP Site",
  robots: { index: false, follow: false },
};

export default function CustomerSignInPage() {
  return (
    <main className="marketing-page">
      <header className="marketing-header">
        <Link href="/get-your-site" className="marketing-brand">
          <span>PN</span>
          <div><strong>ProNeurs</strong><small>Personal CBP Sites</small></div>
        </Link>
      </header>
      <section className="marketing-builder">
        <div className="builder-copy">
          <p className="eyebrow">Customer access</p>
          <h1>Manage your personal site.</h1>
          <p>Enter the email used during purchase. We’ll send a secure, single-use sign-in link—no password or ChatGPT account required.</p>
        </div>
        <SignInForm />
      </section>
    </main>
  );
}
