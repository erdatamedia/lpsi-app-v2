'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Loader2, FileText, ChevronDown, ChevronUp } from 'lucide-react';

// ── Kategori sampel ────────────────────────────────────────────────────────
const KATEGORI_SAMPEL = [
  'Hijauan', 'Bahan Pakan', 'Pakan', 'Pakan asal hewan',
  'Feses', 'Semen', 'Darah', 'Jaringan hewan', 'Lain-Lain',
];

// ── Jenis pengujian + harga ────────────────────────────────────────────────
const JENIS_UJI: { label: string; harga: number }[] = [
  { label: 'Kadar Air 135°C', harga: 20000 },
  { label: 'Kadar Abu', harga: 25000 },
  { label: 'Protein Kasar', harga: 75000 },
  { label: 'Lemak Kasar', harga: 60000 },
  { label: 'Serat Kasar', harga: 50000 },
  { label: 'Calsium', harga: 75000 },
  { label: 'Fosfor', harga: 75000 },
  { label: 'TDN & BETN', harga: 30000 },
  { label: 'Gross Energi', harga: 40000 },
  { label: 'NDF', harga: 60000 },
  { label: 'ADF', harga: 60000 },
  { label: 'Identifikasi parasit (metode Pewarnaan)', harga: 5000 },
  { label: 'Identifikasi cacing (metode sedimentasi)', harga: 3000 },
  { label: 'Identifikasi cacing (metode apung)', harga: 3000 },
  { label: 'Ulas Darah', harga: 5000 },
  { label: 'Uji RBT (Rose Bengal Test)', harga: 5000 },
  { label: 'pH Semen', harga: 20000 },
  { label: 'Motilitas Semen', harga: 40000 },
  { label: 'Livabilitas Sel Sperma', harga: 40000 },
  { label: 'Abnormalitas Sel Sperma', harga: 40000 },
  { label: 'Isolasi DNA', harga: 275000 },
  { label: 'Isolasi DNA-PCR', harga: 500000 },
  { label: 'Isolasi DNA-RFLP', harga: 800000 },
  { label: 'Preparasi Sampel', harga: 15000 },
  { label: 'Kadar Air 60°C', harga: 15000 },
];

interface SampleForm {
  kategori: string;
  namaSampel: string;
  beratBasah: string;
  beratKering: string;
  kemasan: string;
  jenisUji: string[]; // array of labels
}

const emptySample = (): SampleForm => ({
  kategori: '',
  namaSampel: '',
  beratBasah: '',
  beratKering: '',
  kemasan: '',
  jenisUji: [],
});

function hitungHarga(jenisUji: string[]): number {
  return jenisUji.reduce((total, label) => {
    const found = JENIS_UJI.find(j => j.label === label);
    return total + (found?.harga ?? 0);
  }, 0);
}

