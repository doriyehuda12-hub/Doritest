// סוכן ניהול משימות — סיכום היום, תעדוף follow-ups וזיהוי לידים "מתקררים".
// רוב הנתונים מחושבים מקומית מה-DB (זול/מהיר); ה-AI רק כותב סיכום נעים.

import { getDb } from '@/lib/db';
import { listFollowUps } from '@/lib/db/queries';
import { hasKey, callClaude } from './base';

const COLD_DAYS = 7;

function gatherData() {
  const db = getDb();

  // התפלגות משפך
  const stages = db
    .prepare('SELECT funnel_stage AS stage, COUNT(*) AS c FROM leads GROUP BY funnel_stage')
    .all() as { stage: string; c: number }[];

  // תזכורות שהגיע זמנן
  const due = listFollowUps({ dueOnly: true });

  // לידים "מתקררים": אינטראקציה אחרונה לפני יותר מ-7 ימים (או ללא אינטראקציה)
  const cold = db
    .prepare(
      `SELECT l.id, l.name, l.funnel_stage AS stage,
              MAX(i.created_at) AS last_interaction
       FROM leads l
       LEFT JOIN interactions i ON i.lead_id = l.id
       WHERE l.funnel_stage != 'סגירה'
       GROUP BY l.id
       HAVING last_interaction IS NULL
          OR last_interaction < datetime('now', ?)
       ORDER BY last_interaction ASC`
    )
    .all(`-${COLD_DAYS} days`) as { id: number; name: string; stage: string; last_interaction: string | null }[];

  return { stages, due, cold };
}

function demoText(d: ReturnType<typeof gatherData>): string {
  const stageLines = d.stages.map((s) => `  • ${s.stage}: ${s.c}`).join('\n');
  const dueLines =
    d.due.length === 0
      ? '  אין תזכורות שהגיע זמנן 🎉'
      : d.due.map((f) => `  • ${f.lead?.name ?? 'ליד'} — ${f.note ?? 'מעקב'} (יעד: ${f.due_date})`).join('\n');
  const coldLines =
    d.cold.length === 0
      ? '  אין לידים מתקררים 👍'
      : d.cold
          .map((c) => `  • ${c.name} (${c.stage}) — אינטראקציה אחרונה: ${c.last_interaction ?? 'אף פעם'}`)
          .join('\n');

  return `📋 סיכום היום

התפלגות משפך המכירות:
${stageLines}

⏰ מעקבים לביצוע היום (${d.due.length}):
${dueLines}

🧊 לידים מתקררים — דורשים תשומת לב (${d.cold.length}):
${coldLines}

המלצה: התחל מהמעקבים שהגיע זמנם, ולאחר מכן חזור אל הלידים המתקררים לפי סדר.`;
}

export async function run() {
  const data = gatherData();

  if (!hasKey()) {
    return { demo: true, text: demoText(data), data };
  }

  const system =
    'אתה עוזר אישי לסוכן נדל"ן. קבל תמונת מצב יומית וכתוב סיכום קצר, מעשי ' +
    'וממוקד בעברית, עם רשימת פעולות מתועדפת ל-3 המשימות החשובות ביותר.';

  try {
    const { text } = await callClaude({
      system,
      user: 'להלן תמונת המצב היומית (JSON). כתוב סיכום ותעדוף פעולות:\n' + JSON.stringify(data, null, 2),
      maxTokens: 1000,
      effort: 'medium',
    });
    return { demo: false, text: text || demoText(data), data };
  } catch (e: any) {
    return { demo: true, error: String(e?.message || e), text: demoText(data), data };
  }
}
