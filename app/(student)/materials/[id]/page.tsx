'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import Link from 'next/link';
import { useMaterialDetail } from '@/hooks/useMaterials';
import { MermaidViewer } from '@/components/materials/MermaidViewer';
import { QuizViewer } from '@/components/materials/QuizViewer';
import { FlashcardViewer } from '@/components/materials/FlashcardViewer';
import { FlashcardStudyMode } from '@/components/materials/FlashcardStudyMode';
import { QuizPersonalEditor } from '@/components/materials/QuizPersonalEditor';
import { flashcardsApi } from '@/lib/api/flashcards';
import { ApiError, apiBlob } from '@/lib/api/client';
import { Download, Upload, FileText } from 'lucide-react';

export default function MaterialDetailPage() {
  const t = useTranslations('pages.materialDetail');
  const router = useRouter();
  const params = useParams();

  // Trích xuất id an toàn, tránh lỗi NaN khi params chưa sẵn sàng
  const rawId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  const id = rawId ? Number(rawId) : 0;

  const searchParams = useSearchParams();
  const isOfficial = searchParams?.get('isOfficial') === 'true';

  // Chỉ fetch dữ liệu khi id hợp lệ (id > 0)
  const { data: material, isLoading, error } = useMaterialDetail(id);
  const [flashcardMode, setFlashcardMode] = useState<'study' | 'browse'>('study');
  const [quizMode, setQuizMode] = useState<'study' | 'browse'>('study');
  const [isImportingTxt, setIsImportingTxt] = useState(false);
  const [isExportingQuizPdf, setIsExportingQuizPdf] = useState<'blank' | 'cheatsheet' | null>(null);
  const queryClient = useQueryClient();

  const handleExportQuizPdf = async (quizId: number, mode: 'blank' | 'cheatsheet') => {
    setIsExportingQuizPdf(mode);
    try {
      const blob = await apiBlob(`/api/v1/quizzes/${quizId}/export-pdf?mode=${mode}`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quiz-${quizId}-${mode}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('exportPdfError'));
    } finally {
      setIsExportingQuizPdf(null);
    }
  };

  const handleImportTxt = async (file: File) => {
    setIsImportingTxt(true);
    try {
      const result = await flashcardsApi.importFromTxt(id, file);
      if (result.importedCount > 0) {
        toast.success(t('imported', { count: result.importedCount }));
        queryClient.invalidateQueries({ queryKey: ['materials', 'detail', id] });
      }
      if (result.errors.length > 0) {
        toast.error(t('importErrors', { count: result.errors.length, samples: result.errors.slice(0, 3).join('; '), more: result.errors.length > 3 ? '...' : '' }));
      }
      if (result.importedCount === 0 && result.errors.length === 0) {
        toast.error(t('importEmpty'));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('importFail'));
    } finally {
      setIsImportingTxt(false);
    }
  };

  if (!id || isLoading) {
    return (
      <div className="min-h-dvh bg-surface p-8 text-center text-ink-muted">
        {t('loading')}
      </div>
    );
  }

  if (error || !material) {
    const isNotFound = error instanceof ApiError && error.status === 404;
    const errorMessage = isNotFound 
      ? t('removed') 
      : (error instanceof ApiError ? error.message : t('notFound'));

    return (
      <div className="min-h-dvh bg-surface p-8 flex items-center justify-center">
        <div className="shell max-w-md text-center py-12 px-6 bg-surface-raised rounded-2xl shadow-sm border border-line">
          <div className="w-16 h-16 bg-streak-bg text-warning rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            {isNotFound ? '📦' : '⚠️'}
          </div>
          <h2 className="text-lg font-bold text-ink mb-2">
            {isNotFound ? t('unavailableTitle') : t('loadErrorTitle')}
          </h2>
          <p className="text-sm text-ink-muted mb-8 leading-relaxed">
            {errorMessage}
          </p>
          <div className="flex justify-center space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2 text-sm font-semibold text-ink bg-tint hover:bg-line-soft rounded-xl transition-colors"
            >
              {t('back')}
            </button>
            <Link 
              href="/courses" 
              className="px-5 py-2 text-sm font-semibold text-white bg-accent hover:bg-accent-dark rounded-xl shadow-sm transition-colors"
            >
              {t('toHome')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface">
      <div className="shell py-8">
        <div className="mb-6 flex justify-between items-end border-b border-line pb-4">
          <div>
            <div className="flex space-x-4 mb-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="text-sm text-ink-muted hover:text-ink transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                {t('backPlain')}
              </button>
              <span className="text-line">|</span>
              <Link href="/courses" className="text-sm text-ink-muted hover:text-accent transition-colors flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                {t('home')}
              </Link>
            </div>
            <h1 className="font-display text-2xl font-bold text-ink">
              {t('heading', { type: material.materialType === 'MINDMAP' ? t('typeMindmap') : material.materialType === 'FLASHCARD' ? t('typeFlashcard') : material.materialType, version: material.versionNo })}
            </h1>
            <p className="text-sm text-ink-muted mt-1">
              {t('statusLabel')} <span className="font-semibold text-success">{material.status}</span>
              <span className="mx-2">•</span>
              {t('createdAt', { date: new Date(material.createdAt).toLocaleString('vi-VN') })}
            </p>
          </div>
          <div>
            <span className="inline-block px-3 py-1 bg-surface-hover border border-line rounded-full text-xs font-semibold text-ink-muted uppercase">
              {material.language}
            </span>
          </div>
        </div>

        {material.materialType === 'MINDMAP' && material.mermaidCode ? (
          <div className="card p-6">
            <h2 className="text-lg font-bold font-display mb-4">{t('diagram')}</h2>
            <MermaidViewer chart={material.mermaidCode} readOnly={isOfficial} />
          </div>
        ) : material.materialType === 'QUIZ' ? (
          <div className="py-4">
            {!isOfficial && material.quizQuestions && material.quizQuestions.length > 0 && (
              <div className="flex items-center justify-between gap-4 mb-6 border-b border-line pb-3">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuizMode('study')}
                    className={`pb-2 text-sm font-bold border-b-2 transition-colors ${quizMode === 'study' ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink'
                      }`}
                  >
                    {t('quizStudy')}
                  </button>
                  <button
                    onClick={() => setQuizMode('browse')}
                    className={`pb-2 text-sm font-bold border-b-2 transition-colors ${quizMode === 'browse' ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink'
                      }`}
                  >
                    {t('quizEdit')}
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => material.quizId && handleExportQuizPdf(material.quizId, 'blank')}
                    disabled={isExportingQuizPdf !== null}
                    title={t('exportBlankTitle')}
                    className="flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4" strokeWidth={1.75} />
                    {isExportingQuizPdf === 'blank' ? t('exporting') : t('blankPaper')}
                  </button>
                  <button
                    onClick={() => material.quizId && handleExportQuizPdf(material.quizId, 'cheatsheet')}
                    disabled={isExportingQuizPdf !== null}
                    title={t('exportCheatTitle')}
                    className="flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4" strokeWidth={1.75} />
                    {isExportingQuizPdf === 'cheatsheet' ? t('exporting') : t('cheatsheet')}
                  </button>
                </div>
              </div>
            )}
            
            {material.quizQuestions && material.quizQuestions.length > 0 ? (
              quizMode === 'study' || isOfficial ? (
                <QuizViewer questions={material.quizQuestions} quizId={material.id} />
              ) : (
                <QuizPersonalEditor questions={material.quizQuestions} quizId={material.id} />
              )
            ) : (
              <div className="card p-6 text-center text-ink-muted">
                {material.status === 'COMPLETED' ? t('quizEmptyDone') : t('quizProcessing')}
              </div>
            )}
          </div>
        ) : material.materialType === 'FLASHCARD' ? (
          <div className="py-4">
            {material.flashcards && material.flashcards.length > 0 ? (
              <>
                {/* Mode toggle & Export */}
                <div className="flex items-center justify-between mb-6 border-b border-line pb-3">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setFlashcardMode('study')}
                      className={`pb-2 text-sm font-bold border-b-2 transition-colors ${flashcardMode === 'study' ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink'
                        }`}
                    >
                      {t('flashStudy')}
                    </button>
                    <button
                      onClick={() => setFlashcardMode('browse')}
                      className={`pb-2 text-sm font-bold border-b-2 transition-colors ${flashcardMode === 'browse' ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink'
                        }`}
                    >
                      {t('flashBrowse')}
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        if (!material?.flashcards) return;
                        const content = material.flashcards.map(c => `${c.frontText.replace(/\t/g, ' ')}\t${c.backText.replace(/\n/g, ' ')}`).join('\n');
                        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `flashcards_${material.id}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      title={t('exportTxtTitle')}
                      className="text-sm font-semibold text-accent hover:underline flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" strokeWidth={1.75} /> {t('export')}
                    </button>
                    <input
                      id="anki-txt-import"
                      type="file"
                      accept=".txt"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (file) handleImportTxt(file);
                      }}
                    />
                    <label
                      htmlFor="anki-txt-import"
                      title={t('importTxtTitle')}
                      className="text-sm font-semibold text-accent hover:underline flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" strokeWidth={1.75} /> {isImportingTxt ? t('importing') : t('import')}
                    </label>
                  </div>
                </div>

                {flashcardMode === 'study' ? (
                  <FlashcardStudyMode
                    deckName={material.title || t('defaultDeckName')}
                    cards={material.flashcards.map(c => ({
                      id: c.id,
                      frontText: c.frontText,
                      backText: c.backText,
                      nextReviewAt: c.nextReviewAt || null,
                      intervalDays: c.intervalDays,
                      repetitions: c.repetitions,
                      easiness: c.easiness,
                      isDue: c.isDue,
                    }))}
                    language={material.language}
                    onFinish={() => router.back()}
                  />
                ) : (
                  <FlashcardViewer flashcards={material.flashcards} language={material.language} deckId={material.id} readOnly={isOfficial} />
                )}
              </>
            ) : (
              <div className="card p-6 text-center text-ink-muted">
                {material.status === 'COMPLETED' ? t('flashEmptyDone') : t('flashProcessing')}
              </div>
            )}
          </div>
        ) : (
          <div className="card p-6 text-center text-ink-muted">
            <p>{t('unsupported')}</p>
          </div>
        )}
      </div>
    </div>
  );
}