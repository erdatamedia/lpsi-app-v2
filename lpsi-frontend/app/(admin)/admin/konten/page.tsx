'use client';

import { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2, ImageIcon, Upload, Eye } from 'lucide-react';

interface Slide { id: number; imageUrl: string; caption?: string; urutan: number; isActive: boolean; }
interface CardMedia { id: number; type: string; fileUrl: string; }

const CARD_TYPES = [
  { key: 'HARGA_LAYANAN', label: 'Daftar Harga Layanan' },
  { key: 'ALUR_LAYANAN', label: 'Alur Layanan' },
  { key: 'DOKUMEN_ISO', label: 'Dokumen ISO' },
];

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').replace('/api', '');

export default function AdminKontenPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [cardMedia, setCardMedia] = useState<CardMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [uploadingCard, setUploadingCard] = useState<string | null>(null);
  const slideFileRef = useRef<HTMLInputElement>(null);
  const cardFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function fetchAll() {
    const [s, c] = await Promise.all([
      api.get('/content/slides?all=true'),
      api.get('/content/card-media'),
    ]);
    setSlides(s.data.data ?? []);
    setCardMedia(c.data.data ?? []);
  }

  useEffect(() => { fetchAll().finally(() => setLoading(false)); }, []);

  async function handleUploadSlide() {
    const file = slideFileRef.current?.files?.[0];
    if (!file) return toast.error('Pilih file gambar terlebih dahulu');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      if (caption.trim()) form.append('caption', caption.trim());
      await api.post('/content/slides', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setCaption('');
      if (slideFileRef.current) slideFileRef.current.value = '';
      await fetchAll();
      toast.success('Slide berhasil ditambahkan');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setUploading(false); }
  }

  async function handleDeleteSlide(id: number) {
    if (!confirm('Hapus slide ini?')) return;
    try {
      await api.delete(`/content/slides/${id}`);
      await fetchAll();
      toast.success('Slide dihapus');
    } catch (err) { toast.error(getErrorMessage(err)); }
  }

  async function handleToggleSlide(slide: Slide) {
    try {
      await api.patch(`/content/slides/${slide.id}`, { isActive: !slide.isActive });
      await fetchAll();
    } catch (err) { toast.error(getErrorMessage(err)); }
  }

  async function handleUploadCard(type: string) {
    const file = cardFileRefs.current[type]?.files?.[0];
    if (!file) return toast.error('Pilih file gambar terlebih dahulu');
    setUploadingCard(type);
    try {
      const form = new FormData();
      form.append('file', file);
      await api.post(`/content/card-media/${type}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const ref = cardFileRefs.current[type];
      if (ref) ref.value = '';
      await fetchAll();
      toast.success('Gambar card berhasil diperbarui');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setUploadingCard(null); }
  }

  function getCardMedia(type: string) {
    return cardMedia.find(c => c.type === type);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 size={20} className="animate-spin mr-2" /> Memuat...
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-7 space-y-8 max-w-4xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Kelola Konten Halaman</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Manage slideshow banner dan gambar card informasi di halaman utama.</p>
      </div>

      {/* Slideshow Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 space-y-4">
        <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
          <ImageIcon size={16} className="text-blue-600" /> Slideshow Banner
        </h2>

        {/* Upload form */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <div className="flex-1 space-y-2">
            <input
              type="file"
              accept="image/*"
              ref={slideFileRef}
              className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-300 hover:file:bg-blue-100"
            />
            <Input
              placeholder="Caption (opsional)..."
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className="h-8 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            />
          </div>
          <Button onClick={handleUploadSlide} disabled={uploading} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 self-end">
            {uploading ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Plus size={14} className="mr-1.5" />}
            Tambah Slide
          </Button>
        </div>

        {/* Slide list */}
        {slides.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">Belum ada slide.</p>
        ) : (
          <div className="space-y-2">
            {slides.map(slide => (
              <div key={slide.id} className="flex items-center gap-3 p-3 border border-slate-100 dark:border-slate-700 rounded-lg">
                <div className="relative w-20 h-12 rounded overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${BASE}${slide.imageUrl}`} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{slide.caption || `Slide #${slide.id}`}</p>
                  <p className="text-xs text-slate-400">Urutan: {slide.urutan}</p>
                </div>
                <button
                  onClick={() => handleToggleSlide(slide)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${slide.isActive ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600'}`}
                >
                  {slide.isActive ? 'Aktif' : 'Nonaktif'}
                </button>
                <a href={`${BASE}${slide.imageUrl}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors">
                  <Eye size={15} />
                </a>
                <button onClick={() => handleDeleteSlide(slide.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card Media Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 space-y-4">
        <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
          <Upload size={16} className="text-blue-600" /> Gambar Card Informasi
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Upload gambar/JPG untuk setiap card informasi di halaman utama. Card akan bisa diklik setelah gambar diupload.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {CARD_TYPES.map(({ key, label }) => {
            const media = getCardMedia(key);
            return (
              <div key={key} className="border border-slate-100 dark:border-slate-700 rounded-xl p-4 space-y-3">
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{label}</p>

                {media ? (
                  <div className="space-y-2">
                    <div className="relative w-full h-28 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`${BASE}${media.fileUrl}`} alt={label} className="w-full h-full object-cover" />
                    </div>
                    <a href={`${BASE}${media.fileUrl}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      <Eye size={11} /> Lihat file
                    </a>
                  </div>
                ) : (
                  <div className="w-full h-28 rounded-lg bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    <p className="text-xs text-slate-400">Belum ada gambar</p>
                  </div>
                )}

                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    ref={el => { cardFileRefs.current[key] = el; }}
                    className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-300"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleUploadCard(key)}
                    disabled={uploadingCard === key}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                  >
                    {uploadingCard === key ? <Loader2 size={12} className="animate-spin mr-1" /> : <Upload size={12} className="mr-1" />}
                    {media ? 'Ganti Gambar' : 'Upload Gambar'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
