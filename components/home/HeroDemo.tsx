'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DEMO_LANGUAGES, DEMO_PICKED_INDEX, DEMO_PICKS } from '@/lib/home/demoScenes';
import { prefersReducedMotion } from '@/lib/motion/reducedMotion';
import { showHeroDemoFinal, startHeroDemo, type DemoTexts } from './heroDemoTimeline';
import './heroDemo.css';

/** Thông tin phụ của 9 thẻ khóa học mẫu (tên lấy từ i18n theo cùng thứ tự). */
const CARD_META: ReadonlyArray<{ intermediate: boolean; free: boolean; price?: string; rating: string; seed: string }> = [
  { intermediate: false, free: true, rating: '4.8', seed: '11' },
  { intermediate: false, free: false, price: '199.000đ', rating: '4.5', seed: '22' },
  { intermediate: true, free: true, rating: '5.0', seed: '33' },
  { intermediate: false, free: true, rating: '5.0', seed: '44' },
  { intermediate: true, free: false, price: '199.000đ', rating: '4.7', seed: '55' },
  { intermediate: false, free: true, rating: '4.9', seed: '66' },
  { intermediate: false, free: true, rating: '4.6', seed: '77' },
  { intermediate: true, free: false, price: '349.000đ', rating: '4.4', seed: '88' },
  { intermediate: false, free: true, rating: '4.9', seed: '99' },
];

const STAGE_W = 800;

/** Video demo ở hero trang chủ: mô phỏng lướt danh sách khóa, vào bài học, đổi giọng lồng tiếng AI rồi hỏi gia sư
 * và bấm mốc thời gian để tua video. Là kịch bản cố định, không gọi API. Người bật "giảm chuyển động" thấy
 * cảnh tĩnh ở cuối kịch bản. */
