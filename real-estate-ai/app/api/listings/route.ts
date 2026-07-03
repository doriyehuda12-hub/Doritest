import { NextRequest, NextResponse } from 'next/server';
import { listListings, createListing } from '@/lib/db/queries';
import { listingSchema } from '@/lib/validation';
import type { ListingStatus } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/listings?status=פעיל — רשימת נכסים (עם סינון אופציונלי)
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status') as ListingStatus | null;
  return NextResponse.json(listListings(status || undefined));
}

// POST /api/listings — יצירת נכס
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = listingSchema.parse(body);
    return NextResponse.json(createListing(data as any), { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.issues ?? String(e?.message || e) }, { status: 400 });
  }
}
