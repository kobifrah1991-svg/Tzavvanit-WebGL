'use strict';
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const rand = n => Math.floor(Math.random() * n);

  // ---------- Players (several children can share one device) ----------
  const PROFILES_KEY = 'tzavvanit_profiles';
  let profiles = { list: [{ id: 'p1', name: '', age: 0, color: 0 }], current: 'p1' };
  try {
    const p = JSON.parse(localStorage.getItem(PROFILES_KEY) || 'null');
    if (p && Array.isArray(p.list) && p.list.length) profiles = p;
  } catch (e) { /* storage unavailable */ }
  const saveProfiles = () => { try { localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles)); } catch (e) { /* ignore */ } };
  // The first player keeps the original key, so saves from before profiles still load
  const keyFor = id => id === 'p1' ? 'tzavvanit_save_v1' : `tzavvanit_save_v1:${id}`;
  const me = () => profiles.list.find(p => p.id === profiles.current) || profiles.list[0];

  // ---------- Save ----------
  const SAVE_KEY = keyFor(me().id);
  const defaults = () => ({
    stars: {}, best: 0, hat: 'none', skin: 'peach', lang: 'he', sound: true, vibe: true, assist: false, shapes: false, seenIntro: {},
    coins: 0, xp: 0, owned: { hats: ['none'], skins: ['peach'] }, bests: {}, played: 0,
    daily: null, streak: { last: '', count: 0 }, migrated: true, workout: null,
    adapt: {}, history: [], playSecs: {}, breakMin: 20, assessments: [],
  });
  const save = defaults();
  let loaded = {};
  try { loaded = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'); } catch (e) { /* storage unavailable */ }
  Object.assign(save, loaded);
  const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } };
  // Saves from before the shop existed: stars become drops, and hats unlocked by stars stay owned
  if (!loaded.migrated && Object.keys(loaded).length) {
    const stars = Object.values(save.stars).reduce((a, b) => a + b, 0);
    save.coins = stars * 10;
    save.owned = { hats: ['none'].concat([[3, 'bow'], [8, 'cap'], [14, 'flower'], [22, 'headphones'], [32, 'party'], [45, 'crown']].filter(([n]) => stars >= n).map(([, id]) => id)), skins: ['peach'] };
    if (!save.owned.hats.includes(save.hat)) save.hat = 'none';
    save.migrated = true;
    persist();
  }

  // ---------- Text ----------
  const STR = {
    he: {
      logo: 'צבעונית', subtitle: 'מסע הצבעים', play: 'שחקו', endless: 'אתגר אינסופי', wardrobe: 'ארון', settings: 'הגדרות',
      chooseLevel: 'בחרו שלב', level: 'שלב', boss: 'שלב בוס', round: 'סיבוב',
      listen: 'מקשיבים...', listenEar: 'מקשיבים בחושך...',
      turn_order: 'תורכם! באותו סדר', turn_rhythm: 'תורכם! באותו קצב', turn_reverse: 'תורכם! מהסוף להתחלה', turn_ear: 'תורכם! מה שמעתם?',
      mode_order: 'לפי הסדר', mode_rhythm: 'בקצב', mode_reverse: 'הפוך', mode_ear: 'בחושך', mode_mix: 'הפתעה',
      intro_order: 'צבעונית מנגנת רצף של צבעים. הקשיבו והסתכלו, ואז הקישו על אותם צבעים באותו סדר.',
      intro_rhythm: 'ביער הזה גם הקצב חשוב! הקישו באותו סדר ובאותו קצב – לא מהר מדי ולא לאט מדי.',
      intro_reverse: 'במדבר המראות הכול הפוך: הקישו על הרצף מהסוף להתחלה!',
      intro_ear: 'במערה חשוך והכפתורים לא נדלקים. זהו כל צבע לפי הצליל שלו בלבד! קודם נכיר את הצלילים.',
      intro_mix: 'בטירה כל סיבוב מפתיע: סדר, קצב, הפוך או חושך. שימו לב לשלט למעלה!',
      meet: 'הכירו את הצלילים', go: 'יאללה!',
      oops: 'אופס! ננסה שוב ביחד', offBeat: 'הקצב ברח! ננסה שוב', perfect: 'מושלם!', good: 'יפה!',
      praise: ['מעולה!', 'כל הכבוד!', 'וואו!', 'איזה זיכרון!', 'בול!'],
      levelDone: 'השלב הושלם!', next: 'לשלב הבא', retry: 'שוב', map: 'למפה', home: 'לתפריט',
      failTitle: 'כמעט!', failText: 'כל ניסיון מאמן את האוזן. עוד פעם?',
      score: 'ניקוד', best: 'שיא', newBest: 'שיא חדש!',
      endlessDesc: 'כמה צלילים תצליחו לזכור?', endlessOver: 'הרצף נגמר!', endlessLen: n => `זכרתם רצף של ${n} צלילים`, length: n => `אורך: ${n}`,
      worldDone: 'העולם נצבע מחדש!',
      hats: { none: 'בלי', bow: 'פפיון', cap: 'כובע', flower: 'פרח', headphones: 'אוזניות', party: 'מסיבה', crown: 'כתר' },
      newHat: 'פריט חדש בארון!',
      lockedLevel: 'השלב נעול – סיימו קודם את השלב הקודם', lockedHat: n => `עוד ${n} כוכבים כדי לפתוח`,
      waitListen: 'רגע... קודם מקשיבים', waitBusy: 'רגע...',
      s_sound: 'צלילים', s_sound_d: 'מוזיקה ואפקטים',
      s_vibe: 'רטט', s_vibe_d: 'רטט קצר בכל הקשה',
      s_assist: 'מצב עזרה', s_assist_d: 'קצב איטי יותר וזמן רחב יותר להקשה',
      s_shapes: 'צורות על הכפתורים', s_shapes_d: 'עוזר להבחין בין הצבעים',
      s_lang: 'שפה', s_reset: 'איפוס התקדמות', s_reset_d: 'מוחק כוכבים ושיאים',
      resetQ: 'למחוק את כל ההתקדמות?', yes: 'כן, למחוק', no: 'ביטול',
      about: 'צבעונית · Scitedra Games · בלי פרסומות ובלי איסוף מידע',
    },
    en: {
      logo: 'Tzavvanit', subtitle: 'Journey of Colors', play: 'Play', endless: 'Endless Challenge', wardrobe: 'Wardrobe', settings: 'Settings',
      chooseLevel: 'Choose a level', level: 'Level', boss: 'Boss level', round: 'Round',
      listen: 'Listen...', listenEar: 'Listen in the dark...',
      turn_order: 'Your turn! Same order', turn_rhythm: 'Your turn! Same rhythm', turn_reverse: 'Your turn! Backwards', turn_ear: 'Your turn! What did you hear?',
      mode_order: 'In order', mode_rhythm: 'Rhythm', mode_reverse: 'Reverse', mode_ear: 'In the dark', mode_mix: 'Surprise',
      intro_order: 'Tzavvanit plays a sequence of colors. Listen and watch, then tap the same colors in the same order.',
      intro_rhythm: 'In this forest the rhythm matters too! Tap in the same order and the same rhythm – not too fast, not too slow.',
      intro_reverse: 'In the Mirror Desert everything is backwards: tap the sequence from the end to the start!',
      intro_ear: 'The cave is dark and the buttons don\'t light up. Recognize each color by its sound alone! First, let\'s meet the sounds.',
      intro_mix: 'In the castle every round is a surprise: order, rhythm, reverse or dark. Watch the sign at the top!',
      meet: 'Meet the sounds', go: 'Let\'s go!',
      oops: 'Oops! Let\'s try again together', offBeat: 'The beat ran away! Try again', perfect: 'Perfect!', good: 'Nice!',
      praise: ['Great!', 'Well done!', 'Wow!', 'What a memory!', 'Spot on!'],
      levelDone: 'Level complete!', next: 'Next level', retry: 'Again', map: 'Map', home: 'Menu',
      failTitle: 'So close!', failText: 'Every try trains your ear. One more time?',
      score: 'Score', best: 'Best', newBest: 'New record!',
      endlessDesc: 'How many sounds can you remember?', endlessOver: 'Sequence over!', endlessLen: n => `You remembered ${n} sounds`, length: n => `Length: ${n}`,
      worldDone: 'The world has its colors back!',
      hats: { none: 'None', bow: 'Bow', cap: 'Cap', flower: 'Flower', headphones: 'Headphones', party: 'Party', crown: 'Crown' },
      newHat: 'New item in the wardrobe!',
      lockedLevel: 'Locked – finish the previous level first', lockedHat: n => `${n} more stars to unlock`,
      waitListen: 'Wait... listen first', waitBusy: 'Wait...',
      s_sound: 'Sound', s_sound_d: 'Music and effects',
      s_vibe: 'Vibration', s_vibe_d: 'Short buzz on every tap',
      s_assist: 'Helper mode', s_assist_d: 'Slower tempo and more time to tap',
      s_shapes: 'Shapes on buttons', s_shapes_d: 'Helps tell the colors apart',
      s_lang: 'Language', s_reset: 'Reset progress', s_reset_d: 'Deletes stars and records',
      resetQ: 'Delete all progress?', yes: 'Yes, delete', no: 'Cancel',
      about: 'Tzavvanit · Scitedra Games · No ads, no data collection',
    },
  };
  Object.assign(STR.he, {
    lvl: 'רמה', drops: 'טיפות', games: 'משחקים', shop: 'חנות', missions: 'משימות היום', claim: 'קבלו', claimed: 'נאסף',
    allMissions: 'כל המשימות הושלמו! בונוס', streakDays: n => `${n} ימים ברצף`,
    dailyTitle: 'פרס יומי!', dailyText: n => `חזרתם ${n} ${n === 1 ? 'יום' : 'ימים'} ברצף. מחר הפרס גדל!`,
    unlockAt: n => `נפתח ברמה ${n}`, levelUp: n => `עליתם לרמה ${n}!`, newGame: 'משחק חדש נפתח!',
    earned: 'הרווחתם', again: 'שוב', time: 'זמן',
    tabHats: 'כובעים', tabSkins: 'צבעים', buy: 'לקנות', equip: 'ללבוש', equipped: 'בשימוש',
    noMoney: n => `חסרות ${n} טיפות`, bought: 'נקנה!',
    skins: { peach: 'אפרסק', mint: 'מנטה', sky: 'שמיים', lemon: 'לימון', lilac: 'לילך', night: 'לילה' },
    m_play: n => `שחקו ${n} משחקים`, m_coins: n => `אספו ${n} טיפות`, m_score: n => `השיגו ${n} נקודות במשחק אחד`,
    m_simon: n => `השלימו ${n} שלבים במסע הצלילים`, m_game: name => `שחקו ב${name}`,
    g_simon: 'מסע הצלילים', g_simon_d: 'זיכרון וקצב',
    brainMap: 'מפת המוח שלי', brainHint: 'כל משחק מאמן מיומנות אחרת. שחקו בכולם כדי לחזק את כל המוח!',
    sk_memory: 'זיכרון עבודה', sk_inhibit: 'ריכוז ושליטה עצמית', sk_attention: 'קשב מתמשך', sk_reason: 'חשיבה ולמידה', sk_visual: 'זיכרון חזותי',
    wk_title: 'אימון המוח היומי', wk_desc: 'שלושה תרגילים קצרים, כל אחד מאמן מיומנות אחרת',
    wk_start: 'התחילו אימון', wk_continue: 'המשיכו', wk_next: (n, of) => `לתרגיל הבא (${n}/${of})`,
    wk_done: 'האימון היומי הושלם!', wk_doneShort: 'הושלם היום',
    diffLabel: n => `רמת קושי ${n}`, diffUp: n => `מעולה! עולים לרמת קושי ${n}`, diffDown: 'בפעם הבאה ננסה ברמה קצת יותר נוחה',
    diffSame: n => `נשארים ברמת קושי ${n}`,
    parents: 'אזור הורים', parents_d: 'התקדמות, זמן משחק והפסקות',
    pgTitle: 'רק להורים', pgQ: (a, b) => `כמה זה ${a} × ${b}?`, pgWrong: 'לא נכון, נסו שוב',
    week: 'השבוע האחרון', daysActive: 'ימים פעילים', minutes: 'דקות משחק', sessions: 'משחקים',
    dayNames: ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'],
    skillsTitle: 'מיומנויות', diffNow: 'רמת קושי נוכחית', accuracy: 'דיוק', noData: 'עוד לא שיחקו',
    trendUp: 'משתפר', trendFlat: 'יציב', trendDown: 'קצת ירידה',
    breakTitle: 'תזכורת להפסקה', breakDesc: 'הצעה עדינה לנוח אחרי זמן משחק רצוף', off: 'כבוי', minShort: n => `${n} ד׳`,
    breakNow: 'זמן להפסקה קטנה!', breakText: 'המוח לומד הכי טוב עם הפסקות. אפשר לקום, לשתות מים ולחזור אחר כך.',
    breakOk: 'אני אנוח', breakMore: 'עוד קצת',
    parentNote: 'המשחקים מבוססים על תרגילים מוכרים לאימון זיכרון עבודה, קשב וריכוז, והקושי מתאים את עצמו לילד. אימון כזה משפר בעיקר את הביצועים במשחקים עצמם; הוא לא מחליף אבחון, טיפול או עזרה לימודית.',
  });
  Object.assign(STR.en, {
    lvl: 'Level', drops: 'drops', games: 'Games', shop: 'Shop', missions: 'Today\'s missions', claim: 'Claim', claimed: 'Done',
    allMissions: 'All missions done! Bonus', streakDays: n => `${n} day streak`,
    dailyTitle: 'Daily reward!', dailyText: n => `You came back ${n} ${n === 1 ? 'day' : 'days'} in a row. Tomorrow's reward is bigger!`,
    unlockAt: n => `Unlocks at level ${n}`, levelUp: n => `You reached level ${n}!`, newGame: 'New game unlocked!',
    earned: 'You earned', again: 'Again', time: 'Time',
    tabHats: 'Hats', tabSkins: 'Colors', buy: 'Buy', equip: 'Wear', equipped: 'Wearing',
    noMoney: n => `${n} more drops needed`, bought: 'Bought!',
    skins: { peach: 'Peach', mint: 'Mint', sky: 'Sky', lemon: 'Lemon', lilac: 'Lilac', night: 'Night' },
    m_play: n => `Play ${n} games`, m_coins: n => `Collect ${n} drops`, m_score: n => `Score ${n} points in one game`,
    m_simon: n => `Finish ${n} levels in the Sound Journey`, m_game: name => `Play ${name}`,
    g_simon: 'Sound Journey', g_simon_d: 'Memory and rhythm',
    brainMap: 'My brain map', brainHint: 'Each game trains a different skill. Play them all to train your whole brain!',
    sk_memory: 'Working memory', sk_inhibit: 'Focus and self-control', sk_attention: 'Sustained attention', sk_reason: 'Thinking and learning', sk_visual: 'Visual memory',
    wk_title: 'Daily brain workout', wk_desc: 'Three short exercises, each training a different skill',
    wk_start: 'Start workout', wk_continue: 'Continue', wk_next: (n, of) => `Next exercise (${n}/${of})`,
    wk_done: 'Daily workout complete!', wk_doneShort: 'Done today',
    diffLabel: n => `Difficulty ${n}`, diffUp: n => `Great! Moving up to difficulty ${n}`, diffDown: 'Next time we\'ll try a slightly easier level',
    diffSame: n => `Staying at difficulty ${n}`,
    parents: 'Parents area', parents_d: 'Progress, play time and breaks',
    pgTitle: 'Parents only', pgQ: (a, b) => `What is ${a} × ${b}?`, pgWrong: 'Not quite, try again',
    week: 'Last 7 days', daysActive: 'Active days', minutes: 'Minutes played', sessions: 'Games',
    dayNames: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    skillsTitle: 'Skills', diffNow: 'Current difficulty', accuracy: 'Accuracy', noData: 'Not played yet',
    trendUp: 'Improving', trendFlat: 'Steady', trendDown: 'Slight dip',
    breakTitle: 'Break reminder', breakDesc: 'A gentle nudge to rest after continuous play', off: 'Off', minShort: n => `${n} min`,
    breakNow: 'Time for a short break!', breakText: 'The brain learns best with breaks. Stand up, drink some water and come back later.',
    breakOk: 'I\'ll rest', breakMore: 'A bit more',
    parentNote: 'The games are based on well-known exercises for working memory, attention and focus, and the difficulty adapts to the child. This kind of training mainly improves performance in the games themselves; it does not replace assessment, treatment or learning support.',
  });
  Object.assign(STR.he, {
    players: 'מי משחק?', player: n => `שחקן ${n}`, addPlayer: 'הוספת שחקן', playerName: 'שם', age: 'גיל', ageN: n => `גיל ${n}`,
    create: 'יצירה', switchTo: 'לשחק', current: 'משחק עכשיו', delPlayer: 'מחיקה', delQ: n => `למחוק את ${n} וכל ההתקדמות שלו?`,
    nameNeeded: 'כתבו שם', maxPlayers: 'אפשר עד 40 שחקנים במכשיר',
    edu: 'דוחות ומבדקים', eduAll: 'כל השחקנים במכשיר', lastActive: 'פעילות אחרונה', lastTest: 'מבדק אחרון', never: '—',
    exportCsv: 'ייצוא נתונים (CSV)', exported: 'הקובץ נשמר', openReport: 'דוח המבדק האחרון', noReport: 'עוד לא בוצע מבדק',
  });
  Object.assign(STR.en, {
    players: 'Who\'s playing?', player: n => `Player ${n}`, addPlayer: 'Add player', playerName: 'Name', age: 'Age', ageN: n => `Age ${n}`,
    create: 'Create', switchTo: 'Play', current: 'Playing now', delPlayer: 'Delete', delQ: n => `Delete ${n} and all their progress?`,
    nameNeeded: 'Enter a name', maxPlayers: 'Up to 40 players per device',
    edu: 'Reports and assessments', eduAll: 'All players on this device', lastActive: 'Last active', lastTest: 'Last assessment', never: '—',
    exportCsv: 'Export data (CSV)', exported: 'File saved', openReport: 'Latest assessment report', noReport: 'No assessment yet',
  });
  const t = (k, ...a) => { const v = STR[save.lang][k]; return typeof v === 'function' ? v(...a) : v; };
  const playerName = p => p.name || t('player', profiles.list.indexOf(p) + 1);
  const AVATAR_COLORS = ['#ff6f59', '#2ec4b6', '#3a86ff', '#ffb627', '#9b6dff', '#22b04b', '#ff8a3d', '#e85d8a'];

  // ---------- Data ----------
  const WORLDS = [
    { mode: 'order', scene: 'beach', color: '#2ec4b6', name: { he: 'חוף הצבעים', en: 'Color Beach' } },
    { mode: 'rhythm', scene: 'forest', color: '#22a06b', name: { he: 'יער הקצב', en: 'Rhythm Forest' } },
    { mode: 'reverse', scene: 'desert', color: '#ff8a3d', name: { he: 'מדבר המראות', en: 'Mirror Desert' } },
    { mode: 'ear', scene: 'cave', color: '#5b5fd6', name: { he: 'מערת ההדים', en: 'Echo Cave' } },
    { mode: 'mix', scene: 'castle', color: '#ff6f59', name: { he: 'טירת האפור', en: 'Gray Castle' } },
  ];
  const LEVELS = 6;
  const HATS = [
    { id: 'none', price: 0 }, { id: 'bow', price: 40 }, { id: 'cap', price: 80 }, { id: 'flower', price: 120 },
    { id: 'headphones', price: 200 }, { id: 'party', price: 300 }, { id: 'crown', price: 500 },
  ];
  // Body gradient: light, mid, dark
  const SKINS = [
    { id: 'peach', price: 0, c: ['#ffdccf', '#ffab94', '#ff8366'] },
    { id: 'mint', price: 100, c: ['#d8fff1', '#7fe6c6', '#2ec4b6'] },
    { id: 'sky', price: 150, c: ['#e0efff', '#8cc0ff', '#3a86ff'] },
    { id: 'lemon', price: 150, c: ['#fff6c8', '#ffd86b', '#ffb627'] },
    { id: 'lilac', price: 250, c: ['#f1e6ff', '#c9a8ff', '#9b6dff'] },
    { id: 'night', price: 400, c: ['#6b7fb0', '#3b4c7e', '#1d2a4f'] },
  ];
  const PAD_FREQ = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  const MAX_TRIES = 3;

  const key = (w, l) => `${w}-${l}`;
  const starsOf = (w, l) => save.stars[key(w, l)] || 0;
  const totalStars = () => Object.values(save.stars).reduce((a, b) => a + b, 0);
  const worldStars = w => Array.from({ length: LEVELS }, (_, l) => starsOf(w, l)).reduce((a, b) => a + b, 0);
  const unlocked = (w, l) => {
    if (w === 0 && l === 0) return true;
    return l > 0 ? starsOf(w, l - 1) > 0 : starsOf(w - 1, LEVELS - 1) > 0;
  };

  // ---------- Icons ----------
  const STAR = on => `<svg viewBox="0 0 24 24" class="star${on ? ' on' : ''}"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z"/></svg>`;
  const HEART = `<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.3C1 8.4 3.2 5 6.6 5c2 0 3.4 1.1 4.2 2.4h.4C12 6.1 13.4 5 15.4 5 18.8 5 21 8.4 19.6 11.7 17.5 16.4 12 21 12 21z"/></svg>`;
  const LOCK = `<svg viewBox="0 0 24 24" class="lock"><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>`;
  const CROWN = `<svg viewBox="0 0 24 24" class="crown"><path d="M3 18V7l5 4 4-7 4 7 5-4v11z" fill="currentColor"/></svg>`;
  const PLAY = `<svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg>`;
  const INF = `<svg viewBox="0 0 24 24"><path d="M7 8a4 4 0 1 0 0 8c3 0 7-8 10-8a4 4 0 1 1 0 8c-3 0-7-8-10-8z" fill="none" stroke="currentColor" stroke-width="2.6"/></svg>`;
  const GEAR = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`;
  const SHIRT = `<svg viewBox="0 0 24 24"><path d="M8 3l-5 3 2 5 2-1v11h10V10l2 1 2-5-5-3a4 4 0 0 1-8 0z" fill="currentColor"/></svg>`;
  const BACK = `<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const DROP = `<svg viewBox="0 0 24 24" class="drop"><path d="M12 2C9 7 5 10.5 5 15a7 7 0 0 0 14 0c0-4.5-4-8-7-13z"/><path d="M9 15.5a3 3 0 0 0 2.5 3" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".8"/></svg>`;
  const FLAME = `<svg viewBox="0 0 24 24" class="flame"><path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-4-1-6 1-9z"/></svg>`;
  const BAG = `<svg viewBox="0 0 24 24"><path d="M6 8h12l-1 13H7z" fill="currentColor"/><path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>`;
  const CHECK = `<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  // ---------- Progress: drops, XP, levels, missions ----------
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const xpToNext = lvl => 80 + lvl * 40;
  function levelInfo() {
    let lvl = 1, rest = save.xp;
    while (rest >= xpToNext(lvl)) { rest -= xpToNext(lvl); lvl++; }
    return { lvl, into: rest, need: xpToNext(lvl) };
  }
  const playerLevel = () => levelInfo().lvl;

  // Registered games (the Sound Journey here, the rest from minigames.js)
  const GAMES = [];
  const gameName = g => g.name ? g.name[save.lang] : t('g_' + g.id);

  const MISSION_POOL = [
    { kind: 'play', goal: 3, reward: 30 },
    { kind: 'coins', goal: 60, reward: 30 },
    { kind: 'score', goal: 300, reward: 35 },
    { kind: 'simon', goal: 2, reward: 35 },
    { kind: 'game', goal: 1, reward: 25 },
    { kind: 'game', goal: 1, reward: 25 },
  ];
  function ensureDaily() {
    if (save.daily && save.daily.date === today()) return;
    const open = GAMES.filter(g => g.minLevel <= playerLevel());
    const pool = MISSION_POOL.slice();
    const picked = [];
    while (picked.length < 3 && pool.length) {
      const m = Object.assign({}, pool.splice(rand(pool.length), 1)[0], { progress: 0, claimed: false });
      if (m.kind === 'game') {
        const choices = open.filter(g => !picked.some(p => p.game === g.id));
        if (!choices.length) continue;
        m.game = choices[rand(choices.length)].id;
      }
      if (picked.some(p => p.kind === m.kind && m.kind !== 'game')) continue;
      picked.push(m);
    }
    save.daily = { date: today(), missions: picked, bonus: false };
    persist();
  }
  const missionText = m => m.kind === 'game' ? t('m_game', gameName(GAMES.find(g => g.id === m.game) || { id: 'simon' })) : t('m_' + m.kind, m.goal);

  // Records an event; returns missions that just got completed
  function track(kind, value = 1, game = null) {
    ensureDaily();
    const done = [];
    for (const m of save.daily.missions) {
      if (m.progress >= m.goal) continue;
      if (m.kind === kind && kind === 'score') m.progress = value >= m.goal ? m.goal : m.progress;
      else if (m.kind === kind && kind === 'game') { if (m.game === game) m.progress = 1; }
      else if (m.kind === kind) m.progress = Math.min(m.goal, m.progress + value);
      if (m.progress >= m.goal) done.push(m);
    }
    persist();
    return done;
  }

  // Pays out a finished game; returns what happened for the results screen
  function grant(game, score, coins, xp) {
    const before = playerLevel();
    const unlockedBefore = GAMES.filter(g => g.minLevel <= before).length;
    save.coins += coins;
    save.xp += xp;
    save.played++;
    const isBest = score > (save.bests[game] || 0);
    if (isBest) save.bests[game] = score;
    const done = [...track('play'), ...track('coins', coins), ...track('score', score), ...track('game', 1, game)];
    const after = playerLevel();
    persist();
    return { coins, xp, isBest, levelUp: after > before ? after : 0, newGame: GAMES.filter(g => g.minLevel <= after).length > unlockedBefore, missions: done };
  }
  const rewardHtml = r => `<div class="reward-row"><span class="pill">${DROP}+${r.coins}</span><span class="pill pill-xp">+${r.xp} XP</span></div>
    ${r.levelUp ? `<div class="badge">${t('levelUp', r.levelUp)}</div>` : ''}
    ${r.newGame ? `<div class="badge">${t('newGame')}</div>` : ''}
    ${r.missions.map(m => `<div class="badge mission-badge">${CHECK}${missionText(m)}</div>`).join('')}`;

  // ---------- Daily workout: three quick games with different skills ----------
  const WORKOUT_BONUS = 40;
  function ensureWorkout() {
    if (save.workout && save.workout.date === today()) return save.workout;
    const open = GAMES.filter(g => g.id !== 'simon' && g.minLevel <= playerLevel()).sort(() => Math.random() - 0.5);
    const picked = [];
    for (const g of open) if (picked.length < 3 && !picked.some(p => p.skill === g.skill)) picked.push(g);
    save.workout = { date: today(), games: picked.map(g => g.id), done: [], claimed: false };
    persist();
    return save.workout;
  }
  const workoutNext = () => { const w = ensureWorkout(); return w.games.find(id => !w.done.includes(id)); };

  // ---------- Adaptive difficulty and session history ----------
  const MAX_DIFF = 10;
  const difficulty = id => save.adapt[id] || 1;
  // Logs a finished session and nudges the game's difficulty: step +1 (too easy), 0, or -1 (too hard)
  function recordSession(id, score, acc, step = 0) {
    const before = difficulty(id);
    const after = Math.max(1, Math.min(MAX_DIFF, before + step));
    save.adapt[id] = after;
    save.history.push({ d: today(), g: id, s: score, a: Math.round(Math.max(0, Math.min(1, acc)) * 100), lv: before });
    if (save.history.length > 400) save.history.splice(0, save.history.length - 400);
    persist();
    return { before, after };
  }
  const diffHtml = ch => ch.after > ch.before ? `<div class="badge diff-up">${t('diffUp', ch.after)}</div>`
    : ch.after < ch.before ? `<p class="diff-note">${t('diffDown')}</p>` : `<p class="diff-note">${t('diffSame', ch.after)}</p>`;

  function updateCoinsDisplay() {
    document.querySelectorAll('[data-coins]').forEach(el => { el.textContent = save.coins; });
  }
  const SHAPES = [
    '<circle cx="12" cy="12" r="9"/>',
    '<path d="M12 3l10 18H2z"/>',
    '<rect x="3" y="3" width="18" height="18" rx="2"/>',
    '<path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z"/>',
  ];

  // ---------- Character ----------
  let uid = 0;
  const charSVG = (skin = save.skin) => {
    const id = `cb${++uid}`;
    const c = (SKINS.find(s => s.id === skin) || SKINS[0]).c;
    return `<svg class="char" viewBox="0 0 200 200" aria-hidden="true">
      <defs><radialGradient id="${id}" cx="40%" cy="32%" r="75%"><stop offset="0" stop-color="${c[0]}"/><stop offset=".6" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></radialGradient></defs>
      <ellipse class="c-shadow" cx="100" cy="188" rx="60" ry="9"/>
      <g class="c-body">
        <ellipse cx="100" cy="128" rx="74" ry="60" fill="url(#${id})"/>
        <ellipse cx="50" cy="148" rx="13" ry="8" fill="#ff5f45" opacity=".4"/>
        <ellipse cx="150" cy="148" rx="13" ry="8" fill="#ff5f45" opacity=".4"/>
        <g class="c-eyes">
          <circle cx="76" cy="118" r="21" fill="#fff"/><circle cx="124" cy="118" r="21" fill="#fff"/>
          <g class="c-pupils"><circle cx="76" cy="120" r="10" fill="#123b4a"/><circle cx="124" cy="120" r="10" fill="#123b4a"/><circle cx="80" cy="115" r="3.5" fill="#fff"/><circle cx="128" cy="115" r="3.5" fill="#fff"/></g>
        </g>
        <path class="c-mouth smile" d="M89 150 Q100 162 111 150" fill="none" stroke="#8a3324" stroke-width="4.5" stroke-linecap="round"/>
        <ellipse class="c-mouth sing" cx="100" cy="155" rx="7" ry="9" fill="#8a3324"/>
        <path class="c-mouth frown" d="M89 158 Q100 148 111 158" fill="none" stroke="#8a3324" stroke-width="4.5" stroke-linecap="round"/>
        <g class="hat hat-bow"><path d="M100 72L76 56v32z" fill="#3a86ff"/><path d="M100 72l24-16v32z" fill="#3a86ff"/><circle cx="100" cy="72" r="8" fill="#2266d6"/></g>
        <g class="hat hat-cap"><path d="M56 86a44 36 0 0 1 88 0z" fill="#2ec4b6"/><rect x="96" y="80" width="66" height="11" rx="5.5" fill="#1e9a8f"/><circle cx="100" cy="51" r="6" fill="#ffb627"/></g>
        <g class="hat hat-flower"><g fill="#ffb627"><circle cx="140" cy="62" r="10"/><circle cx="154" cy="74" r="10"/><circle cx="148" cy="90" r="10"/><circle cx="131" cy="90" r="10"/><circle cx="126" cy="74" r="10"/></g><circle cx="140" cy="77" r="8" fill="#ff6f59"/></g>
        <g class="hat hat-headphones"><path d="M32 124Q32 44 100 44T168 124" fill="none" stroke="#123b4a" stroke-width="10" stroke-linecap="round"/><rect x="18" y="106" width="24" height="40" rx="11" fill="#ff8a3d"/><rect x="158" y="106" width="24" height="40" rx="11" fill="#ff8a3d"/></g>
        <g class="hat hat-party"><path d="M100 14L78 78h44z" fill="#3a86ff"/><path d="M90 46l18-6M84 64l30-8" stroke="#ffb627" stroke-width="6" stroke-linecap="round"/><circle cx="100" cy="14" r="9" fill="#ff6f59"/></g>
        <g class="hat hat-crown"><path d="M66 82V48l17 15 17-23 17 23 17-15v34z" fill="#ffb627" stroke="#d9921a" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="66" r="5" fill="#ff6f59"/><circle cx="80" cy="72" r="4" fill="#3a86ff"/><circle cx="120" cy="72" r="4" fill="#2ec4b6"/></g>
      </g></svg>`;
  };
  const charWrap = (cls = '', hat = save.hat, skin = save.skin) => `<div class="char-wrap ${cls}" data-hat="${hat}">${charSVG(skin)}</div>`;

  // ---------- Scenes ----------
  const SCENES = {
    beach: `<rect width="400" height="300" fill="#bdf0ff"/><circle cx="320" cy="70" r="30" fill="#ffb627"/>
      <g fill="#fff" opacity=".9"><ellipse cx="80" cy="70" rx="34" ry="13"/><ellipse cx="106" cy="62" rx="22" ry="12"/><ellipse cx="230" cy="105" rx="28" ry="10"/></g>
      <path d="M0 200Q100 186 200 200T400 196V300H0z" fill="#2ec4b6"/><path d="M0 214Q100 204 200 216T400 210" fill="none" stroke="#e6fbf8" stroke-width="4" opacity=".7"/>
      <path d="M0 240Q120 222 240 242T400 236V300H0z" fill="#ffe3a8"/>
      <g transform="translate(52 0)"><rect x="44" y="150" width="9" height="95" rx="4" fill="#c98a4b" transform="rotate(-8 48 245)"/><g fill="#22a06b"><path d="M40 150q-40-6-52 14 30-10 52-14z"/><path d="M40 150q40-10 56 8-30-8-56-8z"/><path d="M40 150q-14-34 8-48-2 26-8 48z"/><path d="M40 150q30-26 52-16-26 4-52 16z"/></g></g>
      <g><circle cx="320" cy="262" r="7" fill="#ff6f59"/><circle cx="350" cy="270" r="5" fill="#3a86ff"/><path d="M290 268l6-10 6 10z" fill="#ff8a3d"/></g>`,
    forest: `<rect width="400" height="300" fill="#d4f5e2"/><circle cx="70" cy="60" r="26" fill="#fff3a6"/>
      <g fill="#7fd6a4"><path d="M20 230L60 110l40 120z"/><path d="M300 230l45-140 45 140z"/><path d="M200 230l30-100 30 100z"/></g>
      <g fill="#2fa86b"><path d="M-10 260L40 120l50 140z"/><path d="M320 260l50-150 50 150z"/><path d="M90 260l30-90 30 90z"/></g>
      <rect y="250" width="400" height="50" fill="#7dd87d"/><g fill="#ff6b6b"><circle cx="150" cy="262" r="5"/><circle cx="260" cy="270" r="5"/></g>`,
    desert: `<rect width="400" height="300" fill="#ffeec2"/><circle cx="300" cy="80" r="36" fill="#ff9f43"/>
      <path d="M0 220Q100 170 200 215T400 200V300H0z" fill="#f8c977"/><path d="M0 255Q120 220 240 255T400 245V300H0z" fill="#f0b35a"/>
      <g fill="#4caf50"><rect x="58" y="160" width="16" height="70" rx="8"/><rect x="40" y="180" width="12" height="30" rx="6"/><rect x="80" y="172" width="12" height="26" rx="6"/><rect x="340" y="170" width="14" height="60" rx="7"/><rect x="356" y="186" width="10" height="22" rx="5"/></g>`,
    cave: `<rect width="400" height="300" fill="#2e2350"/><path d="M0 0h400v40l-20 30-20-30-30 50-25-50-30 36-25-36-40 46-30-46-30 30-30-30-35 44-30-44-25 26-30-26z" fill="#1f1738"/>
      <g fill="#b388ff" opacity=".9"><path d="M30 300l14-70 14 70z"/><path d="M360 300l16-90 16 90z"/><path d="M60 300l10-40 10 40z"/></g>
      <g fill="#64d8ff" opacity=".8"><path d="M330 300l12-50 12 50z"/><path d="M8 300l8-36 8 36z"/></g>
      <ellipse cx="200" cy="300" rx="230" ry="50" fill="#3d2f66"/>
      <g fill="#fff" opacity=".6"><circle cx="120" cy="90" r="2"/><circle cx="280" cy="120" r="2"/><circle cx="220" cy="70" r="1.5"/></g>`,
    castle: `<rect width="400" height="300" fill="#ffe0ea"/>
      <g fill="none" stroke-width="12" opacity=".7"><path d="M20 260a180 180 0 0 1 360 0" stroke="#ff6b6b"/><path d="M32 260a168 168 0 0 1 336 0" stroke="#ffc93c"/><path d="M44 260a156 156 0 0 1 312 0" stroke="#3ddc97"/><path d="M56 260a144 144 0 0 1 288 0" stroke="#4d9de0"/></g>
      <g fill="#b5a8e0"><rect x="74" y="150" width="44" height="110"/><rect x="282" y="150" width="44" height="110"/><path d="M68 152l28-38 28 38z" fill="#e85d8a"/><path d="M276 152l28-38 28 38z" fill="#e85d8a"/><rect x="88" y="176" width="16" height="22" rx="8" fill="#8e7fc9"/><rect x="296" y="176" width="16" height="22" rx="8" fill="#8e7fc9"/></g>
      <rect y="250" width="400" height="50" fill="#f7a8c4"/>`,
  };
  const sceneSVG = name => `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice">${SCENES[name]}</svg>`;

  // ---------- Sound ----------
  const Sound = {
    ctx: null, master: null,
    init() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    },
    tone(freq, dur = 0.35, type = 'triangle', vol = 0.6, when = 0, dest = this.master) {
      if (!save.sound || !this.ctx) return;
      const t0 = this.ctx.currentTime + when;
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(dest);
      o.start(t0); o.stop(t0 + dur + 0.05);
    },
    pad(i) { this.tone(PAD_FREQ[i], 0.45, 'triangle', 0.55); this.tone(PAD_FREQ[i] * 2, 0.25, 'sine', 0.1); },
    arp(steps, gap, vol = 0.35) { steps.forEach((s, k) => this.tone(523.25 * 2 ** (s / 12), 0.32, 'triangle', vol, k * gap)); },
    success() { this.arp([0, 4, 7, 12], 0.08); },
    win() { this.arp([0, 4, 7, 12, 16, 19, 24], 0.09); },
    fail() { this.tone(330, 0.25, 'sine', 0.35); this.tone(262, 0.4, 'sine', 0.35, 0.16); },
    click() { this.tone(900, 0.05, 'sine', 0.15); },
  };
  const vibrate = p => { if (save.vibe && navigator.vibrate) try { navigator.vibrate(p); } catch (e) { /* ignore */ } };

  // ---------- Screens ----------
  let current = 'title';
  let miniCleanup = null;
  const show = name => {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === `screen-${name}`));
    if (current === 'game' && name !== 'game') G.token++;
    if (current === 'mini' && miniCleanup) { miniCleanup(); miniCleanup = null; }
    current = name;
    if (name === 'title') { renderTitle(); if (breakDue && !modalResolve) setTimeout(breakReminder, 400); }
    if (name === 'parents') renderParents();
    if (name === 'players') renderPlayers();
    if (name === 'map') renderMap();
    if (name === 'shop') renderShop();
    if (name === 'settings') renderSettings();
  };
  const topbar = (title, extra = '') => `<header class="topbar"><button class="icon-btn" data-back aria-label="back">${BACK}</button><h2>${title}</h2>${extra}</header>`;
  const starCount = () => `<div class="star-count">${STAR(true)}<span>${totalStars()}</span></div>`;

  const coinPill = () => `<div class="coin-pill">${DROP}<span data-coins>${save.coins}</span></div>`;

  // Home: who you are, what to do today, what to play
  function renderTitle() {
    ensureDaily();
    const colors = ['var(--c0)', 'var(--c1)', 'var(--c2)', 'var(--c3)'];
    const logo = [...t('logo')].map((ch, i) => `<span style="color:${colors[i % 4]};animation-delay:${i * 0.12}s">${ch}</span>`).join('');
    const L = levelInfo();
    const d = save.daily;
    const missions = d.missions.map((m, i) => {
      const full = m.progress >= m.goal;
      return `<div class="mission${m.claimed ? ' claimed' : ''}">
        <div class="info"><b>${missionText(m)}</b><div class="bar"><i style="width:${Math.round(100 * m.progress / m.goal)}%"></i></div></div>
        ${m.claimed ? `<span class="done">${CHECK}</span>`
          : `<button class="btn small${full ? ' primary' : ''}" data-claim="${i}" ${full ? '' : `data-locked="${missionText(m)}" aria-disabled="true"`}>${DROP}${m.reward}</button>`}
      </div>`;
    }).join('');
    const games = GAMES.map(g => {
      const open = g.minLevel <= L.lvl;
      const art = (window.TZ.previews || {})[g.id] || `<span class="game-icon">${g.icon}</span>`;
      return `<button class="game-card${open ? '' : ' locked'}" style="--gc:${g.color}" data-game="${g.id}" ${open ? '' : `data-locked="${t('unlockAt', g.minLevel)}" aria-disabled="true"`}>
        <span class="game-art">${art}
          <span class="skill-tag">${t('sk_' + g.skill)}</span>
          ${open && save.bests[g.id] ? `<span class="best">${STAR(true)}${save.bests[g.id]}</span>` : ''}
          ${open ? '' : `<span class="lock-veil"><span class="lock-badge">${LOCK}</span>${t('unlockAt', g.minLevel)}</span>`}
        </span>
        <span class="game-info"><b>${gameName(g)}</b><small>${t('g_' + g.id + '_d')}</small></span>
      </button>`;
    }).join('');
    $('#screen-title').innerHTML = `
      <header class="hub-top">
        <div class="lvl-badge" aria-label="${t('lvl')} ${L.lvl}"><small>${t('lvl')}</small><b>${L.lvl}</b></div>
        <div class="xp"><div class="bar"><i style="width:${Math.round(100 * L.into / L.need)}%"></i></div><small>${L.into}/${L.need} XP</small></div>
        ${coinPill()}
        <button class="icon-btn" data-go="settings" aria-label="${t('settings')}">${GEAR}</button>
      </header>
      <div class="scroll hub">
        <div class="hub-hero">
          <div><button class="player-chip" data-go="players">${avatar(me())}<span>${esc(playerName(me()))}</span></button>
            <div class="logo small">${logo}</div>
            ${save.streak.count > 1 ? `<div class="streak">${FLAME}${t('streakDays', save.streak.count)}</div>` : `<div class="sub">${t('subtitle')}</div>`}
            <button class="btn small" data-go="shop">${BAG}${t('shop')}</button></div>
          <button class="hero-char" data-go="shop" aria-label="${t('shop')}">${charWrap('')}</button>
        </div>
        ${workoutCard()}
        ${(window.TZ.hubCards || []).map(f => f()).join('')}
        <h3 class="sec">${t('missions')}</h3>
        <div class="missions">${missions}</div>
        <h3 class="sec">${t('games')}</h3>
        <div class="game-grid">${games}</div>
        <h3 class="sec">${t('brainMap')}</h3>
        <div class="brain-map">${GAMES.map(g => {
          // Skill strength: the game's best score against a "mastered" target
          const pct = Math.min(100, Math.round(100 * (save.bests[g.id] || 0) / g.target));
          return `<div class="skill"><span class="skill-dot" style="background:${g.color}"></span><b>${t('sk_' + g.skill)}</b>
            <div class="bar"><i style="width:${pct}%;background:${g.color}"></i></div><small>${pct}%</small></div>`;
        }).join('')}<p class="hint">${t('brainHint')}</p></div>
      </div>`;
  }

  function workoutCard() {
    const w = ensureWorkout();
    if (!w.games.length) return '';
    const steps = w.games.map(id => {
      const g = GAMES.find(x => x.id === id);
      const done = w.done.includes(id);
      return `<div class="wk-step${done ? ' done' : ''}" style="--gc:${g.color}"><span class="game-icon">${g.icon}</span>
        <small>${t('sk_' + g.skill)}</small>${done ? `<span class="wk-check">${CHECK}</span>` : ''}</div>`;
    }).join('');
    const next = workoutNext();
    return `<div class="workout">
      <div class="wk-head"><div><b>${t('wk_title')}</b><small>${t('wk_desc')}</small></div>
        <span class="pill">${DROP}+${WORKOUT_BONUS}</span></div>
      <div class="wk-steps">${steps}</div>
      ${next ? `<button class="btn primary" data-workout>${PLAY}${w.done.length ? t('wk_continue') : t('wk_start')}</button>`
        : `<div class="wk-complete">${CHECK}${t('wk_doneShort')}</div>`}
    </div>`;
  }

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const avatar = p => `<span class="avatar" style="background:${AVATAR_COLORS[p.color % AVATAR_COLORS.length]}">${esc([...playerName(p)][0])}</span>`;

  function renderPlayers() {
    const rows = profiles.list.map(p => {
      const cur = p.id === profiles.current;
      return `<div class="player-row${cur ? ' current' : ''}">${avatar(p)}
        <div class="info"><b>${esc(playerName(p))}</b><small>${p.age ? t('ageN', p.age) : ''}</small></div>
        ${cur ? `<span class="tag on">${t('current')}</span>` : `<button class="btn small" data-switch="${p.id}">${t('switchTo')}</button>
          <button class="icon-btn danger" data-del="${p.id}" aria-label="${t('delPlayer')}">×</button>`}
      </div>`;
    }).join('');
    const ages = Array.from({ length: 13 }, (_, i) => i + 4).map(a => `<option value="${a}">${a}</option>`).join('');
    $('#screen-players').innerHTML = topbar(t('players')) + `<div class="scroll">
      <div class="player-list">${rows}</div>
      <h3 class="sec">${t('addPlayer')}</h3>
      <div class="setting add-player">
        <label><small>${t('playerName')}</small><input id="pl-name" maxlength="16" autocomplete="off"></label>
        <label><small>${t('age')}</small><select id="pl-age"><option value="0">—</option>${ages}</select></label>
        <button class="btn small primary" data-act="add-player">${t('create')}</button>
      </div></div>`;
  }

  // Switching player reloads the app so every screen reads the other child's save
  function switchPlayer(id) {
    profiles.current = id;
    saveProfiles();
    location.reload();
  }
  function addPlayer() {
    const name = $('#pl-name').value.trim();
    if (!name) { vibrate(30); return toast(t('nameNeeded')); }
    if (profiles.list.length >= 40) return toast(t('maxPlayers'));
    // The very first child just names the default profile instead of adding a second one
    if (profiles.list.length === 1 && !profiles.list[0].name) {
      Object.assign(profiles.list[0], { name, age: Number($('#pl-age').value) });
      saveProfiles();
      return renderPlayers();
    }
    const id = `p${Date.now().toString(36)}`;
    profiles.list.push({ id, name, age: Number($('#pl-age').value), color: profiles.list.length });
    switchPlayer(id);
  }
  async function deletePlayer(id) {
    const p = profiles.list.find(x => x.id === id);
    if (!p || id === profiles.current) return;
    const r = await modal(`<h2>${t('delQ', esc(playerName(p)))}</h2>`, [{ id: 'yes', label: t('yes'), cls: 'primary' }, { id: 'no', label: t('no') }]);
    if (r !== 'yes') return;
    profiles.list = profiles.list.filter(x => x.id !== id);
    try { localStorage.removeItem(keyFor(id)); } catch (e) { /* ignore */ }
    saveProfiles();
    renderPlayers();
  }

  // Reads another player's save without switching (for the educators' overview and export)
  const readSave = id => { if (id === profiles.current) return save; try { return JSON.parse(localStorage.getItem(keyFor(id)) || '{}'); } catch (e) { return {}; } };

  function exportCsv() {
    const rows = [['player', 'age', 'type', 'date', 'game_or_test', 'score', 'accuracy_pct', 'difficulty', 'metric', 'value']];
    for (const p of profiles.list) {
      const s = readSave(p.id);
      for (const h of s.history || []) rows.push([playerName(p), p.age || '', 'session', h.d, h.g, h.s, h.a, h.lv, '', '']);
      for (const a of s.assessments || []) for (const [k, v] of Object.entries(a.m || {})) rows.push([playerName(p), a.age || p.age || '', 'assessment', a.d, 'assessment', '', '', '', k, v]);
    }
    downloadCsv(`tzavvanit-${today()}.csv`, rows);
  }
  // Saves rows as a UTF-8 CSV (with BOM, so Excel shows Hebrew correctly)
  function downloadCsv(name, rows) {
    const csv = '﻿' + rows.map(r => r.map(c => `"${String(c == null ? '' : c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    toast(t('exported'));
  }

  function eduSection() {
    const rows = profiles.list.map(p => {
      const s = readSave(p.id);
      const num = k => k.split('-').reduce((acc, v) => acc * 100 + Number(v), 0);
      const days = Object.keys(s.playSecs || {}).sort((a, b) => num(b) - num(a));
      const lastTest = (s.assessments || []).slice(-1)[0];
      return `<tr><td>${avatar(p)} ${esc(playerName(p))}</td><td>${p.age || ''}</td><td>${(s.history || []).length}</td><td>${days[0] || t('never')}</td><td>${lastTest ? lastTest.d : t('never')}</td></tr>`;
    }).join('');
    const hasReport = (save.assessments || []).length > 0;
    return `<h3 class="sec">${t('edu')}</h3>
      <div class="edu-actions">
        <button class="btn small${hasReport ? ' primary' : ''}" data-act="report" ${hasReport ? '' : `data-locked="${t('noReport')}" aria-disabled="true"`}>${t('openReport')}</button>
        <button class="btn small" data-act="export">${t('exportCsv')}</button>
      </div>
      <h3 class="sec">${t('eduAll')}</h3>
      <div class="edu-table-wrap"><table class="edu-table"><thead><tr><th>${t('playerName')}</th><th>${t('age')}</th><th>${t('sessions')}</th><th>${t('lastActive')}</th><th>${t('lastTest')}</th></tr></thead><tbody>${rows}</tbody></table></div>
      ${window.TZ.eduExtras.map(f => f()).join('')}`;
  }

  // Daily return reward, grows with the streak
  async function dailyCheck() {
    const now = today();
    if (save.streak.last === now) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yesterday = `${y.getFullYear()}-${y.getMonth() + 1}-${y.getDate()}`;
    save.streak.count = save.streak.last === yesterday ? save.streak.count + 1 : 1;
    save.streak.last = now;
    const gift = 10 + 5 * Math.min(save.streak.count, 7);
    save.coins += gift;
    persist();
    Sound.success();
    await modal(`${charWrap('happy')}<h2>${t('dailyTitle')}</h2><div class="reward-row"><span class="pill big">${DROP}+${gift}</span></div>
      <div class="streak">${FLAME}${t('streakDays', save.streak.count)}</div><p>${t('dailyText', save.streak.count)}</p>`,
      [{ id: 'ok', label: t('go'), cls: 'primary' }]);
    if (current === 'title') renderTitle();
  }

  function renderMap() {
    let currentFound = false;
    const worlds = WORLDS.map((w, wi) => {
      const locked = !unlocked(wi, 0);
      const lv = Array.from({ length: LEVELS }, (_, l) => {
        const open = unlocked(wi, l), s = starsOf(wi, l);
        const isCurrent = open && !s && !currentFound;
        if (isCurrent) currentFound = true;
        const label = l === LEVELS - 1 ? CROWN : l + 1;
        return `<button class="lvl${isCurrent ? ' current' : ''}${open ? '' : ' locked'}" data-lvl="${wi},${l}" ${open ? '' : `data-locked="${t('lockedLevel')}" aria-disabled="true"`} aria-label="${t('level')} ${l + 1}">
          ${open ? `<span>${label}</span><span class="lvl-stars">${[1, 2, 3].map(n => STAR(n <= s)).join('')}</span>` : LOCK}</button>`;
      }).join('');
      return `<div class="world${locked ? ' locked' : ''}" style="--wc:${w.color}" data-world="${wi}">
        <div class="world-head"><div class="world-thumb">${sceneSVG(w.scene)}</div>
          <div class="info"><h3>${w.name[save.lang]}</h3><span class="chip">${t('mode_' + w.mode)}</span></div>
          <div class="world-stars">${STAR(true)}${worldStars(wi)}/${LEVELS * 3}</div></div>
        <div class="levels">${lv}</div></div>`;
    }).join('');
    $('#screen-map').innerHTML = topbar(t('chooseLevel'), starCount()) + `<div class="scroll">${worlds}
      <div class="world endless-card"><div class="world-thumb">${sceneSVG('beach')}</div>
        <div class="info"><h3>${t('endless')}</h3><p>${t('endlessDesc')} · ${t('best')}: ${save.best}</p></div>
        <button class="btn small primary" data-act="endless" aria-label="${t('endless')}">${PLAY}</button></div></div>`;
    const cur = $('#screen-map .lvl.current');
    if (cur) requestAnimationFrame(() => cur.closest('.world').scrollIntoView({ block: 'center' }));
  }

  let shopTab = 'hats';
  function renderShop() {
    const isHats = shopTab === 'hats';
    const list = isHats ? HATS : SKINS;
    const items = list.map(it => {
      const owned = save.owned[shopTab].includes(it.id);
      const worn = isHats ? save.hat === it.id : save.skin === it.id;
      const label = isHats ? t('hats')[it.id] : t('skins')[it.id];
      const state = worn ? `<span class="tag on">${t('equipped')}</span>` : owned ? `<span class="tag">${t('equip')}</span>`
        : `<span class="price${save.coins < it.price ? ' short' : ''}">${DROP}${it.price}</span>`;
      return `<button class="hat-btn${worn ? ' selected' : ''}" data-buy="${shopTab}:${it.id}">
        ${isHats ? charWrap('', it.id) : charWrap('', save.hat, it.id)}<span>${label}</span>${state}</button>`;
    }).join('');
    $('#screen-shop').innerHTML = topbar(t('shop'), coinPill()) + `<div class="scroll">
      <div class="wardrobe-preview">${charWrap('happy')}</div>
      <div class="seg tabs"><button data-tab="hats" aria-pressed="${isHats}">${t('tabHats')}</button><button data-tab="skins" aria-pressed="${!isHats}">${t('tabSkins')}</button></div>
      <div class="hat-grid">${items}</div></div>`;
  }

  function buyOrWear(kind, id) {
    const it = (kind === 'hats' ? HATS : SKINS).find(x => x.id === id);
    if (!save.owned[kind].includes(id)) {
      if (save.coins < it.price) { vibrate(30); return toast(t('noMoney', it.price - save.coins)); }
      save.coins -= it.price;
      save.owned[kind].push(id);
      Sound.win();
      toast(t('bought'));
    }
    if (kind === 'hats') save.hat = id; else save.skin = id;
    persist();
    renderShop();
  }

  async function claimMission(i) {
    const d = save.daily, m = d.missions[i];
    if (!m || m.claimed || m.progress < m.goal) return;
    m.claimed = true;
    save.coins += m.reward;
    Sound.success();
    if (!d.bonus && d.missions.every(x => x.claimed)) {
      d.bonus = true;
      save.coins += 50;
      persist();
      renderTitle();
      confettiAt(document.body, 50);
      await modal(`${charWrap('happy')}<h2>${t('allMissions')}</h2><div class="reward-row"><span class="pill big">${DROP}+50</span></div>`, [{ id: 'ok', label: t('go'), cls: 'primary' }]);
      return;
    }
    persist();
    renderTitle();
  }

  function confettiAt(host, n = 30) {
    const colors = ['#ff6f59', '#ffb627', '#2ec4b6', '#3a86ff', '#ff8a3d', '#ffffff'];
    const box = document.createElement('div');
    box.className = 'fx';
    $('#app').appendChild(box);
    for (let k = 0; k < n; k++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = `${Math.random() * 100}%`;
      c.style.background = colors[k % colors.length];
      c.style.animationDuration = `${1.2 + Math.random() * 1.2}s`;
      c.style.animationDelay = `${Math.random() * 0.3}s`;
      box.appendChild(c);
    }
    setTimeout(() => box.remove(), 2800);
  }

  function renderSettings() {
    const tog = k => `<button class="toggle" data-toggle="${k}" aria-pressed="${save[k]}" aria-label="${t('s_' + k)}"></button>`;
    const row = k => `<div class="setting"><div class="info"><b>${t('s_' + k)}</b><small>${t('s_' + k + '_d')}</small></div>${tog(k)}</div>`;
    $('#screen-settings').innerHTML = topbar(t('settings')) + `<div class="scroll">
      <div class="setting"><div class="info"><b>${t('parents')}</b><small>${t('parents_d')}</small></div>
        <button class="btn small primary" data-act="parents">${LOCK}${t('parents')}</button></div>
      ${['sound', 'vibe', 'assist', 'shapes'].map(row).join('')}
      <div class="setting"><div class="info"><b>${t('s_lang')}</b></div>
        <div class="seg"><button data-lang="he" aria-pressed="${save.lang === 'he'}">עברית</button><button data-lang="en" aria-pressed="${save.lang === 'en'}">English</button></div></div>
      <div class="setting"><div class="info"><b class="danger">${t('s_reset')}</b><small>${t('s_reset_d')}</small></div>
        <button class="btn small" data-act="reset">${t('s_reset')}</button></div>
      <div class="about">${t('about')}</div></div>`;
  }

  // ---------- Parents area ----------
  // A multiplication question keeps young children out (a common "parental gate")
  async function parentGate() {
    const a = 6 + rand(4), b = 6 + rand(4), ans = a * b;
    const opts = [ans, ans + a, ans - b, ans + 10].sort(() => Math.random() - 0.5);
    const r = await modal(`<h2>${t('pgTitle')}</h2><p class="big-num">${t('pgQ', a, b)}</p>`,
      opts.map(o => ({ id: String(o), label: String(o) })).concat({ id: 'no', label: t('no') }));
    if (r === String(ans)) return true;
    if (r && r !== 'no') toast(t('pgWrong'));
    return false;
  }

  const dayKey = d => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  const spark = (vals, color) => {
    if (vals.length < 2) return '';
    const w = 120, h = 34, max = Math.max(...vals, 1), min = Math.min(...vals, 0);
    const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - 3 - ((v - min) / (max - min || 1)) * (h - 6)}`).join(' ');
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
  };

  function renderParents() {
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return d; });
    const keys = days.map(dayKey);
    const mins = keys.map(k => Math.round((save.playSecs[k] || 0) / 60));
    const week = save.history.filter(h => keys.includes(h.d));
    const maxMin = Math.max(...mins, 10);
    const chart = days.map((d, i) => `<div class="day"><div class="col"><i style="height:${Math.round(100 * mins[i] / maxMin)}%"></i></div>
      <small>${mins[i]}</small><span>${t('dayNames')[d.getDay()]}</span></div>`).join('');
    const skills = GAMES.map(g => {
      const hs = save.history.filter(h => h.g === g.id);
      if (!hs.length) return `<div class="p-skill"><div class="p-head"><span class="skill-dot" style="background:${g.color}"></span><b>${t('sk_' + g.skill)}</b><small>${gameName(g)}</small></div><p class="muted">${t('noData')}</p></div>`;
      const last = hs.slice(-5), prev = hs.slice(-10, -5);
      const avg = a => a.reduce((s, h) => s + h.a, 0) / a.length;
      const nowAcc = Math.round(avg(last));
      const trend = !prev.length ? 'flat' : avg(last) - avg(prev) > 4 || last[last.length - 1].lv > prev[prev.length - 1].lv ? 'up' : avg(prev) - avg(last) > 8 ? 'down' : 'flat';
      return `<div class="p-skill"><div class="p-head"><span class="skill-dot" style="background:${g.color}"></span><b>${t('sk_' + g.skill)}</b><small>${gameName(g)}</small>
          <span class="trend ${trend}">${t('trend' + trend[0].toUpperCase() + trend.slice(1))}</span></div>
        <div class="p-row"><div><small>${t('diffNow')}</small><div class="dots">${Array.from({ length: MAX_DIFF }, (_, i) => `<i class="${i < difficulty(g.id) ? 'on' : ''}" style="--dc:${g.color}"></i>`).join('')}</div></div>
          <div><small>${t('accuracy')}</small><b>${nowAcc}%</b></div><div><small>${t('sessions')}</small><b>${hs.length}</b></div></div>
        ${spark(hs.slice(-12).map(h => h.lv * 10 + h.a / 10), g.color)}</div>`;
    }).join('');
    const opts = [0, 15, 20, 30].map(m => `<button data-break="${m}" aria-pressed="${save.breakMin === m}">${m ? t('minShort', m) : t('off')}</button>`).join('');
    $('#screen-parents').innerHTML = topbar(t('parents')) + `<div class="scroll">
      <h3 class="sec">${t('week')}</h3>
      <div class="p-stats"><div><b>${mins.filter(m => m > 0).length}/7</b><small>${t('daysActive')}</small></div>
        <div><b>${mins.reduce((a, b) => a + b, 0)}</b><small>${t('minutes')}</small></div><div><b>${week.length}</b><small>${t('sessions')}</small></div></div>
      <div class="p-chart">${chart}</div>
      ${eduSection()}
      <h3 class="sec">${t('skillsTitle')}</h3>${skills}
      <h3 class="sec">${t('breakTitle')}</h3>
      <div class="setting"><div class="info"><small>${t('breakDesc')}</small></div><div class="seg">${opts}</div></div>
      <p class="p-note">${t('parentNote')}</p></div>`;
  }

  // ---------- Play time and break reminder ----------
  let sessionSecs = 0, breakDue = false;
  setInterval(() => {
    if (document.hidden || !(current === 'game' || current === 'mini')) return;
    const k = today();
    save.playSecs[k] = (save.playSecs[k] || 0) + 1;
    sessionSecs++;
    if (sessionSecs % 15 === 0) persist();
    if (save.breakMin && sessionSecs >= save.breakMin * 60) breakDue = true;
  }, 1000);
  // Shown when the child is back on the home screen, never in the middle of a game
  async function breakReminder() {
    breakDue = false;
    const r = await modal(`${charWrap('happy')}<h2>${t('breakNow')}</h2><p>${t('breakText')}</p>`,
      [{ id: 'rest', label: t('breakOk'), cls: 'primary' }, { id: 'more', label: t('breakMore') }]);
    // "A bit more" asks again after 5 minutes of play; resting starts a fresh count
    sessionSecs = r === 'more' ? save.breakMin * 60 - 300 : 0;
  }

  function applyLang() {
    document.documentElement.lang = save.lang;
    document.documentElement.dir = save.lang === 'he' ? 'rtl' : 'ltr';
    document.title = t('logo');
  }

  // ---------- Modal ----------
  let modalResolve = null;
  const modal = (html, buttons) => new Promise(res => {
    const card = $('#modal-card');
    card.innerHTML = html + `<div class="modal-btns">${buttons.map(b => `<button class="btn ${b.cls || ''}" data-m="${b.id}">${b.label}</button>`).join('')}</div>`;
    $('#modal').classList.remove('hidden');
    modalResolve = res;
  });
  const closeModal = id => {
    $('#modal').classList.add('hidden');
    const r = modalResolve; modalResolve = null;
    if (r) r(id);
  };

  // ---------- Game ----------
  const G = { w: 0, l: 0, cfg: null, round: 0, seq: [], gaps: [], expected: [], idx: 0, mistakes: 0, score: 0, phase: 'idle', lastTap: 0, endless: false, mode: 'order', token: 0 };
  const pads = [];

  function buildPads() {
    const box = $('#pads');
    box.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const b = document.createElement('button');
      b.className = 'pad';
      b.dataset.i = i;
      b.setAttribute('aria-label', `pad ${i + 1}`);
      b.innerHTML = `<svg class="shape" viewBox="0 0 24 24">${SHAPES[i]}</svg>`;
      b.addEventListener('pointerdown', e => { e.preventDefault(); onPad(i); });
      box.appendChild(b);
      pads.push(b);
    }
  }

  const levelConfig = (w, l) => {
    const boss = l === LEVELS - 1;
    const beat = Math.max(320, 640 - l * 35 - w * 25) * (save.assist ? 1.3 : 1);
    return { rounds: boss ? 5 : 3, baseLen: [3, 2, 3, 2, 3][w] + Math.floor(l / 2), beat, mode: WORLDS[w].mode, boss };
  };

  function makeSeq(len) {
    const s = [];
    while (s.length < len) {
      const p = rand(4);
      if (s.length >= 2 && s[s.length - 1] === p && s[s.length - 2] === p) continue;
      s.push(p);
    }
    return s;
  }

  function makeGaps(len, beat, rhythmic) {
    const units = [1, 1, 1, 0.5, 1.5, 2];
    return Array.from({ length: len - 1 }, () => rhythmic ? Math.max(300, units[rand(units.length)] * beat) : beat);
  }

  function setGray(g) { $('#scene').style.filter = `grayscale(${g}) brightness(${1 - g * 0.06})`; }
  function charState(s) {
    const c = $('#game-char');
    c.classList.remove('happy', 'sad', 'listen', 'sing');
    void c.offsetWidth;
    if (s) c.classList.add(s);
  }
  function banner(text, chip = '') {
    const b = $('#banner');
    $('#banner-text').textContent = text;
    $('#chip').textContent = chip;
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
  }
  function hud() {
    $('#hud-score').textContent = G.score;
    $('#hud-title').textContent = G.endless ? t('endless') : `${WORLDS[G.w].name[save.lang]} · ${G.cfg.boss ? t('boss') : `${t('level')} ${G.l + 1}`}`;
    $('#hearts').innerHTML = G.endless ? '' : Array.from({ length: MAX_TRIES }, (_, i) => HEART.replace('<svg', `<svg class="${i < MAX_TRIES - G.mistakes ? '' : 'lost'}"`)).join('');
    $('#round-dots').innerHTML = G.endless
      ? `<span>${t('length', G.seq.length || 2)}</span>`
      : Array.from({ length: G.cfg.rounds }, (_, i) => `<i class="${i < G.round ? 'done' : ''}"></i>`).join('');
  }
  function setPadsEnabled(on) { pads.forEach(p => p.classList.toggle('disabled', !on)); }

  function lookAt(i) {
    const pupils = $('#game-char .c-pupils');
    if (!pupils) return;
    if (i == null) { pupils.style.transform = ''; return; }
    const pr = pads[i].getBoundingClientRect(), cr = $('#game-char').getBoundingClientRect();
    const dx = pr.left + pr.width / 2 - (cr.left + cr.width / 2), dy = pr.top + pr.height / 2 - (cr.top + cr.height / 2);
    const d = Math.hypot(dx, dy) || 1;
    pupils.style.transform = `translate(${(dx / d) * 6}px, ${(dy / d) * 6}px)`;
  }
  function lightPad(i, ms) {
    pads[i].classList.add('lit');
    lookAt(i);
    setTimeout(() => pads[i].classList.remove('lit'), ms);
  }
  function popup(text, cls = '') {
    const el = document.createElement('div');
    el.className = `popup ${cls}`;
    el.textContent = text;
    $('#fx').appendChild(el);
    setTimeout(() => el.remove(), 850);
  }
  function confetti(n = 30) {
    const fx = $('#fx'), colors = ['#ff6f59', '#ffb627', '#2ec4b6', '#3a86ff', '#ff8a3d', '#ffffff'];
    for (let k = 0; k < n; k++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = `${Math.random() * 100}%`;
      c.style.background = colors[k % colors.length];
      c.style.animationDuration = `${1.2 + Math.random() * 1.2}s`;
      c.style.animationDelay = `${Math.random() * 0.3}s`;
      fx.appendChild(c);
      setTimeout(() => c.remove(), 2800);
    }
  }

  async function startLevel(w, l) {
    Object.assign(G, { w, l, cfg: levelConfig(w, l), round: 0, mistakes: 0, score: 0, endless: false, phase: 'busy', seq: [] });
    enterGame(WORLDS[w].scene, 1);
    const tk = G.token;
    const mode = G.cfg.mode;
    if (!save.seenIntro[mode]) {
      await sleep(300);
      const r = await introModal(w);
      if (tk !== G.token) return;
      if (r === 'map') return show('map');
      save.seenIntro[mode] = true; persist();
    }
    if (mode === 'ear') { await meetSounds(tk); if (tk !== G.token) return; }
    beginRound();
  }

  function startEndless() {
    Object.assign(G, { w: 0, l: 0, cfg: { rounds: Infinity, boss: false, mode: 'order' }, round: 0, mistakes: 0, score: 0, endless: true, phase: 'busy', seq: [] });
    enterGame('beach', 1);
    beginRound();
  }

  function enterGame(scene, gray) {
    show('game');
    $('#scene').innerHTML = sceneSVG(scene);
    setGray(gray);
    $('#game-char').innerHTML = charSVG();
    $('#game-char').dataset.hat = save.hat;
    $('#fx').innerHTML = '';
    banner('');
    charState('');
    setPadsEnabled(false);
    hud();
  }

  async function introModal(w) {
    const mode = WORLDS[w].mode;
    const demo = [0, 1, 2, 3].map(i => `<i style="background:var(--c${i})">${i + 1}</i>`);
    const demoHtml = mode === 'reverse' ? `<div class="intro-demo" dir="ltr">${demo.join('')}</div><div class="intro-demo" dir="ltr">${demo.slice().reverse().join('')}</div>` : '';
    return modal(`${charWrap('happy')}<h2>${WORLDS[w].name[save.lang]}</h2><span class="chip">${t('mode_' + mode)}</span><p>${t('intro_' + mode)}</p>${demoHtml}`,
      [{ id: 'go', label: t('go'), cls: 'primary' }]);
  }

  async function meetSounds(tk) {
    banner(t('meet'), t('mode_ear'));
    await sleep(700);
    for (let i = 0; i < 4; i++) {
      if (tk !== G.token) return;
      Sound.pad(i); lightPad(i, 450);
      await sleep(650);
    }
    await sleep(400);
  }

  function beginRound() {
    if (G.endless) {
      const s = makeSeq(G.seq.length ? 1 : 2);
      G.seq = G.seq.concat(s);
      G.mode = 'order';
      G.gaps = makeGaps(G.seq.length, Math.max(300, 580 - G.round * 14) * (save.assist ? 1.3 : 1), false);
    } else {
      const c = G.cfg;
      G.mode = c.mode === 'mix' ? ['order', 'rhythm', 'reverse', 'ear'][rand(4)] : c.mode;
      const len = c.baseLen + G.round + (c.mode === 'mix' && G.mode === 'ear' ? -1 : 0);
      G.seq = makeSeq(len);
      G.gaps = makeGaps(len, c.beat, G.mode === 'rhythm');
    }
    G.expected = G.mode === 'reverse' ? G.seq.slice().reverse() : G.seq.slice();
    hud();
    playRound();
  }

  async function playRound() {
    const tk = G.token;
    G.phase = 'listen';
    setPadsEnabled(false);
    const chip = G.endless ? '' : t('mode_' + G.mode);
    banner(G.mode === 'ear' ? t('listenEar') : t('listen'), chip);
    charState(G.mode === 'ear' ? 'sing' : 'listen');
    await sleep(900);
    for (let i = 0; i < G.seq.length; i++) {
      if (tk !== G.token) return;
      const p = G.seq[i];
      Sound.pad(p);
      const gap = G.gaps[i] ?? 500;
      if (G.mode !== 'ear') lightPad(p, Math.min(gap * 0.75, 420));
      await sleep(i < G.seq.length - 1 ? gap : 450);
    }
    if (tk !== G.token) return;
    lookAt(null);
    charState('');
    G.idx = 0; G.lastTap = 0;
    G.phase = 'input';
    setPadsEnabled(true);
    banner(t('turn_' + G.mode), chip);
  }

  function onPad(i) {
    Sound.init();
    if (current !== 'game') return;
    if (G.phase !== 'input') {
      if (G.phase === 'listen') toast(t('waitListen'));
      return;
    }
    Sound.pad(i);
    lightPad(i, 200);
    vibrate(12);
    const now = performance.now();
    if (i !== G.expected[G.idx]) return mistake('oops', i);
    if (G.mode === 'rhythm' && G.idx > 0) {
      const exp = G.gaps[G.idx - 1];
      const err = Math.abs(now - G.lastTap - exp);
      const tol = Math.max(140, exp * 0.33) * (save.assist ? 1.6 : 1);
      if (err > tol) return mistake('offBeat', i);
      const perfect = err < tol * 0.45;
      popup(t(perfect ? 'perfect' : 'good'), perfect ? '' : 'good');
      G.score += perfect ? 100 : 60;
    } else {
      G.score += G.endless ? 50 + G.round * 5 : { order: 50, rhythm: 50, reverse: 70, ear: 80 }[G.mode];
    }
    G.lastTap = now;
    G.idx++;
    hud();
    if (G.idx === G.expected.length) roundComplete();
  }

  async function mistake(kind, i) {
    const tk = G.token;
    G.phase = 'busy';
    setPadsEnabled(false);
    pads[i].classList.remove('shake'); void pads[i].offsetWidth; pads[i].classList.add('shake');
    Sound.fail();
    vibrate([40, 50, 40]);
    charState('sad');
    banner(t(kind), G.endless ? '' : t('mode_' + G.mode));
    if (G.endless) { await sleep(1300); if (tk === G.token) endlessOver(); return; }
    G.mistakes++;
    hud();
    await sleep(1600);
    if (tk !== G.token) return;
    if (G.mistakes >= MAX_TRIES) return levelFail();
    playRound();
  }

  async function roundComplete() {
    const tk = G.token;
    G.phase = 'busy';
    setPadsEnabled(false);
    G.round++;
    Sound.success();
    vibrate(30);
    charState('happy');
    confetti(18);
    const praise = t('praise');
    banner(praise[rand(praise.length)]);
    setGray(G.endless ? Math.max(0, 1 - G.round / 10) : 1 - G.round / G.cfg.rounds);
    hud();
    await sleep(1300);
    if (tk !== G.token) return;
    if (!G.endless && G.round >= G.cfg.rounds) return levelComplete();
    beginRound();
  }

  async function levelComplete() {
    const tk = G.token;
    const stars = Math.max(1, 3 - G.mistakes);
    const k = key(G.w, G.l);
    save.stars[k] = Math.max(starsOf(G.w, G.l), stars);
    const simonDone = track('simon');
    // The Sound Journey's difficulty is its map position: 30 levels shown on the 1–10 scale
    save.adapt.simon = Math.max(difficulty('simon'), Math.min(MAX_DIFF, 1 + Math.floor((G.w * LEVELS + G.l + 1) / 3)));
    recordSession('simon', G.score, G.cfg.rounds / (G.cfg.rounds + G.mistakes));
    const reward = grant('simon', G.score, 5 + stars * 8 + (G.cfg.boss ? 20 : 0), 20 + stars * 5);
    reward.missions.unshift(...simonDone);
    const worldDone = G.cfg.boss;
    Sound.win();
    confetti(60);
    await sleep(500);
    if (tk !== G.token) return;
    const hasNext = G.l < LEVELS - 1 || G.w < WORLDS.length - 1;
    const r = await modal(`<h2>${worldDone ? t('worldDone') : t('levelDone')}</h2>
      <div class="stars-big">${[1, 2, 3].map(n => STAR(n <= stars).replace('class="star on"', `class="star on" style="animation-delay:${n * 0.25}s"`)).join('')}</div>
      <p>${t('score')}: <b>${G.score}</b></p>${rewardHtml(reward)}`,
      [hasNext ? { id: 'next', label: t('next'), cls: 'primary' } : null, { id: 'retry', label: t('retry') }, { id: 'map', label: t('map') }].filter(Boolean));
    if (r === 'next') {
      const [w, l] = G.l < LEVELS - 1 ? [G.w, G.l + 1] : [G.w + 1, 0];
      startLevel(w, l);
    } else if (r === 'retry') startLevel(G.w, G.l);
    else show('map');
  }

  async function levelFail() {
    recordSession('simon', G.score, G.round / (G.round + G.mistakes));
    const r = await modal(`${charWrap('')}<h2>${t('failTitle')}</h2><p>${t('failText')}</p>`,
      [{ id: 'retry', label: t('retry'), cls: 'primary' }, { id: 'map', label: t('map') }]);
    if (r === 'retry') startLevel(G.w, G.l); else show('map');
  }

  async function endlessOver() {
    const len = G.seq.length - 1;
    const isBest = G.score > save.best;
    if (isBest) { save.best = G.score; persist(); confetti(50); Sound.win(); }
    recordSession('simon', G.score, G.round / (G.round + 1));
    const reward = grant('simon', G.score, 3 + Math.floor(G.score / 40), 10 + Math.floor(G.score / 20));
    const r = await modal(`<h2>${t('endlessOver')}</h2><div class="big-num">${G.score}</div><p>${t('endlessLen', Math.max(0, len))}</p>
      ${isBest ? `<div class="badge">${t('newBest')}</div>` : `<p>${t('best')}: ${save.best}</p>`}${rewardHtml(reward)}`,
      [{ id: 'retry', label: t('retry'), cls: 'primary' }, { id: 'home', label: t('home') }]);
    if (r === 'retry') startEndless(); else show('title');
  }

  // ---------- Mini-games frame (games themselves live in minigames.js) ----------
  let miniBack = null;
  const Mini = {
    open(game) {
      $('#screen-mini').innerHTML = `<header class="topbar"><button class="icon-btn" data-back aria-label="back">${BACK}</button>
        <div class="hud-title">${gameName(game)}<small class="diff-chip">${t('diffLabel', difficulty(game.id))}</small></div><div class="mini-extra" id="mini-extra"></div><div class="score" id="mini-score">0</div></header>
        <div class="timebar" id="mini-time"><i></i></div><div class="mini-area" id="mini-area"></div>`;
      show('mini');
      miniBack = () => show('title');
      return $('#mini-area');
    },
    score(n) { $('#mini-score').textContent = n; },
    extra(html) { $('#mini-extra').innerHTML = html; },
    time(frac) {
      const bar = $('#mini-time');
      bar.classList.toggle('hidden', frac == null);
      if (frac != null) bar.firstElementChild.style.width = `${Math.max(0, Math.min(1, frac)) * 100}%`;
    },
    // The game's stop function; runs when the player leaves the screen
    onLeave(fn) { miniCleanup = fn; },
    // perf: { acc: 0..1, step: -1 | 0 | 1 } decided by the game from how the session went
    async finish(game, score, coins, xp, lines = '', perf = { acc: 1, step: 0 }) {
      if (miniCleanup) { miniCleanup(); miniCleanup = null; }
      const ch = recordSession(game.id, score, perf.acc, perf.step);
      lines += diffHtml(ch);
      // Workout progress: this game counts once per day toward the daily workout
      const w = ensureWorkout();
      let wkLine = '';
      if (w.games.includes(game.id) && !w.done.includes(game.id)) {
        w.done.push(game.id);
        if (w.done.length === w.games.length && !w.claimed) {
          w.claimed = true;
          coins += WORKOUT_BONUS;
          wkLine = `<div class="badge mission-badge">${CHECK}${t('wk_done')}</div>`;
        }
      }
      const reward = grant(game.id, score, coins, xp);
      Sound.win();
      if (reward.isBest || wkLine) confettiAt(document.body, 50);
      const praise = t('praise');
      const next = w.games.includes(game.id) ? workoutNext() : null;
      const r = await modal(`<h2>${score > 0 ? praise[rand(praise.length)] : t('failTitle')}</h2><div class="big-num">${score}</div>${lines}
        ${reward.isBest ? `<div class="badge">${t('newBest')}</div>` : `<p>${t('best')}: ${save.bests[game.id] || 0}</p>`}${rewardHtml(reward)}${wkLine}`,
        [next ? { id: 'wk', label: t('wk_next', w.done.length + 1, w.games.length), cls: 'primary' } : null,
          { id: 'again', label: t('again'), cls: next ? '' : 'primary' }, { id: 'home', label: t('home') }].filter(Boolean));
      if (r === 'wk') GAMES.find(g => g.id === next).start();
      else if (r === 'again') game.start(); else show('title');
    },
  };

  GAMES.push({
    id: 'simon', minLevel: 1, color: '#2ec4b6', skill: 'memory', target: 1500, start: () => show('map'),
    icon: `<svg viewBox="0 0 48 48"><rect x="4" y="4" width="18" height="18" rx="6" fill="#ff6f59"/><rect x="26" y="4" width="18" height="18" rx="6" fill="#ffb627"/><rect x="4" y="26" width="18" height="18" rx="6" fill="#2ec4b6"/><rect x="26" y="26" width="18" height="18" rx="6" fill="#3a86ff"/></svg>`,
  });

  window.TZ = {
    $, sleep, rand, save, persist, t, Sound, vibrate, toast, modal, charWrap, STAR, HEART, DROP, CHECK, SHAPES, Mini, difficulty,
    show, today, esc, me, playerName, BACK, PLAY, actions: {}, hubCards: [], eduExtras: [],
    profiles: () => profiles, saveProfiles, readSave, downloadCsv,
    rerender: () => renderParents(),
    registerGame: g => GAMES.push(g),
    addStrings: (he, en) => { Object.assign(STR.he, he); Object.assign(STR.en, en); },
  };

  // ---------- Navigation ----------
  function back() {
    if (modalResolve) { closeModal(current === 'game' ? 'map' : null); return; }
    if (current === 'game') show(G.endless ? 'title' : 'map');
    else if (current === 'mini' && miniBack) miniBack();
    else if (current === 'parents') show('settings');
    else if (current === 'report') show(window.TZ.reportBack || 'title');
    else if (current !== 'title') show('title');
  }

  // Buttons fire on pointerup of the button that got the pointerdown, so a press that
  // slides a few pixels (pressed buttons sink by design) is never lost. A bigger move
  // is a scroll, not a tap.
  let press = null;
  document.addEventListener('pointerdown', e => {
    Sound.init();
    const el = e.target.closest('button');
    // Pads and in-game buttons (data-raw) handle their own pointerdown
    press = el && !el.classList.contains('pad') && !el.hasAttribute('data-raw') ? { el, x: e.clientX, y: e.clientY } : null;
  });
  document.addEventListener('pointerup', e => {
    const p = press;
    press = null;
    if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 14) handleButton(p.el);
  });
  document.addEventListener('pointercancel', () => { press = null; });
  // Keyboard activation (Enter/Space) arrives as a click with detail 0
  document.addEventListener('click', e => {
    const el = e.target.closest('button');
    if (el && e.detail === 0 && !el.classList.contains('pad') && !el.hasAttribute('data-raw')) handleButton(el);
  });

  async function handleButton(el) {
    if (!el.isConnected) return;
    Sound.click();
    const d = el.dataset;
    if (d.locked) { vibrate(20); return toast(d.locked); }
    if (d.m) return closeModal(d.m);
    if (el.hasAttribute('data-back')) return back();
    if (d.go) return show(d.go);
    if (d.lvl) { const [w, l] = d.lvl.split(',').map(Number); return startLevel(w, l); }
    if (d.buy) { const [kind, id] = d.buy.split(':'); return buyOrWear(kind, id); }
    if (d.tab) { shopTab = d.tab; return renderShop(); }
    if (d.claim) return claimMission(Number(d.claim));
    if (d.game) { const g = GAMES.find(x => x.id === d.game); if (g) return g.start(); }
    if (el.hasAttribute('data-workout')) { const id = workoutNext(); if (id) return GAMES.find(g => g.id === id).start(); }
    if (d.toggle) {
      save[d.toggle] = !save[d.toggle]; persist();
      document.body.classList.toggle('shapes', save.shapes);
      return renderSettings();
    }
    if (d.lang) { save.lang = d.lang; persist(); applyLang(); return renderSettings(); }
    if (d.act === 'endless') return startEndless();
    if (d.act === 'parents') { if (await parentGate()) show('parents'); return; }
    if (d.break) { save.breakMin = Number(d.break); persist(); return renderParents(); }
    if (d.switch) return switchPlayer(d.switch);
    if (d.del) return deletePlayer(d.del);
    if (d.act === 'add-player') return addPlayer();
    if (d.act === 'export') return exportCsv();
    if (d.act && window.TZ.actions[d.act]) return window.TZ.actions[d.act](el);
    if (d.act === 'reset') {
      const r = await modal(`<h2>${t('resetQ')}</h2>`, [{ id: 'yes', label: t('yes'), cls: 'primary' }, { id: 'no', label: t('no') }]);
      if (r === 'yes') {
        const keep = { lang: save.lang, sound: save.sound, vibe: save.vibe, assist: save.assist, shapes: save.shapes };
        Object.keys(save).forEach(k => delete save[k]);
        Object.assign(save, defaults(), keep); persist(); renderSettings();
      }
    }
  }

  let toastTimer = 0;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
  }

  document.addEventListener('keydown', e => {
    if (e.key >= '1' && e.key <= '4' && current === 'game') onPad(Number(e.key) - 1);
    if (e.key === 'Escape') back();
  });

  document.addEventListener('visibilitychange', () => {
    if (!Sound.ctx) return;
    if (document.hidden) Sound.ctx.suspend(); else Sound.ctx.resume();
  });

  // Android hardware back button (Capacitor)
  const capApp = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (capApp) {
    capApp.addListener('backButton', () => {
      if (current === 'title' && !modalResolve) capApp.exitApp(); else back();
    });
  }

  // ---------- Boot ----------
  // Waits for minigames.js to register its games before the home screen draws
  document.addEventListener('DOMContentLoaded', () => {
    applyLang();
    document.body.classList.toggle('shapes', save.shapes);
    buildPads();
    renderTitle();
    dailyCheck();
  });
})();
