// סוכן מו"מ ומכירות — נקודות מו"מ, ניתוח הצעה, אסטרטגיית סגירה ותסריט שיחה.

import { getListing } from '@/lib/db/queries';
import type { Listing } from '@/lib/types';
import { hasKey, callClaude } from './base';

function demoText(l: Listing, offer?: number): string {
  const asking = l.price;
  const gapText =
    offer && offer > 0
      ? `ההצעה (${offer.toLocaleString('he-IL')} ₪) נמוכה ב-${(((asking - offer) / asking) * 100).toFixed(1)}% ממחיר המבוקש.`
      : 'טרם התקבלה הצעה מספרית.';
  return `📊 ניתוח מו"מ — ${l.address}
מחיר מבוקש: ${asking.toLocaleString('he-IL')} ₪
${gapText}

נקודות מו"מ לטובת המוכר:
• מיקום מבוקש (${l.address.split(',')[1]?.trim() || 'אזור יוקרה'})
• ${l.rooms} חדרים, ${l.area_sqm} מ"ר — יחס שטח אטרקטיבי
• ${l.description || 'מצב הנכס'}

אסטרטגיית סגירה מוצעת:
1. להדגיש ביקוש ועניין מצדדים נוספים.
2. לעגן טווח יעד ריאלי (2-4% מתחת למבוקש).
3. להציע גמישות בתנאי תשלום/מועד פינוי במקום הנחה במחיר.

תסריט שיחה קצר:
"אני מבין את ההצעה. הנכס במיקום הזה נדיר ויש עליו עניין. אם נתקדם למספר של X נוכל לסגור מהר ולתת לך ודאות."`;
}

export async function run(input: { listingId: number; offerPrice?: number; context?: string }) {
  const listing = getListing(input.listingId);
  if (!listing) return { demo: true, error: 'נכס לא נמצא', text: '' };

  if (!hasKey()) {
    return { demo: true, text: demoText(listing, input.offerPrice) };
  }

  const system =
    'אתה יועץ מכירות ומו"מ בכיר בנדל"ן יוקרה בישראל. ספק ניתוח מו"מ חד, ' +
    'אסטרטגיית סגירה מעשית ותסריט שיחה קצר בעברית. היה ריאלי ומבוסס נתונים.';

  const user = `הכן ניתוח מו"מ עבור:
כתובת: ${listing.address}
מחיר מבוקש: ${listing.price.toLocaleString('he-IL')} ₪
חדרים: ${listing.rooms}, שטח: ${listing.area_sqm} מ"ר
תיאור: ${listing.description || 'אין'}
${input.offerPrice ? `הצעת קונה: ${input.offerPrice.toLocaleString('he-IL')} ₪` : 'טרם התקבלה הצעה.'}
${input.context ? `הקשר נוסף: ${input.context}` : ''}

כלול: (1) ניתוח הפער, (2) נקודות מו"מ, (3) אסטרטגיית סגירה, (4) תסריט שיחה קצר.`;

  try {
    const { text } = await callClaude({
      system,
      user,
      maxTokens: 1800,
      effort: 'high', // משימה אנליטית — שווה את העלות
      thinking: true,
    });
    return { demo: false, text: text || demoText(listing, input.offerPrice) };
  } catch (e: any) {
    return { demo: true, error: String(e?.message || e), text: demoText(listing, input.offerPrice) };
  }
}
