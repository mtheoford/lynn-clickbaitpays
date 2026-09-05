import SalesPage, { salesMetadata, type SalesSearchParams } from "./SalesPage";

export const metadata = salesMetadata("en");

export default function GetYourSitePage({ searchParams }: { searchParams: SalesSearchParams }) {
  return <SalesPage searchParams={searchParams} locale="en" />;
}
