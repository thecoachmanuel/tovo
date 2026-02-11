import Link from 'next/link';
import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-2 text-black dark:text-white">
      <header className="w-full border-b border-gray-200 dark:border-dark-3 bg-white dark:bg-dark-1">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <Link href="/admin" className="font-semibold hover:underline">
            Admin Dashboard
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/admin/users" className="text-sm hover:underline">
              Users
            </Link>
            <Link href="/admin/settings" className="text-sm hover:underline">
              Settings
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl w-full">{children}</main>
    </div>
  );
}
