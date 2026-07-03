import type Database from 'better-sqlite3';

// נתוני דמו ריאליים לאזור הרצליה פיתוח / גליל ים / הירוקה.
// seed() מכניס נתונים; seedIfEmpty() מכניס רק אם המסד ריק (בטוח להרצה חוזרת).

const DEMO_LISTINGS = [
  {
    address: 'רחוב גלי תכלת 12, הרצליה פיתוח',
    rooms: 5,
    area_sqm: 140,
    price: 6800000,
    status: 'פעיל',
    owner: 'משפחת לוי',
    lead_source: 'המלצה',
    description: 'דירת גן מרווחת עם גינה פרטית, קרובה לחוף.',
  },
  {
    address: 'רחוב הנדיב 8, הרצליה פיתוח',
    rooms: 4,
    area_sqm: 115,
    price: 5200000,
    status: 'חדש',
    owner: 'דוד כהן',
    lead_source: 'יד2',
    description: 'דירה משופצת ברמה גבוהה, קומה גבוהה עם נוף לים.',
  },
  {
    address: 'שדרות גליל ים 24, גליל ים',
    rooms: 6,
    area_sqm: 180,
    price: 8900000,
    status: 'במו"מ',
    owner: 'משפחת אברהמי',
    lead_source: 'פייסבוק',
    description: 'פנטהאוז יוקרתי עם מרפסת גג ובריכה פרטית.',
  },
  {
    address: 'רחוב הירוקה 5, הירוקה',
    rooms: 3,
    area_sqm: 82,
    price: 3450000,
    status: 'פעיל',
    owner: 'רונית מזרחי',
    lead_source: 'אתר משרד',
    description: 'דירת 3 חדרים מודרנית, מתאימה לזוג צעיר או משקיע.',
  },
  {
    address: 'רחוב אבן גבירול 3, גליל ים',
    rooms: 4,
    area_sqm: 105,
    price: 4700000,
    status: 'נסגר',
    owner: 'יוסי פרידמן',
    lead_source: 'המלצה',
    description: 'דירה נמכרה — נשמר לצורכי היסטוריה.',
  },
];

const DEMO_LEADS = [
  {
    name: 'איתי שרון',
    phone: '050-1234567',
    email: 'itay@example.com',
    budget_min: 5000000,
    budget_max: 7000000,
    preferred_areas: ['הרצליה פיתוח', 'גליל ים'],
    preferred_rooms_min: 4,
    preferred_rooms_max: 5,
    funnel_stage: 'פגישה',
    notes: 'מחפש דירה עם נוף לים, גמיש בתקציב עבור נכס מיוחד.',
  },
  {
    name: 'מיכל ברקוביץ',
    phone: '052-7654321',
    email: 'michal@example.com',
    budget_min: 3000000,
    budget_max: 3800000,
    preferred_areas: ['הירוקה'],
    preferred_rooms_min: 3,
    preferred_rooms_max: 3,
    funnel_stage: 'ליד חדש',
    notes: 'זוג צעיר, רכישה ראשונה.',
  },
  {
    name: 'משפחת גולן',
    phone: '054-9998877',
    email: 'golan@example.com',
    budget_min: 8000000,
    budget_max: 10000000,
    preferred_areas: ['הרצליה פיתוח', 'גליל ים'],
    preferred_rooms_min: 5,
    preferred_rooms_max: 6,
    funnel_stage: 'הצעה',
    notes: 'מעוניינים בפנטהאוז, יש להם נכס למכירה במקביל.',
  },
];

export function seed(db: Database.Database): void {
  const insListing = db.prepare(
    `INSERT INTO listings (address, rooms, area_sqm, price, status, owner, lead_source, description, images)
     VALUES (@address, @rooms, @area_sqm, @price, @status, @owner, @lead_source, @description, '[]')`
  );
  const insLead = db.prepare(
    `INSERT INTO leads (name, phone, email, budget_min, budget_max, preferred_areas,
      preferred_rooms_min, preferred_rooms_max, funnel_stage, notes)
     VALUES (@name, @phone, @email, @budget_min, @budget_max, @preferred_areas,
      @preferred_rooms_min, @preferred_rooms_max, @funnel_stage, @notes)`
  );
  const insInteraction = db.prepare(
    'INSERT INTO interactions (lead_id, type, content) VALUES (?, ?, ?)'
  );
  const insFollowUp = db.prepare(
    "INSERT INTO follow_ups (lead_id, due_date, note) VALUES (?, datetime('now', ?), ?)"
  );

  const tx = db.transaction(() => {
    for (const l of DEMO_LISTINGS) insListing.run(l);
    for (const l of DEMO_LEADS) {
      insLead.run({ ...l, preferred_areas: JSON.stringify(l.preferred_areas) });
    }
    // אינטראקציות ותזכורות לדוגמה
    insInteraction.run(1, 'שיחה', 'שיחת היכרות ראשונה. מעוניין לקבוע פגישה בנכס בגלי תכלת.');
    insInteraction.run(1, 'פגישה', 'ביקור בנכס. אהב מאוד את הגינה, מבקש לחשוב.');
    insInteraction.run(3, 'מייל', 'שלחתי פרטים על הפנטהאוז בגליל ים.');
    insFollowUp.run(1, '-2 days', 'לחזור אחרי הביקור בנכס');
    insFollowUp.run(2, '+1 day', 'שיחת מעקב ראשונה');
  });
  tx();
}

export function seedIfEmpty(db: Database.Database): boolean {
  const count = (db.prepare('SELECT COUNT(*) AS c FROM listings').get() as { c: number }).c;
  if (count > 0) return false;
  seed(db);
  return true;
}
