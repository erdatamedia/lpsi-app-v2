'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCircle, Loader2, CheckCircle2, Pencil, X, Check } from 'lucide-react';

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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nama: '', jenisKelamin: '', tanggalLahir: '' });

  async function fetchProfile() {
    const { data } = await api.get('/users/me');
    setProfile(data.data);
    return data.data as Profile;
  }

  useEffect(() => { fetchProfile().finally(() => setLoading(false)); }, []);

  function startEdit() {
    if (!profile) return;
    setForm({
      nama: profile.nama,
      jenisKelamin: profile.jenisKelamin ?? '',
      tanggalLahir: profile.tanggalLahir ? profile.tanggalLahir.substring(0, 10) : '',
    });
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.patch('/users/me', {
        nama: form.nama || undefined,
        jenisKelamin: form.jenisKelamin || undefined,
        tanggalLahir: form.tanggalLahir || undefined,
      });
      await fetchProfile();
      setEditing(false);
      toast.success('Profil berhasil diperbarui');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400">
      <Loader2 size={20} className="animate-spin mr-2" /> Memuat...
    </div>
  );
  if (!profile) return (
    <div className="p-6 text-red-500 dark:text-red-400 text-sm">Gagal memuat profil.</div>
  );

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
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 dark:text-white text-base truncate">{profile.nama}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{profile.email}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <CheckCircle2 size={13} className="text-green-500" />
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">Akun Aktif</span>
          </div>
        </div>
        {!editing && (
          <button onClick={startEdit} className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shrink-0">
            <Pencil size={16} />
          </button>
        )}
      </div>

      {/* Edit form */}
      {editing ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Edit Profil</p>
            <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X size={15} />
            </button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nama" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nama Lengkap</Label>
            <Input
              id="nama"
              value={form.nama}
              onChange={e => setForm({ ...form, nama: e.target.value })}
              className="h-10 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="jenisKelamin" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Jenis Kelamin</Label>
              <select
                id="jenisKelamin"
                value={form.jenisKelamin}
                onChange={e => setForm({ ...form, jenisKelamin: e.target.value })}
                className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih...</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tanggalLahir" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tanggal Lahir</Label>
              <Input
                id="tanggalLahir"
                type="date"
                value={form.tanggalLahir}
                onChange={e => setForm({ ...form, tanggalLahir: e.target.value })}
                className="h-10 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10">
              {saving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Check size={14} className="mr-1.5" />}
              Simpan Perubahan
            </Button>
            <Button variant="outline" onClick={() => setEditing(false)} disabled={saving} className="h-10 dark:border-slate-600 dark:text-slate-300">
              Batal
            </Button>
          </div>
        </div>
      ) : (
        /* Detail rows */
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Detail Akun</p>
          </div>
          <dl className="divide-y divide-slate-50 dark:divide-slate-700">
            {[
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
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center px-5 py-3.5">
                <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
                <dd className="text-sm font-semibold text-slate-900 dark:text-white text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
