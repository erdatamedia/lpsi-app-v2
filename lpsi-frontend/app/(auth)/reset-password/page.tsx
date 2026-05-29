'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

function ResetPasswordContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ password: '', konfirmasi: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.konfirmasi) { toast.error('Password tidak cocok'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      toast.success('Password berhasil direset. Silakan login.');
      router.push('/login');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4">
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
          {loading ? 'Menyimpan...' : 'Reset Password'}
        </Button>
      </CardFooter>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Card>
      <CardHeader><CardTitle>Reset Password</CardTitle></CardHeader>
      <Suspense fallback={<CardContent><p className="text-gray-400 text-sm">Memuat...</p></CardContent>}>
        <ResetPasswordContent />
      </Suspense>
    </Card>
  );
}
