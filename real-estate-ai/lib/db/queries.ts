import { getDb } from './index';
import type {
  Listing,
  Lead,
  Interaction,
  Match,
  FollowUp,
  ListingStatus,
  FunnelStage,
} from '@/lib/types';

// ---- עזרי המרה בין שורות DB לאובייקטים מוקלדים ----
function parseJson<T>(v: unknown, fallback: T): T {
  if (typeof v !== 'string') return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

function mapListing(r: any): Listing {
  return { ...r, images: parseJson<string[]>(r.images, []) };
}
function mapLead(r: any): Lead {
  return { ...r, preferred_areas: parseJson<string[]>(r.preferred_areas, []) };
}
function mapMatch(r: any): Match {
  return { ...r, reasons: parseJson<string[]>(r.reasons, []) };
}

// ==================== נכסים (Listings) ====================
export function listListings(status?: ListingStatus): Listing[] {
  const db = getDb();
  const rows = status
    ? db.prepare('SELECT * FROM listings WHERE status = ? ORDER BY updated_at DESC').all(status)
    : db.prepare('SELECT * FROM listings ORDER BY updated_at DESC').all();
  return (rows as any[]).map(mapListing);
}

export function getListing(id: number): Listing | null {
  const r = getDb().prepare('SELECT * FROM listings WHERE id = ?').get(id);
  return r ? mapListing(r) : null;
}

export type ListingInput = Omit<Listing, 'id' | 'created_at' | 'updated_at'>;

export function createListing(data: ListingInput): Listing {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO listings (address, rooms, area_sqm, price, status, owner, lead_source, description, images)
       VALUES (@address, @rooms, @area_sqm, @price, @status, @owner, @lead_source, @description, @images)`
    )
    .run({
      ...data,
      owner: data.owner ?? null,
      lead_source: data.lead_source ?? null,
      description: data.description ?? null,
      images: JSON.stringify(data.images ?? []),
    });
  return getListing(Number(info.lastInsertRowid))!;
}

export function updateListing(id: number, data: Partial<ListingInput>): Listing | null {
  const existing = getListing(id);
  if (!existing) return null;
  const merged = { ...existing, ...data };
  getDb()
    .prepare(
      `UPDATE listings SET address=@address, rooms=@rooms, area_sqm=@area_sqm, price=@price,
        status=@status, owner=@owner, lead_source=@lead_source, description=@description,
        images=@images, updated_at=datetime('now') WHERE id=@id`
    )
    .run({
      id,
      address: merged.address,
      rooms: merged.rooms,
      area_sqm: merged.area_sqm,
      price: merged.price,
      status: merged.status,
      owner: merged.owner ?? null,
      lead_source: merged.lead_source ?? null,
      description: merged.description ?? null,
      images: JSON.stringify(merged.images ?? []),
    });
  return getListing(id);
}

export function deleteListing(id: number): void {
  getDb().prepare('DELETE FROM listings WHERE id = ?').run(id);
}

// ==================== לידים (Leads) ====================
export function listLeads(): Lead[] {
  const rows = getDb().prepare('SELECT * FROM leads ORDER BY updated_at DESC').all();
  return (rows as any[]).map(mapLead);
}

export function getLead(id: number): Lead | null {
  const r = getDb().prepare('SELECT * FROM leads WHERE id = ?').get(id);
  return r ? mapLead(r) : null;
}

export type LeadInput = Omit<Lead, 'id' | 'created_at' | 'updated_at'>;

export function createLead(data: LeadInput): Lead {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO leads (name, phone, email, budget_min, budget_max, preferred_areas,
        preferred_rooms_min, preferred_rooms_max, funnel_stage, notes)
       VALUES (@name, @phone, @email, @budget_min, @budget_max, @preferred_areas,
        @preferred_rooms_min, @preferred_rooms_max, @funnel_stage, @notes)`
    )
    .run({
      name: data.name,
      phone: data.phone ?? null,
      email: data.email ?? null,
      budget_min: data.budget_min ?? null,
      budget_max: data.budget_max ?? null,
      preferred_areas: JSON.stringify(data.preferred_areas ?? []),
      preferred_rooms_min: data.preferred_rooms_min ?? null,
      preferred_rooms_max: data.preferred_rooms_max ?? null,
      funnel_stage: data.funnel_stage ?? 'ליד חדש',
      notes: data.notes ?? null,
    });
  return getLead(Number(info.lastInsertRowid))!;
}

