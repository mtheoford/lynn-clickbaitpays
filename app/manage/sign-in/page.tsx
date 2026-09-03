import Link from "next/link";
import { chatGPTSignInPath } from "@/app/chatgpt-auth";
import { customerSignInErrorMessage } from "@/lib/magic-link-flow";
import { runtimeValue } from "@/lib/runtime";
import SignInForm from "./SignInForm";

export const metadata = {
  title: "Manage Your Personal CBP Site",
  robots: { index: false, follow: false },
};

export default async function CustomerSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const params = await searchParams;
  const errorMessage = customerSignInErrorMessage(params.error);
  let showChatGPTPilotSignIn = false;
  let emailSignInConfigured = false;
  try {
    const [appEnv, resendApiKey, emailFrom] = await Promise.all([
      runtimeValue("APP_ENV"),
      runtimeValue("RESEND_API_KEY"),
      runtimeValue("EMAIL_FROM"),
    ]);
    showChatGPTPilotSignIn = appEnv !== "production" && appEnv !== "staging";
    emailSignInConfigured = Boolean(resendApiKey && emailFrom);
  } catch {
    showChatGPTPilotSignIn = true;
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
          <p className="eyebrow">Customer access</p>
          <h1>Manage your personal site.</h1>
          <p>
            {emailSignInConfigured
              ? "Enter the email used during purchase. We’ll send a secure, single-use sign-in link—no password required."
              : "Pilot customers can sign in securely with the ChatGPT account that uses the same email address as their purchase."}
          </p>
        </div>
        <div>
          {errorMessage ? (
            <p className="signup-error" role="alert">{errorMessage}</p>
          ) : null}
          {emailSignInConfigured ? <SignInForm /> : null}
          {showChatGPTPilotSignIn ? (
            <Link className="signup-submit" href={chatGPTSignInPath("/manage")}>
              Sign in with ChatGPT <span aria-hidden="true">→</span>
            </Link>
          ) : !emailSignInConfigured ? (
            <p className="signup-error" role="status">
              Email sign-in is temporarily unavailable. Contact ProNeurs™ support for account access.
            </p>
          ) : null}
          {showChatGPTPilotSignIn ? <p className="signup-safe-note">Use the same email address used during purchase.</p> : null}
        </div>
      </section>
    </main>
  );
}
