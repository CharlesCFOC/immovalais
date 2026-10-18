"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronLeft,
  FileText,
  Map,
  MapPin,
  Ruler,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

import type { Locale } from "@/lib/i18n";
import { withLocalePath } from "@/lib/i18n";
import { RealEstateNavigation } from "@/components/RealEstateNavigation";
import { RealEstateFooter } from "@/components/RealEstateFooter";

import type { ReactNode } from "react";
import type { PublicProperty } from "@/lib/real-estate/types";
export function RealEstateProjectProfile({
  locale,
  project,
  management,
  onEditField,
}: {
  locale: Locale;
  project: PublicProperty;
  management?: ReactNode;
  onEditField?: (field: string) => void;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const gallery = project.images?.length ? project.images : [project.image];
  const isFrench = locale === "fr";

  return (
    <>
      <RealEstateNavigation locale={locale} active="listings" />
      <main className="siteMain realEstateSitePage realEstateProfilePage">
        <div className="realEstateProfileShell">
          <nav
            className="realEstateProfileBreadcrumbs"
            aria-label={isFrench ? "Fil d’Ariane" : "Breadcrumbs"}
          >
            <Link href={withLocalePath(locale, "/immobilier/biens")}>
              <ChevronLeft aria-hidden="true" size={14} />{" "}
              {isFrench ? "Retour aux biens" : "Back to properties"}
            </Link>
            <span aria-hidden="true">/</span>
            <span>{project.title}</span>
          </nav>

          {management}
          <header className="realEstateProfileHeader">
            <div>
              <span className="realEstateProfileBadge">
                <Sparkles aria-hidden="true" size={12} /> {project.status}
              </span>
              <h1>{project.title}</h1>
              {onEditField ? (
                <button
                  className="reInlineEdit"
                  onClick={() => onEditField("title")}
                >
                  Modifier le titre
                </button>
              ) : null}
              <p>
                <MapPin aria-hidden="true" size={17} /> {project.location}
              </p>
              {onEditField ? (
                <button
                  className="reInlineEdit"
                  onClick={() => onEditField("location")}
                >
                  Modifier la localisation
                </button>
              ) : null}
            </div>
            <div className="realEstateProfileHeaderAside">
              <p className="realEstateProfilePriceLabel">
                {isFrench ? "Prix de vente" : "Sale price"}
              </p>
              <p className="realEstateProfilePrice">{project.price}</p>
              {onEditField ? (
                <button
                  className="reInlineEdit"
                  onClick={() => onEditField("priceAmount")}
                >
                  Modifier le prix
                </button>
              ) : null}
            </div>
          </header>

          <section
            id="gallery"
            className="realEstateProfileGallery"
            data-single-image={gallery.length === 1 ? "true" : "false"}
            aria-label={isFrench ? "Galerie du projet" : "Project gallery"}
          >
            <button
              className="realEstateProfileHeroImage"
              type="button"
              onClick={() => setActiveImage(0)}
              aria-label="Voir la photo principale"
            >
              <Image
                unoptimized
                src={gallery[Math.min(activeImage, gallery.length - 1)]}
                alt={project.imageAlts[activeImage] || project.title}
                fill
                priority
                sizes="(max-width: 800px) 100vw, 58vw"
              />
            </button>
            {gallery.length > 1 ? (
              <div className="realEstateProfileGalleryRail">
                {gallery.slice(1).map((image, index) => (
                  <button
                    className={`realEstateProfileGalleryThumb${activeImage === index + 1 ? " is-active" : ""}`}
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index + 1)}
                    aria-label={`Voir la photo ${index + 2}`}
                  >
                    <Image
                      unoptimized
                      src={image}
                      alt={project.imageAlts[index + 1] || ""}
                      fill
                      sizes="(max-width: 800px) 25vw, 20vw"
                    />
                  </button>
                ))}
                <button
                  className="realEstateProfileAllPhotos"
                  type="button"
                  onClick={() => setActiveImage(0)}
                >
                  <span>{gallery.length}</span>{" "}
                  {isFrench ? "Toutes les photos" : "All photos"}{" "}
                  <ArrowUpRight aria-hidden="true" size={15} />
                </button>
              </div>
            ) : null}
          </section>

          {project.imageCaptions[activeImage] ? (
            <p className="rePhotoCaption">
              {project.imageCaptions[activeImage]}
            </p>
          ) : null}
          {onEditField ? (
            <button
              className="reInlineEdit"
              onClick={() => onEditField("images")}
            >
              Gérer les photos
            </button>
          ) : null}
          <div className="realEstateProfileTabs" role="tablist">
            <a className="is-active" href="#property">
              {isFrench ? "Le bien" : "Property"}
            </a>
            <a href="#gallery">{isFrench ? "Galerie" : "Gallery"}</a>
            {project.showParcel ? (
              <a href="#parcel">{isFrench ? "Parcelle" : "Parcel"}</a>
            ) : null}
            {project.showDocuments ? <a href="#documents">Documents</a> : null}
          </div>

          <div className="realEstateProfileLayout">
            <div className="realEstateProfileContent">
              <section
                id="property"
                className="realEstateProfileFacts reSurfaceFacts"
                aria-label={isFrench ? "Résumé du bien" : "Property summary"}
              >
                <div>
                  <Ruler aria-hidden="true" size={20} />
                  <strong>{project.rooms}</strong>
                  <span>{isFrench ? "pièces" : "rooms"}</span>
                </div>
                <div>
                  <Ruler aria-hidden="true" size={20} />
                  <strong>{project.area || "—"}</strong>
                  <span>{isFrench ? "Surface habitable" : "Living area"}</span>
                </div>
                <div>
                  <Ruler aria-hidden="true" size={20} />
                  <strong>{project.exteriorArea || "—"}</strong>
                  <span>
                    {isFrench ? "Surface extérieure" : "Outdoor area"}
                  </span>
                </div>
                <div>
                  <Map aria-hidden="true" size={20} />
                  <strong>{project.plotArea || "—"}</strong>
                  <span>{isFrench ? "Surface parcelle" : "Plot area"}</span>
                </div>
              </section>

              <section className="realEstateProfileSection">
                <p className="realEstateProfileOverline">{project.category}</p>
                <h2>{project.descriptionTitle}</h2>
                <p style={{ whiteSpace: "pre-line" }}>{project.description}</p>
                {onEditField ? (
                  <button
                    className="reInlineEdit"
                    onClick={() => onEditField("description")}
                  >
                    Modifier la description
                  </button>
                ) : null}
              </section>

              <section className="realEstateProfileSection realEstateProfileCharacteristics">
                <h2>{project.factsTitle}</h2>
                <dl>
                  {project.facts.map((fact, index) => (
                    <div key={`${fact.label}-${index}`}>
                      <dt>{fact.label}</dt>
                      <dd>{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              {project.showParcel ? (
                <section
                  id="parcel"
                  className="realEstateProfileSection realEstateProfileParcel"
                >
                  <h2>{project.parcelTitle}</h2>
                  <div className="realEstateProfileParcelCard">
                    <Map aria-hidden="true" size={28} />
                    <span>{project.parcelText}</span>
                  </div>
                </section>
              ) : null}

              {project.showDocuments ? (
                <section
                  id="documents"
                  className="realEstateProfileSection realEstateProfileDocuments"
                >
                  <h2>{project.documentsTitle}</h2>
                  {onEditField ? (
                    <button
                      className="reInlineEdit"
                      onClick={() => onEditField("documents")}
                    >
                      Gérer les documents
                    </button>
                  ) : null}
                  {project.documents.length === 0 ? (
                    <p>
                      {isFrench
                        ? "Aucun document listé"
                        : "No documents listed"}
                    </p>
                  ) : (
                    project.documents.map((document) => {
                      const content = (
                        <>
                          <FileText aria-hidden="true" size={21} />
                          <div>
                            <strong>{document.title}</strong>
                            <span>
                              {document.type} ·{" "}
                              {document.href
                                ? isFrench
                                  ? "Ouvrir dans le navigateur"
                                  : "Open in browser"
                                : isFrench
                                  ? "À venir"
                                  : "Coming soon"}
                            </span>
                          </div>
                          <span>
                            {document.href
                              ? isFrench
                                ? "Consulter"
                                : "View"
                              : isFrench
                                ? "À venir"
                                : "Coming soon"}{" "}
                            <ArrowUpRight aria-hidden="true" size={15} />
                          </span>
                        </>
                      );
                      return document.href ? (
                        <a
                          className="realEstateProfileDocument"
                          href={document.href}
                          key={document.title}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {content}
                        </a>
                      ) : (
                        <div
                          className="realEstateProfileDocument"
                          key={document.title}
                        >
                          {content}
                        </div>
                      );
                    })
                  )}
                </section>
              ) : null}
            </div>

            {project.showContact ? (
              <aside className="realEstateProfileContact">
                <p className="realEstateProfilePriceLabel">
                  {isFrench ? "Prix de vente" : "Sale price"}
                </p>
                <strong>{project.price}</strong>
                <hr />
                <h2>{project.contactTitle}</h2>
                <p>{project.contactText}</p>
                <form onSubmit={(event) => event.preventDefault()}>
                  <input
                    aria-label="Nom complet"
                    placeholder={isFrench ? "Nom complet *" : "Full name *"}
                    required
                  />
                  <input
                    type="email"
                    aria-label="Adresse e-mail"
                    placeholder={
                      isFrench ? "Adresse e-mail *" : "Email address *"
                    }
                    required
                  />
                  <input
                    type="tel"
                    aria-label="Numéro de téléphone"
                    placeholder={
                      isFrench ? "Numéro de téléphone *" : "Phone number *"
                    }
                    required
                  />
                  <button type="submit">
                    {isFrench ? "Organiser une visite" : "Arrange a visit"}{" "}
                    <ArrowUpRight aria-hidden="true" size={16} />
                  </button>
                </form>
                <div className="realEstateProfileTrust">
                  <ShieldCheck aria-hidden="true" size={17} />{" "}
                  {isFrench
                    ? "Réponse personnalisée par Brother Studio"
                    : "Personal reply from Brother Studio"}
                </div>
              </aside>
            ) : null}
          </div>
        </div>
      </main>
      <RealEstateFooter locale={locale} />
    </>
  );
}
