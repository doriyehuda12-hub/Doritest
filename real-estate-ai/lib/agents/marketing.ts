// סוכן שיווק — מייצר תיאורי נכס, פוסטים לרשתות וכותרות מכירתיות בעברית.

import { getListing } from '@/lib/db/queries';
import type { Listing } from '@/lib/types';
import { hasKey, callClaude } from './base';

export type MarketingKind = 'description' | 'facebook' | 'tiktok' | 'headline';

const KIND_LABEL: Record<MarketingKind, string> = {
  description: 'תיאור נכס מפורט',
  facebook: 'פוסט לפייסבוק',
  tiktok: 'תסריט/קופי לטיקטוק',
  headline: 'כותרת מכירתית',
};

function priceText(p: number): string {
  return (p / 1000000).toFixed(2).replace(/\.00$/, '') + 'M ₪';
}

// טקסט דמו (ללא AI) — עדיין שימושי כבסיס
function demoText(l: Listing, kind: MarketingKind): string {
  const base = `${l.rooms} חד' | ${l.area_sqm} מ"ר | ${l.address} | ${priceText(l.price)}`;
  switch (kind) {
    case 'headline':
      return `✨ הזדמנות נדירה: דירת ${l.rooms} חדרים ב${l.address.split(',')[1]?.trim() || l.address} — ${priceText(l.price)}`;
    case 'facebook':
      return `🏡 חדש למכירה!\n${base}\n\n${l.description || 'נכס מרשים במיקום מבוקש.'}\n\nלפרטים ותיאום ביקור — פנו אליי בפרטי. 📞\n#נדלן #הרצליהפיתוח #דירהלמכירה`;
    case 'tiktok':
      return `🎬 תסריט טיקטוק:\n[פתיח] "רגע, תראו את זה 👀"\n[מעבר] סיור מהיר: ${l.rooms} חדרים, ${l.area_sqm} מ"ר\n[שיא] הנוף/הגינה\n[סיום] "${priceText(l.price)} בלבד — לפרטים בביו" 🔥`;
    default:
      return `${l.description || 'נכס מרשים'}\n\n${base}.\nהזדמנות מצוינת למשפחה או משקיע באחד האזורים המבוקשים.`;
  }
}

export async function run(input: { listingId: number; kind: MarketingKind }) {
  const listing = getListing(input.listingId);
  if (!listing) return { demo: true, error: 'נכס לא נמצא', text: '' };

  const kind = input.kind || 'description';

  if (!hasKey()) {
    return { demo: true, text: demoText(listing, kind) };
  }

  const system =
    'אתה קופירייטר שיווקי מומחה לנדל"ן יוקרה בישראל. כתוב תוכן שיווקי משכנע, ' +
    'אותנטי ובעברית תקנית, מותאם לפלטפורמה המבוקשת. הימנע מהגזמות לא אמינות.';

  const user = `צור ${KIND_LABEL[kind]} עבור הנכס הבא:
כתובת: ${listing.address}
חדרים: ${listing.rooms}
שטח: ${listing.area_sqm} מ"ר
מחיר: ${listing.price.toLocaleString('he-IL')} ₪
תיאור קיים: ${listing.description || 'אין'}`;

  try {
    const { text } = await callClaude({
      system,
      user,
      maxTokens: 900,
      effort: 'low', // תוכן יצירתי קצר — אין צורך ב-effort גבוה
    });
    return { demo: false, text: text || demoText(listing, kind) };
  } catch (e: any) {
    return { demo: true, error: String(e?.message || e), text: demoText(listing, kind) };
  }
}
