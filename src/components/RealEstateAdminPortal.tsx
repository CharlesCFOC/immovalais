"use client";

import dynamic from "next/dynamic";
import { useState, type KeyboardEvent } from "react";
import { House, UsersRound } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { DashboardValuationRequests } from "@/components/DashboardValuationRequests";
import { RealEstateAdminAccess } from "@/components/RealEstateAdminAccess";

const PropertyManager = dynamic(() => import("@/components/RealEstatePropertyManager"), {
  loading: () => <p>Ouverture de la gestion des biens…</p>,
});

export function RealEstateAdminPortal({ locale }: { locale: Locale }) {
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<"annonces" | "prospects">("annonces");
  const [loggingOut, setLoggingOut] = useState(false);

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextTab = event.key === "Home" ? "annonces" : event.key === "End" ? "prospects" : activeTab === "annonces" ? "prospects" : "annonces";
    setActiveTab(nextTab);
    requestAnimationFrame(() => document.getElementById(`admin-tab-${nextTab}`)?.focus());
  }

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/session", { method: "DELETE", cache: "no-store" });
    } finally {
      setAuthorized(false);
      setLoggingOut(false);
    }
  }

  return (
    <main className="immovalaisAdminPage">
      {!authorized ? (
        <section className="immovalaisAdminGate">
          <p className="reEyebrow">IMMOVALAIS · ADMIN</p>
          <h1>Espace administrateur</h1>
          <p>Gérez les biens immobiliers et consultez les demandes d’estimation.</p>
          <RealEstateAdminAccess onAuthorized={() => setAuthorized(true)}>
            Ouvrir l’espace admin
          </RealEstateAdminAccess>
        </section>
      ) : (
        <>
          <header className="immovalaisAdminHeader">
            <div>
              <p className="reEyebrow">IMMOVALAIS · ADMINISTRATION</p>
              <h1>Espace administrateur</h1>
              <p>Gérez les annonces et retrouvez les demandes de vos prospects au même endroit.</p>
            </div>
            <button type="button" onClick={logout} disabled={loggingOut}>
              {loggingOut ? "Déconnexion…" : "Déconnexion"}
            </button>
          </header>
          <div className="immovalaisAdminTabs" role="tablist" aria-label="Sections d’administration">
            <button id="admin-tab-annonces" type="button" role="tab" aria-selected={activeTab === "annonces"} aria-controls="admin-panel-annonces" tabIndex={activeTab === "annonces" ? 0 : -1} onClick={() => setActiveTab("annonces")} onKeyDown={handleTabKeyDown}>
              <House size={17} aria-hidden="true" /> Annonces
            </button>
            <button id="admin-tab-prospects" type="button" role="tab" aria-selected={activeTab === "prospects"} aria-controls="admin-panel-prospects" tabIndex={activeTab === "prospects" ? 0 : -1} onClick={() => setActiveTab("prospects")} onKeyDown={handleTabKeyDown}>
              <UsersRound size={17} aria-hidden="true" /> Prospect
            </button>
          </div>
          <section id="admin-panel-annonces" className="immovalaisAdminPanel" role="tabpanel" aria-labelledby="admin-tab-annonces" hidden={activeTab !== "annonces"}>
            <PropertyManager locale={locale} />
          </section>
          <section id="admin-panel-prospects" className="immovalaisAdminPanel immovalaisAdminRequests" role="tabpanel" aria-labelledby="admin-tab-prospects" hidden={activeTab !== "prospects"}>
            <DashboardValuationRequests />
          </section>
        </>
      )}
    </main>
  );
}
