'use strict';
// Card art for the home screen: a small picture of each game's actual screen,
// so the child sees what they are choosing before they tap.
(() => {
  const W = (bg, body) => `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="320" height="200" fill="${bg}"/>${body}</svg>`;
  const pad = (x, y, w, h, c, dark) => `<rect x="${x}" y="${y + 5}" width="${w}" height="${h}" rx="14" fill="${dark}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${c}"/>`;
  const card = (x, y, w, h) => `<rect x="${x}" y="${y + 4}" width="${w}" height="${h}" rx="16" fill="#cde6e1"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="#fff"/>`;
  const blob = (cx, cy, r) => `<ellipse cx="${cx}" cy="${cy + r * 0.9}" rx="${r * 0.8}" ry="${r * 0.12}" fill="rgba(18,59,74,.18)"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.8}" fill="#ff9f86"/>
    <circle cx="${cx - r * 0.32}" cy="${cy - r * 0.12}" r="${r * 0.27}" fill="#fff"/><circle cx="${cx + r * 0.32}" cy="${cy - r * 0.12}" r="${r * 0.27}" fill="#fff"/>
    <circle cx="${cx - r * 0.3}" cy="${cy - r * 0.08}" r="${r * 0.13}" fill="#123b4a"/><circle cx="${cx + r * 0.34}" cy="${cy - r * 0.08}" r="${r * 0.13}" fill="#123b4a"/>
    <path d="M${cx - r * 0.15} ${cy + r * 0.3}q${r * 0.15} ${r * 0.15} ${r * 0.3} 0" stroke="#8a3324" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  const SH = {
    circle: (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`,
    square: (x, y, r, c) => `<rect x="${x - r}" y="${y - r}" width="${r * 2}" height="${r * 2}" rx="3" fill="${c}"/>`,
    tri: (x, y, r, c) => `<path d="M${x} ${y - r}L${x + r} ${y + r * 0.8}H${x - r}z" fill="${c}"/>`,
  };
  const drop = (x, y, s, c) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0-18C-6-7-11-2-11 5a11 11 0 0 0 22 0C11-2 6-7 0-18z" fill="${c}"/>`;

  TZ.previews = {
    simon: W('#bdf0ff', `<circle cx="270" cy="34" r="20" fill="#ffb627"/>
      <path d="M0 92Q80 82 160 92T320 88V200H0z" fill="#2ec4b6"/><path d="M0 110Q100 98 200 112T320 106V200H0z" fill="#ffe3a8"/>
      ${blob(160, 74, 30)}
      ${pad(62, 122, 94, 30, '#ff6f59', '#d9503c')}${pad(164, 122, 94, 30, '#ffb627', '#d9921a')}
      ${pad(62, 160, 94, 30, '#2ec4b6', '#1e9a8f')}${pad(164, 160, 94, 30, '#3a86ff', '#2266d6')}
      <rect x="164" y="118" width="94" height="38" rx="16" fill="none" stroke="#fff" stroke-width="5"/>`),
    stroop: W('#fff1ec', `<rect x="40" y="16" width="240" height="30" rx="12" fill="#123b4a"/>
      <rect x="110" y="26" width="100" height="10" rx="5" fill="#fff" opacity=".85"/>
      ${card(40, 56, 240, 70)}<text x="160" y="106" text-anchor="middle" font-size="40" font-weight="900" font-family="Arial" fill="#ff4d4d">כחול</text>
      ${pad(40, 138, 114, 22, '#ff4d4d', '#c43a3a')}${pad(166, 138, 114, 22, '#ffc21a', '#cf9a10')}
      ${pad(40, 168, 114, 22, '#22b04b', '#178a39')}${pad(166, 168, 114, 22, '#2f6bff', '#2152cc')}`),
    rain: W('#d7f3ff', `<rect width="320" height="200" fill="#bdf0ff"/><rect y="120" width="320" height="80" fill="#e6fbf8"/>
      <rect x="112" y="12" width="96" height="26" rx="13" fill="#fff"/><circle cx="186" cy="25" r="8" fill="#2f6bff"/><rect x="126" y="21" width="44" height="8" rx="4" fill="#123b4a"/>
      ${drop(70, 70, 1, '#2f6bff')}${drop(130, 112, 0.9, '#ff4d4d')}${drop(220, 60, 1.1, '#2f6bff')}${drop(265, 118, 0.9, '#ffc21a')}${drop(175, 140, 1, '#2f6bff')}${drop(40, 140, 0.8, '#22b04b')}
      <path d="M130 162h80l-8 30h-64z" fill="#123b4a"/><rect x="134" y="168" width="72" height="7" fill="#2f6bff"/>
      <circle cx="175" cy="150" r="3" fill="#2f6bff"/><circle cx="168" cy="146" r="2" fill="#2f6bff"/>`),
    lab: W('#fff4e8', `${card(40, 14, 240, 116)}
      <path d="M126 36c22-12 52-10 66 6 14 18 8 46-12 56-24 12-58 6-68-14-8-16-2-38 14-48z" fill="#8e44d6"/>
      <text x="160" y="80" text-anchor="middle" font-size="30" font-weight="900" font-family="Arial" fill="#fff">?</text>
      ${['#ff4d4d', '#ffc21a', '#2f6bff', '#ffffff', '#3a3a3a'].map((c, i) => `${card(24 + i * 56, 142, 48, 48)}<circle cx="${48 + i * 56}" cy="164" r="14" fill="${c}" stroke="rgba(18,59,74,.18)" stroke-width="3"/>`).join('')}
      <rect x="22" y="138" width="52" height="56" rx="18" fill="none" stroke="#ff8a3d" stroke-width="4"/><rect x="134" y="138" width="52" height="56" rx="18" fill="none" stroke="#ff8a3d" stroke-width="4"/>`),
    pairs: W('#f1e9ff', Array.from({ length: 12 }, (_, i) => {
      const x = 34 + (i % 4) * 66, y = 12 + Math.floor(i / 4) * 62;
      const up = [1, 6, 9].includes(i);
      const face = i === 1 || i === 6 ? SH.circle(x + 26, y + 26, 14, '#ff6f59') : SH.tri(x + 26, y + 26, 14, '#3a86ff');
      return up ? `${card(x, y, 52, 52)}${face}` : `<rect x="${x}" y="${y + 4}" width="52" height="52" rx="14" fill="rgba(0,0,0,.18)"/><rect x="${x}" y="${y}" width="52" height="52" rx="14" fill="#2ec4b6"/><circle cx="${x + 26}" cy="${y + 26}" r="8" fill="rgba(255,255,255,.35)"/>`;
    }).join('') + `<rect x="30" y="70" width="60" height="60" rx="16" fill="none" stroke="#2ec4b6" stroke-width="4"/><rect x="162" y="70" width="60" height="60" rx="16" fill="none" stroke="#2ec4b6" stroke-width="4"/>`),
    math: W('#fff2e2', `${card(40, 14, 240, 86)}<text x="160" y="76" text-anchor="middle" direction="ltr" unicode-bidi="embed" font-size="36" font-weight="900" font-family="Arial" fill="#123b4a">7 × 8 = ?</text>
      ${[[40, 112, '54'], [166, 112, '56'], [40, 154, '48'], [166, 154, '63']].map(([x, y, v]) => `${card(x, y, 114, 34)}<text x="${x + 57}" y="${y + 24}" text-anchor="middle" font-size="20" font-weight="900" font-family="Arial" fill="#123b4a">${v}</text>`).join('')}
      <rect x="164" y="110" width="118" height="38" rx="18" fill="none" stroke="#22b04b" stroke-width="4"/>`),
    pattern: W('#f2ecff', `${card(20, 30, 280, 74)}
      ${SH.circle(52, 67, 13, '#ff4d4d')}${SH.square(94, 67, 13, '#2f6bff')}${SH.circle(136, 67, 13, '#ff4d4d')}${SH.square(178, 67, 13, '#2f6bff')}${SH.circle(220, 67, 13, '#ff4d4d')}
      <rect x="246" y="50" width="36" height="36" rx="10" fill="#f2ecff" stroke="#9b6dff" stroke-width="3" stroke-dasharray="5 4"/><text x="264" y="76" text-anchor="middle" font-size="22" font-weight="900" font-family="Arial" fill="#9b6dff">?</text>
      ${[[20, 0], [92, 1], [164, 2], [236, 3]].map(([x, k]) => `${card(x, 128, 64, 52)}${[SH.square(x + 32, 154, 13, '#2f6bff'), SH.circle(x + 32, 154, 13, '#22b04b'), SH.tri(x + 32, 154, 13, '#ff4d4d'), SH.square(x + 32, 154, 13, '#ffc21a')][k]}`).join('')}`),
    odd: W('#e6f7ec', `${card(70, 10, 180, 180)}` + Array.from({ length: 25 }, (_, i) => {
      const x = 92 + (i % 5) * 34, y = 32 + Math.floor(i / 5) * 34;
      return `<rect x="${x - 13}" y="${y - 13}" width="26" height="26" rx="8" fill="${i === 17 ? '#62d281' : '#22b04b'}"/>`;
    }).join('') + `<circle cx="160" cy="134" r="20" fill="none" stroke="#ff8a3d" stroke-width="4"/>`),
    beat: W('#e7f0ff', `<circle cx="160" cy="82" r="66" fill="none" stroke="#8cc0ff" stroke-width="6" opacity=".7"/>
      <circle cx="160" cy="82" r="50" fill="#2f6bff"/><circle cx="160" cy="76" r="44" fill="#8cc0ff"/><circle cx="160" cy="76" r="30" fill="#b9d8ff"/>
      <path d="M120 14l22 30M200 14l-22 30" stroke="#ffb627" stroke-width="7" stroke-linecap="round"/>
      <rect x="60" y="164" width="200" height="12" rx="6" fill="#cde6e1"/><rect x="158" y="160" width="4" height="20" fill="#123b4a"/><circle cx="172" cy="170" r="9" fill="#22b04b"/>
      ${Array.from({ length: 10 }, (_, i) => `<circle cx="${70 + i * 20}" cy="194" r="5" fill="${i < 7 ? (i === 3 ? '#ffc21a' : '#22b04b') : '#cde6e1'}"/>`).join('')}`),
  };
})();
