'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import { AlertTriangle, Lightbulb, PlayCircle } from 'lucide-react';
import { Trophy } from 'lucide-react';

interface KnowledgeGapDto {
  topic: string;
  errorRate: number;
  videoTimestamp: number | null;
  referenceLessonId: number | null;
  incorrectCount: number;
  totalCount: number;
}

interface KnowledgeGapsRes {
  gaps: KnowledgeGapDto[];
}

function GapSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-line-soft animate-pulse">
      <div className="w-full sm:w-2/3">
        <div className="h-5 bg-line rounded w-1/3 mb-3"></div>
        <div className="flex gap-4 mb-2">
          <div className="h-4 bg-line rounded w-1/4"></div>
          <div className="h-4 bg-line rounded w-1/4"></div>
        </div>
        <div className="w-full h-1.5 bg-line rounded-full"></div>
      </div>
      <div className="h-9 bg-line rounded-full w-32 shrink-0"></div>
    </div>
  );
}

function getGapColorTheme(errorRate: number) {
  if (errorRate >= 0.7) {
    return {
      text: 'text-rose-600',
      bg: 'bg-rose-500',
      border: 'border-rose-500/20',
      lightBg: 'bg-rose-50',
    };
  }
  if (errorRate >= 0.4) {
    return {
      text: 'text-amber-600',
      bg: 'bg-amber-500',
      border: 'border-amber-500/20',
      lightBg: 'bg-amber-50',
    };
  }
  return {
    text: 'text-sky-600',
    bg: 'bg-sky-500',
    border: 'border-sky-500/20',
    lightBg: 'bg-sky-50',
  };
}

export function KnowledgeGapsWidget({ courseId }: { courseId: number }) {
  const { data, isLoading, error } = useQuery<KnowledgeGapsRes>({
    queryKey: ['knowledge-gaps', courseId],
    queryFn: async () => {
      return await api.get<KnowledgeGapsRes>(`/api/v1/student/courses/${courseId}/knowledge-gaps`, {
        token: getAccessToken() ?? undefined,
      });
    }
  });

  const gaps = data?.gaps;

  if (isLoading) {
    return (
      <div className="card p-5 mb-6 border border-line-soft shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-line animate-pulse"></div>
          <div className="h-6 w-48 bg-line rounded animate-pulse"></div>
        </div>
        <div className="space-y-3">
          <GapSkeleton />
          <GapSkeleton />
          <GapSkeleton />
        </div>
      </div>
    );
  }

  if (error || !gaps) return null;

  if (gaps.length === 0) {
    return (
      <div className="card p-6 mb-6 bg-gradient-to-r from-success/5 to-success/10 border border-success/20 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-success/10 rounded-full text-success mt-0.5 shadow-sm">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-success-dark text-lg mb-1">Tuyệt vời!</h3>
            <p className="text-ink-muted leading-relaxed">Bạn chưa có lỗ hổng kiến thức đáng chú ý nào. Hãy tiếp tục phát huy và duy trì phong độ xuất sắc này nhé!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 mb-6 border border-line shadow-sm bg-surface">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-5 h-5 text-accent" />
        <h3 className="font-bold text-lg text-ink">Phân tích lỗ hổng kiến thức</h3>
      </div>
      <p className="text-sm text-ink-muted mb-6">
        Hệ thống phát hiện các chủ đề bạn thường xuyên trả lời sai trong 5 bài gần nhất. Hãy ưu tiên ôn tập để cải thiện điểm số:
      </p>

      <div className="space-y-4">
        {gaps.map((gap, index) => {
          const theme = getGapColorTheme(gap.errorRate);
          const percent = Math.round(gap.errorRate * 100);

          return (
            <div key={index} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-5 rounded-xl border ${theme.border} ${theme.lightBg} transition-all hover:shadow-md`}>
              <div className="w-full sm:w-2/3 flex-1">
                <h4 className="font-bold text-ink mb-2 text-base">{gap.topic}</h4>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium mb-3">
                  <span className={theme.text}>Sai {gap.incorrectCount}/{gap.totalCount} lần</span>
                  <span className="text-ink-muted">Tỷ lệ lỗi: {percent}%</span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-line rounded-full h-2 shadow-inner overflow-hidden">
                  <div className={`h-2 rounded-full ${theme.bg} transition-all duration-1000 ease-out`} style={{ width: `${percent}%` }}></div>
                </div>
              </div>

              {gap.referenceLessonId ? (
                <a 
                  href={`/learn/${gap.referenceLessonId}${gap.videoTimestamp ? `?seek=${gap.videoTimestamp}` : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-surface border border-line shadow-sm text-ink font-semibold text-sm hover:border-accent hover:text-accent transition-all group"
                >
                  <PlayCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Ôn tập lý thuyết
                </a>
              ) : (
                <a
                  href={`/learn/${courseId}?tab=materials`}
                  className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-surface border border-line shadow-sm text-ink font-semibold text-sm hover:bg-surface-hover transition-all"
                  title="Chủ đề này thuộc bài đánh giá tổng hợp. Hãy xem lại toàn bộ học liệu."
                >
                  <Lightbulb className="w-4 h-4 text-ink-muted" />
                  Kiến thức tổng hợp
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
