'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, Check, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface LayananItem { id: number; nama: string; urutan: number; }
interface Layanan { id: number; kategori: string; urutan: number; items: LayananItem[]; }

export default function AdminLayananPage() {
  const [layanan, setLayanan] = useState<Layanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  // form tambah kategori
  const [newKategori, setNewKategori] = useState('');
  const [addingKategori, setAddingKategori] = useState(false);

  // edit kategori inline
  const [editKategoriId, setEditKategoriId] = useState<number | null>(null);
  const [editKategoriVal, setEditKategoriVal] = useState('');

  // form tambah item per kategori
  const [newItem, setNewItem] = useState<Record<number, string>>({});
  const [addingItem, setAddingItem] = useState<number | null>(null);

  // edit item inline
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [editItemVal, setEditItemVal] = useState('');

  async function fetchLayanan() {
    const { data } = await api.get('/layanan');
    setLayanan(data.data);
  }

  useEffect(() => { fetchLayanan().finally(() => setLoading(false)); }, []);

  async function handleAddKategori() {
    if (!newKategori.trim()) return;
    setAddingKategori(true);
    try {
      await api.post('/layanan', { kategori: newKategori.trim() });
      setNewKategori('');
      await fetchLayanan();
      toast.success('Kategori berhasil ditambahkan');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setAddingKategori(false); }
  }

  async function handleUpdateKategori(id: number) {
    if (!editKategoriVal.trim()) return;
    try {
      await api.patch(`/layanan/${id}`, { kategori: editKategoriVal.trim() });
      setEditKategoriId(null);
      await fetchLayanan();
      toast.success('Kategori diperbarui');
    } catch (err) { toast.error(getErrorMessage(err)); }
  }

  async function handleDeleteKategori(id: number, kategori: string) {
    if (!confirm(`Hapus kategori "${kategori}" beserta semua itemnya?`)) return;
    try {
      await api.delete(`/layanan/${id}`);
      await fetchLayanan();
      toast.success('Kategori dihapus');
    } catch (err) { toast.error(getErrorMessage(err)); }
  }

  async function handleAddItem(layananId: number) {
    const nama = (newItem[layananId] ?? '').trim();
    if (!nama) return;
    setAddingItem(layananId);
    try {
      await api.post(`/layanan/${layananId}/items`, { nama });
      setNewItem((p) => ({ ...p, [layananId]: '' }));
      await fetchLayanan();
      toast.success('Item ditambahkan');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setAddingItem(null); }
  }

  async function handleUpdateItem(itemId: number) {
    if (!editItemVal.trim()) return;
    try {
      await api.patch(`/layanan/items/${itemId}`, { nama: editItemVal.trim() });
      setEditItemId(null);
      await fetchLayanan();
      toast.success('Item diperbarui');
    } catch (err) { toast.error(getErrorMessage(err)); }
  }

  async function handleDeleteItem(itemId: number, nama: string) {
    if (!confirm(`Hapus item "${nama}"?`)) return;
    try {
      await api.delete(`/layanan/items/${itemId}`);
      await fetchLayanan();
      toast.success('Item dihapus');
    } catch (err) { toast.error(getErrorMessage(err)); }
  }

  return (
    <div className="p-5 sm:p-7 space-y-5 max-w-3xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Kelola Layanan</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Tambah, ubah, atau hapus kategori dan item layanan pengujian.</p>
      </div>

      {/* Form tambah kategori */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 flex gap-2">
        <Input
          placeholder="Nama kategori baru..."
          value={newKategori}
          onChange={(e) => setNewKategori(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddKategori()}
          className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
        />
        <Button onClick={handleAddKategori} disabled={addingKategori || !newKategori.trim()} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
          {addingKategori ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          <span className="ml-1.5 hidden sm:inline">Tambah Kategori</span>
        </Button>
      </div>

      {/* List kategori */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Memuat...
        </div>
      ) : layanan.length === 0 ? (
        <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">Belum ada kategori layanan.</div>
      ) : (
        <div className="space-y-3">
          {layanan.map((l) => (
            <div key={l.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              {/* Header kategori */}
              <div className="flex items-center gap-3 px-4 py-3">
                {editKategoriId === l.id ? (
                  <>
                    <Input
                      value={editKategoriVal}
                      onChange={(e) => setEditKategoriVal(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateKategori(l.id); if (e.key === 'Escape') setEditKategoriId(null); }}
                      className="flex-1 h-8 text-sm dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                      autoFocus
                    />
                    <button onClick={() => handleUpdateKategori(l.id)} className="text-green-600 hover:text-green-700"><Check size={16} /></button>
                    <button onClick={() => setEditKategoriId(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                  </>
                ) : (
                  <>
                    <span className="font-bold text-slate-900 dark:text-white text-sm flex-1">{l.kategori}</span>
                    <span className="text-xs text-slate-400">{l.items.length} item</span>
                    <button onClick={() => { setEditKategoriId(l.id); setEditKategoriVal(l.kategori); }} className="text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => handleDeleteKategori(l.id, l.kategori)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    <button onClick={() => setExpanded(expanded === l.id ? null : l.id)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors ml-1">
                      {expanded === l.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </>
                )}
              </div>

              {/* Items — collapsible */}
              {expanded === l.id && (
                <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-3 space-y-2">
                  {l.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      {editItemId === item.id ? (
                        <>
                          <Input
                            value={editItemVal}
                            onChange={(e) => setEditItemVal(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateItem(item.id); if (e.key === 'Escape') setEditItemId(null); }}
                            className="flex-1 h-7 text-xs dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                            autoFocus
                          />
                          <button onClick={() => handleUpdateItem(item.id)} className="text-green-600 hover:text-green-700"><Check size={14} /></button>
                          <button onClick={() => setEditItemId(null)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                          <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">{item.nama}</span>
                          <button onClick={() => { setEditItemId(item.id); setEditItemVal(item.nama); }} className="text-slate-300 hover:text-blue-500 transition-colors"><Pencil size={13} /></button>
                          <button onClick={() => handleDeleteItem(item.id, item.nama)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                        </>
                      )}
                    </div>
                  ))}

                  {/* Form tambah item */}
                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="Nama parameter baru..."
                      value={newItem[l.id] ?? ''}
                      onChange={(e) => setNewItem((p) => ({ ...p, [l.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddItem(l.id)}
                      className="flex-1 h-8 text-xs dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddItem(l.id)}
                      disabled={addingItem === l.id || !(newItem[l.id] ?? '').trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 text-xs"
                    >
                      {addingItem === l.id ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                      <span className="ml-1">Tambah</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
