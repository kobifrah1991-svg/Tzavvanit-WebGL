'use strict';
// Two add-ons on top of the stage maps:
// - Kindergarten mode (ages 5-7): instructions read aloud, a speaker button to hear them again, bigger
//   text, stages 1-5 only, no reading games and gentle champion stages. Turned on in the parents area.
// - Surprise stickers: winning a star on a stage for the first time opens a surprise box with a funny
//   animal sticker and a true fact about it. The stickers fill an album on the home screen.
(() => {
  const { $, sleep, save, persist, t, Sound, modal, esc } = TZ;

  TZ.addStrings({
    kg_title: 'מצב גן (גילאי 5–7)', kg_desc: 'מקריאים בקול את ההוראות, כפתור רמקול לשמיעה חוזרת, טקסט גדול, שלבים 1–5 בלבד, בלי משחקי קריאה ושלבי אלופים עדינים.',
    kg_on: 'פועל', kg_off: 'כבוי', kg_hear: 'לשמוע שוב',
    stk_new: 'הפתעה! מדבקה חדשה', stk_fact: 'ידעתם?', stk_album: 'אלבום המדבקות', stk_count: (n, of) => `${n} מתוך ${of} מדבקות`,
    stk_hint: 'כוכב ראשון בשלב חדש פותח קופסת הפתעה', stk_open: 'לאלבום', stk_close: 'סגירה', stk_all: 'אספתם את כל המדבקות!',
    stk_say: n => `מדבקה חדשה: ${n}`,
    kgi_rain: 'תפסו רק את הטיפות בצבע שמופיע למעלה. כשמופיע צבע חדש, תופסים אותו.',
    kgi_odd: 'כל הצורות דומות, חוץ מאחת. מצאו את הצורה השונה והקישו עליה.',
    kgi_pairs: 'הפכו שני קלפים בכל פעם, ומצאו זוגות של ציורים זהים.',
    kgi_math: 'פתרו את התרגיל והקישו על התשובה הנכונה.',
  }, {
    kg_title: 'Kindergarten mode (ages 5–7)', kg_desc: 'Instructions are read aloud, a speaker button repeats them, bigger text, stages 1–5 only, no reading games and gentle champion stages.',
    kg_on: 'On', kg_off: 'Off', kg_hear: 'Hear again',
    stk_new: 'Surprise! A new sticker', stk_fact: 'Did you know?', stk_album: 'Sticker album', stk_count: (n, of) => `${n} of ${of} stickers`,
    stk_hint: 'A first star on a new stage opens a surprise box', stk_open: 'Album', stk_close: 'Close', stk_all: 'You collected every sticker!',
    stk_say: n => `New sticker: ${n}`,
    kgi_rain: 'Catch only the drops in the colour shown at the top. When a new colour appears, catch that one.',
    kgi_odd: 'All the shapes are alike except one. Find the different one and tap it.',
    kgi_pairs: 'Turn two cards at a time and find pairs of matching pictures.',
    kgi_math: 'Solve the sum and tap the right answer.',
  });

  // ---------- Speech ----------
  let voices = [];
  const loadVoices = () => { try { voices = speechSynthesis.getVoices(); } catch (e) { voices = []; } };
  try { loadVoices(); speechSynthesis.addEventListener('voiceschanged', loadVoices); } catch (e) { /* no speech */ }
  const clean = s => s.replace(/[\p{Extended_Pictographic}️‍]/gu, '').replace(/["“”]/g, '').replace(/\s+/g, ' ').trim();
  function say(text) {
    try {
      if (!window.speechSynthesis || !save.sound) return false;
      const he = save.lang === 'he';
      const v = voices.find(x => he ? /^(he|iw)/i.test(x.lang) : /^en/i.test(x.lang));
      if (he && !v) return false;
      const u = new SpeechSynthesisUtterance(clean(text));
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-US';
      u.rate = 0.85; u.pitch = 1.1;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }
  const hush = () => { try { speechSynthesis.cancel(); } catch (e) { /* ignore */ } };
  TZ.say = say;

  // ---------- Kindergarten mode ----------
  const AUDIO_GAMES = ['beat', 'echo', 'shells'];
  const KG_SPOKEN = ['rain', 'odd', 'pairs', 'math'];
  const instructions = game => {
    if (KG_SPOKEN.includes(game.id)) return t('kgi_' + game.id);
    // The fullest instruction on screen: a rule line, a question or a hint under the game
    const texts = [...document.querySelectorAll('#mini-area .rule, #mini-area h3, #mini-area .isl-q, #mini-area [class*="hint"], #mini-area p')]
      .map(el => el.textContent.trim()).filter(s => s.length > 3 && s.length < 180);
    return texts.sort((a, b) => b.length - a.length)[0] || t('g_' + game.id + '_d');
  };
  const applyBody = () => document.body.classList.toggle('kinder', !!save.kinder);
  applyBody();

  TZ.hooks.open.push((game, staged) => {
    applyBody();
    if (!save.kinder) return;
    const bar = $('#screen-mini .topbar .hud-title');
    if (bar) bar.insertAdjacentHTML('afterend', `<button class="icon-btn kg-say" data-act="kg-say" aria-label="${t('kg_hear')}">🔊</button>`);
    // Audio games make their own sounds, so their instructions wait for the speaker button
    if (!AUDIO_GAMES.includes(game.id)) setTimeout(() => { if ($('#screen-mini.active')) say(instructions(game)); }, staged ? 2500 : 900);
  });
  TZ.actions['kg-say'] = () => { const g = TZ.currentGame && TZ.currentGame(); say(instructions(g || { id: '' })); };
  TZ.hooks.show.push(name => { if (name !== 'mini') hush(); });

  TZ.actions['kinder-toggle'] = () => {
    save.kinder = !save.kinder;
    persist(); applyBody();
    if (save.kinder) say(t('kg_title'));
    TZ.rerender();
  };
  TZ.eduExtras.push(() => `<h3 class="sec">${t('kg_title')}</h3>
    <div class="setting"><div class="info"><small>${t('kg_desc')}</small></div>
      <button class="toggle" data-act="kinder-toggle" aria-pressed="${!!save.kinder}" aria-label="${t('kg_title')}"></button></div>`);

  // ---------- Surprise stickers ----------
  // [emoji, Hebrew name, English name, Hebrew fact, English fact]
  const STICKERS = [
    ['🐙', 'תמנון חבקן', 'Hugging Octopus', 'לתמנון יש שלושה לבבות.', 'An octopus has three hearts.'],
    ['🦒', "ג'ירפה מלקקת", 'Licking Giraffe', "הלשון של הג'ירפה כהה, בצבע כחול־סגול.", "A giraffe's tongue is dark blue-purple."],
    ['🐧', 'פינגווין שחיין', 'Swimming Penguin', 'פינגווין לא יכול לעוף, אבל הוא שוחה מצוין.', "A penguin can't fly, but it swims brilliantly."],
    ['🐌', 'חילזון נוסע', 'Travelling Snail', 'החילזון סוחב את הבית שלו על הגב.', 'A snail carries its home on its back.'],
    ['🐘', 'פיל רקדן', 'Dancing Elephant', 'פיל הוא אחת החיות היחידות שלא יכולות לקפוץ.', "An elephant is one of the few animals that can't jump."],
    ['🦉', 'ינשוף מסתובב', 'Spinning Owl', 'ינשוף יכול לסובב את הראש שלושה רבעים של סיבוב.', 'An owl can turn its head three quarters of the way round.'],
    ['🐢', 'צב סבא', 'Grandpa Turtle', 'יש צבים שחיים יותר ממאה שנה.', 'Some tortoises live for more than a hundred years.'],
    ['🐝', 'דבורה רוקדת', 'Dancing Bee', 'דבורים רוקדות כדי לספר לחברות איפה יש פרחים.', 'Bees dance to tell their friends where the flowers are.'],
    ['🐬', 'דולפין חולם', 'Dreaming Dolphin', 'דולפין ישן כשחצי מהמוח שלו נשאר ער.', 'A dolphin sleeps with half of its brain awake.'],
    ['🦈', 'כריש גמיש', 'Bendy Shark', 'לכריש אין עצמות: השלד שלו עשוי סחוס, כמו האוזן שלנו.', 'A shark has no bones: its skeleton is cartilage, like our ears.'],
    ['🐨', 'קואלה ישנונית', 'Sleepy Koala', 'קואלה ישנה כמעט כל היום, עד עשרים שעות.', 'A koala sleeps almost all day, up to twenty hours.'],
    ['🦩', 'פלמינגו ורוד', 'Pink Flamingo', 'הפלמינגו ורוד בגלל האוכל שהוא אוכל.', 'A flamingo is pink because of the food it eats.'],
    ['🐸', 'צפרדע צמאה', 'Thirsty Frog', 'צפרדע שותה מים דרך העור.', 'A frog drinks water through its skin.'],
    ['🦔', 'קיפוד מתגלגל', 'Rolling Hedgehog', 'כשקיפוד מפחד, הוא מתגלגל לכדור של קוצים.', 'When a hedgehog is scared, it rolls into a prickly ball.'],
    ['🐫', 'גמל עם תרמיל', 'Backpack Camel', 'בדבשת של הגמל יש שומן, לא מים.', "A camel's hump holds fat, not water."],
    ['🦓', 'זברה מיוחדת', 'One-of-a-kind Zebra', 'לכל זברה יש פסים אחרים, כמו טביעת אצבע.', 'Every zebra has different stripes, like a fingerprint.'],
    ['🐞', 'פרת משה רבנו שומרת', 'Guardian Ladybird', 'פרת משה רבנו אוכלת כנימות ושומרת על הצמחים.', 'A ladybird eats aphids and protects plants.'],
    ['🦜', 'תוכי חקיין', 'Copycat Parrot', 'תוכי יכול לחקות קולות ואפילו מילים.', 'A parrot can copy sounds and even words.'],
    ['🐳', 'לוויתן ענק', 'Giant Whale', 'הלוויתן הכחול הוא החיה הגדולה ביותר שחיה אי פעם.', 'The blue whale is the biggest animal that ever lived.'],
    ['🦋', 'פרפר טועם', 'Tasting Butterfly', 'פרפר טועם את האוכל עם הרגליים.', 'A butterfly tastes food with its feet.'],
    ['🐆', 'ברדלס ממהר', 'Hurrying Cheetah', 'הברדלס הוא החיה המהירה ביותר ביבשה.', 'The cheetah is the fastest animal on land.'],
    ['🦘', 'קנגורו עם כיס', 'Pocket Kangaroo', 'תינוק הקנגורו גדל בתוך הכיס של אמא.', 'A baby kangaroo grows inside its mother\'s pouch.'],
    ['🦀', 'סרטן צדדי', 'Sideways Crab', 'סרטן הולך הצידה.', 'A crab walks sideways.'],
    ['🐻‍❄️', 'דוב קוטב מחופש', 'Disguised Polar Bear', 'מתחת לפרווה הלבנה, העור של דוב הקוטב שחור.', "Under its white fur, a polar bear's skin is black."],
    ['🦥', 'עצלן ירוק', 'Green Sloth', 'העצלן זז כל כך לאט שאצות צומחות לו על הפרווה.', 'A sloth moves so slowly that algae grows on its fur.'],
    ['🐊', 'תנין סגור פה', 'Tight-lipped Crocodile', 'תנין לא יכול להוציא את הלשון החוצה.', "A crocodile can't stick its tongue out."],
    ['🦎', 'שממית מטפסת', 'Climbing Gecko', 'שממית יכולה ללכת על התקרה.', 'A gecko can walk on the ceiling.'],
    ['🐄', 'פרה לועסת', 'Chewing Cow', 'לקיבה של הפרה יש ארבעה חלקים.', "A cow's stomach has four parts."],
    ['🦇', 'עטלף מקשיב', 'Listening Bat', 'עטלף מוצא את הדרך בחושך בעזרת הד.', 'A bat finds its way in the dark using echoes.'],
    ['🐿️', 'סנאי שכחן', 'Forgetful Squirrel', 'סנאים טומנים אגוזים, ומאלה שנשכחים צומחים עצים.', 'Squirrels bury nuts, and the forgotten ones grow into trees.'],
  ];
  const nameOf = s => save.lang === 'he' ? s[1] : s[2];
  const factOf = s => save.lang === 'he' ? s[3] : s[4];
  const owned = () => save.stickers || (save.stickers = []);

  // A cheerful little tune for the reveal: a rising run, a bounce and a sparkle
  function jingle() {
    [0, 4, 7, 12].forEach((s, k) => Sound.tone(523.25 * 2 ** (s / 12), 0.18, 'square', 0.12, 0.55 + k * 0.08));
    Sound.tone(392, 0.12, 'triangle', 0.3, 0.95); Sound.tone(523.25, 0.12, 'triangle', 0.3, 1.07);
    [24, 28, 31].forEach((s, k) => Sound.tone(523.25 * 2 ** (s / 12), 0.25, 'sine', 0.15, 1.2 + k * 0.06));
  }

  TZ.hooks.finish.push((game, ch, staged, perf) => {
    if (!staged || perf.plain || !ch.stars || ch.prevStars) return '';
    const have = owned();
    const left = STICKERS.map((s, i) => i).filter(i => !have.includes(i));
    if (!left.length) return '';
    const i = left[Math.floor(Math.random() * left.length)];
    have.push(i); persist();
    const s = STICKERS[i];
    jingle();
    if (save.kinder) setTimeout(() => say(`${t('stk_say', nameOf(s))}. ${t('stk_fact')} ${factOf(s)}`), 1600);
    return `<div class="surprise"><div class="gift" aria-hidden="true">🎁</div>
      <div class="stk-card"><div class="stk-emo">${s[0]}</div><b>${t('stk_new')}: ${esc(nameOf(s))}</b>
      <p><span>${t('stk_fact')}</span> ${esc(factOf(s))}</p></div></div>`;
  });

  async function openAlbum() {
    const have = owned();
    const grid = STICKERS.map((s, i) => have.includes(i)
      ? `<button class="stk-cell" data-raw data-stk="${i}" aria-label="${esc(nameOf(s))}">${s[0]}</button>`
      : '<span class="stk-cell empty" aria-hidden="true">?</span>').join('');
    const fact = '<p class="stk-pick" id="stk-pick"></p>';
    const p = modal(`<h2>${t('stk_album')}</h2><p>${have.length === STICKERS.length ? t('stk_all') : t('stk_count', have.length, STICKERS.length)}</p>
      <div class="stk-grid">${grid}</div>${fact}${have.length ? '' : `<p class="stk-hint">${t('stk_hint')}</p>`}`, [{ id: 'ok', label: t('stk_close'), cls: 'primary' }]);
    await sleep(50);
    document.querySelectorAll('.stk-cell[data-stk]').forEach(b => b.addEventListener('pointerdown', e => {
      e.preventDefault();
      const s = STICKERS[Number(b.dataset.stk)];
      $('#stk-pick').innerHTML = `<b>${s[0]} ${esc(nameOf(s))}</b><br>${esc(factOf(s))}`;
      Sound.tone(660, 0.08, 'triangle', 0.3);
      say(`${nameOf(s)}. ${factOf(s)}`);
    }));
    await p;
    hush();
  }
  TZ.actions.album = () => openAlbum();
  TZ.hubCards.push(() => `<div class="assess-card stk-hub"><div class="as-icon">🎁</div><div class="info"><b>${t('stk_album')}</b>
    <small>${t('stk_count', owned().length, STICKERS.length)}</small></div>
    <div class="as-btns"><button class="btn small primary" data-act="album">${t('stk_open')}</button></div></div>`);
})();
