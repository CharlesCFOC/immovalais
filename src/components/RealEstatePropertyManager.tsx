"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import type { PropertyRow } from "@/lib/real-estate/types";
import { estateRequest } from "./RealEstateAdminAccess";
export default function RealEstatePropertyManager({
  locale,
  onClose,
}: {
  locale: Locale;
  onClose?: () => void;
}) {
  const [properties, setProperties] = useState<PropertyRow[]>([]),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [tab, setTab] = useState("all"),
    [title, setTitle] = useState("");
  const router = useRouter();
  useEffect(() => {
    let alive = true;
    estateRequest("/api/real-estate/manage")
      .then((d) => {
        if (alive) setProperties(d.properties);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const d = await estateRequest("/api/real-estate/manage", { title });
      router.push(`/${locale}/immobilier/${d.property.slug}?edit=1`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function action(p: PropertyRow, action: string) {
    if (
      action === "trash" &&
      !window.confirm(
        `Déplacer « ${p.draft.title} » dans la corbeille ? Il sera retiré du site et pourra être restauré.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      const d = await estateRequest(
        `/api/real-estate/manage/${p.id}`,
        { action, revision: p.revision },
        "PATCH",
      );
      setProperties((items) =>
        items.map((i) => (i.id === p.id ? d.property : i)),
      );
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const visible = properties
    .filter((p) =>
      tab === "trash"
        ? !!p.deleted_at
        : !p.deleted_at && (tab === "all" || p.visibility === tab),
    )
    .filter((p) =>
      `${p.draft.title} ${p.draft.location}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  return (
    <section className="reManager" aria-label="Gestion des biens">
      <div className="reManagerHeader">
        <div>
          <p className="reEyebrow">ESPACE ADMINISTRATEUR</p>
          <h2>Vos biens immobiliers</h2>
          <p>Préparez vos fiches en brouillon, puis publiez-les sur le site.</p>
        </div>
        {onClose ? (
          <button type="button" onClick={onClose}>
            Fermer la gestion
          </button>
        ) : null}
      </div>
      <form className="reCreate" onSubmit={create}>
        <label>
          Nom du nouveau bien
          <input
            placeholder="Ex. Villa familiale à Monthey"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
          />
        </label>
        <button className="rePrimary" disabled={busy} type="submit">
          + Ajouter un bien
        </button>
      </form>
      <div className="reManagerFilters">
        <label>
          Rechercher
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom ou localisation"
          />
        </label>
        <label>
          Afficher
          <select value={tab} onChange={(e) => setTab(e.target.value)}>
            <option value="all">Tous les biens</option>
            <option value="published">Publiés</option>
            <option value="draft">Brouillons</option>
            <option value="hidden">Masqués</option>
            <option value="trash">Corbeille</option>
          </select>
        </label>
      </div>
      {error ? (
        <p className="reError" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p>Chargement des biens…</p>
      ) : (
        <div className="reManagerRows">
          {visible.map((p) => (
            <article key={p.id} className="reManagerRow">
              <div>
                <span className="reBadge">
                  {p.deleted_at
                    ? "Corbeille"
                    : p.visibility === "published"
                      ? "Publié"
                      : p.visibility === "hidden"
                        ? "Masqué"
                        : "Brouillon"}
                </span>
                <h3>{p.draft.title}</h3>
                <p>
                  {p.draft.location || "Localisation à compléter"} ·{" "}
                  {new Date(p.updated_at).toLocaleDateString("fr-CH")}
                </p>
              </div>
              <div className="reActions">
                {p.deleted_at ? (
                  <button disabled={busy} onClick={() => action(p, "restore")}>
                    Restaurer
                  </button>
                ) : (
                  <>
                    <Link
                      className="rePrimary"
                      href={`/${locale}/immobilier/${p.slug}?edit=1`}
                    >
                      Modifier la fiche ↗
                    </Link>
                    {p.visibility === "published" ? (
                      <button disabled={busy} onClick={() => action(p, "hide")}>
                        Masquer
                      </button>
                    ) : null}
                    <button
                      className="reDanger"
                      disabled={busy}
                      onClick={() => action(p, "trash")}
                    >
                      Supprimer
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
          {!visible.length ? <p>Aucun bien dans cette vue.</p> : null}
        </div>
      )}
    </section>
  );
}
