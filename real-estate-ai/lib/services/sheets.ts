// שירות סנכרון Google Sheets (סנכרון ידני, דו-כיווני).
// טעינה עצלה של googleapis — האפליקציה רצה גם בלי החבילה/הגדרות.
// פתרון קונפליקטים: הרשומה עם updated_at העדכני יותר מנצחת.

import { listListings, getListing, createListing, updateListing } from '@/lib/db/queries';
import type { Listing } from '@/lib/types';

const HEADER = [
  'id',
  'address',
  'rooms',
  'area_sqm',
  'price',
  'status',
  'owner',
  'lead_source',
  'description',
  'updated_at',
] as const;

export function isConfigured(): boolean {
  return !!(
    process.env.GOOGLE_APPLICATION_CREDENTIALS &&
    process.env.GOOGLE_SHEET_ID
  );
}

function tab(): string {
  return process.env.GOOGLE_SHEET_TAB || 'Listings';
}

async function getSheetsClient(): Promise<any> {
  const { google } = (await import('googleapis')) as any;
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

function listingToRow(l: Listing): (string | number)[] {
  return [
    l.id,
    l.address,
    l.rooms,
    l.area_sqm,
    l.price,
    l.status,
    l.owner ?? '',
    l.lead_source ?? '',
    l.description ?? '',
    l.updated_at,
  ];
}

function rowToObj(row: string[]): Record<string, string> {
  const obj: Record<string, string> = {};
  HEADER.forEach((h, i) => (obj[h] = row[i] ?? ''));
  return obj;
}

export interface SyncResult {
  configured: boolean;
  message?: string;
  pulledUpdated: number;
  pulledCreated: number;
  pushedRows: number;
}

export async function syncListings(): Promise<SyncResult> {
  if (!isConfigured()) {
    return {
      configured: false,
      message:
        'סנכרון Google Sheets לא מוגדר. הוסף GOOGLE_APPLICATION_CREDENTIALS ו-GOOGLE_SHEET_ID ל-.env.local.',
      pulledUpdated: 0,
      pulledCreated: 0,
      pushedRows: 0,
    };
  }

  const sheets = await getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!;
  const range = `${tab()}!A1:J10000`;

  // קריאת הגיליון
  const read = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const values: string[][] = read.data.values || [];
  const dataRows = values.length > 1 ? values.slice(1) : [];

  let pulledUpdated = 0;
  let pulledCreated = 0;

  // שלב Pull — מהגיליון אל ה-DB (מנצח: העדכני יותר)
  for (const row of dataRows) {
    const o = rowToObj(row);
    const id = o.id ? Number(o.id) : 0;
    const payload = {
      address: o.address,
      rooms: Number(o.rooms) || 0,
      area_sqm: Number(o.area_sqm) || 0,
      price: Number(o.price) || 0,
      status: (o.status || 'חדש') as Listing['status'],
      owner: o.owner || null,
      lead_source: o.lead_source || null,
      description: o.description || null,
      images: [],
    };

    if (id && getListing(id)) {
      const existing = getListing(id)!;
      // הגיליון מנצח רק אם הוא עדכני יותר
      if (o.updated_at && o.updated_at > existing.updated_at) {
        updateListing(id, payload);
        pulledUpdated++;
      }
    } else if (!id && o.address) {
      // שורה חדשה בגיליון ללא id — יצירה ב-DB
      createListing(payload);
      pulledCreated++;
    }
  }

  // שלב Push — כתיבת מצב ה-DB המלא חזרה לגיליון (מבטיח עקביות)
  const all = listListings();
  const outValues = [HEADER as unknown as string[], ...all.map(listingToRow)];
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: { values: outValues },
  });

  return {
    configured: true,
    pulledUpdated,
    pulledCreated,
    pushedRows: all.length,
  };
}
