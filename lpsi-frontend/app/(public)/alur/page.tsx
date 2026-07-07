import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const steps = [
  {
    no: 1,
    title: 'Registrasi & Login',
    desc: 'Daftar akun pemohon di portal SIPUJA, aktivasi via email, lalu login.',
    detail: 'Akun digunakan untuk melacak semua permohonan dan menerima notifikasi status.',
    color: 'bg-blue-600',
  },
  {
    no: 2,
    title: 'Ajukan Permohonan',
    desc: 'Isi formulir permohonan online dengan data pemohon dan daftar sampel.',
    detail: 'Setiap sampel diisi: kategori, nama sampel, jenis uji yang diminta, berat, dan kemasan.',
    color: 'bg-blue-600',
  },
  {
    no: 3,
    title: 'Kirim Sampel Fisik',
    desc: 'Kirim sampel ke laboratorium disertai nomor permohonan.',
    detail: 'Status akan diperbarui oleh admin menjadi "Sampel Diterima" setelah sampel tiba.',
    color: 'bg-blue-600',
  },
  {
    no: 4,
    title: 'Verifikasi Sampel',
    desc: 'Admin memverifikasi kondisi setiap sampel (diterima/ditolak).',
    detail: 'Sampel yang ditolak perlu dikirim ulang melalui permohonan baru. Sampel OK langsung dilanjutkan.',
    color: 'bg-blue-600',
  },
  {
    no: 5,
    title: 'Pembayaran PNBP',
    desc: 'Admin menerbitkan kode billing. Pemohon melakukan pembayaran dan upload bukti bayar.',
    detail: 'Kode billing diterbitkan dari sistem PNBP eksternal. Total tagihan sesuai jenis uji yang disetujui.',
    color: 'bg-blue-600',
  },
  {
    no: 6,
    title: 'Analisis Laboratorium',
    desc: 'Setelah pembayaran dikonfirmasi, analisis sampel dimulai.',
    detail: 'Status berubah ke "On Progress". Durasi analisis bergantung pada jenis dan jumlah parameter.',
    color: 'bg-blue-600',
  },
  {
    no: 7,
    title: 'Unduh LHP',
    desc: 'Isi Indeks Kepuasan Masyarakat (IKM) lalu unduh Laporan Hasil Pengujian (LHP).',
    detail: 'IKM wajib diisi sebelum LHP dapat diunduh. Laporan tersedia dalam format PDF.',
    color: 'bg-green-600',
  },
];

export default function AlurPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100 px-5 py-3.5 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <Image src="/favicon.svg" alt="SIPUJA Logo" width={34} height={34} className="object-contain" />
          <Link href="/" className="font-bold text-slate-900">SIPUJA</Link>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm"><Link href="/login">Masuk</Link></Button>
          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white"><Link href="/register">Daftar</Link></Button>
        </div>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto w-full py-12 px-5 space-y-8">
        <div className="animate-slide-up">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Alur Pengujian</h1>
          <p className="text-slate-500 mt-2">Ikuti langkah-langkah berikut untuk menggunakan layanan pengujian laboratorium SIPUJA.</p>
        </div>

        <div className="relative animate-slide-up-delay-1">
          <div className="absolute left-5 top-5 bottom-5 w-px bg-slate-200" />
          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.no} className="flex gap-5 relative">
                <div className={`w-10 h-10 rounded-full ${step.color} text-white flex items-center justify-center font-bold text-sm shrink-0 z-10 shadow-sm`}>
                  {step.no}
                </div>
                <div className="bg-white border border-slate-100 rounded-xl p-4 flex-1 shadow-sm card-hover">
                  <h3 className="font-bold text-slate-900 text-sm">{step.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{step.desc}</p>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center pt-2 animate-slide-up-delay-2">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 h-12">
            <Link href="/register">Mulai Sekarang <ArrowRight size={16} className="ml-1.5" /></Link>
          </Button>
        </div>
      </main>

      <footer className="border-t py-6 px-5 text-center text-xs text-slate-400 mt-auto">
        © {new Date().getFullYear()} SIPUJA — Sistem Pengujian Hasil Lab
      </footer>
    </div>
  );
}
