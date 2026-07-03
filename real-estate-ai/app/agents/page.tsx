'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiGet, apiSend } from '@/lib/api-client';
import type { Listing, Lead } from '@/lib/types';

export default function AgentsPage() {
  const { data: meta } = useQuery({ queryKey: ['agents'], queryFn: () => apiGet<{ aiEnabled: boolean }>('/api/agents') });
  const { data: listings = [] } = useQuery({ queryKey: ['listings', ''], queryFn: () => apiGet<Listing[]>('/api/listings') });
  const { data: leads = [] } = useQuery({ queryKey: ['leads'], queryFn: () => apiGet<Lead[]>('/api/leads') });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">סוכני AI</h1>

      {meta && !meta.aiEnabled && (
        <div className="card border-amber-200 bg-amber-50 text-sm text-amber-800">
          💡 <b>מצב דמו:</b> לא מוגדר מפתח Anthropic — <b>לא מתבצעות קריאות בתשלום</b>. הסוכנים מחזירים
          תוצאות מבוססות-נתונים מקומיות. כדי להפעיל AI אמיתי, הוסף <code>ANTHROPIC_API_KEY</code> לקובץ
          <code> .env.local</code> והפעל מחדש.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <MarketingCard listings={listings} />
        <NegotiationCard listings={listings} />
        <MatchingCard leads={leads} />
        <TasksCard />
        <SheetsCard />
      </div>
    </div>
  );
}

function AgentCard({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="card space-y-3">
      <div>
        <h2 className="font-bold">{title}</h2>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function ResultBox({ text }: { text?: string }) {
  if (!text) return null;
  return <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm leading-relaxed">{text}</pre>;
}

function MarketingCard({ listings }: { listings: Listing[] }) {
  const [listingId, setListingId] = useState<number | ''>('');
  const [kind, setKind] = useState('description');
  const run = useMutation({ mutationFn: () => apiSend<{ text: string }>('/api/agents/marketing', 'POST', { listingId, kind }) });
  return (
    <AgentCard title="🖊️ סוכן שיווק" desc="תיאורי נכס, פוסטים וכותרות בעברית">
      <div className="flex gap-2">
        <select className="input" value={listingId} onChange={(e) => setListingId(Number(e.target.value))}>
          <option value="">בחר נכס…</option>
          {listings.map((l) => <option key={l.id} value={l.id}>{l.address}</option>)}
        </select>
        <select className="input w-40" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="description">תיאור נכס</option>
          <option value="facebook">פוסט פייסבוק</option>
          <option value="tiktok">טיקטוק</option>
          <option value="headline">כותרת</option>
        </select>
      </div>
      <button className="btn-primary" disabled={!listingId || run.isPending} onClick={() => run.mutate()}>{run.isPending ? 'מייצר…' : 'צור תוכן'}</button>
      <ResultBox text={run.data?.text} />
    </AgentCard>
  );
}

function NegotiationCard({ listings }: { listings: Listing[] }) {
  const [listingId, setListingId] = useState<number | ''>('');
  const [offer, setOffer] = useState<number | ''>('');
  const run = useMutation({ mutationFn: () => apiSend<{ text: string }>('/api/agents/negotiation', 'POST', { listingId, offerPrice: offer || undefined }) });
  return (
    <AgentCard title="🤝 סוכן מו&quot;מ ומכירות" desc="נקודות מו&quot;מ, ניתוח הצעה ותסריט שיחה">
      <div className="flex gap-2">
        <select className="input" value={listingId} onChange={(e) => setListingId(Number(e.target.value))}>
          <option value="">בחר נכס…</option>
          {listings.map((l) => <option key={l.id} value={l.id}>{l.address}</option>)}
        </select>
        <input type="number" className="input w-40" placeholder="הצעת קונה (₪)" value={offer} onChange={(e) => setOffer(e.target.value ? Number(e.target.value) : '')} />
      </div>
      <button className="btn-primary" disabled={!listingId || run.isPending} onClick={() => run.mutate()}>{run.isPending ? 'מנתח…' : 'הכן מו"מ'}</button>
      <ResultBox text={run.data?.text} />
    </AgentCard>
  );
}

function MatchingCard({ leads }: { leads: Lead[] }) {
  const [leadId, setLeadId] = useState<number | ''>('');
  const run = useMutation({ mutationFn: () => apiSend<{ matches: any[] }>('/api/agents/matching', 'POST', { leadId }) });
  return (
    <AgentCard title="🎯 סוכן התאמות" desc="מדרג נכסים לליד (סינון מקומי → ניקוד AI)">
      <select className="input" value={leadId} onChange={(e) => setLeadId(Number(e.target.value))}>
        <option value="">בחר ליד…</option>
        {leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
      </select>
      <button className="btn-primary" disabled={!leadId || run.isPending} onClick={() => run.mutate()}>{run.isPending ? 'מחשב…' : 'מצא התאמות'}</button>
      {run.data && (
        <div className="space-y-1 text-sm">
          {run.data.matches.map((m: any) => (
            <div key={m.id} className="flex justify-between rounded bg-slate-50 px-2 py-1">
              <span>{m.listing?.address ?? `#${m.listing_id}`}</span>
              <b className="text-green-700">{m.score}</b>
            </div>
          ))}
          <p className="text-xs text-slate-400">התוצאות נשמרות גם בכרטיס הליד ב-CRM.</p>
        </div>
      )}
    </AgentCard>
  );
}

function TasksCard() {
  const run = useMutation({ mutationFn: () => apiSend<{ text: string }>('/api/agents/tasks', 'POST', {}) });
  return (
    <AgentCard title="📋 סוכן ניהול משימות" desc="סיכום יומי, תעדוף מעקבים ולידים מתקררים">
      <button className="btn-primary" disabled={run.isPending} onClick={() => run.mutate()}>{run.isPending ? 'מריץ…' : 'הרץ סיכום יומי'}</button>
      <ResultBox text={run.data?.text} />
    </AgentCard>
  );
}

function SheetsCard() {
  const run = useMutation({ mutationFn: () => apiSend<any>('/api/sheets/sync', 'POST') });
  return (
    <AgentCard title="📊 סנכרון Google Sheets" desc="סנכרון ידני דו-כיווני של הנכסים">
      <button className="btn-primary" disabled={run.isPending} onClick={() => run.mutate()}>{run.isPending ? 'מסנכרן…' : 'סנכרן עכשיו'}</button>
      {run.data && (
        <p className="text-sm">
          {run.data.configured === false
            ? '⚠️ ' + run.data.message
            : `✔ סונכרן: ${run.data.pulledUpdated} עודכנו, ${run.data.pulledCreated} נוצרו, ${run.data.pushedRows} נכתבו לגיליון`}
        </p>
      )}
      {run.error && <p className="text-sm text-red-600">שגיאה: {(run.error as any).message}</p>}
    </AgentCard>
  );
}
