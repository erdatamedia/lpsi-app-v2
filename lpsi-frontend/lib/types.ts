export type Role = 'PEMOHON' | 'ADMIN';

export type RequestStatus =
  | 'MENUNGGU_SAMPEL'
  | 'SAMPEL_DITERIMA'
  | 'VERIFIKASI'
  | 'MENUNGGU_BILLING'
  | 'MENUNGGU_PEMBAYARAN'
  | 'LUNAS'
  | 'ON_PROGRESS'
  | 'SELESAI';

export type SampleStatus = 'MENUNGGU' | 'DITERIMA' | 'OK' | 'DITOLAK';

export interface User {
  id: number;
  nama: string;
  email: string;
  role: Role;
  jenisKelamin?: string;
  tanggalLahir?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Sample {
  id: number;
  requestId: number;
  kategori: string;
  namaSampel: string;
  beratBasah?: number;
  beratKering?: number;
  kemasan?: string;
  jenisUji: string[];
  hargaTotal: number;
  status: SampleStatus;
  alasanTolak?: string;
  lhpFile?: string;
  createdAt: string;
}

export interface LabRequest {
  id: number;
  nomorPermohonan: string;
  userId: number;
  namaPemohon: string;
  alamat: string;
  noHp: string;
  emailPemohon: string;
  tanggalPermohonan: string;
  suratPengantar?: string | null;
  status: RequestStatus;
  totalTagihan?: number;
  kodeBilling?: string;
  eBillingFile?: string;
  buktiBayar?: string;
  kirimLhpFisik?: boolean | null;
  resiLhp?: string | null;
  createdAt: string;
  updatedAt: string;
  samples: Sample[];
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  MENUNGGU_SAMPEL: 'Menunggu Sampel',
  SAMPEL_DITERIMA: 'Sampel Diterima',
  VERIFIKASI: 'Verifikasi',
  MENUNGGU_BILLING: 'Menunggu Penerbitan E-Billing',
  MENUNGGU_PEMBAYARAN: 'Menunggu Pembayaran',
  LUNAS: 'Lunas',
  ON_PROGRESS: 'On Progress',
  SELESAI: 'Selesai',
};

export const SAMPLE_STATUS_LABEL: Record<SampleStatus, string> = {
  MENUNGGU: 'Menunggu',
  DITERIMA: 'Diterima',
  OK: 'OK',
  DITOLAK: 'Ditolak',
};
