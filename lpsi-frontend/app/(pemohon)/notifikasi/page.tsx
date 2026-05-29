'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Notification } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NotifikasiPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchNotifs() {
    const { data } = await api.get('/notifications');
    setNotifs(data.data);
  }

  useEffect(() => {
    fetchNotifs().finally(() => setLoading(false));
  }, []);

  async function markAllRead() {
    await api.patch('/notifications/read-all');
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success('Semua notifikasi ditandai dibaca');
  }

  async function markRead(id: number) {
    await api.patch(`/notifications/${id}/read`);
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }

  const unread = notifs.filter((n) => !n.isRead).length;

  return (
    <div className="p-5 sm:p-7 space-y-5 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Notifikasi</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {unread > 0 ? `${unread} belum dibaca` : 'Semua sudah dibaca'}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm"
            className="shrink-0 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            onClick={markAllRead}>
            <CheckCheck size={14} className="mr-1.5" /> Tandai Semua Dibaca
          </Button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 size={20} className="animate-spin mr-2" /> Memuat...
          </div>
        ) : notifs.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Bell size={32} className="text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-slate-400 dark:text-slate-500 text-sm">Tidak ada notifikasi</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-700">
            {notifs.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && markRead(n.id)}
                className={cn(
                  'flex items-start gap-4 px-5 py-4 transition-colors',
                  n.isRead
                    ? 'bg-white dark:bg-slate-800 cursor-default'
                    : 'bg-blue-50 dark:bg-blue-900/20 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30',
                )}
              >
                {/* Dot indikator */}
                <div className="mt-1 shrink-0">
                  {n.isRead
                    ? <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-600" />
                    : <div className="w-2 h-2 rounded-full bg-blue-500" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm leading-relaxed',
                    n.isRead
                      ? 'text-slate-600 dark:text-slate-400'
                      : 'text-slate-900 dark:text-white font-medium',
                  )}>
                    {n.message}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {new Date(n.createdAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                  </p>
                </div>

                {!n.isRead && (
                  <span className="shrink-0 text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                    Baru
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
