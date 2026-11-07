'use strict';
// Four more brain-skill games: Quick Math, What Comes Next, Odd One Out and Keep the Beat.
// Same contract as minigames.js: register with TZ, run in TZ.Mini, report perf for adaptive difficulty.
(() => {
  const { $, rand, save, t, Sound, vibrate, Mini, SHAPES } = TZ;

  TZ.addStrings({
    g_math: 'חשבון בזק', g_math_d: 'תרגילים מהירים בראש',
    g_pattern: 'מה הבא בתור?', g_pattern_d: 'גלו את החוקיות',
    g_odd: 'מצאו את השונה', g_odd_d: 'עין חדה לפרטים',
    g_beat: 'שומרים על הקצב', g_beat_d: 'תזמון מדויק',
    sk_math: 'חשבון ושטף', sk_logic: 'היגיון ודפוסים', sk_search: 'סריקה חזותית', sk_rhythm: 'קצב ותזמון',
    pat_q: 'מה מגיע במקום סימן השאלה?', found: n => `מצאתם ${n}`,
    beat_listen: 'מקשיבים לקצב...', beat_tap: 'הקישו על התוף בדיוק עם הקצב', beat_silent: 'הקצב נעלם – שמרו עליו בראש!',
    early: 'מוקדם', late: 'מאוחר', onBeat: 'בול!', avgOff: ms => `סטייה ממוצעת: ${ms} אלפיות שנייה`,
  }, {
    g_math: 'Quick Math', g_math_d: 'Fast mental math',
    g_pattern: 'What Comes Next?', g_pattern_d: 'Find the rule',
    g_odd: 'Odd One Out', g_odd_d: 'A sharp eye for detail',
    g_beat: 'Keep the Beat', g_beat_d: 'Precise timing',
    sk_math: 'Math fluency', sk_logic: 'Logic and patterns', sk_search: 'Visual scanning', sk_rhythm: 'Rhythm and timing',
    pat_q: 'What goes in place of the question mark?', found: n => `You found ${n}`,
    beat_listen: 'Listen to the beat...', beat_tap: 'Tap the drum right on the beat', beat_silent: 'The beat is gone – keep it in your head!',
    early: 'Early', late: 'Late', onBeat: 'Spot on!', avgOff: ms => `Average offset: ${ms} ms`,
  });

  const PALETTE = ['#ff4d4d', '#ffc21a', '#22b04b', '#2f6bff', '#9b6dff', '#ff8a1f'];
  const multOf = streak => Math.min(5, 1 + Math.floor(streak / 4));
  const comboHtml = streak => streak >= 4 ? `<span class="combo-chip">x${multOf(streak)}</span>` : '';
  const shuffle = a => a.sort(() => Math.random() - 0.5);
  function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
  function flashOk(el, ok) { el.classList.remove('ok', 'bad'); void el.offsetWidth; el.classList.add(ok ? 'ok' : 'bad'); }

  // Builds 4 distinct answer choices around the right one
  function choicesFor(ans, spread) {
    const set = new Set([ans]);
    let guard = 0;
    while (set.size < 4 && guard++ < 50) {
      const v = ans + (rand(2) ? 1 : -1) * (1 + rand(spread));
      if (v >= 0) set.add(v);
    }
    while (set.size < 4) set.add(ans + set.size * 3);
    return shuffle([...set]);
  }

  // ---------- Quick Math ----------
  function mathProblem(lvl) {
    const r = (a, b) => a + rand(b - a + 1);
    const kinds = lvl <= 2 ? ['+', '-'] : lvl <= 4 ? ['+', '-'] : lvl <= 6 ? ['+', '-', '×'] : lvl <= 8 ? ['+', '-', '×', '×'] : ['+', '-', '×', '÷'];
    const k = kinds[rand(kinds.length)];
    const max = lvl <= 2 ? 10 : lvl <= 4 ? 20 : lvl <= 6 ? 50 : 100;
    if (k === '+') { const a = r(1, max - 1), b = r(1, max - a); return [`${a} + ${b}`, a + b]; }
    if (k === '-') { const a = r(2, max), b = r(1, a - 1); return [`${a} − ${b}`, a - b]; }
    const top = lvl <= 6 ? 5 : 10;
    if (k === '×') { const a = r(2, top), b = r(2, 10); return [`${a} × ${b}`, a * b]; }
    const b = r(2, 10), q = r(2, 10);
    return [`${b * q} ÷ ${b}`, q];
  }
  const math = {
    id: 'math', minLevel: 2, color: '#ff8a1f', skill: 'math', target: 700,
    icon: `<svg viewBox="0 0 48 48"><rect x="6" y="6" width="36" height="36" rx="10" fill="#fff"/><path d="M15 17h10M20 12v10M28 33h10M15 33l8-6M15 27l8 6" stroke="#ff8a1f" stroke-width="3.5" stroke-linecap="round"/><path d="M28 17h10" stroke="#2f6bff" stroke-width="3.5" stroke-linecap="round"/></svg>`,
    start() {
      const area = Mini.open(math);
      area.innerHTML = `<div class="stroop"><div class="word-card"><div class="word eq" id="m-q" dir="ltr"></div></div>
        <div class="answer-grid" id="m-a"></div></div>`;
      const TOTAL = 60, lvl = TZ.difficulty('math');
      let left = TOTAL, score = 0, streak = 0, right = 0, wrong = 0, ans = 0, over = false;
      const qEl = $('#m-q'), aEl = $('#m-a');
      const next = () => {
        const [q, a] = mathProblem(lvl);
        ans = a;
        qEl.textContent = `${q} = ?`;
        qEl.classList.remove('in'); void qEl.offsetWidth; qEl.classList.add('in');
        aEl.innerHTML = choicesFor(a, a < 10 ? 3 : 10).map(v => `<button class="answer" data-raw data-v="${v}">${v}</button>`).join('');
        aEl.querySelectorAll('.answer').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); pick(Number(b.dataset.v), b); }));
      };
      const pick = (v, btn) => {
        if (over) return;
        if (v === ans) { streak++; right++; score += 10 * multOf(streak); Sound.tone(660 + Math.min(streak, 12) * 25, 0.1, 'triangle', 0.35); vibrate(10); }
        else { streak = 0; wrong++; left -= 3; Sound.fail(); vibrate([30, 30, 30]); shake(btn); }
        Mini.score(score);
        Mini.extra(comboHtml(streak));
        next();
      };
      const timer = setInterval(() => {
        left -= 0.1;
        Mini.time(left / TOTAL);
        if (left <= 0 && !over) {
          over = true;
          const acc = right / (right + wrong || 1);
          Mini.finish(math, score, 5 + Math.floor(score / 25), 10 + Math.floor(score / 15), `<p>${TZ.t('correct', right)}</p>`,
            { acc, step: acc >= 0.9 && right >= 15 ? 1 : acc < 0.7 || right < 6 ? -1 : 0 });
        }
      }, 100);
      Mini.onLeave(() => { over = true; clearInterval(timer); });
      next();
      Mini.time(1);
    },
  };

  // ---------- What Comes Next? (patterns) ----------
  const TEMPLATES = ['AB', 'ABC', 'AAB', 'ABB', 'AABB', 'ABCD', 'ABAC'];
  const symHtml = s => s.n != null ? `<span class="sym num">${s.n}</span>`
    : `<span class="sym"><svg viewBox="0 0 24 24" style="fill:${PALETTE[s.c]}">${SHAPES[s.s]}</svg></span>`;
  const symKey = s => s.n != null ? `n${s.n}` : `${s.s}-${s.c}`;
  function patternRound(lvl) {
    // Numbers from difficulty 8: arithmetic steps or alternating steps
    if (lvl >= 8 && rand(2)) {
      const a = 1 + rand(9), k = 2 + rand(lvl - 5), alt = lvl >= 9 && rand(2);
      const seq = [a];
      for (let i = 1; i < 6; i++) seq.push(seq[i - 1] + (alt && i % 2 === 0 ? -1 : k));
      const ans = seq.pop();
      return { shown: seq.map(n => ({ n })), answer: { n: ans }, options: choicesFor(ans, 4).map(n => ({ n })) };
    }
    const tpl = TEMPLATES[Math.min(TEMPLATES.length - 1, rand(Math.min(TEMPLATES.length, 1 + Math.ceil(lvl / 1.5))))];
    const letters = [...new Set(tpl)];
    const shapes = shuffle([0, 1, 2, 3]), colors = shuffle([0, 1, 2, 3, 4, 5]);
    // From difficulty 5 shape and color follow two different rules at once
    const dual = lvl >= 5;
    const tpl2 = dual ? TEMPLATES[rand(3)] : tpl;
    const len = Math.max(6, tpl.length * 2 + 1, tpl2.length * 2 + 1);
    const at = i => {
      const L = tpl[i % tpl.length], L2 = tpl2[i % tpl2.length];
      return dual ? { s: shapes[letters.indexOf(L)], c: colors[[...new Set(tpl2)].indexOf(L2)] }
        : { s: shapes[letters.indexOf(L)], c: colors[letters.indexOf(L)] };
    };
    const seq = Array.from({ length: len + 1 }, (_, i) => at(i));
    const answer = seq.pop();
    const opts = [answer];
    let guard = 0;
    while (opts.length < 4 && guard++ < 60) {
      const o = rand(2) ? { s: answer.s, c: colors[rand(4)] } : { s: shapes[rand(4)], c: answer.c };
      if (rand(3) === 0) { o.s = shapes[rand(4)]; o.c = colors[rand(4)]; }
      if (!opts.some(x => symKey(x) === symKey(o))) opts.push(o);
    }
    return { shown: seq, answer, options: shuffle(opts) };
  }
  const pattern = {
    id: 'pattern', minLevel: 3, color: '#9b6dff', skill: 'logic', target: 450,
    icon: `<svg viewBox="0 0 48 48"><circle cx="9" cy="24" r="6" fill="#ff4d4d"/><rect x="18" y="18" width="12" height="12" rx="2" fill="#2f6bff"/><circle cx="39" cy="24" r="6" fill="#ff4d4d"/></svg>`,
    start() {
      const area = Mini.open(pattern);
      const lvl = TZ.difficulty('pattern'), ROUNDS = 10, PER = Math.max(8, 18 - lvl);
      area.innerHTML = `<div class="lab"><div class="rule" id="p-round"></div>
        <div class="lab-stage"><div class="seq-row" id="p-seq" dir="ltr"></div><p class="lab-hint">${t('pat_q')}</p></div>
        <div class="answer-grid" id="p-opts" dir="ltr"></div></div>`;
      let round = 0, score = 0, right = 0, left = PER, cur = null, busy = false, over = false;
      const nextRound = () => {
        if (round >= ROUNDS) {
          over = true;
          return Mini.finish(pattern, score, 5 + Math.floor(score / 20), 15 + Math.floor(score / 12), `<p>${t('correct', right)}</p>`,
            { acc: right / ROUNDS, step: right >= 9 ? 1 : right <= 5 ? -1 : 0 });
        }
        round++; left = PER; busy = false;
        cur = patternRound(lvl);
        $('#p-round').textContent = TZ.t('lab_round', round, ROUNDS);
        $('#p-seq').innerHTML = cur.shown.map(symHtml).join('') + '<span class="sym q">?</span>';
        const opts = $('#p-opts');
        opts.innerHTML = cur.options.map((o, i) => `<button class="answer sym-btn" data-raw data-i="${i}">${symHtml(o)}</button>`).join('');
        opts.querySelectorAll('.answer').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); pick(Number(b.dataset.i), b); }));
      };
      const pick = (i, btn) => {
        if (busy || over) return;
        busy = true;
        const ok = symKey(cur.options[i]) === symKey(cur.answer);
        const q = $('#p-seq .q');
        q.innerHTML = symHtml(cur.answer);
        flashOk(q, ok);
        if (ok) { right++; score += 20 + Math.round(left * 2); Mini.score(score); Sound.success(); }
        else { Sound.fail(); shake(btn); }
        setTimeout(() => { if (!over) nextRound(); }, ok ? 900 : 1600);
      };
      const timer = setInterval(() => {
        if (busy || over) return;
        left -= 0.1;
        Mini.time(left / PER);
        if (left <= 0) { busy = true; const q = $('#p-seq .q'); q.innerHTML = symHtml(cur.answer); flashOk(q, false); Sound.fail(); setTimeout(() => { if (!over) nextRound(); }, 1600); }
      }, 100);
      Mini.onLeave(() => { over = true; clearInterval(timer); });
      nextRound();
    },
  };

  // ---------- Odd One Out (visual search) ----------
  const odd = {
    id: 'odd', minLevel: 2, color: '#22b04b', skill: 'search', target: 25,
    icon: `<svg viewBox="0 0 48 48"><g fill="#22b04b"><circle cx="12" cy="12" r="6"/><circle cx="24" cy="12" r="6"/><circle cx="36" cy="12" r="6"/><circle cx="12" cy="24" r="6"/><circle cx="36" cy="24" r="6"/><circle cx="12" cy="36" r="6"/><circle cx="24" cy="36" r="6"/><circle cx="36" cy="36" r="6"/></g><circle cx="24" cy="24" r="6" fill="#7be08f"/></svg>`,
    start() {
      const area = Mini.open(odd);
      area.innerHTML = `<div class="odd-wrap"><div class="odd-grid" id="o-grid" dir="ltr"></div></div>`;
      const TOTAL = 45, lvl = TZ.difficulty('odd');
      let left = TOTAL, found = 0, wrong = 0, score = 0, streak = 0, over = false;
      const grid = $('#o-grid');
      const next = () => {
        // The grid grows and the difference shrinks with difficulty and with each find
        const n = Math.min(7, 3 + Math.floor(lvl / 2) + Math.floor(found / 6));
        const delta = Math.max(4, 24 - lvl * 1.8 - found * 0.5);
        const h = rand(360), sat = 55 + rand(20), light = 50 + rand(10);
        const target = rand(n * n);
        const lighter = light + delta < 85;
        grid.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
        grid.innerHTML = Array.from({ length: n * n }, (_, i) => {
          const l = i === target ? (lighter ? light + delta : light - delta) : light;
          return `<button class="odd-cell" data-raw data-i="${i}" style="background:hsl(${h} ${sat}% ${l}%)" aria-label="cell"></button>`;
        }).join('');
        grid.querySelectorAll('.odd-cell').forEach(b => b.addEventListener('pointerdown', e => {
          e.preventDefault();
          if (over) return;
          if (Number(b.dataset.i) === target) {
            found++; streak++; score += 10 * multOf(streak);
            Sound.tone(600 + Math.min(found, 15) * 30, 0.1, 'triangle', 0.35); vibrate(10);
            Mini.score(score); Mini.extra(comboHtml(streak));
            next();
          } else {
            wrong++; streak = 0; left -= 2; Sound.fail(); vibrate(40); shake(b); Mini.extra('');
          }
        }));
      };
      const timer = setInterval(() => {
        left -= 0.1;
        Mini.time(left / TOTAL);
        if (left <= 0 && !over) {
          over = true;
          Mini.finish(odd, found, 5 + found * 2, 10 + found * 3, `<p>${t('found', found)}</p>`,
            { acc: found / (found + wrong || 1), step: found >= 14 && wrong <= 3 ? 1 : found < 6 ? -1 : 0 });
        }
      }, 100);
      Mini.onLeave(() => { over = true; clearInterval(timer); });
      next();
      Mini.time(1);
    },
  };

  // ---------- Keep the Beat (timing) ----------
  const beat = {
    id: 'beat', minLevel: 1, color: '#2f6bff', skill: 'rhythm', target: 220,
    icon: `<svg viewBox="0 0 48 48"><ellipse cx="24" cy="30" rx="16" ry="8" fill="#2f6bff"/><rect x="8" y="18" width="32" height="12" fill="#2f6bff"/><ellipse cx="24" cy="18" rx="16" ry="8" fill="#8cc0ff"/><path d="M14 4l8 12M34 4l-8 12" stroke="#ffb627" stroke-width="3.5" stroke-linecap="round"/></svg>`,
    start() {
      const area = Mini.open(beat);
      Mini.time(null);
      area.innerHTML = `<div class="beat">
        <div class="rule" id="b-msg">${t('beat_listen')}</div>
        <button class="drum" id="b-drum" data-raw aria-label="drum"><span class="ring"></span><span class="skin"></span></button>
        <div class="timing"><span>${t('early')}</span><div class="t-bar"><i class="t-center"></i><i class="t-mark" id="b-mark"></i></div><span>${t('late')}</span></div>
        <div class="b-feedback" id="b-fb"></div>
        <div class="beat-dots" id="b-dots"></div></div>`;
      Sound.init();
      const ctx = Sound.ctx;
      const lvl = TZ.difficulty('beat');
      const bpm = 60 + lvl * 8, gap = 60 / bpm, COUNT_IN = 4, BEATS = 20;
      // From difficulty 4, four beats in the middle go silent: the child keeps the tempo alone
      const silent = lvl >= 4 ? [COUNT_IN + 10, COUNT_IN + 11, COUNT_IN + 12, COUNT_IN + 13] : [];
      const now = () => ctx ? ctx.currentTime : performance.now() / 1000;
      const lat = ctx ? (ctx.outputLatency || ctx.baseLatency || 0) : 0;
      const t0 = now() + 0.6;
      const times = Array.from({ length: COUNT_IN + BEATS }, (_, i) => t0 + i * gap);
      // All clicks are scheduled up front on their own channel, which is cut if the child leaves early
      const bus = ctx ? ctx.createGain() : null;
      if (bus) bus.connect(Sound.master);
      times.forEach((tm, i) => { if (!silent.includes(i) && bus) Sound.tone(i % 4 === 0 ? 1320 : 990, 0.05, 'square', i < COUNT_IN ? 0.3 : 0.22, tm - now(), bus); });
      $('#b-dots').innerHTML = Array.from({ length: BEATS }, () => '<i></i>').join('');
      const dots = [...area.querySelectorAll('.beat-dots i')];
      const offs = new Array(BEATS).fill(null);
      let score = 0, over = false, raf = 0, lastPulse = -1;
      const drum = $('#b-drum'), msg = $('#b-msg'), fb = $('#b-fb'), mark = $('#b-mark');

      const tap = () => {
        if (over) return;
        const tt = now() - lat;
        // Nearest playable beat (count-in taps don't count)
        let best = -1, bestD = 1e9;
        for (let i = COUNT_IN; i < times.length; i++) { const dd = Math.abs(tt - times[i]); if (dd < bestD) { bestD = dd; best = i; } }
        drum.classList.remove('hit'); void drum.offsetWidth; drum.classList.add('hit');
        if (best < 0 || bestD > gap / 2) return;
        const k = best - COUNT_IN;
        if (offs[k] != null) return;
        const ms = Math.round((tt - times[best]) * 1000);
        offs[k] = ms;
        const a = Math.abs(ms);
        const pts = a < 60 ? 10 : a < 120 ? 6 : a < 200 ? 3 : 0;
        score += pts;
        Mini.score(score);
        mark.style.insetInlineStart = `${50 + Math.max(-48, Math.min(48, ms / 4))}%`;
        fb.textContent = a < 60 ? t('onBeat') : ms < 0 ? `${t('early')} ${a}ms` : `${t('late')} ${a}ms`;
        fb.className = `b-feedback ${a < 60 ? 'ok' : a < 120 ? 'mid' : 'bad'}`;
        dots[k].className = a < 60 ? 'ok' : a < 120 ? 'mid' : 'bad';
        vibrate(8);
      };
      drum.addEventListener('pointerdown', e => { e.preventDefault(); tap(); });
      const onKey = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tap(); } };
      document.addEventListener('keydown', onKey);

      const finish = () => {
        if (over) return;
        over = true;
        clearTimeout(endTimer);
        cancelAnimationFrame(raf);
        const hit = offs.filter(v => v != null);
        const avg = hit.length ? Math.round(hit.reduce((s, v) => s + Math.abs(v), 0) / hit.length) : 999;
        const good = hit.filter(v => Math.abs(v) < 120).length;
        Mini.finish(beat, score, 5 + Math.floor(score / 12), 10 + Math.floor(score / 6), `<p>${hit.length ? t('avgOff', avg) : ''}</p>`,
          { acc: good / BEATS, step: avg < 70 && good >= 16 ? 1 : avg > 150 || hit.length < 10 ? -1 : 0 });
      };
      const frame = () => {
        if (over) return;
        const tt = now();
        const i = times.findIndex(x => x > tt) - 1;
        if (i >= 0 && i !== lastPulse && !silent.includes(i)) {
          lastPulse = i;
          drum.classList.remove('pulse'); void drum.offsetWidth; drum.classList.add('pulse');
        }
        const nextI = i + 1;
        msg.textContent = nextI < COUNT_IN ? `${t('beat_listen')} ${Math.max(1, nextI)}` : silent.includes(nextI) || silent.includes(i) ? t('beat_silent') : t('beat_tap');
        msg.classList.toggle('alt', silent.includes(i) || silent.includes(nextI));
        if (tt > times[times.length - 1] + gap) return finish();
        raf = requestAnimationFrame(frame);
      };
      // The session ends on a timer, so it finishes even when animation frames are paused
      const endTimer = setTimeout(finish, (times[times.length - 1] + gap - now()) * 1000);
      Mini.onLeave(() => { over = true; clearTimeout(endTimer); cancelAnimationFrame(raf); document.removeEventListener('keydown', onKey); if (bus) bus.disconnect(); });
      raf = requestAnimationFrame(frame);
    },
  };

  [math, pattern, odd, beat].forEach(TZ.registerGame);
})();
