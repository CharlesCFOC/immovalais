import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Origine invalide." }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Requête invalide." }, { status: 400 }); }
  if (clean(body.website, 200)) return NextResponse.json({ ok: true }, { status: 202 });
  const email = clean(body.email, 200).toLowerCase();
  const name = clean(body.name, 120);
  const phone = clean(body.phone, 40);
  const message = clean(body.message, 4000);
  if (!name || !emailPattern.test(email) || !message) return NextResponse.json({ error: "Vérifiez les champs obligatoires." }, { status: 400 });
  if (body.source !== "campaign-landing-valuation" || !body.valuation || typeof body.valuation !== "object") return NextResponse.json({ error: "Demande d’estimation incomplète." }, { status: 400 });
  const v = body.valuation as Record<string, unknown>;
  const firstName = clean(v.firstName, 60), lastName = clean(v.lastName, 60), propertyType = clean(v.propertyType, 80), propertyAddress = clean(v.propertyAddress, 500);
  const submissionId = clean(body.submissionId, 36);
  if (!firstName || !lastName || !propertyType || !propertyAddress || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId)) return NextResponse.json({ error: "Demande d’estimation incomplète." }, { status: 400 });
  const desired = clean(v.desiredPriceChf, 30);
  if (desired && (!/^\d+(?:\.\d{1,2})?$/.test(desired) || Number(desired) > 1e12)) return NextResponse.json({ error: "Prix invalide." }, { status: 400 });
  const { error } = await getSupabaseAdminClient().from("property_valuation_requests").upsert({
    submission_id: submissionId, first_name: firstName, last_name: lastName, email, phone,
    property_type: propertyType, property_address: propertyAddress, room_count: clean(v.roomCount, 20) || "0",
    approximate_area: clean(v.approximateArea, 30) || null, contact_time: clean(v.contactTime, 80) || "Sans préférence",
    sale_timeline: clean(v.saleTimeline, 80) || "À définir", desired_price_chf: desired ? Number(desired) : null,
    source: "campaign-landing-valuation",
  }, { onConflict: "submission_id", ignoreDuplicates: true });
  if (error) {
    console.error("Unable to save valuation enquiry", error.message);
    return NextResponse.json({ error: "Votre demande n’a pas pu être enregistrée." }, { status: 503 });
  }
  return NextResponse.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
