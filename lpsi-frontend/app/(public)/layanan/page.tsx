'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FlaskConical, ArrowRight, MapPin, Clock, Package, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface LayananItem { id: number; nama: string; }
interface Layanan { id: number; kategori: string; items: LayananItem[]; }

const cardColors = [
  { border: 'border-blue-100 dark:border-blue-900/40', bg: 'bg-blue-50 dark:bg-blue-900/20', dot: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300' },
  { border: 'border-green-100 dark:border-green-900/40', bg: 'bg-green-50 dark:bg-green-900/20', dot: 'bg-green-500', text: 'text-green-700 dark:text-green-300' },
  { border: 'border-purple-100 dark:border-purple-900/40', bg: 'bg-purple-50 dark:bg-purple-900/20', dot: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-300' },
  { border: 'border-orange-100 dark:border-orange-900/40', bg: 'bg-orange-50 dark:bg-orange-900/20', dot: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-300' },
];

const infoItems = [
  { icon: MapPin, label: 'Lokasi', value: 'Jl. Raya Pajaran, Sarirejo, Kec. Pandaan, Pasuruan, Jawa Timur' },
  { icon: Clock, label: 'Jam Operasional', value: 'Senin–Jumat, 08.00–15.00 WIB' },
  { icon: Package, label: 'Minimal Sampel', value: '100–200 gram per parameter uji' },
];

export default function LayananPage() {
  const [layanan, setLayanan] = useState<Layanan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/layanan').then(({ data }) => setLayanan(data.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-100 dark:border-slate-800 px-5 py-3.5 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <FlaskConical size={16} className="text-white" />
          </div>
          <Link href="/" className="font-bold text-slate-900 dark:text-white">LPSI</Link>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm"><Link href="/login">Masuk</Link></Button>
          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white"><Link href="/register">Daftar</Link></Button>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full py-12 px-5 space-y-10">
        <div className="animate-slide-up">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Layanan Pengujian</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-base">Laboratorium LPSI menyediakan layanan analisis berikut:</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 size={20} className="animate-spin mr-2" /> Memuat layanan...
          </div>
        ) : layanan.length === 0 ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-sm">Belum ada layanan tersedia.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-slide-up-delay-1">
            {layanan.map((l, i) => {
              const c = cardColors[i % cardColors.length];
              return (
                <div key={l.id} className={`rounded-xl border p-5 ${c.bg} ${c.border} card-hover`}>
                  <h3 className={`font-bold text-sm mb-4 ${c.text}`}>{l.kategori}</h3>
                  <ul className="space-y-2">
                    {l.items.map((item) => (
                      <li key={item.id} className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
                        {item.nama}
                      </li>
                    ))}
                    {l.items.length === 0 && (
                      <li className="text-xs text-slate-400 italic">Belum ada item</li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 sm:p-8 text-white animate-slide-up-delay-2">
          <h2 className="font-bold text-lg mb-5">Informasi Pengiriman Sampel</h2>
          <div className="space-y-4">
            {infoItems.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex gap-4">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={17} className="text-blue-300" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
                  <p className="text-sm text-white mt-0.5">{value}</p>
                </div>
              </div>
            ))}
            <p className="text-sm text-slate-400 mt-2 pt-2 border-t border-white/10">
              Sertakan <span className="text-white font-semibold">nomor permohonan</span> pada kemasan sampel.
            </p>
          </div>
        </div>

        <div className="text-center pt-2 animate-slide-up-delay-3">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 h-12">
            <Link href="/register">Ajukan Permohonan <ArrowRight size={16} className="ml-1.5" /></Link>
          </Button>
        </div>
      </main>

      <footer className="border-t border-slate-100 dark:border-slate-800 py-6 px-5 text-center text-xs text-slate-400 mt-auto">
        © {new Date().getFullYear()} LPSI — Layanan Pelacakan Hasil Lab
      </footer>
    </div>
  );
}
