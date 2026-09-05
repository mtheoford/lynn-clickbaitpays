import CustomerManagePage from "@/app/manage/CustomerManagePage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ihre persönliche CBP-Website verwalten", robots: { index: false, follow: false } };

export default function GermanManagePage() {
  return <CustomerManagePage locale="de" />;
}
