// תשתית משותפת לסוכני ה-AI.
// עיקרון מנחה: חיסכון בעלות. ללא מפתח — אין קריאה ל-API כלל (מצב דמו).

export function hasKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

function model(): string {
  return process.env.AI_MODEL || 'claude-opus-4-8';
}

export interface CallOptions {
  system: string; // הנחיית מערכת קבועה — ניתנת ל-caching
  user: string; // הודעת המשתמש
  maxTokens?: number; // תקרת פלט (חוסך כסף)
  effort?: 'low' | 'medium' | 'high'; // עומק/עלות
  thinking?: boolean; // חשיבה מורחבת (יקר יותר) — רק כשצריך
  jsonSchema?: Record<string, unknown>; // פלט מובנה
}

export interface CallResult {
  text: string;
  usage?: { input_tokens: number; output_tokens: number };
}

// קריאה ל-Claude. מניחה שקיים מפתח (יש לבדוק hasKey() לפני).
export async function callClaude(opts: CallOptions): Promise<CallResult> {
  // ייבוא דינמי — כך שהאפליקציה רצה גם אם החבילה לא מותקנת (מצב דמו)
  const mod: any = await import('@anthropic-ai/sdk');
  const Anthropic = mod.default;
  const client = new Anthropic(); // קורא ANTHROPIC_API_KEY מהסביבה

  const req: any = {
    model: model(),
    max_tokens: opts.maxTokens ?? 1200,
    // Prompt caching על ההנחיה הקבועה — קריאות חוזרות זולות ~פי 10
    system: [{ type: 'text', text: opts.system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: opts.user }],
    output_config: { effort: opts.effort ?? 'medium' },
  };

  // חשיבה מורחבת רק כשמבקשים אותה במפורש (חוסך טוקנים כברירת מחדל)
  if (opts.thinking) req.thinking = { type: 'adaptive' };

  // פלט מובנה (JSON) — ניקוד אמין בלי בזבוז טוקנים על פרוזה
  if (opts.jsonSchema) {
    req.output_config.format = { type: 'json_schema', schema: opts.jsonSchema };
  }

  const resp = await client.messages.create(req);
  const text = (resp.content || [])
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('\n')
    .trim();

  return { text, usage: resp.usage };
}

// חילוץ JSON מטקסט בצורה עמידה (ליתר ביטחון)
export function extractJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    const start = text.indexOf('{');
    const startArr = text.indexOf('[');
    const from = start === -1 ? startArr : startArr === -1 ? start : Math.min(start, startArr);
    const lastObj = text.lastIndexOf('}');
    const lastArr = text.lastIndexOf(']');
    const to = Math.max(lastObj, lastArr);
    if (from === -1 || to === -1) return null;
    try {
      return JSON.parse(text.slice(from, to + 1)) as T;
    } catch {
      return null;
    }
  }
}
