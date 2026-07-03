'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiGet, apiSend, formatPrice } from '@/lib/api-client';
import { LISTING_STATUSES, type Listing, type ListingStatus } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';

export default function ListingsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<ListingStatus | ''>('');
  const [editing, setEditing] = useState<Listing | 'new' | null>(null);
  const [importing, setImporting] = useState(false);

  const { data: listings = [] } = useQuery({
    queryKey: ['listings', filter],
    queryFn: () => apiGet<Listing[]>('/api/listings' + (filter ? `?status=${encodeURIComponent(filter)}` : '')),
  });

  const del = useMutation({
    mutationFn: (id: number) => apiSend(`/api/listings/${id}`, 'DELETE'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listings'] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">ניהול נכסים</h1>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={() => setImporting(true)}>ייבוא CSV</button>
          <a className="btn-ghost" href="/api/listings/export">ייצוא CSV</a>
          <button className="btn-primary" onClick={() => setEditing('new')}>+ נכס חדש</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={filter === ''} onClick={() => setFilter('')}>הכל</FilterChip>
        {LISTING_STATUSES.map((s) => (
          <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>{s}</FilterChip>
        ))}
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <Th>כתובת</Th><Th>חדרים</Th><Th>מ"ר</Th><Th>מחיר</Th><Th>סטטוס</Th><Th>בעלים</Th><Th>מקור</Th><Th></Th>
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => (
              <tr key={l.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <Td>{l.address}</Td>
                <Td>{l.rooms}</Td>
                <Td>{l.area_sqm}</Td>
                <Td>{formatPrice(l.price)}</Td>
                <Td><StatusBadge status={l.status} /></Td>
                <Td>{l.owner || '—'}</Td>
                <Td>{l.lead_source || '—'}</Td>
                <Td>
                  <div className="flex gap-2">
                    <button className="text-brand hover:underline" onClick={() => setEditing(l)}>עריכה</button>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => confirm('למחוק את הנכס?') && del.mutate(l.id)}
                    >מחיקה</button>
                  </div>
                </Td>
              </tr>
            ))}
            {listings.length === 0 && (
              <tr><td colSpan={8} className="p-6 text-center text-slate-400">אין נכסים להצגה</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <ListingForm
          listing={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); qc.invalidateQueries({ queryKey: ['listings'] }); }}
        />
      )}
      {importing && <ImportForm onClose={() => setImporting(false)} onDone={() => { setImporting(false); qc.invalidateQueries({ queryKey: ['listings'] }); }} />}
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="p-3 text-right font-medium">{children}</th>;
}
function Td({ children }: { children?: React.ReactNode }) {
  return <td className="p-3">{children}</td>;
}
function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm ${active ? 'bg-brand text-white' : 'bg-white border border-slate-300 text-slate-600'}`}
    >{children}</button>
  );
}

function ListingForm({ listing, onClose, onSaved }: { listing: Listing | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    address: listing?.address ?? '',
    rooms: listing?.rooms ?? 4,
    area_sqm: listing?.area_sqm ?? 100,
    price: listing?.price ?? 4000000,
    status: (listing?.status ?? 'חדש') as ListingStatus,
    owner: listing?.owner ?? '',
    lead_source: listing?.lead_source ?? '',
    description: listing?.description ?? '',
  });
  const [error, setError] = useState('');

  const save = useMutation({
    mutationFn: () =>
      listing
        ? apiSend(`/api/listings/${listing.id}`, 'PUT', form)
        : apiSend('/api/listings', 'POST', form),
    onSuccess: onSaved,
    onError: (e: any) => setError(e.message),
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal title={listing ? 'עריכת נכס' : 'נכס חדש'} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="label">כתובת</label>
          <input className="input" value={form.address} onChange={(e) => set('address', e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label">חדרים</label><input type="number" step="0.5" className="input" value={form.rooms} onChange={(e) => set('rooms', Number(e.target.value))} /></div>
          <div><label className="label">מ"ר</label><input type="number" className="input" value={form.area_sqm} onChange={(e) => set('area_sqm', Number(e.target.value))} /></div>
          <div><label className="label">מחיר (₪)</label><input type="number" className="input" value={form.price} onChange={(e) => set('price', Number(e.target.value))} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">סטטוס</label>
            <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
              {LISTING_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div><label className="label">מקור ליד</label><input className="input" value={form.lead_source ?? ''} onChange={(e) => set('lead_source', e.target.value)} /></div>
        </div>
        <div><label className="label">בעלים</label><input className="input" value={form.owner ?? ''} onChange={(e) => set('owner', e.target.value)} /></div>
        <div><label className="label">תיאור</label><textarea className="input" rows={3} value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-ghost" onClick={onClose}>ביטול</button>
          <button className="btn-primary" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? 'שומר…' : 'שמירה'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ImportForm({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [csv, setCsv] = useState('address,rooms,area_sqm,price,status,owner,lead_source,description\n');
  const [result, setResult] = useState<string>('');
  const imp = useMutation({
    mutationFn: () => apiSend<{ created: number; errors: string[] }>('/api/listings/import', 'POST', { csv }),
    onSuccess: (r) => { setResult(`נוצרו ${r.created} נכסים. ${r.errors.length ? 'שגיאות: ' + r.errors.join('; ') : ''}`); },
    onError: (e: any) => setResult('שגיאה: ' + e.message),
  });
  return (
    <Modal title="ייבוא נכסים מ-CSV" onClose={onClose}>
      <p className="mb-2 text-sm text-slate-500">הדבק תוכן CSV. שורת כותרת: address,rooms,area_sqm,price,status,owner,lead_source,description</p>
      <textarea className="input font-mono text-xs" rows={8} value={csv} onChange={(e) => setCsv(e.target.value)} />
      {result && <p className="mt-2 text-sm">{result}</p>}
      <div className="flex justify-end gap-2 pt-3">
        <button className="btn-ghost" onClick={onDone}>סגירה</button>
        <button className="btn-primary" onClick={() => imp.mutate()} disabled={imp.isPending}>ייבוא</button>
      </div>
    </Modal>
  );
}
