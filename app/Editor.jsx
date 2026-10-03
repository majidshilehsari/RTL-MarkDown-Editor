'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { fixRTLText, wrapForRTL, isMixedDirection } from '../lib/bidi';

marked.use({ gfm: true, breaks: true });

function sanitizeHtml(raw) {
  // DOMPurify فقط در مرورگر در دسترس است؛ هنگام رندر اولیه (SSR) بدون پاک‌سازی برگردانده می‌شود
  if (typeof window === 'undefined') return raw;
  return DOMPurify.sanitize(raw);
}

const STORAGE_KEY = 'rtl-md-editor-v1';

const SAMPLE = `# ویرایشگر مارک‌داون راست‌چین ✍️

به ویرایشگر خوش آمدید. **سمت راست بنویسید** و *سمت چپ* نتیجه را ببینید.

## چرا این ابزار؟
مشکل اصلی: هوش مصنوعی‌ها معمولاً **چپ‌به‌راست** می‌نویسند و متن فارسی را خراب می‌کنند.
کافی است دکمه‌ی **«اصلاح چپ‌به‌راست»** را در نوار ابزار بزنید یا متن را که چسباندید خودکار پاک‌سازی شود.

### نوار ابزار شامل:
- استایل متن: **بولد**، *ایتالیک*، ~~خط‌خورده~~
- تیترها، لیست‌ها، نقل‌قول و کد
- **ساخت جدول** و تبدیل CSV/TSV
- اصلاح جهت، ایموجی و تنظیمات ظاهری

## ساخت جدول
| محصول | قیمت | تعداد |
| :---: | ---: | :--- |
| قلم | ۵۰۰۰ تومان | ۲ |
| دفتر | ۲۰۰۰۰ تومان | ۵ |
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
  const [mode, setMode] = useState('split'); // split | edit | preview
  const [showTable, setShowTable] = useState(false);
  const [tableTab, setTableTab] = useState('make');
  const [tRows, setTRows] = useState(4);
  const [tCols, setTCols] = useState(3);
  const [tAlign, setTAlign] = useState('right');
  const [tsvInput, setTsvInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(16);
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
  }, []);

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
  const html = useMemo(() => {
    const raw = marked.parse(text || '');
    return sanitizeHtml(raw);
  }, [text]);

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
    undo: () => document.execCommand('undo'),
    redo: () => document.execCommand('redo'),
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
  const readClipboard = async () => {
    const raw = await navigator.clipboard.readText();
    return autoClean ? fixRTLText(raw) : raw;
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
      setSaveState('خطا در خواندن کلیپ‌بورد');
    }
  };

  const quickClearAndPaste = async () => {
    try {
      const clip = await readClipboard();
      setText(clip);
      setSaveState('پاک و چسبانده شد ✓');
      requestAnimationFrame(() => taRef.current?.focus());
    } catch {
      setSaveState('خطا در خواندن کلیپ‌بورد');
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

        <div className="toolbar-scroll">
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

        <div className="toolbar-right">
          <div className="mode-switch" role="group" aria-label="حالت نمایش">
            <button className={mode === 'split' ? 'on' : ''} onClick={() => setMode('split')}>تقسیم</button>
            <button className={mode === 'edit' ? 'on' : ''} onClick={() => setMode('edit')}>ویرایش</button>
            <button className={mode === 'preview' ? 'on' : ''} onClick={() => setMode('preview')}>پیش‌نمایش</button>
          </div>
          <button className="tool" title="باز کردن فایل (Ctrl+O)" onClick={importFile}>📂 باز کردن</button>
          <button className="tool" title="کپی متن" onClick={() => copyText(text)}>📋</button>
          <button className="tool" title="دانلود MD" onClick={() => download(text, 'document.md', 'text/markdown')}>⬇️</button>
          <button className="tool" title="دانلود HTML" onClick={() => download(sanitizeHtml(marked.parse(text)), 'document.html', 'text/html')}>🖨️</button>
          <button className="tool" title="پاک کردن همه" onClick={() => { if (confirm('همه‌ی متن پاک شود؟')) setText(''); }}>🗑️</button>
          <button className="tool" title="تغییر تم" onClick={toggleTheme}>{theme === 'light' ? '🌙' : '☀️'}</button>
          <button className="tool" title="تنظیمات" onClick={() => { setShowSettings((s) => !s); }}>⚙️</button>
        </div>
      </header>

      {/* ===== هدر دوم ثابت: دسترسی سریع ===== */}
      <div className="quickbar" role="toolbar" aria-label="دسترسی سریع">
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
            <div className="pane-head">
              <span>✏️ ویرایش</span>
              <span className="hint">سمت راست بنویسید — راست‌چین</span>
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
              style={{ fontSize: `${fontSize}px`, lineHeight }}
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
            <div className="pane-head">
              <span>👁️ پیش‌نمایش</span>
              <span className="hint">سمت چپ — نتیجه زنده</span>
            </div>
            <div className="preview-area markdown-body" dir="rtl" dangerouslySetInnerHTML={{ __html: html }} />
          </section>
        )}
      </main>

      {/* ===== نوار وضعیت ===== */}
      <footer className="statusbar">
        <span>کلمات: <b>{info.words}</b></span>
        <span>نویسه: <b>{info.chars}</b></span>
        <span>خط <b>{info.line}</b> : ستون <b>{info.col}</b></span>
        <span className="grow" />
        <span className={`save ${saveState.startsWith('خطا') ? 'err' : ''}`}>{saveState}</span>
      </footer>

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
