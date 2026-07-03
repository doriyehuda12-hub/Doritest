'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiGet, apiSend, formatPrice } from '@/lib/api-client';
import { FUNNEL_STAGES, type FunnelStage, type Lead, type Interaction, type Match, type Listing, type FollowUp } from '@/lib/types';
import { Modal } from '@/components/Modal';

interface LeadDetail {
  lead: Lead;
  interactions: Interaction[];
  matches: (Match & { listing: Listing | null })[];
  followUps: FollowUp[];
}

export default function CrmPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<number | null>(null);
  const [editing, setEditing] = useState<Lead | 'new' | null>(null);

  const { data: leads = [] } = useQuery({ queryKey: ['leads'], queryFn: () => apiGet<Lead[]>('/api/leads') });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">לידים ולקוחות</h1>
        <button className="btn-primary" onClick={() => setEditing('new')}>+ ליד חדש</button>
      </div>

      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <div className="card space-y-1 p-2">
          {leads.map((l) => (
            <button
              key={l.id}
              onClick={() => setSelected(l.id)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-right text-sm ${selected === l.id ? 'bg-brand text-white' : 'hover:bg-slate-100'}`}
            >
              <span className="font-medium">{l.name}</span>
              <span className={`badge ${selected === l.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{l.funnel_stage}</span>
            </button>
          ))}
          {leads.length === 0 && <p className="p-4 text-center text-sm text-slate-400">אין לידים</p>}
        </div>

        <div>
          {selected ? (
            <LeadPanel leadId={selected} onEdit={(l) => setEditing(l)} onDeleted={() => { setSelected(null); qc.invalidateQueries({ queryKey: ['leads'] }); }} />
          ) : (
            <div className="card text-center text-slate-400">בחר ליד מהרשימה כדי לצפות בכרטיס</div>
          )}
        </div>
      </div>

      {editing && (
        <LeadForm
          lead={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); qc.invalidateQueries({ queryKey: ['leads'] }); qc.invalidateQueries({ queryKey: ['lead'] }); }}
        />
      )}
    </div>
  );
}

