'use strict';
// The games inside Tzavvanit besides the Sound Journey. Each one registers with
// TZ.registerGame and runs inside the shared mini-game frame (TZ.Mini).
(() => {
  const { $, sleep, rand, save, t, Sound, vibrate, Mini, SHAPES, HEART } = TZ;

  TZ.addStrings({
    g_stroop: 'צבע או מילה', g_stroop_d: 'ריכוז ותגובה מהירה',
    g_rain: 'גשם צבעים', g_rain_d: 'תפסו את הטיפות הנכונות',
    g_lab: 'מעבדת הצבעים', g_lab_d: 'ערבבו ותגלו צבעים',
    g_pairs: 'זוגות', g_pairs_d: 'זיכרון חזותי',
    st_ink: 'הקישו על צבע הדיו', st_word: 'הקישו על מה שכתוב', st_flip: 'החוק התהפך!', correct: n => `תשובות נכונות: ${n}`,
    rain_catch: 'תפסו:', rain_new: 'צבע חדש!',
    lab_pick: 'בחרו שני צבעים לערבב', lab_round: (n, of) => `ניסוי ${n} מתוך ${of}`,
    pairs_moves: n => `${n} מהלכים`, pairs_time: s => `${s} שניות`,
    colorNames: ['אדום', 'צהוב', 'ירוק', 'כחול'],
    paints: ['אדום', 'צהוב', 'כחול', 'לבן', 'שחור'],
  }, {
    g_stroop: 'Color or Word', g_stroop_d: 'Focus and quick reactions',
    g_rain: 'Color Rain', g_rain_d: 'Catch the right drops',
    g_lab: 'Color Lab', g_lab_d: 'Mix and discover colors',
    g_pairs: 'Pairs', g_pairs_d: 'Visual memory',
    st_ink: 'Tap the ink color', st_word: 'Tap what the word says', st_flip: 'The rule flipped!', correct: n => `Correct answers: ${n}`,
    rain_catch: 'Catch:', rain_new: 'New color!',
    lab_pick: 'Pick two colors to mix', lab_round: (n, of) => `Experiment ${n} of ${of}`,
    pairs_moves: n => `${n} moves`, pairs_time: s => `${s} seconds`,
    colorNames: ['Red', 'Yellow', 'Green', 'Blue'],
    paints: ['Red', 'Yellow', 'Blue', 'White', 'Black'],
  });

  const STROOP_COLORS = ['#ff4d4d', '#ffc21a', '#22b04b', '#2f6bff'];

  function popText(host, text, cls = '') {
    const el = document.createElement('div');
    el.className = `popup ${cls}`;
    el.textContent = text;
    host.appendChild(el);
    setTimeout(() => el.remove(), 850);
  }
  function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
  const multOf = streak => Math.min(5, 1 + Math.floor(streak / 4));
  const comboHtml = streak => streak >= 4 ? `<span class="combo-chip">x${multOf(streak)}</span>` : '';

  // ---------- Color or Word (Stroop) ----------
  const stroop = {
    id: 'stroop', minLevel: 1, skill: 'inhibit', target: 600, color: '#ff6f59',
    icon: `<svg viewBox="0 0 48 48"><rect x="4" y="10" width="40" height="28" rx="8" fill="#fff"/><text x="24" y="31" text-anchor="middle" font-size="14" font-weight="900" fill="#ff4d4d" font-family="Arial">כחול</text></svg>`,
    start() {
      const area = Mini.open(stroop);
      area.innerHTML = `<div class="stroop">
        <div class="rule" id="st-rule"></div>
        <div class="word-card"><div class="word" id="st-word"></div></div>
        <div class="choice-grid" dir="ltr">${STROOP_COLORS.map((c, i) => `<button class="choice" data-raw data-i="${i}" style="--cc:${c}" aria-label="${t('colorNames')[i]}"><svg class="shape" viewBox="0 0 24 24">${SHAPES[i]}</svg></button>`).join('')}</div>
      </div>`;
      const TOTAL = 45;
      let left = TOTAL, score = 0, streak = 0, right = 0, rule = 'ink', sinceFlip = 0, word = 0, ink = 0, over = false;
      const wordEl = $('#st-word'), ruleEl = $('#st-rule');
      const setRule = flip => {
        ruleEl.textContent = t(rule === 'ink' ? 'st_ink' : 'st_word');
        ruleEl.classList.toggle('alt', rule === 'word');
        if (flip) { popText(area, t('st_flip'), 'good'); shake(ruleEl); Sound.arp([0, 7], 0.08); }
      };
      const next = () => {
        word = rand(4);
        ink = Math.random() < 0.75 ? (word + 1 + rand(3)) % 4 : word;
        wordEl.textContent = t('colorNames')[word];
        wordEl.style.color = STROOP_COLORS[ink];
        wordEl.classList.remove('in'); void wordEl.offsetWidth; wordEl.classList.add('in');
      };
      const answer = i => {
        if (over) return;
        const ok = rule === 'ink' ? i === ink : i === word;
        if (ok) {
          streak++; right++; sinceFlip++;
          score += 10 * multOf(streak);
          Sound.tone(660 + streak * 20, 0.12, 'triangle', 0.4);
          vibrate(10);
        } else {
          streak = 0; left -= 3;
          Sound.fail(); vibrate([30, 30, 30]);
          shake(wordEl.parentElement);
        }
        Mini.score(score);
        Mini.extra(comboHtml(streak));
        // After a warm-up, the rule flips every 6–9 correct answers
        if (right >= 8 && sinceFlip >= 6 + rand(4)) { rule = rule === 'ink' ? 'word' : 'ink'; sinceFlip = 0; setRule(true); }
        next();
      };
      area.querySelectorAll('.choice').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); answer(Number(b.dataset.i)); }));
      const onKey = e => { if (e.key >= '1' && e.key <= '4') answer(Number(e.key) - 1); };
      document.addEventListener('keydown', onKey);
      const timer = setInterval(() => {
        left -= 0.1;
        Mini.time(left / TOTAL);
        if (left <= 0 && !over) {
          over = true;
          Mini.finish(stroop, score, 5 + Math.floor(score / 25), 10 + Math.floor(score / 15), `<p>${t('correct', right)}</p>`);
        }
      }, 100);
      Mini.onLeave(() => { over = true; clearInterval(timer); document.removeEventListener('keydown', onKey); });
      setRule(false);
      next();
      Mini.time(1);
    },
  };

  // ---------- Color Rain (catch) ----------
  const rain = {
    id: 'rain', minLevel: 2, skill: 'attention', target: 800, color: '#3a86ff',
    icon: `<svg viewBox="0 0 48 48"><path d="M14 4c-3 6-6 9-6 13a6 6 0 0 0 12 0c0-4-3-7-6-13z" fill="#3a86ff"/><path d="M34 10c-3 6-6 9-6 13a6 6 0 0 0 12 0c0-4-3-7-6-13z" fill="#ff6f59"/><path d="M8 34h32l-4 10H12z" fill="#ffb627"/></svg>`,
    start() {
      const area = Mini.open(rain);
      area.innerHTML = `<div class="rain"><canvas id="rain-cv"></canvas><div class="rain-target" id="rain-target"></div></div>`;
      Mini.time(null);
      const cv = $('#rain-cv'), ctx = cv.getContext('2d'), box = cv.parentElement;
      let W = 0, H = 0, dpr = 1;
      const resize = () => {
        dpr = Math.min(2, window.devicePixelRatio || 1);
        W = box.clientWidth; H = box.clientHeight;
        cv.width = W * dpr; cv.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      window.addEventListener('resize', resize);

      let basketX = W / 2, score = 0, streak = 0, lives = 3, target = rand(4), over = false;
      let drops = [], sparks = [], spawnIn = 0, elapsed = 0, nextSwitch = 15, last = performance.now(), raf = 0, flash = 0;
      const targetEl = $('#rain-target');
      const showTarget = isNew => {
        targetEl.innerHTML = `${t('rain_catch')} <span class="dot" style="background:${STROOP_COLORS[target]}"></span>`;
        if (isNew) { shake(targetEl); Sound.arp([0, 4, 7], 0.07); }
      };
      const hud = () => {
        Mini.score(score);
        Mini.extra(`<span class="mini-hearts">${Array.from({ length: 3 }, (_, i) => HEART.replace('<svg', `<svg class="${i < lives ? '' : 'lost'}"`)).join('')}</span>${comboHtml(streak)}`);
      };
      const move = e => { const r = cv.getBoundingClientRect(); basketX = Math.max(0, Math.min(W, e.clientX - r.left)); };
      cv.addEventListener('pointerdown', move);
      cv.addEventListener('pointermove', move);
      const onKey = e => { if (e.key === 'ArrowLeft') basketX -= 40; if (e.key === 'ArrowRight') basketX += 40; basketX = Math.max(0, Math.min(W, basketX)); };
      document.addEventListener('keydown', onKey);

      const drawDrop = (x, y, r, color) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y - r * 1.8);
        ctx.quadraticCurveTo(x + r * 1.1, y - r * 0.4, x + r, y + r * 0.2);
        ctx.arc(x, y + r * 0.2, r, 0, Math.PI);
        ctx.quadraticCurveTo(x - r * 1.1, y - r * 0.4, x, y - r * 1.8);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.6)';
        ctx.beginPath(); ctx.arc(x - r * 0.35, y, r * 0.22, 0, 7); ctx.fill();
      };

      const end = () => {
        if (over) return;
        over = true;
        cancelAnimationFrame(raf);
        Mini.finish(rain, score, 5 + Math.floor(score / 20), 10 + Math.floor(score / 12));
      };

      const frame = now => {
        if (over) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        elapsed += dt;
        const speed = 120 + elapsed * 4;
        if (elapsed >= nextSwitch) { target = (target + 1 + rand(3)) % 4; nextSwitch += 15; showTarget(true); }
        spawnIn -= dt;
        if (spawnIn <= 0) {
          spawnIn = Math.max(0.35, 0.9 - elapsed * 0.01);
          const gold = Math.random() < 0.04;
          // Keep roughly 40% of drops in the target color so there is always something to catch
          const color = gold ? -1 : Math.random() < 0.4 ? target : rand(4);
          drops.push({ x: 20 + Math.random() * (W - 40), y: -20, r: 11, color, vy: speed * (0.8 + Math.random() * 0.4) });
        }
        const bw = Math.max(70, W * 0.22), by = H - 46;
        for (const d of drops) {
          d.y += d.vy * dt;
          if (!d.done && d.y + d.r >= by && d.y < by + 20 && Math.abs(d.x - basketX) < bw / 2) {
            d.done = true;
            if (d.color === -1) { score += 50; Sound.arp([0, 7, 12], 0.05); popText(box, '+50', 'good'); }
            else if (d.color === target) { streak++; score += 10 * multOf(streak); Sound.tone(700 + Math.min(streak, 12) * 30, 0.1, 'triangle', 0.35); }
            else { streak = 0; lives--; flash = 0.25; Sound.fail(); vibrate(60); }
            for (let k = 0; k < 8; k++) sparks.push({ x: d.x, y: by, vx: (Math.random() - 0.5) * 160, vy: -Math.random() * 160, life: 0.5, color: d.color === -1 ? '#ffd700' : STROOP_COLORS[d.color] });
            hud();
            if (lives <= 0) return end();
          }
          if (!d.done && d.y > H + 20) { d.done = true; if (d.color === target) { streak = 0; hud(); } }
        }
        drops = drops.filter(d => !d.done);
        sparks = sparks.filter(s => (s.life -= dt) > 0);

        ctx.clearRect(0, 0, W, H);
        for (const d of drops) drawDrop(d.x, d.y, d.r, d.color === -1 ? '#ffd700' : STROOP_COLORS[d.color]);
        for (const s of sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 300 * dt; ctx.globalAlpha = s.life * 2; ctx.fillStyle = s.color; ctx.fillRect(s.x, s.y, 5, 5); }
        ctx.globalAlpha = 1;
        // Bucket
        ctx.fillStyle = '#123b4a';
        ctx.beginPath();
        ctx.moveTo(basketX - bw / 2, by); ctx.lineTo(basketX + bw / 2, by);
        ctx.lineTo(basketX + bw / 2 - 10, by + 36); ctx.lineTo(basketX - bw / 2 + 10, by + 36); ctx.closePath(); ctx.fill();
        ctx.fillStyle = STROOP_COLORS[target];
        ctx.fillRect(basketX - bw / 2 + 4, by + 8, bw - 8, 9);
        if (flash > 0) { flash -= dt; ctx.fillStyle = `rgba(255,77,77,${flash})`; ctx.fillRect(0, 0, W, H); }
        raf = requestAnimationFrame(frame);
      };

      Mini.onLeave(() => { over = true; cancelAnimationFrame(raf); window.removeEventListener('resize', resize); document.removeEventListener('keydown', onKey); });
      showTarget(false);
      hud();
      raf = requestAnimationFrame(frame);
    },
  };

  // ---------- Color Lab (mixing) ----------
  const PAINTS = ['#ff4d4d', '#ffc21a', '#2f6bff', '#ffffff', '#3a3a3a'];
  const RECIPES = [
    { a: 0, b: 1, hex: '#ff8a1f', he: 'כתום', en: 'Orange' },
    { a: 1, b: 2, hex: '#22b04b', he: 'ירוק', en: 'Green' },
    { a: 0, b: 2, hex: '#8e44d6', he: 'סגול', en: 'Purple' },
    { a: 0, b: 3, hex: '#ff9ec4', he: 'ורוד', en: 'Pink' },
    { a: 2, b: 3, hex: '#8cc8ff', he: 'תכלת', en: 'Light blue' },
    { a: 3, b: 4, hex: '#9aa3a8', he: 'אפור', en: 'Gray' },
    { a: 0, b: 4, hex: '#8b1e2e', he: 'בורדו', en: 'Maroon' },
  ];
  const lab = {
    id: 'lab', minLevel: 3, skill: 'reason', target: 400, color: '#ff8a3d',
    icon: `<svg viewBox="0 0 48 48"><path d="M18 4h12v4h-2v10l12 20a4 4 0 0 1-3.5 6h-25A4 4 0 0 1 8 38l12-20V8h-2z" fill="#fff"/><path d="M13 30h22l5 8a4 4 0 0 1-3.5 6h-25A4 4 0 0 1 8 38z" fill="#8e44d6"/></svg>`,
    start() {
      const area = Mini.open(lab);
      const ROUNDS = 10, PER = 12;
      area.innerHTML = `<div class="lab">
        <div class="rule" id="lab-round"></div>
        <div class="lab-stage"><div class="target-blob" id="lab-target"></div><div class="lab-eq" id="lab-eq"></div></div>
        <p class="lab-hint" id="lab-hint">${t('lab_pick')}</p>
        <div class="paints" dir="ltr">${PAINTS.map((c, i) => `<button class="paint" data-raw data-i="${i}" style="--pc:${c}"><span class="pot"></span><small>${t('paints')[i]}</small></button>`).join('')}</div>
      </div>`;
      let round = 0, score = 0, right = 0, picked = [], left = PER, recipe = null, busy = false, over = false, order = [];
      const paints = [...area.querySelectorAll('.paint')];
      const nextRound = () => {
        if (round >= ROUNDS) {
          over = true;
          return Mini.finish(lab, score, 5 + Math.floor(score / 20), 15 + Math.floor(score / 12), `<p>${t('correct', right)}</p>`);
        }
        if (!order.length) order = RECIPES.map((_, i) => i).sort(() => Math.random() - 0.5);
        recipe = RECIPES[order.pop()];
        round++; left = PER; picked = []; busy = false;
        paints.forEach(p => p.classList.remove('sel'));
        $('#lab-round').textContent = t('lab_round', round, ROUNDS);
        const blob = $('#lab-target');
        blob.style.background = recipe.hex;
        blob.textContent = '?';
        blob.classList.remove('in'); void blob.offsetWidth; blob.classList.add('in');
        $('#lab-eq').innerHTML = '';
      };
      const reveal = ok => {
        const name = recipe[save.lang];
        const n = t('paints');
        $('#lab-target').textContent = name;
        $('#lab-eq').innerHTML = `<span class="sw" style="background:${PAINTS[recipe.a]}"></span>${n[recipe.a]} + <span class="sw" style="background:${PAINTS[recipe.b]}"></span>${n[recipe.b]}`;
        if (ok) { Sound.success(); vibrate(20); } else { Sound.fail(); shake($('#lab-target')); }
      };
      const pick = i => {
        if (busy || over) return;
        const p = paints[i];
        if (picked.includes(i)) { picked = picked.filter(x => x !== i); p.classList.remove('sel'); return; }
        picked.push(i);
        p.classList.add('sel');
        Sound.tone(400 + i * 80, 0.1, 'sine', 0.3);
        if (picked.length < 2) return;
        busy = true;
        const ok = (picked[0] === recipe.a && picked[1] === recipe.b) || (picked[0] === recipe.b && picked[1] === recipe.a);
        if (ok) { right++; score += 20 + Math.round(left * 2); Mini.score(score); }
        reveal(ok);
        setTimeout(() => { if (!over) nextRound(); }, ok ? 1100 : 1900);
      };
      paints.forEach((p, i) => p.addEventListener('pointerdown', e => { e.preventDefault(); pick(i); }));
      const timer = setInterval(() => {
        if (busy || over) return;
        left -= 0.1;
        Mini.time(left / PER);
        if (left <= 0) { busy = true; reveal(false); setTimeout(() => { if (!over) nextRound(); }, 1900); }
      }, 100);
      Mini.onLeave(() => { over = true; clearInterval(timer); });
      nextRound();
    },
  };

  // ---------- Pairs (memory cards) ----------
  const pairs = {
    id: 'pairs', minLevel: 4, skill: 'visual', target: 800, color: '#9b6dff',
    icon: `<svg viewBox="0 0 48 48"><rect x="4" y="8" width="18" height="26" rx="4" fill="#fff"/><circle cx="13" cy="21" r="5" fill="#ff6f59"/><rect x="26" y="14" width="18" height="26" rx="4" fill="#9b6dff"/></svg>`,
    start() {
      const area = Mini.open(pairs);
      Mini.time(null);
      const palette = ['#ff6f59', '#ffb627', '#2ec4b6', '#3a86ff'];
      // 8 symbols: each shape in two colors
      const symbols = [];
      for (let s = 0; s < 4; s++) symbols.push([s, palette[s]], [s, palette[(s + 2) % 4]]);
      const deck = symbols.concat(symbols).map((v, i) => ({ v, id: i, key: `${v[0]}${v[1]}` })).sort(() => Math.random() - 0.5);
      area.innerHTML = `<div class="pairs" dir="ltr">${deck.map((c, i) => `<button class="card" data-raw data-i="${i}" aria-label="card"><span class="face back"></span><span class="face front"><svg viewBox="0 0 24 24" style="fill:${c.v[1]}">${SHAPES[c.v[0]]}</svg></span></button>`).join('')}</div>`;
      const cards = [...area.querySelectorAll('.card')];
      let open = [], matched = 0, moves = 0, secs = 0, lock = false, over = false;
      const hud = () => Mini.extra(`<span class="chip">${t('pairs_moves', moves)}</span>`);
      const flip = i => {
        if (lock || over) return;
        const c = cards[i];
        if (c.classList.contains('up')) return;
        c.classList.add('up');
        Sound.tone(500 + open.length * 120, 0.08, 'sine', 0.3);
        open.push(i);
        if (open.length < 2) return;
        moves++;
        hud();
        const [a, b] = open;
        open = [];
        if (deck[a].key === deck[b].key) {
          matched++;
          cards[a].classList.add('done'); cards[b].classList.add('done');
          Sound.success();
          Mini.score(matched * 50);
          if (matched === 8) {
            over = true;
            clearInterval(timer);
            const score = Math.max(100, 900 - moves * 15 - secs * 4);
            setTimeout(() => Mini.finish(pairs, score, 5 + Math.floor(score / 25), 15 + Math.floor(score / 15), `<p>${t('pairs_moves', moves)} · ${t('pairs_time', secs)}</p>`), 500);
          }
        } else {
          lock = true;
          setTimeout(() => { cards[a].classList.remove('up'); cards[b].classList.remove('up'); lock = false; }, 750);
        }
      };
      cards.forEach((c, i) => c.addEventListener('pointerdown', e => { e.preventDefault(); flip(i); }));
      const timer = setInterval(() => { secs++; }, 1000);
      Mini.onLeave(() => { over = true; clearInterval(timer); });
      hud();
    },
  };

  [stroop, rain, lab, pairs].forEach(TZ.registerGame);
})();
