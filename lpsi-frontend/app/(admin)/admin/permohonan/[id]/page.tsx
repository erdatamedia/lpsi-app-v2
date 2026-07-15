'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/error';
import { LabRequest, REQUEST_STATUS_LABEL, RequestStatus, SAMPLE_STATUS_LABEL, SampleStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  ArrowLeft, Upload, Download, Loader2, CheckCircle2, AlertCircle,
  Eye, X, Lock, FileText, ShieldCheck, CreditCard, FileCheck, History, Trash2,
} from 'lucide-react';

const statusColor: Record<RequestStatus, string> = {
  MENUNGGU_SAMPEL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  SAMPEL_DITERIMA: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  VERIFIKASI: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  MENUNGGU_BILLING: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  MENUNGGU_PEMBAYARAN: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  LUNAS: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  ON_PROGRESS: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  SELESAI: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
};

const sampleColor: Record<SampleStatus, string> = {
  MENUNGGU: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  DITERIMA: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  OK: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  DITOLAK: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const REQUEST_STATUSES: RequestStatus[] = [
  'MENUNGGU_SAMPEL', 'SAMPEL_DITERIMA', 'VERIFIKASI', 'MENUNGGU_BILLING', 'MENUNGGU_PEMBAYARAN', 'LUNAS', 'ON_PROGRESS', 'SELESAI',
];

type TabId = 'detail' | 'verifikasi' | 'billing' | 'lhp' | 'riwayat';

interface ActivityLog {
  id: number;
  action: string;
  keterangan: string;
  createdAt: string;
}

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  unlocked: (r: LabRequest) => boolean;
  autoOn: (r: LabRequest) => boolean;
}

const TABS: TabDef[] = [
  {
    id: 'detail',
    label: 'Detail',
    icon: <FileText size={15} />,
    unlocked: () => true,
    autoOn: (r) => ['MENUNGGU_SAMPEL'].includes(r.status),
  },
  {
    id: 'verifikasi',
    label: 'Verifikasi Sampel',
    icon: <ShieldCheck size={15} />,
    unlocked: (r) => ['SAMPEL_DITERIMA', 'VERIFIKASI', 'MENUNGGU_PEMBAYARAN', 'LUNAS', 'ON_PROGRESS', 'SELESAI'].includes(r.status),
    autoOn: (r) => ['SAMPEL_DITERIMA', 'VERIFIKASI'].includes(r.status),
  },
  {
    id: 'billing',
    label: 'Billing & Bayar',
    icon: <CreditCard size={15} />,
    unlocked: (r) => ['VERIFIKASI', 'MENUNGGU_BILLING', 'MENUNGGU_PEMBAYARAN', 'LUNAS', 'ON_PROGRESS', 'SELESAI'].includes(r.status),
    autoOn: (r) => ['MENUNGGU_BILLING', 'MENUNGGU_PEMBAYARAN', 'LUNAS'].includes(r.status),
  },
  {
    id: 'lhp',
    label: 'LHP',
    icon: <FileCheck size={15} />,
    unlocked: (r) => ['ON_PROGRESS', 'SELESAI'].includes(r.status),
    autoOn: (r) => ['ON_PROGRESS', 'SELESAI'].includes(r.status),
  },
  {
    id: 'riwayat',
    label: 'Riwayat',
    icon: <History size={15} />,
    unlocked: () => true,
    autoOn: () => false,
  },
];

