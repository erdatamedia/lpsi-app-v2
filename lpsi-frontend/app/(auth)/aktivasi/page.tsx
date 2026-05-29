'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function AktivasiContent() {
  const params = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    api.post('/auth/activate', { token })
      .then(() => { setStatus('success'); toast.success('Akun berhasil diaktivasi'); })
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <CardContent className="space-y-4 text-center">
      {status === 'loading' && <p className="text-gray-500">Memproses aktivasi...</p>}
      {status === 'success' && (
        <>
          <p className="text-green-600 font-medium">Akun Anda berhasil diaktivasi!</p>
          <Button asChild className="w-full"><Link href="/login">Masuk Sekarang</Link></Button>
        </>
      )}
      {status === 'error' && (
        <>
          <p className="text-red-600">Token tidak valid atau sudah kedaluwarsa.</p>
          <Button asChild variant="outline" className="w-full"><Link href="/login">Kembali ke Login</Link></Button>
        </>
      )}
    </CardContent>
  );
}

export default function AktivasiPage() {
  return (
    <Card>
      <CardHeader><CardTitle>Aktivasi Akun</CardTitle></CardHeader>
      <Suspense fallback={<CardContent><p className="text-gray-400 text-sm text-center">Memuat...</p></CardContent>}>
        <AktivasiContent />
      </Suspense>
    </Card>
  );
}
