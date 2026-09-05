import CustomerSignInPage, { type SignInSearchParams } from "@/app/manage/sign-in/CustomerSignInPage";

export const metadata = { title: "Manage Your Personal CBP Site", robots: { index: false, follow: false } };

export default function Page({ searchParams }: { searchParams: SignInSearchParams }) {
  return <CustomerSignInPage searchParams={searchParams} locale="en" />;
}
