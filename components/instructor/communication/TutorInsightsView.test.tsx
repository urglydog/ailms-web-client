import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/renderWithIntl';
import type { CourseInsight } from '@/lib/api/tutorInsights';
import { TutorInsightsView } from './TutorInsightsView';

const mutate = vi.fn();
let insight: CourseInsight | undefined;

vi.mock('@/hooks/useDashboard', () => ({
  useInstructorCourseOptions: () => ({ data: [{ id: 5, title: 'Java' }], isLoading: false }),
}));
vi.mock('@/hooks/useTutorInsights', () => ({
  useTutorInsights: () => ({ data: insight, isLoading: false, isError: false }),
  useRefreshInsightSummary: () => ({ mutate, isPending: false }),
}));

const base: CourseInsight = {
  courseId: 5,
  windowDays: 90,
  totalQuestions: 0,
  learnerCount: 0,
  lessons: [],
  poorTopics: [],
  summary: { status: 'NONE', text: null, actions: [], generatedAt: null },
};

describe('TutorInsightsView', () => {
  beforeEach(() => mutate.mockReset());

  it('trạng thái rỗng khi chưa có câu hỏi', () => {
    insight = base;
    renderWithIntl(<TutorInsightsView />);
    expect(screen.getByText('Chưa có học viên nào hỏi Gia sư AI trong 90 ngày qua.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Tạo tóm tắt/ })).not.toBeInTheDocument();
  });

  it('hiện chủ đề, bài bất thường, câu trả lời chưa tốt và tóm tắt AI', () => {
    insight = {
      ...base,
      totalQuestions: 9,
      learnerCount: 6,
      lessons: [
        { lessonId: 1, lessonTitle: 'Vòng lặp', questionCount: 7, learnerCount: 5, unusual: true, poorCount: 2,
          topics: [{ label: 'vòng lặp', learnerCount: 3, questionCount: 4 }] },
      ],
      poorTopics: [{ lessonId: 1, lessonTitle: 'Vòng lặp', label: 'con trỏ', reason: 'NOT_COVERED', learnerCount: 2 }],
      summary: { status: 'READY', text: 'Học viên vướng ở vòng lặp.', actions: ['Thêm ví dụ while'], generatedAt: '2026-11-26T02:30:00' },
    };
    renderWithIntl(<TutorInsightsView />);
    expect(screen.getByText('Nhiều câu hỏi bất thường')).toBeInTheDocument();
    expect(screen.getByText('vòng lặp')).toBeInTheDocument();
    expect(screen.getByText(/ngoài nội dung bài/)).toBeInTheDocument();
    expect(screen.getByText('Học viên vướng ở vòng lặp.')).toBeInTheDocument();
    expect(screen.getByText('Thêm ví dụ while')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Làm mới/ }));
    expect(mutate).toHaveBeenCalled();
  });
});
