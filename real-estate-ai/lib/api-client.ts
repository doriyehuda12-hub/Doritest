// עזרי קריאה ל-API מצד הלקוח

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'שגיאה בטעינה');
  return res.json();
}

export async function apiSend<T>(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE',
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
    throw new Error(typeof err === 'string' ? err : 'שגיאה בשמירה');
  }
  return data as T;
}

export function formatPrice(p: number): string {
  return p.toLocaleString('he-IL') + ' ₪';
}
