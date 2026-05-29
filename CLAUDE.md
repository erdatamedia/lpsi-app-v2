# CLAUDE.md — LPSI Project Context

Dokumen ini dibaca otomatis oleh Claude Code setiap sesi.
Jangan hapus atau ubah struktur heading-nya.

---

## Identitas Proyek

- **Nama sistem**: LPSI — Layanan Pelacakan Hasil Lab
- **Klien**: Unit Layanan Laboratorium BRMP Ruminansia Besar, BRIN — Pasuruan, Jawa Timur
- **Developer**: Freelance vendor (CV)
- **Status**: Development phase — dokumentasi selesai, coding dimulai

---

## Arsitektur Sistem

Dua repo terpisah, satu VPS, satu Nginx sebagai reverse proxy.

```
Nginx (SSL)
  ├── / → lpsi-frontend (Next.js 14, port 3000, PM2)
  └── /api/* → lpsi-backend (NestJS, port 3001, PM2)

lpsi-backend → MySQL 8.0 (Prisma ORM)
lpsi-backend → /uploads/ (local disk)
lpsi-backend → Gmail SMTP (jaslit.lolitsapi@gmail.com)
```

---

## Tech Stack

### Frontend — `lpsi-frontend/`
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Axios (dengan interceptor JWT cookie)

### Backend — `lpsi-backend/`
- NestJS (modular architecture)
- TypeScript
- Prisma ORM
- MySQL 8.0
- JWT (httpOnly cookie, expires 24h)
- bcrypt (salt round 12)
- @nestjs-modules/mailer + Handlebars templates
- Multer (file upload)

### Infrastruktur
- VPS Ubuntu 22.04 LTS
- PM2 (process manager)
- Nginx (reverse proxy + rate limiting)
- Let's Encrypt SSL

---

## Struktur Direktori Backend

```
lpsi-backend/src/
├── auth/           # register, login, aktivasi, reset password
├── users/          # profil user
├── requests/       # permohonan pengujian (pemohon)
├── samples/        # verifikasi sampel (admin)
├── billing/        # e-billing dan konfirmasi bayar
├── analysis/       # update status analisa
├── notifications/  # in-app notif + mail/
├── dashboard/      # metrik dan ekspor admin
├── uploads/        # file handler (Multer)
├── prisma/         # PrismaService (global module)
└── common/         # decorators, guards, filters, pipes
```

## Struktur Direktori Frontend

```
lpsi-frontend/app/
├── (public)/       # landing page, layanan, alur — no auth
├── (auth)/         # login, register, aktivasi, lupa password
├── (pemohon)/      # dashboard, permohonan, tracking — JWT PEMOHON
└── (admin)/        # dashboard admin, tabel, rekap — JWT ADMIN
```

---

## Database — Entitas Utama

```prisma
model User {
  id            Int      @id @default(autoincrement())
  nama          String
  email         String   @unique
  password      String   // bcrypt hash
  role          Role     @default(PEMOHON)
  jenisKelamin  String?
  tanggalLahir  DateTime?
  isActive      Boolean  @default(false)
  activateToken String?
  resetToken    String?
  createdAt     DateTime @default(now())
  requests      LabRequest[]
  notifications Notification[]
}

enum Role { PEMOHON ADMIN }

model LabRequest {
  id                Int           @id @default(autoincrement())
  nomorPermohonan   String        @unique  // LPSI-YYMM-NNN
  userId            Int
  user              User          @relation(fields: [userId], references: [id])
  namaPemohon       String
  alamat            String
  noHp              String
  emailPemohon      String
  tanggalPermohonan DateTime
  suratPengantar    String?
  status            RequestStatus @default(MENUNGGU_SAMPEL)
  totalTagihan      Decimal?
  kodeBilling       String?
  buktiBayar        String?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  samples           Sample[]
  ikm               IKM?
}

enum RequestStatus {
  MENUNGGU_SAMPEL
  SAMPEL_DITERIMA
  VERIFIKASI
  MENUNGGU_PEMBAYARAN
  LUNAS
  ON_PROGRESS
  SELESAI
}

model Sample {
  id          Int          @id @default(autoincrement())
  requestId   Int
  request     LabRequest   @relation(fields: [requestId], references: [id], onDelete: Cascade)
  kategori    String
  namaSampel  String
  beratBasah  Float?
  beratKering Float?
  kemasan     String?
  jenisUji    Json         // string[]
  hargaTotal  Decimal
  status      SampleStatus @default(MENUNGGU)
  alasanTolak String?
  lhpFile     String?
  createdAt   DateTime     @default(now())
}

enum SampleStatus { MENUNGGU DITERIMA OK DITOLAK }

model Notification {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String
  message   String
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
}

model IKM {
  id        Int        @id @default(autoincrement())
  requestId Int        @unique
  request   LabRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  jawaban   Json
  createdAt DateTime   @default(now())
}
```

---

## API Contract — Ringkasan Endpoint

Base URL: `https://lpsi.brmp-ruminansia.go.id/api`
Auth: JWT via httpOnly cookie `access_token`

