'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'דשבורד', icon: '🏠' },
  { href: '/listings', label: 'נכסים', icon: '🏢' },
  { href: '/crm', label: 'לידים ולקוחות', icon: '👥' },
  { href: '/agents', label: 'סוכני AI', icon: '🤖' },
];

export function Nav() {
  const path = usePathname();
  return (
    <aside className="flex w-56 shrink-0 flex-col gap-1 border-l border-slate-200 bg-white p-4">
      <div className="mb-4 px-2">
        <div className="text-lg font-bold text-brand">נדל"ן חכם</div>
        <div className="text-xs text-slate-400">מערכת ניהול עם סוכני AI</div>
      </div>
      {LINKS.map((l) => {
        const active = l.href === '/' ? path === '/' : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{l.icon}</span>
            <span>{l.label}</span>
          </Link>
        );
      })}
    </aside>
  );
}
