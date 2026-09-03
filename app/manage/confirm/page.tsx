import Link from "next/link";
import { redirect } from "next/navigation";
import { isCustomerMagicLinkValid } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Confirm Your ProNeurs Sign-In",
  robots: { index: false, follow: false },
};

export default async function CustomerSignInConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const tokenInput = Array.isArray(params.token) ? params.token[0] : params.token;
  const token = tokenInput ?? "";
  if (!(await isCustomerMagicLinkValid(token))) {
    redirect("/manage/sign-in?error=invalid-link");
  }

  return (
    <main className="marketing-page">
      <header className="marketing-header">
        <Link href="/get-your-site" className="marketing-brand">
          <span>PN</span>
          <div><strong>ProNeurs™</strong><small>Personal CBP Sites</small></div>
        </Link>
      </header>
      <section className="marketing-builder">
        <div className="builder-copy">
          <p className="eyebrow">Secure customer access</p>
          <h1>Confirm your sign-in.</h1>
          <p>
            Select Continue to open your site manager. This extra step keeps email
            security scanners from using your single-use link before you do.
          </p>
        </div>
        <div>
          <form className="site-signup-form" action="/auth/verify" method="post">
            <input type="hidden" name="token" value={token} />
            <p className="signup-safe-note">
              Only continue if you requested this sign-in email.
            </p>
            <button className="signup-submit" type="submit">
              Continue to my site <span aria-hidden="true">→</span>
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
