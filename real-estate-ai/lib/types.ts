// טיפוסים משותפים בין ה-UI ל-API

export type ListingStatus = 'חדש' | 'פעיל' | 'במו"מ' | 'נסגר';
export const LISTING_STATUSES: ListingStatus[] = ['חדש', 'פעיל', 'במו"מ', 'נסגר'];

export type FunnelStage =
  | 'ליד חדש'
  | 'יצירת קשר'
  | 'פגישה'
  | 'הצעה'
  | 'מו"מ'
  | 'סגירה';
export const FUNNEL_STAGES: FunnelStage[] = [
  'ליד חדש',
  'יצירת קשר',
  'פגישה',
  'הצעה',
  'מו"מ',
  'סגירה',
];

export interface Listing {
  id: number;
  address: string;
  rooms: number;
  area_sqm: number;
  price: number;
  status: ListingStatus;
  owner: string | null;
  lead_source: string | null;
  description: string | null;
  images: string[]; // נתיבים יחסיים
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_areas: string[];
  preferred_rooms_min: number | null;
  preferred_rooms_max: number | null;
  funnel_stage: FunnelStage;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: number;
  lead_id: number;
  type: string; // שיחה / מייל / פגישה / הודעה
  content: string;
  created_at: string;
}

export interface Match {
  id: number;
  lead_id: number;
  listing_id: number;
  score: number; // 0-100
  reasons: string[];
  created_at: string;
}

export interface FollowUp {
  id: number;
  lead_id: number;
  due_date: string;
  done: 0 | 1;
  note: string | null;
}
