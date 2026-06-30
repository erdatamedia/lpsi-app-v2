'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Clock } from 'lucide-react';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ nama: '', email: '', password: '', konfirmasi: '', jenisKelamin: '', tanggalLahir: '', pekerjaan: '', pendidikanTerakhir: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.konfirmasi) { toast.error('Password dan konfirmasi tidak cocok'); return; }
    setLoading(true);
    try {
      await api.post('/auth/register', {
        nama: form.nama,
        email: form.email,
        password: form.password,
        jenisKelamin: form.jenisKelamin || undefined,
        tanggalLahir: form.tanggalLahir || undefined,
        pekerjaan: form.pekerjaan || undefined,
        pendidikanTerakhir: form.pendidikanTerakhir || undefined,
      });
      setSuccess(true);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const textFields = [
    { id: 'nama', label: 'Nama Lengkap', type: 'text', placeholder: 'Nama lengkap Anda' },
    { id: 'email', label: 'Email', type: 'email', placeholder: 'nama@email.com' },
    { id: 'password', label: 'Password', type: 'password', placeholder: 'Minimal 8 karakter', minLength: 8 },
    { id: 'konfirmasi', label: 'Konfirmasi Password', type: 'password', placeholder: 'Ulangi password' },
  ];

  if (success) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Pendaftaran Berhasil!</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-5">
          Akun Anda telah berhasil didaftarkan.
        </p>
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-left mb-6">
          <Clock size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Menunggu Verifikasi Admin</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              Akun Anda sedang menunggu verifikasi oleh admin. Harap menunggu maksimal <strong>1×24 jam</strong>.
              Setelah diverifikasi, Anda dapat login dan mengajukan permohonan pengujian.
            </p>
          </div>
        </div>
        <Link href="/login" className="inline-block w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors">
          Kembali ke Halaman Login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Buat Akun</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Daftarkan diri untuk mengajukan permohonan pengujian.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {textFields.map(({ id, label, type, placeholder, minLength }) => (
          <div key={id} className="space-y-1.5">
            <Label htmlFor={id} className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</Label>
            <Input id={id} type={type} placeholder={placeholder} minLength={minLength}
              value={form[id as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [id]: e.target.value })}
              className="h-11 dark:bg-slate-800 dark:border-slate-600 dark:text-white" required />
          </div>
        ))}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="jenisKelamin" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Jenis Kelamin</Label>
            <select
              id="jenisKelamin"
              value={form.jenisKelamin}
              onChange={(e) => setForm({ ...form, jenisKelamin: e.target.value })}
              className="w-full h-11 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              onChange={(e) => setForm({ ...form, tanggalLahir: e.target.value })}
              className="h-11 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="pekerjaan" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pekerjaan</Label>
            <Input
              id="pekerjaan"
              type="text"
              placeholder="mis. Peneliti, Peternak"
              value={form.pekerjaan}
              onChange={(e) => setForm({ ...form, pekerjaan: e.target.value })}
              className="h-11 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pendidikanTerakhir" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pendidikan Terakhir</Label>
            <select
              id="pendidikanTerakhir"
              value={form.pendidikanTerakhir}
              onChange={(e) => setForm({ ...form, pendidikanTerakhir: e.target.value })}
              className="w-full h-11 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih...</option>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="SMA/SMK">SMA/SMK</option>
              <option value="D3">D3</option>
              <option value="S1">S1</option>
              <option value="S2">S2</option>
              <option value="S3">S3</option>
            </select>
          </div>
        </div>

        <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold mt-1" disabled={loading}>
          {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
        </Button>
      </form>
      <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-6">
        Sudah punya akun?{' '}
        <Link href="/login" className="text-blue-600 font-semibold hover:underline">Masuk</Link>
      </p>
    </div>
  );
}