export function updateLead(id: number, data: Partial<LeadInput>): Lead | null {
  const existing = getLead(id);
  if (!existing) return null;
  const m = { ...existing, ...data };
  getDb()
    .prepare(
      `UPDATE leads SET name=@name, phone=@phone, email=@email, budget_min=@budget_min,
        budget_max=@budget_max, preferred_areas=@preferred_areas,
        preferred_rooms_min=@preferred_rooms_min, preferred_rooms_max=@preferred_rooms_max,
        funnel_stage=@funnel_stage, notes=@notes, updated_at=datetime('now') WHERE id=@id`
    )
    .run({
      id,
      name: m.name,
      phone: m.phone ?? null,
      email: m.email ?? null,
      budget_min: m.budget_min ?? null,
      budget_max: m.budget_max ?? null,
      preferred_areas: JSON.stringify(m.preferred_areas ?? []),
      preferred_rooms_min: m.preferred_rooms_min ?? null,
      preferred_rooms_max: m.preferred_rooms_max ?? null,
      funnel_stage: m.funnel_stage,
      notes: m.notes ?? null,
    });
  return getLead(id);
}

export function deleteLead(id: number): void {
  getDb().prepare('DELETE FROM leads WHERE id = ?').run(id);
}

// ==================== אינטראקציות ====================
export function listInteractions(leadId: number): Interaction[] {
  return getDb()
    .prepare('SELECT * FROM interactions WHERE lead_id = ? ORDER BY created_at DESC')
    .all(leadId) as Interaction[];
}

export function addInteraction(leadId: number, type: string, content: string): Interaction {
  const info = getDb()
    .prepare('INSERT INTO interactions (lead_id, type, content) VALUES (?, ?, ?)')
    .run(leadId, type, content);
  return getDb()
    .prepare('SELECT * FROM interactions WHERE id = ?')
    .get(Number(info.lastInsertRowid)) as Interaction;
}

// ==================== התאמות (Matches) ====================
export function listMatches(leadId: number): (Match & { listing: Listing | null })[] {
  const rows = getDb()
    .prepare('SELECT * FROM matches WHERE lead_id = ? ORDER BY score DESC')
    .all(leadId) as any[];
  return rows.map((r) => ({ ...mapMatch(r), listing: getListing(r.listing_id) }));
}

// מחליף את קבוצת ההתאמות של ליד (ניקוד מחדש)
export function replaceMatches(
  leadId: number,
  items: { listing_id: number; score: number; reasons: string[] }[]
): void {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM matches WHERE lead_id = ?').run(leadId);
    const ins = db.prepare(
      'INSERT INTO matches (lead_id, listing_id, score, reasons) VALUES (?, ?, ?, ?)'
    );
    for (const it of items) {
      ins.run(leadId, it.listing_id, Math.round(it.score), JSON.stringify(it.reasons ?? []));
    }
  });
  tx();
}

// ==================== תזכורות (Follow-ups) ====================
export function listFollowUps(opts?: { dueOnly?: boolean }): (FollowUp & { lead: Lead | null })[] {
  const rows = opts?.dueOnly
    ? getDb()
        .prepare(
          "SELECT * FROM follow_ups WHERE done = 0 AND due_date <= datetime('now') ORDER BY due_date ASC"
        )
        .all()
    : getDb().prepare('SELECT * FROM follow_ups ORDER BY due_date ASC').all();
  return (rows as FollowUp[]).map((f) => ({ ...f, lead: getLead(f.lead_id) }));
}

export function addFollowUp(leadId: number, dueDate: string, note?: string): FollowUp {
  const info = getDb()
    .prepare('INSERT INTO follow_ups (lead_id, due_date, note) VALUES (?, ?, ?)')
    .run(leadId, dueDate, note ?? null);
  return getDb()
    .prepare('SELECT * FROM follow_ups WHERE id = ?')
    .get(Number(info.lastInsertRowid)) as FollowUp;
}

export function completeFollowUp(id: number): void {
  getDb().prepare('UPDATE follow_ups SET done = 1 WHERE id = ?').run(id);
}
