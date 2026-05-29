import Link from 'next/link';
import { FlaskConical } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <div className="px-5 py-4 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
          <FlaskConical size={14} className="text-white" />
        </div>
        <Link href="/" className="font-bold text-slate-900 dark:text-white text-sm">LPSI</Link>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md animate-slide-up">{children}</div>
      </div>
      <p className="text-center text-xs text-slate-400 py-4">
        © {new Date().getFullYear()} LPSI — Layanan Pelacakan Hasil Lab
      </p>
    </div>
  );
}
