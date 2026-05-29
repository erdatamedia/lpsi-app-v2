'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/error';
import { LabRequest, REQUEST_STATUS_LABEL, RequestStatus, SAMPLE_STATUS_LABEL, SampleStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Upload } from 'lucide-react';

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

const REQUEST_STATUSES: RequestStatus[] = [
  'MENUNGGU_SAMPEL','SAMPEL_DITERIMA','VERIFIKASI','MENUNGGU_PEMBAYARAN','LUNAS','ON_PROGRESS','SELESAI',
];

export default function AdminDetailPermohonanPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [request, setRequest] = useState<LabRequest>();
  const [loading, setLoading] = useState(true);

  // update status
  const [newStatus, setNewStatus] = useState<RequestStatus | ''>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // billing
  const [billing, setBilling] = useState({ kodeBilling: '', totalTagihan: '' });
  const [savingBilling, setSavingBilling] = useState(false);

  // konfirmasi bayar
  const [confirmingBayar, setConfirmingBayar] = useState(false);

  // verifikasi sampel dialog
  const [verifDialog, setVerifDialog] = useState<{ open: boolean; sampleId: number; nama: string }>({ open: false, sampleId: 0, nama: '' });
  const [verifForm, setVerifForm] = useState<{ status: SampleStatus | ''; alasanTolak: string }>({ status: '', alasanTolak: '' });
  const [savingVerif, setSavingVerif] = useState(false);

  // upload LHP
  const [uploadingLhp, setUploadingLhp] = useState<number | null>(null);

  async function fetchRequest() {
    const { data } = await api.get(`/requests/${id}`);
    setRequest(data.data);
  }

  useEffect(() => {
    fetchRequest().finally(() => setLoading(false));
  }, [id]);

  async function handleUpdateStatus() {
    if (!newStatus) return;
    setUpdatingStatus(true);
    try {
      await api.patch(`/admin/requests/${id}/status`, { status: newStatus });
      toast.success('Status berhasil diperbarui');
      await fetchRequest();
      setNewStatus('');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleSaveBilling() {
    if (!billing.kodeBilling || !billing.totalTagihan) {
      toast.error('Kode billing dan total tagihan wajib diisi');
      return;
    }
    setSavingBilling(true);
    try {
      await api.patch(`/admin/requests/${id}/billing`, {
        kodeBilling: billing.kodeBilling,
        totalTagihan: parseFloat(billing.totalTagihan),
      });
      toast.success('Billing berhasil disimpan');
      await fetchRequest();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingBilling(false);
    }
  }

  async function handleKonfirmasiBayar() {
    setConfirmingBayar(true);
    try {
      await api.patch(`/admin/requests/${id}/konfirmasi-bayar`);
      toast.success('Pembayaran berhasil dikonfirmasi');
      await fetchRequest();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setConfirmingBayar(false);
    }
  }

  function openVerif(sampleId: number, nama: string) {
    setVerifDialog({ open: true, sampleId, nama });
    setVerifForm({ status: '', alasanTolak: '' });
  }

  async function handleVerifSampel() {
    if (!verifForm.status) { toast.error('Pilih status verifikasi'); return; }
    if (verifForm.status === 'DITOLAK' && !verifForm.alasanTolak) {
      toast.error('Alasan penolakan wajib diisi');
      return;
    }
    setSavingVerif(true);
    try {
      await api.patch(`/admin/samples/${verifDialog.sampleId}/verify`, {
        status: verifForm.status,
        alasanTolak: verifForm.alasanTolak || undefined,
      });
      toast.success('Verifikasi sampel berhasil');
      setVerifDialog({ open: false, sampleId: 0, nama: '' });
      await fetchRequest();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingVerif(false);
    }
  }

  async function handleUploadLhp(sampleId: number, file: File) {
    setUploadingLhp(sampleId);
    try {
      const form = new FormData();
      form.append('lhp', file);
      await api.post(`/admin/samples/${sampleId}/lhp`, form);
      toast.success('LHP berhasil diunggah');
      await fetchRequest();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploadingLhp(null);
    }
  }

  if (loading) return <div className="p-6 text-gray-400">Memuat...</div>;
  if (!request) return <div className="p-6 text-red-500">Permohonan tidak ditemukan</div>;

  return (
    <div className="p-6 max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft size={16} /></Button>
        <div>
          <h1 className="text-xl font-bold">{request.nomorPermohonan}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[request.status]}`}>
            {REQUEST_STATUS_LABEL[request.status]}
          </span>
        </div>
      </div>

      {/* Data Pemohon */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Data Pemohon</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div><span className="text-gray-500">Nama</span><p className="font-medium">{request.namaPemohon}</p></div>
          <div><span className="text-gray-500">No. HP</span><p className="font-medium">{request.noHp}</p></div>
          <div><span className="text-gray-500">Email</span><p className="font-medium">{request.emailPemohon}</p></div>
          <div><span className="text-gray-500">Tanggal</span>
            <p className="font-medium">{new Date(request.tanggalPermohonan).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
          </div>
          <div className="col-span-2"><span className="text-gray-500">Alamat</span><p className="font-medium">{request.alamat}</p></div>
        </CardContent>
      </Card>

      {/* Update Status */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Update Status</CardTitle></CardHeader>
        <CardContent className="flex gap-3">
          <Select value={newStatus} onValueChange={(v) => setNewStatus(v as RequestStatus)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Pilih status baru..." />
            </SelectTrigger>
            <SelectContent>
              {REQUEST_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{REQUEST_STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleUpdateStatus} disabled={!newStatus || updatingStatus}>
            {updatingStatus ? 'Menyimpan...' : 'Update'}
          </Button>
        </CardContent>
      </Card>

      {/* Verifikasi Sampel */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Verifikasi Sampel</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {request.samples.map((s, i) => (
            <div key={s.id} className="border rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{i + 1}. {s.namaSampel} <span className="text-gray-400 font-normal">— {s.kategori}</span></p>
                  <p className="text-xs text-gray-500 mt-0.5">Jenis Uji: {Array.isArray(s.jenisUji) ? s.jenisUji.join(', ') : s.jenisUji}</p>
                  {s.alasanTolak && <p className="text-xs text-red-500 mt-0.5">Alasan: {s.alasanTolak}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sampleColor[s.status]}`}>
                    {SAMPLE_STATUS_LABEL[s.status]}
                  </span>
                  {(s.status === 'MENUNGGU' || s.status === 'DITERIMA') && (
                    <Button size="sm" variant="outline" onClick={() => openVerif(s.id, s.namaSampel)}>
                      Verifikasi
                    </Button>
                  )}
                  {s.status === 'OK' && (
                    <label className="cursor-pointer">
                      <input type="file" accept=".pdf" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadLhp(s.id, f); }} />
                      <Button asChild size="sm" variant="outline" disabled={uploadingLhp === s.id}>
                        <span><Upload size={12} className="mr-1" />
                          {s.lhpFile ? 'Ganti LHP' : 'Upload LHP'}
                        </span>
                      </Button>
                    </label>
                  )}
                  {s.lhpFile && <span className="text-xs text-green-600">✓ LHP</span>}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Billing */}
      <Card>
        <CardHeader><CardTitle className="text-sm">E-Billing & Pembayaran</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {request.status === 'VERIFIKASI' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Kode Billing</Label>
                <Input placeholder="Kode dari sistem PNBP" value={billing.kodeBilling}
                  onChange={(e) => setBilling({ ...billing, kodeBilling: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Total Tagihan (Rp)</Label>
                <Input type="number" placeholder="0" value={billing.totalTagihan}
                  onChange={(e) => setBilling({ ...billing, totalTagihan: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Button onClick={handleSaveBilling} disabled={savingBilling} size="sm">
                  {savingBilling ? 'Menyimpan...' : 'Simpan Billing'}
                </Button>
              </div>
            </div>
          )}

          {request.totalTagihan && (
            <div className="text-sm space-y-1.5 pt-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Kode Billing</span>
                <span className="font-mono font-medium">{request.kodeBilling}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Tagihan</span>
                <span className="font-semibold">Rp {Number(request.totalTagihan).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Bukti Bayar</span>
                <span>{request.buktiBayar ? '✓ Sudah diunggah' : '— Belum ada'}</span>
              </div>
            </div>
          )}

          {request.status === 'MENUNGGU_PEMBAYARAN' && request.buktiBayar && (
            <Button onClick={handleKonfirmasiBayar} disabled={confirmingBayar} className="w-full">
              {confirmingBayar ? 'Memproses...' : 'Konfirmasi Pembayaran Lunas'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Dialog Verifikasi Sampel */}
      <Dialog open={verifDialog.open} onOpenChange={(o) => setVerifDialog((v) => ({ ...v, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verifikasi Sampel</DialogTitle>
            <p className="text-sm text-gray-500">{verifDialog.nama}</p>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={verifForm.status} onValueChange={(v) => setVerifForm({ ...verifForm, status: v as SampleStatus })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DITERIMA">Diterima</SelectItem>
                  <SelectItem value="OK">OK</SelectItem>
                  <SelectItem value="DITOLAK">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {verifForm.status === 'DITOLAK' && (
              <div className="space-y-2">
                <Label>Alasan Penolakan</Label>
                <Textarea value={verifForm.alasanTolak}
                  onChange={(e) => setVerifForm({ ...verifForm, alasanTolak: e.target.value })}
                  placeholder="Jelaskan alasan penolakan sampel..." rows={3} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifDialog({ open: false, sampleId: 0, nama: '' })}>Batal</Button>
            <Button onClick={handleVerifSampel} disabled={savingVerif}>
              {savingVerif ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
