'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, GripVertical, Save, Settings2, ClipboardList } from 'lucide-react';

interface SkmPertanyaan { id: number; label: string; urutan: number; isActive: boolean; }

export default function AdminKonfigurasiPage() {
  const [prefix, setPrefix] = useState('');
  const [prefixInput, setPrefixInput] = useState('');
  const [savingPrefix, setSavingPrefix] = useState(false);

  const [pertanyaan, setPertanyaan] = useState<SkmPertanyaan[]>([]);
  const [loadingSkm, setLoadingSkm] = useState(true);
  const [newLabel, setNewLabel] = useState('');
  const [addingSkm, setAddingSkm] = useState(false);

  useEffect(() => {
    api.get('/admin/dashboard/settings/nomorPrefix').then(({ data }) => {
      const val = data.data?.value ?? 'SIPUJA';
      setPrefix(val);
      setPrefixInput(val);
    }).catch(() => {});

    api.get('/admin/dashboard/skm-pertanyaan').then(({ data }) => {
      setPertanyaan(data.data ?? []);
    }).catch(() => {}).finally(() => setLoadingSkm(false));
  }, []);

  async function handleSavePrefix() {
    if (!prefixInput.trim()) return toast.error('Prefix tidak boleh kosong');
    setSavingPrefix(true);
    try {
      await api.patch('/admin/dashboard/settings/nomorPrefix', { value: prefixInput.trim() });
      setPrefix(prefixInput.trim());
      toast.success(`Prefix diperbarui → ${prefixInput.trim()}`);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSavingPrefix(false); }
  }

  async function handleAddPertanyaan() {
    if (!newLabel.trim()) return toast.error('Label pertanyaan tidak boleh kosong');
    setAddingSkm(true);
    try {
      const urutan = pertanyaan.length + 1;
      const { data } = await api.post('/admin/dashboard/skm-pertanyaan', { label: newLabel.trim(), urutan });
      setPertanyaan(prev => [...prev, data.data]);
      setNewLabel('');
      toast.success('Pertanyaan ditambahkan');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setAddingSkm(false); }
  }

  async function handleToggleActive(p: SkmPertanyaan) {
    try {
      await api.patch(`/admin/dashboard/skm-pertanyaan/${p.id}`, { isActive: !p.isActive });
      setPertanyaan(prev => prev.map(x => x.id === p.id ? { ...x, isActive: !x.isActive } : x));
    } catch (err) { toast.error(getErrorMessage(err)); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Hapus pertanyaan ini?')) return;
    try {
      await api.delete(`/admin/dashboard/skm-pertanyaan/${id}`);
      setPertanyaan(prev => prev.filter(x => x.id !== id));
      toast.success('Pertanyaan dihapus');
    } catch (err) { toast.error(getErrorMessage(err)); }
  }

  async function handleEditLabel(p: SkmPertanyaan, label: string) {
    if (!label.trim() || label === p.label) return;
    try {
      await api.patch(`/admin/dashboard/skm-pertanyaan/${p.id}`, { label: label.trim() });
      setPertanyaan(prev => prev.map(x => x.id === p.id ? { ...x, label: label.trim() } : x));
    } catch (err) { toast.error(getErrorMessage(err)); }
  }

  return (
    <div className="p-5 sm:p-7 space-y-8 max-w-3xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Konfigurasi Sistem</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Pengaturan format nomor permohonan dan daftar pertanyaan SKM.</p>
      </div>

      {/* Format Nomor Permohonan */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 space-y-4">
        <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
          <Settings2 size={16} className="text-blue-600" /> Format Nomor Permohonan
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Nomor permohonan dibuat otomatis dengan format: <code className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs font-mono">{prefix}-YYMM-NNN</code>
        </p>
        <div className="flex gap-3 items-end">
          <div className="space-y-1.5 flex-1">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Prefix</Label>
            <Input
              value={prefixInput}
              onChange={e => setPrefixInput(e.target.value.toUpperCase())}
              placeholder="SIPUJA"
              className="font-mono dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              maxLength={10}
            />
          </div>
          <Button onClick={handleSavePrefix} disabled={savingPrefix || prefixInput === prefix}
            className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
            {savingPrefix ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="mr-1.5" />}
            Simpan
          </Button>
        </div>
        <p className="text-xs text-slate-400">Contoh hasil: <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">{prefixInput || 'SIPUJA'}-{new Date().toLocaleDateString('id-ID', { year: '2-digit', month: '2-digit' }).replace('/', '')}-001</span></p>
      </div>

      {/* SKM Pertanyaan */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 space-y-4">
        <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
          <ClipboardList size={16} className="text-blue-600" /> Daftar Pertanyaan SKM
        </h2>

        {/* Tambah pertanyaan */}
        <div className="flex gap-2">
          <Input
            placeholder="Tambah pertanyaan baru..."
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddPertanyaan()}
            className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
          />
          <Button onClick={handleAddPertanyaan} disabled={addingSkm} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
            {addingSkm ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          </Button>
        </div>

        {loadingSkm ? (
          <div className="flex items-center justify-center py-8 text-slate-400">
            <Loader2 size={18} className="animate-spin mr-2" /> Memuat...
          </div>
        ) : pertanyaan.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Belum ada pertanyaan.</p>
        ) : (
          <div className="space-y-2">
            {pertanyaan.map((p, i) => (
              <div key={p.id} className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${p.isActive ? 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 opacity-60'}`}>
                <GripVertical size={14} className="text-slate-300 shrink-0" />
                <span className="text-xs text-slate-400 w-5 shrink-0">{i + 1}.</span>
                <input
                  className="flex-1 text-sm text-slate-800 dark:text-slate-200 bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-400 rounded px-1"
                  defaultValue={p.label}
                  onBlur={e => handleEditLabel(p, e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                />
                <button
                  onClick={() => handleToggleActive(p)}
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 transition-colors ${p.isActive ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600'}`}
                >
                  {p.isActive ? 'Aktif' : 'Nonaktif'}
                </button>
                <button onClick={() => handleDelete(p.id)} className="text-slate-300 hover:text-red-500 transition-colors shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
