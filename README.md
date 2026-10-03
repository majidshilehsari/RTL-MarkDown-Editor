<div align="center">

# RTL Markdown Editor

**A Markdown editor built for right-to-left writers — it fixes the broken direction of numbers, slashes and punctuation that AI assistants produce in Persian, Arabic and other RTL text.**

🇮🇷 فارسی · 🌍 English · 🇸🇦 العربية

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Deploy your own](https://vercel.com/new/clone?repository-url=https://github.com/majidshilehsari/RTL-MarkDown-Editor) ·
[Report a bug](https://github.com/majidshilehsari/RTL-MarkDown-Editor/issues)

</div>

---

## English

### Why this exists

Copy an answer from an AI chat into a Persian or Arabic document and you often get mangled text: numbers and dates such as `1403/02/15` flip around, parentheses face the wrong way, invisible bidi control characters sneak in, and Arabic variants of Persian letters (`ي`, `ك`) break search and spell-check. This editor cleans all of that with a single button, and gives you a live Markdown preview while you work.

### Features

- **Three view modes** — Preview (default), Edit, and a resizable Split view.
- **One-click direction fix** — removes bidi control characters, normalises Arabic↔Persian letters, repairs mirrored brackets and punctuation, converts digits and ZWNJ spacing.
- **Quick action bar** — Clear, Paste, Clear&Paste, Copy, and the direction fix, each colour-coded.
- **Undo / Redo** for *every* action (typing, pasting, clearing, file open, drag & drop), up to 200 steps.
- **Zoom controls** — buttons plus a slider (60 %–200 %) that scale both editor and preview.
- **Syntax-highlighted code blocks** with a language label and a copy button, plus a copy button on every table (copied as TSV, ready for Excel or Sheets).
- **Table tools** — build a table from rows/columns/alignment, or convert pasted CSV/TSV.
- **File handling** — open with the toolbar, `Ctrl/Cmd+O`, or drag & drop `.md` / `.markdown` / `.txt`; download as Markdown or HTML.
- **Three UI languages** — Persian, English, Arabic, with automatic direction switching.
- Autosave to the browser, light/dark theme, emoji picker, font size and line-height settings, RTL-safe copy for chat apps.

### Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl/Cmd + B` / `I` | Bold / Italic |
| `Ctrl/Cmd + Shift + X` | Strikethrough |
| `Ctrl/Cmd + K` | Link |
| `Ctrl/Cmd + E` | Code block |
| `Ctrl/Cmd + Z` / `Y` | Undo / Redo |
| `Ctrl/Cmd + O` | Open file |
| `Ctrl/Cmd + V` | Paste (never shows a browser confirmation) |

### Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

```bash
npm run build && npm start   # production build
```

### Tech stack

Next.js 14 (App Router) · React 18 · marked · DOMPurify · highlight.js — no backend, everything runs in the browser and your text never leaves your machine.

### Contributing

Translations and bug reports are very welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). Adding a language is just one file: `lib/i18n.js`.

### License

[MIT](LICENSE) © Majid Shilehsari

---

<div dir="rtl">

## فارسی

### چرا این ابزار؟

وقتی جواب یک هوش مصنوعی را در متن فارسی کپی می‌کنید، معمولاً اعداد و تاریخ‌های اسلش‌دار مثل `۱۴۰۳/۰۲/۱۵` جابه‌جا می‌شوند، پرانتزها برعکس می‌افتند، نویسه‌های کنترلی نامرئی وارد متن می‌شوند و حروف عربی (`ي` و `ك`) جست‌وجو را خراب می‌کنند. این ویرایشگر همهٔ اینها را با یک دکمه اصلاح می‌کند و هم‌زمان پیش‌نمایش زندهٔ مارک‌داون را نشان می‌دهد.

### امکانات

- **سه حالت نمایش:** پیش‌نمایش (پیش‌فرض)، ویرایش و حالت تقسیم با دیوایدر قابل‌کشیدن
- **دکمهٔ «حل مسئله چپ‌به‌راست بودن اعداد اسلش‌دار»** برای اصلاح کامل جهت متن
- **نوار دسترسی سریع رنگی:** پاک کردن، چسباندن، پاک کردن و چسباندن، کپی و اصلاح جهت
- **بازگرداندن/انجام دوباره برای همهٔ عملیات** (تا ۲۰۰ مرحله)
- **زوم متن** با دکمه و اهرم (۶۰٪ تا ۲۰۰٪) روی ویرایشگر و پیش‌نمایش
- **بلاک کد رنگی** با نام زبان و دکمهٔ کپی، و **دکمهٔ کپی روی جدول‌ها** (خروجی TSV برای اکسل)
- **ابزار جدول:** ساخت جدول و تبدیل CSV/TSV
- **باز کردن فایل** با دکمه، `Ctrl+O` یا کشیدن‌ورها‌کردن فایل، و دانلود خروجی MD/HTML
- **سه زبان رابط کاربری:** فارسی، انگلیسی، عربی با تغییر خودکار جهت
- ذخیرهٔ خودکار در مرورگر، تم روشن/تاریک، ایموجی، تنظیم قلم و فاصلهٔ خطوط

### اجرای محلی

```bash
npm install
npm run dev
```

سپس `http://localhost:3000` را باز کنید.

### مجوز

[MIT](LICENSE) — مجید شیله‌سری

</div>

---

<div dir="rtl">

## العربية

محرر ماركداون مخصص للكتابة من اليمين إلى اليسار: يصلح اتجاه الأرقام والشرطات وعلامات الترقيم التي تفسدها مخرجات الذكاء الاصطناعي، مع معاينة حية، وتلوين الأكواد، وأزرار نسخ للجداول والأكواد، وواجهة بثلاث لغات (العربية والفارسية والإنجليزية).

```bash
npm install
npm run dev
```

الرخصة: [MIT](LICENSE)

</div>
