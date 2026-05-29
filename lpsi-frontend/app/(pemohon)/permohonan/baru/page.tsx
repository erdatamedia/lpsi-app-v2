'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';

interface SampleForm {
  kategori: string;
  namaSampel: string;
  beratBasah: string;
  beratKering: string;
  kemasan: string;
  jenisUji: string;
  hargaTotal: string;
}

const emptySample = (): SampleForm => ({
  kategori: '',
  namaSampel: '',
  beratBasah: '',
  beratKering: '',
  kemasan: '',
  jenisUji: '',
  hargaTotal: '',
});

export default function BuatPermohonanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    namaPemohon: '',
    alamat: '',
    noHp: '',
    emailPemohon: '',
    tanggalPermohonan: new Date().toISOString().split('T')[0],
  });
  const [samples, setSamples] = useState<SampleForm[]>([emptySample()]);

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateSample(index: number, field: keyof SampleForm, value: string) {
    setSamples((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function addSample() {
    setSamples((prev) => [...prev, emptySample()]);
  }

  function removeSample(index: number) {
    if (samples.length === 1) return;
    setSamples((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    for (const s of samples) {
      if (!s.kategori || !s.namaSampel || !s.jenisUji || !s.hargaTotal) {
        toast.error('Lengkapi semua field sampel yang wajib diisi');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        samples: samples.map((s) => ({
          kategori: s.kategori,
          namaSampel: s.namaSampel,
          beratBasah: s.beratBasah ? parseFloat(s.beratBasah) : undefined,
          beratKering: s.beratKering ? parseFloat(s.beratKering) : undefined,
          kemasan: s.kemasan || undefined,
          jenisUji: s.jenisUji.split(',').map((j) => j.trim()).filter(Boolean),
          hargaTotal: parseFloat(s.hargaTotal),
        })),
      };

      const { data } = await api.post('/requests', payload);
      toast.success('Permohonan berhasil dibuat');
      router.push(`/permohonan/${data.data.id}`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Buat Permohonan</h1>
        <p className="text-sm text-gray-500 mt-1">Isi data permohonan pengujian laboratorium</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Data Pemohon */}
        <Card>
          <CardHeader><CardTitle className="text-base">Data Pemohon</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Nama Pemohon <span className="text-red-500">*</span></Label>
              <Input value={form.namaPemohon} onChange={(e) => updateForm('namaPemohon', e.target.value)} required />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Alamat <span className="text-red-500">*</span></Label>
              <Textarea value={form.alamat} onChange={(e) => updateForm('alamat', e.target.value)} required rows={2} />
            </div>
            <div className="space-y-2">
              <Label>No. HP <span className="text-red-500">*</span></Label>
              <Input value={form.noHp} onChange={(e) => updateForm('noHp', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input type="email" value={form.emailPemohon} onChange={(e) => updateForm('emailPemohon', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Permohonan <span className="text-red-500">*</span></Label>
              <Input type="date" value={form.tanggalPermohonan} onChange={(e) => updateForm('tanggalPermohonan', e.target.value)} required />
            </div>
          </CardContent>
        </Card>

        {/* Data Sampel */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">Data Sampel</h2>
            <Button type="button" variant="outline" size="sm" onClick={addSample}>
              <Plus size={14} className="mr-1" /> Tambah Sampel
            </Button>
          </div>

          {samples.map((sample, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium">Sampel {index + 1}</CardTitle>
                  {samples.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeSample(index)}
                      className="text-red-500 hover:text-red-700 h-7 w-7 p-0">
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Kategori <span className="text-red-500">*</span></Label>
                  <Input placeholder="mis. Pakan Ternak" value={sample.kategori}
                    onChange={(e) => updateSample(index, 'kategori', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nama Sampel <span className="text-red-500">*</span></Label>
                  <Input placeholder="mis. Rumput Gajah" value={sample.namaSampel}
                    onChange={(e) => updateSample(index, 'namaSampel', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Berat Basah (g)</Label>
                  <Input type="number" placeholder="0" value={sample.beratBasah}
                    onChange={(e) => updateSample(index, 'beratBasah', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Berat Kering (g)</Label>
                  <Input type="number" placeholder="0" value={sample.beratKering}
                    onChange={(e) => updateSample(index, 'beratKering', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Kemasan</Label>
                  <Input placeholder="mis. Plastik zip-lock" value={sample.kemasan}
                    onChange={(e) => updateSample(index, 'kemasan', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Jenis Uji <span className="text-red-500">*</span></Label>
                  <Input placeholder="Protein, Lemak, Abu (pisah koma)" value={sample.jenisUji}
                    onChange={(e) => updateSample(index, 'jenisUji', e.target.value)} required />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Harga Total (Rp) <span className="text-red-500">*</span></Label>
                  <Input type="number" placeholder="0" value={sample.hargaTotal}
                    onChange={(e) => updateSample(index, 'hargaTotal', e.target.value)} required />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Kirim Permohonan'}
          </Button>
        </div>
      </form>
    </div>
  );
}
