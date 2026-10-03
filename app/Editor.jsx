'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/common';
import { fixRTLText, wrapForRTL, isMixedDirection } from '../lib/bidi';
import { renderMarkdown, copyTargetText } from '../lib/markdown';

function sanitizeHtml(raw) {
  // DOMPurify فقط در مرورگر در دسترس است؛ هنگام رندر اولیه (SSR) بدون پاک‌سازی برگردانده می‌شود
  if (typeof window === 'undefined') return raw;
  return DOMPurify.sanitize(raw);
}

const STORAGE_KEY = 'rtl-md-editor-v2';

const SAMPLE = `سلام! حتماً. یک جدول از رنگ‌ها به همراه کدهای عددی‌شون (RGB، Hex و نام رنگ) برات آماده کردم و کد HTML کاملش رو هم نوشتم.

## جدول رنگ‌ها و کدهای عددی

| نام رنگ | کد Hex | کد RGB | نمونه رنگ |
|---------|--------|--------|-----------|
| قرمز (Red) | #FF0000 | rgb(255, 0, 0) | 🔴 |
| سبز (Green) | #00FF00 | rgb(0, 255, 0) | 🟢 |
| آبی (Blue) | #0000FF | rgb(0, 0, 255) | 🔵 |
| زرد (Yellow) | #FFFF00 | rgb(255, 255, 0) | 🟡 |
| نارنجی (Orange) | #FFA500 | rgb(255, 165, 0) | 🟠 |
| بنفش (Purple) | #800080 | rgb(128, 0, 128) | 🟣 |
| صورتی (Pink) | #FFC0CB | rgb(255, 192, 203) | 🌸 |
| مشکی (Black) | #000000 | rgb(0, 0, 0) | ⚫ |
| سفید (White) | #FFFFFF | rgb(255, 255, 255) | ⚪ |
| خاکستری (Gray) | #808080 | rgb(128, 128, 128) | 🩶 |

## کد HTML کامل

\`\`\`html
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>جدول رنگ‌ها و کدهای عددی</title>
    <style>
        body {
            font-family: 'Tahoma', sans-serif;
            background-color: #f4f4f4;
            display: flex;
            justify-content: center;
            padding: 40px 20px;
        }

        table {
            border-collapse: collapse;
            width: 100%;
            max-width: 700px;
            background-color: #fff;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border-radius: 10px;
            overflow: hidden;
        }

        caption {
            font-size: 1.4em;
            font-weight: bold;
            padding: 15px;
            background-color: #333;
            color: #fff;
        }

        th, td {
            padding: 12px 15px;
            text-align: center;
            border-bottom: 1px solid #ddd;
        }

        thead th {
            background-color: #444;
            color: #fff;
            font-size: 1em;
        }

        tbody tr:hover {
            background-color: #f1f1f1;
        }

        .swatch {
            display: inline-block;
            width: 40px;
            height: 25px;
            border-radius: 5px;
            border: 1px solid #999;
        }

        /* رنگ نمونه‌ها */
        .red    { background-color: #FF0000; }
        .green  { background-color: #00FF00; }
        .blue   { background-color: #0000FF; }
        .yellow { background-color: #FFFF00; }
        .orange { background-color: #FFA500; }
        .purple { background-color: #800080; }
        .pink   { background-color: #FFC0CB; }
        .black  { background-color: #000000; }
        .white  { background-color: #FFFFFF; }
        .gray   { background-color: #808080; }
    </style>
</head>
<body>

    <table>
        <caption>🎨 جدول رنگ‌ها و کدهای عددی</caption>
        <thead>
            <tr>
                <th>نام رنگ</th>
                <th>کد Hex</th>
                <th>کد RGB</th>
                <th>نمونه رنگ</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>قرمز (Red)</td>
                <td>#FF0000</td>
                <td>rgb(255, 0, 0)</td>
                <td><span class="swatch red"></span></td>
            </tr>
            <tr>
                <td>سبز (Green)</td>
                <td>#00FF00</td>
                <td>rgb(0, 255, 0)</td>
                <td><span class="swatch green"></span></td>
            </tr>
            <tr>
                <td>آبی (Blue)</td>
                <td>#0000FF</td>
                <td>rgb(0, 0, 255)</td>
                <td><span class="swatch blue"></span></td>
            </tr>
            <tr>
                <td>زرد (Yellow)</td>
                <td>#FFFF00</td>
                <td>rgb(255, 255, 0)</td>
                <td><span class="swatch yellow"></span></td>
            </tr>
            <tr>
                <td>نارنجی (Orange)</td>
                <td>#FFA500</td>
                <td>rgb(255, 165, 0)</td>
                <td><span class="swatch orange"></span></td>
            </tr>
            <tr>
                <td>بنفش (Purple)</td>
                <td>#800080</td>
                <td>rgb(128, 0, 128)</td>
                <td><span class="swatch purple"></span></td>
            </tr>
            <tr>
                <td>صورتی (Pink)</td>
                <td>#FFC0CB</td>
                <td>rgb(255, 192, 203)</td>
                <td><span class="swatch pink"></span></td>
            </tr>
            <tr>
                <td>مشکی (Black)</td>
                <td>#000000</td>
                <td>rgb(0, 0, 0)</td>
                <td><span class="swatch black"></span></td>
            </tr>
            <tr>
                <td>سفید (White)</td>
                <td>#FFFFFF</td>
                <td>rgb(255, 255, 255)</td>
                <td><span class="swatch white"></span></td>
            </tr>
            <tr>
                <td>خاکستری (Gray)</td>
                <td>#808080</td>
                <td>rgb(128, 128, 128)</td>
                <td><span class="swatch gray"></span></td>
            </tr>
        </tbody>
    </table>

</body>
</html>
\`\`\`

### ویژگی‌های این کد:
- ✅ **راست‌چین (RTL)** برای زبان فارسی
- ✅ **نمونه رنگ واقعی** در کنار هر ردیف
- ✅ **افکت hover** روی ردیف‌ها
- ✅ **طراحی ریسپانسیو** و مدرن
- ✅ **کد Hex و RGB** هر رنگ

اگه بخوای می‌تونم رنگ‌های بیشتری اضافه کنم، یا ستون‌های دیگه‌ای (مثل کد HSL یا CMYK) هم بهش اضافه کنم. 😊
`;

