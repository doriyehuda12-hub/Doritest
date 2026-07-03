// סוכן התאמות — מתאים לידים לנכסים עם ניקוד.
// חיסכון בעלות: קודם סינון/דירוג מקומי (SQL + היוריסטיקה), ורק את השורטליסט
// שולחים ל-Claude לניקוד עדין. ללא מפתח — ההיוריסטיקה לבדה שימושית לחלוטין.

import { getDb } from '@/lib/db';
import { getLead, listMatches, replaceMatches } from '@/lib/db/queries';
import type { Lead, Listing } from '@/lib/types';
import { hasKey, callClaude, extractJson } from './base';

const SHORTLIST_SIZE = 12;

// ניקוד היוריסטי מקומי (0-100) — ללא AI, ללא עלות
function heuristicScore(lead: Lead, l: Listing): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // התאמת חדרים
  const rMin = lead.preferred_rooms_min ?? 0;
  const rMax = lead.preferred_rooms_max ?? 99;
  if (l.rooms >= rMin && l.rooms <= rMax) {
    score += 30;
    reasons.push(`מספר החדרים (${l.rooms}) תואם להעדפה`);
  } else if (l.rooms >= rMin - 1 && l.rooms <= rMax + 1) {
    score += 15;
    reasons.push(`מספר החדרים (${l.rooms}) קרוב להעדפה`);
  }

  // התאמת תקציב
  const bMin = lead.budget_min ?? 0;
  const bMax = lead.budget_max ?? Number.MAX_SAFE_INTEGER;
  if (l.price >= bMin && l.price <= bMax) {
    score += 40;
    reasons.push('המחיר בתוך טווח התקציב');
  } else if (l.price < bMin) {
    score += 25;
    reasons.push('המחיר מתחת לתקציב (הזדמנות)');
  } else if (l.price <= bMax * 1.1) {
    score += 20;
    reasons.push('המחיר מעט מעל התקציב (עד 10%)');
  }

  // התאמת אזור
  if (lead.preferred_areas.some((area) => l.address.includes(area))) {
    score += 30;
    reasons.push('הנכס נמצא באזור המועדף');
  }

  return { score: Math.min(100, score), reasons };
}

interface AiMatch {
  listing_id: number;
  score: number;
  reasons: string[];
}

export async function run(input: { leadId: number }) {
  const lead = getLead(input.leadId);
  if (!lead) return { demo: true, error: 'ליד לא נמצא', matches: [] };

  // שלב 1 — סינון SQL: לא כולל נכסים שנסגרו
  const rows = getDb()
    .prepare("SELECT * FROM listings WHERE status != 'נסגר'")
    .all() as any[];
  const listings: Listing[] = rows.map((r) => ({ ...r, images: [] }));

  // שלב 2 — דירוג היוריסטי מקומי ובחירת שורטליסט (חוסך שליחת כל המלאי)
  const scored = listings
    .map((l) => ({ listing: l, ...heuristicScore(lead, l) }))
    .sort((a, b) => b.score - a.score);
  const shortlist = scored.slice(0, SHORTLIST_SIZE);

  // מצב דמו (ללא מפתח) — ההיוריסטיקה לבדה
  if (!hasKey()) {
    replaceMatches(
      input.leadId,
      shortlist.map((s) => ({ listing_id: s.listing.id, score: s.score, reasons: s.reasons }))
    );
    return { demo: true, matches: listMatches(input.leadId) };
  }

  // שלב 3 — ניקוד עדין ע"י Claude, רק על השורטליסט, ללא PII של הליד
  const system =
    'אתה סוכן התאמות נדל"ן מומחה לאזור הרצליה פיתוח, גליל ים והירוקה. ' +
    'קבל העדפות של לקוח ורשימת נכסים, ונקד כל נכס בין 0 ל-100 לפי מידת ההתאמה ' +
    '(תקציב, אזור, מספר חדרים, והתאמה לצרכים). החזר נימוקים קצרים ומדויקים בעברית.';

  const payload = {
    העדפות_לקוח: {
      תקציב_מינימום: lead.budget_min,
      תקציב_מקסימום: lead.budget_max,
      אזורים_מועדפים: lead.preferred_areas,
      חדרים_מינימום: lead.preferred_rooms_min,
      חדרים_מקסימום: lead.preferred_rooms_max,
      הערות: lead.notes,
    },
    נכסים: shortlist.map((s) => ({
      listing_id: s.listing.id,
      כתובת: s.listing.address,
      חדרים: s.listing.rooms,
      מטר: s.listing.area_sqm,
      מחיר: s.listing.price,
      תיאור: s.listing.description,
    })),
  };

  const jsonSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      matches: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            listing_id: { type: 'integer' },
            score: { type: 'integer' },
            reasons: { type: 'array', items: { type: 'string' } },
          },
          required: ['listing_id', 'score', 'reasons'],
        },
      },
    },
    required: ['matches'],
  };

  try {
    const { text } = await callClaude({
      system,
      user: 'נקד את הנכסים הבאים עבור הלקוח:\n' + JSON.stringify(payload, null, 2),
      maxTokens: 2000,
      effort: 'high',
      thinking: true,
      jsonSchema,
    });

    const parsed = extractJson<{ matches: AiMatch[] }>(text);
    const ai = parsed?.matches ?? [];
    const byId = new Map(ai.map((m) => [m.listing_id, m]));

    // מיזוג: תוצאת AI היכן שקיימת, אחרת נופלים חזרה להיוריסטיקה
    const merged = shortlist.map((s) => {
      const m = byId.get(s.listing.id);
      return m
        ? { listing_id: s.listing.id, score: m.score, reasons: m.reasons }
        : { listing_id: s.listing.id, score: s.score, reasons: s.reasons };
    });
    replaceMatches(input.leadId, merged);
    return { demo: false, matches: listMatches(input.leadId) };
  } catch (e: any) {
    // כשל ב-AI — נופלים חזרה להיוריסטיקה (המערכת לא נשברת)
    replaceMatches(
      input.leadId,
      shortlist.map((s) => ({ listing_id: s.listing.id, score: s.score, reasons: s.reasons }))
    );
    return { demo: true, error: String(e?.message || e), matches: listMatches(input.leadId) };
  }
}
