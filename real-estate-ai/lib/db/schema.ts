// סכימת מסד הנתונים (SQLite). מקור אמת יחיד — נטען פעם אחת באתחול.

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS listings (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  address      TEXT    NOT NULL,
  rooms        REAL    NOT NULL,
  area_sqm     REAL    NOT NULL,
  price        INTEGER NOT NULL,
  status       TEXT    NOT NULL DEFAULT 'חדש',
  owner        TEXT,
  lead_source  TEXT,
  description  TEXT,
  images       TEXT    NOT NULL DEFAULT '[]',   -- JSON array של נתיבים
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS leads (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  name                TEXT    NOT NULL,
  phone               TEXT,
  email               TEXT,
  budget_min          INTEGER,
  budget_max          INTEGER,
  preferred_areas     TEXT    NOT NULL DEFAULT '[]',  -- JSON array
  preferred_rooms_min REAL,
  preferred_rooms_max REAL,
  funnel_stage        TEXT    NOT NULL DEFAULT 'ליד חדש',
  notes               TEXT,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS interactions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id    INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type       TEXT    NOT NULL,
  content    TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS matches (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id    INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  score      INTEGER NOT NULL,
  reasons    TEXT    NOT NULL DEFAULT '[]',  -- JSON array
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS follow_ups (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id  INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  due_date TEXT    NOT NULL,
  done     INTEGER NOT NULL DEFAULT 0,
  note     TEXT
);

CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_interactions_lead ON interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_matches_lead ON matches(lead_id);
CREATE INDEX IF NOT EXISTS idx_followups_lead ON follow_ups(lead_id);
`;
