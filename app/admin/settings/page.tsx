'use client';

import { useQuery } from '@tanstack/react-query';

interface HealthData {
  status: string;
  service: string;
  asr_backend: string;
  gemini_model: string;
  chunk_minutes: number;
}

interface AdminDashboardData {
  totalUsers: number;
  totalCourses: number;
  pendingCourses: number;
  totalRevenue: number;
}

interface SystemMetrics {
  ram: { used: number; total: number };
  disk: { used: number; total: number };
  uptime: number;
}

import { getAccessToken } from '@/lib/auth/token';
import { api } from '@/lib/api/client';

const AI_WORKER_URL = process.env.NEXT_PUBLIC_AI_WORKER_URL || 'http://localhost:8002';

async function fetchAiHealth(): Promise<HealthData> {
  const res = await fetch(`${AI_WORKER_URL}/health`);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

function ConfigRow({ label, value, description, badge }: {
  label: string;
  value: string | number;
  description?: string;
  badge?: { text: string; color: string };
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 last:border-0">
      <div className="flex flex-col gap-0.5">
        <span className="text-[13.5px] font-semibold text-gray-800">{label}</span>
        {description && <span className="text-xs text-gray-400">{description}</span>}
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badge.color}`}>
            {badge.text}
          </span>
        )}
        <code className="rounded bg-gray-100 px-2.5 py-1 font-mono text-[12.5px] text-gray-700">
          {value}
        </code>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const token = getAccessToken() ?? '';

  const { data: aiHealth, isError: aiError } = useQuery({
    queryKey: ['settings', 'ai-health'],
    queryFn: fetchAiHealth,
    refetchInterval: 30000,
  });

  const { data: systemMetrics } = useQuery({
    queryKey: ['settings', 'system'],
    queryFn: () => api.get<SystemMetrics>('/api/v1/dashboard/admin/system', { token }),
    enabled: !!token,
    refetchInterval: 30000,
  });

  const { data: dashStats } = useQuery({
    queryKey: ['settings', 'dashboard'],
    queryFn: () => api.get<AdminDashboardData>('/api/v1/dashboard/admin', { token }),
    enabled: !!token,
  });

  const formatBytes = (bytes: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatUptime = (ms: number) => {
    if (!ms) return 'N/A';
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms / (1000 * 60)) % 60);
    return `${Math.floor(ms / (1000 * 60 * 60 * 24))}d ${h % 24}h ${m}m`;
  };

  const ramPct = systemMetrics ? Math.round((systemMetrics.ram.used / systemMetrics.ram.total) * 100) : 0;
  const diskPct = systemMetrics ? Math.round((systemMetrics.disk.used / systemMetrics.disk.total) * 100) : 0;

  return (
    <>
      <h1 className="m-0 font-display text-[22px] font-bold text-gray-900">Cấu hình hệ thống</h1>

      <div className="grid grid-cols-3 gap-4">
        {/* AI Worker Config */}
        <div className="col-span-2 flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="font-display text-[15px] font-bold text-gray-900">AI Worker</span>
            <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              aiError ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${aiError ? 'bg-red-500' : 'bg-green-500'}`}></span>
              {aiError ? 'Không kết nối được' : 'Đang hoạt động'}
            </span>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <ConfigRow
              label="Gemini Model (LLM)"
              value={aiHealth?.gemini_model ?? '—'}
              description="BR-DUB-02: Không hardcode — đọc từ GEMINI_MODEL env"
              badge={{ text: 'Live', color: 'bg-blue-100 text-blue-700' }}
            />
            <ConfigRow
              label="ASR Backend (STT)"
              value={aiHealth?.asr_backend ?? '—'}
              description="groq = Groq Cloud API · whisperx_local = GPU local"
            />
            <ConfigRow
              label="Chunk Duration (BR-CHUNK-02)"
              value={aiHealth ? `${aiHealth.chunk_minutes} phút` : '—'}
              description="Phân đoạn video cố định để xử lý song song"
            />
            <ConfigRow
              label="AI Worker URL"
              value={AI_WORKER_URL}
              description="URL giao tiếp nội bộ với FastAPI service"
            />
          </div>

          {/* Business Rules Quotas */}
          <span className="mt-2 font-display text-[15px] font-bold text-gray-900">Hạn ngạch nghiệp vụ (Quotas)</span>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {[
              { label: 'Lồng tiếng / Học viên / ngày', value: '15 lượt', rule: 'BR-DUB-06' },
              { label: 'Lồng tiếng / Giảng viên / ngày', value: '30 lượt', rule: 'BR-DUB-06' },
              { label: 'Sinh học liệu / ngày', value: '6 lượt', rule: 'BR-MAT-08' },
              { label: 'Tin nhắn AI Tutor / ngày', value: '30 tin', rule: 'BR-TUTOR-04' },
              { label: 'Tìm kiếm AI (Guest) / giờ', value: '15 lượt', rule: 'BR-DISCOVERY-01' },
            ].map((item, idx, arr) => (
              <div key={item.label} className={`flex items-center justify-between px-5 py-3.5 ${idx < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-gray-700">{item.label}</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">{item.rule}</span>
                </div>
                <code className="rounded bg-gray-100 px-2.5 py-1 font-mono text-[12.5px] text-gray-700">{item.value}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Server Resources */}
        <div className="flex flex-col gap-2.5">
          <span className="font-display text-[15px] font-bold text-gray-900">Tài nguyên Backend</span>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col gap-5">

            <div>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="font-medium text-gray-600">RAM JVM</span>
                <span className="font-semibold text-gray-900">
                  {systemMetrics ? `${formatBytes(systemMetrics.ram.used)} / ${formatBytes(systemMetrics.ram.total)} (${ramPct}%)` : '—'}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all ${ramPct > 80 ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${ramPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="font-medium text-gray-600">Disk (Server)</span>
                <span className="font-semibold text-gray-900">
                  {systemMetrics ? `${formatBytes(systemMetrics.disk.used)} / ${formatBytes(systemMetrics.disk.total)} (${diskPct}%)` : '—'}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all ${diskPct > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${diskPct}%` }}
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Uptime Backend</span>
                <span className="font-semibold text-gray-800">{formatUptime(systemMetrics?.uptime ?? 0)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Tổng khóa học</span>
                <span className="font-semibold text-gray-800">{dashStats?.totalCourses ?? '—'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Tổng người dùng</span>
                <span className="font-semibold text-gray-800">{dashStats?.totalUsers ?? '—'}</span>
              </div>
            </div>
          </div>

          {/* Version & Environment Info */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Môi trường</span>
            {[
              { key: 'Service', val: 'Spring Boot 3 + Next.js 15' },
              { key: 'Database', val: 'MySQL 8.0' },
              { key: 'Cache/Queue', val: 'Redis 7' },
              { key: 'AI Runtime', val: 'FastAPI + Celery' },
              { key: 'Profile', val: 'dev' },
            ].map(({ key, val }) => (
              <div key={key} className="flex justify-between">
                <span className="text-xs text-gray-500">{key}</span>
                <code className="text-[11.5px] font-mono text-gray-700">{val}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
