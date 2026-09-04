"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function DocumentLocale() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.lang =
      pathname === "/fr" || pathname.startsWith("/fr/") ? "fr" : "en";
  }, [pathname]);

  return null;
}
