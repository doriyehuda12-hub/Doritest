# נדל"ן חכם — מערכת ניהול עם סוכני AI

אפליקציית ווב לניהול העבודה של סוכן נדל"ן: ניהול נכסים, CRM ולידים, וארבעה
סוכני AI (שיווק, התאמות, מו"מ, ניהול משימות). עברית מלאה + RTL.

## טכנולוגיה
- **Next.js (App Router) + React + TypeScript** — פרויקט מאוחד: UI ו-API יחד.
- **SQLite** מקומי דרך `better-sqlite3` (הנתונים נשמרים ב-`data/app.db`).
- **Tailwind CSS** עם תמיכת RTL.
- **Anthropic SDK** (`claude-opus-4-8` כברירת מחדל) לסוכני ה-AI — **שרת-צד בלבד**.

## חיסכון בעלות — מובנה בעיצוב
1. **עלות אפס ללא מפתח** — בלי `ANTHROPIC_API_KEY` הכל רץ במצב דמו: שום קריאה ל-API.
2. **הסוכנים רצים רק בלחיצת כפתור** — אין קריאות רקע אוטומטיות.
3. **סוכן ההתאמות** מסנן מקומית (SQL + היוריסטיקה) ושולח ל-Claude רק שורטליסט קצר.
4. **Prompt caching**, פלט מובנה (JSON), מזעור PII, ו-`max_tokens`/`effort` חסומים לכל סוכן.

## הרצה
```bash
cd real-estate-ai
npm install
npm run dev        # http://localhost:3000
```
בהרצה הראשונה המסד נוצר ונזרע אוטומטית בנתוני דמו. לזריעה ידנית: `npm run seed`.

## הפעלת AI אמיתי (אופציונלי)
```bash
cp .env.local.example .env.local
# ערוך את .env.local והוסף ANTHROPIC_API_KEY=...
```
בלי המפתח — המערכת שמישה לגמרי במצב דמו.

## סנכרון Google Sheets (שלב אחרון)
1. צור Service Account ב-Google Cloud והורד קובץ JSON.
2. שתף את הגיליון עם כתובת המייל של ה-Service Account (הרשאת עריכה).
3. הגדר ב-`.env.local`: `GOOGLE_APPLICATION_CREDENTIALS`, `GOOGLE_SHEET_ID`, `GOOGLE_SHEET_TAB`.
4. במסך "סוכני AI" → "סנכרן עכשיו". פתרון קונפליקטים לפי חותמת זמן.

## מבנה
- `app/` — עמודים (דשבורד/נכסים/CRM/סוכנים) ו-`app/api/` (backend).
- `lib/db/` — מסד נתונים, שאילתות, זריעה.
- `lib/agents/` — תשתית הסוכנים + מרשם (`registry.ts`). הוספת סוכן = קובץ + שורה במרשם.
- `lib/services/sheets.ts` — סנכרון Google Sheets.
- `components/` — רכיבי UI.
