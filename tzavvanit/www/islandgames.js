'use strict';
// Three more research-based games, each with its own twist:
// - Memory Island: the child picks a memory strategy (story, groups or places on the island) before studying
//   a list, then sees which strategy works best for them. Strategies are what carries over outside the game.
// - Fishing Net: a gentle N-back. Net only the fish that matches the one 1, 2 or 3 fish earlier.
// - Break Dance: a one-minute movement break led by the character, also offered by the break reminder.
(() => {
  const { $, sleep, rand, t, Sound, vibrate, Mini, save, persist } = TZ;

  TZ.addStrings({
    g_island: 'האי של הזיכרון', g_island_d: 'בוחרים שיטה וזוכרים יותר',
    g_net: 'רשת הדייג', g_net_d: 'תופסים רק את הדג הנכון',
    g_dance: 'ריקוד ההפסקה', g_dance_d: 'דקה של תנועה למוח',
    sk_strat: 'שיטות זיכרון', sk_update: 'עדכון זיכרון', sk_move: 'תנועה',
    is_pick: 'איך תזכרו את הרשימה הפעם?', is_round: (n, of) => `סבב ${n} מתוך ${of}`,
    is_story: 'סיפור', is_story_d: 'מחברים את הכל לסיפור מצחיק',
    is_groups: 'קבוצות', is_groups_d: 'ממיינים לאוכל, חיות וחפצים',
    is_places: 'מקומות באי', is_places_d: 'מניחים כל דבר במקום אחר באי',
    is_tried: 'ניסיתם', is_recall: n => `בחרו את ${n} הדברים שראיתם`, is_done: 'סיימתי',
    is_got: (h, n) => `זכרתם ${h} מתוך ${n}`, is_best: s => `השיטה שעובדת לכם הכי טוב: ${s}`,
    is_try: 'נסו גם את השיטות האחרות, כדי לגלות מה הכי מתאים לכם',
    cat_food: 'אוכל', cat_animal: 'חיות', cat_thing: 'חפצים',
    net_1: 'הקישו "רשת!" כשהדג זהה לדג שעבר הרגע', net_n: n => `הקישו "רשת!" כשהדג זהה לדג שעבר לפני ${n}`,
    net_btn: 'רשת!', net_res: (h, all, fa) => `תפסתם ${h} מתוך ${all} דגים נכונים${fa ? ` · ${fa} טעויות` : ''}`,
    dn_title: 'רקדתם דקה שלמה!', dn_ready: 'קומו מהכיסא! מתחילים בעוד רגע', dn_end: 'כל הכבוד! הגוף והמוח אומרים תודה',
    dn_jump: 'קפצו במקום', dn_arms: 'סובבו ידיים כמו טחנת רוח', dn_toes: 'התכופפו וגעו בבהונות', dn_march: 'צעדו במקום עם ברכיים גבוהות',
    dn_reach: 'מתחו ידיים למעלה לשמש', dn_free: 'ריקוד חופשי!', dn_moves: n => `${n} תנועות`,
  }, {
    g_island: 'Memory Island', g_island_d: 'Pick a strategy, remember more',
    g_net: 'Fishing Net', g_net_d: 'Catch only the right fish',
    g_dance: 'Break Dance', g_dance_d: 'A minute of moving for your brain',
    sk_strat: 'Memory strategies', sk_update: 'Memory updating', sk_move: 'Movement',
    is_pick: 'How will you remember the list this time?', is_round: (n, of) => `Round ${n} of ${of}`,
    is_story: 'Story', is_story_d: 'Link everything into a silly story',
    is_groups: 'Groups', is_groups_d: 'Sort into food, animals and things',
    is_places: 'Island places', is_places_d: 'Put each thing in a different spot on the island',
    is_tried: 'Tried', is_recall: n => `Pick the ${n} things you saw`, is_done: 'Done',
    is_got: (h, n) => `You remembered ${h} of ${n}`, is_best: s => `The strategy that works best for you: ${s}`,
    is_try: 'Try the other strategies too, to find what suits you best',
    cat_food: 'Food', cat_animal: 'Animals', cat_thing: 'Things',
    net_1: 'Tap "Net!" when the fish matches the one just before', net_n: n => `Tap "Net!" when the fish matches the one ${n} back`,
    net_btn: 'Net!', net_res: (h, all, fa) => `You caught ${h} of ${all} matching fish${fa ? ` · ${fa} mistakes` : ''}`,
    dn_title: 'You danced a whole minute!', dn_ready: 'Stand up! Starting in a moment', dn_end: 'Well done! Your body and brain say thanks',
    dn_jump: 'Jump on the spot', dn_arms: 'Circle your arms like a windmill', dn_toes: 'Bend down and touch your toes', dn_march: 'March on the spot, knees up high',
    dn_reach: 'Reach up to the sun', dn_free: 'Free dance!', dn_moves: n => `${n} moves`,
  });

  const shuffle = a => a.sort(() => Math.random() - 0.5);
  function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }

  // ---------- Memory Island ----------
  const ITEMS = [
    ['🍉', 'אבטיח', 'watermelon', 'food'], ['🍦', 'גלידה', 'ice cream', 'food'], ['🍌', 'בננה', 'banana', 'food'],
    ['🥥', 'קוקוס', 'coconut', 'food'], ['🍓', 'תות', 'strawberry', 'food'], ['🥪', 'כריך', 'sandwich', 'food'],
    ['🐬', 'דולפין', 'dolphin', 'animal'], ['🐢', 'צב', 'turtle', 'animal'], ['🦀', 'סרטן', 'crab', 'animal'],
    ['🐙', 'תמנון', 'octopus', 'animal'], ['🦜', 'תוכי', 'parrot', 'animal'], ['🐠', 'דג', 'fish', 'animal'],
    ['⛵', 'סירה', 'boat', 'thing'], ['🎈', 'בלון', 'balloon', 'thing'], ['👒', 'כובע', 'hat', 'thing'],
    ['☂️', 'מטריה', 'umbrella', 'thing'], ['⚽', 'כדור', 'ball', 'thing'], ['🕶️', 'משקפי שמש', 'sunglasses', 'thing'],
  ];
  const nameOf = it => save.lang === 'he' ? it[1] : it[2];
  const LINKS_HE = ['פעם אחת', 'פגש', 'שקפץ על', 'שאכל', 'שרקד עם', 'שהתחבא מתחת', 'שצחק על', 'שנישק', 'שישב על', 'ושר שיר ל'];
  const LINKS_EN = ['Once upon a time a', 'met a', 'who jumped on a', 'who ate a', 'who danced with a', 'who hid under a', 'who laughed at a', 'who kissed a', 'who sat on a', 'and sang to a'];
  // Spots on the island, as % positions inside the island picture
  const SPOTS = [[18, 30], [50, 18], [80, 30], [30, 55], [66, 52], [14, 76], [44, 80], [80, 76], [52, 40], [88, 52]];
  const STRATS = ['story', 'groups', 'places'];

  const island = {
    id: 'island', minLevel: 2, color: '#22b04b', skill: 'strat', target: 150,
    icon: `<svg viewBox="0 0 48 48"><ellipse cx="24" cy="36" rx="18" ry="6" fill="#fff"/><path d="M24 34V16" stroke="#fff" stroke-width="3"/><path d="M24 16c-6-6-12-4-14 0 5-2 9-1 14 0zm0 0c6-6 12-4 14 0-5-2-9-1-14 0zm0 0c-2-6 2-10 6-10-3 2-5 5-6 10z" fill="#fff"/></svg>`,
    start() {
      const area = Mini.open(island);
      const lvl = TZ.difficulty('island'), ROUNDS = 3;
      // Kindergarten mode starts with 3 items; older players with 5
      const N = TZ.kinder && TZ.kinder() ? Math.min(5, 3 + Math.floor(lvl / 2)) : Math.min(9, 5 + Math.floor(lvl / 2));
      const tried = [];
      let round = 0, total = 0, accSum = 0, over = false;
      Mini.onLeave(() => { over = true; });
      const hist = save.memStrat || (save.memStrat = {});

      const pickStrategy = () => new Promise(res => {
        area.innerHTML = `<div class="isl"><div class="rule">${t('is_round', round, ROUNDS)}</div><h3 class="isl-q">${t('is_pick')}</h3>
          <div class="isl-strats">${STRATS.map(s => `<button class="isl-strat" data-raw data-s="${s}"><b>${t('is_' + s)}</b><small>${t('is_' + s + '_d')}</small>
          ${tried.includes(s) ? `<span class="chip">${t('is_tried')}</span>` : ''}</button>`).join('')}</div></div>`;
        area.querySelectorAll('.isl-strat').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); res(b.dataset.s); }));
      });

      const study = async (strat, list) => {
        const step = Math.max(1300, 2200 - lvl * 80);
        if (strat === 'story') {
          area.innerHTML = `<div class="isl"><div class="isl-big" id="is-big"></div><p class="isl-story" id="is-story"></p></div>`;
          const links = save.lang === 'he' ? LINKS_HE : LINKS_EN;
          const parts = [];
          for (let i = 0; i < list.length && !over; i++) {
            $('#is-big').textContent = list[i][0];
            parts.push(`${links[i]} <b>${list[i][0]} ${nameOf(list[i])}</b>`);
            $('#is-story').innerHTML = parts.join(' ');
            Sound.tone(520 + i * 30, 0.08, 'triangle', 0.25);
            await sleep(step + 400);
          }
        } else if (strat === 'groups') {
          area.innerHTML = `<div class="isl"><div class="isl-groups">${['food', 'animal', 'thing'].map(c => `<div class="isl-box" data-c="${c}"><b>${t('cat_' + c)} <span>0</span></b><div class="isl-in"></div></div>`).join('')}</div></div>`;
          for (let i = 0; i < list.length && !over; i++) {
            const box = area.querySelector(`.isl-box[data-c="${list[i][3]}"]`);
            box.querySelector('.isl-in').insertAdjacentHTML('beforeend', `<span class="isl-item">${list[i][0]}<small>${nameOf(list[i])}</small></span>`);
            const c = box.querySelector('b span'); c.textContent = Number(c.textContent) + 1;
            Sound.tone(520 + i * 30, 0.08, 'triangle', 0.25);
            await sleep(step);
          }
          await sleep(2500);
        } else {
          area.innerHTML = `<div class="isl"><div class="isl-map" id="is-map"><span class="isl-palm"></span></div></div>`;
          const map = $('#is-map');
          for (let i = 0; i < list.length && !over; i++) {
            const [x, y] = SPOTS[i];
            map.insertAdjacentHTML('beforeend', `<span class="isl-spot" style="left:${x}%;top:${y}%">${list[i][0]}<small>${nameOf(list[i])}</small></span>`);
            Sound.tone(520 + i * 30, 0.08, 'triangle', 0.25);
            await sleep(step);
          }
          await sleep(2000);
        }
      };

      const recall = list => new Promise(res => {
        const distract = shuffle(ITEMS.filter(it => !list.includes(it))).slice(0, Math.min(N, ITEMS.length - N));
        const all = shuffle([...list, ...distract]);
        const picked = new Set();
        area.innerHTML = `<div class="isl"><h3 class="isl-q">${t('is_recall', list.length)}</h3>
          <div class="isl-grid">${all.map((it, i) => `<button class="isl-pick" data-raw data-i="${i}">${it[0]}<small>${nameOf(it)}</small></button>`).join('')}</div>
          <button class="btn primary" data-raw id="is-done">${t('is_done')}</button></div>`;
        area.querySelectorAll('.isl-pick').forEach(b => b.addEventListener('pointerdown', e => {
          e.preventDefault();
          const i = Number(b.dataset.i);
          if (picked.has(i)) picked.delete(i); else picked.add(i);
          b.classList.toggle('on', picked.has(i)); Sound.tone(picked.has(i) ? 600 : 400, 0.05, 'sine', 0.2);
        }));
        $('#is-done').addEventListener('pointerdown', e => {
          e.preventDefault();
          let hits = 0, fa = 0;
          picked.forEach(i => { if (list.includes(all[i])) hits++; else fa++; });
          // Show what was right and what was missed
          area.querySelectorAll('.isl-pick').forEach(b => { const it = all[Number(b.dataset.i)]; b.classList.add(list.includes(it) ? 'was' : 'not'); });
          res({ hits, fa });
        });
      });

      (async () => {
        while (!over && round < ROUNDS) {
          round++;
          const strat = await pickStrategy();
          if (over) return;
          if (!tried.includes(strat)) tried.push(strat);
          const list = shuffle(ITEMS.slice()).slice(0, N);
          await study(strat, list);
          if (over) return;
          const { hits, fa } = await recall(list);
          if (over) return;
          const acc = Math.max(0, (hits - fa) / N);
          accSum += acc; total += Math.max(0, hits - fa) * 10;
          (hist[strat] = hist[strat] || []).push(Math.round(acc * 100));
          if (hist[strat].length > 10) hist[strat].shift();
          persist();
          Mini.score(total);
          if (acc >= 0.8) Sound.success(); else Sound.fail();
          Mini.extra(`<span class="chip">${t('is_got', hits, N)}</span>`);
          await sleep(2200);
        }
        if (over) return;
        over = true;
        // The best strategy across this child's history, once at least two have been tried
        const avg = s => (hist[s] || []).reduce((a, b) => a + b, 0) / ((hist[s] || []).length || 1);
        const triedAll = STRATS.filter(s => (hist[s] || []).length);
        const best = triedAll.sort((a, b) => avg(b) - avg(a))[0];
        const note = triedAll.length >= 2 ? `<p>${t('is_best', t('is_' + best))}</p>` : `<p>${t('is_try')}</p>`;
        const mean = accSum / ROUNDS;
        Mini.finish(island, total, 5 + Math.round(mean * 20), 12 + Math.round(mean * 30), note,
          { acc: mean, step: mean >= 0.85 ? 1 : mean < 0.5 ? -1 : 0 });
      })();
    },
  };

  // ---------- Fishing Net (N-back) ----------
  const FISH = [
    ['#ff6f59', 'plain'], ['#3a86ff', 'stripes'], ['#ffb627', 'dots'], ['#22b04b', 'plain'], ['#9b6dff', 'stripes'], ['#ff8a1f', 'dots'],
  ];
  const fishSvg = ([c, p]) => `<svg viewBox="0 0 100 60"><path d="M10 30c14-22 46-24 62 0-16 24-48 22-62 0z" fill="${c}"/><path d="M70 30l22-16v32z" fill="${c}"/>
    ${p === 'stripes' ? '<path d="M34 12v36M48 10v40" stroke="#fff" stroke-width="5" opacity=".75"/>' : ''}
    ${p === 'dots' ? '<g fill="#fff" opacity=".8"><circle cx="38" cy="22" r="4"/><circle cx="50" cy="36" r="4"/><circle cx="36" cy="40" r="3"/></g>' : ''}
    <circle cx="22" cy="26" r="5" fill="#fff"/><circle cx="21" cy="26" r="2.5" fill="#123b4a"/></svg>`;

  const net = {
    id: 'net', minLevel: 3, color: '#3a86ff', skill: 'update', target: 200,
    icon: `<svg viewBox="0 0 48 48"><path d="M8 10h32l-6 26H14z" fill="none" stroke="#fff" stroke-width="3"/><path d="M12 18h24M13 26h22M18 10l4 26M30 10l-4 26" stroke="#fff" stroke-width="2"/><path d="M24 36v8" stroke="#fff" stroke-width="3"/></svg>`,
    start() {
      const area = Mini.open(net);
      const lvl = TZ.difficulty('net');
      const N = lvl <= 3 ? 1 : lvl <= 7 ? 2 : 3;
      const kinds = Math.min(FISH.length, 3 + Math.floor(lvl / 3));
      const TRIALS = 22 + N, show = Math.max(1300, 2300 - lvl * 90);
      // Build a sequence with about 30% matches
      const seq = [];
      for (let i = 0; i < TRIALS; i++) {
        if (i >= N && Math.random() < 0.3) seq.push(seq[i - N]);
        else { let k; do { k = rand(kinds); } while (i >= N && k === seq[i - N]); seq.push(k); }
      }
      area.innerHTML = `<div class="net"><div class="rule">${N === 1 ? t('net_1') : t('net_n', N)}</div>
        <div class="net-river" id="nt-river"><div class="net-fish" id="nt-fish"></div><div class="net-trail" id="nt-trail" dir="ltr"></div></div>
        <button class="btn primary net-btn" data-raw id="nt-btn">${t('net_btn')}</button></div>`;
      const fishEl = $('#nt-fish'), btn = $('#nt-btn'), trail = $('#nt-trail');
      let i = -1, hits = 0, fa = 0, cr = 0, score = 0, over = false, pressed = false;
      const targets = seq.filter((k, j) => j >= N && k === seq[j - N]).length;
      Mini.onLeave(() => { over = true; });
      btn.addEventListener('pointerdown', e => {
        e.preventDefault();
        if (over || i < 0 || pressed) return;
        pressed = true;
        const isT = i >= N && seq[i] === seq[i - N];
        if (isT) { hits++; score += 15; fishEl.classList.add('caught'); Sound.success(); vibrate(10); }
        else { fa++; score = Math.max(0, score - 5); Sound.fail(); vibrate(40); shake(btn); }
        Mini.score(score);
      });
      (async () => {
        await sleep(900);
        for (i = 0; i < TRIALS && !over; i++) {
          pressed = false;
          fishEl.className = 'net-fish';
          fishEl.innerHTML = fishSvg(FISH[seq[i]]);
          void fishEl.offsetWidth; fishEl.classList.add('swim');
          // Bubbles show how far back to look, without showing the fish themselves
          trail.innerHTML = Array.from({ length: N + 1 }, (_, k) => `<i class="${k === 0 ? 'now' : ''}"></i>`).join('');
          Mini.time(1 - i / TRIALS);
          await sleep(show);
          if (over) return;
          if (!pressed) { const isT = i >= N && seq[i] === seq[i - N]; if (!isT) cr++; }
          fishEl.innerHTML = '';
          await sleep(350);
        }
        if (over) return;
        over = true;
        const acc = (hits + cr) / TRIALS;
        Mini.finish(net, score, 5 + Math.floor(score / 20), 10 + Math.floor(score / 12), `<p>${t('net_res', hits, targets, fa)}</p>`,
          { acc, step: acc >= 0.9 ? 1 : acc < 0.7 ? -1 : 0 });
      })();
    },
  };

  // ---------- Break Dance ----------
  const MOVES = ['jump', 'arms', 'toes', 'march', 'reach', 'free'];
  const dance = {
    id: 'dance', minLevel: 1, color: '#ffb627', skill: 'move', target: 6, noWorkout: true,
    icon: `<svg viewBox="0 0 48 48"><circle cx="24" cy="9" r="5" fill="#fff"/><path d="M24 15v14l-7 13M24 29l7 13M12 20l12 2 12-6" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>`,
    start() {
      const area = Mini.open(dance);
      const chip = $('#screen-mini .diff-chip');
      if (chip) chip.remove();
      const PER = 10;
      area.innerHTML = `<div class="dance"><div class="rule" id="dn-msg">${t('dn_ready')}</div>
        <div class="dance-stage" id="dn-stage">${TZ.charWrap('happy')}</div><div class="dance-count" id="dn-count"></div></div>`;
      const stage = $('#dn-stage'), msg = $('#dn-msg'), count = $('#dn-count');
      let over = false, done = 0;
      Mini.onLeave(() => { over = true; });
      (async () => {
        await sleep(2500);
        for (const m of MOVES) {
          if (over) return;
          msg.textContent = t('dn_' + m);
          stage.className = `dance-stage mv-${m}`;
          Sound.success();
          for (let s = PER; s > 0 && !over; s--) {
            count.textContent = s;
            Sound.tone(s % 2 ? 440 : 330, 0.06, 'triangle', 0.25);
            Mini.time(1 - (MOVES.indexOf(m) * PER + (PER - s)) / (MOVES.length * PER));
            await sleep(1000);
          }
          done++;
          Mini.extra(`<span class="chip">${t('dn_moves', done)}</span>`);
        }
        if (over) return;
        over = true;
        Mini.finish(dance, done, 5, 10, `<p>${t('dn_end')}</p>`, { acc: 1, step: 0, plain: true, title: t('dn_title') });
      })();
    },
  };

  [island, net, dance].forEach(TZ.registerGame);

  // Card art
  const W = (bg, body) => `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="320" height="200" fill="${bg}"/>${body}</svg>`;
  const emo = (x, y, s, e) => `<text x="${x}" y="${y}" font-size="${s}" text-anchor="middle">${e}</text>`;
  Object.assign(TZ.previews, {
    island: W('#bdf0ff', `<ellipse cx="160" cy="130" rx="140" ry="60" fill="#ffe3a8"/><ellipse cx="160" cy="130" rx="140" ry="60" fill="none" stroke="#fff" stroke-width="6"/>
      <path d="M160 120V70" stroke="#8a5a2b" stroke-width="7"/><path d="M160 70c-20-18-40-10-46 2 16-6 30-4 46-2zm0 0c20-18 40-10 46 2-16-6-30-4-46-2z" fill="#22b04b"/>
      ${emo(70, 130, 30, '🐢')}${emo(250, 130, 30, '🍉')}${emo(110, 170, 28, '⛵')}${emo(215, 172, 28, '🎈')}${emo(160, 160, 28, '🦀')}`),
    net: W('#d7f3ff', `<rect y="40" width="320" height="130" fill="#5fb2ff"/><path d="M0 40Q40 30 80 40T160 40T240 40T320 40" fill="none" stroke="#fff" stroke-width="4"/>
      <svg x="110" y="70" width="100" height="60" viewBox="0 0 100 60">${fishSvg(FISH[1]).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>
      <g fill="#fff" opacity=".8"><circle cx="70" cy="150" r="7"/><circle cx="96" cy="150" r="7" fill="#ffb627"/></g>
      <rect x="110" y="176" width="100" height="20" rx="10" fill="#ff8a3d"/>`),
    dance: W('#fff4dc', `<circle cx="160" cy="100" r="70" fill="#ffd36b" opacity=".6"/><circle cx="160" cy="58" r="16" fill="#ff9f86"/>
      <path d="M160 74v50l-22 40M160 124l22 40M120 84l40 10 40-26" stroke="#ff9f86" stroke-width="12" fill="none" stroke-linecap="round"/>
      <text x="60" y="60" font-size="30">♪</text><text x="250" y="80" font-size="34">♫</text><text x="240" y="170" font-size="26">♪</text>`),
  });
})();
