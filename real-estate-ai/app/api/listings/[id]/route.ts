import { NextRequest, NextResponse } from 'next/server';
import { getListing, updateListing, deleteListing } from '@/lib/db/queries';
import { listingSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const listing = getListing(Number(id));
  if (!listing) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 });
  return NextResponse.json(listing);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const body = await req.json();
    const data = listingSchema.partial().parse(body);
    const updated = updateListing(Number(id), data as any);
    if (!updated) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.issues ?? String(e?.message || e) }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  deleteListing(Number(id));
  return NextResponse.json({ ok: true });
}
