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

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      toast.success('Login berhasil');
      router.push(data.data.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Selamat Datang</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Masuk ke portal SIPUJA untuk melanjutkan.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email</Label>
          <Input id="email" type="email" placeholder="nama@email.com"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="h-11 dark:bg-slate-800 dark:border-slate-600 dark:text-white" required />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</Label>
            <Link href="/lupa-password" className="text-xs text-blue-600 hover:underline">Lupa password?</Link>
          </div>
          <Input id="password" type="password"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="h-11 dark:bg-slate-800 dark:border-slate-600 dark:text-white" required />
        </div>
        <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold" disabled={loading}>
          {loading ? 'Memproses...' : 'Masuk'}
        </Button>
      </form>
      <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-6">
        Belum punya akun?{' '}
        <Link href="/register" className="text-blue-600 font-semibold hover:underline">Daftar sekarang</Link>
      </p>
    </div>
  );
}
