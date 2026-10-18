import Link from "next/link";
export default function NotFound() { return <main style={{ minHeight: "70vh", display: "grid", placeContent: "center", textAlign: "center", padding: 24 }}><h1>Page introuvable</h1><p>La page demandée n’existe pas ou n’est plus publiée.</p><Link href="/fr/immobilier">Retour à l’accueil</Link></main>; }
