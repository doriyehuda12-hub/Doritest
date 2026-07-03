import { z } from 'zod';
import { LISTING_STATUSES, FUNNEL_STAGES } from '@/lib/types';

// סכימות ולידציה משותפות לקלט מה-API

export const listingSchema = z.object({
  address: z.string().min(1, 'כתובת חובה'),
  rooms: z.coerce.number().positive('מספר חדרים חייב להיות חיובי'),
  area_sqm: z.coerce.number().positive('שטח חייב להיות חיובי'),
  price: z.coerce.number().int().nonnegative('מחיר לא תקין'),
  status: z.enum(LISTING_STATUSES as [string, ...string[]]).default('חדש'),
  owner: z.string().nullable().optional().default(null),
  lead_source: z.string().nullable().optional().default(null),
  description: z.string().nullable().optional().default(null),
  images: z.array(z.string()).optional().default([]),
});

export const leadSchema = z.object({
  name: z.string().min(1, 'שם חובה'),
  phone: z.string().nullable().optional().default(null),
  email: z.string().email('אימייל לא תקין').nullable().optional().or(z.literal('')).default(null),
  budget_min: z.coerce.number().int().nonnegative().nullable().optional().default(null),
  budget_max: z.coerce.number().int().nonnegative().nullable().optional().default(null),
  preferred_areas: z.array(z.string()).optional().default([]),
  preferred_rooms_min: z.coerce.number().nullable().optional().default(null),
  preferred_rooms_max: z.coerce.number().nullable().optional().default(null),
  funnel_stage: z.enum(FUNNEL_STAGES as [string, ...string[]]).default('ליד חדש'),
  notes: z.string().nullable().optional().default(null),
});

export const interactionSchema = z.object({
  type: z.string().min(1),
  content: z.string().min(1),
});

export const followUpSchema = z.object({
  lead_id: z.coerce.number().int().positive(),
  due_date: z.string().min(1),
  note: z.string().nullable().optional().default(null),
});
