'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { REQUEST_STATUS_LABEL, RequestStatus } from '@/lib/types';
import {
  ClipboardList, FlaskConical, Banknote, TrendingUp, ListTodo, Clock, CalendarDays, BarChart3,
} from 'lucide-react';

interface MonthlyTrendPoint {
  label: string;
  count: number;
}

interface Metrics {
  totalRequests: number;
  byStatus: Partial<Record<RequestStatus, number>>;
  totalRevenue: number;
  totalSamples: number;
  perluTindakan: number;
  avgProcessingDays: number;
  permohonanBulanIni: number;
  permohonanBulanLalu: number;
  monthlyTrend: MonthlyTrendPoint[];
}

const statusColor: Record<RequestStatus, string> = {
  MENUNGGU_SAMPEL: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  SAMPEL_DITERIMA: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  VERIFIKASI: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  MENUNGGU_BILLING: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  MENUNGGU_PEMBAYARAN: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  LUNAS: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  ON_PROGRESS: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  SELESAI: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

// Fixed order + validated categorical palette (see dataviz skill, references/palette.md).
// Color is assigned by status identity, never by rank, so it stays stable across renders.
const STATUS_ORDER: RequestStatus[] = [
  'MENUNGGU_SAMPEL', 'SAMPEL_DITERIMA', 'VERIFIKASI', 'MENUNGGU_BILLING',
  'MENUNGGU_PEMBAYARAN', 'LUNAS', 'ON_PROGRESS', 'SELESAI',
];
const STATUS_CHART_HEX: Record<RequestStatus, { light: string; dark: string }> = {
  MENUNGGU_SAMPEL: { light: '#2a78d6', dark: '#3987e5' },
  SAMPEL_DITERIMA: { light: '#1baf7a', dark: '#199e70' },
  VERIFIKASI: { light: '#eda100', dark: '#c98500' },
  MENUNGGU_BILLING: { light: '#008300', dark: '#008300' },
  MENUNGGU_PEMBAYARAN: { light: '#4a3aa7', dark: '#9085e9' },
  LUNAS: { light: '#e34948', dark: '#e66767' },
  ON_PROGRESS: { light: '#e87ba4', dark: '#d55181' },
  SELESAI: { light: '#eb6834', dark: '#d95926' },
};
// Static (non-interpolated) so Tailwind's JIT scanner can pick up each arbitrary property.
const STATUS_CHART_CLASS: Record<RequestStatus, string> = {
  MENUNGGU_SAMPEL: '[--seg:#2a78d6] dark:[--seg:#3987e5]',
  SAMPEL_DITERIMA: '[--seg:#1baf7a] dark:[--seg:#199e70]',
  VERIFIKASI: '[--seg:#eda100] dark:[--seg:#c98500]',
  MENUNGGU_BILLING: '[--seg:#008300] dark:[--seg:#008300]',
  MENUNGGU_PEMBAYARAN: '[--seg:#4a3aa7] dark:[--seg:#9085e9]',
  LUNAS: '[--seg:#e34948] dark:[--seg:#e66767]',
  ON_PROGRESS: '[--seg:#e87ba4] dark:[--seg:#d55181]',
  SELESAI: '[--seg:#eb6834] dark:[--seg:#d95926]',
};

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const fraction = value / 10 ** exponent;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * 10 ** exponent;
}