export function HeroDemo() {
  const t = useTranslations('home.demo');
  const rootRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [scale, setScale] = useState(1);

  const titles = t.raw('courses') as string[];
  const lessons = t.raw('player.lessons') as string[];
  const stepLabels = [t('step1'), t('step2'), t('step3')];

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const update = () => setScale((root.clientWidth || STAGE_W) / STAGE_W);
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(root);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const texts: DemoTexts = {
      captions: {
        pick: t('captions.pick'),
        play: t('captions.play'),
        original: t('captions.original'),
        chooseLang: t('captions.chooseLang'),
        askTutor: t('captions.askTutor'),
        clickTime: t('captions.clickTime'),
        jumped: t('captions.jumped'),
      },
      chatQuestion: t('chatQuestion'),
      chatAnswer: t('chatAnswer'),
      aiName: t('aiName'),
      aiThinking: t('aiThinking'),
      jumpToast: t('jumpToast', { time: '02:15' }),
      badgeOriginal: t('badgeOriginal'),
      badgeReady: t('badgeReady'),
      originalSuffix: t('originalSuffix'),
    };
    const vi = DEMO_LANGUAGES[1];
    if (prefersReducedMotion()) {
      showHeroDemoFinal(root, texts, vi ?? { name: '', subtitle: '' });
      setStep(2);
      return;
    }
    return startHeroDemo(root, { texts, menuLangs: DEMO_LANGUAGES, picks: DEMO_PICKS, onStep: setStep });
  }, [t]);

  return (
    <div>
      <div ref={rootRef} className="hd-frame" role="img" aria-label={t('ariaLabel')} data-hd="frame">
        <div data-hd="stage" style={{ transform: `scale(${scale})` }}>
          <div className="hd-cap" data-hd="cap" />
          <div data-hd="cam">
            <div className="hd-scene hd-show" data-hd="s1">
              <div className="hd-topbar">
                <div className="hd-logo">
                  <b>L</b>LinguaLearn
                </div>
                <div className="hd-search">{t('header.search')}</div>
                <div className="hd-avatar">N</div>
              </div>
              <div className="hd-head">
                {t('header.title')}
                <span>{t('header.subtitle')}</span>
              </div>
              <div data-hd="list">
                <div data-hd="grid">
                  {CARD_META.map((meta, i) => (
                    <div key={meta.seed} className="hd-card">
                      {i === DEMO_PICKED_INDEX ? (
                        <div className="hd-img hd-ux">
                          <UxCover />
                          <span className="hd-tag">{t('card.aiDub')}</span>
                        </div>
                      ) : (
                        <div
                          className="hd-img"
                          style={{ backgroundImage: `url(https://picsum.photos/seed/lms-demo-${meta.seed}/800/450)` }}
                        >
                          <span className="hd-tag">{t('card.aiDub')}</span>
                        </div>
                      )}
                      <div className="hd-body">
                        <h4>{titles[i]}</h4>
                        <p>
                          {t('card.instructor', { name: 'Tran Thanh Ha' })} ·{' '}
                          {meta.intermediate ? t('card.intermediate') : t('card.beginner')}
                        </p>
                        <div className="hd-row">
                          <span>
                            <span className="hd-stars">★★★★★</span> {meta.rating}
                          </span>
                          <em>{meta.free ? t('card.free') : meta.price}</em>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div data-hd="zoom">
                <div className="hd-img hd-ux">
                  <UxCover />
                </div>
              </div>
            </div>

            <div data-hd="player">
              <div className="hd-lhead">
                <span className="hd-back">{t('player.back')}</span>
                <span>{titles[DEMO_PICKED_INDEX]}</span>
                <div className="hd-prog">
                  {t('player.progress')}{' '}
                  <i>
                    <b />
                  </i>
                </div>
              </div>
              <div className="hd-lbody">
                <div className="hd-main">
                  <div className="hd-video" data-hd="video">
                    <div className="hd-art hd-ux">
                      <UxCover />
                    </div>
                    <div className="hd-bigplay" data-hd="bigplay">
                      ▶
                    </div>
                    <div className="hd-sub" data-hd="sub" style={{ opacity: 0 }}>
                      {DEMO_LANGUAGES[0]?.subtitle}
                    </div>
                    <div className="hd-vbar">
                      <span data-hd="tcur">0:42</span>
                      <div className="hd-track" data-hd="track">
                        <b data-hd="tfill" />
                        <u data-hd="tknob" />
                        <i className="hd-trail" data-hd="trail" />
                      </div>
                      <span>8:30</span>
                    </div>
                    <div className="hd-flash" data-hd="flash" />
                    <div className="hd-toast" data-hd="toast" />
                  </div>
                  <div className="hd-dub">
                    <div data-hd="menu" />
                    <div className="hd-lang" data-hd="langBtn">
                      <span>🌐</span>
                      <div>
                        <small>{t('player.dubLabel')}</small>
                        <strong data-hd="langName">
                          {DEMO_LANGUAGES[0]?.name}
                          {t('originalSuffix')}
                        </strong>
                      </div>
                      <span className="hd-caretdown">▾</span>
                    </div>
                    <div className="hd-sw">
                      {t('player.listenOriginal')} <i />
                    </div>
                  </div>
                </div>
                <div className="hd-side" data-hd="side">
                  <div className="hd-tabs">
                    <div className="hd-on" data-hd="tabLessons">
                      {t('player.tabLessons')}
                    </div>
                    <div data-hd="tabTutor">{t('player.tabTutor')}</div>
                  </div>
                  <div className="hd-pane">
                    <div className="hd-lessons">
                      {lessons.map((name, i) => (
                        <div key={name} className={`hd-les${i === 0 ? ' hd-done' : ''}${i === 1 ? ' hd-cur' : ''}`}>
                          <i>{i === 0 ? '✓' : ''}</i>
                          {name}
                        </div>
                      ))}
                    </div>
                    <div className="hd-chat">
                      <div className="hd-msgs" data-hd="msgs" />
                      <div className="hd-input" data-hd="input">
                        <span data-hd="typed" />
                        <b data-hd="send">➤</b>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div data-hd="ring" />
            <div data-hd="cursor">
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 2l15 9-6.5 1.5L9.5 19z" fill="#0A2540" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-3 text-xs text-ink-muted">
        <div className="flex gap-1.5" aria-hidden="true">
          {stepLabels.map((label, i) => (
            <i
              key={label}
              className={`block h-1 w-7 rounded-sm transition-colors duration-300 ${i === step ? 'bg-accent' : 'bg-line'}`}
            />
          ))}
        </div>
        <span data-testid="step-badge">
          {step + 1}. {stepLabels[step]}
        </span>
      </div>
    </div>
  );
}

/** Bìa khóa UI/UX vẽ bằng CSS, dùng chung ở danh sách, ảnh phóng to và khung video. */
function UxCover() {
  return (
    <>
      <i className="hd-f1" />
      <i className="hd-f2" />
      <i className="hd-f3" />
      <i className="hd-f4" />
      <i className="hd-cur" />
    </>
  );
}
