import { DEMO_JUMP_SUBTITLE, DEMO_JUMP_SECONDS, DEMO_PICKED_INDEX, DEMO_START_SECONDS, DEMO_TOTAL_SECONDS } from '@/lib/home/demoScenes';

/** Chuỗi hiển thị trong cảnh demo, lấy từ i18n để cùng đổi theo ngôn ngữ giao diện. */
export interface DemoTexts {
  captions: { pick: string; play: string; original: string; chooseLang: string; askTutor: string; clickTime: string; jumped: string };
  chatQuestion: string;
  chatAnswer: string;
  aiName: string;
  aiThinking: string;
  jumpToast: string;
  badgeOriginal: string;
  badgeReady: string;
  originalSuffix: string;
}

export interface DemoLang {
  name: string;
  subtitle: string;
}

export interface DemoTimelineOptions {
  texts: DemoTexts;
  /** Thứ tự các giọng hiển thị trong menu (chỉ số 0 là bản gốc). */
  menuLangs: ReadonlyArray<DemoLang>;
  /** Các lần chọn giọng: [chỉ mục trong menu, chỉ mục đang chọn trước đó]. */
  picks: ReadonlyArray<readonly [number, number]>;
  onStep: (step: 0 | 1 | 2) => void;
}

const secs = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Điều khiển cảnh demo bằng thao tác DOM theo kịch bản (con trỏ, phóng to, gõ chữ…) — các phần tử được
 * tìm theo `data-hd`. Trả về hàm dừng. Chỉ chạm transform/opacity nên không gây reflow nặng. */
