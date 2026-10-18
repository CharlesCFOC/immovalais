"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { DashboardValuationRequests } from "@/components/DashboardValuationRequests";
import { RealEstateAdminAccess } from "@/components/RealEstateAdminAccess";

const PropertyManager = dynamic(() => import("@/components/RealEstatePropertyManager"), {
  loading: () => <p>Ouverture de la gestion des biens…</p>,
});

export function RealEstateAdminPortal({ locale }: { locale: Locale }) {
  const [authorized, setAuthorized] = useState(false);
  const [showProperties, setShowProperties] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

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
              <p className="reEyebrow">IMMOVALAIS · ADMIN</p>
              <h1>Espace administrateur</h1>
              <p>Gestion des biens immobiliers et demandes reçues via le formulaire.</p>
            </div>
            <button type="button" onClick={logout} disabled={loggingOut}>
              {loggingOut ? "Déconnexion…" : "Déconnexion"}
            </button>
          </header>
          <div className="immovalaisAdminSections">
            <section aria-label="Gestion des biens immobiliers">
              {showProperties ? (
                <PropertyManager locale={locale} onClose={() => setShowProperties(false)} />
              ) : (
                <button type="button" className="reAdminButton" onClick={() => setShowProperties(true)}>
                  Gérer les biens
                </button>
              )}
            </section>
            <section className="immovalaisAdminRequests" aria-label="Réponses aux formulaires">
              <DashboardValuationRequests />
            </section>
          </div>
        </>
      )}
    </main>
  );
}
