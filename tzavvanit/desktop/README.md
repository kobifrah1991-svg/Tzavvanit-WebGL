# צבעונית למחשב (Windows / macOS)

עטיפת [Electron](https://www.electronjs.org) למשחק שב-`tzavvanit/www`. אין שרת: החלון טוען את `index.html` מתוך הקבצים, וההתקדמות נשמרת במחשב.

## הרצה מקומית

```bash
npm ci
npm start
```

## בנייה

- Windows: `npm run dist:win` → `dist/Tzivonit-Setup-<גרסה>.exe` (מתקין) ו-`dist/Tzivonit-Portable-<גרסה>.exe` (בלי התקנה).
- macOS: רק על Mac, `npm run dist:mac` → `dist/Tzivonit-<גרסה>-mac.dmg` (universal: Intel + Apple Silicon).

במחשב עם נתיב בעברית, להריץ מתוך כונן `subst` (למשל `T:\desktop`) ועם `TMP=C:\gtmp`.

## בנייה ושחרור ב-GitHub Actions

`.github/workflows/desktop-build.yml` בונה את שתי הגרסאות בכל דחיפה שנוגעת במשחק. דחיפת תג `desktop-v<גרסה>` יוצרת **טיוטת** Release עם הקבצים (ועם ה-APK מענף `downloads`, אם הוא שם). מפרסמים את הטיוטה ידנית ב-GitHub.

## חתימה

בלי הסודות הבאים הבנייה **לא חתומה**:

| מה | סודות ב-GitHub (Settings → Secrets → Actions) |
|---|---|
| Windows: תעודת חתימת קוד (OV/EV) | `WIN_CSC_LINK` (קובץ ‎.pfx ב-base64), `WIN_CSC_KEY_PASSWORD` |
| macOS: תעודת Developer ID Application | `MAC_CSC_LINK` (קובץ ‎.p12 ב-base64), `MAC_CSC_KEY_PASSWORD` |
| macOS: notarization | `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` |

תעודת Developer ID דורשת חברות ב-Apple Developer Program (‏99$ לשנה). כשהסודות קיימים, אותו workflow חותם ומאשר (notarize) בלי שינוי קוד.