export function startHeroDemo(root: HTMLElement, opts: DemoTimelineOptions): () => void {
  const { texts, menuLangs, picks, onStep } = opts;
  let token = 0;
  let stopped = false;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const later = (fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  };
  const sleep = (ms: number) => new Promise<void>((r) => later(r, ms));
  const q = (name: string): HTMLElement => {
    const el = root.querySelector<HTMLElement>(`[data-hd="${name}"]`);
    if (!el) throw new Error(`hero demo: thiếu phần tử ${name}`);
    return el;
  };
  const frame = root;
  const cam = q('cam');
  const cursor = q('cursor');
  const ring = q('ring');
  const scale = () => (frame.clientWidth || 800) / 800;

  let camK = 1;
  let camTx = 0;
  let camTy = 0;
  let cx = 640;
  let cy = 400;
  let vt = DEMO_START_SECONDS;
  let playing = false;
  let vtimer: ReturnType<typeof setInterval> | undefined;

  const center = (el: HTMLElement, dx = 0, dy = 0): [number, number] => {
    const r = el.getBoundingClientRect();
    const f = frame.getBoundingClientRect();
    const s = scale();
    const sx = (r.left - f.left + r.width / 2) / s;
    const sy = (r.top - f.top + r.height / 2) / s;
    return [(sx - camTx) / camK + dx, (sy - camTy) / camK + dy];
  };
  const move = async (el: HTMLElement, dx = 0, dy = 0, t = 850) => {
    const [x, y] = center(el, dx, dy);
    cx = x;
    cy = y;
    cursor.style.transform = `translate(${x}px,${y}px)`;
    await sleep(t);
  };
  const click = async () => {
    cursor.classList.add('hd-click');
    ring.style.left = `${cx}px`;
    ring.style.top = `${cy}px`;
    ring.classList.remove('hd-go');
    void ring.offsetWidth;
    ring.classList.add('hd-go');
    await sleep(300);
    cursor.classList.remove('hd-click');
  };
  const zoomTo = (el: HTMLElement, k: number) => {
    const [x, y] = center(el);
    camK = k;
    camTx = Math.min(0, Math.max(800 * (1 - k), 400 - k * x));
    camTy = Math.min(0, Math.max(450 * (1 - k), 225 - k * y));
    cam.style.transform = `translate(${camTx}px,${camTy}px) scale(${k})`;
  };
  const zoomOut = () => {
    camK = 1;
    camTx = 0;
    camTy = 0;
    cam.style.transform = 'translate(0,0) scale(1)';
  };
  const caption = (text: string) => {
    const c = q('cap');
    if (!text) {
      c.classList.remove('hd-show');
      return;
    }
    c.textContent = text;
    c.classList.add('hd-show');
  };
  const renderVideo = () => {
    q('tcur').textContent = secs(vt);
    const p = (vt / DEMO_TOTAL_SECONDS) * 100;
    q('tfill').style.width = `${p}%`;
    q('tknob').style.left = `${p}%`;
  };
  const startVideo = () => {
    if (vtimer) clearInterval(vtimer);
    playing = true;
    vtimer = setInterval(() => {
      if (playing) {
        vt += 1.2;
        renderVideo();
      }
    }, 300);
  };
  const setSub = (text: string) => {
    const s = q('sub');
    s.style.opacity = '0';
    later(() => {
      s.textContent = text;
      s.style.opacity = '1';
    }, 180);
  };
  const buildMenu = (activeIdx: number, hov: number) => {
    const m = q('menu');
    m.textContent = '';
    menuLangs.forEach((lang, i) => {
      const item = document.createElement('div');
      item.className = `hd-item${i === activeIdx ? ' hd-act' : ''}${i === hov ? ' hd-hov' : ''}`;
      item.dataset.i = String(i);
      item.append(lang.name);
      const badge = document.createElement('span');
      badge.textContent = i === 0 ? texts.badgeOriginal : texts.badgeReady;
      item.append(badge);
      m.append(item);
    });
  };
  /** Cuộn mượt theo từng nhịp 16ms (không dùng requestAnimationFrame để hẹn giờ dừng được khi tháo component). */
  const smoothScroll = (el: HTMLElement, to: number, ms: number) =>
    new Promise<void>((res) => {
      const from = el.scrollTop;
      const steps = Math.max(1, Math.round(ms / 16));
      const my = token;
      let i = 0;
      const tick = () => {
        if (my !== token || stopped) return res();
        i += 1;
        const k = i / steps;
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        el.scrollTop = from + (to - from) * e;
        if (i < steps) later(tick, 16);
        else res();
      };
      later(tick, 16);
    });
  const typeText = async (str: string, my: number) => {
    const el = q('typed');
    const caret = document.createElement('span');
    caret.className = 'hd-caret';
    let out = '';
    for (const ch of str) {
      if (my !== token || stopped) return;
      out += ch;
      el.textContent = out;
      el.append(caret);
      await sleep(55);
    }
    await sleep(250);
  };

  const reset = () => {
    if (vtimer) clearInterval(vtimer);
    playing = false;
    vt = DEMO_START_SECONDS;
    renderVideo();
    q('s1').classList.add('hd-show');
    q('player').classList.remove('hd-show');
    const z = q('zoom');
    z.removeAttribute('style');
    z.style.display = 'none';
    root.querySelectorAll('.hd-card').forEach((c) => c.classList.remove('hd-hover'));
    q('list').scrollTop = 0;
    q('side').classList.remove('hd-tutor');
    q('tabLessons').classList.add('hd-on');
    q('tabTutor').classList.remove('hd-on');
    q('msgs').textContent = '';
    q('typed').textContent = '';
    q('menu').classList.remove('hd-open');
    q('langName').textContent = `${menuLangs[0]?.name ?? ''}${texts.originalSuffix}`;
    q('sub').textContent = menuLangs[0]?.subtitle ?? '';
    q('sub').style.opacity = '0';
    q('bigplay').classList.remove('hd-hide');
    q('track').classList.remove('hd-jump');
    buildMenu(0, -1);
    caption('');
    zoomOut();
    cursor.style.transition = 'none';
    cx = 640;
    cy = 400;
    cursor.style.transform = 'translate(640px,400px)';
    void cursor.offsetWidth;
    cursor.style.transition = '';
  };

  async function run() {
    const my = ++token;
    const alive = () => my === token && !stopped;
    reset();
    onStep(0);
    await sleep(500);
    if (!alive()) return;

    // Bước 1: cuộn danh sách, chọn một khóa
    caption(texts.captions.pick);
    const list = q('list');
    const cards = [...root.querySelectorAll<HTMLElement>('.hd-card')];
    const pick = cards[DEMO_PICKED_INDEX];
    const firstCard = cards[1];
    if (!pick || !firstCard) return;
    await move(firstCard, 20, 30, 900);
    if (!alive()) return;
    await smoothScroll(list, 70, 1300);
    if (!alive()) return;
    await sleep(250);
    await smoothScroll(list, 150, 1200);
    if (!alive()) return;
    await sleep(300);
    await move(pick, 0, -6, 1000);
    if (!alive()) return;
    pick.classList.add('hd-hover');
    await sleep(900);
    if (!alive()) return;
    await click();
    if (!alive()) return;
    const z = q('zoom');
    const pr = pick.getBoundingClientRect();
    const sr = q('s1').getBoundingClientRect();
    const s = scale();
    z.style.cssText = `display:block;left:${(pr.left - sr.left) / s}px;top:${(pr.top - sr.top) / s}px;width:${pr.width / s}px;height:${pr.height / s}px`;
    void z.offsetWidth;
    z.style.left = '0px';
    z.style.top = '0px';
    z.style.width = '800px';
    z.style.height = '450px';
    z.style.borderRadius = '0';
    await sleep(750);
    if (!alive()) return;

    // Bước 2: bấm phát rồi đổi ngôn ngữ
    q('player').classList.add('hd-show');
    await sleep(250);
    q('s1').classList.remove('hd-show');
    onStep(1);
    caption(texts.captions.play);
    await sleep(700);
    if (!alive()) return;
    await move(q('bigplay'), 0, 0, 1100);
    if (!alive()) return;
    await click();
    q('bigplay').classList.add('hd-hide');
    q('sub').style.opacity = '1';
    startVideo();
    caption(texts.captions.original);
    await sleep(1800);
    if (!alive()) return;
    caption(texts.captions.chooseLang);
    const btn = q('langBtn');
    const menu = q('menu');
    const choose = async (idx: number, cur: number, first: boolean) => {
      await move(btn, -20, 0, 1000);
      if (!alive()) return false;
      if (first) {
        zoomTo(btn, 1.55);
        await sleep(900);
        if (!alive()) return false;
      }
      await click();
      btn.classList.add('hd-press');
      buildMenu(cur, -1);
      menu.classList.add('hd-open');
      later(() => btn.classList.remove('hd-press'), 200);
      await sleep(first ? 800 : 500);
      if (!alive()) return false;
      buildMenu(cur, idx);
      const item = menu.querySelector<HTMLElement>(`[data-i="${idx}"]`);
      if (item) await move(item, -30, 0, 800);
      if (!alive()) return false;
      await click();
      menu.classList.remove('hd-open');
      if (first) {
        await sleep(600);
        zoomOut();
        await sleep(300);
      }
      return true;
    };
    let first = true;
    for (const [mi, cur] of picks) {
      if (!(await choose(mi, cur, first))) return;
      first = false;
      const lang = menuLangs[mi];
      if (lang) {
        q('langName').textContent = lang.name;
        setSub(lang.subtitle);
      }
      await sleep(1500);
      if (!alive()) return;
    }

    // Bước 3: hỏi AI Tutor
    onStep(2);
    caption(texts.captions.askTutor);
    await move(q('tabTutor'), 0, 0, 1000);
    if (!alive()) return;
    zoomTo(q('tabTutor'), 1.6);
    await sleep(900);
    if (!alive()) return;
    await click();
    q('side').classList.add('hd-tutor');
    q('tabLessons').classList.remove('hd-on');
    q('tabTutor').classList.add('hd-on');
    await sleep(900);
    if (!alive()) return;
    await move(q('input'), 20, 0, 800);
    if (!alive()) return;
    zoomTo(q('input'), 1.7);
    await sleep(900);
    if (!alive()) return;
    await click();
    await typeText(texts.chatQuestion, my);
    if (!alive()) return;
    await move(q('send'), 0, 0, 500);
    if (!alive()) return;
    const sendBtn = q('send');
    sendBtn.classList.add('hd-press');
    await click();
    sendBtn.classList.remove('hd-press');
    q('typed').textContent = '';
    const msgs = q('msgs');
    const me = document.createElement('div');
    me.className = 'hd-bub hd-me';
    me.textContent = texts.chatQuestion;
    msgs.append(me);
    requestAnimationFrame(() => me.classList.add('hd-in'));
    zoomTo(msgs, 1.45);
    await sleep(600);
    const thinking = document.createElement('div');
    thinking.className = 'hd-aiRow';
    const av = document.createElement('div');
    av.className = 'hd-aiav hd-pulse';
    av.textContent = '✦';
    const col = document.createElement('div');
    const nm = document.createElement('div');
    nm.className = 'hd-ainame';
    nm.textContent = texts.aiThinking;
    const dots = document.createElement('div');
    dots.className = 'hd-bub hd-ai hd-think hd-in';
    dots.innerHTML = '<i></i><i></i><i></i>';
    col.append(nm, dots);
    thinking.append(av, col);
    msgs.append(thinking);
    await sleep(2100);
    if (!alive()) return;
    thinking.remove();
    const answer = document.createElement('div');
    answer.className = 'hd-aiRow';
    const av2 = document.createElement('div');
    av2.className = 'hd-aiav';
    av2.textContent = '✦';
    const col2 = document.createElement('div');
    const nm2 = document.createElement('div');
    nm2.className = 'hd-ainame';
    nm2.textContent = texts.aiName;
    const bub = document.createElement('div');
    bub.className = 'hd-bub hd-ai';
    bub.append(`${texts.chatAnswer} `);
    const chip = document.createElement('span');
    chip.className = 'hd-chip';
    chip.dataset.hd = 'chip';
    chip.textContent = secs(DEMO_JUMP_SECONDS).padStart(5, '0');
    bub.append(chip);
    col2.append(nm2, bub);
    answer.append(av2, col2);
    msgs.append(answer);
    requestAnimationFrame(() => bub.classList.add('hd-in'));
    await sleep(1200);
    if (!alive()) return;
    caption(texts.captions.clickTime);
    chip.classList.add('hd-pulse');
    await move(chip, 0, 0, 1000);
    if (!alive()) return;
    zoomTo(chip, 2);
    await sleep(1100);
    if (!alive()) return;
    chip.classList.remove('hd-pulse');
    chip.classList.add('hd-press');
    await click();
    await sleep(450);
    zoomOut();
    await sleep(700);
    if (!alive()) return;

    // Hiệu ứng tua tới mốc thời gian
    caption(texts.captions.jumped);
    const track = q('track');
    playing = false;
    const fromP = (vt / DEMO_TOTAL_SECONDS) * 100;
    const toP = (DEMO_JUMP_SECONDS / DEMO_TOTAL_SECONDS) * 100;
    const trail = q('trail');
    trail.style.left = `${fromP}%`;
    trail.style.width = `${toP - fromP}%`;
    trail.classList.remove('hd-go');
    void trail.offsetWidth;
    trail.classList.add('hd-go');
    track.classList.add('hd-jump');
    vt = DEMO_JUMP_SECONDS;
    renderVideo();
    setSub(DEMO_JUMP_SUBTITLE);
    const toast = q('toast');
    toast.textContent = texts.jumpToast;
    toast.classList.remove('hd-go');
    void toast.offsetWidth;
    toast.classList.add('hd-go');
    const flash = q('flash');
    flash.classList.remove('hd-go');
    void flash.offsetWidth;
    flash.classList.add('hd-go');
    chip.classList.remove('hd-press');
    await sleep(1300);
    track.classList.remove('hd-jump');
    playing = true;
    await move(q('video'), 90, 60, 900);
    await sleep(3000);
    if (!alive()) return;
    caption('');
    await sleep(600);
    if (alive()) void run();
  }

  void run();
  return () => {
    stopped = true;
    token += 1;
    timers.forEach((id) => clearTimeout(id));
    timers.clear();
    if (vtimer) clearInterval(vtimer);
  };
}

