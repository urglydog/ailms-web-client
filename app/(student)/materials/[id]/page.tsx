'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';
import { useMaterialDetail } from '@/hooks/useMaterials';
import { MermaidViewer } from '@/components/materials/MermaidViewer';
import { QuizViewer } from '@/components/materials/QuizViewer';
import { FlashcardViewer } from '@/components/materials/FlashcardViewer';
import { FlashcardStudyMode } from '@/components/materials/FlashcardStudyMode';
import { QuizPersonalEditor } from '@/components/materials/QuizPersonalEditor';
import { flashcardsApi } from '@/lib/api/flashcards';
import { ApiError } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';

export default function MaterialDetailPage() {
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
      const res = await fetch(`/api/v1/quizzes/${quizId}/export-pdf?mode=${mode}`, {
        headers: { Authorization: `Bearer ${getAccessToken() ?? ''}` },
      });
      if (!res.ok) throw new Error('Không xuất được PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quiz-${quizId}-${mode}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Có lỗi khi xuất PDF, vui lòng thử lại.');
    } finally {
      setIsExportingQuizPdf(null);
    }
  };

  const handleImportTxt = async (file: File) => {
    setIsImportingTxt(true);
    try {
      const result = await flashcardsApi.importFromTxt(id, file);
      if (result.importedCount > 0) {
        toast.success(`Đã thêm ${result.importedCount} thẻ từ file.`);
        queryClient.invalidateQueries({ queryKey: ['materials', 'detail', id] });
      }
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} dòng lỗi: ${result.errors.slice(0, 3).join('; ')}${result.errors.length > 3 ? '...' : ''}`);
      }
      if (result.importedCount === 0 && result.errors.length === 0) {
        toast.error('File .txt không có dòng dữ liệu hợp lệ.');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi tải file .txt');
    } finally {
      setIsImportingTxt(false);
    }
  };

  if (!id || isLoading) {
    return (
      <div className="min-h-dvh bg-surface p-8 text-center text-ink-muted">
        Đang tải chi tiết học liệu...
      </div>
    );
  }

  if (error || !material) {
    const isNotFound = error instanceof ApiError && error.status === 404;
    const errorMessage = isNotFound 
      ? 'Bài tập này đã được giảng viên gỡ bỏ hoặc cập nhật. Phiên làm việc kết thúc.' 
      : (error instanceof ApiError ? error.message : 'Không tìm thấy học liệu này hoặc bạn không có quyền xem.');

    return (
      <div className="min-h-dvh bg-surface p-8 flex items-center justify-center">
        <div className="shell max-w-md text-center py-12 px-6 bg-white rounded-2xl shadow-sm border border-line">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            {isNotFound ? '📦' : '⚠️'}
          </div>
          <h2 className="text-lg font-bold text-ink mb-2">
            {isNotFound ? 'Học liệu không còn khả dụng' : 'Không thể tải dữ liệu'}
          </h2>
          <p className="text-sm text-ink-muted mb-8 leading-relaxed">
            {errorMessage}
          </p>
          <div className="flex justify-center space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              ← Quay lại
            </button>
            <Link 
              href="/courses" 
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
            >
              Về trang chủ
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
                Quay lại
              </button>
              <span className="text-line">|</span>
              <Link href="/courses" className="text-sm text-ink-muted hover:text-accent transition-colors flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                Trang chủ
              </Link>
            </div>
            <h1 className="font-display text-2xl font-bold text-ink">
              {material.materialType === 'MINDMAP' ? 'Sơ đồ tư duy' : material.materialType === 'FLASHCARD' ? 'Bộ thẻ Flashcard' : material.materialType} - Phiên bản {material.versionNo}
            </h1>
            <p className="text-sm text-ink-muted mt-1">
              Trạng thái: <span className="font-semibold text-green-600">{material.status}</span>
              <span className="mx-2">•</span>
              Ngày tạo: {new Date(material.createdAt).toLocaleString('vi-VN')}
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
            <h2 className="text-lg font-bold font-display mb-4">Sơ đồ</h2>
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
                    📖 Làm Bài (Study Mode)
                  </button>
                  <button
                    onClick={() => setQuizMode('browse')}
                    className={`pb-2 text-sm font-bold border-b-2 transition-colors ${quizMode === 'browse' ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink'
                      }`}
                  >
                    📋 Chỉnh Sửa Câu Hỏi (Edit Mode)
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleExportQuizPdf(material.id, 'blank')}
                    disabled={isExportingQuizPdf !== null}
                    className="text-sm font-semibold text-accent hover:underline disabled:opacity-50"
                  >
                    {isExportingQuizPdf === 'blank' ? 'Đang xuất...' : '📄 Xuất đề trắng (PDF)'}
                  </button>
                  <button
                    onClick={() => handleExportQuizPdf(material.id, 'cheatsheet')}
                    disabled={isExportingQuizPdf !== null}
                    className="text-sm font-semibold text-accent hover:underline disabled:opacity-50"
                  >
                    {isExportingQuizPdf === 'cheatsheet' ? 'Đang xuất...' : '📄 Xuất cheatsheet (PDF)'}
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
                {material.status === 'COMPLETED' ? 'Bài trắc nghiệm này không có câu hỏi nào.' : 'Bài trắc nghiệm đang được AI xử lý, vui lòng quay lại sau...'}
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
                      📖 Ôn tập (Study Mode)
                    </button>
                    <button
                      onClick={() => setFlashcardMode('browse')}
                      className={`pb-2 text-sm font-bold border-b-2 transition-colors ${flashcardMode === 'browse' ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink'
                        }`}
                    >
                      📋 Duyệt tất cả (Browse)
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
                      className="text-sm font-semibold text-accent hover:underline flex items-center gap-1"
                    >
                      📥 Xuất ra file Anki/Quizlet
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
                      className="text-sm font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {isImportingTxt ? 'Đang nhập...' : '📤 Nhập từ file Anki/Quizlet'}
                    </label>
                  </div>
                </div>

                {flashcardMode === 'study' ? (
                  <FlashcardStudyMode
                    deckName={material.title || 'Bộ thẻ Flashcard'}
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
                {material.status === 'COMPLETED' ? 'Bộ flashcard này không có thẻ nào.' : 'Bộ flashcard đang được AI xử lý, vui lòng quay lại sau...'}
              </div>
            )}
          </div>
        ) : (
          <div className="card p-6 text-center text-ink-muted">
            <p>Loại học liệu này chưa hỗ trợ hiển thị hoặc bị lỗi khi sinh.</p>
          </div>
        )}
      </div>
    </div>
  );
}