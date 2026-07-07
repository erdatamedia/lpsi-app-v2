'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LayoutDashboard, FileText, Bell, UserCircle, LogOut, Menu, X } from 'lucide-react';

export default function PemohonLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    api.get('/notifications')
      .then(({ data }) => {
        const count = (data.data as { isRead: boolean }[]).filter((n) => !n.isRead).length;
        setUnread(count);
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  async function handleLogout() {
    try { await api.post('/auth/logout'); } catch {}
    toast.success('Berhasil logout');
    router.push('/login');
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/permohonan', label: 'Permohonan', icon: FileText },
    { href: '/notifikasi', label: 'Notifikasi', icon: Bell, badge: unread },
    { href: '/profil', label: 'Profil', icon: UserCircle },
  ];

  const Sidebar = () => (
    <aside className={cn(
      'fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300',
      'bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800',
      'lg:translate-x-0 lg:static lg:z-auto',
      sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
    )}>
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <NextImage src="/favicon.svg" alt="SIPUJA Logo" width={34} height={34} className="object-contain shrink-0" />
        <div>
          <h1 className="font-bold text-base text-slate-900 dark:text-white leading-none">SIPUJA</h1>
          <p className="text-xs text-slate-400 mt-0.5">Portal Pemohon</p>
        </div>
        <button className="ml-auto lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-white" onClick={() => setSidebarOpen(false)}>
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              active
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
            )}>
              <Icon size={17} className={active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} />
              <span className="flex-1">{label}</span>
              {badge != null && badge > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 flex-1 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150"
        >
          <LogOut size={17} /> Logout
        </button>
        <ThemeToggle />
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <NextImage src="/favicon.svg" alt="SIPUJA Logo" width={24} height={24} className="object-contain" />
            <span className="font-bold text-slate-900 dark:text-white text-sm">SIPUJA</span>
          </div>
          {unread > 0 && (
            <Link href="/notifikasi" className="ml-auto">
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                {unread > 9 ? '9+' : unread}
              </span>
            </Link>
          )}
          <ThemeToggle className="ml-auto text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" />
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
