// עזרי קריאה ל-API מצד הלקוח

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'שגיאה בטעינה');
  return res.json();
}

export async function apiSend<T>(
  url: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: unknown
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = (data as any)?.error;
    // שגיאות zod מגיעות כמערך issues — נציג את ההודעות בפועל
    if (Array.isArray(err)) {
      throw new Error(err.map((i: any) => i?.message).filter(Boolean).join(' · ') || 'קלט לא תקין');
    }
    throw new Error(typeof err === 'string' ? err : 'שגיאה בשמירה');
  }
  return data as T;
}

export function formatPrice(p: number): string {
  return p.toLocaleString('he-IL') + ' ₪';
}
