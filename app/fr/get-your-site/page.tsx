import SalesPage, { salesMetadata, type SalesSearchParams } from "@/app/get-your-site/SalesPage";

export const metadata = salesMetadata("fr");

export default function FrenchGetYourSitePage({ searchParams }: { searchParams: SalesSearchParams }) {
  return <SalesPage searchParams={searchParams} locale="fr" />;
}
