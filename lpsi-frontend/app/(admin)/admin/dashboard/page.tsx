'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { REQUEST_STATUS_LABEL, RequestStatus } from '@/lib/types';
import { ClipboardList, FlaskConical, Banknote, TrendingUp } from 'lucide-react';

interface Metrics {
  totalRequests: number;
  byStatus: Partial<Record<RequestStatus, number>>;
  totalRevenue: number;
  totalSamples: number;
}

const statusColor: Record<RequestStatus, string> = {
  MENUNGGU_SAMPEL: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  SAMPEL_DITERIMA: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  VERIFIKASI: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  MENUNGGU_BILLING: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  MENUNGGU_PEMBAYARAN: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  LUNAS: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  ON_PROGRESS: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  SELESAI: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard/metrics')
      .then(({ data }) => setMetrics(data.data))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Total Permohonan', value: metrics?.totalRequests, icon: ClipboardList, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { label: 'Total Sampel', value: metrics?.totalSamples, icon: FlaskConical, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30' },
    {
      label: 'Pendapatan Terkonfirmasi',
      value: metrics ? `Rp ${Number(metrics.totalRevenue).toLocaleString('id-ID')}` : null,
      icon: Banknote,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/30',
    },
  ];

  return (
    <div className="p-5 sm:p-7 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Dashboard Admin</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Ringkasan aktivitas sistem SIPUJA.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={17} className={color} />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
            </div>
            <p className={`text-3xl font-extrabold ${color}`}>
              {loading ? '—' : (value ?? 0)}
            </p>
          </div>
        ))}
      </div>

      {metrics?.byStatus && Object.keys(metrics.byStatus).length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Distribusi Status Permohonan</h2>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.entries(metrics.byStatus) as [RequestStatus, number][]).map(([status, count]) => (
              <div key={status} className={`rounded-lg p-3 ${statusColor[status]}`}>
                <p className="text-2xl font-extrabold">{count}</p>
                <p className="text-xs font-medium mt-1 opacity-80">{REQUEST_STATUS_LABEL[status]}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
