import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ClipboardList, FlaskConical, CreditCard, FileDown, ArrowRight, CheckCircle2 } from 'lucide-react';

const steps = [
  { icon: ClipboardList, title: 'Ajukan Permohonan', desc: 'Isi formulir online dan daftarkan sampel yang akan diuji.' },
  { icon: FlaskConical, title: 'Kirim Sampel', desc: 'Kirim sampel fisik ke laboratorium sesuai petunjuk.' },
  { icon: CreditCard, title: 'Pembayaran PNBP', desc: 'Terima kode billing dan lakukan pembayaran sesuai tagihan.' },
  { icon: FileDown, title: 'Unduh LHP', desc: 'Isi IKM dan unduh Laporan Hasil Pengujian secara online.' },
];

const highlights = [
  'Permohonan 100% online',
  'Tracking status real-time',
  'Laporan digital terverifikasi',
  'Notifikasi email otomatis',
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100 px-5 py-3.5 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <FlaskConical size={16} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-base leading-none block">LPSI</span>
            <span className="text-slate-400 text-xs hidden sm:block">BRMP Ruminansia Besar</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/layanan" className="hidden sm:block text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors">Layanan</Link>
          <Link href="/alur" className="hidden sm:block text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors">Alur</Link>
          <Button asChild variant="ghost" size="sm"><Link href="/login">Masuk</Link></Button>
          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white"><Link href="/register">Daftar</Link></Button>
        </div>
      </nav>

      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 text-white py-20 sm:py-28 px-5">
        <div className="max-w-3xl mx-auto text-center animate-slide-up">
          <span className="inline-block bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            LPSI — Layanan Pelacakan Hasil Lab
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5 text-white">
            Layanan Pengujian Lab<br className="hidden sm:block" /> Kini Sepenuhnya Online
          </h1>
          <p className="text-blue-100 text-lg sm:text-xl mb-8 max-w-2xl mx-auto">
            Ajukan permohonan, pantau status analisis, dan unduh laporan hasil pengujian — tanpa perlu datang ke lab.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-blue-500 hover:bg-blue-400 text-white font-semibold px-8 h-12">
              <Link href="/register">Mulai Sekarang <ArrowRight size={16} className="ml-1.5" /></Link>
            </Button>
            <Button asChild size="lg" className="bg-transparent border border-white/50 text-white hover:bg-white/10 h-12 px-8">
              <Link href="/alur">Lihat Alur Pengujian</Link>
            </Button>
          </div>
        </div>
        <div className="mt-14 max-w-2xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 animate-slide-up-delay-2">
          {highlights.map((h) => (
            <div key={h} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2.5">
              <CheckCircle2 size={15} className="text-green-400 shrink-0" />
              <span className="text-xs text-blue-100 font-medium">{h}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 sm:py-20 px-5 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Alur Pengujian</h2>
            <p className="text-slate-500 mt-2">Empat langkah mudah dari permohonan hingga laporan</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm card-hover">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                  <Icon size={19} className="text-blue-600" />
                </div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">Langkah {i + 1}</span>
                <h3 className="font-bold text-slate-900 mt-1 mb-1.5 text-sm">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/alur" className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 hover:underline">
              Lihat alur lengkap <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 px-5">
        <div className="max-w-lg mx-auto bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-center text-white shadow-lg">
          <h2 className="text-xl font-bold mb-2">Sudah punya akun?</h2>
          <p className="text-blue-100 text-sm mb-5">Masuk untuk memantau status dan mengunduh laporan.</p>
          <Button asChild className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-8">
            <Link href="/login">Masuk ke Portal</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t py-6 px-5 text-center text-xs text-slate-400 mt-auto">
        © {new Date().getFullYear()} LPSI — Layanan Pelacakan Hasil Lab
      </footer>
    </div>
  );
}