/** Trạng thái tĩnh cho người bật "giảm chuyển động": dừng ở khoảnh khắc hỏi AI Tutor đã có câu trả lời. */
export function showHeroDemoFinal(root: HTMLElement, texts: DemoTexts, finalLang: DemoLang): void {
  const q = (name: string) => root.querySelector<HTMLElement>(`[data-hd="${name}"]`);
  q('s1')?.classList.remove('hd-show');
  q('player')?.classList.add('hd-show');
  q('bigplay')?.classList.add('hd-hide');
  q('side')?.classList.add('hd-tutor');
  q('tabLessons')?.classList.remove('hd-on');
  q('tabTutor')?.classList.add('hd-on');
  const sub = q('sub');
  if (sub) {
    sub.textContent = finalLang.subtitle;
    sub.style.opacity = '1';
  }
  const lang = q('langName');
  if (lang) lang.textContent = finalLang.name;
  const msgs = q('msgs');
  if (msgs) {
    const me = document.createElement('div');
    me.className = 'hd-bub hd-me hd-in';
    me.textContent = texts.chatQuestion;
    const row = document.createElement('div');
    row.className = 'hd-aiRow';
    const av = document.createElement('div');
    av.className = 'hd-aiav';
    av.textContent = '✦';
    const col = document.createElement('div');
    const nm = document.createElement('div');
    nm.className = 'hd-ainame';
    nm.textContent = texts.aiName;
    const bub = document.createElement('div');
    bub.className = 'hd-bub hd-ai hd-in';
    bub.append(`${texts.chatAnswer} `);
    const chip = document.createElement('span');
    chip.className = 'hd-chip';
    chip.textContent = secs(DEMO_JUMP_SECONDS).padStart(5, '0');
    bub.append(chip);
    col.append(nm, bub);
    row.append(av, col);
    msgs.append(me, row);
  }
  const cur = q('tcur');
  if (cur) cur.textContent = secs(DEMO_JUMP_SECONDS);
  const p = (DEMO_JUMP_SECONDS / DEMO_TOTAL_SECONDS) * 100;
  const fill = q('tfill');
  if (fill) fill.style.width = `${p}%`;
  const knob = q('tknob');
  if (knob) knob.style.left = `${p}%`;
}
