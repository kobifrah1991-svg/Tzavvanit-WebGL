'use strict';
// Enjoyment and effectiveness, measured on the device:
// - After every game the child taps one of three faces ("how was it?"); it is stored on that session's
//   history entry as fun: 1-3, next to accuracy (a) and stage (lv) that are already recorded.
// - The parents area gets a table per game: plays, average enjoyment, accuracy at the start against
//   the latest sessions (is the skill improving?), and the stage reached, plus a few plain insights.
(() => {
  const { $, save, persist, t, Sound } = TZ;

  TZ.addStrings({
    fun_q: 'איך היה?', fun_1: 'לא כיף', fun_2: 'בסדר', fun_3: 'כיף!', fun_thanks: 'תודה!',
    in_title: 'הנאה ויעילות', in_desc: 'כל שורה מראה כמה הילד שיחק, כמה נהנה (לפי הפרצופים בסוף כל משחק), ואיך הדיוק השתנה מהמשחקים הראשונים לאחרונים.',
    in_game: 'משחק', in_plays: 'פעמים', in_fun: 'הנאה', in_acc: 'דיוק: התחלה ← עכשיו', in_stage: 'שלב',
    in_none: 'עדיין אין מספיק משחקים. אחרי כמה משחקים יופיעו כאן נתונים.',
    in_fav: g => `הכי נהנה מ: ${g}`, in_grow: (g, n) => `השיפור הגדול ביותר: ${g} (+${n}% דיוק)`,
    in_hard: g => `כדאי לעודד ב: ${g} (הנאה נמוכה)`, in_note: 'השיפור נמדד בתוך המשחקים עצמם. כדי לבדוק העברה לחיים, משווים את מבדק ההתקדמות לאורך זמן.',
  }, {
    fun_q: 'How was it?', fun_1: 'Not fun', fun_2: 'OK', fun_3: 'Fun!', fun_thanks: 'Thanks!',
    in_title: 'Enjoyment and effectiveness', in_desc: 'Each row shows how much the child played, how much they enjoyed it (from the faces after each game) and how accuracy changed from the first sessions to the latest.',
    in_game: 'Game', in_plays: 'Plays', in_fun: 'Fun', in_acc: 'Accuracy: start → now', in_stage: 'Stage',
    in_none: 'Not enough games yet. Data will show up here after a few sessions.',
    in_fav: g => `Enjoys most: ${g}`, in_grow: (g, n) => `Biggest improvement: ${g} (+${n}% accuracy)`,
    in_hard: g => `Worth encouraging: ${g} (low enjoyment)`, in_note: 'Improvement is measured inside the games. To check transfer to daily life, compare the progress check over time.',
  });

  const FACES = ['😕', '🙂', '😄'];

  // The faces under every finish screen
  TZ.hooks.finish.push(game => `<div class="fun-ask" data-g="${game.id}"><small>${t('fun_q')}</small>
    <div class="fun-faces">${FACES.map((f, i) => `<button class="fun-face" data-raw data-fun="${i + 1}" aria-label="${t('fun_' + (i + 1))}">${f}</button>`).join('')}</div></div>`);
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest('.fun-face');
    if (!b) return;
    e.preventDefault();
    const box = b.closest('.fun-ask'), id = box.dataset.g;
    const h = save.history || [];
    for (let i = h.length - 1; i >= 0; i--) if (h[i].g === id) { h[i].fun = Number(b.dataset.fun); break; }
    persist();
    box.querySelectorAll('.fun-face').forEach(x => x.classList.toggle('on', x === b));
    box.querySelector('small').textContent = t('fun_thanks');
    Sound.tone([392, 523, 659][b.dataset.fun - 1], 0.15, 'triangle', 0.3);
  });

  const nameOf = id => t('g_' + id);
  function stats() {
    const by = {};
    (save.history || []).forEach(h => { (by[h.g] = by[h.g] || []).push(h); });
    return Object.entries(by).filter(([id]) => id !== 'dance').map(([id, list]) => {
      const funs = list.filter(h => h.fun).map(h => h.fun);
      const k = Math.min(3, Math.floor(list.length / 2));
      const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
      const first = k ? Math.round(avg(list.slice(0, k).map(h => h.a))) : null;
      const last = k ? Math.round(avg(list.slice(-k).map(h => h.a))) : null;
      return { id, plays: list.length, fun: funs.length ? avg(funs) : null, first, last, lv: (save.adapt || {})[id] || 1 };
    }).sort((a, b) => b.plays - a.plays);
  }

  TZ.eduExtras.push(() => {
    const rows = stats();
    if (!rows.length) return `<h3 class="sec">${t('in_title')}</h3><p class="p-note">${t('in_none')}</p>`;
    const face = f => f == null ? '–' : FACES[Math.max(0, Math.min(2, Math.round(f) - 1))];
    const trend = r => r.first == null ? '–' : `${r.first}% ${save.lang === 'he' ? '←' : '→'} ${r.last}% <b class="${r.last > r.first ? 'up' : r.last < r.first ? 'down' : ''}">${r.last > r.first ? '▲' : r.last < r.first ? '▼' : '='}</b>`;
    const ins = [];
    const liked = rows.filter(r => r.fun != null).sort((a, b) => b.fun - a.fun);
    if (liked.length) ins.push(t('in_fav', nameOf(liked[0].id)));
    const grown = rows.filter(r => r.first != null && r.last > r.first).sort((a, b) => (b.last - b.first) - (a.last - a.first));
    if (grown.length) ins.push(t('in_grow', nameOf(grown[0].id), grown[0].last - grown[0].first));
    const low = liked.filter(r => r.fun < 1.8);
    if (low.length) ins.push(t('in_hard', nameOf(low[low.length - 1].id)));
    return `<h3 class="sec">${t('in_title')}</h3><p class="p-note">${t('in_desc')}</p>
      ${ins.length ? `<ul class="in-list">${ins.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}
      <div class="in-table"><div class="in-row in-headrow"><span>${t('in_game')}</span><span>${t('in_plays')}</span><span>${t('in_fun')}</span><span>${t('in_acc')}</span><span>${t('in_stage')}</span></div>
      ${rows.map(r => `<div class="in-row"><span>${nameOf(r.id)}</span><span>${r.plays}</span><span class="in-face">${face(r.fun)}</span><span class="in-trend">${trend(r)}</span><span>${r.lv}</span></div>`).join('')}</div>
      <p class="p-note">${t('in_note')}</p>`;
  });
})();
