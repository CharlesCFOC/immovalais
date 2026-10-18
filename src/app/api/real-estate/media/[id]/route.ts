import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/adminSession";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { MEDIA_BUCKET } from "@/lib/real-estate/server";
import type { PropertyContent } from "@/lib/real-estate/types";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id))
    return new NextResponse(null, { status: 404 });
  const db = getSupabaseAdminClient(),
    { data: asset } = await db
      .from("real_estate_assets")
      .select("property_id,path,ready")
      .eq("id", id)
      .maybeSingle();
  if (!asset?.ready) return new NextResponse(null, { status: 404 });
  const { data: property } = await db
    .from("real_estate_properties")
    .select("published,visibility,deleted_at")
    .eq("id", asset.property_id)
    .maybeSingle();
  const published = property?.published as PropertyContent | null;
  const isPublic =
    property?.visibility === "published" &&
    !property.deleted_at &&
    published &&
    [...published.images, ...published.documents].some((m) => m.id === id);
  if (!isPublic && !(await hasAdminSession()))
    return new NextResponse(null, { status: 404 });
  const { data, error } = await db.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(asset.path, 300);
  if (error || !data) return new NextResponse(null, { status: 404 });
  return NextResponse.redirect(data.signedUrl, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
