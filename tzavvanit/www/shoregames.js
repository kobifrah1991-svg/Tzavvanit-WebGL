'use strict';
// Two beach games built from research principles, each with its own twist:
// - Talking Shells: tap the syllables of a Hebrew word on a drum; every right word adds a floor to a sand castle
//   (rhythmic segmentation is linked with phonological awareness).
// - Tide Turn: sort sea creatures by colour at low tide and by shape at high tide; the rule is shown only by
//   the water level, and the tide turns at unpredictable moments (task switching / cognitive flexibility).
(() => {
  const { $, sleep, rand, t, Sound, vibrate, Mini, save } = TZ;

  TZ.addStrings({
    g_shells: 'קונכיות מדברות', g_shells_d: 'מתופפים את ההברות של המילה',
    g_tide: 'גאות ושפל', g_tide_d: 'הים קובע את החוק',
    sk_phon: 'קצב ושפה', sk_flex: 'גמישות מחשבתית',
    sh_tap: 'הקישו על התוף פעם אחת לכל הברה', sh_again: 'לשמוע שוב', sh_floor: n => `${n} קומות בארמון`,
    sh_was: n => `${n} הברות`, sh_one: 'הברה אחת',
    td_low: 'שפל: ממיינים לפי צבע', td_high: 'גאות: ממיינים לפי צורה', td_turn: 'הים מתחלף!',
    td_intro: 'כשהמים נמוכים – ממיינים לפי צבע. כשהמים גבוהים – לפי צורה.',
    td_res: (ok, all) => `מיינתם נכון ${ok} מתוך ${all}`,
  }, {
    g_shells: 'Talking Shells', g_shells_d: 'Drum the syllables of the word',
    g_tide: 'Tide Turn', g_tide_d: 'The sea sets the rule',
    sk_phon: 'Rhythm and language', sk_flex: 'Mental flexibility',
    sh_tap: 'Tap the drum once for each syllable', sh_again: 'Hear it again', sh_floor: n => `${n} castle floors`,
    sh_was: n => `${n} syllables`, sh_one: 'One syllable',
    td_low: 'Low tide: sort by colour', td_high: 'High tide: sort by shape', td_turn: 'The tide turned!',
    td_intro: 'When the water is low, sort by colour. When it is high, sort by shape.',
    td_res: (ok, all) => `You sorted ${ok} of ${all} correctly`,
  });

  function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }

  // ---------- Talking Shells ----------
  // Hebrew words split into spoken syllables. English mode shows English words.
  const WORDS_HE = [
    ['ים', '🌊'], ['דג', '🐟'], ['חול', '🏖️'], ['סוס', '🐴'],
    ['שֶׁ-מֶשׁ', '☀️'], ['כַּ-דּוּר', '⚽'], ['סִי-רָה', '⛵'], ['דּוֹל-פִין', '🐬'], ['כּוֹ-בַע', '👒'], ['גְּלִי-דָה', '🍦'], ['צֶ-דֶף', '🐚'], ['אַר-נָב', '🐰'],
    ['מִט-רִי-יָה', '☂️'], ['תְּ-מָ-נוּן', '🐙'], ['מִג-דָּ-לוֹר', '🗼'], ['קְרוֹ-קוֹ-דִיל', '🐊'], ['מְ-כוֹ-נִית', '🚗'], ['אֲ-וִי-רוֹן', '✈️'],
    ['אֲ-בַ-טִּי-חַ', '🍉'], ['אוֹ-פַ-נַּ-יִם', '🚲'], ['הִי-פּוֹ-פּוֹ-טָם', '🦛'], ['תַּר-נְ-גוֹ-לֶת', '🐔'], ['פַּר-פָּ-רִים', '🦋'],
  ];
  const WORDS_EN = [
    ['sun', '☀️'], ['fish', '🐟'], ['sea', '🌊'], ['ball', '⚽'], ['boat', '⛵'],
    ['dol-phin', '🐬'], ['sea-shell', '🐚'], ['rab-bit', '🐰'], ['ice-cream', '🍦'],
    ['um-brel-la', '☂️'], ['oc-to-pus', '🐙'], ['bi-cy-cle', '🚲'], ['croc-o-dile', '🐊'],
    ['wa-ter-mel-on', '🍉'], ['hel-i-cop-ter', '🚁'], ['hip-po-pot-a-mus', '🦛'],
  ];
  // Drops Hebrew vowel marks for the on-screen word (the marked form still drives speech)
  const plain = s => s.replace(/[֑-ׇ]/g, '').replace(/-/g, '');
  let heVoice = null;
  const findVoice = () => {
    try {
      const vs = speechSynthesis.getVoices();
      heVoice = vs.find(v => /^he|^iw/i.test(v.lang)) || null;
    } catch (e) { heVoice = null; }
  };
  try { findVoice(); speechSynthesis.addEventListener('voiceschanged', findVoice); } catch (e) { /* no speech */ }
  function say(text, lang) {
    try {
      if (!window.speechSynthesis) return false;
      const u = new SpeechSynthesisUtterance(text);
      if (lang === 'he') { if (!heVoice) return false; u.voice = heVoice; u.lang = heVoice.lang; } else u.lang = 'en-US';
      u.rate = 0.8;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }

  const shells = {
    id: 'shells', minLevel: 1, color: '#ff6f59', skill: 'phon', target: 120,
    icon: `<svg viewBox="0 0 48 48"><path d="M24 8C14 8 8 18 8 28c0 6 5 10 16 10s16-4 16-10C40 18 34 8 24 8z" fill="#fff"/><path d="M24 10v26M17 12l-3 22M31 12l3 22" stroke="#ff6f59" stroke-width="2.5"/></svg>`,
    start() {
      const area = Mini.open(shells);
      const lvl = TZ.difficulty('shells'), ROUNDS = 10, he = save.lang === 'he';
      const words = he ? WORDS_HE : WORDS_EN;
      // Difficulty picks longer words and, from level 5, hides the written word (picture and voice only)
      const maxSyl = Math.min(he ? 4 : 5, 1 + Math.ceil(lvl / 2));
      const pool = words.filter(w => w[0].split('-').length <= maxSyl);
      const hideText = lvl >= 5 && (he ? !!heVoice : true);
      area.innerHTML = `<div class="shells"><div class="castle" id="sh-castle"><div class="castle-flag"></div></div>
        <div class="sh-card"><div class="sh-pic" id="sh-pic"></div><div class="sh-word" id="sh-word"></div>
        <button class="btn small" data-raw id="sh-again">${t('sh_again')}</button></div>
        <p class="lab-hint">${t('sh_tap')}</p>
        <button class="drum sh-drum" id="sh-drum" data-raw><span class="ring"></span><span class="skin"></span></button>
        <div class="sh-dots" id="sh-dots" dir="ltr"></div></div>`;
      const drum = $('#sh-drum'), dots = $('#sh-dots'), castle = $('#sh-castle');
      let round = 0, right = 0, score = 0, floors = 0, over = false, taps = 0, word = null, judge = null, accept = false;
      const used = [];
      const sylls = () => word[0].split('-');
      const speak = () => say(he ? word[0].replace(/-/g, '') : word[0].replace(/-/g, ''), he ? 'he' : 'en');
      const draw = () => { dots.innerHTML = Array.from({ length: Math.max(taps, 1) }, (_, i) => `<i class="${i < taps ? 'on' : ''}"></i>`).join(''); };
      const addFloor = () => { floors++; castle.querySelector('.castle-flag').insertAdjacentHTML('afterend', `<div class="floor f${floors % 3}"></div>`); Mini.extra(`<span class="chip">${t('sh_floor', floors)}</span>`); };
      const check = async () => {
        accept = false;
        const n = sylls().length, ok = taps === n;
        $('#sh-word').textContent = he ? sylls().map(plain).join(' · ') : sylls().join(' · ');
        $('#sh-word').classList.add('split');
        // Replay the word as beats so the child hears the right rhythm either way
        for (let i = 0; i < n && !over; i++) { Sound.tone(ok ? 660 : 520, 0.12, 'triangle', 0.35); await sleep(320); }
        if (over) return;
        if (ok) { right++; score += 10 + n * 2; Mini.score(score); Sound.success(); vibrate(10); addFloor(); }
        else { Sound.fail(); vibrate([30, 30, 30]); shake(dots); }
        await sleep(ok ? 900 : 1500);
        if (!over) next();
      };
      const next = () => {
        if (round >= ROUNDS) {
          over = true;
          return Mini.finish(shells, score, 5 + right * 2, 10 + right * 3, `<p>${t('sh_floor', floors)}</p>`,
            { acc: right / ROUNDS, step: right >= 9 ? 1 : right <= 5 ? -1 : 0 });
        }
        round++; taps = 0; accept = true;
        let w;
        do { w = pool[rand(pool.length)]; } while (used.includes(w) && used.length < pool.length);
        used.push(w); word = w;
        $('#sh-pic').textContent = word[1];
        const wEl = $('#sh-word');
        wEl.classList.remove('split');
        wEl.textContent = hideText ? '' : (he ? plain(word[0]) : word[0].replace(/-/g, ''));
        draw();
        speak();
      };
      drum.addEventListener('pointerdown', e => {
        e.preventDefault();
        if (!accept || over) return;
        taps++;
        drum.classList.remove('hit'); void drum.offsetWidth; drum.classList.add('hit');
        Sound.tone(300, 0.08, 'sine', 0.4); draw();
        clearTimeout(judge);
        // A pause of 1.4 seconds after the last tap ends the answer
        judge = setTimeout(() => { if (accept && !over) check(); }, 1400);
      });
      $('#sh-again').addEventListener('pointerdown', e => { e.preventDefault(); if (word) speak(); });
      if (!hideText && he && !heVoice) $('#sh-again').hidden = true;
      Mini.onLeave(() => { over = true; clearTimeout(judge); try { speechSynthesis.cancel(); } catch (err) { /* ignore */ } });
      next();
    },
  };

  // ---------- Tide Turn ----------
  // Creatures differ in colour (orange / blue) and shape (round / star). Left basket = orange round,
  // right basket = blue star. Low tide: match by colour. High tide: match by shape.
  const CREATURE = {
    round: c => `<svg viewBox="0 0 60 60"><circle cx="30" cy="32" r="22" fill="${c}"/><circle cx="23" cy="28" r="4" fill="#fff"/><circle cx="37" cy="28" r="4" fill="#fff"/><circle cx="23" cy="29" r="2" fill="#123b4a"/><circle cx="37" cy="29" r="2" fill="#123b4a"/></svg>`,
    star: c => `<svg viewBox="0 0 60 60"><path d="M30 4l7 17 18 1-14 12 5 18-16-10-16 10 5-18L5 22l18-1z" fill="${c}"/><circle cx="25" cy="27" r="3.5" fill="#fff"/><circle cx="35" cy="27" r="3.5" fill="#fff"/><circle cx="25" cy="28" r="1.8" fill="#123b4a"/><circle cx="35" cy="28" r="1.8" fill="#123b4a"/></svg>`,
  };
  const ORANGE = '#ff8a1f', BLUE = '#3a86ff';

  const tide = {
    id: 'tide', minLevel: 2, color: '#3a86ff', skill: 'flex', target: 300,
    icon: `<svg viewBox="0 0 48 48"><path d="M4 30c5-4 9-4 14 0s9 4 14 0 9-4 12-2v12H4z" fill="#fff"/><path d="M4 22c5-4 9-4 14 0s9 4 14 0 9-4 12-2" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/></svg>`,
    start() {
      const area = Mini.open(tide);
      const lvl = TZ.difficulty('tide'), TRIALS = 30;
      const window_ = Math.max(1600, 3400 - lvl * 180);
      const pSwitch = Math.min(0.45, 0.2 + lvl * 0.03);
      area.innerHTML = `<div class="tide"><div class="tide-sea low" id="td-sea"><div class="tide-water"></div><div class="tide-label" id="td-label"></div>
        <div class="tide-item" id="td-item"></div></div>
        <div class="tide-baskets">
          <button class="tide-basket" data-raw data-side="0"><span>${CREATURE.round(ORANGE)}</span></button>
          <button class="tide-basket" data-raw data-side="1"><span>${CREATURE.star(BLUE)}</span></button>
        </div><p class="lab-hint">${t('td_intro')}</p></div>`;
      const sea = $('#td-sea'), item = $('#td-item'), label = $('#td-label');
      let n = 0, ok = 0, score = 0, streak = 0, high = false, over = false, cur = null, tm = null, t0 = 0, sinceSwitch = 9;
      const rts = { stay: [], sw: [] };
      const setTide = h => { high = h; sea.classList.toggle('high', h); sea.classList.toggle('low', !h); label.textContent = h ? t('td_high') : t('td_low'); };
      const next = async () => {
        if (over) return;
        if (n >= TRIALS) {
          over = true;
          const med = a => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; };
          const cost = rts.sw.length && rts.stay.length ? Math.round(med(rts.sw) - med(rts.stay)) : null;
          return Mini.finish(tide, score, 5 + Math.floor(score / 25), 10 + Math.floor(score / 15),
            `<p>${t('td_res', ok, TRIALS)}</p>`, { acc: ok / TRIALS, step: ok >= 27 ? 1 : ok <= 20 ? -1 : 0, switchCost: cost });
        }
        n++;
        // The tide never turns twice in a row, so every switch is followed by a few stay trials
        let switched = false;
        if (n > 3 && sinceSwitch >= 2 && Math.random() < pSwitch) {
          switched = true; sinceSwitch = 0;
          sea.classList.add('turning'); Sound.tone(220, 0.4, 'sine', 0.25); label.textContent = t('td_turn');
          await sleep(650);
          if (over) return;
          sea.classList.remove('turning'); setTide(!high);
        } else sinceSwitch++;
        const color = rand(2), shape = rand(2); // 0 = orange / round, 1 = blue / star
        cur = { color, shape, switched };
        item.innerHTML = CREATURE[shape ? 'star' : 'round'](color ? BLUE : ORANGE);
        item.classList.remove('in', 'go-0', 'go-1'); void item.offsetWidth; item.classList.add('in');
        t0 = performance.now();
        clearTimeout(tm);
        tm = setTimeout(() => answer(-1), window_);
      };
      const answer = side => {
        if (!cur || over) return;
        clearTimeout(tm);
        const want = high ? cur.shape : cur.color;
        const good = side === want;
        const rt = performance.now() - t0;
        if (good) {
          ok++; streak++; score += 10 + Math.min(streak, 10);
          (cur.switched ? rts.sw : rts.stay).push(rt);
          item.classList.add(`go-${side}`); Sound.tone(600 + Math.min(streak, 12) * 25, 0.08, 'triangle', 0.3); vibrate(10);
        } else { streak = 0; Sound.fail(); vibrate(40); shake(item); }
        Mini.score(score);
        Mini.time(1 - n / TRIALS);
        cur = null;
        setTimeout(next, good ? 350 : 700);
      };
      area.querySelectorAll('.tide-basket').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); answer(Number(b.dataset.side)); }));
      Mini.onLeave(() => { over = true; clearTimeout(tm); });
      setTide(false);
      Mini.time(1);
      setTimeout(next, 900);
    },
  };

  [shells, tide].forEach(TZ.registerGame);

  // Card art
  const W = (bg, body) => `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="320" height="200" fill="${bg}"/>${body}</svg>`;
  Object.assign(TZ.previews, {
    shells: W('#fff1dc', `<rect x="0" y="150" width="320" height="50" fill="#ffe3a8"/>
      <g fill="#f4c27a" stroke="#d9a25a" stroke-width="2"><rect x="30" y="112" width="70" height="40" rx="4"/><rect x="38" y="78" width="54" height="34" rx="4"/><rect x="46" y="48" width="38" height="30" rx="4"/></g>
      <path d="M65 48V22l16 6-16 6" fill="#ff6f59" stroke="#123b4a" stroke-width="2"/>
      <rect x="130" y="20" width="160" height="70" rx="16" fill="#fff"/><text x="210" y="66" text-anchor="middle" font-size="30" font-weight="900" font-family="Arial" fill="#123b4a">דּוֹל · פִין</text>
      <circle cx="210" cy="140" r="38" fill="#ff8a1f"/><circle cx="210" cy="140" r="28" fill="#ffd9a8"/>
      <g fill="#123b4a"><circle cx="190" cy="190" r="6"/><circle cx="210" cy="190" r="6"/></g>`),
    tide: W('#d7f3ff', `<rect width="320" height="200" fill="#ffe3a8"/><path d="M0 60Q40 50 80 60T160 60T240 60T320 60V200H0z" fill="#3a86ff" opacity=".85"/>
      <rect x="110" y="16" width="100" height="26" rx="13" fill="#123b4a"/><rect x="128" y="25" width="64" height="8" rx="4" fill="#fff"/>
      <svg x="128" y="66" width="64" height="64" viewBox="0 0 60 60">${CREATURE.star(ORANGE).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>
      <rect x="30" y="142" width="110" height="48" rx="14" fill="#fff"/><svg x="62" y="144" width="44" height="44" viewBox="0 0 60 60">${CREATURE.round(ORANGE).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>
      <rect x="180" y="142" width="110" height="48" rx="14" fill="#fff"/><svg x="212" y="144" width="44" height="44" viewBox="0 0 60 60">${CREATURE.star(BLUE).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>`),
  });
})();
