# PROJECT-STATUS.md — Rangkuman Status Proyek LPSI

> Dokumen ini adalah snapshot status proyek per **2026-07-03**, dibuat untuk dibawa sebagai konteks ke sesi chat baru. Untuk arsitektur & konvensi baku, tetap rujuk [CLAUDE.md](CLAUDE.md).

---

## Ringkasan

Implementasi sudah **melewati** rencana awal di CLAUDE.md. Semua modul inti (auth, requests, samples, billing, analysis, notifications, dashboard) sudah selesai dan berfungsi, ditambah beberapa fitur baru yang belum tercatat di CLAUDE.md: **CMS konten landing page, manajemen akun admin, dan konfigurasi sistem (prefix nomor, pertanyaan SKM)**.

Belum ada TODO/stub code yang mencurigakan ditemukan saat audit.

---

## 1. Modul Backend (`lpsi-backend/src/`)

| Modul | Status | Catatan |
|---|---|---|
| auth | ✅ | register, login, logout, forgot/reset password, cek status reset |
| users | ✅ | profil, **+ list & manajemen akun admin (baru)** |
| requests | ✅ | CRUD permohonan, upload surat pengantar/bukti bayar, IKM, **+ kirim-lhp fisik, activity logs, SKM questions (baru)** |
| samples | ✅ | verifikasi per sampel, upload LHP |
| billing | ✅ | e-billing PDF, konfirmasi bayar |
| analysis | ✅ | update status, **+ resi LHP, download surat pengantar (baru)** |
| notifications | ✅ | list, read, read-all |
| dashboard | ✅ | metrics, export Excel, **+ settings key-value, CRUD pertanyaan SKM (baru)** |
| prisma / common | ✅ | PrismaService global, JwtAuthGuard, RolesGuard |
| **activity-log** ⭐ | ✅ | **Baru** — log aktivitas per permohonan (tidak ada di CLAUDE.md awal) |
| **layanan** ⭐ | ✅ | **Baru** — CRUD kategori & item layanan |
| **content** ⭐ | ✅ | **Baru** — CRUD slide carousel & card media (Harga/Alur/ISO) untuk landing page |
| uploads | — | folder saja, file handling via Multer interceptor di controller lain |

---

## 2. Perubahan Skema Database (vs CLAUDE.md)

**Model `User`** — tambahan field: `pekerjaan`, `pendidikanTerakhir`, `resetRequested`

**Model `LabRequest`** — tambahan field: `eBillingFile` (terpisah dari `kodeBilling`), `kirimLhpFisik`, `alamatPengiriman`, `resiLhp`, relasi `activityLogs`

**Enum `RequestStatus`** — tambahan value `MENUNGGU_BILLING` (state antara sebelum `MENUNGGU_PEMBAYARAN`)

**Model baru yang belum ada di CLAUDE.md:**
- `Layanan` + `LayananItem` — kategori & daftar layanan lab
- `Slide` — carousel landing page
- `CardMedia` (enum `CardMediaType`: HARGA_LAYANAN, ALUR_LAYANAN, DOKUMEN_ISO)
- `ActivityLog` — riwayat aktivitas per permohonan
- `Setting` — key-value store (termasuk prefix nomor permohonan)
- `SkmPertanyaan` — pertanyaan kuesioner SKM/IKM yang bisa dikelola admin

`Sample`, `Notification`, `IKM` — tidak berubah dari desain awal.

---

## 3. Struktur Route Frontend (`lpsi-frontend/app/`)

- **(public)**: `/`, `/layanan`, `/alur`
- **(auth)**: `/login`, `/register`, `/aktivasi`, `/lupa-password`, `/reset-password`
- **(pemohon)**: `/dashboard`, `/permohonan`, `/permohonan/baru`, `/permohonan/[id]`, `/notifikasi`, `/profil`
- **(admin)**: `/admin/dashboard`, `/admin/permohonan`, `/admin/permohonan/[id]`, dan baru: `/admin/akun` ⭐, `/admin/layanan` ⭐, `/admin/konten` ⭐, `/admin/konfigurasi` ⭐

---

## 4. Endpoint Baru di Luar API Contract CLAUDE.md

Semua endpoint yang terdokumentasi di CLAUDE.md sudah terimplementasi. Tambahan di luar dokumentasi:

- `GET /auth/reset-status`
- `PATCH /users/me`, `GET /users/admin/list`, `PATCH /users/admin/:id/activate|approve-reset|reject-reset`
- `PATCH /requests/:id/kirim-lhp`, `GET /requests/:id/ebilling`, `GET /requests/:id/logs`, `GET /requests/meta/skm-pertanyaan`
- `PATCH /admin/requests/:id/resi-lhp`, `GET /admin/requests/:id/{surat-pengantar,ebilling,bukti-bayar}`
- `GET/PATCH /admin/dashboard/settings/:key`, CRUD `admin/dashboard/skm-pertanyaan`
- Seluruh endpoint modul **layanan** dan **content** (CRUD)

**Rekomendasi:** update tabel API Contract di CLAUDE.md agar sinkron dengan implementasi aktual — saat ini dokumen itu sudah cukup jauh tertinggal dari kode.

---

## 5. Yang Perlu Diperhatikan

- Tidak ditemukan TODO/stub/placeholder mencurigakan pada audit terakhir.
- `ActivityLogService.log()` sengaja punya catch block kosong (sesuai aturan bisnis #5 CLAUDE.md — notifikasi/log tidak boleh mem-block transaksi utama).
- CLAUDE.md **belum diperbarui** untuk mencerminkan modul `activity-log`, `layanan`, `content`, field-field baru di schema, dan endpoint-endpoint baru di atas.

---

## Riwayat Commit Terakhir

```
1fc6654 feat: konfigurasi prefix nomor permohonan, manajemen pertanyaan SKM, halaman admin konfigurasi
8f181ab feat: ganti semua logo.png ke favicon.svg (logo Kementan)
ba11837 feat: tambah field pekerjaan, pendidikan terakhir di registrasi, dan alamat pengiriman LHP di permohonan
ee62839 feat: ganti favicon dengan logo Kementan
3c31ae8 feat: ganti teks landing page, tambah field lain-lain di jenis pengujian
```
