import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// סוגי קבצים מותרים בלבד (מניעת העלאות זדוניות)
const EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

// POST /api/uploads — העלאת תמונה. מחזיר { path } יחסי לשרת (/uploads/...)
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'לא התקבל קובץ' }, { status: 400 });
    }
    const ext = EXT[file.type];
    if (!ext) return NextResponse.json({ error: 'סוג קובץ לא נתמך' }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'הקובץ גדול מדי (עד 8MB)' }, { status: 400 });

    const dir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(dir, { recursive: true });

    // שם קובץ נוצר בשרת — לעולם לא סומכים על שם הקובץ מהלקוח
    const name = crypto.randomUUID() + ext;
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(dir, name), buffer);

    return NextResponse.json({ path: `/uploads/${name}` }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
