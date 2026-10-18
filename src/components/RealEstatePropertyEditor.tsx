"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { estateRequest } from "./RealEstateAdminAccess";
import {
  mediaUrl,
  propertyCategories,
  type PropertyContent,
  type PropertyMedia,
  type PropertyRow,
  type PropertyVersion,
} from "@/lib/real-estate/types";

type Props = {
  propertyId: string;
  open: boolean;
  focusField: string;
  onClose: () => void;
  onPreview: (content: PropertyContent) => void;
  onPublished: (content: PropertyContent) => void;
};
const tabs = [
  "Informations",
  "Images",
  "Documents",
  "Publication",
  "Historique",
];
const actionNames: Record<string, string> = {
  import: "Import initial",
  save: "Brouillon enregistré",
  publish: "Publication",
  hide: "Bien masqué",
  trash: "Mise en corbeille",
  restore: "Restauration",
  restore_version: "Ancienne version restaurée",
};
function Field({
  label,
  name,
  value,
  onChange,
  large = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  large?: boolean;
}) {
  return (
    <label className={large ? "reWide" : undefined}>
      {label}
      {large ? (
        <textarea
          id={`re-field-${name}`}
          data-large={name === "description"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={`re-field-${name}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
function move(items: PropertyMedia[], index: number, offset: number) {
  const next = [...items];
  [next[index], next[index + offset]] = [next[index + offset], next[index]];
  return next;
}
export default function RealEstatePropertyEditor({
  propertyId,
  open,
  focusField,
  onClose,
  onPreview,
  onPublished,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null),
    [property, setProperty] = useState<PropertyRow | null>(null),
    [draft, setDraft] = useState<PropertyContent | null>(null),
    [versions, setVersions] = useState<PropertyVersion[]>([]),
    [tab, setTab] = useState("Informations"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [progress, setProgress] = useState("");
  const router = useRouter();
  const loaded = draft !== null;
  const dirty = !!(
    draft &&
    property &&
    JSON.stringify(draft) !== JSON.stringify(property.draft)
  );
  useEffect(() => {
    let alive = true;
    estateRequest(`/api/real-estate/manage/${propertyId}`)
      .then((d) => {
        if (alive) {
          setProperty(d.property);
          setDraft(d.property.draft);
          setVersions(d.versions);
        }
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [propertyId]);
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current?.close();
  }, [open]);
  useEffect(() => {
    if (!dirty && !busy) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    const navigate = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element ? event.target.closest("a") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download"))
        return;
      const url = new URL(link.href, window.location.href);
      if (
        url.origin !== window.location.origin ||
        (url.pathname === window.location.pathname &&
          url.search === window.location.search)
      )
        return;
      if (
        !window.confirm(
          "Quitter cette fiche sans enregistrer vos modifications ?",
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", navigate, true);
    };
  }, [dirty, busy]);
  useEffect(() => {
    if (!open || !loaded || !focusField) return;
    const target =
      focusField === "images"
        ? "Images"
        : focusField === "documents"
          ? "Documents"
          : "Informations";
    setTab(target);
    const timer = window.setTimeout(
      () => document.getElementById(`re-field-${focusField}`)?.focus(),
      100,
    );
    return () => window.clearTimeout(timer);
  }, [open, focusField, loaded]);
  function change<K extends keyof PropertyContent>(
    key: K,
    value: PropertyContent[K],
  ) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
    setNotice("");
  }
  function close() {
    if (busy) return;
    if (
      dirty &&
      !window.confirm("Quitter sans enregistrer les modifications ?")
    )
      return;
    onClose();
  }
  async function submit(action: string, versionId?: string) {
    if (!property || !draft || busy) return;
    if (
      action === "trash" &&
      !window.confirm(
        "Retirer ce bien du site et le déplacer dans la corbeille ?",
      )
    )
      return;
    if (
      action === "restore_version" &&
      dirty &&
      !window.confirm(
        "Remplacer vos modifications par cette ancienne version ?",
      )
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const d = await estateRequest(
        `/api/real-estate/manage/${property.id}`,
        { action, revision: property.revision, content: draft, versionId },
        "PATCH",
      );
      setProperty(d.property);
      setDraft(d.property.draft);
      setNotice(
        action === "publish"
          ? "La fiche est publiée sur le site."
          : action === "restore_version"
            ? "Version restaurée en brouillon. Publiez-la pour la rendre visible."
            : "Modifications enregistrées.",
      );
      if (action === "publish") onPublished(d.property.published);
      if (action === "trash") {
        router.push(
          window.location.pathname.split("/immobilier/")[0] +
            "/immobilier/biens",
        );
        router.refresh();
        return;
      }
      const history = await estateRequest(
        `/api/real-estate/manage/${property.id}`,
      );
      setVersions(history.versions);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function reload() {
    if (
      dirty &&
      !window.confirm(
        "Abandonner vos modifications et charger la dernière version enregistrée ?",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      const d = await estateRequest(`/api/real-estate/manage/${propertyId}`);
      setProperty(d.property);
      setDraft(d.property.draft);
      setVersions(d.versions);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(
    files: File[],
    kind: "images" | "documents",
    replaceIndex?: number,
  ) {
    if (!property || !draft || busy || !files.length) return;
    setBusy(true);
    setError("");
    setNotice("");
    let pendingId: string | null = null;
    try {
      for (let index = 0; index < files.length; index++) {
        const file = files[index],
          mime =
            file.type ||
            (/\.pdf$/i.test(file.name)
              ? "application/pdf"
              : /\.hei[cf]$/i.test(file.name)
                ? "image/heic"
                : "");
        setProgress(`Import ${index + 1}/${files.length} : ${file.name}`);
        const prepared = await estateRequest("/api/real-estate/upload", {
          action: "prepare",
          propertyId: property.id,
          kind: kind === "images" ? "image" : "document",
          name: file.name,
          mime,
          size: file.size,
        });
        pendingId = prepared.id;
        const sent = await fetch(prepared.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": mime, "x-upsert": "false" },
          body: file,
        });
        if (!sent.ok)
          throw new Error(
            "Le transfert a échoué. Vérifiez votre connexion et réessayez.",
          );
        setProgress(
          kind === "images"
            ? `Conversion WebP : ${file.name}`
            : `Vérification PDF : ${file.name}`,
        );
        const ready = await estateRequest("/api/real-estate/upload", {
          action: "complete",
          id: prepared.id,
        });
        pendingId = null;
        setDraft((previous) => {
          if (!previous) return previous;
          const media = {
            ...ready.media,
            title: file.name.replace(/\.[^.]+$/, ""),
            alt: kind === "images" ? previous.title : "",
          };
          const list = [...previous[kind]];
          if (replaceIndex !== undefined)
            list[replaceIndex] = {
              ...media,
              title: list[replaceIndex].title,
              alt: list[replaceIndex].alt,
            };
          else list.push(media);
          return { ...previous, [kind]: list };
        });
      }
      setNotice(
        "Fichiers importés. Enregistrez le brouillon ou publiez les changements.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      if (pendingId)
        await estateRequest("/api/real-estate/upload", {
          action: "cancel",
          id: pendingId,
        }).catch(() => {});
      setProgress("");
      setBusy(false);
    }
  }
  const text = (key: keyof PropertyContent, label: string, large = false) =>
    draft ? (
      <Field
        key={key}
        name={key}
        label={label}
        large={large}
        value={draft[key] as string}
        onChange={(value) => change(key, value as never)}
      />
    ) : null;
  function mediaSection(kind: "images" | "documents") {
    if (!draft) return null;
    const isImages = kind === "images";
    return (
      <>
        <h3>
          {isImages ? "Galerie et photo de couverture" : "Documents du bien"}
        </h3>
        <p>
          {isImages
            ? "La première image est la couverture. Toutes les photos importées sont converties en WebP, redimensionnées et corrigées selon leur orientation."
            : "Ajoutez vos plans, brochures et dossiers PDF. Les documents apparaissent dans l’ordre choisi."}
        </p>
        <label className="reUpload">
          {isImages ? "Ajouter des photos" : "Ajouter des documents PDF"}
          <input
            type="file"
            accept={
              isImages
                ? "image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
                : ".pdf,application/pdf"
            }
            multiple
            disabled={busy}
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              e.target.value = "";
              void upload(files, kind);
            }}
          />
          <span>25 Mo maximum par fichier.</span>
        </label>
        <div className="reMediaRows">
          {draft[kind].map((m, index) => (
            <article className="reMediaRow" key={m.id}>
              {isImages ? (
                <Image
                  src={mediaUrl(m.id)}
                  alt={m.alt || draft.title}
                  width={130}
                  height={100}
                  unoptimized
                />
              ) : (
                <a
                  className="reFileIcon"
                  href={mediaUrl(m.id)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Ouvrir ${m.title}`}
                >
                  PDF ↗
                </a>
              )}
              <div>
                {isImages && index === 0 ? (
                  <span className="reBadge">Couverture</span>
                ) : null}
                <label>
                  {isImages ? "Légende de la photo" : "Titre du document"}
                  <input
                    value={m.title}
                    maxLength={200}
                    onChange={(e) =>
                      change(
                        kind,
                        draft[kind].map((item, i) =>
                          i === index
                            ? { ...item, title: e.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
                {isImages ? (
                  <label>
                    Description accessible
                    <input
                      value={m.alt}
                      maxLength={500}
                      onChange={(e) =>
                        change(
                          kind,
                          draft[kind].map((item, i) =>
                            i === index
                              ? { ...item, alt: e.target.value }
                              : item,
                          ),
                        )
                      }
                    />
                  </label>
                ) : null}
              </div>
              <div className="reActions">
                <button
                  type="button"
                  disabled={busy || index === 0}
                  onClick={() => change(kind, move(draft[kind], index, -1))}
                  aria-label={`Monter ${m.title}`}
                >
                  ↑ Monter
                </button>
                <button
                  type="button"
                  disabled={busy || index === draft[kind].length - 1}
                  onClick={() => change(kind, move(draft[kind], index, 1))}
                  aria-label={`Descendre ${m.title}`}
                >
                  ↓ Descendre
                </button>
                {isImages && index > 0 ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      change(kind, [
                        m,
                        ...draft[kind].filter((item) => item.id !== m.id),
                      ])
                    }
                  >
                    Définir comme couverture
                  </button>
                ) : null}
                <button
                  type="button"
                  className="reDanger"
                  disabled={busy}
                  onClick={() =>
                    change(
                      kind,
                      draft[kind].filter((item) => item.id !== m.id),
                    )
                  }
                >
                  Retirer
                </button>
              </div>
              <label className="reWide">
                Remplacer ce fichier
                <input
                  type="file"
                  accept={
                    isImages
                      ? "image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
                      : ".pdf,application/pdf"
                  }
                  disabled={busy}
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    e.target.value = "";
                    void upload(files, kind, index);
                  }}
                />
              </label>
            </article>
          ))}
        </div>
        {!draft[kind].length ? (
          <p>{isImages ? "Aucune photo ajoutée." : "Aucun document listé."}</p>
        ) : null}
      </>
    );
  }
  return (
    <dialog
      className="reEditorDialog"
      ref={dialog}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      aria-labelledby="re-editor-title"
    >
      <div className="reEditor">
        <header className="reEditorHeader">
          <div>
            <span className="reEyebrow">ÉDITION DU BIEN</span>
            <h2 id="re-editor-title">{draft?.title || "Chargement…"}</h2>
            <p>
              {property
                ? `${property.visibility === "published" ? "Publié" : property.visibility === "hidden" ? "Masqué" : "Brouillon"} · Version ${property.revision}`
                : "Connexion à Supabase…"}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={busy}
            aria-label="Fermer l’éditeur"
          >
            Fermer ×
          </button>
        </header>
        <div
          className="reEditorTabs"
          role="tablist"
          aria-label="Rubriques de la fiche"
        >
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              id={`re-tab-${t}`}
              aria-controls="re-editor-panel"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div
          className="reEditorBody"
          id="re-editor-panel"
          role="tabpanel"
          aria-labelledby={`re-tab-${tab}`}
        >
          <div aria-live="polite">
            {error ? (
              <div className="reError" role="alert">
                <p>{error}</p>
                <button type="button" onClick={reload} disabled={busy}>
                  Recharger la fiche
                </button>
              </div>
            ) : null}
            {notice ? <p className="reSuccess">{notice}</p> : null}
            {progress ? <p>{progress}</p> : null}
          </div>
          {draft && property ? (
            <fieldset
              disabled={busy || !!property.deleted_at}
              style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
            >
              {tab === "Informations" ? (
                <>
                  <section>
                    <h3>Informations principales</h3>
                    <div className="reFormGrid">
                      {text("title", "Titre du bien")}
                      {text("location", "Ville, région et adresse")}
                      <label>
                        Catégorie
                        <select
                          value={draft.category}
                          onChange={(e) =>
                            change(
                              "category",
                              e.target.value as PropertyContent["category"],
                            )
                          }
                        >
                          {propertyCategories.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </label>
                      {text(
                        "status",
                        "Statut affiché (à vendre, réservé, vendu…)",
                      )}
                      {text("rooms", "Pièces / chambres")}
                      {text("area", "Surface habitable (m²)")}
                      {text("exteriorArea", "Surface extérieure (m²)")}
                      {text("plotArea", "Surface parcelle (m²)")}
                      {text("exterior", "Terrain, extérieur et stationnement")}
                      {text("availability", "Disponibilité")}
                    </div>
                  </section>
                  <section>
                    <h3>Prix de vente</h3>
                    <label className="reCheck">
                      <input
                        type="checkbox"
                        checked={draft.priceOnRequest}
                        onChange={(e) =>
                          change("priceOnRequest", e.target.checked)
                        }
                      />
                      Prix sur demande
                    </label>
                    <div className="reFormGrid">
                      <label>
                        Montant
                        <input
                          id="re-field-priceAmount"
                          type="number"
                          min="0"
                          max="1000000000000"
                          step="0.01"
                          disabled={draft.priceOnRequest}
                          value={draft.priceAmount ?? ""}
                          onChange={(e) =>
                            change(
                              "priceAmount",
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                            )
                          }
                        />
                      </label>
                      <label>
                        Devise
                        <select
                          value={draft.currency}
                          onChange={(e) => change("currency", e.target.value)}
                        >
                          <option>CHF</option>
                          <option>EUR</option>
                          <option>USD</option>
                        </select>
                      </label>
                    </div>
                  </section>
                  <section>
                    <h3>Description</h3>
                    <div className="reFormGrid">
                      {text("descriptionTitle", "Titre de la présentation")}
                      {text("description", "Description complète", true)}
                    </div>
                  </section>
                  <section>
                    <h3>Caractéristiques supplémentaires</h3>
                    {text("factsTitle", "Titre de la rubrique")}
                    {draft.facts.map((f, i) => (
                      <div className="reFactRow" key={i}>
                        <label>
                          Libellé
                          <input
                            value={f.label}
                            onChange={(e) =>
                              change(
                                "facts",
                                draft.facts.map((v, j) =>
                                  j === i ? { ...v, label: e.target.value } : v,
                                ),
                              )
                            }
                          />
                        </label>
                        <label>
                          Valeur
                          <input
                            value={f.value}
                            onChange={(e) =>
                              change(
                                "facts",
                                draft.facts.map((v, j) =>
                                  j === i ? { ...v, value: e.target.value } : v,
                                ),
                              )
                            }
                          />
                        </label>
                        <button
                          type="button"
                          aria-label={`Supprimer la caractéristique ${i + 1}`}
                          onClick={() =>
                            change(
                              "facts",
                              draft.facts.filter((_, j) => j !== i),
                            )
                          }
                        >
                          Retirer
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        change("facts", [
                          ...draft.facts,
                          { label: "", value: "" },
                        ])
                      }
                    >
                      + Ajouter une caractéristique
                    </button>
                  </section>
                  <section>
                    <h3>Parcelle, documents et contact</h3>
                    <div className="reFormGrid">
                      {text("parcelTitle", "Titre de la rubrique parcelle")}
                      {text("documentsTitle", "Titre de la rubrique documents")}
                      {text("parcelText", "Informations de la parcelle", true)}
                      {text("contactTitle", "Titre de l’encart contact")}
                      {text("contactText", "Texte de l’encart contact", true)}
                    </div>
                  </section>
                </>
              ) : null}
              {tab === "Images" ? mediaSection("images") : null}
              {tab === "Documents" ? mediaSection("documents") : null}
              {tab === "Publication" ? (
                <>
                  <section>
                    <h3>Présentation dans le catalogue</h3>
                    <label className="reCheck">
                      <input
                        type="checkbox"
                        checked={draft.featured}
                        onChange={(e) => change("featured", e.target.checked)}
                      />
                      Mettre ce bien en avant
                    </label>
                    <label>
                      Ordre d’affichage (les plus petits nombres en premier)
                      <input
                        type="number"
                        value={draft.sortOrder}
                        min="-100000"
                        max="100000"
                        onChange={(e) =>
                          change("sortOrder", Number(e.target.value))
                        }
                      />
                    </label>
                    <p>Les biens mis en avant apparaissent avant les autres.</p>
                  </section>
                  <section>
                    <h3>Rubriques visibles</h3>
                    {(
                      [
                        ["showParcel", "Afficher la parcelle"],
                        ["showDocuments", "Afficher les documents"],
                        ["showContact", "Afficher l’encart contact"],
                      ] as const
                    ).map(([key, label]) => (
                      <label className="reCheck" key={key}>
                        <input
                          type="checkbox"
                          checked={draft[key]}
                          onChange={(e) => change(key, e.target.checked)}
                        />
                        {label}
                      </label>
                    ))}
                  </section>
                  <section>
                    <h3>Adresse de la fiche</h3>
                    <p>/{property.slug}</p>
                    <p>
                      Cette adresse est conservée lorsque vous renommez le bien,
                      afin de préserver les liens existants.
                    </p>
                  </section>
                  <section>
                    <h3>Visibilité et suppression</h3>
                    <p>
                      Enregistrer conserve vos changements en brouillon. Publier
                      remplace la fiche visible sur le site. Un bien masqué
                      conserve ses données.
                    </p>
                    <div className="reActions">
                      {property.visibility === "published" ? (
                        <button type="button" onClick={() => submit("hide")}>
                          Masquer le bien
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="reDanger"
                        onClick={() => submit("trash")}
                      >
                        Déplacer dans la corbeille
                      </button>
                    </div>
                    <p>
                      Les fichiers retirés restent dans l’historique pour
                      permettre une restauration.
                    </p>
                  </section>
                </>
              ) : null}
              {tab === "Historique" ? (
                <>
                  <h3>Historique des 50 dernières versions</h3>
                  <p>
                    Restaurer une version la remet en brouillon. La version
                    actuellement publiée reste visible jusqu’à votre prochaine
                    publication.
                  </p>
                  {versions.map((v) => (
                    <article className="reHistoryRow" key={v.id}>
                      <div>
                        <strong>
                          Version {v.revision} ·{" "}
                          {actionNames[v.action] || v.action}
                        </strong>
                        <p>{new Date(v.created_at).toLocaleString("fr-CH")}</p>
                        <p>{v.content.title}</p>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => submit("restore_version", v.id)}
                      >
                        Restaurer en brouillon
                      </button>
                    </article>
                  ))}
                  {!versions.length ? (
                    <p>
                      L’historique apparaîtra après votre premier
                      enregistrement.
                    </p>
                  ) : null}
                </>
              ) : null}
            </fieldset>
          ) : !error ? (
            <p>Chargement de la fiche…</p>
          ) : null}
        </div>
        <footer className="reEditorFooter">
          <span className="reDirty">
            {busy
              ? "Opération en cours…"
              : dirty
                ? "Modifications non enregistrées"
                : "Brouillon enregistré"}
          </span>
          <button
            type="button"
            disabled={!draft || busy}
            onClick={() => {
              if (draft) onPreview(draft);
            }}
          >
            Prévisualiser
          </button>
          <button
            type="button"
            disabled={!draft || busy || !!property?.deleted_at}
            onClick={() => submit("save")}
          >
            Enregistrer
          </button>
          <button
            type="button"
            className="rePrimary"
            disabled={!draft || busy || !!property?.deleted_at}
            onClick={() => submit("publish")}
          >
            Publier
          </button>
        </footer>
      </div>
    </dialog>
  );
}
