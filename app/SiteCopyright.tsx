"use client";

import { usePathname } from "next/navigation";
import type { SiteLocale } from "@/lib/i18n";

export default function SiteCopyright({ locale }: { locale?: SiteLocale }) {
  const pathname = usePathname();
  const activeLocale = locale ?? (pathname === "/fr" || pathname.startsWith("/fr/") ? "fr" : "en");

  return (
    <footer className="site-copyright" lang={activeLocale}>
      <small>
        © {new Date().getUTCFullYear()} ProNeurs™. {activeLocale === "fr" ? "Tous droits réservés." : "All rights reserved."}
      </small>
    </footer>
  );
}
