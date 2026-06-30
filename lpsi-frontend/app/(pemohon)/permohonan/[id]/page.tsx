'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/error';
import { LabRequest, REQUEST_STATUS_LABEL, RequestStatus, SAMPLE_STATUS_LABEL, SampleStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Download, Upload, Loader2, CheckCircle2, AlertCircle,
  RefreshCw, Eye, X, Lock, FileText, PackageCheck, CreditCard, FlaskConical, History,
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

type TabId = 'detail' | 'sampel' | 'pembayaran' | 'lhp' | 'riwayat';

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
    id: 'sampel',
    label: 'Pengiriman & Verifikasi',
    icon: <PackageCheck size={15} />,
    unlocked: () => true,
    autoOn: (r) => ['SAMPEL_DITERIMA', 'VERIFIKASI', 'MENUNGGU_BILLING'].includes(r.status),
  },
  {
    id: 'pembayaran',
    label: 'Pembayaran',
    icon: <CreditCard size={15} />,
    unlocked: (r) => ['MENUNGGU_BILLING', 'MENUNGGU_PEMBAYARAN', 'LUNAS', 'ON_PROGRESS', 'SELESAI'].includes(r.status),
    autoOn: (r) => ['MENUNGGU_PEMBAYARAN', 'LUNAS'].includes(r.status),
  },
  {
    id: 'lhp',
    label: 'Analisa & LHP',
    icon: <FlaskConical size={15} />,
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

export default function DetailPermohonanPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [request, setRequest] = useState<LabRequest & { ikm?: object }>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('detail');
  const [uploading, setUploading] = useState(false);
  const [ikmJawaban, setIkmJawaban] = useState<Record<string, string>>({});
  const [ikmSaran, setIkmSaran] = useState('');
  const [submittingIkm, setSubmittingIkm] = useState(false);
  const [eBillingUrl, setEBillingUrl] = useState<string | null>(null);
  const [loadingEbilling, setLoadingEbilling] = useState(false);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  async function fetchRequest() {
    const { data } = await api.get(`/requests/${id}`);
    const req = data.data as LabRequest;
    setRequest(req);
    // Auto-navigate ke tab yang sesuai dengan status saat pertama load
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
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setUploading(false); }
  }

  async function handleSubmitIkm(e: React.FormEvent) {
    e.preventDefault();
    if (IKM_PERTANYAAN.some((p) => !ikmJawaban[p.key])) { toast.error('Semua pertanyaan harus dijawab'); return; }
    setSubmittingIkm(true);
    try {
      await api.post(`/requests/${id}/ikm`, { ...ikmJawaban, saran: ikmSaran });
      toast.success('SKM berhasil disimpan');
      await fetchRequest();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSubmittingIkm(false); }
  }

  async function handleDownloadLhp(sampleId: number) {
    try {
      const res = await api.get(`/requests/${id}/lhp/${sampleId}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = `LHP-${sampleId}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { toast.error(getErrorMessage(err)); }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400">
      <Loader2 size={20} className="animate-spin mr-2" /> Memuat...
    </div>
  );
  if (!request) return (
    <div className="p-6 text-red-500 dark:text-red-400 text-sm">Permohonan tidak ditemukan.</div>
  );

  const hasIkm = !!request.ikm;
  const isSelesai = request.status === 'SELESAI';
  const totalSampel = request.samples.reduce((t, s) => t + Number(s.hargaTotal), 0);
  const adaSampelDitolak = request.samples.some(s => s.alasanTolak);
  const verifikasiOK = ['VERIFIKASI', 'MENUNGGU_BILLING', 'MENUNGGU_PEMBAYARAN', 'LUNAS', 'ON_PROGRESS', 'SELESAI'].includes(request.status);

  return (
    <div className="p-5 sm:p-7 max-w-3xl space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{request.nomorPermohonan}</h1>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusColor[request.status]}`}>
            {REQUEST_STATUS_LABEL[request.status]}
          </span>
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

        {/* Tab Content */}
        <div className="p-5 space-y-5">

          {/* ── TAB 1: DETAIL ── */}
          {activeTab === 'detail' && (
            <div className="space-y-5">
              {/* Data Pemohon */}
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

              {/* Data Sampel */}
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">Data Sampel</p>
                <div className="space-y-2">
                  {request.samples.map((s, i) => (
                    <div key={s.id} className="border border-slate-100 dark:border-slate-700 rounded-lg p-3.5 space-y-1.5">
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-900 dark:text-white">
                            {i + 1}. {s.namaSampel}
                            <span className="text-slate-400 dark:text-slate-500 font-normal"> — {s.kategori}</span>
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Jenis Uji: {Array.isArray(s.jenisUji) ? s.jenisUji.join(', ') : s.jenisUji}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Harga: Rp {Number(s.hargaTotal).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0 ${sampleColor[s.status]}`}>
                          {SAMPLE_STATUS_LABEL[s.status]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-between items-center px-1">
                  <span className="text-xs text-slate-400 dark:text-slate-500">{request.samples.length} sampel</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Total: Rp {totalSampel.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: PENGIRIMAN & VERIFIKASI ── */}
          {activeTab === 'sampel' && (
            <div className="space-y-5">
              {/* Status penerimaan */}
              <div className={`flex items-center gap-2 rounded-xl px-4 py-3 ${
                request.status !== 'MENUNGGU_SAMPEL'
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
              }`}>
                {request.status !== 'MENUNGGU_SAMPEL' ? (
                  <>
                    <CheckCircle2 size={15} className="text-green-600 dark:text-green-400 shrink-0" />
                    <span className="text-sm font-semibold text-green-700 dark:text-green-400">Sampel Diterima di Laboratorium</span>
                  </>
                ) : (
                  <>
                    <Loader2 size={15} className="animate-spin text-yellow-600 dark:text-yellow-400 shrink-0" />
                    <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">Menunggu Sampel Dikirim</span>
                  </>
                )}
              </div>

              {/* Instruksi pengiriman */}
              {request.status === 'MENUNGGU_SAMPEL' && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Silakan kirimkan sampel ke alamat berikut:
                  </p>
                  <div className="border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 space-y-1">
                    <p className="font-bold text-sm text-slate-900 dark:text-white">Unit Layanan Laboratorium BRMP Ruminansia Besar</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Jalan Pahlawan No.02 Bebekan Lor, Ranuklindungan Grati,<br />
                      Kabupaten Pasuruan, Jawa Timur — 67184
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sertakan nomor permohonan{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{request.nomorPermohonan}</span>{' '}
                    pada paket pengiriman.
                  </p>
                </div>
              )}

              {/* Hasil Verifikasi */}
              {(verifikasiOK || (adaSampelDitolak && request.status === 'MENUNGGU_SAMPEL')) && (
                <div className={`rounded-xl border p-4 space-y-3 ${
                  verifikasiOK
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {verifikasiOK
                      ? <CheckCircle2 size={16} className="text-green-600 dark:text-green-400 shrink-0" />
                      : <AlertCircle size={16} className="text-red-600 dark:text-red-400 shrink-0" />
                    }
                    <p className={`font-bold text-sm ${verifikasiOK ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                      {verifikasiOK ? 'Verifikasi Sampel: OK' : 'Verifikasi Sampel: Tidak Lolos'}
                    </p>
                  </div>
                  {verifikasiOK && (
                    <p className="text-sm text-green-700 dark:text-green-300 pl-6">
                      Semua sampel telah diverifikasi. Silakan lakukan pembayaran sesuai kode billing.
                    </p>
                  )}
                  {!verifikasiOK && adaSampelDitolak && (
                    <>
                      <p className="text-sm text-red-700 dark:text-red-300 pl-6">
                        Terdapat sampel yang tidak lolos verifikasi. Silakan kirim ulang sampel.
                      </p>
                      <div className="pl-6 space-y-1.5">
                        {request.samples.filter(s => s.alasanTolak).map(s => (
                          <div key={s.id} className="text-xs bg-red-100 dark:bg-red-900/30 rounded-lg px-3 py-2 text-red-700 dark:text-red-300">
                            <span className="font-semibold">{s.namaSampel}</span>: {s.alasanTolak}
                          </div>
                        ))}
                      </div>
                      <div className="pl-6 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                        <RefreshCw size={13} />
                        Status kembali ke <span className="font-bold">Sampel Belum Diterima</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 3: PEMBAYARAN ── */}
          {activeTab === 'pembayaran' && (
            <div className="space-y-4">
              {/* Status e-billing */}
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 space-y-3">
                {(request as LabRequest & { eBillingFile?: string }).eBillingFile ? (
                  <>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">E-Billing</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      File e-billing telah diterbitkan oleh admin. Silakan unduh dan lakukan pembayaran PNBP sesuai tagihan yang tertera.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loadingEbilling}
                        onClick={async () => {
                          setLoadingEbilling(true);
                          try {
                            const res = await api.get(`/requests/${id}/ebilling`, { responseType: 'blob' });
                            setEBillingUrl(URL.createObjectURL(res.data));
                          } catch { toast.error('Gagal memuat e-billing'); }
                          finally { setLoadingEbilling(false); }
                        }}
                        className="dark:border-slate-600 dark:text-slate-300"
                      >
                        {loadingEbilling ? <Loader2 size={13} className="animate-spin mr-1.5" /> : <Eye size={13} className="mr-1.5" />}
                        Lihat E-Billing
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const res = await api.get(`/requests/${id}/ebilling`, { responseType: 'blob' });
                            const a = document.createElement('a');
                            a.href = URL.createObjectURL(res.data);
                            a.download = `ebilling-${request.nomorPermohonan}.pdf`;
                            a.click();
                          } catch { toast.error('Gagal mengunduh e-billing'); }
                        }}
                        className="dark:border-slate-600 dark:text-slate-300"
                      >
                        <Download size={13} className="mr-1.5" /> Unduh E-Billing
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Menunggu penerbitan e-billing dari admin...
                  </p>
                )}
              </div>

              {/* Upload bukti bayar */}
              {(request as LabRequest & { eBillingFile?: string }).eBillingFile && (
                <div className="flex flex-wrap gap-2">
                  {!request.buktiBayar && request.status === 'MENUNGGU_PEMBAYARAN' && (
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleUploadBukti} disabled={uploading} />
                      <Button asChild size="sm" disabled={uploading} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <span>
                          {uploading ? <Loader2 size={13} className="animate-spin mr-1.5" /> : <Upload size={13} className="mr-1.5" />}
                          {uploading ? 'Mengunggah...' : 'Upload Bukti Bayar'}
                        </span>
                      </Button>
                    </label>
                  )}
                </div>
              )}

              {/* Status pembayaran */}
              <div className={`flex items-center gap-2 rounded-xl px-4 py-3 ${
                ['LUNAS', 'ON_PROGRESS', 'SELESAI'].includes(request.status)
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
              }`}>
                {['LUNAS', 'ON_PROGRESS', 'SELESAI'].includes(request.status) ? (
                  <>
                    <CheckCircle2 size={15} className="text-green-600 dark:text-green-400 shrink-0" />
                    <span className="text-sm font-semibold text-green-700 dark:text-green-400">Lunas</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={15} className="text-orange-600 dark:text-orange-400 shrink-0" />
                    <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                      {request.buktiBayar ? 'Menunggu Verifikasi Pembayaran' : 'Belum Ada Bukti Bayar'}
                    </span>
                  </>
                )}
              </div>

              {request.buktiBayar && request.status === 'MENUNGGU_PEMBAYARAN' && (
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-green-500" />
                  Bukti bayar sudah diunggah, menunggu konfirmasi admin.
                </p>
              )}
            </div>
          )}

          {/* ── TAB 4: ANALISA & LHP ── */}
          {activeTab === 'lhp' && (
            <div className="space-y-6">
              {/* Status Analisa */}
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">Status Analisa</p>
                {isSelesai ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span className="text-sm font-semibold">Selesai Pengujian</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                    <Loader2 size={16} className="animate-spin shrink-0" />
                    <span className="text-sm font-medium">Dalam proses pengujian di laboratorium...</span>
                  </div>
                )}
              </div>

              {/* LHP */}
              {isSelesai && (
                <>
                  <div className="border-t border-slate-100 dark:border-slate-700" />
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">LHP (Laporan Hasil Pengujian)</p>

                    {/* Status LHP */}
                    {request.samples.some(s => s.lhpFile) ? (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle2 size={16} className="shrink-0" />
                        <span className="text-sm font-semibold">LHP Terbit</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Loader2 size={16} className="animate-spin shrink-0" />
                        <span className="text-sm">Menunggu Penerbitan LHP...</span>
                      </div>
                    )}

                    {/* SKM & Download */}
                    {request.samples.some(s => s.lhpFile) && (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          Untuk dapat mendownload LHP, silakan melakukan pengisian SKM terlebih dahulu.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {!hasIkm ? (
                            <>
                              <Button size="sm" variant="outline"
                                onClick={() => document.getElementById('skm-form')?.scrollIntoView({ behavior: 'smooth' })}
                                className="dark:border-slate-600 dark:text-slate-300">
                                Pengisian SKM
                              </Button>
                              <Button size="sm" disabled className="opacity-50 cursor-not-allowed bg-blue-600 text-white">
                                <Download size={13} className="mr-1.5" /> Download LHP
                              </Button>
                            </>
                          ) : (
                            request.samples.filter(s => s.lhpFile).map(s => (
                              <Button key={s.id} size="sm" onClick={() => handleDownloadLhp(s.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Download size={13} className="mr-1.5" />
                                Download LHP{request.samples.filter(s => s.lhpFile).length > 1 ? ` — ${s.namaSampel}` : ''}
                              </Button>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Kirim LHP Fisik */}
                    {request.samples.some(s => s.lhpFile) && (
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 space-y-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Apakah LHP Fisik perlu dikirim?
                            <span className="text-red-500 ml-1">*</span>
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            Biaya pengiriman LHP dibebankan pada pemohon dengan sistem pembayaran COD.
                          </p>
                        </div>
                        {request.kirimLhpFisik === null || request.kirimLhpFisik === undefined ? (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={async () => {
                              try { await api.patch(`/requests/${id}/kirim-lhp`, { kirim: true }); await fetchRequest(); toast.success('Preferensi disimpan'); }
                              catch (err) { toast.error(getErrorMessage(err)); }
                            }} className="bg-blue-600 hover:bg-blue-700 text-white px-6">Ya</Button>
                            <Button size="sm" variant="outline" onClick={async () => {
                              try { await api.patch(`/requests/${id}/kirim-lhp`, { kirim: false }); await fetchRequest(); toast.success('Preferensi disimpan'); }
                              catch (err) { toast.error(getErrorMessage(err)); }
                            }} className="px-6 dark:border-slate-600 dark:text-slate-300">Tidak</Button>
                          </div>
                        ) : (
                          <span className={`inline-flex text-sm font-semibold px-3 py-1 rounded-full ${
                            request.kirimLhpFisik
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {request.kirimLhpFisik ? 'Ya — LHP akan dikirim' : 'Tidak — LHP hanya digital'}
                          </span>
                        )}

                        {/* Status pengiriman & resi */}
                        {request.kirimLhpFisik === true && (
                          <div className="pt-1 border-t border-slate-100 dark:border-slate-700 mt-2">
                            {request.resiLhp ? (
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1.5">
                                  <CheckCircle2 size={13} /> LHP Sudah Dikirim
                                </p>
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg px-3 py-2">
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Nomor Resi</p>
                                  <p className="font-mono font-bold text-slate-900 dark:text-white text-sm">{request.resiLhp}</p>
                                </div>
                                <p className="text-xs text-slate-400 dark:text-slate-500">
                                  Gunakan nomor resi di atas untuk melacak status pengiriman.
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs text-orange-500 dark:text-orange-400 flex items-center gap-1.5">
                                <Loader2 size={12} className="animate-spin" />
                                Menunggu konfirmasi pengiriman dari laboratorium...
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Form SKM */}
                  {!hasIkm && (
                    <div id="skm-form" className="border-t border-slate-100 dark:border-slate-700 pt-5 space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Survei Kepuasan Masyarakat (SKM)</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Wajib diisi sebelum dapat mengunduh LHP.</p>
                      </div>
                      <form onSubmit={handleSubmitIkm} className="space-y-4">
                        {IKM_PERTANYAAN.map((p, i) => (
                          <div key={p.key} className="space-y-1.5">
                            <Label className="text-xs text-slate-700 dark:text-slate-300">{i + 1}. {p.label}</Label>
                            <Select value={ikmJawaban[p.key] ?? ''} onValueChange={(v) => setIkmJawaban((prev) => ({ ...prev, [p.key]: v as string }))}>
                              <SelectTrigger className="h-9 text-sm dark:bg-slate-900 dark:border-slate-600 dark:text-white">
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
                          <Label className="text-xs text-slate-700 dark:text-slate-300">Saran & Masukan (opsional)</Label>
                          <Textarea value={ikmSaran} onChange={(e) => setIkmSaran(e.target.value)}
                            placeholder="Tuliskan saran Anda..." rows={3}
                            className="dark:bg-slate-900 dark:border-slate-600 dark:text-white" />
                        </div>
                        <Button type="submit" disabled={submittingIkm} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                          {submittingIkm ? <><Loader2 size={14} className="animate-spin mr-1.5" />Menyimpan...</> : 'Kirim SKM'}
                        </Button>
                      </form>
                    </div>
                  )}

                  {hasIkm && !request.samples.some(s => s.lhpFile) && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
                      <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">SKM sudah diisi. LHP sedang diproses oleh admin.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── TAB 5: RIWAYAT ── */}
          {activeTab === 'riwayat' && (
            <div className="space-y-0">
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
                        i === logs.length - 1
                          ? 'bg-blue-600'
                          : 'bg-slate-300 dark:bg-slate-600'
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

      {/* Modal E-Billing */}
      {eBillingUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => { URL.revokeObjectURL(eBillingUrl); setEBillingUrl(null); }}
        >
          <div
            className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col"
            style={{ height: '85vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-700 shrink-0">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">E-Billing</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{request.nomorPermohonan}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline"
                  onClick={() => { const a = document.createElement('a'); a.href = eBillingUrl; a.download = `e-billing-${request.nomorPermohonan}.pdf`; a.click(); }}
                  className="h-8 px-3 text-xs dark:border-slate-600 dark:text-slate-300">
                  <Download size={12} className="mr-1.5" /> Unduh
                </Button>
                <button onClick={() => { URL.revokeObjectURL(eBillingUrl); setEBillingUrl(null); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>
            <iframe src={eBillingUrl} className="flex-1 w-full rounded-b-2xl" title="E-Billing" />
          </div>
        </div>
      )}
    </div>
  );
}
