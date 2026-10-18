"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { publicProperty, type PropertyContent } from "@/lib/real-estate/types";
import { RealEstateProjectProfile } from "./RealEstateProjectProfile";
import { RealEstateAdminAccess } from "./RealEstateAdminAccess";
const Editor = dynamic(() => import("./RealEstatePropertyEditor"), {
  loading: () => <p>Ouverture de l’éditeur…</p>,
});
export function RealEstateProjectWorkspace({
  locale,
  slug,
  propertyId,
  initialContent,
  initialPublished,
  startEditing,
}: {
  locale: Locale;
  slug: string;
  propertyId: string;
  initialContent: PropertyContent;
  initialPublished: PropertyContent | null;
  startEditing: boolean;
}) {
  const [published, setPublished] = useState(initialPublished);
  const [content, setContent] = useState(initialContent),
    [editing, setEditing] = useState(startEditing),
    [mounted, setMounted] = useState(startEditing),
    [preview, setPreview] = useState(startEditing),
    [field, setField] = useState("");
  function edit(name = "") {
    setField(name);
    setMounted(true);
    setEditing(true);
  }
  const management = (
    <>
      <RealEstateAdminAccess onAuthorized={() => edit()}>
        Modifier ce bien
      </RealEstateAdminAccess>
      {preview ? (
        <div className="rePreviewBar">
          <span>
            Prévisualisation administrateur · Les changements restent privés
            jusqu’à leur publication.
          </span>
          <div className="reActions">
            <button type="button" onClick={() => edit()}>
              Revenir à l’éditeur
            </button>
            <button
              type="button"
              onClick={() => {
                setPreview(false);
                setContent(published ?? initialContent);
              }}
            >
              {published ? "Voir la version publique" : "Fermer l’aperçu"}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
  return (
    <>
      <RealEstateProjectProfile
        key={content.images.map((i) => i.id).join(",")}
        locale={locale}
        project={publicProperty(slug, content)}
        management={management}
        onEditField={preview ? edit : undefined}
      />
      {mounted ? (
        <Editor
          propertyId={propertyId}
          open={editing}
          focusField={field}
          onClose={() => {
            setEditing(false);
            setMounted(false);
            setContent(published ?? initialContent);
            setPreview(false);
          }}
          onPreview={(draft) => {
            setContent(draft);
            setPreview(true);
            setEditing(false);
          }}
          onPublished={(published) => {
            setPublished(published);
            setContent(published);
            setPreview(false);
          }}
        />
      ) : null}
    </>
  );
}
