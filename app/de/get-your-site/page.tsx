import SalesPage, { salesMetadata, type SalesSearchParams } from "@/app/get-your-site/SalesPage";

export const metadata = salesMetadata("de");

export default function GermanGetYourSitePage({ searchParams }: { searchParams: SalesSearchParams }) {
  return <SalesPage searchParams={searchParams} locale="de" />;
}