const EMOJIS = [
  '😀','😁','😂','🤣','😊','😍','🤔','😎','🥳','😢','😡','👍','👎','👏','🙏','💪',
  '🎉','❤️','🔥','⭐','✅','❌','⚠️','📌','✏️','📝','💡','🔍','🔧','📊','📈','🗓️',
  '⏰','🚀','💯','🤝','👀','🗣️','🌍','🇮🇷','💻','📱','🖥️','💾','🔗','⚙️',
];

const TABLE_ALIGNS = {
  right: '---:',
  center: ':---:',
  left: ':---',
  none: '---',
};

function buildTable(rows, cols, align) {
  const mark = TABLE_ALIGNS[align] || '---';
  const head = Array.from({ length: cols }, (_, i) => `عنوان ${i + 1}`).join(' | ');
  const sep = Array.from({ length: cols }, () => mark).join(' | ');
  const body = Array.from({ length: rows - 1 }, () =>
    Array.from({ length: cols }, () => ' ').join(' | ')
  ).join('\n');
  return `| ${head} |\n| ${sep} |\n${body ? `| ${body.replace(/\n\|/g, '\n|')} |` : ''}`.trimEnd();
}

function tsvToTable(tsv) {
  return tsv
    .trim()
    .split(/\r?\n/)
    .map((line) => {
      const cells = line.split('\t').map((c) => c.replace(/\|/g, '\\|').trim());
      return `| ${cells.join(' | ')} |`;
    })
    .join('\n');
}

const countWords = (t) => (t.trim() ? t.trim().split(/\s+/).length : 0);
const countCharsNoSpace = (t) => t.replace(/\s+/g, '').length;

