import CustomerConfirmationPage, { type ConfirmationSearchParams } from "@/app/manage/confirm/CustomerConfirmationPage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Confirm Your ProNeurs Sign-In", robots: { index: false, follow: false } };

export default function Page({ searchParams }: { searchParams: ConfirmationSearchParams }) {
  return <CustomerConfirmationPage searchParams={searchParams} locale="en" />;
}