function formatRp(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

// ── Komponen kartu sampel ──────────────────────────────────────────────────
function SampleCard({
  sample, index, total,
  onChange, onRemove,
}: {
  sample: SampleForm;
  index: number;
  total: number;
  onChange: (field: keyof SampleForm, value: string | string[]) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(true);
  const harga = hitungHarga(sample.jenisUji);

  function toggleUji(label: string) {
    const next = sample.jenisUji.includes(label)
      ? sample.jenisUji.filter(j => j !== label)
      : [...sample.jenisUji, label];
    onChange('jenisUji', next);
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header kartu */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Sampel {index + 1}</span>
          {sample.namaSampel && (
            <span className="text-xs text-slate-500 dark:text-slate-400">— {sample.namaSampel}</span>
          )}
          {harga > 0 && (
            <span className="text-xs font-semibold text-green-600 dark:text-green-400 ml-1">{formatRp(harga)}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {total > 1 && (
            <button type="button" onClick={onRemove} className="text-slate-400 hover:text-red-500 transition-colors p-1">
              <Trash2 size={14} />
            </button>
          )}
          <button type="button" onClick={() => setOpen(o => !o)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-1">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="p-4 space-y-4">
          {/* Kategori sampel */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Kategori Sampel <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {KATEGORI_SAMPEL.map(k => (
                <label key={k} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name={`kategori-${index}`}
                    value={k}
                    checked={sample.kategori === k}
                    onChange={() => onChange('kategori', k)}
                    className="accent-blue-600"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {k}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Field teks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nama Sampel <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="mis. Rumput Gajah"
                value={sample.namaSampel}
                onChange={e => onChange('namaSampel', e.target.value)}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Berat Basah (gram)</Label>
              <Input
                type="number"
                placeholder="0"
                value={sample.beratBasah}
                onChange={e => onChange('beratBasah', e.target.value)}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Berat Kering (gram)</Label>
              <Input
                type="number"
                placeholder="0"
                value={sample.beratKering}
                onChange={e => onChange('beratKering', e.target.value)}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Kemasan</Label>
              <Input
                placeholder="mis. Plastik zip-lock"
                value={sample.kemasan}
                onChange={e => onChange('kemasan', e.target.value)}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              />
            </div>
          </div>

          {/* Jenis pengujian */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Jenis Pengujian <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-72 overflow-y-auto pr-1">
              {JENIS_UJI.map(j => {
                const checked = sample.jenisUji.includes(j.label);
                return (
                  <label
                    key={j.label}
                    className={`flex items-start gap-2 cursor-pointer rounded-lg px-3 py-2 transition-colors border text-xs
                      ${checked
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleUji(j.label)}
                      className="accent-blue-600 mt-0.5 shrink-0"
                    />
                    <span className="flex-1 text-slate-700 dark:text-slate-300">{j.label}</span>
                    <span className={`shrink-0 font-medium ${checked ? 'text-blue-700 dark:text-blue-300' : 'text-slate-400'}`}>
                      {formatRp(j.harga)}
                    </span>
                  </label>
                );
              })}
            </div>
            {sample.jenisUji.length > 0 && (
              <div className="flex items-center justify-between pt-1 px-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">{sample.jenisUji.length} jenis uji dipilih</span>
                <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{formatRp(harga)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Halaman utama ──────────────────────────────────────────────────────────
export default function BuatPermohonanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    tanggalPermohonan: new Date().toISOString().split('T')[0],
    namaPemohon: '',
    alamat: '',
    noHp: '',
    emailPemohon: '',
  });
  const [samples, setSamples] = useState<SampleForm[]>([emptySample()]);
  const [suratFile, setSuratFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function updateForm(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function updateSample(index: number, field: keyof SampleForm, value: string | string[]) {
    setSamples(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }

  function addSample() {
    setSamples(prev => [...prev, emptySample()]);
  }

  function removeSample(index: number) {
    setSamples(prev => prev.filter((_, i) => i !== index));
  }

  const totalHarga = samples.reduce((t, s) => t + hitungHarga(s.jenisUji), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    for (const s of samples) {
      if (!s.kategori) { toast.error('Pilih kategori untuk setiap sampel'); return; }
      if (!s.namaSampel) { toast.error('Isi nama sampel untuk setiap sampel'); return; }
      if (s.jenisUji.length === 0) { toast.error('Pilih minimal satu jenis pengujian untuk setiap sampel'); return; }
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('tanggalPermohonan', form.tanggalPermohonan);
      formData.append('namaPemohon', form.namaPemohon);
      formData.append('alamat', form.alamat);
      formData.append('noHp', form.noHp);
      formData.append('emailPemohon', form.emailPemohon);

      const samplesPayload = samples.map(s => ({
        kategori: s.kategori,
        namaSampel: s.namaSampel,
        beratBasah: s.beratBasah ? parseFloat(s.beratBasah) : undefined,
        beratKering: s.beratKering ? parseFloat(s.beratKering) : undefined,
        kemasan: s.kemasan || undefined,
        jenisUji: s.jenisUji,
        hargaTotal: hitungHarga(s.jenisUji),
      }));
      formData.append('samples', JSON.stringify(samplesPayload));

      if (suratFile) formData.append('suratPengantar', suratFile);

      const { data } = await api.post('/requests', formData);
      toast.success('Permohonan berhasil dibuat');
      router.push(`/permohonan/${data.data.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-5 sm:p-7 max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Buat Permohonan</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Isi data permohonan pengujian laboratorium.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Data Pemohon */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Data Pemohon</p>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tanggal Permohonan Uji <span className="text-red-500">*</span>
              </Label>
              <Input type="date" value={form.tanggalPermohonan}
                onChange={e => updateForm('tanggalPermohonan', e.target.value)}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nama Pemohon <span className="text-red-500">*</span>
              </Label>
              <Input placeholder="Nama lengkap" value={form.namaPemohon}
                onChange={e => updateForm('namaPemohon', e.target.value)}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white" required />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Alamat Pemohon <span className="text-red-500">*</span>
              </Label>
              <Textarea placeholder="Alamat lengkap" value={form.alamat}
                onChange={e => updateForm('alamat', e.target.value)}
                rows={2} className="dark:bg-slate-900 dark:border-slate-600 dark:text-white" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No. HP <span className="text-red-500">*</span>
              </Label>
              <Input type="tel" placeholder="08xxxxxxxxxx" value={form.noHp}
                onChange={e => updateForm('noHp', e.target.value)}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input type="email" placeholder="email@contoh.com" value={form.emailPemohon}
                onChange={e => updateForm('emailPemohon', e.target.value)}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white" required />
            </div>
          </div>
        </div>

        {/* Data Sampel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">Sampel</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tambah sampel yang akan diuji</p>
            </div>
            <Button type="button" onClick={addSample} size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus size={14} className="mr-1.5" /> Tambah Sampel
            </Button>
          </div>

          {samples.map((sample, index) => (
            <SampleCard
              key={index}
              sample={sample}
              index={index}
              total={samples.length}
              onChange={(field, value) => updateSample(index, field, value)}
              onRemove={() => removeSample(index)}
            />
          ))}

          {/* Total keseluruhan */}
          {samples.length > 1 && totalHarga > 0 && (
            <div className="flex justify-between items-center px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total estimasi semua sampel</span>
              <span className="text-base font-bold text-blue-700 dark:text-blue-400">{formatRp(totalHarga)}</span>
            </div>
          )}
        </div>

        {/* Surat Pengantar */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Surat Pengantar Uji</p>
          </div>
          <div className="p-5">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Upload surat pengantar dalam format PDF (opsional).</p>
            <div
              onClick={() => fileRef.current?.click()}
              className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-5 cursor-pointer transition-colors
                ${suratFile
                  ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
            >
              <FileText size={20} className={suratFile ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} />
              <div className="min-w-0">
                {suratFile ? (
                  <>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300 truncate">{suratFile.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{(suratFile.size / 1024).toFixed(0)} KB · Klik untuk ganti</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Klik untuk upload PDF</p>
                    <p className="text-xs text-slate-400">Format: PDF, maks. 5MB</p>
                  </>
                )}
              </div>
            </div>
            <input
              type="file"
              accept=".pdf"
              ref={fileRef}
              className="hidden"
              onChange={e => setSuratFile(e.target.files?.[0] ?? null)}
            />
            {suratFile && (
              <button type="button" onClick={() => { setSuratFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                className="mt-2 text-xs text-red-500 hover:underline">
                Hapus file
              </button>
            )}
          </div>
        </div>

        {/* Tombol submit */}
        <div className="flex gap-3 justify-end pt-1">
          <Button type="button" variant="outline" onClick={() => router.back()}
            className="dark:border-slate-600 dark:text-slate-300">
            Batal
          </Button>
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-8">
            {loading ? <><Loader2 size={14} className="animate-spin mr-1.5" /> Menyimpan...</> : 'Kirim Permohonan'}
          </Button>
        </div>
      </form>
    </div>
  );
}
