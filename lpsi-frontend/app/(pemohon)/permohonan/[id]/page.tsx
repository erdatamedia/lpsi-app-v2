'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/error';
import { LabRequest, REQUEST_STATUS_LABEL, RequestStatus, SAMPLE_STATUS_LABEL, SampleStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download, Upload } from 'lucide-react';

const statusColor: Record<RequestStatus, string> = {
  MENUNGGU_SAMPEL: 'bg-yellow-100 text-yellow-800',
  SAMPEL_DITERIMA: 'bg-blue-100 text-blue-800',
  VERIFIKASI: 'bg-purple-100 text-purple-800',
  MENUNGGU_PEMBAYARAN: 'bg-orange-100 text-orange-800',
  LUNAS: 'bg-green-100 text-green-800',
  ON_PROGRESS: 'bg-cyan-100 text-cyan-800',
  SELESAI: 'bg-gray-100 text-gray-800',
};

const sampleColor: Record<SampleStatus, string> = {
  MENUNGGU: 'bg-yellow-100 text-yellow-800',
  DITERIMA: 'bg-blue-100 text-blue-800',
  OK: 'bg-green-100 text-green-800',
  DITOLAK: 'bg-red-100 text-red-800',
};

const IKM_PERTANYAAN = [
  { key: 'p1', label: 'Kemudahan prosedur permohonan pengujian' },
  { key: 'p2', label: 'Kesesuaian persyaratan pengujian' },
  { key: 'p3', label: 'Kejelasan informasi layanan' },
  { key: 'p4', label: 'Kedisiplinan dan kesopanan petugas' },
  { key: 'p5', label: 'Kecepatan pelayanan' },
  { key: 'p6', label: 'Keadilan dalam pelayanan' },
  { key: 'p7', label: 'Keramahan dan kesopanan petugas' },
  { key: 'p8', label: 'Kewajaran biaya pengujian' },
  { key: 'p9', label: 'Kesesuaian antara biaya yang dibayarkan dan hasil pengujian' },
];

const IKM_OPTIONS = [
  { value: '1', label: 'Tidak Baik' },
  { value: '2', label: 'Kurang Baik' },
  { value: '3', label: 'Baik' },
  { value: '4', label: 'Sangat Baik' },
];

