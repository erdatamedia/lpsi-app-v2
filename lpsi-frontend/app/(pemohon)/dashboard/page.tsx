'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { LabRequest, REQUEST_STATUS_LABEL, RequestStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, ArrowRight, ClipboardList, CheckCircle2, Loader2 } from 'lucide-react';

const statusColor: Record<RequestStatus, string> = {
  MENUNGGU_SAMPEL: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
  SAMPEL_DITERIMA: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  VERIFIKASI: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
  MENUNGGU_BILLING: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800',
  MENUNGGU_PEMBAYARAN: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
  LUNAS: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  ON_PROGRESS: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-800',
  SELESAI: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
};

export default function DashboardPage() {
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/requests').then(({ data }) => setRequests(data.data)).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Total Permohonan', value: requests.length, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Sedang Proses', value: requests.filter((r) => r.status !== 'SELESAI').length, color: 'text-orange-600 dark:text-orange-400' },
    { label: 'Selesai', value: requests.filter((r) => r.status === 'SELESAI').length, color: 'text-green-600 dark:text-green-400' },
  ];

  return (
    <div className="p-5 sm:p-7 space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Selamat datang kembali di portal LPSI.</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white font-semibold w-full sm:w-auto">
          <Link href="/permohonan/baru"><Plus size={16} className="mr-1.5" />Buat Permohonan</Link>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
            <p className={`text-3xl font-extrabold mt-1 ${color}`}>{loading ? '—' : value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList size={16} className="text-blue-600 dark:text-blue-400" /> Permohonan Terbaru
          </h2>
          <Link href="/permohonan" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
            Lihat semua <ArrowRight size={12} />
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 size={20} className="animate-spin mr-2" /> Memuat...
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-400 text-sm">Belum ada permohonan.</p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/permohonan/baru">Buat permohonan pertama</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-700">
            {requests.slice(0, 5).map((req) => (
              <Link key={req.id} href={`/permohonan/${req.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm truncate group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                    {req.nomorPermohonan}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{req.samples.length} sampel</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${statusColor[req.status]}`}>
                    {REQUEST_STATUS_LABEL[req.status]}
                  </span>
                  {req.status === 'SELESAI' && <CheckCircle2 size={16} className="text-green-500" />}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
