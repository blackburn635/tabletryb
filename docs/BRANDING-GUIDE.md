# TableTryb Branding & Asset Integration Guide

## 1. Logo & Favicon Files

Place all assets in `frontend/public/assets/`:

```
frontend/public/assets/
├── logo-light.svg        # Full logo (mark + wordmark) for light backgrounds
├── logo-dark.svg         # Full logo for dark backgrounds / footer / hero
├── logo-icon.svg         # Icon only (square, no text) — used in nav, sidebar
├── logo-social.png       # 1200×630px — Open Graph / social media sharing
├── favicon.ico           # 16×16 + 32×32 multi-size .ico
├── favicon-16x16.png     # 16×16 PNG
├── favicon-32x32.png     # 32×32 PNG
├── apple-touch-icon.png  # 180×180 PNG — iOS home screen
├── logo-192.png          # 192×192 PNG — Android / PWA
├── logo-512.png          # 512×512 PNG — PWA splash
└── stores/               # (Optional) grocery store logos
    ├── kroger.svg
    ├── heb.svg
    └── ...
```

### File Naming Convention

Use **exactly** these filenames — they're referenced in `branding.ts`, `index.html`, and component code. No changes to source code needed if you follow these names.

---

## 2. Color Palette

When you're ready to set your color palette, provide colors in this format (paste it and I'll wire it in):

```
PRIMARY:          #______   (main brand color — buttons, links, active states)
PRIMARY_LIGHT:    #______   (lighter variant — hover highlights, badges)
PRIMARY_DARK:     #______   (darker variant — hover on buttons, headings)
SECONDARY:        #______   (accent color — CTAs that contrast with primary)
SECONDARY_LIGHT:  #______   (lighter accent — subtle highlights)
ACCENT:           #______   (tertiary color — special UI elements)
BACKGROUND:       #______   (page background)
BACKGROUND_ALT:   #______   (slightly different bg — cards, alternating rows)
SURFACE:          #______   (card/modal/panel backgrounds — usually white or near-white)
TEXT:             #______   (primary text color)
TEXT_MUTED:       #______   (secondary/helper text)
TEXT_INVERSE:     #______   (text on dark/colored backgrounds)
BORDER:           #______   (subtle borders and dividers)
NAV_GLASS:        rgba(__, __, __, 0.92)   (frosted nav bar — use your BACKGROUND rgb values)
SUCCESS:          #______   (positive feedback — default: #059669)
WARNING:          #______   (caution — default: #D97706)
ERROR:            #______   (errors — default: #DC2626)
```

These map 1:1 to CSS custom properties. I'll update `themes.ts` and your palette is live instantly.

### If you want multiple palettes (e.g., a dark mode):

Provide a second block with a palette name:

```
PALETTE NAME: "Ocean Night"
PRIMARY: #...
...
```

---

## 3. Font Customization (Optional)

Default fonts are:
- **Sans-serif:** Inter (headings, UI, body)
- **Serif:** Crimson Pro (optional — recipe descriptions, quotes)

To change, provide:
```
FONT_SANS: "Your Font Name"
FONT_SERIF: "Your Serif Font" (or "none" to skip)
GOOGLE_FONTS_URL: https://fonts.googleapis.com/css2?family=...
```

I'll update `index.html` and `themes.ts`.

---

## 4. Where Each Asset Appears

| Asset | Where it shows |
|-------|---------------|
| `logo-icon.svg` | Nav bar, sidebar, mobile header, browser tab (as fallback) |
| `logo-light.svg` | Marketing pages header, login page |
| `logo-dark.svg` | Footer, dark hero sections, email templates |
| `logo-social.png` | Link previews (Slack, Twitter, iMessage, etc.) |
| `favicon.ico` | Browser tab |
| `apple-touch-icon.png` | iOS "Add to Home Screen" |
| `logo-192.png` / `logo-512.png` | Android/PWA home screen icon |
| Color palette | Every UI element — buttons, cards, backgrounds, text |

---

## 5. Quick Start

1. Drop your files into `frontend/public/assets/` using the names above
2. Paste your color codes in the format from Section 2
3. (Optional) Specify custom fonts
4. Push to `main` — Amplify rebuilds automatically

No code changes required for any of these steps.