export default function DetailPermohonanPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [request, setRequest] = useState<LabRequest & { ikm?: object }>();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // IKM
  const [ikmJawaban, setIkmJawaban] = useState<Record<string, string>>({});
  const [ikmSaran, setIkmSaran] = useState('');
  const [submittingIkm, setSubmittingIkm] = useState(false);

  async function fetchRequest() {
    const { data } = await api.get(`/requests/${id}`);
    setRequest(data.data);
  }

  useEffect(() => {
    fetchRequest().finally(() => setLoading(false));
  }, [id]);

  async function handleUploadBukti(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('buktiBayar', file);
      await api.post(`/requests/${id}/bukti-bayar`, form);
      toast.success('Bukti bayar berhasil diunggah');
      await fetchRequest();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmitIkm(e: React.FormEvent) {
    e.preventDefault();
    if (IKM_PERTANYAAN.some((p) => !ikmJawaban[p.key])) {
      toast.error('Semua pertanyaan harus dijawab');
      return;
    }
    setSubmittingIkm(true);
    try {
      await api.post(`/requests/${id}/ikm`, { ...ikmJawaban, saran: ikmSaran });
      toast.success('IKM berhasil disimpan');
      await fetchRequest();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmittingIkm(false);
    }
  }

  async function handleDownloadLhp(sampleId: number) {
    try {
      const res = await api.get(`/requests/${id}/lhp/${sampleId}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LHP-${sampleId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  }

  if (loading) return <div className="p-6 text-gray-400">Memuat...</div>;
  if (!request) return <div className="p-6 text-red-500">Permohonan tidak ditemukan</div>;

  const hasIkm = !!request.ikm;
  const isSelesai = request.status === 'SELESAI';

  return (
    <div className="p-6 max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft size={16} /></Button>
        <div>
          <h1 className="text-xl font-bold">{request.nomorPermohonan}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[request.status]}`}>
            {REQUEST_STATUS_LABEL[request.status]}
          </span>
        </div>
      </div>

      {/* Info Pemohon */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Data Pemohon</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div><span className="text-gray-500">Nama</span><p className="font-medium">{request.namaPemohon}</p></div>
          <div><span className="text-gray-500">No. HP</span><p className="font-medium">{request.noHp}</p></div>
          <div className="col-span-2"><span className="text-gray-500">Alamat</span><p className="font-medium">{request.alamat}</p></div>
          <div><span className="text-gray-500">Email</span><p className="font-medium">{request.emailPemohon}</p></div>
          <div><span className="text-gray-500">Tanggal</span>
            <p className="font-medium">{new Date(request.tanggalPermohonan).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
          </div>
        </CardContent>
      </Card>

      {/* Sampel */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Data Sampel</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {request.samples.map((s, i) => (
            <div key={s.id} className="border rounded-lg p-3 space-y-1.5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{i + 1}. {s.namaSampel} <span className="text-gray-400 font-normal">— {s.kategori}</span></p>
                  <p className="text-xs text-gray-500">Jenis Uji: {Array.isArray(s.jenisUji) ? s.jenisUji.join(', ') : s.jenisUji}</p>
                  <p className="text-xs text-gray-500">Harga: Rp {Number(s.hargaTotal).toLocaleString('id-ID')}</p>
                  {s.alasanTolak && <p className="text-xs text-red-600 mt-1">Alasan tolak: {s.alasanTolak}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sampleColor[s.status]}`}>
                    {SAMPLE_STATUS_LABEL[s.status]}
                  </span>
                  {s.lhpFile && isSelesai && hasIkm && (
                    <Button size="sm" variant="outline" onClick={() => handleDownloadLhp(s.id)}>
                      <Download size={12} className="mr-1" /> LHP
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Pembayaran */}
      {request.totalTagihan && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Informasi Pembayaran</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Kode Billing</span>
              <span className="font-medium font-mono">{request.kodeBilling ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Tagihan</span>
              <span className="font-semibold text-base">Rp {Number(request.totalTagihan).toLocaleString('id-ID')}</span>
            </div>
            {request.buktiBayar ? (
              <p className="text-green-600 text-xs pt-1">✓ Bukti bayar sudah diunggah</p>
            ) : request.status === 'MENUNGGU_PEMBAYARAN' && (
              <div className="pt-2">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleUploadBukti} disabled={uploading} />
                  <Button asChild variant="outline" size="sm" disabled={uploading}>
                    <span><Upload size={14} className="mr-1.5" />{uploading ? 'Mengunggah...' : 'Upload Bukti Bayar'}</span>
                  </Button>
                </label>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* IKM */}
      {isSelesai && !hasIkm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Indeks Kepuasan Masyarakat (IKM)</CardTitle>
            <p className="text-xs text-gray-500">Wajib diisi sebelum dapat mengunduh LHP</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitIkm} className="space-y-4">
              {IKM_PERTANYAAN.map((p, i) => (
                <div key={p.key} className="space-y-1.5">
                  <Label className="text-xs">{i + 1}. {p.label}</Label>
                  <Select value={ikmJawaban[p.key] ?? ''} onValueChange={(v) => setIkmJawaban((prev) => ({ ...prev, [p.key]: v as string }))}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Pilih penilaian..." />
                    </SelectTrigger>
                    <SelectContent>
                      {IKM_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <div className="space-y-1.5">
                <Label className="text-xs">Saran & Masukan (opsional)</Label>
                <Textarea value={ikmSaran} onChange={(e) => setIkmSaran(e.target.value)}
                  placeholder="Tuliskan saran Anda..." rows={3} />
              </div>
              <Button type="submit" className="w-full" disabled={submittingIkm}>
                {submittingIkm ? 'Menyimpan...' : 'Kirim IKM'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isSelesai && hasIkm && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-green-600 font-medium">✓ IKM sudah diisi. Anda dapat mengunduh LHP di atas.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
