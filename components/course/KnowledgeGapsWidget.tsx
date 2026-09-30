'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';
import { AlertTriangle, Lightbulb, PlayCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

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

  if (isLoading) return <div className="py-4 text-center"><Spinner className="mx-auto" /></div>;
  if (error || !gaps) return null;

  if (gaps.length === 0) {
    return (
      <div className="card p-5 mb-6 bg-success/5 border border-success/20">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-success/10 rounded-full text-success mt-0.5">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-success-dark mb-1">Kiến thức vững vàng!</h3>
            <p className="text-sm text-ink-muted">Bạn đang làm rất tốt. Hãy tiếp tục phát huy và học các bài mới nhé!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 mb-6 border border-line-soft shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-accent" />
        <h3 className="font-bold text-lg text-ink">Phân tích lỗ hổng kiến thức</h3>
      </div>
      <p className="text-sm text-ink-muted mb-4">
        Hệ thống phát hiện một số chủ đề bạn thường xuyên trả lời sai trong 5 lần nộp bài gần nhất. Hãy ôn tập lại để củng cố kiến thức:
      </p>

      <div className="space-y-3">
        {gaps.map((gap, index) => (
          <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-surface-hover border border-line">
            <div>
              <h4 className="font-bold text-ink mb-1">{gap.topic}</h4>
              <div className="flex gap-4 text-xs text-ink-muted font-medium">
                <span className="text-danger font-semibold">Sai {gap.incorrectCount}/{gap.totalCount} lần</span>
                <span>Tỷ lệ lỗi: {Math.round(gap.errorRate * 100)}%</span>
              </div>
            </div>
            {gap.referenceLessonId && (
              <a 
                href={`/learn/${gap.referenceLessonId}${gap.videoTimestamp ? `?seek=${gap.videoTimestamp}` : ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold text-sm hover:bg-accent/20 transition-colors"
              >
                <PlayCircle className="w-4 h-4" />
                Ôn tập lý thuyết
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
