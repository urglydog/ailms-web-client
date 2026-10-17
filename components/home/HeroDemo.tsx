'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Languages, MousePointer2, Play } from 'lucide-react';
import {
  DEMO_LANGUAGES,
  LANG_CYCLE_MS,
  SCENE_COUNT,
  SCENE_DURATION_MS,
  nextDubLanguage,
  nextScene,
} from '@/lib/home/demoScenes';
import { prefersReducedMotion } from '@/lib/motion/reducedMotion';

const SAMPLE_COURSES = ['Nhập môn AI', 'Unity Basics', 'UX Design'] as const;
const PICKED_COURSE = 1;

const SCENE_BASE =
  'absolute inset-x-0 bottom-9 top-12 transition-[opacity,transform] duration-[400ms] ease-soft';

/** Video demo 3 cảnh ở hero trang chủ (spec mục 4): chọn khóa học, chọn ngôn ngữ, hỏi gia sư AI.
 * Là kịch bản cố định, không gọi API. Tự chuyển cảnh mỗi 3,8 giây; giảm chuyển động thì không tự chuyển. */
export function HeroDemo() {
  const t = useTranslations('home.demo');
  const [scene, setScene] = useState(0);
  const [lang, setLang] = useState(0);
  const [pointerMoved, setPointerMoved] = useState(false);
  const [picked, setPicked] = useState(false);

  const titles = [t('step1'), t('step2'), t('step3')];

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = setTimeout(() => setScene((s) => nextScene(s)), SCENE_DURATION_MS);
    return () => clearTimeout(id);
  }, [scene]);

  useEffect(() => {
    if (scene === 1) {
      setLang(1);
      if (prefersReducedMotion()) return;
      const id = setInterval(() => setLang((l) => nextDubLanguage(l)), LANG_CYCLE_MS);
      return () => clearInterval(id);
    }
    setLang(scene === 2 ? 1 : 0);
  }, [scene]);

  useEffect(() => {
    setPointerMoved(false);
    setPicked(false);
    if (scene !== 0) return;
    if (prefersReducedMotion()) {
      setPointerMoved(true);
      setPicked(true);
      return;
    }
    const moveId = setTimeout(() => setPointerMoved(true), 500);
    const pickId = setTimeout(() => setPicked(true), 1300);
    return () => {
      clearTimeout(moveId);
      clearTimeout(pickId);
    };
  }, [scene]);

  const language = DEMO_LANGUAGES[lang] ?? DEMO_LANGUAGES[0];

  return (
    <div
      role="group"
      aria-label={t('ariaLabel')}
      className="relative aspect-[16/10] w-full overflow-hidden rounded-panel bg-accent shadow-card-hover"
    >
      <div
        key={scene}
        data-testid="step-badge"
        className="reveal is-in absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 text-xs font-medium text-ink"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] text-white">
          {scene + 1}
        </span>
        {titles[scene]}
      </div>

      {/* Cảnh 1: chọn khóa học */}
      <div
        className={`${SCENE_BASE} px-4 ${scene === 0 ? 'opacity-100' : 'pointer-events-none translate-y-2.5 opacity-0'}`}
        aria-hidden={scene !== 0}
      >
        <div className="mt-2 grid grid-cols-3 gap-2">
          {SAMPLE_COURSES.map((name, i) => (
            <div
              key={name}
              className={`relative rounded-lg border-[1.5px] p-1.5 text-[11px] transition-all duration-300 ${
                picked && i === PICKED_COURSE
                  ? 'scale-105 border-cyan bg-white text-ink'
                  : 'border-transparent bg-white/20 text-white'
              }`}
            >
              <div className={`mb-1 h-10 rounded ${picked && i === PICKED_COURSE ? 'bg-tint' : 'bg-white/30'}`} />
              {name}
              {picked && i === PICKED_COURSE && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan text-[10px] text-cyan-ink">
                  ✓
                </span>
              )}
            </div>
          ))}
        </div>
        <MousePointer2
          aria-hidden
          size={18}
          className="absolute text-white drop-shadow transition-[left,top] duration-700 ease-soft"
          style={{ left: pointerMoved ? '46%' : '8%', top: pointerMoved ? '46%' : '78%' }}
        />
      </div>

      {/* Cảnh 2: chọn ngôn ngữ */}
      <div
        className={`${SCENE_BASE} ${scene === 1 ? 'opacity-100' : 'pointer-events-none translate-y-2.5 opacity-0'}`}
        aria-hidden={scene !== 1}
      >
        <div className="absolute left-[32%] top-[38%] flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink">
          <Play size={18} aria-hidden />
        </div>
        <div className="absolute right-3 top-1 w-[44%] rounded-xl bg-white p-1 shadow-card-hover">
          {DEMO_LANGUAGES.map((l, i) => (
            <div
              key={l.code}
              className={`flex justify-between rounded-md px-2 py-1 text-xs transition-colors duration-200 ${
                i === lang ? 'bg-tint font-medium text-accent-dark' : 'text-ink'
              }`}
            >
              <span>{l.name}</span>
              {l.original && <span className="text-[11px] text-ink-muted">Gốc</span>}
            </div>
          ))}
        </div>
        <p className="absolute inset-x-0 bottom-1 text-center">
          <span className="inline-block bg-ink/70 px-2 py-0.5 text-[11px] text-white">{language?.subtitle}</span>
        </p>
      </div>

      {/* Cảnh 3: hỏi gia sư AI */}
      <div
        className={`${SCENE_BASE} flex flex-col justify-center gap-2 px-3 ${
          scene === 2 ? 'opacity-100' : 'pointer-events-none translate-y-2.5 opacity-0'
        }`}
        aria-hidden={scene !== 2}
      >
        <div
          className={`max-w-[82%] self-end rounded-xl bg-white px-2.5 py-1.5 text-[11px] text-ink transition-[opacity,transform] duration-[350ms] [transition-delay:300ms] ${
            scene === 2 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`}
        >
          {t('chatQuestion')}
        </div>
        <div
          className={`max-w-[82%] self-start rounded-xl bg-cyan px-2.5 py-1.5 text-[11px] text-cyan-ink transition-[opacity,transform] duration-[350ms] [transition-delay:1200ms] ${
            scene === 2 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`}
        >
          {t('chatAnswer')} <span className="rounded bg-white px-1 font-medium text-accent-dark">[04:15]</span>
        </div>
      </div>

      {/* Thanh dưới: vạch tiến độ 3 bước + giọng đang chọn */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex h-8 items-center gap-3 bg-ink/55 px-3">
        <div className="flex max-w-[150px] flex-1 gap-1.5">
          {Array.from({ length: SCENE_COUNT }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={t('goToStep', { n: i + 1, title: titles[i] ?? '' })}
              aria-current={i === scene ? 'step' : undefined}
              onClick={() => setScene(i)}
              className="relative h-2 flex-1 cursor-pointer overflow-hidden rounded-full bg-white/30"
            >
              <span
                key={i === scene ? `on-${scene}` : `off-${i}`}
                className={`absolute inset-0 origin-left rounded-full bg-white ${
                  i === scene ? 'demo-seg-fill' : i < scene ? 'scale-x-100' : 'scale-x-0'
                }`}
              />
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1 rounded bg-cyan px-2 py-0.5 text-[11px] font-medium text-cyan-ink">
          <Languages size={13} aria-hidden />
          <span data-testid="lang-label">{language?.name}</span>
        </div>
      </div>
    </div>
  );
}
