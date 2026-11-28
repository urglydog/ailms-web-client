'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
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
import { MaterialTabs } from '@/components/materials/ui/MaterialTabs';
import { MaterialBadge } from '@/components/materials/ui/MaterialBadge';
import { CautionProgressBar } from '@/components/materials/ui/CautionProgressBar';
import { BookOpen, Target, Trash2, ShieldAlert, Clock, Ban } from 'lucide-react';

export function MaterialManager({ courseId, lessonId }: { courseId: number, lessonId?: number }) {
  const t = useTranslations('learn.materialManager');
  const locale = useLocale();
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
  // Only track personal material notifications (global unread)
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
      toast.error(t('pickLanguage'));
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
          toast.success(t('requestSent'));
          setCustomLessonIds([]);
        },
        onError: (err) => {
          if (err instanceof ApiError) {
            toast.error(err.message);
          } else {
            toast.error(t('createError'));
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
          toast.success(t('renamed'));
          setEditingId(null);
        },
        onError: () => toast.error(t('renameError'))
      });
    } else {
      setEditingId(null);
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success(t('deleted')),
      onError: () => toast.error(t('deleteError'))
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
        const titleA = a.title || t('untitled');
        const titleB = b.title || t('untitled');
        return titleA.localeCompare(titleB, 'vi');
      }
      return 0;
    });
    
    return result;
  };

  const personalTabContent = (
    <>
      <div className="card p-6 mb-8">
        <h2 className="font-display text-xl font-bold mb-4">{t('createTitle')}</h2>
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div>
            <label className="block text-sm font-semibold mb-1">{t('type')}</label>
            <select
              className="w-full rounded-md border border-line p-2 text-sm"
              value={materialType}
              onChange={(e) => setMaterialType(e.target.value as MaterialType)}
            >
              <option value="MINDMAP">{t('typeMindmap')}</option>
              <option value="QUIZ">{t('typeQuiz')}</option>
              <option value="FLASHCARD">Flashcard</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">{t('scope')}</label>
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
              <option value="WHOLE_COURSE">{t('scopeWhole')}</option>
              <option value="CHAPTER">{t('scopeChapter')}</option>
              <option value="CUSTOM_LESSONS">{t('scopeCustom')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">{t('language')}</label>
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
            <span className="font-semibold text-ink block mb-2">{t('sourceNote')}</span>
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
            <label className="block text-sm font-semibold mb-1">{t('pickChapter')}</label>
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
                <span className="font-semibold text-ink block mb-2">{t('availableVideos')}</span>
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
            <label className="block text-sm font-semibold mb-2">{t('tickLessons')}</label>
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
          className="rounded-card bg-accent px-6 py-2 text-sm font-semibold text-white hover:bg-accent-dark transition-colors disabled:opacity-50"
        >
          {requestMutation.isPending ? t('sending') : t('create')}
        </button>
      </div>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-line pb-4">
          <h2 className="font-display text-xl font-bold">{t('historyTitle')}</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            {/* Filter */}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setFilterType('ALL')} className={`px-3 py-1 text-xs font-semibold rounded-card border transition-colors ${filterType === 'ALL' ? 'bg-ink text-white border-ink' : 'bg-surface hover:bg-surface-hover border-line text-ink-muted'}`}>{t('filterAll')}</button>
              <button onClick={() => setFilterType('MINDMAP')} className={`px-3 py-1 text-xs font-semibold rounded-card border transition-colors ${filterType === 'MINDMAP' ? 'bg-ink text-white border-ink' : 'bg-surface hover:bg-surface-hover border-line text-ink-muted'}`}>{t('filterMindmap')}</button>
              <button onClick={() => setFilterType('FLASHCARD')} className={`px-3 py-1 text-xs font-semibold rounded-card border transition-colors ${filterType === 'FLASHCARD' ? 'bg-ink text-white border-ink' : 'bg-surface hover:bg-surface-hover border-line text-ink-muted'}`}>Flashcard</button>
              <button onClick={() => setFilterType('QUIZ')} className={`px-3 py-1 text-xs font-semibold rounded-card border transition-colors ${filterType === 'QUIZ' ? 'bg-ink text-white border-ink' : 'bg-surface hover:bg-surface-hover border-line text-ink-muted'}`}>{t('filterQuiz')}</button>
            </div>
            
            <div className="h-4 w-px bg-line hidden sm:block"></div>
            
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'NEWEST' | 'OLDEST' | 'NAME_ASC')}
              className="rounded-md border border-line bg-surface px-3 py-1 text-sm text-ink outline-none focus:border-accent"
            >
              <option value="NEWEST">{t('sortNewest')}</option>
              <option value="OLDEST">{t('sortOldest')}</option>
              <option value="NAME_ASC">{t('sortName')}</option>
            </select>
            
            <button onClick={() => refetch()} className="text-sm text-accent hover:underline whitespace-nowrap hidden sm:block ml-2">
              {t('refresh')}
            </button>
          </div>
        </div>
        {isLoading ? (
          <p className="text-sm text-ink-muted">{t('loading')}</p>
        ) : materials && materials.length > 0 ? (
          <div className="flex flex-col gap-3">
            {getFilteredAndSortedMaterials().map((m) => (
              <div key={m.id} className="flex items-center justify-between border border-line rounded-lg p-4 bg-surface-raised hover:border-accent hover:shadow-card-hover transition group">
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
                      <span className="text-xs text-ink-muted hidden sm:inline">{t('enterToSave')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-1">
                      <h3 
                        className="font-semibold text-ink cursor-pointer hover:text-accent group/title"
                        onClick={() => { setEditingId(m.id); setEditTitle(m.title || t('untitled')); }}
                        title={t('clickToRename')}
                      >
                        {m.title || t('untitled')}
                      </h3>
                      <span className="text-[10px] text-ink-muted bg-surface-hover px-2 py-0.5 rounded opacity-0 group-hover/title:opacity-100 transition-opacity">{t('rename')}</span>
                    </div>
                  )}
                  
                  <div className="text-xs text-ink-muted flex items-center gap-2 flex-wrap">
                    <span className="font-medium bg-line-soft px-1.5 py-0.5 rounded text-[10px]">
                      {m.materialType === 'MINDMAP' ? t('badgeMindmap') : m.materialType === 'FLASHCARD' ? t('badgeFlashcard') : t('badgeQuiz')}
                    </span>
                    <span>•</span>
                    <span>{t('status')}{' '}
                      {m.status === 'COMPLETED' ? (
                        <span className="text-success font-medium">{t('statusDone')}</span>
                      ) : m.status === 'FAILED' ? (
                        <span className="text-danger font-medium">{t('statusFailed')}</span>
                      ) : (
                        <span className="text-star font-medium">
                          {new Date().getTime() - new Date(m.createdAt).getTime() > 120000
                            ? t('statusStale')
                            : t('statusProcessing')}
                        </span>
                      )}
                    </span>
                    <span>•</span>
                    <span>{new Date(m.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                  {(m.status === 'PENDING' || m.status === 'PENDING_TRANSCRIPT' || m.status === 'PROCESSING') && (
                    <CautionProgressBar tone="warning" height="h-1.5" className="mt-2 max-w-xs" />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {m.status === 'COMPLETED' && (
                    <Link
                      href={`/materials/${m.id}`}
                      className="rounded-card bg-surface-hover px-4 py-2 text-sm font-semibold text-ink hover:bg-line-soft transition-colors whitespace-nowrap"
                    >
                      Xem
                    </Link>
                  )}
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-2 text-ink-muted hover:text-danger hover:bg-danger/10 rounded-card transition-colors"
                    title={t('deleteTitle')}
                  >
                    <Trash2 className="w-[15px] h-[15px]" strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))}
            
            {getFilteredAndSortedMaterials().length === 0 && (
              <p className="text-sm text-ink-muted text-center py-6 bg-surface-hover rounded-lg">{t('noFilterMatch')}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-ink-muted text-center py-6">{t('noPersonal')}</p>
        )}
      </div>
    </>
  );

  const filteredOfficialMaterials = officialMaterials?.filter(m => {
    if (!lessonId) {
      // Course level
      return (!m.assignments || !m.assignments.some(a => a.chapterId)) && (!m.assignments || !m.assignments.some(a => a.lessonId));
    } else {
      // Lesson level: check if material is attached specifically to this lesson
      if (m.assignments?.some(a => a.lessonId === lessonId)) return true;
      
      // Or check if material is attached to the chapter containing this lesson
      if ((m.assignments && m.assignments.some(a => a.chapterId)) && chapters) {
        const chapter = chapters.find(c => m.assignments?.some(a => a.chapterId === c.id));
        if (chapter && chapter.lessons.some(l => l.id === lessonId)) {
          return true;
        }
      }
      return false;
    }
  }) || [];

  // Context-aware badge

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
        className="block flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 mb-3 bg-surface-raised border border-line rounded-card hover:border-accent hover:shadow-card-hover transition cursor-pointer group"
      >
        <div className="flex-1 w-full">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="font-bold text-ink text-lg group-hover:text-accent transition-colors">{item.title || t('courseMaterial')}</h3>
            {item.materialType === 'QUIZ' ? (
              <MaterialBadge tone={item.quizType === 'LECTURE_QUIZ' ? 'neutral' : 'accent'}>
                {item.quizType === 'LECTURE_QUIZ' ? 'Quick Check' : t('officialExam')}
              </MaterialBadge>
            ) : (
              <MaterialBadge tone="neutral">{item.materialType === 'FLASHCARD' ? 'Flashcard' : 'Mindmap'}</MaterialBadge>
            )}
            {item.isProctored && (
              <MaterialBadge tone="danger" icon={<ShieldAlert className="w-3 h-3" />}>AI Proctored</MaterialBadge>
            )}

            {/* Status indicators */}
            {item.materialType === 'QUIZ' && isBeforeStart && (
              <MaterialBadge tone="warning" icon={<Clock className="w-3 h-3" />} className="ml-auto sm:ml-2">{t('notOpen')}</MaterialBadge>
            )}
            {item.materialType === 'QUIZ' && isAfterEnd && (
              <MaterialBadge tone="neutral" icon={<Ban className="w-3 h-3" />} className="ml-auto sm:ml-2">{t('closed')}</MaterialBadge>
            )}
            {item.materialType === 'QUIZ' && outOfAttempts && !isAfterEnd && (
              <MaterialBadge tone="neutral" icon={<Ban className="w-3 h-3" />} className="ml-auto sm:ml-2">{t('noAttempts')}</MaterialBadge>
            )}
          </div>
          
          <div className="text-sm text-ink-muted flex flex-wrap gap-x-6 gap-y-2 mt-2">
            {item.materialType === 'QUIZ' && (
              <>
                <div className="flex items-center gap-1">
                  <span className="text-ink-faint">{t('duration')}</span>
                  <span className="font-medium text-ink">{item.durationMinutes ? t('durationValue', { minutes: item.durationMinutes }) : t('unlimited')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-ink-faint">{t('questionCount')}</span>
                  <span className="font-medium text-ink">{item.randomPickCount || item.questionCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-ink-faint">{t('attempts')}</span>
                  <span className="font-medium text-ink">
                    {item.attemptCount !== undefined ? `${item.attemptCount} / ` : ''}
                    {item.maxAttempts || '∞'}
                  </span>
                </div>
                {startTime && (
                  <div className="flex items-center gap-1 w-full sm:w-auto mt-1 sm:mt-0">
                    <span className="text-ink-faint">{t('opensAt')}</span>
                    <span className="font-medium text-ink">{startTime.toLocaleString(locale)}</span>
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
      <div className="flex items-center gap-3">
        <MaterialTabs
          active={activeTab}
          onChange={(key) => setActiveTab(key as 'OFFICIAL' | 'PERSONAL')}
          tabs={[
            { key: 'OFFICIAL', label: t('tabOfficial'), icon: <BookOpen className="w-3.5 h-3.5" />, count: filteredOfficialMaterials.length || undefined },
            { key: 'PERSONAL', label: t('tabPersonal'), icon: <Target className="w-3.5 h-3.5" /> },
          ]}
        />
        {personalUnreadCount > 0 && (
          <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-card text-[10px] font-bold bg-danger text-white">
            {personalUnreadCount}
          </span>
        )}
      </div>

      {activeTab === 'OFFICIAL' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-line-soft pb-3">
            <h2 className="text-xl font-bold text-ink">
              {t('listTitle')}
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
                  className="block flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 mb-3 bg-surface-raised border border-line rounded-card hover:border-accent hover:shadow-card-hover transition cursor-pointer group"
                >
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-ink text-lg group-hover:text-accent transition-colors">{res.title}</h3>
                      <MaterialBadge tone="warning">{t('reference')}</MaterialBadge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-ink-muted">
                      <span>{t('uploadedAt', { date: new Date(res.createdAt).toLocaleDateString(locale) })}</span>
                    </div>
                  </div>
                </a>
              ))}
              {filteredOfficialMaterials.map(renderOfficialItem)}
            </div>
          ) : (
            <div className="text-center py-10 bg-surface rounded-card border border-line">
              <BookOpen className="w-9 h-9 mx-auto mb-3 text-ink-faint" strokeWidth={1.5} />
              <h3 className="text-ink font-semibold mb-1">{t('noOfficial')}</h3>
              <p className="text-sm text-ink-muted max-w-sm mx-auto">
                {lessonId ? t('noOfficialLesson') : t('noOfficialCourse')}
              </p>
            </div>
          )}
        </div>
      ) : personalTabContent}
    </div>
  );
}
