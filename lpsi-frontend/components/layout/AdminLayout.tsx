'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LayoutDashboard, FileText, LayoutList, Image, LogOut, Menu, X, Users } from 'lucide-react';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/permohonan', label: 'Permohonan', icon: FileText },
  { href: '/admin/akun', label: 'Kelola Akun', icon: Users },
  { href: '/admin/layanan', label: 'Layanan', icon: LayoutList },
  { href: '/admin/konten', label: 'Konten', icon: Image },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  async function handleLogout() {
    try { await api.post('/auth/logout'); } catch {}
    toast.success('Berhasil logout');
    router.push('/login');
  }

  const Sidebar = () => (
    <aside className={cn(
      'fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300',
      'bg-slate-900 dark:bg-slate-950',
      'lg:translate-x-0 lg:static lg:z-auto',
      sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
    )}>
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <NextImage src="/logo.png" alt="LPSI Logo" width={34} height={34} className="object-contain shrink-0" />
        <div>
          <h1 className="font-bold text-base text-white leading-none">LPSI</h1>
          <p className="text-xs text-slate-400 mt-0.5">Panel Admin</p>
        </div>
        <button className="ml-auto lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white',
            )}>
              <Icon size={17} /><span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800 flex items-center gap-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 flex-1 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-900/40 hover:text-red-400 transition-colors duration-150"
        >
          <LogOut size={17} /> Logout
        </button>
        <ThemeToggle className="text-slate-400 hover:bg-slate-800 hover:text-white" />
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-20 bg-slate-900 dark:bg-slate-950 px-4 py-3 flex items-center gap-3 border-b border-slate-800">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <NextImage src="/logo.png" alt="LPSI Logo" width={24} height={24} className="object-contain" />
            <span className="font-bold text-white text-sm">LPSI Admin</span>
          </div>
          <ThemeToggle className="ml-auto text-slate-400 hover:bg-slate-800 hover:text-white" />
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
