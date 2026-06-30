'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { LabRequest, REQUEST_STATUS_LABEL, RequestStatus } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Search, ChevronRight, Loader2 } from 'lucide-react';

const statusColor: Record<RequestStatus, string> = {
  MENUNGGU_SAMPEL: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  SAMPEL_DITERIMA: 'bg-blue-50 text-blue-700 border-blue-200',
  VERIFIKASI: 'bg-purple-50 text-purple-700 border-purple-200',
  MENUNGGU_BILLING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  MENUNGGU_PEMBAYARAN: 'bg-orange-50 text-orange-700 border-orange-200',
  LUNAS: 'bg-green-50 text-green-700 border-green-200',
  ON_PROGRESS: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  SELESAI: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function AdminPermohonanPage() {
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/requests').then(({ data }) => setRequests(data.data)).finally(() => setLoading(false));
  }, []);

  const filtered = requests.filter(
    (r) =>
      r.nomorPermohonan.toLowerCase().includes(search.toLowerCase()) ||
      r.namaPemohon.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-5 sm:p-7 space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Kelola Permohonan</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{filtered.length} permohonan ditemukan</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Cari nomor atau nama pemohon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="hidden sm:grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_1fr_40px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <span>Nomor</span><span>Pemohon</span><span>Tanggal</span><span>Sampel</span><span>Status</span><span>Tagihan</span><span></span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 size={20} className="animate-spin mr-2" /> Memuat...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-sm">Tidak ada data</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((req) => (
              <Link key={req.id} href={`/admin/permohonan/${req.id}`}
                className="flex flex-col sm:grid sm:grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_1fr_40px] gap-2 sm:gap-4 items-start sm:items-center px-5 py-4 hover:bg-slate-50 transition-colors group">
                <p className="font-semibold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">{req.nomorPermohonan}</p>
                <p className="text-sm text-slate-700">{req.namaPemohon}</p>
                <p className="text-xs text-slate-500">{new Date(req.tanggalPermohonan).toLocaleDateString('id-ID')}</p>
                <p className="text-xs text-slate-500">{req.samples.length} sampel</p>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border w-fit ${statusColor[req.status]}`}>
                  {REQUEST_STATUS_LABEL[req.status]}
                </span>
                <p className="text-xs text-slate-700 font-medium">
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
