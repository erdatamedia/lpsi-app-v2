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

export default function LupaPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Link reset password telah dikirim ke email Anda');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Card>
        <CardHeader><CardTitle>Email Terkirim</CardTitle></CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm">
            Link reset password telah dikirim ke <strong>{email}</strong>. Periksa inbox atau folder spam Anda.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" className="w-full"><Link href="/login">Kembali ke Login</Link></Button>
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
          <p className="text-sm text-gray-500">Masukkan email Anda dan kami akan mengirimkan link untuk mereset password.</p>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Mengirim...' : 'Kirim Link Reset'}
          </Button>
          <Link href="/login" className="text-sm text-center text-blue-600 hover:underline">Kembali ke Login</Link>
        </CardFooter>
      </form>
    </Card>
  );
}
