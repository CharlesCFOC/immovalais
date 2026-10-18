"use client";
import { useRef, useState } from "react";
import type { ReactNode } from "react";
import "@/app/real-estate-manager.css";
export async function estateRequest(
  path: string,
  body?: unknown,
  method = "POST",
) {
  const response = await fetch(path, {
    ...(body === undefined
      ? {}
      : {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      response.status === 409
        ? "Ce bien a été modifié dans une autre fenêtre. Rechargez sa dernière version avant de continuer."
        : data.error || "Opération impossible.",
    );
  return data;
}
export function RealEstateAdminAccess({
  children,
  onAuthorized,
}: {
  children: ReactNode;
  onAuthorized: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    [code, setCode] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function open() {
    setBusy(true);
    setError("");
    try {
      const data = await estateRequest("/api/admin/session");
      if (data.authorized) onAuthorized();
      else dialog.current?.showModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Accès impossible.");
      dialog.current?.showModal();
    } finally {
      setBusy(false);
    }
  }
  async function unlock(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await estateRequest("/api/admin/session", { code });
      setCode("");
      dialog.current?.close();
      onAuthorized();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Code incorrect.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        type="button"
        className="reAdminButton"
        onClick={open}
        disabled={busy}
      >
        {children}
      </button>
      <dialog
        className="reAdminDialog"
        ref={dialog}
        aria-labelledby="re-unlock-title"
      >
        <form onSubmit={unlock}>
          <h2 id="re-unlock-title">Gestion des biens</h2>
          <p>Saisissez votre code pour ouvrir le mode d’édition.</p>
          <label>
            Code d’accès
            <input
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoFocus
            />
          </label>
          {error ? (
            <p role="alert" className="reError">
              {error}
            </p>
          ) : null}
          <div className="reActions">
            <button type="button" onClick={() => dialog.current?.close()}>
              Annuler
            </button>
            <button className="rePrimary" disabled={busy} type="submit">
              {busy ? "Vérification…" : "Déverrouiller"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
