'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type Step = 'form' | 'pending' | 'reset';

export default function LupaPasswordPage() {
  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ password: '', konfirmasi: '' });
  const [resetDone, setResetDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setStep('pending');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCekStatus() {
    setLoading(true);
    try {
      const res = await api.get('/auth/reset-status', { params: { email } });
      const { status, token } = res.data.data as { status: string; token?: string };
      if (status === 'APPROVED' && token) {
        setResetToken(token);
        setStep('reset');
      } else if (status === 'PENDING') {
        toast.info('Permintaan masih menunggu persetujuan admin.');
      } else {
        toast.warning('Tidak ada permintaan reset aktif untuk email ini.');
        setStep('form');
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.konfirmasi) { toast.error('Password tidak cocok'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token: resetToken, password: form.password });
      setResetDone(true);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (resetDone) {
    return (
      <Card>
        <CardHeader><CardTitle>Password Berhasil Direset</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">Password Anda telah berhasil diperbarui. Silakan login dengan password baru.</p>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full"><Link href="/login">Login Sekarang</Link></Button>
        </CardFooter>
      </Card>
    );
  }

  if (step === 'reset') {
    return (
      <Card>
        <CardHeader><CardTitle>Buat Password Baru</CardTitle></CardHeader>
        <form onSubmit={handleReset}>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">Permintaan reset telah disetujui admin. Masukkan password baru Anda.</p>
            <div className="space-y-2">
              <Label htmlFor="password">Password Baru</Label>
              <Input id="password" type="password" placeholder="Minimal 8 karakter" minLength={8}
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="konfirmasi">Konfirmasi Password</Label>
              <Input id="konfirmasi" type="password"
                value={form.konfirmasi} onChange={(e) => setForm({ ...form, konfirmasi: e.target.value })} required />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  if (step === 'pending') {
    return (
      <Card>
        <CardHeader><CardTitle>Menunggu Persetujuan Admin</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300">
            <p className="font-medium mb-1">Permintaan reset dikirim untuk:</p>
            <p className="font-mono">{email}</p>
          </div>
          <p className="text-sm text-gray-500">
            Permintaan Anda sedang menunggu persetujuan admin. Setelah disetujui, klik tombol di bawah untuk mengecek status dan melanjutkan reset password.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full" onClick={handleCekStatus} disabled={loading}>
            {loading ? 'Mengecek...' : 'Cek Status Persetujuan'}
          </Button>
          <button
            type="button"
            onClick={() => setStep('form')}
            className="text-sm text-center text-blue-600 hover:underline"
          >
            Gunakan email berbeda
          </button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lupa Password</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Masukkan email akun Anda. Admin akan memverifikasi permintaan dan mengaktifkan reset password.
          </p>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Mengirim...' : 'Kirim Permintaan Reset'}
          </Button>
          <Link href="/login" className="text-sm text-center text-blue-600 hover:underline">Kembali ke Login</Link>
        </CardFooter>
      </form>
    </Card>
  );
}