function MonthlyTrendChart({ data }: { data: MonthlyTrendPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <div className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">
        Belum ada data permohonan dalam 6 bulan terakhir.
      </div>
    );
  }

  const width = 600;
  const height = 220;
  const marginTop = 28;
  const marginBottom = 28;
  const marginX = 12;
  const plotWidth = width - marginX * 2;
  const plotHeight = height - marginTop - marginBottom;
  const max = niceMax(Math.max(...data.map((d) => d.count)));
  const slotWidth = plotWidth / data.length;
  const barWidth = Math.min(24, slotWidth * 0.5);

  return (
    <div className="[--bar:#2a78d6] dark:[--bar:#3987e5] [--grid:#e1e0d9] dark:[--grid:#2c2c2a] [--ink:#52514e] dark:[--ink:#c3c2b7] [--chip-bg:#0b0b0b] dark:[--chip-bg:#ffffff] [--chip-text:#ffffff] dark:[--chip-text:#0b0b0b]">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Tren permohonan per bulan">
        {[0, 0.5, 1].map((f) => {
          const y = marginTop + plotHeight * (1 - f);
          return (
            <g key={f}>
              <line x1={marginX} x2={width - marginX} y1={y} y2={y} stroke="var(--grid)" strokeWidth={1} />
              <text x={marginX} y={y - 4} fontSize={10} fill="var(--ink)">
                {Math.round(max * f)}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const barHeight = (d.count / max) * plotHeight;
          const x = marginX + slotWidth * i + (slotWidth - barWidth) / 2;
          const y = marginTop + plotHeight - barHeight;
          const isHover = hover === i;
          const isLast = i === data.length - 1;
          return (
            <g key={d.label}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 1)}
                rx={4}
                fill="var(--bar)"
                fillOpacity={isHover || isLast ? 1 : 0.72}
                tabIndex={0}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                style={{ cursor: 'pointer', outline: 'none' }}
              />
              <text
                x={marginX + slotWidth * i + slotWidth / 2}
                y={height - 8}
                fontSize={10}
                textAnchor="middle"
                fill="var(--ink)"
              >
                {d.label}
              </text>
              {(isHover || isLast) && (
                <g>
                  <rect
                    x={marginX + slotWidth * i + slotWidth / 2 - 14}
                    y={y - 20}
                    width={28}
                    height={16}
                    rx={4}
                    fill="var(--chip-bg)"
                  />
                  <text
                    x={marginX + slotWidth * i + slotWidth / 2}
                    y={y - 8}
                    fontSize={10}
                    fontWeight={700}
                    textAnchor="middle"
                    fill="var(--chip-text)"
                  >
                    {d.count}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function StatusDonutChart({ byStatus }: { byStatus: Partial<Record<RequestStatus, number>> }) {
  const [hover, setHover] = useState<RequestStatus | null>(null);
  const segments = STATUS_ORDER.filter((s) => (byStatus[s] ?? 0) > 0);
  const total = segments.reduce((sum, s) => sum + (byStatus[s] ?? 0), 0);

  if (total === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">
        Belum ada data permohonan.
      </div>
    );
  }

  const cx = 90;
  const cy = 90;
  const rOuter = 80;
  const rInner = 50;
  const gapDeg = 2;

  const polar = (r: number, angleDeg: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const arcPath = (start: number, end: number) => {
    const startOuter = polar(rOuter, end);
    const endOuter = polar(rOuter, start);
    const startInner = polar(rInner, end);
    const endInner = polar(rInner, start);
    const largeArc = end - start > 180 ? 1 : 0;
    return [
      'M', startOuter.x, startOuter.y,
      'A', rOuter, rOuter, 0, largeArc, 0, endOuter.x, endOuter.y,
      'L', endInner.x, endInner.y,
      'A', rInner, rInner, 0, largeArc, 1, startInner.x, startInner.y,
      'Z',
    ].join(' ');
  };

  let cumulative = 0;
  const arcs = segments.map((status) => {
    const count = byStatus[status] ?? 0;
    const sweep = (count / total) * 360;
    const gap = Math.min(gapDeg, sweep * 0.3);
    const start = cumulative;
    const end = cumulative + sweep - gap;
    cumulative += sweep;
    return { status, count, start, end };
  });

  const centerLabel = hover ? REQUEST_STATUS_LABEL[hover] : 'Total Permohonan';
  const centerValue = hover ? byStatus[hover] : total;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="[--chip-text:#0b0b0b] dark:[--chip-text:#ffffff] [--chip-sub:#898781] shrink-0">
        <svg viewBox="0 0 180 180" width={180} height={180} role="img" aria-label="Distribusi status permohonan">
          {arcs.map(({ status, start, end }) => (
            <path
              key={status}
              d={arcPath(start, end)}
              fill="var(--seg)"
              className={STATUS_CHART_CLASS[status]}
              fillOpacity={hover === null || hover === status ? 1 : 0.4}
              tabIndex={0}
              onMouseEnter={() => setHover(status)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(status)}
              onBlur={() => setHover(null)}
              style={{ cursor: 'pointer', outline: 'none' }}
            />
          ))}
          <text x={90} y={86} textAnchor="middle" fontSize={11} fill="var(--chip-sub)">
            {centerLabel}
          </text>
          <text x={90} y={104} textAnchor="middle" fontSize={20} fontWeight={800} fill="var(--chip-text)">
            {centerValue}
          </text>
        </svg>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-1 gap-x-4 gap-y-1.5 w-full">
        {segments.map((status) => (
          <button
            key={status}
            type="button"
            onMouseEnter={() => setHover(status)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(status)}
            onBlur={() => setHover(null)}
            className={`flex items-center gap-2 text-left rounded-md px-1.5 py-1 transition-colors ${hover === status ? 'bg-slate-50 dark:bg-slate-700/50' : ''}`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: STATUS_CHART_HEX[status].light }}
            />
            <span className="text-xs text-slate-600 dark:text-slate-300 flex-1 truncate">
              {REQUEST_STATUS_LABEL[status]}
            </span>
            <span className="text-xs font-semibold text-slate-900 dark:text-white">{byStatus[status]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard/metrics')
      .then(({ data }) => setMetrics(data.data))
      .finally(() => setLoading(false));
  }, []);

  const bulanDelta = metrics ? metrics.permohonanBulanIni - metrics.permohonanBulanLalu : 0;
  const hasSelesai = (metrics?.byStatus.SELESAI ?? 0) > 0;

  const cards = [
    { label: 'Total Permohonan', value: metrics?.totalRequests, icon: ClipboardList, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { label: 'Total Sampel', value: metrics?.totalSamples, icon: FlaskConical, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30' },
    {
      label: 'Pendapatan Terkonfirmasi',
      value: metrics ? `Rp ${Number(metrics.totalRevenue).toLocaleString('id-ID')}` : null,
      icon: Banknote,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/30',
    },
    {
      label: 'Perlu Tindakan',
      value: metrics?.perluTindakan,
      icon: ListTodo,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-900/30',
    },
    {
      label: 'Rata-rata Waktu Proses',
      value: metrics ? (hasSelesai ? `${metrics.avgProcessingDays} hari` : '—') : null,
      icon: Clock,
      color: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-50 dark:bg-cyan-900/30',
    },
    {
      label: 'Permohonan Bulan Ini',
      value: metrics?.permohonanBulanIni,
      icon: CalendarDays,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-900/30',
      delta: metrics
        ? bulanDelta === 0
          ? 'Sama dengan bulan lalu'
          : `${bulanDelta > 0 ? '▲' : '▼'} ${Math.abs(bulanDelta)} dari bulan lalu`
        : undefined,
      deltaColor: bulanDelta > 0 ? 'text-green-600 dark:text-green-400' : bulanDelta < 0 ? 'text-slate-400 dark:text-slate-500' : 'text-slate-400 dark:text-slate-500',
    },
  ];

  return (
    <div className="p-5 sm:p-7 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Dashboard Admin</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Ringkasan aktivitas sistem SIPUJA.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg, delta, deltaColor }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={17} className={color} />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
            </div>
            <p className={`text-3xl font-extrabold ${color}`}>
              {loading ? '—' : (value ?? 0)}
            </p>
            {delta && <p className={`text-xs font-medium mt-1.5 ${deltaColor}`}>{delta}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-600 dark:text-blue-400" />
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Tren Permohonan per Bulan</h2>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">Memuat...</div>
            ) : (
              <MonthlyTrendChart data={metrics?.monthlyTrend ?? []} />
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Distribusi Status Permohonan</h2>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">Memuat...</div>
            ) : (
              <StatusDonutChart byStatus={metrics?.byStatus ?? {}} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