export default function Editor() {
  const [text, setText] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [theme, setTheme] = useState('light');
  const [mode, setMode] = useState('preview'); // split | edit | preview — پیش‌فرض: پیش‌نمایش
  const [showTable, setShowTable] = useState(false);
  const [tableTab, setTableTab] = useState('make');
  const [tRows, setTRows] = useState(4);
  const [tCols, setTCols] = useState(3);
  const [tAlign, setTAlign] = useState('right');
  const [tsvInput, setTsvInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [zoom, setZoom] = useState(100);
  const [menuOpen, setMenuOpen] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [clipPerm, setClipPerm] = useState('unknown');
  const [showClipHint, setShowClipHint] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(true);
  const [inFrame, setInFrame] = useState(false);
  const [lineHeight, setLineHeight] = useState(1.7);
  const [autoClean, setAutoClean] = useState(true);
  const [rliCopy, setRliCopy] = useState(true);
  const [autosave, setAutosave] = useState(true);
  const [saveState, setSaveState] = useState('');
  const [split, setSplit] = useState(25); // percent for editor (default 1:3 — editor thin, preview 3x wider)
  const [info, setInfo] = useState({ words: 0, chars: 0, line: 1, col: 1 });
  const [dragActive, setDragActive] = useState(false);
  const [dragValid, setDragValid] = useState(false);

  const taRef = useRef(null);
  const resizeRef = useRef(null);
  const saveTimer = useRef(null);
  const dragDepth = useRef(0);
  const pasteCatcherRef = useRef(null);
  const previewRef = useRef(null);
  const histRef = useRef({ stack: [], index: -1, lock: false, timer: null });
  const pendingPaste = useRef(null);

  // --- load initial ---
  useEffect(() => {
    let initial = '';
    try {
      initial = localStorage.getItem(STORAGE_KEY) ?? '';
    } catch {
      initial = '';
    }
    setText(initial || SAMPLE);
    setLoaded(true);
    try {
      setHintDismissed(localStorage.getItem('rtl-md-clip-hint') === 'off');
    } catch {
      setHintDismissed(false);
    }
    try {
      setInFrame(window.self !== window.top);
    } catch {
      setInFrame(true);
    }
  }, []);

  // --- تاریخچه‌ی بازگرداندن/انجام دوباره (برای همه‌ی عملیات، نه فقط تایپ) ---
  const syncHistoryFlags = () => {
    const h = histRef.current;
    setCanUndo(h.index > 0);
    setCanRedo(h.index < h.stack.length - 1);
  };

  useEffect(() => {
    if (!loaded) return;
    const h = histRef.current;
    if (h.lock) {
      h.lock = false;
      syncHistoryFlags();
      return;
    }
    clearTimeout(h.timer);
    h.timer = setTimeout(() => {
      if (h.stack[h.index] === text) return;
      h.stack = h.stack.slice(0, h.index + 1);
      h.stack.push(text);
      if (h.stack.length > 200) h.stack.shift();
      h.index = h.stack.length - 1;
      syncHistoryFlags();
    }, 350);
    return () => clearTimeout(h.timer);
  }, [text, loaded]);

  const undo = () => {
    const h = histRef.current;
    clearTimeout(h.timer);
    if (h.index <= 0) {
      setSaveState('چیزی برای بازگرداندن نیست');
      return;
    }
    h.index -= 1;
    h.lock = true;
    setText(h.stack[h.index]);
    setSaveState('یک مرحله به عقب ↩️');
    syncHistoryFlags();
  };

  const redo = () => {
    const h = histRef.current;
    clearTimeout(h.timer);
    if (h.index >= h.stack.length - 1) {
      setSaveState('چیزی برای انجام دوباره نیست');
      return;
    }
    h.index += 1;
    h.lock = true;
    setText(h.stack[h.index]);
    setSaveState('یک مرحله به جلو ↪️');
    syncHistoryFlags();
  };

  // --- autosave ---
  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveTimer.current);
    setSaveState('در حال ذخیره…');
    saveTimer.current = setTimeout(() => {
      try {
        if (autosave) localStorage.setItem(STORAGE_KEY, text);
        setSaveState(autosave ? 'ذخیره شد ✓' : 'ذخیره خودکار خاموش');
      } catch {
        setSaveState('خطا در ذخیره');
      }
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [text, autosave, loaded]);

  // --- cursor info ---
  useEffect(() => {
    const t = text;
    const words = countWords(t);
    const chars = countCharsNoSpace(t);
    const upTo = t.slice(0, taRef.current?.selectionStart ?? t.length);
    const line = upTo.split('\n').length;
    const col = upTo.split('\n').pop().length + 1;
    setInfo({ words, chars, line, col });
  }, [text]);

  // --- render preview ---
  const html = useMemo(() => sanitizeHtml(renderMarkdown(text)), [text]);

  // --- کپی کد/جدول از داخل پیش‌نمایش (دکمه‌ها مستقیماً در HTML تولید می‌شوند) ---
  const onPreviewClick = useCallback(async (e) => {
    const btn = e.target.closest?.('.copy-btn');
    if (!btn) return;
    e.preventDefault();
    const value = copyTargetText(btn);
    const labelEl = btn.querySelector('.copy-label');
    const icoEl = btn.querySelector('.copy-ico');
    const original = labelEl ? labelEl.textContent : '';
    try {
      await navigator.clipboard.writeText(value);
      btn.classList.add('done');
      if (icoEl) icoEl.textContent = '✓';
      if (labelEl) labelEl.textContent = 'کپی شد';
      setSaveState('کپی شد ✓');
    } catch {
      btn.classList.add('failed');
      if (icoEl) icoEl.textContent = '⚠️';
      if (labelEl) labelEl.textContent = 'خطا';
    }
    setTimeout(() => {
      btn.classList.remove('done', 'failed');
      if (icoEl) icoEl.textContent = '📋';
      if (labelEl) labelEl.textContent = original;
    }, 1600);
  }, []);

  // --- generic selection transform ---
  const transformSelection = useCallback(
    (fn) => {
      const ta = taRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const before = text.slice(0, start);
      const sel = text.slice(start, end);
      const after = text.slice(end);
      const res = fn(before, sel, after, start, end);
      setText(res.text);
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(res.start, res.end);
      });
    },
    [text]
  );

  const wrap = (open, close = open, placeholder = 'متن') =>
    transformSelection((before, sel, after) => {
      const inner = sel || placeholder;
      const t = before + open + inner + close + after;
      const s = sel
        ? before.length + open.length
        : before.length + open.length + inner.length;
      return { text: t, start: s, end: s };
    });

  const lineOp = (prefix) =>
    transformSelection((before, sel, after, start, end) => {
      const target = sel || text.slice(start, end);
      const lines = target.split('\n');
      const changed = lines
        .map((l) => (l.startsWith(prefix.trim()) ? l.replace(prefix.trim(), '').replace(/^\s+/, '') : prefix + l))
        .join('\n');
      const t = before + changed + after;
      return { text: t, start: before.length, end: before.length + changed.length };
    });

  const insertAtCursor = (ins) =>
    transformSelection((before, sel, after, start, end) => {
      const t = before + ins + after;
      const s = start + ins.length;
      return { text: t, start: s, end: s };
    });

  const insertBlock = (ins) =>
    transformSelection((before, sel, after, start, end) => {
      const needNLBefore = before && !before.endsWith('\n');
      const needNLAfter = after && !after.startsWith('\n');
      const t = before + (needNLBefore ? '\n' : '') + ins + (needNLAfter ? '\n' : '') + after;
      const s = (before.length + (needNLBefore ? 1 : 0) + ins.length);
      return { text: t, start: s, end: s };
    });

  // --- toolbar handlers ---
  const actions = {
    bold: () => wrap('**'),
    italic: () => wrap('*'),
    strike: () => wrap('~~'),
    code: () => wrap('`', '`', 'کد'),
    codeBlock: () => insertBlock('```\nکد شما اینجا\n```'),
    quote: () => lineOp('> '),
    ul: () => lineOp('- '),
    ol: () => lineOp('1. '),
    task: () => lineOp('- [ ] '),
    h1: () => lineOp('# '),
    h2: () => lineOp('## '),
    h3: () => lineOp('### '),
    hr: () => insertBlock('---'),
    link: () =>
      transformSelection((before, sel, after) => {
        const inner = sel || 'متن لینک';
        const t = before + `[${inner}](https://) ` + after;
        const urlStart = before.length + inner.length + 3;
        const urlEnd = urlStart + 'https://'.length;
        return { text: t, start: urlStart, end: urlEnd };
      }),
    image: () =>
      transformSelection((before, sel, after) => {
        const inner = sel || 'توضیح تصویر';
        const t = before + `![${inner}](https://) ` + after;
        const urlStart = before.length + inner.length + 4;
        const urlEnd = urlStart + 'https://'.length;
        return { text: t, start: urlStart, end: urlEnd };
      }),
    fix: () =>
      transformSelection((before, sel, after) => {
        const target = sel || text.slice(0, text.length);
        const fixed = fixRTLText(target);
        const t = before + fixed + after;
        return { text: t, start: before.length, end: before.length + fixed.length };
      }),
    emoji: (e) => insertAtCursor(e),
    tableInsert: () => {
      if (tableTab === 'make') {
        insertAtCursor('\n' + buildTable(tRows, tCols, tAlign) + '\n');
      } else {
        insertAtCursor('\n' + tsvToTable(tsvInput) + '\n');
      }
      setShowTable(false);
      setTsvInput('');
    },
    undo: () => undo(),
    redo: () => redo(),
  };

  // --- copy / download ---
  const buildClipboardText = useCallback(
    (t) => (rliCopy ? wrapForRTL(t) : t),
    [rliCopy]
  );

  const copyText = async (t) => {
    try {
      await navigator.clipboard.writeText(buildClipboardText(t));
      setSaveState('کپی شد ✓');
    } catch {
      setSaveState('خطا در کپی');
    }
  };

  const download = (content, filename, mime) => {
    const blob = new Blob([content], { type: mime + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.txt,.markdown';
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      const t = await f.text();
      setText(t);
    };
    input.click();
  };

  // --- drag-and-drop file open ---
  const isSupportedFile = (name) => /\.(md|markdown|txt)$/i.test(name || '');

  const checkDragValid = (e) => {
    const dt = e.dataTransfer;
    if (!dt) return false;
    const f = dt.files?.[0];
    if (f) return isSupportedFile(f.name);
    if (dt.items) {
      for (let i = 0; i < dt.items.length; i++) {
        const it = dt.items[i];
        if (it.kind !== 'file') continue;
        const file = it.getAsFile && it.getAsFile();
        if (file) return isSupportedFile(file.name);
        const t = (it.type || '').toLowerCase();
        return t.includes('markdown') || t.startsWith('text/') || t === '';
      }
    }
    return false;
  };

  const onDragEnter = (e) => {
    e.preventDefault();
    dragDepth.current += 1;
    setDragValid(checkDragValid(e));
    setDragActive(true);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    setDragValid(checkDragValid(e));
    setDragActive(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setDragActive(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f && isSupportedFile(f.name)) {
      f.text().then((t) => setText(t)).catch(() => setSaveState('خطا در خواندن فایل'));
    }
  };

  // --- اقدام‌های نوار دسترسی سریع (هدر دوم) ---
  const clean = useCallback((raw) => (autoClean ? fixRTLText(raw) : raw), [autoClean]);

  // وضعیت مجوز کلیپ‌بورد را دنبال می‌کنیم؛ اگر «granted» باشد، مرورگر دیگر دکمه‌ی Paste نشان نمی‌دهد
  useEffect(() => {
    let status;
    const update = () => setClipPerm(status.state);
    (async () => {
      try {
        status = await navigator.permissions.query({ name: 'clipboard-read' });
        update();
        status.onchange = update;
      } catch {
        setClipPerm('unknown');
      }
    })();
    return () => {
      if (status) status.onchange = null;
    };
  }, []);

  const readClipboard = async () => {
    let granted = false;
    try {
      const st = await navigator.permissions.query({ name: 'clipboard-read' });
      granted = st.state === 'granted';
      setClipPerm(st.state);
    } catch {
      /* فایرفاکس/سافاری این مجوز را گزارش نمی‌کنند */
    }
    const raw = await navigator.clipboard.readText();
    // اگر مجوز دائمی نبود یعنی مرورگر تاییدیه‌ی Paste را نشان داده است
    if (!granted && !hintDismissed) setShowClipHint(true);
    return clean(raw);
  };

  // اگر مرورگر خواندن مستقیم کلیپ‌بورد را اجازه ندهد، با یک فیلد مخفی و Ctrl+V ادامه می‌دهیم
  const fallbackPaste = (mode) => {
    pendingPaste.current = mode;
    const el = pasteCatcherRef.current;
    if (!el) return;
    el.value = '';
    el.focus();
    setSaveState('برای چسباندن Ctrl+V را بزنید');
  };

  const onCatcherPaste = (e) => {
    const mode = pendingPaste.current;
    if (!mode) return;
    e.preventDefault();
    pendingPaste.current = null;
    const data = clean(e.clipboardData.getData('text'));
    if (mode === 'replace') {
      setText(data);
      setSaveState('پاک و چسبانده شد ✓');
    } else {
      setText((prev) => prev + data);
      setSaveState('چسبانده شد ✓');
    }
    requestAnimationFrame(() => taRef.current?.focus());
  };

  const quickClear = () => {
    setText('');
    setSaveState('متن پاک شد ✓');
    requestAnimationFrame(() => taRef.current?.focus());
  };

  const quickPaste = async () => {
    try {
      const clip = await readClipboard();
      if (!clip) return;
      insertAtCursor(clip);
      setSaveState('چسبانده شد ✓');
    } catch {
      fallbackPaste('insert');
    }
  };

  const quickClearAndPaste = async () => {
    // اول فوری پاک می‌کنیم تا بدون هیچ مرحله‌ی اضافه، نتیجه بلافاصله دیده شود
    setText('');
    try {
      const clip = await readClipboard();
      setText(clip);
      setSaveState('پاک و چسبانده شد ✓');
      requestAnimationFrame(() => taRef.current?.focus());
    } catch {
      fallbackPaste('replace');
    }
  };

  const quickCopy = () => copyText(text);

  // --- paste auto-clean ---
  const onPaste = (e) => {
    if (!autoClean) return;
    const raw = e.clipboardData.getData('text');
    const cleaned = fixRTLText(raw);
    if (cleaned !== raw) {
      e.preventDefault();
      insertAtCursor(cleaned);
    }
  };

  // --- keyboard shortcuts ---
  const onKeyDown = (e) => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (e.key === 'Tab') {
      e.preventDefault();
      lineOp('  ');
      return;
    }
    if (ctrl && e.key.toLowerCase() === 'b') { e.preventDefault(); actions.bold(); }
    else if (ctrl && e.key.toLowerCase() === 'i') { e.preventDefault(); actions.italic(); }
    else if (ctrl && e.shiftKey && e.key.toLowerCase() === 'x') { e.preventDefault(); actions.strike(); }
    else if (ctrl && e.key.toLowerCase() === 'k') { e.preventDefault(); actions.link(); }
    else if (ctrl && e.key.toLowerCase() === 'e') { e.preventDefault(); actions.codeBlock(); }
    else if (ctrl && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); actions.undo(); }
    else if (ctrl && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); actions.redo(); }
  };

  // --- global shortcut: Ctrl/Cmd+O → باز کردن فایل ---
  useEffect(() => {
    const onGlobalKey = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && !e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        importFile();
      }
    };
    window.addEventListener('keydown', onGlobalKey);
    return () => window.removeEventListener('keydown', onGlobalKey);
  }, []);

  // --- divider drag ---
  const onDividerDown = (e) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const move = (ev) => {
      // در چیدمان RTL پنل ویرایش سمت راست است؛ اندازه را از لبه‌ی راست می‌سنجیم
      // تا کشیدنِ تقسیم‌کننده به چپ، پنل ویرایش را پهن‌تر کند.
      const pct = ((rect.right - ev.clientX) / rect.width) * 100;
      setSplit(Math.min(85, Math.max(15, pct)));
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const containerRef = useRef(null);

  const toggleTheme = () =>
    setTheme((t) => {
      const n = t === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', n);
      return n;
    });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return (
    <div
      className="editor-root"
      data-theme={theme}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* ===== نوار ابزار ===== */}
      <header className="toolbar">
        <div className="brand">
          <span className="logo">✍️</span>
          <div className="brand-text">
            <strong>ویرایشگر مارک‌داون</strong>
            <small>RTL Markdown Editor</small>
          </div>
        </div>

        <div className="mode-switch" role="group" aria-label="حالت نمایش">
          <button className={mode === 'split' ? 'on' : ''} onClick={() => setMode('split')}>تقسیم</button>
          <button className={mode === 'edit' ? 'on' : ''} onClick={() => setMode('edit')}>ویرایش</button>
          <button className={mode === 'preview' ? 'on' : ''} onClick={() => setMode('preview')}>پیش‌نمایش</button>
        </div>

        <div className="toolbar-right">
          <button
            className={`tool burger ${menuOpen ? 'open' : ''}`}
            title={menuOpen ? 'بستن منو' : 'باز کردن منو'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* ===== منوی همبرگری ===== */}
      {menuOpen && (
        <div className="menu-panel" role="menu">
          <button className="menu-item" onClick={() => { importFile(); setMenuOpen(false); }}>📂 باز کردن فایل <small>Ctrl+O</small></button>
          <button className="menu-item" onClick={() => { copyText(text); setMenuOpen(false); }}>📋 کپی کل متن</button>
          <button className="menu-item" onClick={() => { download(text, 'document.md', 'text/markdown'); setMenuOpen(false); }}>⬇️ دانلود مارک‌داون</button>
          <button className="menu-item" onClick={() => { download(sanitizeHtml(renderMarkdown(text)), 'document.html', 'text/html'); setMenuOpen(false); }}>🖨️ دانلود HTML</button>
          <div className="menu-sep" />
          <button className="menu-item danger" onClick={() => { quickClear(); setMenuOpen(false); }}>🗑️ پاک کردن همه</button>
          <button className="menu-item" onClick={() => { toggleTheme(); }}>{theme === 'light' ? '🌙 تم تیره' : '☀️ تم روشن'}</button>
          <button className="menu-item" onClick={() => { setShowSettings((v) => !v); setMenuOpen(false); }}>⚙️ تنظیمات</button>
        </div>
      )}

      {/* ===== هدر دوم ثابت: دسترسی سریع ===== */}
      <div className="quickbar" role="toolbar" aria-label="دسترسی سریع">
        {/* ناحیه‌ی راست: زوم */}
        <div className="qb-side qb-zoom">
          <button className="zoom-btn" title="کوچک‌تر کردن متن" onClick={() => setZoom((z) => Math.max(60, z - 10))}>➖</button>
          <input
            className="zoom-range"
            type="range"
            min="60"
            max="200"
            step="5"
            value={zoom}
            title="اهرم بزرگ‌نمایی متن"
            aria-label="بزرگ‌نمایی متن"
            onChange={(e) => setZoom(+e.target.value)}
          />
          <button className="zoom-btn" title="بزرگ‌تر کردن متن" onClick={() => setZoom((z) => Math.min(200, z + 10))}>➕</button>
          <button className="zoom-val" title="بازگشت به اندازه‌ی عادی" onClick={() => setZoom(100)}>{zoom}٪</button>
        </div>

        {/* ناحیه‌ی وسط: اقدام‌های اصلی */}
        <div className="qb-center">
          <button className="qbtn qbtn-red" title="پاک کردن کل متن (بدون تاییدیه)" onClick={quickClear}>🗑️ پاک کردن</button>
          <button className="qbtn qbtn-green" title="چسباندن از کلیپ‌بورد در محل نشانگر" onClick={quickPaste}>📥 چسباندن</button>
          <button className="qbtn qbtn-amber" title="پاک کردن کل متن و چسباندن محتوای کلیپ‌بورد" onClick={quickClearAndPaste}>♻️ پاک کردن و چسباندن</button>
          <button className="qbtn qbtn-blue" title="کپی کل متن ویرایشگر" onClick={quickCopy}>📋 کپی</button>
          <button
            className="qbtn qbtn-purple"
            title="حل مسئله چپ به راست بودن اعداد اسلش دار (اصلاح جهت متن فارسی)"
            onClick={actions.fix}
          >
            🔁 حل مسئله چپ به راست بودن اعداد اسلش دار
          </button>
        </div>

        {/* ناحیه‌ی چپ: بازگرداندن / انجام دوباره */}
        <div className="qb-side qb-history">
          <button
            className="hbtn"
            title="بازگرداندن آخرین تغییر (Ctrl+Z)"
            onClick={undo}
            disabled={!canUndo}
          >
            <span className="hico">↩️</span> بازگرداندن
          </button>
          <button
            className="hbtn"
            title="انجام دوباره‌ی تغییر بازگردانده‌شده (Ctrl+Y)"
            onClick={redo}
            disabled={!canRedo}
          >
            <span className="hico">↪️</span> انجام دوباره
          </button>
        </div>
      </div>

      {/* ===== پاپ‌اور جدول ===== */}
      {showTable && (
        <div className="popover table-popover">
          <div className="tabs">
            <button className={tableTab === 'make' ? 'on' : ''} onClick={() => setTableTab('make')}>ساخت جدول</button>
            <button className={tableTab === 'convert' ? 'on' : ''} onClick={() => setTableTab('convert')}>تبدیل CSV/TSV</button>
          </div>
          {tableTab === 'make' ? (
            <div className="table-make">
              <label>
                سطرها
                <input type="number" min="2" max="20" value={tRows}
                  onChange={(e) => setTRows(Math.max(2, Math.min(20, +e.target.value)))} />
              </label>
              <label>
                ستون‌ها
                <input type="number" min="1" max="10" value={tCols}
                  onChange={(e) => setTCols(Math.max(1, Math.min(10, +e.target.value)))} />
              </label>
              <label>
                تراز
                <select value={tAlign} onChange={(e) => setTAlign(e.target.value)}>
                  <option value="right">راست</option>
                  <option value="center">وسط</option>
                  <option value="left">چپ</option>
                  <option value="none">ساده</option>
                </select>
              </label>
              <button className="primary" onClick={actions.tableInsert}>درج جدول</button>
              <pre className="live-table">{buildTable(tRows, tCols, tAlign)}</pre>
            </div>
          ) : (
            <div className="table-convert">
              <textarea
                rows="5"
                placeholder={'متن جدا با تب (TSV) یا CSV را اینجا بچسبانید…\nمثلاً:\nنام\tقیمت\nقلم\t۵۰۰۰'}
                value={tsvInput}
                onChange={(e) => setTsvInput(e.target.value)}
              />
              <button className="primary" onClick={actions.tableInsert}>تبدیل به جدول</button>
            </div>
          )}
        </div>
      )}

      {/* ===== پاپ‌اور ایموجی ===== */}
      {showEmoji && (
        <div className="popover emoji-popover">
          {EMOJIS.map((e) => (
            <button key={e} className="emoji" onClick={() => actions.emoji(e)}>{e}</button>
          ))}
        </div>
      )}

      {/* ===== پاپ‌اور تنظیمات ===== */}
      {showSettings && (
        <div className="popover settings-popover">
          <label>
            اندازه قلم ویرایشگر
            <input type="range" min="12" max="28" value={fontSize}
              onChange={(e) => setFontSize(+e.target.value)} />
            <span>{fontSize}px</span>
          </label>
          <label>
            فاصله خطوط
            <input type="range" min="1.2" max="2.4" step="0.1" value={lineHeight}
              onChange={(e) => setLineHeight(+e.target.value)} />
            <span>{lineHeight}</span>
          </label>
          <label className="switch-row">
            <span>پاک‌سازی خودکار متن چسبانده‌شده</span>
            <input type="checkbox" checked={autoClean} onChange={(e) => setAutoClean(e.target.checked)} />
          </label>
          <label className="switch-row">
            <span>بسته‌بندی RTL هنگام کپی (برای اپ‌های چت)</span>
            <input type="checkbox" checked={rliCopy} onChange={(e) => setRliCopy(e.target.checked)} />
          </label>
          <label className="switch-row">
            <span>ذخیره خودکار (مرورگر)</span>
            <input type="checkbox" checked={autosave} onChange={(e) => setAutosave(e.target.checked)} />
          </label>
          <button className="primary" onClick={() => download(SAMPLE, 'نمونه.md', 'text/markdown')}>دانلود متن نمونه</button>
        </div>
      )}

      {/* ===== بدنه اصلی ===== */}
      <main className="body" ref={containerRef}>
        {(mode === 'split' || mode === 'edit') && (
          <section className="pane editor-pane" style={{ flex: mode === 'edit' ? '1' : undefined, width: mode === 'edit' ? '100%' : `${split}%` }}>
            <div className="format-bar" role="toolbar" aria-label="ابزار ویرایش">
              <button className="tool" title="برگردان (Ctrl+Z)" onClick={actions.undo}>↩️</button>
              <button className="tool" title="بازگردانی (Ctrl+Y)" onClick={actions.redo}>↪️</button>
              <div className="sep" />
              <button className="tool" title="تیتر ۱" onClick={actions.h1}>H1</button>
              <button className="tool" title="تیتر ۲" onClick={actions.h2}>H2</button>
              <button className="tool" title="تیتر ۳" onClick={actions.h3}>H3</button>
              <div className="sep" />
              <button className="tool" title="بولد (Ctrl+B)" onClick={actions.bold}><b>ب</b></button>
              <button className="tool" title="ایتالیک (Ctrl+I)" onClick={actions.italic}><i>ایت</i></button>
              <button className="tool" title="خط‌خورده (Ctrl+Shift+X)" onClick={actions.strike}><s>خط</s></button>
              <button className="tool" title="کد درون‌خطی" onClick={actions.code}>`کد`</button>
              <button className="tool" title="بلاک کد (Ctrl+E)" onClick={actions.codeBlock}>{'</>'}</button>
              <div className="sep" />
              <button className="tool" title="نقل‌قول" onClick={actions.quote}>❝</button>
              <button className="tool" title="لیست نقطه‌ای" onClick={actions.ul}>•</button>
              <button className="tool" title="لیست شماره‌دار" onClick={actions.ol}>۱.</button>
              <button className="tool" title="تکلیف" onClick={actions.task}>☑</button>
              <button className="tool" title="خط جداکننده" onClick={actions.hr}>―</button>
              <div className="sep" />
              <button className="tool" title="لینک (Ctrl+K)" onClick={actions.link}>🔗</button>
              <button className="tool" title="تصویر" onClick={actions.image}>🖼️</button>
              <button className="tool" title="ساخت جدول / تبدیل CSV" onClick={() => { setShowTable((s) => !s); setShowEmoji(false); }}>⬛</button>
              <button className="tool" title="ایموجی" onClick={() => { setShowEmoji((s) => !s); setShowTable(false); }}>😊</button>
            </div>
            <textarea
              ref={taRef}
              className="editor-area"
              dir="rtl"
              spellCheck="true"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              onPaste={onPaste}
              onSelect={() => setInfo((p) => p)}
              style={{ fontSize: `${Math.round((fontSize * zoom) / 100)}px`, lineHeight }}
              placeholder="متن مارک‌داون خود را اینجا بنویسید…"
            />
          </section>
        )}

        {mode === 'split' && (
          <div className="divider" onMouseDown={onDividerDown} title="کشیدن برای تغییر اندازه">
            <span>⋮</span>
          </div>
        )}

        {(mode === 'split' || mode === 'preview') && (
          <section className="pane preview-pane" style={{ flex: mode === 'preview' ? '1' : undefined, width: mode === 'preview' ? '100%' : `${100 - split}%` }}>
            <div
              ref={previewRef}
              className="preview-area markdown-body"
              dir="rtl"
              style={{ fontSize: `${Math.round((15 * zoom) / 100)}px` }}
              onClick={onPreviewClick}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </section>
        )}
      </main>

      {/* ===== نوار وضعیت ===== */}
      <footer className="statusbar">
        <span className="mode-info">
          {mode === 'edit' ? '✏️ ویرایش' : mode === 'preview' ? '👁️ پیش‌نمایش' : '✏️ ویرایش + 👁️ پیش‌نمایش'}
        </span>
        <span className="dot">•</span>
        <span className="hint">نوشتن سمت راست، نتیجه‌ی زنده سمت چپ</span>
        <span className="dot">•</span>
        <span>کلمات: <b>{info.words}</b></span>
        <span>نویسه: <b>{info.chars}</b></span>
        <span>خط <b>{info.line}</b> : ستون <b>{info.col}</b></span>
        {clipPerm === 'granted' && <span title="مرورگر اجازه‌ی خواندن کلیپ‌بورد را داده؛ دیگر تاییدیه‌ای نشان داده نمی‌شود">کلیپ‌بورد: مجاز ✓</span>}
        <span className="grow" />
        <span className={`save ${saveState.startsWith('خطا') ? 'err' : ''}`}>{saveState}</span>
      </footer>

      {/* ===== راهنمای حذف تاییدیه‌ی Paste مرورگر ===== */}
      {showClipHint && !hintDismissed && (
        <div className="clip-hint" role="status">
          <div className="clip-hint-body">
            <strong>آن پنجره‌ی کوچک «Paste» مال مرورگر است، نه این برنامه.</strong>
            <span>
              برای اینکه دیگر هرگز ظاهر نشود: روی آیکن کنار نشانی سایت کلیک کنید →
              بخش <b>Clipboard</b> را روی <b>Allow</b> بگذارید (یا در کروم نشانی
              <code>chrome://settings/content/clipboard</code> ).
              {inFrame && ' چون این صفحه داخل قاب (iframe) باز شده، بهتر است آن را در یک تب جداگانه باز کنید.'}
            </span>
          </div>
          <div className="clip-hint-actions">
            <button onClick={() => setShowClipHint(false)}>باشه</button>
            <button
              className="ghost"
              onClick={() => {
                try { localStorage.setItem('rtl-md-clip-hint', 'off'); } catch {}
                setHintDismissed(true);
                setShowClipHint(false);
              }}
            >
              دیگر نشان نده
            </button>
          </div>
        </div>
      )}

      {/* ===== گیرنده‌ی مخفی برای چسباندن در مرورگرهای بدون دسترسی مستقیم ===== */}
      <textarea
        ref={pasteCatcherRef}
        className="paste-catcher"
        tabIndex={-1}
        aria-hidden="true"
        onPaste={onCatcherPaste}
        onBlur={() => { pendingPaste.current = null; }}
      />

      {/* ===== نشانگر درگ‌اند‌دراپ ===== */}
      {dragActive && (
        <div className={`drop-overlay ${dragValid ? 'valid' : 'invalid'}`}>
          <div className="drop-box">
            {dragValid
              ? '📂 رها کنید — فایل پشتیبانی‌شده'
              : 'فقط فایل‌های .md و .txt مجاز است'}
          </div>
        </div>
      )}
    </div>
  );
}
