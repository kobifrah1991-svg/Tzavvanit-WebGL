'use strict';
// Three more brain-skill games: Sound Echo (auditory memory, backward span at higher levels),
// Shape Spin (mental rotation) and Way to the Beach (planning a route before moving).
// Same contract as minigames.js: register with TZ, run in TZ.Mini, report perf for adaptive difficulty.
(() => {
  const { $, sleep, rand, t, Sound, vibrate, Mini } = TZ;

  TZ.addStrings({
    g_echo: 'הד הצלילים', g_echo_d: 'זוכרים רק בעזרת האוזניים',
    g_rotate: 'סיבוב צורות', g_rotate_d: 'מוצאים את אותה צורה מסובבת',
    g_path: 'הדרך לחוף', g_path_d: 'מתכננים מסלול לפני שיוצאים',
    sk_audio: 'זיכרון שמיעתי', sk_spatial: 'חשיבה מרחבית', sk_plan: 'תכנון ורצף',
    echo_meet: 'הכירו את הצלילים', echo_listen: 'הקשיבו היטב...', echo_go: 'עכשיו אתם – באותו סדר',
    echo_back: 'עכשיו אתם – בסדר הפוך! מהאחרון לראשון', echo_len: n => `${n} צלילים`,
    rot_q: 'איזו צורה זהה לזו שלמעלה, רק מסובבת?', rot_hint: 'זהירות: חלק מהצורות הן תמונת מראה',
    path_goal: 'תכננו את כל הצעדים, ואז לחצו "יוצאים!"', path_go: 'יוצאים!', path_undo: 'מחיקה',
    path_bump: 'אופס! נתקלנו במכשול', path_short: 'לא הגענו עד החוף', path_retry: 'תקנו את התוכנית ונסו שוב',
    path_best: 'מסלול קצר ביותר!', path_steps: (n, m) => `${n}/${m} צעדים`,
    rounds_done: n => `הצלחתם ב-${n} סבבים`, xr_round: (n, of) => `סבב ${n} מתוך ${of}`, path_ok: 'הגעתם לחוף!',
  }, {
    g_echo: 'Sound Echo', g_echo_d: 'Remember with your ears only',
    g_rotate: 'Shape Spin', g_rotate_d: 'Find the same shape, turned',
    g_path: 'Way to the Beach', g_path_d: 'Plan the route before you go',
    sk_audio: 'Auditory memory', sk_spatial: 'Spatial thinking', sk_plan: 'Planning and sequencing',
    echo_meet: 'Meet the sounds', echo_listen: 'Listen carefully...', echo_go: 'Your turn – same order',
    echo_back: 'Your turn – backwards! Last one first', echo_len: n => `${n} sounds`,
    rot_q: 'Which shape is the same as the one on top, just turned?', rot_hint: 'Careful: some shapes are mirror images',
    path_goal: 'Plan every step, then press "Go!"', path_go: 'Go!', path_undo: 'Undo',
    path_bump: 'Oops! We hit an obstacle', path_short: 'We didn\'t reach the beach', path_retry: 'Fix the plan and try again',
    path_best: 'Shortest route!', path_steps: (n, m) => `${n}/${m} steps`,
    rounds_done: n => `You succeeded in ${n} rounds`, xr_round: (n, of) => `Round ${n} of ${of}`, path_ok: 'You reached the beach!',
  });

  const shuffle = a => a.sort(() => Math.random() - 0.5);
  function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
  function flash(el, cls) { el.classList.remove('ok', 'bad'); void el.offsetWidth; el.classList.add(cls); }

  // ---------- Sound Echo (auditory memory) ----------
  // Four instruments with different pitch AND timbre. Buttons never light up during playback,
  // so the sequence has to be held by ear. From difficulty 5 every other round is played back reversed.
  const VOICES = [
    { f: 196, type: 'square', vol: 0.18, color: '#ff6f59', icon: '<path d="M9 20v14c0 3 7 6 15 6s15-3 15-6V20" fill="#fff"/><ellipse cx="24" cy="20" rx="15" ry="6" fill="#ffd6cd" stroke="#fff" stroke-width="2"/><path d="M9 26l10 10M39 26l-10 10" stroke="#ff6f59" stroke-width="2"/><path d="M14 6l8 12M34 6l-8 12" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>' },
    { f: 330, type: 'triangle', vol: 0.35, color: '#2ec4b6', icon: '<path d="M14 34V14l20-4v20" stroke="#fff" stroke-width="4" fill="none"/><circle cx="12" cy="34" r="5" fill="#fff"/><circle cx="32" cy="30" r="5" fill="#fff"/>' },
    { f: 523, type: 'sine', vol: 0.4, color: '#3a86ff', icon: '<path d="M24 8c-7 0-11 6-11 13v8l-4 5h30l-4-5v-8c0-7-4-13-11-13z" fill="#fff"/><circle cx="24" cy="38" r="3.5" fill="#fff"/>' },
    { f: 784, type: 'sawtooth', vol: 0.12, color: '#ffb627', icon: '<path d="M12 30c0-9 6-16 15-16 5 0 9 3 10 7l6 2-6 3c-1 9-8 14-16 14-6 0-9-4-9-10z" fill="#fff"/><path d="M14 30l-8-6 2 10z" fill="#fff"/><circle cx="31" cy="21" r="2.2" fill="#123b4a"/><path d="M18 30c4 3 9 3 12 0" stroke="#ffb627" stroke-width="2.5" fill="none" stroke-linecap="round"/>' },
  ];
  const play = (i, dur = 0.38) => { const v = VOICES[i]; Sound.tone(v.f, dur, v.type, v.vol); Sound.tone(v.f * 2, dur * 0.6, 'sine', v.vol * 0.25); };

  const echo = {
    id: 'echo', minLevel: 2, color: '#2ec4b6', skill: 'audio', target: 450,
    icon: `<svg viewBox="0 0 48 48"><path d="M10 18h7l9-8v28l-9-8h-7z" fill="#fff"/><path d="M31 16c4 4 4 12 0 16M36 11c7 7 7 19 0 26" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>`,
    start() {
      const area = Mini.open(echo);
      const lvl = TZ.difficulty('echo'), ROUNDS = 10;
      area.innerHTML = `<div class="echo"><div class="rule" id="e-msg"></div><div class="echo-len" id="e-len"></div>
        <div class="echo-pads" dir="ltr">${VOICES.map((v, i) => `<button class="echo-pad" data-raw data-i="${i}" style="--pc:${v.color}"><svg viewBox="0 0 48 48">${v.icon}</svg></button>`).join('')}</div></div>`;
      const pads = [...area.querySelectorAll('.echo-pad')], msg = $('#e-msg'), lenEl = $('#e-len');
      let len = 2 + Math.floor(lvl / 3), round = 0, score = 0, right = 0, over = false, input = null;
      const setPads = on => pads.forEach(p => p.classList.toggle('off', !on));
      const press = i => { pads[i].classList.remove('hit'); void pads[i].offsetWidth; pads[i].classList.add('hit'); play(i, 0.25); };
      pads.forEach((p, i) => p.addEventListener('pointerdown', e => { e.preventDefault(); if (!input || over) return; press(i); input(i); }));
      const getAnswer = n => new Promise(res => {
        const got = [];
        input = i => { got.push(i); if (got.length >= n) { input = null; res(got); } };
      });
      Mini.onLeave(() => { over = true; input = null; });
      (async () => {
        // Short introduction: each pad lights while its sound plays, once
        msg.textContent = t('echo_meet');
        setPads(false);
        await sleep(500);
        for (let i = 0; i < 4 && !over; i++) { pads[i].classList.add('lit'); play(i); await sleep(650); pads[i].classList.remove('lit'); await sleep(150); }
        while (!over && round < ROUNDS) {
          round++;
          const back = lvl >= 5 && round % 2 === 0;
          const seq = [];
          while (seq.length < len) { const c = rand(4); if (seq.length < 2 || !(seq[seq.length - 1] === c && seq[seq.length - 2] === c)) seq.push(c); }
          msg.textContent = t('echo_listen'); msg.classList.remove('alt');
          lenEl.textContent = `${t('xr_round', round, ROUNDS)} · ${t('echo_len', len)}`;
          setPads(false);
          await sleep(700);
          for (const c of seq) { if (over) return; play(c); await sleep(Math.max(420, 700 - lvl * 25)); }
          if (over) return;
          msg.textContent = back ? t('echo_back') : t('echo_go');
          msg.classList.toggle('alt', back);
          setPads(true);
          const got = await getAnswer(len);
          if (over) return;
          setPads(false);
          const want = back ? seq.slice().reverse() : seq;
          const ok = got.every((g, k) => g === want[k]);
          if (ok) { right++; score += len * (back ? 20 : 10); Mini.score(score); Sound.success(); vibrate(10); len = Math.min(9, len + 1); }
          else { Sound.fail(); vibrate([30, 30, 30]); shake(area.querySelector('.echo-pads')); len = Math.max(2, len - 1); }
          await sleep(900);
        }
        if (over) return;
        over = true;
        Mini.finish(echo, score, 5 + Math.floor(score / 20), 12 + Math.floor(score / 12), `<p>${t('rounds_done', right)}</p>`,
          { acc: right / ROUNDS, step: right >= 8 ? 1 : right <= 4 ? -1 : 0 });
      })();
    },
  };

  // ---------- Shape Spin (mental rotation) ----------
  const norm = cells => {
    const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1]));
    return cells.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  };
  const key = cells => norm(cells).map(c => c.join(',')).join(';');
  const rot = (cells, r) => { let c = cells; for (let i = 0; i < r; i++) c = c.map(([x, y]) => [y, -x]); return norm(c); };
  const mirror = cells => norm(cells.map(([x, y]) => [-x, y]));
  function polyomino(k) {
    for (let guard = 0; guard < 200; guard++) {
      const cells = [[0, 0]];
      while (cells.length < k) {
        const [x, y] = cells[rand(cells.length)];
        const [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][rand(4)];
        if (!cells.some(c => c[0] === x + dx && c[1] === y + dy)) cells.push([x + dx, y + dy]);
      }
      const n = norm(cells);
      // Only shapes whose mirror image differs from every rotation, so a mirror is truly "wrong"
      const rots = new Set([0, 1, 2, 3].map(r => key(rot(n, r))));
      if (!rots.has(key(mirror(n)))) return n;
    }
    return norm([[0, 0], [1, 0], [2, 0], [2, 1]]);
  }
  const shapeSvg = (cells, color, size = 100) => {
    const w = Math.max(...cells.map(c => c[0])) + 1, h = Math.max(...cells.map(c => c[1])) + 1, s = Math.max(w, h);
    const ox = (s - w) / 2, oy = (s - h) / 2;
    return `<svg viewBox="-0.15 -0.15 ${s + 0.3} ${s + 0.3}" width="${size}" height="${size}">${cells.map(([x, y]) =>
      `<rect x="${x + ox + 0.04}" y="${y + oy + 0.04}" width="0.92" height="0.92" rx="0.18" fill="${color}" stroke="rgba(18,59,74,.35)" stroke-width="0.06"/>`).join('')}</svg>`;
  };
  const ROT_COLORS = ['#ff6f59', '#3a86ff', '#9b6dff', '#2ec4b6', '#ff8a1f'];

  const rotate = {
    id: 'rotate', minLevel: 3, color: '#9b6dff', skill: 'spatial', target: 20,
    icon: `<svg viewBox="0 0 48 48"><g fill="#fff"><rect x="8" y="22" width="9" height="9" rx="2"/><rect x="17" y="22" width="9" height="9" rx="2"/><rect x="17" y="13" width="9" height="9" rx="2"/></g><path d="M34 12a12 12 0 0 1 4 18" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M35 33l4-4 2 5z" fill="#fff"/></svg>`,
    start() {
      const area = Mini.open(rotate);
      const lvl = TZ.difficulty('rotate'), TOTAL = 60;
      area.innerHTML = `<div class="rot"><div class="rot-target" id="r-t"></div><p class="lab-hint" id="r-q"></p>
        <div class="answer-grid rot-opts" id="r-o" dir="ltr"></div></div>`;
      let left = TOTAL, solved = 0, wrong = 0, score = 0, streak = 0, over = false, answer = -1;
      const next = () => {
        const k = Math.min(6, 4 + Math.floor((lvl + solved / 4) / 4));
        const shape = polyomino(k), color = ROT_COLORS[rand(ROT_COLORS.length)];
        const nOpts = lvl <= 3 ? 3 : 4;
        // Low levels: distractors are other shapes; mid: one mirror; from level 6 all mirrors
        const mirrors = lvl <= 2 ? 0 : lvl <= 5 ? 1 : nOpts - 1;
        const used = new Set([key(shape)]);
        const opts = [{ cells: rot(shape, 1 + rand(3)), ok: true }];
        const m = mirror(shape);
        for (let r of shuffle([0, 1, 2, 3])) { if (opts.length > mirrors) break; const c = rot(m, r); if (!used.has(key(c))) { used.add(key(c)); opts.push({ cells: c, ok: false }); } }
        let guard = 0;
        while (opts.length < nOpts && guard++ < 50) {
          const o = polyomino(k);
          const ks = [0, 1, 2, 3].map(r => key(rot(o, r)));
          if (ks.some(x => used.has(x)) || ks.includes(key(rot(m, 0)))) continue;
          ks.forEach(x => used.add(x));
          opts.push({ cells: rot(o, rand(4)), ok: false });
        }
        shuffle(opts);
        answer = opts.findIndex(o => o.ok);
        $('#r-t').innerHTML = shapeSvg(shape, color, 120);
        $('#r-q').textContent = lvl >= 3 ? `${t('rot_q')} ${t('rot_hint')}` : t('rot_q');
        const box = $('#r-o');
        box.innerHTML = opts.map((o, i) => `<button class="answer rot-btn" data-raw data-i="${i}">${shapeSvg(o.cells, color, 84)}</button>`).join('');
        box.querySelectorAll('.rot-btn').forEach(b => b.addEventListener('pointerdown', e => {
          e.preventDefault();
          if (over) return;
          if (Number(b.dataset.i) === answer) {
            solved++; streak++; score += 10 + Math.min(streak, 10) * 2;
            Sound.tone(620 + Math.min(solved, 15) * 30, 0.12, 'triangle', 0.35); vibrate(10);
            Mini.score(score); flash(b, 'ok');
            setTimeout(() => { if (!over) next(); }, 350);
          } else { wrong++; streak = 0; left -= 3; Sound.fail(); vibrate(40); shake(b); }
        }));
      };
      const timer = setInterval(() => {
        left -= 0.1;
        Mini.time(left / TOTAL);
        if (left <= 0 && !over) {
          over = true; clearInterval(timer);
          Mini.finish(rotate, solved, 5 + solved * 2, 10 + solved * 3, `<p>${TZ.t('correct', solved)}</p>`,
            { acc: solved / (solved + wrong || 1), step: solved >= 12 && wrong <= 2 ? 1 : solved < 5 || wrong > solved ? -1 : 0 });
        }
      }, 100);
      Mini.onLeave(() => { over = true; clearInterval(timer); });
      next();
      Mini.time(1);
    },
  };

  // ---------- Way to the Beach (planning) ----------
  const DIRS = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };
  const ARROW = { u: 'M24 10l12 14h-8v14h-8V24h-8z', d: 'M24 38L12 24h8V10h8v14h8z', l: 'M10 24l14-12v8h14v8H24v8z', r: 'M38 24L24 36v-8H10v-8h14v-8z' };
  const arrowSvg = d => `<svg viewBox="0 0 48 48"><path d="${ARROW[d]}" fill="currentColor"/></svg>`;
  function bfs(n, rocks, s, g) {
    const dist = new Map([[s.join(), 0]]), q = [s];
    while (q.length) {
      const [x, y] = q.shift();
      if (x === g[0] && y === g[1]) return dist.get(`${x},${y}`);
      for (const [dx, dy] of Object.values(DIRS)) {
        const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
        if (nx < 0 || ny < 0 || nx >= n || ny >= n || rocks.has(k) || dist.has(k)) continue;
        dist.set(k, dist.get(`${x},${y}`) + 1); q.push([nx, ny]);
      }
    }
    return -1;
  }
  function makeMap(lvl) {
    const n = Math.min(7, 4 + Math.floor(lvl / 3));
    const want = n - 1 + Math.floor(lvl / 2);
    let best = null;
    for (let guard = 0; guard < 120; guard++) {
      const s = [0, n - 1], g = [n - 1, rand(n - 1)];
      if (rand(2)) { s[0] = rand(n); s[1] = n - 1; g[0] = rand(n); g[1] = 0; }
      const rocks = new Set();
      const count = Math.round(n * n * (0.16 + lvl * 0.018));
      while (rocks.size < count) { const k = `${rand(n)},${rand(n)}`; if (k !== s.join() && k !== g.join()) rocks.add(k); }
      const d = bfs(n, rocks, s, g);
      if (d < 0) continue;
      if (!best || Math.abs(d - want) < Math.abs(best.min - want)) best = { n, s, g, rocks, min: d };
      if (d >= want) break;
    }
    return best;
  }

  const path = {
    id: 'path', minLevel: 3, color: '#ff8a1f', skill: 'plan', target: 300,
    icon: `<svg viewBox="0 0 48 48"><path d="M10 38c6-10 8-14 14-14s8-8 14-14" stroke="#fff" stroke-width="4" stroke-dasharray="3 5" fill="none" stroke-linecap="round"/><circle cx="10" cy="38" r="5" fill="#fff"/><path d="M38 6l3 7h-6z" fill="#fff"/></svg>`,
    start() {
      const area = Mini.open(path);
      const lvl = TZ.difficulty('path'), ROUNDS = 8;
      area.innerHTML = `<div class="path"><div class="rule" id="pa-msg"></div>
        <div class="path-board" id="pa-b" dir="ltr"></div>
        <div class="path-plan" id="pa-plan" dir="ltr"></div>
        <div class="path-keys" dir="ltr">${['l', 'u', 'd', 'r'].map(d => `<button class="path-key" data-raw data-d="${d}" aria-label="${d}">${arrowSvg(d)}</button>`).join('')}</div>
        <div class="path-actions"><button class="btn small" data-raw id="pa-undo">${t('path_undo')}</button><button class="btn primary" data-raw id="pa-go">${t('path_go')}</button></div></div>`;
      const board = $('#pa-b'), planEl = $('#pa-plan'), msg = $('#pa-msg');
      let round = 0, score = 0, firstTry = 0, solvedAll = 0, map = null, plan = [], tries = 0, busy = false, over = false, maxSteps = 0;
      const cellAt = (x, y) => board.children[y * map.n + x];
      const drawBoard = () => {
        board.style.gridTemplateColumns = `repeat(${map.n}, 1fr)`;
        board.innerHTML = Array.from({ length: map.n * map.n }, (_, i) => {
          const x = i % map.n, y = Math.floor(i / map.n), k = `${x},${y}`;
          const cls = map.rocks.has(k) ? 'rock' : x === map.g[0] && y === map.g[1] ? 'goal' : '';
          return `<div class="path-cell ${cls}"></div>`;
        }).join('');
        placeHero(map.s);
      };
      const placeHero = ([x, y]) => {
        board.querySelectorAll('.hero').forEach(h => h.remove());
        cellAt(x, y).insertAdjacentHTML('beforeend', '<span class="hero"></span>');
      };
      const drawPlan = () => {
        planEl.innerHTML = Array.from({ length: maxSteps }, (_, i) => `<span class="slot${plan[i] ? ' on' : ''}">${plan[i] ? arrowSvg(plan[i]) : ''}</span>`).join('');
        Mini.extra(`<span class="chip">${t('path_steps', plan.length, maxSteps)}</span>`);
      };
      const newRound = () => {
        if (round >= ROUNDS) {
          over = true;
          return Mini.finish(path, score, 5 + Math.floor(score / 20), 15 + Math.floor(score / 12), `<p>${t('rounds_done', solvedAll)}</p>`,
            { acc: firstTry / ROUNDS, step: firstTry >= 7 ? 1 : firstTry <= 3 ? -1 : 0 });
        }
        round++; tries = 0; plan = []; busy = false;
        map = makeMap(lvl);
        maxSteps = map.min + (lvl <= 3 ? 4 : lvl <= 6 ? 3 : 2);
        msg.textContent = `${t('xr_round', round, ROUNDS)} · ${t('path_goal')}`;
        msg.classList.remove('alt');
        drawBoard(); drawPlan();
      };
      const run = async () => {
        if (busy || over || !plan.length) return;
        busy = true;
        let [x, y] = map.s, ok = false, bump = false;
        for (let i = 0; i < plan.length && !over; i++) {
          const [dx, dy] = DIRS[plan[i]];
          const nx = x + dx, ny = y + dy;
          planEl.children[i].classList.add('now');
          if (nx < 0 || ny < 0 || nx >= map.n || ny >= map.n || map.rocks.has(`${nx},${ny}`)) { bump = true; break; }
          x = nx; y = ny; placeHero([x, y]); Sound.tone(500 + i * 30, 0.06, 'triangle', 0.25);
          await sleep(320);
          if (x === map.g[0] && y === map.g[1]) { ok = true; break; }
        }
        if (over) return;
        tries++;
        if (ok) {
          const best = plan.length === map.min;
          if (tries === 1) firstTry++;
          solvedAll++;
          score += (tries === 1 ? 30 : 15) + (best ? 20 : 0);
          Mini.score(score); Sound.success(); vibrate(10);
          msg.textContent = best ? t('path_best') : t('path_ok');
          cellAt(x, y).classList.add('won');
          await sleep(1100);
          if (!over) newRound();
        } else {
          Sound.fail(); vibrate([30, 30, 30]); shake(board);
          msg.textContent = `${bump ? t('path_bump') : t('path_short')} – ${t('path_retry')}`;
          msg.classList.add('alt');
          await sleep(900);
          if (over) return;
          placeHero(map.s);
          planEl.querySelectorAll('.now').forEach(s => s.classList.remove('now'));
          // A second failure moves on, so a child is never stuck on one map
          if (tries >= 2) { await sleep(400); if (!over) newRound(); } else busy = false;
        }
      };
      area.querySelectorAll('.path-key').forEach(b => b.addEventListener('pointerdown', e => {
        e.preventDefault();
        if (busy || over || plan.length >= maxSteps) { if (plan.length >= maxSteps) shake(planEl); return; }
        plan.push(b.dataset.d); Sound.tone(440, 0.05, 'sine', 0.2); drawPlan();
      }));
      $('#pa-undo').addEventListener('pointerdown', e => { e.preventDefault(); if (busy || over) return; plan.pop(); drawPlan(); });
      $('#pa-go').addEventListener('pointerdown', e => { e.preventDefault(); run(); });
      Mini.onLeave(() => { over = true; });
      newRound();
    },
  };

  [echo, rotate, path].forEach(TZ.registerGame);

  // Card art in the same style as previews.js
  const W = (bg, body) => `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="320" height="200" fill="${bg}"/>${body}</svg>`;
  const sq = (x, y, c) => `<rect x="${x}" y="${y}" width="26" height="26" rx="6" fill="${c}" stroke="rgba(18,59,74,.3)" stroke-width="2"/>`;
  const L = (x, y, c, cells) => cells.map(([a, b]) => sq(x + a * 28, y + b * 28, c)).join('');
  TZ.previews = TZ.previews || {};
  Object.assign(TZ.previews, {
    echo: W('#e4fbf7', `<rect x="70" y="18" width="180" height="26" rx="13" fill="#123b4a"/><rect x="110" y="27" width="100" height="8" rx="4" fill="#fff" opacity=".85"/>
      <path d="M138 62h12l14-12v44l-14-12h-12z" fill="#2ec4b6"/><path d="M174 58c6 6 6 18 0 24M182 52c10 10 10 26 0 36" stroke="#2ec4b6" stroke-width="5" fill="none" stroke-linecap="round"/>
      ${VOICES.map((v, i) => `<rect x="${28 + i * 68}" y="${118 + 5}" width="60" height="60" rx="16" fill="rgba(18,59,74,.25)"/><rect x="${28 + i * 68}" y="118" width="60" height="60" rx="16" fill="${v.color}"/><svg x="${36 + i * 68}" y="126" width="44" height="44" viewBox="0 0 48 48">${v.icon}</svg>`).join('')}`),
    rotate: W('#f3eeff', `<rect x="100" y="12" width="120" height="84" rx="16" fill="#fff"/>${L(118, 26, '#9b6dff', [[0, 1], [1, 1], [2, 1], [2, 0]])}
      ${[[24, '#9b6dff', [[0, 0], [0, 1], [0, 2], [1, 2]]], [124, '#9b6dff', [[0, 0], [1, 0], [2, 0], [0, 1]]], [224, '#9b6dff', [[1, 0], [1, 1], [1, 2], [0, 2]]]]
        .map(([x, c, cells], i) => `<rect x="${x}" y="${108 + 4}" width="76" height="84" rx="14" fill="rgba(18,59,74,.18)"/><rect x="${x}" y="108" width="76" height="84" rx="14" fill="#fff" ${i === 0 ? 'stroke="#22b04b" stroke-width="4"' : ''}/>${L(x + 10, 114, c, cells.map(([a, b]) => [a * 0.8, b * 0.8]))}`).join('')}`),
    path: W('#fff4dc', `${Array.from({ length: 25 }, (_, i) => { const x = i % 5, y = Math.floor(i / 5); const rock = [6, 8, 12, 17, 3].includes(i); const goal = i === 4;
      return `<rect x="${60 + x * 34}" y="${10 + y * 30}" width="31" height="27" rx="6" fill="${goal ? '#2ec4b6' : rock ? '#8a9ba3' : '#ffe3a8'}"/>`; }).join('')}
      <circle cx="${60 + 15}" cy="${10 + 4 * 30 + 13}" r="10" fill="#ff9f86"/>
      ${['u', 'u', 'r', 'r', 'u'].map((d, i) => `<rect x="${236}" y="${14 + i * 30}" width="28" height="26" rx="6" fill="#123b4a"/><svg x="238" y="${15 + i * 30}" width="24" height="24" viewBox="0 0 48 48" style="color:#fff">${arrowSvg(d).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>`).join('')}`),
  });
})();
