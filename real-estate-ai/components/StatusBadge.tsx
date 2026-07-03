import type { ListingStatus } from '@/lib/types';

const STYLES: Record<ListingStatus, string> = {
  'חדש': 'bg-blue-100 text-blue-700',
  'פעיל': 'bg-green-100 text-green-700',
  'במו"מ': 'bg-amber-100 text-amber-700',
  'נסגר': 'bg-slate-200 text-slate-600',
};

export function StatusBadge({ status }: { status: ListingStatus }) {
  return <span className={`badge ${STYLES[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
}