| Method | Path | Auth | Deskripsi |
|--------|------|------|-----------|
| POST | /auth/register | Publik | Registrasi pemohon |
| POST | /auth/activate | Publik | Aktivasi via token email |
| POST | /auth/login | Publik | Login + set cookie |
| POST | /auth/logout | JWT | Hapus cookie |
| POST | /auth/forgot-password | Publik | Kirim email reset |
| POST | /auth/reset-password | Publik | Reset password |
| GET | /requests | JWT PEMOHON | List permohonan milik user |
| POST | /requests | JWT PEMOHON | Buat permohonan baru |
| GET | /requests/:id | JWT KEDUANYA | Detail + tracking |
| POST | /requests/:id/bukti-bayar | JWT PEMOHON | Upload bukti bayar |
| POST | /requests/:id/ikm | JWT PEMOHON | Submit IKM/SKM |
| GET | /requests/:id/lhp/:sampleId | JWT PEMOHON | Download LHP |
| GET | /admin/requests | JWT ADMIN | Semua permohonan |
| PATCH | /admin/requests/:id/status | JWT ADMIN | Update status |
| PATCH | /admin/requests/:id/billing | JWT ADMIN | Input kode billing |
| PATCH | /admin/requests/:id/konfirmasi-bayar | JWT ADMIN | Konfirmasi LUNAS |
| PATCH | /admin/samples/:id/verify | JWT ADMIN | Verifikasi sampel |
| POST | /admin/samples/:id/lhp | JWT ADMIN | Upload LHP |
| GET | /notifications | JWT PEMOHON | List notifikasi |
| PATCH | /notifications/:id/read | JWT PEMOHON | Tandai dibaca |
| PATCH | /notifications/read-all | JWT PEMOHON | Tandai semua dibaca |
| GET | /admin/dashboard/metrics | JWT ADMIN | Metrik dashboard |
| GET | /admin/dashboard/export | JWT ADMIN | Ekspor Excel |
| GET | /users/me | JWT KEDUANYA | Profil user login |

---

## Aturan Bisnis Kritis

1. **Verifikasi sampel per item** — satu permohonan bisa campuran OK dan DITOLAK
2. **Sampel ditolak** → pemohon buat permohonan baru, tidak bisa tambah ke permohonan existing
3. **E-billing diinput manual** oleh admin dari sistem PNBP eksternal
4. **IKM wajib diisi** sebelum endpoint download LHP bisa diakses
5. **Notifikasi tidak boleh block** transaksi utama — gunakan try/catch terpisah
6. **File disimpan dengan nama UUID** bukan nama asli, tidak bisa diakses via URL publik
7. **Admin dibuat langsung di database** — tidak ada endpoint registrasi admin
8. **Nomor permohonan** format: `LPSI-YYMM-NNN` (contoh: LPSI-2605-001)

---

## Konvensi Kode

### Umum
- Bahasa kode: **English** (variabel, fungsi, class, komentar singkat)
- Bahasa pesan response dan email: **Bahasa Indonesia**
- Semua file TypeScript strict mode
- Tidak ada `any` type kecuali benar-benar terpaksa

### NestJS Backend
- Setiap modul punya: `module.ts`, `controller.ts`, `service.ts`, folder `dto/`
- DTO menggunakan `class-validator` untuk validasi
- Response selalu dibungkus: `{ statusCode, message, data? }`
- Guard `JwtAuthGuard` untuk autentikasi, `RolesGuard` + `@Roles()` untuk otorisasi
- Service tidak boleh import service lain secara circular — gunakan event atau inject via module
- `NotificationService` dipanggil sebagai side effect, selalu dalam try/catch terpisah

### Next.js Frontend
- `app/` router — tidak ada `pages/` directory
- Server Components by default, `'use client'` hanya jika perlu interaktivitas
- Fetch ke API selalu via `lib/api.ts` (Axios instance), bukan fetch langsung
- Tidak ada hardcode URL — semua dari `process.env.NEXT_PUBLIC_API_URL`

### Environment Variables
```env
# Backend
DATABASE_URL="mysql://lpsi_user:password@localhost:3306/lpsi_db"
JWT_SECRET="[min 32 char random string]"
JWT_EXPIRES_IN="24h"
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=jaslit.lolitsapi@gmail.com
MAIL_PASS="xxxx xxxx xxxx xxxx"
MAIL_FROM="LPSI Lab BRMP <jaslit.lolitsapi@gmail.com>"
APP_URL=https://lpsi.brmp-ruminansia.go.id
UPLOAD_DIR=/var/www/lpsi/uploads
NODE_ENV=production

# Frontend
NEXT_PUBLIC_API_URL=https://lpsi.brmp-ruminansia.go.id/api
```

---

## Urutan Development yang Direkomendasikan

1. Setup repo, install dependencies, konfigurasi Prisma
2. Generate Prisma schema + migrasi database
3. AuthModule — register, aktivasi, login, JWT guard
4. RequestModule — CRUD permohonan pemohon
5. SampleModule — verifikasi admin
6. BillingModule — billing + bukti bayar
7. NotificationModule — email templates + in-app
8. AnalysisModule — update status + upload LHP
9. IKMModule — submit + validasi sebelum download
10. DashboardModule — metrik + ekspor
11. Frontend — mulai dari layout, auth pages, lalu fitur per modul

---

## Catatan Penting untuk Claude Code

- Selalu cek `CLAUDE.md` ini sebelum membuat file baru
- Jika ragu antara dua pendekatan, pilih yang lebih sederhana
- Jangan generate kode yang belum ada di API Contract tanpa konfirmasi
- Setiap kali buat endpoint baru, pastikan ada guard yang sesuai
- Notifikasi email dan in-app selalu dipasangkan — jika satu dibuat, buat keduanya
