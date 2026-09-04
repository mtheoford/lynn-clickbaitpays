import type { Metadata } from "next";
import CustomerManagePage from "@/app/manage/CustomerManagePage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gérer votre site CBP personnel",
  robots: { index: false, follow: false },
};

export default async function FrenchManagePage() {
  return <CustomerManagePage locale="fr" />;
}
