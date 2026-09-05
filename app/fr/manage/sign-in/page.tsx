import CustomerSignInPage, { type SignInSearchParams } from "@/app/manage/sign-in/CustomerSignInPage";

export const metadata = { title: "Gérer votre site CBP personnel", robots: { index: false, follow: false } };

export default function Page({ searchParams }: { searchParams: SignInSearchParams }) {
  return <CustomerSignInPage searchParams={searchParams} locale="fr" />;
}
