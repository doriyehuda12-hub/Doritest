import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { SCHEMA_SQL } from './schema';
import { seedIfEmpty } from './seed';

// אתחול מסד נתונים כ-singleton. שומרים על globalThis כדי לא לאתחל מחדש ב-HMR של Next.
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'app.db');

type G = typeof globalThis & { __db?: Database.Database; __seeded?: boolean };
const g = globalThis as G;

export function getDb(): Database.Database {
  if (g.__db) return g.__db;

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA_SQL);

  g.__db = db;

  // זריעה אוטומטית פעם אחת אם המסד ריק — נוחות פיתוח מקומי
  if (!g.__seeded) {
    g.__seeded = true;
    try {
      seedIfEmpty(db);
    } catch {
      // אם הזריעה נכשלת, ממשיכים — המסד עדיין תקין
    }
  }

  return db;
}
