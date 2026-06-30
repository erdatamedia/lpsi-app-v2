'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Users, CheckCircle2, XCircle, RefreshCw, KeyRound } from 'lucide-react';

interface UserAccount {
  id: number;
  nama: string;
  email: string;
  isActive: boolean;
  resetRequested: boolean;
  createdAt: string;
}

export default function AdminAkunPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<number | null>(null);
  const [resetting, setResetting] = useState<number | null>(null);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await api.get('/users/admin/list');
      setUsers(res.data.data);
    } catch {
      toast.error('Gagal memuat daftar akun');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsers(); }, []);

  async function handleToggle(user: UserAccount) {
    setToggling(user.id);
    try {
      const res = await api.patch(`/users/admin/${user.id}/activate`);
      toast.success(res.data.message);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: res.data.data.isActive } : u));
    } catch {
      toast.error('Gagal memperbarui status akun');
    } finally {
      setToggling(null);
    }
  }

  async function handleApproveReset(user: UserAccount) {
    setResetting(user.id);
    try {
      const res = await api.patch(`/users/admin/${user.id}/approve-reset`);
      toast.success(res.data.message);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, resetRequested: false } : u));
    } catch {
      toast.error('Gagal menyetujui reset password');
    } finally {
      setResetting(null);
    }
  }

  async function handleRejectReset(user: UserAccount) {
    setResetting(user.id);
    try {
      const res = await api.patch(`/users/admin/${user.id}/reject-reset`);
      toast.success(res.data.message);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, resetRequested: false } : u));
    } catch {
      toast.error('Gagal menolak reset password');
    } finally {
      setResetting(null);
    }
  }

  const active = users.filter(u => u.isActive).length;
  const pending = users.filter(u => !u.isActive).length;
  const resetPending = users.filter(u => u.resetRequested).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Users size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Kelola Akun Pemohon</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Aktivasi akun dan kelola permintaan reset password</p>
          </div>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Akun</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{users.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Aktif</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{active}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Menunggu Verifikasi</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{pending}</p>
        </div>
        <div className={`rounded-xl p-4 border ${resetPending > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Permintaan Reset</p>
          <p className={`text-2xl font-bold mt-1 ${resetPending > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>{resetPending}</p>
        </div>
      </div>

      {/* Reset Password Requests Banner */}
      {resetPending > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <KeyRound size={18} className="text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">
            {resetPending} pemohon meminta reset password. Tinjau dan setujui/tolak di tabel di bawah.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm">Memuat data...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Belum ada akun pemohon terdaftar</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Nama</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Tanggal Daftar</th>
                <th className="px-4 py-3 text-center">Status Akun</th>
                <th className="px-4 py-3 text-center">Reset Password</th>
                <th className="px-4 py-3 text-center">Aksi Akun</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map(user => (
                <tr
                  key={user.id}
                  className={`transition-colors ${user.resetRequested ? 'bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                >
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{user.nama}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{user.email}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {user.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        <CheckCircle2 size={11} /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                        <XCircle size={11} /> Menunggu
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {user.resetRequested ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                          <KeyRound size={10} /> Diminta
                        </span>
                        <button
                          onClick={() => handleApproveReset(user)}
                          disabled={resetting === user.id}
                          className="px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                        >
                          {resetting === user.id ? '...' : 'Setujui'}
                        </button>
                        <button
                          onClick={() => handleRejectReset(user)}
                          disabled={resetting === user.id}
                          className="px-2 py-1 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                        >
                          Tolak
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggle(user)}
                      disabled={toggling === user.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                        user.isActive
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                      }`}
                    >
                      {toggling === user.id ? '...' : user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
