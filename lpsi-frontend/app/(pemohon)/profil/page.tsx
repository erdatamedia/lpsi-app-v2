'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { UserCircle, Loader2, CheckCircle2 } from 'lucide-react';

interface Profile {
  id: number;
  nama: string;
  email: string;
  role: string;
  jenisKelamin: string | null;
  tanggalLahir: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function ProfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/me').then(({ data }) => setProfile(data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400">
      <Loader2 size={20} className="animate-spin mr-2" /> Memuat...
    </div>
  );
  if (!profile) return (
    <div className="p-6 text-red-500 dark:text-red-400 text-sm">Gagal memuat profil.</div>
  );

  const rows: { label: string; value: string }[] = [
    { label: 'Nama Lengkap', value: profile.nama },
    { label: 'Email', value: profile.email },
    { label: 'Jenis Kelamin', value: profile.jenisKelamin ?? '—' },
    {
      label: 'Tanggal Lahir',
      value: profile.tanggalLahir
        ? new Date(profile.tanggalLahir).toLocaleDateString('id-ID', { dateStyle: 'long' })
        : '—',
    },
    {
      label: 'Akun Dibuat',
      value: new Date(profile.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' }),
    },
  ];

  return (
    <div className="p-5 sm:p-7 space-y-5 max-w-lg mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Profil Saya</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Informasi akun Anda di portal LPSI.</p>
      </div>

      {/* Avatar header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
          <UserCircle size={28} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-900 dark:text-white text-base truncate">{profile.nama}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{profile.email}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <CheckCircle2 size={13} className="text-green-500" />
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">Akun Aktif</span>
          </div>
        </div>
      </div>

      {/* Detail rows */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Detail Akun</p>
        </div>
        <dl className="divide-y divide-slate-50 dark:divide-slate-700">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center px-5 py-3.5">
              <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
              <dd className="text-sm font-semibold text-slate-900 dark:text-white text-right">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
