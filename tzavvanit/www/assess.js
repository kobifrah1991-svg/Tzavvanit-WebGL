'use strict';
// Progress assessment: five short, fixed (non-adaptive) computer tasks modelled on standard
// paradigms — simple reaction time, Go/No-Go, a Corsi-style spatial span, Stroop, and paced/
// unpaced tapping. Results are compared only with the same child's earlier assessments:
// there are no age norms, so this is a progress tracker, not a diagnosis or an IQ test.
(() => {
  const { $, sleep, rand, save, persist, t, Sound, vibrate, Mini, CHECK, esc } = TZ;

  TZ.addStrings({
    g_assess: 'מבדק התקדמות',
    as_card: 'מבדק התקדמות', as_cardFirst: 'מבדק ראשון: 5 משימות קצרות, כ-6 דקות', as_cardDue: 'הגיע הזמן למבדק חוזר',
    as_cardNext: n => `מבדק חוזר מומלץ בעוד ${n} ימים`, as_start: 'להתחיל מבדק', as_view: 'לדוח',
    as_go: 'התחילו', as_task: (n, of) => `משימה ${n} מתוך ${of}`, as_done: 'סיימתם את המבדק!', as_early: 'מוקדם מדי! חכו לירוק',
    as_rt_t: 'תגובה מהירה', as_rt_d: 'כשהעיגול נהיה ירוק – הקישו עליו הכי מהר שאפשר. לא להקדים!',
    as_gng_t: 'עצור או סע', as_gng_d: 'עיגול ירוק – הקישו מהר. ריבוע אדום – אל תקישו!',
    as_span_t: 'זיכרון ריבועים', as_span_d: 'ריבועים יידלקו בזה אחר זה. הקישו עליהם באותו סדר.',
    as_st_t: 'צבע הדיו', as_st_d: 'הקישו על הצבע שבו כתובה המילה, לא על מה שכתוב.',
    as_tm_t: 'שמירת קצב', as_tm_d: 'הקישו על התוף יחד עם הקצב. כשהקצב ייעלם – המשיכו באותו קצב בעצמכם.',
    as_tm_go: 'הקישו עם הקצב', as_tm_alone: 'המשיכו לבד באותו קצב!',
    rep_title: 'דוח מבדק התקדמות', rep_for: (n, a) => `${n}${a ? ` · גיל ${a}` : ''}`, rep_date: d => `תאריך המבדק: ${d}`,
    rep_first: 'זהו המבדק הראשון – הוא ישמש נקודת התחלה. מבדק חוזר בעוד כ-4 שבועות יראה את השינוי.',
    rep_vs: d => `השוואה למבדק מ-${d}`, rep_improved: (n, of) => `שיפור ב-${n} מתוך ${of} תחומים`,
    rep_better: 'השתפר', rep_same: 'ללא שינוי משמעותי', rep_worse: 'ירד', rep_prev: 'קודם',
    rep_train: 'משחקים לאימון:', rep_history: 'מבדקים קודמים', rep_print: 'הדפסה / PDF',
    rep_note: 'המבדק מודד ביצועים במשימות מחשב קצרות ומוכרות מהמחקר (זמן תגובה, Go/No-Go, טווח זיכרון חזותי, Stroop ותזמון). הוא אינו אבחון, אינו מבחן IQ ואינו משווה לנורמות גיל – ההשוואה היא רק לביצועים הקודמים של אותו ילד. תוצאה בודדת מושפעת ממצב רוח, עייפות וסביבה. לשאלות על קשב, למידה או התפתחות – כדאי לפנות לפסיכולוג/ית חינוכי/ת.',
    d_speed: 'מהירות עיבוד', d_attn: 'קשב מתמשך', d_inhib: 'שליטה בתגובה', d_wm: 'זיכרון עבודה חזותי', d_ctrl: 'גמישות ושליטה קוגניטיבית', d_timing: 'תזמון וקצב',
    m_rt: 'זמן תגובה חציוני', m_rtsd: 'יציבות (סטיית תקן)', m_omit: 'החמצות', m_comm: 'תגובות פזיזות', m_span: 'טווח זיכרון',
    m_interf: 'אפקט הפרעה', m_stacc: 'דיוק', m_async: 'סטייה מהקצב', m_cv: 'אחידות בקצב עצמאי',
    u_ms: 'מ"ש', u_pct: '%', u_items: 'פריטים',
    rep_ver: 'המבדק הקודם נעשה בגרסה אחרת של המשימות, לכן ההשוואה פחות מדויקת.',
    rs_title: 'מצב מחקר', rs_desc: 'למחקרי תיקוף בלבד. כל ילד מקבל קוד, וקובץ הייצוא כולל כל תגובה בנפרד, בלי שמות.',
    rs_on: 'מצב מחקר פעיל', rs_code: 'קוד', rs_tests: 'מבדקים', rs_export: 'ייצוא נתוני מחקר (CSV)',
    rs_note: 'טבלת הקודים מול השמות מופיעה רק כאן. שמרו אותה בנפרד מהקובץ ואל תשלחו אותה יחד איתו.',
    rs_ver: v => `גרסת משימות: ${v}`,
  }, {
    g_assess: 'Progress assessment',
    as_card: 'Progress assessment', as_cardFirst: 'First assessment: 5 short tasks, about 6 minutes', as_cardDue: 'Time for a follow-up assessment',
    as_cardNext: n => `Follow-up recommended in ${n} days`, as_start: 'Start assessment', as_view: 'Report',
    as_go: 'Start', as_task: (n, of) => `Task ${n} of ${of}`, as_done: 'Assessment complete!', as_early: 'Too early! Wait for green',
    as_rt_t: 'Quick reaction', as_rt_d: 'When the circle turns green, tap it as fast as you can. Don\'t jump the gun!',
    as_gng_t: 'Go or stop', as_gng_d: 'Green circle – tap fast. Red square – don\'t tap!',
    as_span_t: 'Square memory', as_span_d: 'Squares will light up one after another. Tap them in the same order.',
    as_st_t: 'Ink color', as_st_d: 'Tap the color the word is written in, not what it says.',
    as_tm_t: 'Keep the tempo', as_tm_d: 'Tap the drum with the beat. When the beat disappears, keep going at the same tempo.',
    as_tm_go: 'Tap with the beat', as_tm_alone: 'Keep going on your own!',
    rep_title: 'Progress assessment report', rep_for: (n, a) => `${n}${a ? ` · age ${a}` : ''}`, rep_date: d => `Assessment date: ${d}`,
    rep_first: 'This is the first assessment – it serves as the starting point. A follow-up in about 4 weeks will show the change.',
    rep_vs: d => `Compared with ${d}`, rep_improved: (n, of) => `Improved in ${n} of ${of} areas`,
    rep_better: 'Improved', rep_same: 'No meaningful change', rep_worse: 'Declined', rep_prev: 'Before',
    rep_train: 'Games that train it:', rep_history: 'Earlier assessments', rep_print: 'Print / PDF',
    rep_note: 'The assessment measures performance on short computer tasks well known from research (reaction time, Go/No-Go, visual memory span, Stroop and timing). It is not a diagnosis, not an IQ test, and is not compared with age norms – it compares only with the same child\'s earlier results. A single result is affected by mood, tiredness and surroundings. For questions about attention, learning or development, consult an educational psychologist.',
    d_speed: 'Processing speed', d_attn: 'Sustained attention', d_inhib: 'Response control', d_wm: 'Visual working memory', d_ctrl: 'Cognitive control', d_timing: 'Timing and rhythm',
    m_rt: 'Median reaction time', m_rtsd: 'Consistency (SD)', m_omit: 'Missed', m_comm: 'Impulsive taps', m_span: 'Memory span',
    m_interf: 'Interference effect', m_stacc: 'Accuracy', m_async: 'Offset from beat', m_cv: 'Steadiness on own',
    u_ms: 'ms', u_pct: '%', u_items: 'items',
    rep_ver: 'The previous assessment used a different version of the tasks, so the comparison is less precise.',
    rs_title: 'Research mode', rs_desc: 'For validation studies only. Each child gets a code, and the export holds every response, with no names.',
    rs_on: 'Research mode on', rs_code: 'Code', rs_tests: 'Assessments', rs_export: 'Export research data (CSV)',
    rs_note: 'The code-to-name table appears only here. Keep it apart from the file and never send them together.',
    rs_ver: v => `Task version: ${v}`,
  });

  // Any change to a task's timing, trial counts or scoring must bump this version:
  // results from different versions are not comparable and would break age norms.
  const ASSESS_VERSION = '1.0.0';
  const RESEARCH_KEY = 'tzavvanit_research';
  const research = (() => { try { return JSON.parse(localStorage.getItem(RESEARCH_KEY) || 'null') || { on: false }; } catch (e) { return { on: false }; } })();
  const saveResearch = () => { try { localStorage.setItem(RESEARCH_KEY, JSON.stringify(research)); } catch (e) { /* ignore */ } };

  const ASSESS = { id: 'assess' };
  const COLORS = ['#ff4d4d', '#ffc21a', '#22b04b', '#2f6bff'];
  const median = a => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const sd = a => { if (a.length < 2) return 0; const m = a.reduce((x, y) => x + y, 0) / a.length; return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1)); };
  const shuffle = a => a.sort(() => Math.random() - 0.5);

  // Domains, their metrics, and whether a lower value is better. `pick` marks the metric
  // used for the "improved in N areas" summary; a change counts only past `minDelta`.
  const DOMAINS = [
    { id: 'speed', games: ['odd', 'math'], metrics: [{ k: 'rt_ms', l: 'm_rt', u: 'u_ms', low: true, pick: true, minDelta: 25 }, { k: 'rt_sd', l: 'm_rtsd', u: 'u_ms', low: true }] },
    { id: 'attn', games: ['rain', 'odd'], metrics: [{ k: 'gng_omit', l: 'm_omit', u: 'u_pct', low: true, pick: true, minDelta: 5 }] },
    { id: 'inhib', games: ['stroop', 'rain'], metrics: [{ k: 'gng_comm', l: 'm_comm', u: 'u_pct', low: true, pick: true, minDelta: 8 }] },
    { id: 'wm', games: ['simon', 'pairs'], metrics: [{ k: 'span', l: 'm_span', u: 'u_items', low: false, pick: true, minDelta: 1 }] },
    { id: 'ctrl', games: ['stroop', 'pattern'], metrics: [{ k: 'st_interf', l: 'm_interf', u: 'u_ms', low: true, pick: true, minDelta: 40 }, { k: 'st_acc', l: 'm_stacc', u: 'u_pct', low: false }] },
    { id: 'timing', games: ['beat', 'simon'], metrics: [{ k: 'tm_async', l: 'm_async', u: 'u_ms', low: true, pick: true, minDelta: 15 }, { k: 'tm_cv', l: 'm_cv', u: 'u_pct', low: true }] },
  ];

  // ---------- Task helpers ----------
  let alive = false, runToken = 0;
  // Resolves with the tap time, or null after `ms`
  const tapOrTimeout = (el, ms) => new Promise(res => {
    let done = false;
    const fin = v => { if (done) return; done = true; el.removeEventListener('pointerdown', on); clearTimeout(tm); res(v); };
    const on = e => { e.preventDefault(); fin(performance.now()); };
    el.addEventListener('pointerdown', on);
    const tm = setTimeout(() => fin(null), ms);
  });

  function intro(area, n, of, title, desc) {
    area.innerHTML = `<div class="as-intro"><span class="chip">${t('as_task', n, of)}</span><h2>${title}</h2><p>${desc}</p>
      <button class="btn primary" data-raw id="as-go">${t('as_go')}</button></div>`;
    return tapOrTimeout($('#as-go'), 10 * 60 * 1000);
  }

  // 1. Simple reaction time: 10 trials, random foreperiod, anticipations are repeated
  async function taskRT(area, live, rec) {
    area.innerHTML = `<div class="as-stage"><div class="as-msg" id="as-msg"></div><button class="as-target" id="as-t" data-raw></button></div>`;
    const el = $('#as-t'), msg = $('#as-msg');
    const rts = [];
    let antic = 0;
    for (let i = 0; i < 10 && live(); i++) {
      el.className = 'as-target wait'; msg.textContent = '';
      const fp = 1200 + rand(2000);
      const early = await tapOrTimeout(el, fp);
      if (!live()) return {};
      if (early) { antic++; rec({ task: 'rt', cond: 'anticipation', target: fp, resp: 1, correct: 0 }); msg.textContent = t('as_early'); vibrate(40); await sleep(900); i--; if (antic > 8) break; continue; }
      el.className = 'as-target go';
      const t0 = performance.now();
      const hit = await tapOrTimeout(el, 2000);
      el.className = 'as-target';
      rec({ task: 'rt', cond: 'go', target: fp, resp: hit ? 1 : 0, correct: hit ? 1 : 0, rt: hit ? hit - t0 : null });
      if (hit) { rts.push(hit - t0); Sound.tone(880, 0.06, 'sine', 0.2); }
      await sleep(350);
    }
    return { rt_ms: Math.round(median(rts)), rt_sd: Math.round(sd(rts)), rt_antic: antic };
  }

  // 2. Go/No-Go: 30 trials, 22 go / 8 no-go, 800 ms response window
  async function taskGNG(area, live, rec) {
    area.innerHTML = `<div class="as-stage"><button class="as-gng" id="as-g" data-raw></button></div>`;
    const el = $('#as-g');
    const trials = shuffle([...Array(22).fill('go'), ...Array(8).fill('no')]);
    let omit = 0, comm = 0;
    const rts = [];
    for (const kind of trials) {
      if (!live()) return {};
      el.className = `as-gng ${kind}`;
      const t0 = performance.now();
      const hit = await tapOrTimeout(el, 800);
      el.className = 'as-gng';
      rec({ task: 'gng', cond: kind, resp: hit ? 1 : 0, correct: (kind === 'go') === !!hit ? 1 : 0, rt: hit ? hit - t0 : null });
      if (kind === 'go') { if (hit) rts.push(hit - t0); else omit++; }
      else if (hit) { comm++; vibrate(40); }
      await sleep(hit ? 800 - (hit - t0) + 450 : 450);
    }
    return { gng_omit: Math.round(100 * omit / 22), gng_comm: Math.round(100 * comm / 8), gng_rt: Math.round(median(rts)) };
  }

  // 3. Spatial span (Corsi-style) on a 3×3 grid: two tries per length, stop after both fail
  async function taskSpan(area, live, rec) {
    area.innerHTML = `<div class="as-stage"><div class="as-grid" id="as-grid" dir="ltr">${Array.from({ length: 9 }, (_, i) => `<button class="as-cell" data-raw data-i="${i}"></button>`).join('')}</div></div>`;
    const cells = [...area.querySelectorAll('.as-cell')];
    let span = 0;
    for (let len = 2; len <= 9 && live(); len++) {
      let passed = false;
      for (let attempt = 0; attempt < 2 && !passed && live(); attempt++) {
        const seq = [];
        while (seq.length < len) { const c = rand(9); if (seq[seq.length - 1] !== c) seq.push(c); }
        await sleep(600);
        for (const c of seq) {
          if (!live()) return {};
          cells[c].classList.add('lit'); Sound.tone(500 + c * 40, 0.15, 'sine', 0.2);
          await sleep(600); cells[c].classList.remove('lit'); await sleep(250);
        }
        let ok = true;
        const taps = [], r0 = performance.now();
        for (let k = 0; k < len && ok; k++) {
          const tapped = await new Promise(res => {
            const on = e => { const b = e.target.closest('.as-cell'); if (!b) return; e.preventDefault(); off(); res(Number(b.dataset.i)); };
            const off = () => { area.removeEventListener('pointerdown', on); clearTimeout(tm); };
            const tm = setTimeout(() => { off(); res(-1); }, 10000);
            area.addEventListener('pointerdown', on);
          });
          if (!live()) return {};
          if (tapped >= 0) { cells[tapped].classList.add('tap'); setTimeout(() => cells[tapped].classList.remove('tap'), 200); }
          taps.push(tapped);
          if (tapped !== seq[k]) ok = false;
        }
        rec({ task: 'span', cond: `len${len}`, target: seq.join('-'), resp: taps.join('-'), correct: ok ? 1 : 0, rt: performance.now() - r0 });
        if (ok) { passed = true; span = len; Sound.success(); } else { Sound.fail(); }
        await sleep(500);
      }
      if (!passed) break;
    }
    return { span };
  }

  // 4. Stroop: 20 trials (10 congruent, 10 incongruent), name the ink color
  async function taskStroop(area, live, rec) {
    const names = t('colorNames');
    area.innerHTML = `<div class="as-stage"><div class="word-card as-word-card"><div class="word" id="as-w"></div></div>
      <div class="choice-grid" dir="ltr">${COLORS.map((c, i) => `<button class="choice" data-raw data-i="${i}" style="--cc:${c}" aria-label="${names[i]}"></button>`).join('')}</div></div>`;
    const w = $('#as-w'), grid = area.querySelector('.choice-grid');
    const trials = shuffle([...Array(10).fill(true), ...Array(10).fill(false)]);
    const cong = [], inc = [];
    let correct = 0;
    for (const isCong of trials) {
      if (!live()) return {};
      const word = rand(4), ink = isCong ? word : (word + 1 + rand(3)) % 4;
      w.textContent = names[word]; w.style.color = COLORS[ink];
      const t0 = performance.now();
      const pick = await new Promise(res => {
        const on = e => { const b = e.target.closest('.choice'); if (!b) return; e.preventDefault(); off(); res({ i: Number(b.dataset.i), at: performance.now() }); };
        const off = () => { grid.removeEventListener('pointerdown', on); clearTimeout(tm); };
        const tm = setTimeout(() => { off(); res(null); }, 4000);
        grid.addEventListener('pointerdown', on);
      });
      rec({ task: 'stroop', cond: isCong ? 'congruent' : 'incongruent', target: `word${word}-ink${ink}`, resp: pick ? pick.i : '', correct: pick && pick.i === ink ? 1 : 0, rt: pick ? pick.at - t0 : null });
      if (pick && pick.i === ink) { correct++; (isCong ? cong : inc).push(pick.at - t0); }
      w.textContent = '';
      await sleep(400);
    }
    return { st_cong: Math.round(median(cong)), st_incong: Math.round(median(inc)), st_interf: Math.round(median(inc) - median(cong)), st_acc: Math.round(100 * correct / 20) };
  }

  // 5. Paced then unpaced tapping: 8 beats with a metronome at 600 ms, then 8 on their own
  async function taskTiming(area, live, rec) {
    area.innerHTML = `<div class="as-stage"><div class="as-msg" id="as-msg"></div><button class="drum" id="as-drum" data-raw><span class="ring"></span><span class="skin"></span></button></div>`;
    const drum = $('#as-drum'), msg = $('#as-msg');
    Sound.init();
    const ctx = Sound.ctx;
    const now = () => ctx ? ctx.currentTime : performance.now() / 1000;
    const lat = ctx ? (ctx.outputLatency || ctx.baseLatency || 0) : 0;
    const GAP = 0.6, PACED = 8, FREE = 8;
    const t0 = now() + 0.8;
    const beats = Array.from({ length: PACED }, (_, i) => t0 + i * GAP);
    const bus = ctx ? ctx.createGain() : null;
    if (bus) { bus.connect(Sound.master); beats.forEach(b => Sound.tone(990, 0.05, 'square', 0.25, b - now(), bus)); }
    const taps = [];
    const on = e => { e.preventDefault(); taps.push(now() - lat); drum.classList.remove('hit'); void drum.offsetWidth; drum.classList.add('hit'); };
    drum.addEventListener('pointerdown', on);
    msg.textContent = t('as_tm_go');
    // Visual pulse with each paced beat
    for (const b of beats) {
      await sleep(Math.max(0, (b - now()) * 1000));
      if (!live()) { drum.removeEventListener('pointerdown', on); if (bus) bus.disconnect(); return {}; }
      drum.classList.remove('pulse'); void drum.offsetWidth; drum.classList.add('pulse');
    }
    msg.textContent = t('as_tm_alone');
    msg.classList.add('alt');
    await sleep((FREE + 1) * GAP * 1000);
    drum.removeEventListener('pointerdown', on);
    if (bus) bus.disconnect();
    const end = beats[PACED - 1] + GAP / 2;
    const asyncs = beats.map(b => { const n = taps.filter(x => Math.abs(x - b) < 0.3).map(x => Math.abs(x - b) * 1000); return n.length ? Math.min(...n) : null; }).filter(v => v != null);
    // Each tap, in ms from the first beat; `target` is the nearest paced beat's index
    taps.forEach(x => rec({ task: 'timing', cond: x > end ? 'free' : 'paced', target: x > end ? '' : Math.round((x - t0) / GAP), rt: (x - t0) * 1000 }));
    const free = taps.filter(x => x > end);
    const itis = free.slice(1).map((x, i) => (x - free[i]) * 1000).filter(v => v > 250 && v < 1500);
    const m = itis.length ? itis.reduce((a, b) => a + b, 0) / itis.length : 0;
    return { tm_async: Math.round(asyncs.length ? median(asyncs) : 300), tm_cv: Math.round(m ? 100 * sd(itis) / m : 100), tm_iti: Math.round(m) };
  }

  const TASKS = [
    { title: 'as_rt_t', desc: 'as_rt_d', run: taskRT },
    { title: 'as_gng_t', desc: 'as_gng_d', run: taskGNG },
    { title: 'as_span_t', desc: 'as_span_d', run: taskSpan },
    { title: 'as_st_t', desc: 'as_st_d', run: taskStroop },
    { title: 'as_tm_t', desc: 'as_tm_d', run: taskTiming },
  ];

  // Device facts that affect timing: touch and display latency differ between phones,
  // so norms may need a correction per device class. Frame interval is measured live.
  function deviceInfo() {
    Sound.init();
    return new Promise(res => {
      const stamps = [];
      const done = () => {
        const gaps = stamps.slice(1).map((x, i) => x - stamps[i]);
        const ctx = Sound.ctx;
        res({
          ua: navigator.userAgent.slice(0, 160), w: screen.width, h: screen.height, dpr: Math.round((window.devicePixelRatio || 1) * 100) / 100,
          touch: navigator.maxTouchPoints || 0, frame: gaps.length ? Math.round(median(gaps) * 10) / 10 : null,
          audio: ctx ? Math.round(1000 * (ctx.outputLatency || ctx.baseLatency || 0)) : null,
        });
      };
      const tm = setTimeout(done, 1200);
      const f = ts => { stamps.push(ts); if (stamps.length < 31) requestAnimationFrame(f); else { clearTimeout(tm); done(); } };
      requestAnimationFrame(f);
    });
  }

  async function runAssessment() {
    const area = Mini.open(ASSESS);
    const chip = $('#screen-mini .diff-chip');
    if (chip) chip.remove();
    $('#mini-score').style.visibility = 'hidden';
    Mini.time(null);
    alive = true;
    const my = ++runToken;
    const live = () => alive && my === runToken;
    Mini.onLeave(() => { alive = false; });
    const m = {}, trials = [];
    const n = {};
    const rec = o => {
      n[o.task] = (n[o.task] || 0) + 1;
      trials.push({ ...o, i: n[o.task], rt: o.rt == null ? null : Math.round(o.rt) });
    };
    const started = new Date();
    // Games played earlier the same day can warm a child up; researchers may want to control for it
    const warmup = (save.history || []).filter(h => h.d === TZ.today()).length;
    const dev = await deviceInfo();
    for (let i = 0; i < TASKS.length; i++) {
      Mini.extra(`<span class="chip">${i + 1}/${TASKS.length}</span>`);
      const task = TASKS[i];
      await intro(area, i + 1, TASKS.length, t(task.title), t(task.desc));
      if (!live()) return;
      Object.assign(m, await task.run(area, live, rec));
      if (!live()) return;
    }
    alive = false;
    save.assessments.push({
      d: TZ.today(), age: TZ.me().age || 0, m, v: ASSESS_VERSION,
      at: started.toISOString(), mins: Math.round((Date.now() - started) / 6000) / 10, warmup, dev, trials,
    });
    persist();
    Sound.win();
    await TZ.modal(`${TZ.charWrap('happy')}<h2>${t('as_done')}</h2>`, [{ id: 'ok', label: t('as_view'), cls: 'primary' }]);
    openReport('title');
  }

  // ---------- Report ----------
  const fmt = (v, u) => `${v}${u === 'u_pct' ? '%' : ` ${t(u)}`}`;
  function compare(metric, now, prev) {
    if (prev == null || now == null) return null;
    const delta = now - prev, better = metric.low ? delta < 0 : delta > 0;
    if (Math.abs(delta) < (metric.minDelta || 1)) return 'same';
    return better ? 'better' : 'worse';
  }

  function openReport(backTo, idx) {
    const list = save.assessments;
    if (!list.length) return;
    const i = idx == null ? list.length - 1 : idx;
    const cur = list[i], prev = i > 0 ? list[i - 1] : null;
    let improved = 0;
    const domains = DOMAINS.map(dm => {
      const rows = dm.metrics.map(mt => {
        const v = cur.m[mt.k], pv = prev ? prev.m[mt.k] : null;
        const c = compare(mt, v, pv);
        if (mt.pick && c === 'better') improved++;
        return `<div class="rep-metric"><span>${t(mt.l)}</span><b>${v == null ? '—' : fmt(v, mt.u)}</b>
          ${c ? `<span class="trend ${c === 'better' ? 'up' : c === 'worse' ? 'down' : ''}">${t('rep_' + c)}</span><small>${t('rep_prev')}: ${fmt(pv, mt.u)}</small>` : ''}</div>`;
      }).join('');
      const games = dm.games.map(id => TZ.t('g_' + id)).join(' · ');
      return `<div class="rep-domain"><h3>${t('d_' + dm.id)}</h3>${rows}<p class="rep-train">${t('rep_train')} ${games}</p></div>`;
    }).join('');
    const history = list.map((a, k) => `<button class="chip${k === i ? ' on' : ''}" data-act="report-at" data-i="${k}">${a.d}</button>`).join('');
    $('#screen-report').innerHTML = `<header class="topbar"><button class="icon-btn" data-back aria-label="back">${TZ.BACK}</button><h2>${t('rep_title')}</h2></header>
      <div class="scroll report">
        <div class="rep-head"><b>${esc(t('rep_for', TZ.playerName(TZ.me()), cur.age))}</b><small>${t('rep_date', cur.d)}</small>
          ${prev ? `<div class="badge">${t('rep_improved', improved, DOMAINS.length)}</div><small>${t('rep_vs', prev.d)}</small>` : `<p>${t('rep_first')}</p>`}
          ${prev && (prev.v || '0') !== (cur.v || '0') ? `<p class="rep-warn">${t('rep_ver')}</p>` : ''}</div>
        ${domains}
        ${list.length > 1 ? `<h3 class="sec">${t('rep_history')}</h3><div class="rep-history">${history}</div>` : ''}
        <button class="btn small no-print" data-act="print">${t('rep_print')}</button>
        <p class="p-note">${t('rep_note')}</p>
      </div>`;
    TZ.reportBack = backTo;
    TZ.show('report');
  }

  TZ.actions.assess = () => runAssessment();
  TZ.actions.report = () => openReport(document.querySelector('#screen-parents.active') ? 'parents' : 'title');
  TZ.actions['report-at'] = el => openReport(TZ.reportBack, Number(el.dataset.i));
  TZ.actions.print = () => window.print();

  // ---------- Research mode ----------
  // Pseudonymous codes live on the profile; the export carries codes only, never names.
  const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function ensureCodes() {
    const P = TZ.profiles();
    const used = new Set(P.list.map(p => p.code).filter(Boolean));
    let changed = false;
    for (const p of P.list) {
      if (p.code) continue;
      let c;
      do { c = 'TZ-' + Array.from({ length: 4 }, () => CODE_CHARS[rand(CODE_CHARS.length)]).join(''); } while (used.has(c));
      used.add(c); p.code = c; changed = true;
    }
    if (changed) TZ.saveProfiles();
  }

  function exportResearch() {
    ensureCodes();
    const head = ['code', 'age', 'test_no', 'date', 'started_at', 'task_version', 'minutes', 'games_before_same_day',
      'dev_screen', 'dev_dpr', 'dev_touch', 'dev_frame_ms', 'dev_audio_ms', 'dev_ua', 'task', 'trial', 'cond', 'target', 'resp', 'correct', 'rt_ms'];
    const rows = [head];
    for (const p of TZ.profiles().list) {
      const s = TZ.readSave(p.id);
      (s.assessments || []).forEach((a, k) => {
        const dv = a.dev || {};
        const base = [p.code, a.age || p.age || '', k + 1, a.d, a.at || '', a.v || 'pre-1.0', a.mins == null ? '' : a.mins, a.warmup == null ? '' : a.warmup,
          dv.w ? `${dv.w}x${dv.h}` : '', dv.dpr, dv.touch, dv.frame, dv.audio, dv.ua];
        for (const tr of a.trials || []) rows.push([...base, tr.task, tr.i, tr.cond, tr.target, tr.resp, tr.correct, tr.rt]);
        // Summary scores as rows with task "summary", so one file holds everything
        for (const [key, val] of Object.entries(a.m || {})) rows.push([...base, 'summary', '', key, '', '', '', val]);
      });
    }
    TZ.downloadCsv(`tzavvanit-research-${TZ.today()}.csv`, rows);
  }

  const rerenderKeepScroll = () => {
    const sc = document.querySelector('#screen-parents .scroll');
    const y = sc ? sc.scrollTop : 0;
    TZ.rerender();
    const sc2 = document.querySelector('#screen-parents .scroll');
    if (sc2) sc2.scrollTop = y;
  };
  TZ.actions['research-toggle'] = () => {
    research.on = !research.on;
    saveResearch();
    if (research.on) ensureCodes();
    rerenderKeepScroll();
  };
  TZ.actions['research-export'] = () => exportResearch();

  TZ.eduExtras.push(() => {
    const head = `<h3 class="sec">${t('rs_title')}</h3>
      <div class="setting"><div class="info"><b>${t('rs_on')}</b><small>${t('rs_desc')}</small></div>
      <button class="toggle" data-act="research-toggle" aria-pressed="${research.on}" aria-label="${t('rs_on')}"></button></div>`;
    if (!research.on) return head;
    ensureCodes();
    const rows = TZ.profiles().list.map(p => `<tr><td><b dir="ltr">${esc(p.code)}</b></td><td>${esc(TZ.playerName(p))}</td><td>${p.age || ''}</td><td>${(TZ.readSave(p.id).assessments || []).length}</td></tr>`).join('');
    return `${head}
      <div class="edu-table-wrap"><table class="edu-table"><thead><tr><th>${t('rs_code')}</th><th>${t('playerName')}</th><th>${t('age')}</th><th>${t('rs_tests')}</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="p-note">${t('rs_note')}</p>
      <div class="edu-actions"><button class="btn small primary" data-act="research-export">${t('rs_export')}</button><small class="muted">${t('rs_ver', ASSESS_VERSION)}</small></div>`;
  });

  // Home-screen card: first assessment, follow-up reminder every 28 days
  TZ.hubCards.push(() => {
    const list = save.assessments || [];
    const last = list[list.length - 1];
    let sub = t('as_cardFirst');
    if (last) {
      const [y, mo, d] = last.d.split('-').map(Number);
      const days = Math.floor((Date.now() - new Date(y, mo - 1, d)) / 86400000);
      sub = days >= 28 ? t('as_cardDue') : t('as_cardNext', 28 - days);
    }
    return `<div class="assess-card"><div class="as-icon">${CHECK}</div><div class="info"><b>${t('as_card')}</b><small>${sub}</small></div>
      <div class="as-btns">${last ? `<button class="btn small" data-act="report">${t('as_view')}</button>` : ''}<button class="btn small primary" data-act="assess">${t('as_start')}</button></div></div>`;
  });
})();
