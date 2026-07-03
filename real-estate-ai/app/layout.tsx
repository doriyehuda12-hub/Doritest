import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: 'נדל"ן חכם — ניהול עם סוכני AI',
  description: 'מערכת ניהול נדל"ן חכמה עם סוכני AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="font-sans">
        <Providers>
          <div className="flex min-h-screen">
            <Nav />
            <main className="flex-1 overflow-x-auto p-6">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
