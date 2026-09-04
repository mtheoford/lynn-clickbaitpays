import type { Metadata } from "next";
import Link from "next/link";
import { chatGPTSignInPath } from "@/app/chatgpt-auth";
import SignInForm from "@/app/manage/sign-in/SignInForm";
import { customerSignInErrorMessage } from "@/lib/magic-link-flow";
import { runtimeValue } from "@/lib/runtime";

export const metadata: Metadata = {
  title: "Gérer votre site CBP personnel",
  robots: { index: false, follow: false },
};

export default async function FrenchCustomerSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const params = await searchParams;
  const errorMessage = customerSignInErrorMessage(params.error, "fr");
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
    <main className="marketing-page" lang="fr">
      <header className="marketing-header">
        <Link href="/fr/get-your-site" className="marketing-brand">
          <span>PN</span>
          <div><strong>ProNeurs™</strong><small>Sites CBP personnels</small></div>
        </Link>
        <div className="marketing-account-links">
          <Link href="/manage/sign-in" hrefLang="en">English</Link>
        </div>
      </header>
      <section className="marketing-builder">
        <div className="builder-copy">
          <p className="eyebrow">Espace client</p>
          <h1>Gérez votre site personnel.</h1>
          <p>
            {emailSignInConfigured
              ? "Saisissez l’adresse e-mail utilisée lors de l’achat. Nous vous enverrons un lien de connexion sécurisé et à usage unique — aucun mot de passe n’est requis."
              : "Pendant la phase pilote, connectez-vous avec le compte ChatGPT qui utilise la même adresse e-mail que votre achat."}
          </p>
        </div>
        <div>
          {errorMessage ? (
            <p className="signup-error" role="alert">{errorMessage}</p>
          ) : null}
          {emailSignInConfigured ? <SignInForm locale="fr" /> : null}
          {showChatGPTPilotSignIn ? (
            <Link className="signup-submit" href={chatGPTSignInPath("/fr/manage")}>
              Se connecter avec ChatGPT <span aria-hidden="true">→</span>
            </Link>
          ) : !emailSignInConfigured ? (
            <p className="signup-error" role="status">
              La connexion par e-mail est momentanément indisponible. Contactez l’assistance ProNeurs™ pour accéder à votre compte.
            </p>
          ) : null}
          {showChatGPTPilotSignIn ? (
            <p className="signup-safe-note">Utilisez la même adresse e-mail que lors de l’achat.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
