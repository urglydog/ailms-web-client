'use client';

import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { gradebookApi, GradebookRes, AttemptInspectionRes } from '@/lib/api/gradebook';


export default function InstructorGradebookPage() {
  const t = useTranslations('instructor.gradebook');
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.id);

  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null);

  const { data: gradebook, isLoading, error } = useQuery<GradebookRes>({
    queryKey: ['instructor-gradebook', courseId],
    queryFn: () => gradebookApi.getGradebook(courseId),
    enabled: !!courseId,
  });

  const { data: attemptDetail, isLoading: isLoadingAttempt } = useQuery<AttemptInspectionRes>({
    queryKey: ['instructor-attempt-detail', courseId, selectedAttemptId],
    queryFn: () => gradebookApi.getAttemptDetail(courseId, selectedAttemptId!),
    enabled: !!courseId && !!selectedAttemptId,
  });

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-surface p-8 flex items-center justify-center">
        <div className="text-ink-muted animate-pulse font-medium">{t('loading')}</div>
      </div>
    );
  }

  if (error || !gradebook) {
    return (
      <div className="min-h-dvh bg-surface p-8">
        <div className="card p-8 text-center max-w-md mx-auto">
          <h2 className="text-lg font-bold text-danger mb-2">{t('loadError')}</h2>
          <p className="text-sm text-ink-muted mb-4">{t('loadErrorHint')}</p>
          <button 
            onClick={() => router.back()}
            className="bg-ink text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            {t('back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-line pb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-ink-muted mb-1">
              <button onClick={() => router.push('/instructor')} className="hover:underline">{t('crumbInstructor')}</button>
              <span>/</span>
              <button onClick={() => router.push(`/instructor/courses/${courseId}/edit/materials`)} className="hover:underline text-accent">{t('crumbMaterials')}</button>
              <span>/</span>
              <span>{t('crumbGradebook')}</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-ink">
              {t('title')} <span className="text-accent">{gradebook.courseTitle}</span>
            </h1>
          </div>
          <button
            onClick={() => router.push(`/instructor/courses/${courseId}/edit/materials`)}
            className="bg-ink text-white px-4 py-2 rounded-xl text-sm font-bold shadow hover:bg-ink/90 transition"
          >
            {t('crumbMaterials')}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-6 border-l-4 border-accent">
            <div className="text-xs font-bold uppercase tracking-wider text-ink-muted">{t('totalStudents')}</div>
            <div className="text-3xl font-extrabold text-ink mt-2">{gradebook.totalStudents} <span className="text-sm font-normal text-ink-muted">{t('students')}</span></div>
          </div>
          <div className="card p-6 border-l-4 border-success">
            <div className="text-xs font-bold uppercase tracking-wider text-ink-muted">{t('avgScore')}</div>
            <div className="text-3xl font-extrabold text-success mt-2">{gradebook.averageScore} <span className="text-sm font-normal text-ink-muted">/10</span></div>
          </div>
          <div className="card p-6 border-l-4 border-warning">
            <div className="text-xs font-bold uppercase tracking-wider text-ink-muted">{t('passRate')}</div>
            <div className="text-3xl font-extrabold text-warning mt-2">{gradebook.passRatePercentage}%</div>
          </div>
          <div className="card p-6 border-l-4 border-accent">
            <div className="text-xs font-bold uppercase tracking-wider text-ink-muted">{t('totalAttempts')}</div>
            <div className="text-3xl font-extrabold text-accent-dark mt-2">{gradebook.totalAttempts} <span className="text-sm font-normal text-ink-muted">{t('attemptsUnit')}</span></div>
          </div>
        </div>

        {/* Gradebook Table */}
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-line flex justify-between items-center bg-surface-hover">
            <h2 className="font-display font-bold text-lg text-ink">{t('detailList')}</h2>
            {!gradebook.hasOfficialQuiz && (
              <span className="text-xs font-semibold text-warning bg-streak-bg px-3 py-1 rounded-full border border-warning/30">
                {t('noOfficialQuiz')}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-ink-muted text-xs uppercase font-bold border-b border-line">
                <tr>
                  <th className="px-6 py-4">{t('colStudent')}</th>
                  <th className="px-6 py-4 text-center">{t('colAttempts')}</th>
                  <th className="px-6 py-4 text-center">{t('colBest')}</th>
                  <th className="px-6 py-4 text-center">{t('colLatest')}</th>
                  <th className="px-6 py-4">{t('colSubmitted')}</th>
                  <th className="px-6 py-4 text-center">{t('colStatus')}</th>
                  <th className="px-6 py-4 text-right">{t('colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {gradebook.students.map((student) => (
                  <tr key={student.userId} className="hover:bg-surface-hover transition-colors">
                    <td className="px-6 py-4 font-medium">
                      <div className="text-ink font-bold">{student.fullName}</div>
                      <div className="text-xs text-ink-muted">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold">
                      {student.attemptCount > 0 ? (
                        <span className="bg-tint text-accent-dark px-2.5 py-1 rounded-full text-xs font-bold">
                          {t('attemptCount', { count: student.attemptCount })}
                        </span>
                      ) : (
                        <span className="text-ink-muted">{t('notTaken')}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-base">
                      {student.attemptCount > 0 ? (
                        <span className={student.passed ? 'text-success' : 'text-danger'}>
                          {student.highestScore}
                        </span>
                      ) : (
                        <span className="text-ink-muted">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold">
                      {student.attemptCount > 0 ? student.latestScore : '-'}
                    </td>
                    <td className="px-6 py-4 text-xs text-ink-muted">
                      {student.latestSubmittedAt ? new Date(student.latestSubmittedAt).toLocaleString('vi-VN') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {student.attemptCount === 0 ? (
                        <span className="bg-tint text-ink-muted px-2.5 py-1 rounded-full text-xs font-semibold">{t('notJoined')}</span>
                      ) : student.passed ? (
                        <span className="bg-success-tint text-success-ink px-2.5 py-1 rounded-full text-xs font-bold border border-success/30">{t('passed')}</span>
                      ) : (
                        <span className="bg-danger/5 text-danger px-2.5 py-1 rounded-full text-xs font-bold border border-danger/30">{t('failed')}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {student.latestAttemptId ? (
                        <button
                          onClick={() => setSelectedAttemptId(student.latestAttemptId)}
                          className="bg-accent text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-accent-dark transition flex items-center gap-1 ml-auto"
                        >
                          {t('viewAttempt')}
                        </button>
                      ) : (
                        <span className="text-xs text-ink-muted italic">{t('noSubmission')}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {gradebook.students.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-ink-muted">
                      {t('noStudents')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Attempt Inspection Modal */}
      {selectedAttemptId && (
        <Modal open onClose={() => setSelectedAttemptId(null)} bare ariaLabel={t('modalAria')} closeOnBackdrop={false} className="card w-full max-w-3xl max-h-[90vh] flex flex-col p-6 shadow-2xl bg-surface-raised rounded-2xl my-8">
            <div className="flex justify-between items-center border-b border-line pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                  <span>{t('modalTitle')}</span>
                  <span className="text-accent">{attemptDetail?.studentName}</span>
                </h3>
                <p className="text-xs text-ink-muted">{attemptDetail?.studentEmail} • {t('submittedAt')} {attemptDetail?.submittedAt ? new Date(attemptDetail.submittedAt).toLocaleString('vi-VN') : ''}</p>
              </div>
              <button 
                onClick={() => setSelectedAttemptId(null)}
                className="text-ink-muted hover:text-ink font-bold text-xl px-2"
              >
                ✕
              </button>
            </div>

            {isLoadingAttempt ? (
              <div className="py-12 text-center text-ink-muted animate-pulse font-medium">{t('loadingAttempt')}</div>
            ) : attemptDetail ? (
              <div className="overflow-y-auto pr-2 space-y-6 flex-1">
                {/* Result Overview */}
                <div className="bg-surface p-4 rounded-xl flex items-center justify-around border border-line">
                  <div className="text-center">
                    <div className="text-xs font-semibold text-ink-muted uppercase">{t('score')}</div>
                    <div className="text-2xl font-extrabold text-accent">{attemptDetail.score}/10</div>
                  </div>
                  <div className="h-8 w-px bg-line"></div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-ink-muted uppercase">{t('correctCount')}</div>
                    <div className="text-2xl font-extrabold text-success">{attemptDetail.correctCount}/{attemptDetail.totalQuestions}</div>
                  </div>
                </div>

                {/* Answers Inspection List */}
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-ink uppercase tracking-wider">{t('perQuestion')}</h4>
                  {attemptDetail.answers.map((q, idx) => (
                    <div key={q.questionId} className={`p-4 rounded-xl border-l-4 ${q.isCorrect ? 'border-success bg-success-tint/20' : 'border-danger bg-danger/5'} border border-line`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-sm text-ink">{t('questionNo', { n: idx + 1 })} {q.questionContent}</div>
                        {q.isCorrect ? (
                          <span className="text-success-ink bg-success-tint px-2.5 py-0.5 rounded-full text-xs font-bold">{t('correct')}</span>
                        ) : (
                          <span className="text-danger bg-danger/10 px-2.5 py-0.5 rounded-full text-xs font-bold">Sai ✕</span>
                        )}
                      </div>

                      <div className="space-y-2 mt-3">
                        {q.options.map(opt => {
                          const isSelected = q.selectedOptionId === opt.id;
                          const isCorrect = q.correctOptionId === opt.id || opt.isCorrect;

                          let style = "p-3 rounded-lg text-xs font-medium border transition-colors flex items-center justify-between ";
                          if (isCorrect && isSelected) {
                            style += "border-success bg-success-tint text-success-ink font-bold";
                          } else if (isCorrect) {
                            style += "border-success bg-success-tint text-success-ink font-semibold";
                          } else if (isSelected) {
                            style += "border-danger bg-danger/10 text-danger font-bold";
                          } else {
                            style += "border-line bg-surface text-ink-muted opacity-70";
                          }

                          return (
                            <div key={opt.id} className={style}>
                              <span>{opt.content}</span>
                              <div className="flex items-center gap-1 text-[11px]">
                                {isSelected && <span className="bg-ink text-white px-2 py-0.5 rounded font-bold">{t('learnerChoice')}</span>}
                                {isCorrect && <span className="bg-success text-white px-2 py-0.5 rounded font-bold">{t('correctAnswer')}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6 pt-4 border-t border-line text-right">
              <button 
                onClick={() => setSelectedAttemptId(null)}
                className="bg-ink text-white font-bold px-6 py-2 rounded-xl text-sm hover:bg-ink/90"
              >
                {t('close')}
              </button>
            </div>
          </Modal>
      )}
    </div>
  );
}
