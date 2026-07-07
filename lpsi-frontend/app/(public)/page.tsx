'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Slideshow } from '@/components/Slideshow';
import { ThemeToggle } from '@/components/ThemeToggle';

interface Slide { id: number; imageUrl: string; caption?: string; }
interface CardMedia { id: number; type: string; fileUrl: string; }
interface LayananItem { id: number; nama: string; }
interface Layanan { id: number; kategori: string; items: LayananItem[]; }

const cards = [
  {
    key: 'layanan',
    label: 'Layanan Pengujian',
    desc: 'Lihat daftar layanan uji dan mulai pengajuan permohonan.',
    color: 'from-blue-600 to-blue-700',
    href: '/register',
    isLink: true,
  },
  {
    key: 'HARGA_LAYANAN',
    label: 'Daftar Harga Layanan',
    desc: 'Informasi tarif PNBP untuk setiap jenis pengujian.',
    color: 'from-green-600 to-green-700',
    isLink: false,
  },
  {
    key: 'ALUR_LAYANAN',
    label: 'Alur Layanan',
    desc: 'Tata cara dan prosedur pengajuan permohonan pengujian.',
    color: 'from-purple-600 to-purple-700',
    isLink: false,
  },
  {
    key: 'DOKUMEN_ISO',
    label: 'Dokumen ISO',
    desc: 'Dokumen mutu dan sertifikasi laboratorium.',
    color: 'from-orange-500 to-orange-600',
    isLink: false,
  },
];

export default function HomePage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [cardMedia, setCardMedia] = useState<CardMedia[]>([]);
  const [layanan, setLayanan] = useState<Layanan[]>([]);

  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
  const BASE = API.replace('/api', '');

  useEffect(() => {
    fetch(`${API}/content/slides`).then(r => r.json()).then(d => setSlides(d.data ?? [])).catch(() => {});
    fetch(`${API}/content/card-media`).then(r => r.json()).then(d => setCardMedia(d.data ?? [])).catch(() => {});
    fetch(`${API}/layanan`).then(r => r.json()).then(d => setLayanan(d.data ?? [])).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getCardMediaUrl(type: string): string | null {
    const found = cardMedia.find(c => c.type === type);
    return found ? `${BASE}${found.fileUrl}` : null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-100 dark:border-slate-800 px-5 py-3.5 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <Image src="/favicon.svg" alt="SIPUJA Logo" width={36} height={36} className="object-contain" />
          <div>
            <span className="font-bold text-slate-900 dark:text-white text-base leading-none block">SIPUJA</span>
            <span className="text-slate-400 text-xs hidden sm:block">Sistem Pengujian Hasil Lab</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm"><Link href="/login">Masuk</Link></Button>
          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white"><Link href="/register">Daftar</Link></Button>
        </div>
      </nav>

      {/* Slideshow */}
      <Slideshow slides={slides} />

      {/* 4 Cards */}
      <section className="py-14 sm:py-20 px-5 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Layanan Laboratorium BRMP Ruminansia Besar</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Akses informasi layanan, harga, dan dokumen resmi laboratorium</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {cards.map((card) => {
              const mediaUrl = card.isLink ? null : getCardMediaUrl(card.key);
              const content = (
                <div className={`bg-gradient-to-br ${card.color} rounded-2xl p-6 text-white shadow-md card-hover h-full flex flex-col justify-between min-h-[180px] cursor-pointer`}>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg mb-2">{card.label}</h3>
                    <p className="text-white/80 text-sm leading-relaxed">{card.desc}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-white/90 text-xs font-semibold">
                    {card.isLink ? 'Mulai Daftar' : mediaUrl ? 'Lihat Dokumen' : 'Belum tersedia'}
                    <ArrowRight size={13} />
                  </div>
                </div>
              );

              if (card.isLink) {
                return <Link key={card.key} href={card.href!} className="block">{content}</Link>;
              }
              if (mediaUrl) {
                return (
                  <a key={card.key} href={mediaUrl} target="_blank" rel="noopener noreferrer" className="block">
                    {content}
                  </a>
                );
              }
              return <div key={card.key} className="opacity-60">{content}</div>;
            })}
          </div>
        </div>
      </section>

      {/* Layanan */}
      {layanan.length > 0 && (
        <section className="py-14 sm:py-20 px-5 bg-white dark:bg-slate-950">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Layanan Pengujian</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Parameter uji yang tersedia di laboratorium kami</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {layanan.map((l) => (
                <div key={l.id} className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">{l.kategori}</h3>
                  <ul className="space-y-1.5">
                    {l.items.map((item) => (
                      <li key={item.id} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                        {item.nama}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                <Link href="/register">Ajukan Permohonan <ArrowRight size={15} className="ml-1.5" /></Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      <footer className="border-t dark:border-slate-800 py-6 px-5 text-center text-xs text-slate-400 mt-auto">
        © {new Date().getFullYear()} SIPUJA — Sistem Pengujian Hasil Lab
      </footer>
    </div>
  );
}