export default function AdminDetailPermohonanPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [request, setRequest] = useState<LabRequest>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('detail');

  const [newStatus, setNewStatus] = useState<RequestStatus | ''>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [billingFile, setBillingFile] = useState<File | null>(null);
  const billingFileRef = useRef<HTMLInputElement>(null);
  const [savingBilling, setSavingBilling] = useState(false);

  const [confirmingBayar, setConfirmingBayar] = useState(false);

  const [verifDialog, setVerifDialog] = useState<{ open: boolean; sampleId: number; nama: string }>({ open: false, sampleId: 0, nama: '' });
  const [verifForm, setVerifForm] = useState<{ status: SampleStatus | ''; alasanTolak: string }>({ status: '', alasanTolak: '' });
  const [savingVerif, setSavingVerif] = useState(false);
  const [suratUrl, setSuratUrl] = useState<string | null>(null);
  const [loadingSurat, setLoadingSurat] = useState(false);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [uploadingLhp, setUploadingLhp] = useState<number | null>(null);
  const [buktiBayarUrl, setBuktiBayarUrl] = useState<string | null>(null);
  const [loadingBukti, setLoadingBukti] = useState(false);
  const [resiInput, setResiInput] = useState('');
  const [savingResi, setSavingResi] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function fetchRequest() {
    const { data } = await api.get(`/requests/${id}`);
    const req = data.data as LabRequest;
    setRequest(req);
    const autoTab = TABS.slice().reverse().find(t => t.autoOn(req));
    if (autoTab) setActiveTab(autoTab.id);
  }

  async function fetchLogs() {
    setLoadingLogs(true);
    try {
      const { data } = await api.get(`/requests/${id}/logs`);
      setLogs(data.data);
    } catch { /* silent */ }
    finally { setLoadingLogs(false); }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchRequest().finally(() => setLoading(false)); }, [id]);

  async function handleUpdateStatus() {
    if (!newStatus || !request) return;
    if (newStatus === 'SELESAI') {
      const tanpaLhp = request.samples.filter(s => s.status !== 'DITOLAK' && !s.lhpFile);
      if (tanpaLhp.length > 0) {
        toast.error(`Upload LHP terlebih dahulu untuk: ${tanpaLhp.map(s => s.namaSampel).join(', ')}`);
        return;
      }
    }
    setUpdatingStatus(true);
    try {
      await api.patch(`/admin/requests/${id}/status`, { status: newStatus });
      toast.success('Status berhasil diperbarui');
      await fetchRequest();
      setNewStatus('');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setUpdatingStatus(false); }
  }

  async function handleSaveBilling() {
    if (!billingFile) { toast.error('File PDF e-billing wajib diunggah'); return; }
    setSavingBilling(true);
    try {
      const form = new FormData();
      form.append('eBillingFile', billingFile);
      await api.post(`/admin/requests/${id}/billing`, form);
      toast.success('E-billing berhasil diunggah & notifikasi dikirim ke pemohon');
      setBillingFile(null);
      if (billingFileRef.current) billingFileRef.current.value = '';
      await fetchRequest();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSavingBilling(false); }
  }

  async function handleKonfirmasiBayar() {
    setConfirmingBayar(true);
    try {
      await api.patch(`/admin/requests/${id}/konfirmasi-bayar`);
      toast.success('Pembayaran berhasil dikonfirmasi');
      await fetchRequest();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setConfirmingBayar(false); }
  }

  function openVerif(sampleId: number, nama: string) {
    setVerifDialog({ open: true, sampleId, nama });
    setVerifForm({ status: '', alasanTolak: '' });
  }

  async function handleVerifSampel() {
    if (!verifForm.status) { toast.error('Pilih status verifikasi'); return; }
    if (verifForm.status === 'DITOLAK' && !verifForm.alasanTolak) { toast.error('Alasan penolakan wajib diisi'); return; }
    setSavingVerif(true);
    try {
      await api.patch(`/admin/samples/${verifDialog.sampleId}/verify`, {
        status: verifForm.status,
        alasanTolak: verifForm.alasanTolak || undefined,
      });
      toast.success('Verifikasi sampel berhasil');
      setVerifDialog({ open: false, sampleId: 0, nama: '' });
      await fetchRequest();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSavingVerif(false); }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/admin/requests/${id}`);
      toast.success('Permohonan berhasil dihapus');
      router.push('/admin/permohonan');
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(false);
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
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setUploadingLhp(null); }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400">
      <Loader2 size={20} className="animate-spin mr-2" /> Memuat...
    </div>
  );
  if (!request) return (
    <div className="p-6 text-red-500 dark:text-red-400 text-sm">Permohonan tidak ditemukan.</div>
  );

  const sampelUntukLhp = request.samples.filter(s => s.status !== 'DITOLAK');

  return (
    <div className="p-5 sm:p-7 max-w-3xl space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{request.nomorPermohonan}</h1>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusColor[request.status]}`}>
              {REQUEST_STATUS_LABEL[request.status]}
            </span>
          </div>
        </div>
        {/* Update Status — selalu tersedia */}
        <div className="flex items-center gap-2 shrink-0">
          <Select value={newStatus} onValueChange={(v) => setNewStatus(v as RequestStatus)}>
            <SelectTrigger className="w-44 h-8 text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-white">
              <SelectValue placeholder="Ubah status..." />
            </SelectTrigger>
            <SelectContent>
              {REQUEST_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">{REQUEST_STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleUpdateStatus} disabled={!newStatus || updatingStatus}
            className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs">
            {updatingStatus ? <Loader2 size={13} className="animate-spin" /> : 'Update'}
          </Button>
          {request.status === 'MENUNGGU_SAMPEL' && (
            <Button size="sm" variant="outline" onClick={() => setDeleteDialogOpen(true)}
              className="h-8 px-2.5 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">
              <Trash2 size={13} />
            </Button>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 dark:border-slate-700 overflow-x-auto">
          {TABS.map((tab, idx) => {
            const unlocked = tab.unlocked(request);
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                disabled={!unlocked}
                onClick={() => {
                  if (!unlocked) return;
                  setActiveTab(tab.id);
                  if (tab.id === 'riwayat') fetchLogs();
                }}
                className={`
                  flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors
                  ${isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                    : unlocked
                      ? 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/40'
                      : 'border-transparent text-slate-300 dark:text-slate-600 cursor-not-allowed'
                  }
                `}
              >
                {unlocked ? tab.icon : <Lock size={13} />}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{idx + 1}</span>
              </button>
            );
          })}
        </div>

        <div className="p-5 space-y-5">

          {/* ── TAB 1: DETAIL ── */}
          {activeTab === 'detail' && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">Data Pemohon</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {[
                    { label: 'Nama', value: request.namaPemohon },
                    { label: 'No. HP', value: request.noHp },
                    { label: 'Email', value: request.emailPemohon },
                    { label: 'Tanggal', value: new Date(request.tanggalPermohonan).toLocaleDateString('id-ID', { dateStyle: 'long' }) },
                    { label: 'Alamat', value: request.alamat, full: true },
                  ].map(({ label, value, full }) => (
                    <div key={label} className={full ? 'sm:col-span-2' : ''}>
                      <p className="text-slate-400 dark:text-slate-500 text-xs mb-0.5">{label}</p>
                      <p className="font-medium text-slate-900 dark:text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-700" />
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">Data Sampel</p>
                <div className="space-y-2">
                  {request.samples.map((s, i) => (
                    <div key={s.id} className="border border-slate-100 dark:border-slate-700 rounded-lg p-3.5">
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-900 dark:text-white">
                            {i + 1}. {s.namaSampel}
                            <span className="text-slate-400 font-normal"> — {s.kategori}</span>
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Jenis Uji: {Array.isArray(s.jenisUji) ? s.jenisUji.join(', ') : s.jenisUji}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Harga: Rp {Number(s.hargaTotal).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${sampleColor[s.status]}`}>
                            {SAMPLE_STATUS_LABEL[s.status]}
                          </span>
                          {s.lhpFile && (
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                              <CheckCircle2 size={12} /> LHP
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: VERIFIKASI SAMPEL ── */}
          {activeTab === 'verifikasi' && (
            <div className="space-y-3">
              {/* Surat Pengantar */}
              {request.suratPengantar ? (
                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Surat Pengantar Uji</p>
                    <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">Tersedia — gunakan sebagai bahan verifikasi</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loadingSurat}
                    onClick={async () => {
                      setLoadingSurat(true);
                      try {
                        const res = await api.get(`/admin/requests/${id}/surat-pengantar`, { responseType: 'blob' });
                        setSuratUrl(URL.createObjectURL(res.data));
                      } catch { toast.error('Gagal memuat surat pengantar'); }
                      finally { setLoadingSurat(false); }
                    }}
                    className="h-8 px-3 text-xs border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                  >
                    {loadingSurat ? <Loader2 size={13} className="animate-spin mr-1.5" /> : <Eye size={13} className="mr-1.5" />}
                    Lihat Surat
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-400 dark:text-slate-500">
                  <AlertCircle size={13} />
                  Pemohon tidak melampirkan surat pengantar
                </div>
              )}

              {request.samples.map((s, i) => (
                <div key={s.id} className="border border-slate-100 dark:border-slate-700 rounded-lg p-3.5">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">
                        {i + 1}. {s.namaSampel}
                        <span className="text-slate-400 font-normal"> — {s.kategori}</span>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Jenis Uji: {Array.isArray(s.jenisUji) ? s.jenisUji.join(', ') : s.jenisUji}
                      </p>
                      {s.alasanTolak && (
                        <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">Alasan: {s.alasanTolak}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${sampleColor[s.status]}`}>
                        {SAMPLE_STATUS_LABEL[s.status]}
                      </span>
                      {(s.status === 'MENUNGGU' || s.status === 'DITERIMA') && request.status === 'SAMPEL_DITERIMA' && (
                        <Button size="sm" variant="outline" onClick={() => openVerif(s.id, s.namaSampel)}
                          className="h-7 px-2.5 text-xs dark:border-slate-600 dark:text-slate-300">
                          Verifikasi
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {request.status === 'VERIFIKASI' && (
                <div className="flex items-center gap-2 mt-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 size={15} />
                  <span className="text-sm font-semibold">Semua sampel telah diverifikasi (OK)</span>
                </div>
              )}
            </div>
          )}

          {/* ── TAB 3: BILLING & PEMBAYARAN ── */}
          {activeTab === 'billing' && (
            <div className="space-y-4">
              {/* Upload e-billing — saat VERIFIKASI atau MENUNGGU_BILLING */}
              {['VERIFIKASI', 'MENUNGGU_BILLING'].includes(request.status) && (
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Upload E-Billing</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Upload file PDF e-billing dari sistem PNBP. Pemohon akan mendapat notifikasi dan dapat mengunduh file ini.</p>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-700 dark:text-slate-300">File PDF E-Billing <span className="text-red-500">*</span></Label>
                    <input type="file" accept=".pdf" ref={billingFileRef}
                      onChange={e => setBillingFile(e.target.files?.[0] ?? null)}
                      className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-300" />
                    {billingFile && <p className="text-xs text-blue-600 dark:text-blue-400">{billingFile.name}</p>}
                  </div>
                  <Button onClick={handleSaveBilling} disabled={savingBilling} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    {savingBilling ? <Loader2 size={13} className="animate-spin mr-1.5" /> : <Upload size={13} className="mr-1.5" />}
                    {savingBilling ? 'Mengunggah...' : 'Upload & Kirim ke Pemohon'}
                  </Button>
                </div>
              )}

              {/* Info e-billing & bukti bayar */}
              {(request as LabRequest & { eBillingFile?: string }).eBillingFile && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline"
                      onClick={async () => {
                        try {
                          const res = await api.get(`/admin/requests/${id}/ebilling`, { responseType: 'blob' });
                          const url = URL.createObjectURL(res.data);
                          window.open(url, '_blank');
                        } catch { toast.error('Gagal memuat e-billing'); }
                      }}
                      className="dark:border-slate-600 dark:text-slate-300">
                      <Eye size={13} className="mr-1.5" /> Lihat E-Billing
                    </Button>
                    <Button size="sm" variant="outline"
                      onClick={async () => {
                        try {
                          const res = await api.get(`/admin/requests/${id}/ebilling`, { responseType: 'blob' });
                          const a = document.createElement('a');
                          a.href = URL.createObjectURL(res.data);
                          a.download = `ebilling-${request.nomorPermohonan}.pdf`;
                          a.click();
                        } catch { toast.error('Gagal mengunduh e-billing'); }
                      }}
                      className="dark:border-slate-600 dark:text-slate-300">
                      <Download size={13} className="mr-1.5" /> Unduh E-Billing
                    </Button>
                    {request.buktiBayar ? (
                      <Button size="sm" variant="outline" disabled={loadingBukti}
                        onClick={async () => {
                          setLoadingBukti(true);
                          try {
                            const res = await api.get(`/admin/requests/${id}/bukti-bayar`, { responseType: 'blob' });
                            setBuktiBayarUrl(URL.createObjectURL(res.data));
                          } catch { toast.error('Gagal memuat bukti bayar'); }
                          finally { setLoadingBukti(false); }
                        }}
                        className="border-green-300 text-green-700 dark:border-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20">
                        {loadingBukti ? <Loader2 size={13} className="animate-spin mr-1.5" /> : <Eye size={13} className="mr-1.5" />}
                        Lihat Bukti Bayar
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5 px-2">
                        <AlertCircle size={12} /> Bukti bayar belum diunggah pemohon
                      </span>
                    )}
                  </div>

                  {request.status === 'MENUNGGU_PEMBAYARAN' && request.buktiBayar && (
                    <Button onClick={handleKonfirmasiBayar} disabled={confirmingBayar} className="w-full bg-green-600 hover:bg-green-700 text-white">
                      {confirmingBayar ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <CheckCircle2 size={14} className="mr-1.5" />}
                      {confirmingBayar ? 'Memproses...' : 'Konfirmasi Pembayaran Lunas'}
                    </Button>
                  )}
                  {['LUNAS', 'ON_PROGRESS', 'SELESAI'].includes(request.status) && (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 size={15} />
                      <span className="text-sm font-semibold">Pembayaran Lunas</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 4: LHP ── */}
          {activeTab === 'lhp' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload file LHP (PDF) untuk setiap sampel. Setelah semua LHP diunggah, ubah status ke <strong>Selesai</strong>.
              </p>

              {sampelUntukLhp.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500">Tidak ada sampel yang dapat diproses.</p>
              ) : (
                sampelUntukLhp.map(s => (
                  <div key={s.id} className="flex items-center justify-between gap-3 border border-slate-100 dark:border-slate-700 rounded-lg px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{s.namaSampel}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{s.kategori}</p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      {s.lhpFile ? (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                          <CheckCircle2 size={14} /> Terunggah
                        </span>
                      ) : (
                        <span className="text-xs text-orange-500 dark:text-orange-400 font-medium">Belum ada LHP</span>
                      )}
                      <label className="cursor-pointer">
                        <input type="file" accept=".pdf" className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadLhp(s.id, f); }} />
                        <Button asChild size="sm" variant="outline" disabled={uploadingLhp === s.id}
                          className="h-8 px-3 text-xs dark:border-slate-600 dark:text-slate-300">
                          <span>
                            {uploadingLhp === s.id
                              ? <Loader2 size={11} className="animate-spin mr-1.5" />
                              : <Upload size={11} className="mr-1.5" />}
                            {s.lhpFile ? 'Ganti LHP' : 'Upload LHP'}
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>
                ))
              )}

              {sampelUntukLhp.length > 0 && sampelUntukLhp.every(s => s.lhpFile) ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 pt-1">
                  <CheckCircle2 size={15} />
                  <span className="text-sm font-semibold">Semua LHP sudah diunggah — siap ubah status ke Selesai.</span>
                </div>
              ) : (
                <p className="text-xs text-orange-500 dark:text-orange-400 flex items-center gap-1.5 pt-1">
                  <AlertCircle size={13} />
                  Upload semua LHP sebelum mengubah status ke Selesai.
                </p>
              )}

              {/* Pengiriman Fisik */}
              {request.status === 'SELESAI' && (
                <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-2 space-y-3">
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    Pengiriman LHP Fisik
                  </p>

                  {/* Status permintaan dari pemohon */}
                  {request.kirimLhpFisik === true ? (
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm">
                      <CheckCircle2 size={14} className="shrink-0" />
                      <span>Pemohon <strong>meminta</strong> LHP dikirim secara fisik (COD)</span>
                    </div>
                  ) : request.kirimLhpFisik === false ? (
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                      <CheckCircle2 size={14} className="shrink-0" />
                      <span>Pemohon <strong>tidak meminta</strong> pengiriman fisik — LHP digital saja</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-orange-500 dark:text-orange-400 text-sm">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>Pemohon belum memilih preferensi pengiriman LHP fisik</span>
                    </div>
                  )}

                  {/* Form resi — hanya jika pemohon minta kirim */}
                  {request.kirimLhpFisik === true && (
                    request.resiLhp ? (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl px-4 py-3 space-y-1">
                        <p className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase tracking-wide">LHP Sudah Dikirim</p>
                        <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">{request.resiLhp}</p>
                        <button
                          className="text-xs text-blue-500 dark:text-blue-400 hover:underline mt-1"
                          onClick={() => setResiInput(request.resiLhp ?? '')}
                        >
                          Ubah resi
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-700 dark:text-slate-300">
                          Nomor Resi Pengiriman <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Masukkan nomor resi..."
                            value={resiInput}
                            onChange={(e) => setResiInput(e.target.value)}
                            className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                          />
                          <Button
                            size="sm"
                            disabled={!resiInput.trim() || savingResi}
                            onClick={async () => {
                              setSavingResi(true);
                              try {
                                await api.patch(`/admin/requests/${id}/resi-lhp`, { resiLhp: resiInput.trim() });
                                toast.success('Nomor resi berhasil disimpan & notifikasi dikirim');
                                setResiInput('');
                                await fetchRequest();
                              } catch (err) { toast.error(getErrorMessage(err)); }
                              finally { setSavingResi(false); }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                          >
                            {savingResi ? <Loader2 size={13} className="animate-spin" /> : 'Simpan'}
                          </Button>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Nomor resi akan dikirimkan ke pemohon sebagai bukti pengiriman.
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 5: RIWAYAT ── */}
          {activeTab === 'riwayat' && (
            <div>
              {loadingLogs ? (
                <div className="flex items-center justify-center py-10 text-slate-400">
                  <Loader2 size={16} className="animate-spin mr-2" /> Memuat riwayat...
                </div>
              ) : logs.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">Belum ada riwayat aktivitas.</p>
              ) : (
                <ol className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-0">
                  {logs.map((log, i) => (
                    <li key={log.id} className="mb-6 ml-5">
                      <span className={`absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-800 ${
                        i === logs.length - 1 ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                      }`} />
                      <div className="flex flex-col gap-0.5">
                        <time className="text-xs text-slate-400 dark:text-slate-500">
                          {new Date(log.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'long', year: 'numeric',
                          })}{' '}
                          {new Date(log.createdAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit', minute: '2-digit',
                          })} WIB
                        </time>
                        <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-snug">
                          {log.keterangan}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Dialog Verifikasi Sampel */}
      <Dialog open={verifDialog.open} onOpenChange={(o) => setVerifDialog((v) => ({ ...v, open: o }))}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Verifikasi Sampel</DialogTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400">{verifDialog.nama}</p>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Status</Label>
              <Select value={verifForm.status} onValueChange={(v) => setVerifForm({ ...verifForm, status: v as SampleStatus })}>
                <SelectTrigger className="dark:bg-slate-900 dark:border-slate-600 dark:text-white">
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
                <Label className="text-slate-700 dark:text-slate-300">Alasan Penolakan</Label>
                <Textarea value={verifForm.alasanTolak}
                  onChange={(e) => setVerifForm({ ...verifForm, alasanTolak: e.target.value })}
                  placeholder="Jelaskan alasan penolakan sampel..." rows={3}
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifDialog({ open: false, sampleId: 0, nama: '' })}
              className="dark:border-slate-600 dark:text-slate-300">Batal</Button>
            <Button onClick={handleVerifSampel} disabled={savingVerif} className="bg-blue-600 hover:bg-blue-700 text-white">
              {savingVerif ? <Loader2 size={13} className="animate-spin mr-1.5" /> : null}
              {savingVerif ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Hapus Permohonan */}
      <Dialog open={deleteDialogOpen} onOpenChange={(o) => !deleting && setDeleteDialogOpen(o)}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Hapus Permohonan?</DialogTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Permohonan <strong>{request.nomorPermohonan}</strong> beserta seluruh data sampelnya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </p>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}
              className="dark:border-slate-600 dark:text-slate-300">Batal</Button>
            <Button onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
              {deleting ? <Loader2 size={13} className="animate-spin mr-1.5" /> : null}
              {deleting ? 'Menghapus...' : 'Hapus Permohonan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Bukti Bayar */}
      {buktiBayarUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => { URL.revokeObjectURL(buktiBayarUrl); setBuktiBayarUrl(null); }}
        >
          <div
            className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col"
            style={{ height: '85vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-700 shrink-0">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Bukti Bayar</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{request.nomorPermohonan}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline"
                  onClick={() => { const a = document.createElement('a'); a.href = buktiBayarUrl; a.download = `buktibayar-${request.nomorPermohonan}`; a.click(); }}
                  className="h-8 px-3 text-xs dark:border-slate-600 dark:text-slate-300">
                  <Download size={12} className="mr-1.5" /> Unduh
                </Button>
                <button onClick={() => { URL.revokeObjectURL(buktiBayarUrl); setBuktiBayarUrl(null); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-b-2xl p-4">
              <img
                src={buktiBayarUrl}
                alt="Bukti Bayar"
                className="max-w-full max-h-full object-contain rounded-lg"
                onError={(e) => {
                  const parent = (e.target as HTMLElement).parentElement!;
                  parent.innerHTML = `<iframe src="${buktiBayarUrl}" class="w-full h-full rounded-b-2xl" title="Bukti Bayar"></iframe>`;
                }}
              />
            </div>
          </div>
        </div>
      )}
      {/* Modal Surat Pengantar */}
      {suratUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => { URL.revokeObjectURL(suratUrl); setSuratUrl(null); }}
        >
          <div
            className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col"
            style={{ height: '85vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-700 shrink-0">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Surat Pengantar Uji</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{request.nomorPermohonan}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline"
                  onClick={() => { const a = document.createElement('a'); a.href = suratUrl; a.download = `surat-pengantar-${request.nomorPermohonan}.pdf`; a.click(); }}
                  className="h-8 px-3 text-xs dark:border-slate-600 dark:text-slate-300">
                  <Download size={12} className="mr-1.5" /> Unduh
                </Button>
                <button onClick={() => { URL.revokeObjectURL(suratUrl); setSuratUrl(null); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>
            <iframe src={suratUrl} className="flex-1 w-full rounded-b-2xl" title="Surat Pengantar" />
          </div>
        </div>
      )}
    </div>
  );
}