function LeadPanel({ leadId, onEdit, onDeleted }: { leadId: number; onEdit: (l: Lead) => void; onDeleted: () => void }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['lead', leadId], queryFn: () => apiGet<LeadDetail>(`/api/leads/${leadId}`) });
  const [newInter, setNewInter] = useState({ type: 'שיחה', content: '' });

  const refresh = () => qc.invalidateQueries({ queryKey: ['lead', leadId] });

  const setStage = useMutation({
    mutationFn: (stage: FunnelStage) => apiSend(`/api/leads/${leadId}`, 'PUT', { funnel_stage: stage }),
    onSuccess: () => { refresh(); qc.invalidateQueries({ queryKey: ['leads'] }); },
  });
  const addInter = useMutation({
    mutationFn: () => apiSend(`/api/leads/${leadId}/interactions`, 'POST', newInter),
    onSuccess: () => { setNewInter({ type: 'שיחה', content: '' }); refresh(); },
  });
  const match = useMutation({
    mutationFn: () => apiSend<{ demo: boolean }>('/api/agents/matching', 'POST', { leadId }),
    onSuccess: refresh,
  });
  const del = useMutation({
    mutationFn: () => apiSend(`/api/leads/${leadId}`, 'DELETE'),
    onSuccess: onDeleted,
  });

  if (!data) return <div className="card">טוען…</div>;
  const { lead, interactions, matches } = data;

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">{lead.name}</h2>
            <p className="text-sm text-slate-500">{lead.phone || '—'} · {lead.email || '—'}</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => onEdit(lead)}>עריכה</button>
            <button className="btn-danger" onClick={() => confirm('למחוק את הליד?') && del.mutate()}>מחיקה</button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
          <Info label="תקציב" value={`${lead.budget_min ? formatPrice(lead.budget_min) : '—'} – ${lead.budget_max ? formatPrice(lead.budget_max) : '—'}`} />
          <Info label="אזורים" value={lead.preferred_areas.join(', ') || '—'} />
          <Info label="חדרים" value={`${lead.preferred_rooms_min ?? '—'}–${lead.preferred_rooms_max ?? '—'}`} />
        </div>
        {lead.notes && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">{lead.notes}</p>}
        <div className="mt-3 flex items-center gap-2">
          <span className="label mb-0">שלב במשפך:</span>
          <select className="input w-40" value={lead.funnel_stage} onChange={(e) => setStage.mutate(e.target.value as FunnelStage)}>
            {FUNNEL_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold">🎯 נכסים מתאימים</h3>
          <button className="btn-primary" onClick={() => match.mutate()} disabled={match.isPending}>
            {match.isPending ? 'מחשב…' : 'מצא התאמות'}
          </button>
        </div>
        {matches.length === 0 ? (
          <p className="text-sm text-slate-400">לחץ "מצא התאמות" כדי לדרג נכסים מהמלאי עבור הליד.</p>
        ) : (
          <div className="space-y-2">
            {matches.map((m) => (
              <div key={m.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{m.listing?.address ?? `נכס #${m.listing_id}`}</span>
                  <span className="flex items-center gap-2">
                    <div className="h-2 w-24 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-green-500" style={{ width: `${m.score}%` }} />
                    </div>
                    <span className="w-10 text-left font-bold text-green-700">{m.score}</span>
                  </span>
                </div>
                {m.listing && <p className="mt-1 text-xs text-slate-500">{m.listing.rooms} חד' · {m.listing.area_sqm} מ"ר · {formatPrice(m.listing.price)}</p>}
                {m.reasons.length > 0 && <ul className="mt-1 list-inside list-disc text-xs text-slate-500">{m.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="mb-3 font-bold">📞 היסטוריית אינטראקציות</h3>
        <div className="mb-3 flex gap-2">
          <select className="input w-28" value={newInter.type} onChange={(e) => setNewInter((s) => ({ ...s, type: e.target.value }))}>
            {['שיחה', 'מייל', 'פגישה', 'הודעה'].map((t) => <option key={t}>{t}</option>)}
          </select>
          <input className="input flex-1" placeholder="תוכן האינטראקציה…" value={newInter.content} onChange={(e) => setNewInter((s) => ({ ...s, content: e.target.value }))} />
          <button className="btn-primary" onClick={() => newInter.content && addInter.mutate()} disabled={addInter.isPending}>הוסף</button>
        </div>
        <div className="space-y-2">
          {interactions.map((i) => (
            <div key={i.id} className="flex gap-3 border-r-2 border-brand pr-3 text-sm">
              <span className="badge bg-brand-light text-brand">{i.type}</span>
              <div>
                <p>{i.content}</p>
                <p className="text-xs text-slate-400">{new Date(i.created_at).toLocaleString('he-IL')}</p>
              </div>
            </div>
          ))}
          {interactions.length === 0 && <p className="text-sm text-slate-400">אין אינטראקציות עדיין</p>}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function LeadForm({ lead, onClose, onSaved }: { lead: Lead | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: lead?.name ?? '',
    phone: lead?.phone ?? '',
    email: lead?.email ?? '',
    budget_min: lead?.budget_min ?? 0,
    budget_max: lead?.budget_max ?? 0,
    preferred_areas: lead?.preferred_areas.join(', ') ?? '',
    preferred_rooms_min: lead?.preferred_rooms_min ?? 3,
    preferred_rooms_max: lead?.preferred_rooms_max ?? 5,
    funnel_stage: (lead?.funnel_stage ?? 'ליד חדש') as FunnelStage,
    notes: lead?.notes ?? '',
  });
  const [error, setError] = useState('');
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: () => {
      const payload = { ...form, preferred_areas: form.preferred_areas.split(',').map((s) => s.trim()).filter(Boolean) };
      return lead ? apiSend(`/api/leads/${lead.id}`, 'PUT', payload) : apiSend('/api/leads', 'POST', payload);
    },
    onSuccess: onSaved,
    onError: (e: any) => setError(e.message),
  });

  return (
    <Modal title={lead ? 'עריכת ליד' : 'ליד חדש'} onClose={onClose}>
      <div className="space-y-3">
        <div><label className="label">שם</label><input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">טלפון</label><input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
          <div><label className="label">אימייל</label><input className="input" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">תקציב מינ' (₪)</label><input type="number" className="input" value={form.budget_min} onChange={(e) => set('budget_min', Number(e.target.value))} /></div>
          <div><label className="label">תקציב מקס' (₪)</label><input type="number" className="input" value={form.budget_max} onChange={(e) => set('budget_max', Number(e.target.value))} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">חדרים מינ'</label><input type="number" step="0.5" className="input" value={form.preferred_rooms_min} onChange={(e) => set('preferred_rooms_min', Number(e.target.value))} /></div>
          <div><label className="label">חדרים מקס'</label><input type="number" step="0.5" className="input" value={form.preferred_rooms_max} onChange={(e) => set('preferred_rooms_max', Number(e.target.value))} /></div>
        </div>
        <div><label className="label">אזורים מועדפים (מופרד בפסיק)</label><input className="input" value={form.preferred_areas} onChange={(e) => set('preferred_areas', e.target.value)} placeholder="הרצליה פיתוח, גליל ים" /></div>
        <div>
          <label className="label">שלב במשפך</label>
          <select className="input" value={form.funnel_stage} onChange={(e) => set('funnel_stage', e.target.value)}>
            {FUNNEL_STAGES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div><label className="label">הערות</label><textarea className="input" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-ghost" onClick={onClose}>ביטול</button>
          <button className="btn-primary" onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? 'שומר…' : 'שמירה'}</button>
        </div>
      </div>
    </Modal>
  );
}
