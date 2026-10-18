"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { RealEstateAdminAccess } from "./RealEstateAdminAccess";
const Manager = dynamic(() => import("./RealEstatePropertyManager"), {
  loading: () => <p>Ouverture de la gestion…</p>,
});
export function RealEstateManageListings({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="reManagementEntry">
      <RealEstateAdminAccess onAuthorized={() => setOpen(true)}>
        Gérer les biens
      </RealEstateAdminAccess>
      {open ? <Manager locale={locale} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}
