'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { LabRequest, REQUEST_STATUS_LABEL, RequestStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, ChevronRight } from 'lucide-react';

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

export default function PermohonanPage() {
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/requests').then(({ data }) => setRequests(data.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-5 sm:p-7 space-y-5 max-w-4xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Permohonan Saya</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{requests.length} total permohonan</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white font-semibold w-full sm:w-auto">
          <Link href="/permohonan/baru"><Plus size={16} className="mr-1.5" />Buat Permohonan</Link>
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr_40px] gap-4 px-5 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          <span>Nomor</span><span>Tanggal</span><span>Sampel</span><span>Status</span><span>Tagihan</span><span></span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 size={20} className="animate-spin mr-2" /> Memuat...
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-sm">Belum ada permohonan.</div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-700">
            {requests.map((req) => (
              <Link key={req.id} href={`/permohonan/${req.id}`}
                className="flex flex-col sm:grid sm:grid-cols-[2fr_1fr_1fr_1.5fr_1fr_40px] gap-2 sm:gap-4 items-start sm:items-center px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                <p className="font-semibold text-slate-900 dark:text-white text-sm group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{req.nomorPermohonan}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(req.tanggalPermohonan).toLocaleDateString('id-ID')}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{req.samples.length} sampel</p>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border w-fit ${statusColor[req.status]}`}>
                  {REQUEST_STATUS_LABEL[req.status]}
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  {req.totalTagihan ? `Rp ${Number(req.totalTagihan).toLocaleString('id-ID')}` : '—'}
                </p>
                <ChevronRight size={16} className="text-slate-300 hidden sm:block group-hover:text-blue-400 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
