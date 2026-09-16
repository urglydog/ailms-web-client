'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCourseMaterials, useRequestMaterial, useAvailableLanguages, useCourseChapters, useRenameMaterial, useDeleteMaterial } from '@/hooks/useMaterials';
import { materialsApi, type MaterialType, type ScopeType, type InstructorMaterial } from '@/lib/api/materials';
import { courseResourcesApi, type CourseResource } from '@/lib/api/courseResourcesApi';
import { MaterialLanguagePicker } from '@/components/materials/MaterialLanguagePicker';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useNotification } from '@/components/providers/NotificationProvider';

export function MaterialManager({ courseId, lessonId }: { courseId: number, lessonId?: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: materials, isLoading, refetch } = useCourseMaterials(courseId);
  const { data: availableLanguages } = useAvailableLanguages(courseId);
  const { data: chapters } = useCourseChapters(courseId);
  const requestMutation = useRequestMaterial();
  const renameMutation = useRenameMaterial(courseId);
  const deleteMutation = useDeleteMaterial(courseId);

  const { notifications } = useNotification();
  const officialUnreadCount = notifications.filter(n => !n.isRead && n.type === 'NEW_OFFICIAL_MATERIAL').length;
  const personalUnreadCount = notifications.filter(n => !n.isRead && n.type === 'NEW_PERSONAL_MATERIAL').length;

  const { data: officialMaterials } = useQuery<InstructorMaterial[]>({
    queryKey: ['official-materials', courseId],
    queryFn: () => materialsApi.getInstructorMaterials(courseId),
    enabled: !!courseId,
    staleTime: 0,
  });

  const { data: courseResources } = useQuery<CourseResource[]>({
    queryKey: ['course-resources', courseId],
    queryFn: () => courseResourcesApi.getCourseResources(courseId),
    enabled: !!courseId,
  });

  const [materialType, setMaterialType] = useState<MaterialType>('MINDMAP');
  const [scopeType, setScopeType] = useState<ScopeType>('WHOLE_COURSE');
  const [scopeRefId, setScopeRefId] = useState<number | undefined>(undefined);
  const [customLessonIds, setCustomLessonIds] = useState<number[]>([]);
  const [language, setLanguage] = useState<string>('');

  const [filterType, setFilterType] = useState<MaterialType | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'NAME_ASC'>('NEWEST');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Auto-select first language if available
  useEffect(() => {
    if (availableLanguages && availableLanguages.length > 0 && language === '') {
      setLanguage(availableLanguages[0]!.code);
    }
  }, [availableLanguages, language]);

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

  const handleRenameSubmit = (id: number) => {
    if (editTitle.trim() !== '') {
      renameMutation.mutate({ id, title: editTitle.trim() }, {
        onSuccess: () => {
          toast.success('Đã cập nhật tên học liệu');
          setEditingId(null);
        },
        onError: () => toast.error('Có lỗi xảy ra khi cập nhật tên')
      });
    } else {
      setEditingId(null);
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success('Đã xóa học liệu'),
      onError: () => toast.error('Có lỗi xảy ra khi xóa học liệu')
    });
  };

  const activeTabParam = searchParams.get('subtab') as 'OFFICIAL' | 'PERSONAL' | null;
  const activeTab = activeTabParam === 'PERSONAL' ? 'PERSONAL' : 'OFFICIAL';

  const setActiveTab = (tab: 'OFFICIAL' | 'PERSONAL') => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('subtab', tab);
    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
  };

  const getFilteredAndSortedMaterials = () => {
    if (!materials) return [];
    
    let result = [...materials];
    
    if (filterType !== 'ALL') {
      result = result.filter(m => m.materialType === filterType);
    }
    
    result.sort((a, b) => {
      if (sortBy === 'NEWEST') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'OLDEST') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'NAME_ASC') {
        const titleA = a.title || 'Học liệu không tên';
        const titleB = b.title || 'Học liệu không tên';
        return titleA.localeCompare(titleB, 'vi');
      }
      return 0;
    });
    
    return result;
  };

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
            <MaterialLanguagePicker
              languages={availableLanguages ?? []}
              value={language}
              onChange={setLanguage}
            />
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
          {requestMutation.isPending ? 'Đang gửi...' : 'Tạo học liệu'}
        </button>
      </div>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-line pb-4">
          <h2 className="font-display text-xl font-bold">Lịch sử tạo cá nhân</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            {/* Filter */}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setFilterType('ALL')} className={`px-3 py-1 text-xs font-semibold rounded-full border ${filterType === 'ALL' ? 'bg-ink text-white border-ink' : 'bg-surface hover:bg-surface-hover border-line text-ink-muted'}`}>Tất cả</button>
              <button onClick={() => setFilterType('MINDMAP')} className={`px-3 py-1 text-xs font-semibold rounded-full border ${filterType === 'MINDMAP' ? 'bg-ink text-white border-ink' : 'bg-surface hover:bg-surface-hover border-line text-ink-muted'}`}>Sơ đồ tư duy</button>
              <button onClick={() => setFilterType('FLASHCARD')} className={`px-3 py-1 text-xs font-semibold rounded-full border ${filterType === 'FLASHCARD' ? 'bg-ink text-white border-ink' : 'bg-surface hover:bg-surface-hover border-line text-ink-muted'}`}>Flashcard</button>
              <button onClick={() => setFilterType('QUIZ')} className={`px-3 py-1 text-xs font-semibold rounded-full border ${filterType === 'QUIZ' ? 'bg-ink text-white border-ink' : 'bg-surface hover:bg-surface-hover border-line text-ink-muted'}`}>Trắc nghiệm</button>
            </div>
            
            <div className="h-4 w-px bg-line hidden sm:block"></div>
            
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'NEWEST' | 'OLDEST' | 'NAME_ASC')}
              className="rounded-md border border-line bg-surface px-3 py-1 text-sm text-ink outline-none focus:border-accent"
            >
              <option value="NEWEST">Mới nhất</option>
              <option value="OLDEST">Cũ nhất</option>
              <option value="NAME_ASC">Tên A-Z</option>
            </select>
            
            <button onClick={() => refetch()} className="text-sm text-accent hover:underline whitespace-nowrap hidden sm:block ml-2">
              Làm mới
            </button>
          </div>
        </div>
        {isLoading ? (
          <p className="text-sm text-ink-muted">Đang tải...</p>
        ) : materials && materials.length > 0 ? (
          <div className="flex flex-col gap-3">
            {getFilteredAndSortedMaterials().map((m) => (
              <div key={m.id} className="flex items-center justify-between border border-line-soft rounded-lg p-4 group">
                <div className="flex-1 mr-4">
                  {editingId === m.id ? (
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <input
                        autoFocus
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(m.id)}
                        onBlur={() => handleRenameSubmit(m.id)}
                        className="border border-accent rounded px-2 py-1 text-sm text-ink w-full max-w-xs outline-none"
                      />
                      <span className="text-xs text-ink-muted hidden sm:inline">Enter để lưu</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-1">
                      <h3 
                        className="font-semibold text-ink cursor-pointer hover:text-accent group/title"
                        onClick={() => { setEditingId(m.id); setEditTitle(m.title || 'Học liệu không tên'); }}
                        title="Click để đổi tên"
                      >
                        {m.title || 'Học liệu không tên'}
                      </h3>
                      <span className="text-[10px] text-ink-muted bg-surface-hover px-2 py-0.5 rounded opacity-0 group-hover/title:opacity-100 transition-opacity">Đổi tên</span>
                    </div>
                  )}
                  
                  <div className="text-xs text-ink-muted flex items-center gap-2 flex-wrap">
                    <span className="font-medium bg-line-soft px-1.5 py-0.5 rounded text-[10px]">
                      {m.materialType === 'MINDMAP' ? 'SƠ ĐỒ TƯ DUY' : m.materialType === 'FLASHCARD' ? 'FLASHCARD' : 'TRẮC NGHIỆM'}
                    </span>
                    <span>•</span>
                    <span>Trạng thái:{' '}
                      {m.status === 'COMPLETED' ? (
                        <span className="text-green-600 font-medium">Hoàn thành</span>
                      ) : m.status === 'FAILED' ? (
                        <span className="text-red-600 font-medium">Lỗi</span>
                      ) : (
                        <span className="text-orange-500 font-medium">
                          {new Date().getTime() - new Date(m.createdAt).getTime() > 120000 
                            ? 'Đang chờ lâu' 
                            : 'Đang xử lý'}
                        </span>
                      )}
                    </span>
                    <span>•</span>
                    <span>{new Date(m.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {m.status === 'COMPLETED' && (
                    <Link
                      href={`/materials/${m.id}`}
                      className="rounded-full bg-surface-hover px-4 py-2 text-sm font-semibold text-ink hover:bg-line-soft whitespace-nowrap"
                    >
                      Xem
                    </Link>
                  )}
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-2 text-ink-muted hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Xóa học liệu"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" /><path d="M10 11v6M14 11v6" /></svg>
                  </button>
                </div>
              </div>
            ))}
            
            {getFilteredAndSortedMaterials().length === 0 && (
              <p className="text-sm text-ink-muted text-center py-6 bg-surface-hover rounded-lg">Không tìm thấy học liệu phù hợp với bộ lọc.</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-ink-muted text-center py-6">Chưa có học liệu cá nhân nào được tạo.</p>
        )}
      </div>
    </>
  );

  const filteredOfficialMaterials = officialMaterials?.filter(m => {
    if (!lessonId) {
      // Course level
      return !m.chapterId && !m.lessonId;
    } else {
      // Lesson level: check if material is attached specifically to this lesson
      if (m.lessonId === lessonId) return true;
      
      // Or check if material is attached to the chapter containing this lesson
      if (m.chapterId && chapters) {
        const chapter = chapters.find(c => c.id === m.chapterId);
        if (chapter && chapter.lessons.some(l => l.id === lessonId)) {
          return true;
        }
      }
      return false;
    }
  }) || [];

  const filteredCourseResources = courseResources?.filter(r => {
    if (!lessonId) {
      return !r.chapterId && !r.lessonId;
    } else {
      if (r.lessonId === lessonId) return true;
      if (r.chapterId && chapters) {
        const chapter = chapters.find(c => c.id === r.chapterId);
        if (chapter && chapter.lessons.some(l => l.id === lessonId)) {
          return true;
        }
      }
      return false;
    }
  }) || [];

  const renderOfficialItem = (item: InstructorMaterial) => {
    const now = new Date();
    const startTime = item.startTime ? new Date(item.startTime) : null;
    const endTime = item.endTime ? new Date(item.endTime) : null;
    
    const isBeforeStart = startTime ? now < startTime : false;
    const isAfterEnd = endTime ? now > endTime : false;
    const outOfAttempts = (item.maxAttempts && item.attemptCount !== undefined) ? item.attemptCount >= item.maxAttempts : false;

    const currentUrl = `${pathname}?${searchParams.toString()}`;
    const href = item.materialType === 'QUIZ' && item.materialId && item.quizType !== 'LECTURE_QUIZ'
      ? `/exam/${item.materialId}?title=${encodeURIComponent(item.title || '')}&duration=${item.durationMinutes || ''}&attempts=${item.maxAttempts || ''}&count=${item.randomPickCount || item.questionCount || ''}&start=${item.startTime || ''}&end=${item.endTime || ''}&attemptCount=${item.attemptCount || 0}&proctored=${item.isProctored || false}&returnUrl=${encodeURIComponent(currentUrl)}`
      : `/materials/${item.id}?isOfficial=true`;

    return (
      <Link 
        key={item.id} 
        href={href}
        className="block flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 mb-3 bg-white border border-line rounded-xl hover:border-accent hover:shadow-sm transition-all cursor-pointer group"
      >
        <div className="flex-1 w-full">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-ink text-lg group-hover:text-accent transition-colors">{item.title || 'Học liệu khóa học'}</h3>
            {item.materialType === 'QUIZ' ? (
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md shadow-sm ${item.quizType === 'LECTURE_QUIZ' ? 'text-teal-700 bg-teal-50 border border-teal-200' : 'text-accent-dark bg-accent/10 border border-accent/20'}`}>
                {item.quizType === 'LECTURE_QUIZ' ? 'QUICK CHECK' : 'THI CHÍNH THỨC'}
              </span>
            ) : (
              <span className="text-[10px] uppercase font-bold text-ink-muted bg-surface-hover px-2 py-0.5 rounded-md">
                {item.materialType === 'FLASHCARD' ? 'Flashcard' : 'Mindmap'}
              </span>
            )}
            {item.isProctored && (
              <span className="text-[10px] font-bold text-red-600 border border-red-200 bg-red-50 px-2 py-0.5 rounded-md">
                AI Proctored
              </span>
            )}
            
            {/* Status indicators */}
            {item.materialType === 'QUIZ' && isBeforeStart && (
               <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md ml-auto sm:ml-2">Chưa mở</span>
            )}
            {item.materialType === 'QUIZ' && isAfterEnd && (
               <span className="text-[10px] font-bold text-ink-muted bg-surface-hover px-2 py-0.5 rounded-md ml-auto sm:ml-2">Đã đóng</span>
            )}
            {item.materialType === 'QUIZ' && outOfAttempts && !isAfterEnd && (
               <span className="text-[10px] font-bold text-ink-muted bg-surface-hover px-2 py-0.5 rounded-md ml-auto sm:ml-2">Hết lượt</span>
            )}
          </div>
          
          <div className="text-sm text-ink-muted flex flex-wrap gap-x-6 gap-y-2 mt-2">
            {item.materialType === 'QUIZ' && (
              <>
                <div className="flex items-center gap-1">
                  <span className="text-ink-faint">Thời gian:</span>
                  <span className="font-medium text-ink">{item.durationMinutes ? `${item.durationMinutes} phút` : 'Không giới hạn'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-ink-faint">Số câu:</span>
                  <span className="font-medium text-ink">{item.randomPickCount || item.questionCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-ink-faint">Lượt thi:</span>
                  <span className="font-medium text-ink">
                    {item.attemptCount !== undefined ? `${item.attemptCount} / ` : ''}
                    {item.maxAttempts || '∞'}
                  </span>
                </div>
                {startTime && (
                  <div className="flex items-center gap-1 w-full sm:w-auto mt-1 sm:mt-0">
                    <span className="text-ink-faint">Mở lúc:</span>
                    <span className="font-medium text-ink">{startTime.toLocaleString('vi-VN')}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Tabs Navigation */}
      <div className="flex border-b border-line gap-6">
        <button
          onClick={() => setActiveTab('OFFICIAL')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors relative ${
            activeTab === 'OFFICIAL' ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Kho Học Liệu Official
          {officialUnreadCount > 0 && (
            <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {officialUnreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('PERSONAL')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors relative ${
            activeTab === 'PERSONAL' ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Kho Học Liệu Cá Nhân
          {personalUnreadCount > 0 && (
            <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {personalUnreadCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'OFFICIAL' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-line-soft pb-3">
            <h2 className="text-xl font-bold text-ink">
              Danh Sách Học Liệu & Bài Thi
            </h2>
          </div>

          {(filteredOfficialMaterials.length > 0 || filteredCourseResources.length > 0) ? (
            <div className="space-y-4">
              {filteredCourseResources.map(res => (
                <a 
                  key={res.id} 
                  href={res.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 mb-3 bg-white border border-line rounded-xl hover:border-orange-200 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-ink text-lg group-hover:text-orange-600 transition-colors">{res.title}</h3>
                      <span className="text-[10px] uppercase font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md shadow-sm">
                        Tài liệu tham khảo
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-ink-muted">
                      <span>Tải lên lúc: {new Date(res.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </a>
              ))}
              {filteredOfficialMaterials.map(renderOfficialItem)}
            </div>
          ) : (
            <div className="text-center py-10 bg-surface rounded-xl border border-line">
              <div className="text-4xl mb-3">📚</div>
              <h3 className="text-ink font-semibold mb-1">Chưa có học liệu chính thức</h3>
              <p className="text-sm text-ink-muted max-w-sm mx-auto">
                {lessonId ? 'Bài học này chưa có học liệu đính kèm.' : 'Giảng viên chưa công bố học liệu nào cho khóa học này.'}
              </p>
            </div>
          )}
        </div>
      ) : personalTabContent}
    </div>
  );
}
