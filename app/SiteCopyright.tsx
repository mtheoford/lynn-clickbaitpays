"use client";

import { usePathname } from "next/navigation";
import { localeFromPath, type SiteLocale } from "@/lib/i18n";

export default function SiteCopyright({ locale }: { locale?: SiteLocale }) {
  const pathname = usePathname();
  const activeLocale = locale ?? localeFromPath(pathname);
  const rights = { en: "All rights reserved.", fr: "Tous droits réservés.", de: "Alle Rechte vorbehalten." };

  return (
    <footer className="site-copyright" lang={activeLocale}>
      <small>
        © {new Date().getUTCFullYear()} ProNeurs™. {rights[activeLocale]}
      </small>
    </footer>
  );
}
