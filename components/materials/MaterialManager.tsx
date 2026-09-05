'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCourseMaterials, useRequestMaterial, useAvailableLanguages, useCourseChapters } from '@/hooks/useMaterials';
import { materialsApi, type MaterialType, type ScopeType, type InstructorMaterial } from '@/lib/api/materials';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import Link from 'next/link';

export function MaterialManager({ courseId }: { courseId: number }) {
  const { data: materials, isLoading, refetch } = useCourseMaterials(courseId);
  const { data: availableLanguages } = useAvailableLanguages(courseId);
  const { data: chapters } = useCourseChapters(courseId);
  const requestMutation = useRequestMaterial();

  const { data: officialMaterials } = useQuery<InstructorMaterial[]>({
    queryKey: ['official-materials', courseId],
    queryFn: () => materialsApi.getInstructorMaterials(courseId),
    enabled: !!courseId,
  });

  const [materialType, setMaterialType] = useState<MaterialType>('MINDMAP');
  const [scopeType, setScopeType] = useState<ScopeType>('WHOLE_COURSE');
  const [scopeRefId, setScopeRefId] = useState<number | undefined>(undefined);
  const [customLessonIds, setCustomLessonIds] = useState<number[]>([]);
  const [language, setLanguage] = useState<string>('');

  // Auto-select first language if available
  if (availableLanguages && availableLanguages.length > 0 && language === '') {
    setLanguage(availableLanguages[0]!);
  }

  const handleRequest = () => {
    if (!language) {
      toast.error('Vui lòng chọn ngôn ngữ');
      return;
    }
    
    requestMutation.mutate(
      {
        courseId,
        materialType,
        language,
        scopeType,
        scopeRefId: scopeType === 'CHAPTER' ? scopeRefId : undefined,
        customLessonIds: scopeType === 'CUSTOM_LESSONS' ? customLessonIds : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Đã gửi yêu cầu sinh học liệu. AI đang xử lý!');
          setCustomLessonIds([]);
        },
        onError: (err) => {
          if (err instanceof ApiError) {
            toast.error(err.message);
          } else {
            toast.error('Có lỗi xảy ra khi tạo học liệu');
          }
        },
      }
    );
  };

  const toggleLesson = (id: number) => {
    setCustomLessonIds(prev => 
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  const getLanguageName = (code: string) => {
    try {
      const displayNames = new Intl.DisplayNames(['vi'], { type: 'language' });
      const name = displayNames.of(code) || code;
      return name.charAt(0).toUpperCase() + name.slice(1);
    } catch {
      if (code === 'vi-VN' || code === 'vi') return 'Tiếng Việt';
      if (code === 'en-US' || code === 'en') return 'Tiếng Anh';
      if (code.startsWith('zh-')) return 'Tiếng Trung';
      return code;
    }
  };

  const filteredOfficial = officialMaterials?.filter(m => m.isOfficial);
  const [activeTab, setActiveTab] = useState<'OFFICIAL' | 'PERSONAL'>('OFFICIAL');

  const personalTabContent = (
    <>
      <div className="card p-6 mb-8">
        <h2 className="font-display text-xl font-bold mb-4">Tạo học liệu AI mới</h2>
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div>
            <label className="block text-sm font-semibold mb-1">Loại học liệu</label>
            <select
              className="w-full rounded-md border border-line p-2 text-sm"
              value={materialType}
              onChange={(e) => setMaterialType(e.target.value as MaterialType)}
            >
              <option value="MINDMAP">Sơ đồ tư duy (Mindmap)</option>
              <option value="QUIZ">Trắc nghiệm (Quiz)</option>
              <option value="FLASHCARD">Flashcard</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Phạm vi</label>
            <select
              className="w-full rounded-md border border-line p-2 text-sm"
              value={scopeType}
              onChange={(e) => {
                setScopeType(e.target.value as ScopeType);
                if (e.target.value === 'CHAPTER' && chapters && chapters.length > 0) {
                  setScopeRefId(chapters[0]?.id);
                }
              }}
            >
              <option value="WHOLE_COURSE">Toàn bộ khóa học</option>
              <option value="CHAPTER">Từng chương</option>
              <option value="CUSTOM_LESSONS">Tùy chọn bài học</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Ngôn ngữ</label>
            <select
              className="w-full rounded-md border border-line p-2 text-sm"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={!availableLanguages || availableLanguages.length === 0}
            >
              {availableLanguages && availableLanguages.length > 0 ? (
                availableLanguages.map(lang => (
                  <option key={lang} value={lang}>{getLanguageName(lang)}</option>
                ))
              ) : (
                <option value="">Chưa có transcript</option>
              )}
            </select>
          </div>
        </div>
      
        {/* Render selection UI for Chapter or Custom Lessons */}
        {scopeType === 'WHOLE_COURSE' && chapters && chapters.length > 0 && (
          <div className="mb-6 p-4 bg-surface-hover rounded-md text-sm border border-line">
            <span className="font-semibold text-ink block mb-2">Học liệu sẽ được tổng hợp từ các video đã có lồng tiếng sau:</span>
            <ul className="list-disc pl-5 text-ink-muted flex flex-col gap-1">
              {chapters.map(c => (
                <li key={c.id}>
                  <span className="font-medium text-ink">{c.title}</span>: {c.lessons.map(l => l.title).join(', ')}
                </li>
              ))}
            </ul>
          </div>
        )}

        {scopeType === 'CHAPTER' && chapters && chapters.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-1">Chọn chương</label>
            <select
              className="w-full sm:w-1/3 rounded-md border border-line p-2 text-sm"
              value={scopeRefId || ''}
              onChange={(e) => setScopeRefId(Number(e.target.value))}
            >
              {chapters.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            {scopeRefId && (
              <div className="p-4 bg-surface-hover rounded-md text-sm border border-line mt-3">
                <span className="font-semibold text-ink block mb-2">Các video khả dụng trong chương này:</span>
                <ul className="list-disc pl-5 text-ink-muted">
                  {chapters.find(c => c.id === scopeRefId)?.lessons.map(l => (
                    <li key={l.id}>{l.title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {scopeType === 'CUSTOM_LESSONS' && chapters && (
          <div className="mb-6 border border-line rounded-md p-4 max-h-60 overflow-y-auto bg-surface-hover">
            <label className="block text-sm font-semibold mb-2">Tick chọn bài học</label>
            {chapters.map(chapter => (
              <div key={chapter.id} className="mb-3">
                <div className="font-medium text-ink mb-1">{chapter.title}</div>
                <div className="pl-4 flex flex-col gap-1">
                  {chapter.lessons.map(lesson => (
                    <label key={lesson.id} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input 
                        type="checkbox" 
                        checked={customLessonIds.includes(lesson.id)}
                        onChange={() => toggleLesson(lesson.id)}
                        className="rounded border-line text-accent focus:ring-accent"
                      />
                      <span className="text-ink-muted">{lesson.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleRequest}
          disabled={requestMutation.isPending || (!language && availableLanguages?.length === 0) || (scopeType === 'CUSTOM_LESSONS' && customLessonIds.length === 0)}
          className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
        >
          {requestMutation.isPending ? 'Đang gửi...' : '✨ Tạo học liệu'}
        </button>
      </div>

      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-xl font-bold">Lịch sử tạo cá nhân</h2>
          <button onClick={() => refetch()} className="text-sm text-accent hover:underline">
            Làm mới
          </button>
        </div>
        {isLoading ? (
          <p className="text-sm text-ink-muted">Đang tải...</p>
        ) : materials && materials.length > 0 ? (
          <div className="flex flex-col gap-3">
            {materials.map((m) => (
              <div key={m.id} className="flex items-center justify-between border border-line-soft rounded-lg p-4">
                <div>
                  <h3 className="font-semibold text-ink">
                    {m.materialType === 'MINDMAP' ? 'Sơ đồ tư duy' : m.materialType} - Phiên bản {m.versionNo}
                  </h3>
                  <p className="text-xs text-ink-muted mt-1">
                    Trạng thái:{' '}
                    {m.status === 'COMPLETED' ? (
                      <span className="text-green-600 font-medium">Hoàn thành</span>
                    ) : m.status === 'FAILED' ? (
                      <span className="text-red-600 font-medium">Lỗi</span>
                    ) : (
                      <span className="text-orange-500 font-medium">
                        {new Date().getTime() - new Date(m.createdAt).getTime() > 120000 
                          ? 'Đang quá tải (Vui lòng chờ thêm hoặc tạo lại)' 
                          : 'Đang xử lý (Vui lòng chờ)...'}
                      </span>
                    )}
                    <span className="mx-2">•</span>
                    {new Date(m.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                {m.status === 'COMPLETED' && (
                  <Link
                    href={`/materials/${m.id}`}
                    className="rounded-full bg-surface-hover px-4 py-2 text-sm font-semibold text-ink hover:bg-line-soft"
                  >
                    Xem chi tiết
                  </Link>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-muted">Chưa có học liệu cá nhân nào được tạo.</p>
        )}
      </div>
    </>
  );

  const renderOfficialItem = (item: InstructorMaterial) => {
    const now = new Date();
    const startTime = item.startTime ? new Date(item.startTime) : null;
    const endTime = item.endTime ? new Date(item.endTime) : null;
    
    const isBeforeStart = startTime ? now < startTime : false;
    const isAfterEnd = endTime ? now > endTime : false;
    const outOfAttempts = (item.maxAttempts && item.attemptCount !== undefined) ? item.attemptCount >= item.maxAttempts : false;

    return (
      <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 mb-3 bg-white border border-gray-200 rounded-md hover:border-gray-300 transition-colors">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-base">{item.title || 'Học liệu khóa học'}</h3>
            <span className="text-[10px] uppercase font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-sm">
              {item.materialType === 'QUIZ' ? 'Bài Thi' : item.materialType === 'FLASHCARD' ? 'Flashcard' : 'Mindmap'}
            </span>
            {item.isProctored && (
              <span className="text-[10px] font-semibold text-red-600 border border-red-200 bg-white px-2 py-0.5 rounded-sm">
                AI Proctored
              </span>
            )}
          </div>
          
          <div className="text-sm text-gray-600 flex flex-wrap gap-x-6 gap-y-1 mt-2">
            {item.materialType === 'QUIZ' && (
              <>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">Thời gian:</span>
                  <span className="font-medium text-gray-900">{item.durationMinutes ? `${item.durationMinutes} phút` : 'Không giới hạn'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">Số câu:</span>
                  <span className="font-medium text-gray-900">{item.randomPickCount || item.questionCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">Lượt thi:</span>
                  <span className="font-medium text-gray-900">
                    {item.attemptCount !== undefined ? `${item.attemptCount} / ` : ''}
                    {item.maxAttempts || '∞'}
                  </span>
                </div>
                {startTime && (
                  <div className="flex items-center gap-1 w-full sm:w-auto mt-1 sm:mt-0">
                    <span className="text-gray-400">Mở lúc:</span>
                    <span className="font-medium text-gray-900">{startTime.toLocaleString('vi-VN')}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        <div className="mt-4 sm:mt-0 sm:ml-4 shrink-0 w-full sm:w-auto flex flex-col sm:items-end">
          {item.materialType === 'QUIZ' && item.materialId ? (
            isBeforeStart ? (
              <button disabled className="w-full sm:w-auto bg-gray-50 text-gray-400 font-medium py-2 px-6 text-sm rounded border border-gray-200 cursor-not-allowed">
                Chưa mở
              </button>
            ) : isAfterEnd ? (
              <Link 
                href={`/exam/${item.materialId}?title=${encodeURIComponent(item.title || '')}&duration=${item.durationMinutes || ''}&attempts=${item.maxAttempts || ''}&count=${item.randomPickCount || item.questionCount || ''}&start=${item.startTime || ''}&end=${item.endTime || ''}&attemptCount=${item.attemptCount || 0}&proctored=${item.isProctored || false}`}
                className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-6 text-sm rounded border border-gray-300 transition-colors inline-block text-center"
              >
                Đã Đóng (Xem Lịch Sử)
              </Link>
            ) : outOfAttempts ? (
              <Link 
                href={`/exam/${item.materialId}?title=${encodeURIComponent(item.title || '')}&duration=${item.durationMinutes || ''}&attempts=${item.maxAttempts || ''}&count=${item.randomPickCount || item.questionCount || ''}&start=${item.startTime || ''}&end=${item.endTime || ''}&attemptCount=${item.attemptCount || 0}&proctored=${item.isProctored || false}`}
                className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-6 text-sm rounded border border-gray-300 transition-colors inline-block text-center"
              >
                Hết Lượt (Xem Lịch Sử)
              </Link>
            ) : (
              <Link
                href={`/exam/${item.materialId}?title=${encodeURIComponent(item.title || '')}&duration=${item.durationMinutes || ''}&attempts=${item.maxAttempts || ''}&count=${item.randomPickCount || item.questionCount || ''}&start=${item.startTime || ''}&end=${item.endTime || ''}&attemptCount=${item.attemptCount || 0}&proctored=${item.isProctored || false}`}
                className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white font-medium py-2 px-8 text-sm rounded shadow-sm transition-colors inline-block text-center"
              >
                Vào Làm Bài
              </Link>
            )
          ) : (
            <Link
              href={`/materials/${item.id}`}
              className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-900 font-medium py-2 px-8 text-sm rounded border border-gray-300 transition-colors inline-block text-center"
            >
              Xem
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Tabs Navigation */}
      <div className="flex border-b border-line gap-6">
        <button
          onClick={() => setActiveTab('OFFICIAL')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'OFFICIAL' ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Kho Học Liệu Official
        </button>
        <button
          onClick={() => setActiveTab('PERSONAL')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'PERSONAL' ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Tạo Học Liệu Cá Nhân
        </button>
      </div>

      {activeTab === 'OFFICIAL' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-xl font-bold text-gray-900">
              Danh Sách Học Liệu & Bài Thi
            </h2>
          </div>

          {filteredOfficial && filteredOfficial.length > 0 ? (
            <div className="flex flex-col">
              {filteredOfficial.map(item => renderOfficialItem(item))}
            </div>
          ) : (
            <p className="text-gray-500 italic text-center py-10 bg-gray-50 rounded border border-gray-100 text-sm">
              Chưa có học liệu chính thức nào từ Giảng viên.
            </p>
          )}
        </div>
      ) : personalTabContent}
    </div>
  );
}
