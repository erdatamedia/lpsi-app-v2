'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nama: '', email: '', password: '', konfirmasi: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.konfirmasi) { toast.error('Password dan konfirmasi tidak cocok'); return; }
    setLoading(true);
    try {
      await api.post('/auth/register', { nama: form.nama, email: form.email, password: form.password });
      toast.success('Registrasi berhasil! Cek email Anda untuk aktivasi akun.');
      router.push('/login');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { id: 'nama', label: 'Nama Lengkap', type: 'text', placeholder: 'Nama lengkap Anda' },
    { id: 'email', label: 'Email', type: 'email', placeholder: 'nama@email.com' },
    { id: 'password', label: 'Password', type: 'password', placeholder: 'Minimal 8 karakter', minLength: 8 },
    { id: 'konfirmasi', label: 'Konfirmasi Password', type: 'password', placeholder: 'Ulangi password' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Buat Akun</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Daftarkan diri untuk mengajukan permohonan pengujian.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(({ id, label, type, placeholder, minLength }) => (
          <div key={id} className="space-y-1.5">
            <Label htmlFor={id} className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</Label>
            <Input id={id} type={type} placeholder={placeholder} minLength={minLength}
              value={form[id as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [id]: e.target.value })}
              className="h-11 dark:bg-slate-800 dark:border-slate-600 dark:text-white" required />
          </div>
        ))}
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
