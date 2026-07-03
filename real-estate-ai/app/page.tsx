'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { apiGet, apiSend } from '@/lib/api-client';

interface Stats {
  listingsTotal: number;
  leadsTotal: number;
  byStatus: { status: string; c: number }[];
  byStage: { stage: string; c: number }[];
  dueFollowUps: number;
}

export default function DashboardPage() {
  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: () => apiGet<Stats>('/api/stats') });
  const [summary, setSummary] = useState<string>('');

  // הרצת סוכן ניהול המשימות (סיכום היום)
  const runTasks = useMutation({
    mutationFn: () => apiSend<{ text: string; demo: boolean }>('/api/agents/tasks', 'POST', {}),
    onSuccess: (r) => setSummary(r.text),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">דשבורד</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="נכסים במלאי" value={stats?.listingsTotal ?? '—'} icon="🏢" />
        <StatCard label="לידים" value={stats?.leadsTotal ?? '—'} icon="👥" />
        <StatCard label="מעקבים להיום" value={stats?.dueFollowUps ?? '—'} icon="⏰" />
        <StatCard
          label="נכסים פעילים"
          value={stats?.byStatus.find((s) => s.status === 'פעיל')?.c ?? 0}
          icon="✅"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-bold">התפלגות סטטוס נכסים</h2>
          <BarList items={stats?.byStatus.map((s) => ({ label: s.status, value: s.c })) ?? []} />
        </div>
        <div className="card">
          <h2 className="mb-3 font-bold">משפך לידים</h2>
          <BarList items={stats?.byStage.map((s) => ({ label: s.stage, value: s.c })) ?? []} />
        </div>
      </div>

      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">🤖 סיכום היום (סוכן ניהול משימות)</h2>
          <button className="btn-primary" onClick={() => runTasks.mutate()} disabled={runTasks.isPending}>
            {runTasks.isPending ? 'מריץ…' : 'הרץ סיכום'}
          </button>
        </div>
        {summary ? (
          <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-relaxed">
            {summary}
          </pre>
        ) : (
          <p className="text-sm text-slate-400">לחץ "הרץ סיכום" כדי לקבל תמונת מצב יומית.</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: React.ReactNode; icon: string }) {
  return (
    <div className="card flex items-center gap-3">
      <div className="text-3xl">{icon}</div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-slate-500">{label}</div>
      </div>
    </div>
  );
}

function BarList({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) return <p className="text-sm text-slate-400">אין נתונים</p>;
  return (
    <div className="space-y-2">
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-2 text-sm">
          <span className="w-24 shrink-0 text-slate-600">{i.label}</span>
          <div className="h-3 flex-1 rounded-full bg-slate-100">
            <div className="h-3 rounded-full bg-brand" style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
          <span className="w-6 text-left font-medium">{i.value}</span>
        </div>
      ))}
    </div>
  );
}
