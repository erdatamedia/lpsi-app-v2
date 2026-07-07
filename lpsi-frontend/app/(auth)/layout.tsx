import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <div className="px-5 py-4 flex items-center gap-2.5">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/favicon.svg" alt="SIPUJA Logo" width={32} height={32} className="object-contain" />
          <span className="font-bold text-slate-900 dark:text-white text-sm">SIPUJA</span>
        </Link>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md animate-slide-up">{children}</div>
      </div>
      <p className="text-center text-xs text-slate-400 py-4">
        © {new Date().getFullYear()} SIPUJA — Sistem Pengujian Hasil Lab
      </p>
    </div>
  );
}
