'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/common';
import { fixRTLText, wrapForRTL, isMixedDirection } from '../lib/bidi';
import { renderMarkdown, copyTargetText } from '../lib/markdown';
import { LANGS, detectLang, translator } from '../lib/i18n';
import { getSample } from '../lib/samples';

function sanitizeHtml(raw) {
  // DOMPurify فقط در مرورگر در دسترس است؛ هنگام رندر اولیه (SSR) بدون پاک‌سازی برگردانده می‌شود
  if (typeof window === 'undefined') return raw;
  return DOMPurify.sanitize(raw);
}

const STORAGE_KEY = 'rtl-md-editor-v3';


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

function buildTable(rows, cols, align, headLabel = 'عنوان') {
  const mark = TABLE_ALIGNS[align] || '---';
  const head = Array.from({ length: cols }, (_, i) => `${headLabel} ${i + 1}`).join(' | ');
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
  const [lang, setLang] = useState('fa');
  const [contentDir, setContentDir] = useState('rtl');
  const [lineHeight, setLineHeight] = useState(1.7);
  const [autoClean, setAutoClean] = useState(true);
  const [rliCopy, setRliCopy] = useState(true);
  const [autosave, setAutosave] = useState(true);
  const [saveState, setSaveState] = useState('');
  const [split, setSplit] = useState(25); // percent for editor (default 1:3 — editor thin, preview 3x wider)
  const [info, setInfo] = useState({ words: 0, chars: 0, line: 1, col: 1 });
  const [dragActive, setDragActive] = useState(false);
  const [dragValid, setDragValid] = useState(false);

  const t = useMemo(() => translator(lang), [lang]);
  // جهت «رابط کاربری» همیشه راست‌به‌چپ است، چون هدف برنامه ویرایش متن RTL است.
  // جهت «محتوا» هم به‌صورت پیش‌فرض RTL است و فقط از تنظیمات قابل تغییر است.
  const uiDir = 'rtl';

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
    let initialLang = 'fa';
    try {
      initialLang = localStorage.getItem('rtl-md-lang') || detectLang();
    } catch {
      initialLang = detectLang();
    }
    setLang(initialLang);
    setText(initial || getSample(initialLang));
    setLoaded(true);
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
      setSaveState(t('history.nothingUndo'));
      return;
    }
    h.index -= 1;
    h.lock = true;
    setText(h.stack[h.index]);
    setSaveState(t('history.wentBack'));
    syncHistoryFlags();
  };

  const redo = () => {
    const h = histRef.current;
    clearTimeout(h.timer);
    if (h.index >= h.stack.length - 1) {
      setSaveState(t('history.nothingRedo'));
      return;
    }
    h.index += 1;
    h.lock = true;
    setText(h.stack[h.index]);
    setSaveState(t('history.wentForward'));
    syncHistoryFlags();
  };

  // --- autosave ---
  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveTimer.current);
    setSaveState(t('st.saving'));
    saveTimer.current = setTimeout(() => {
      try {
        if (autosave) localStorage.setItem(STORAGE_KEY, text);
        setSaveState(autosave ? t('st.saved') : t('st.autosaveOff'));
      } catch {
        setSaveState(t('st.saveError'));
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
  const html = useMemo(
    () =>
      sanitizeHtml(
        renderMarkdown(text, {
          code: t('copy.code'),
          table: t('copy.table'),
          codeTitle: t('copy.code'),
          tableTitle: t('copy.table'),
        })
      ),
    [text, t]
  );

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
      if (labelEl) labelEl.textContent = t('copy.done');
      setSaveState(t('st.copied'));
    } catch {
      btn.classList.add('failed');
      if (icoEl) icoEl.textContent = '⚠️';
      if (labelEl) labelEl.textContent = t('copy.error');
    }
    setTimeout(() => {
      btn.classList.remove('done', 'failed');
      if (icoEl) icoEl.textContent = '📋';
      if (labelEl) labelEl.textContent = original;
    }, 1600);
  }, [t]);

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

  const wrap = (open, close = open, placeholder = t('ph.text')) =>
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
    code: () => wrap('`', '`', t('ph.code')),
    codeBlock: () => insertBlock(t('ph.codeBlock')),
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
        const inner = sel || t('ph.linkText');
        const t = before + `[${inner}](https://) ` + after;
        const urlStart = before.length + inner.length + 3;
        const urlEnd = urlStart + 'https://'.length;
        return { text: t, start: urlStart, end: urlEnd };
      }),
    image: () =>
      transformSelection((before, sel, after) => {
        const inner = sel || t('ph.imageAlt');
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
        insertAtCursor('\n' + buildTable(tRows, tCols, tAlign, t('ph.tableHeader')) + '\n');
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
      setSaveState(t('st.copyError'));
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
      f.text().then((t) => setText(t)).catch(() => setSaveState(t('st.fileError')));
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

  // مهم: readText باید «اولین» کار داخل رویداد کلیک باشد.
  // هر await قبل از آن، فعال‌سازی کاربر (user activation) را مصرف می‌کند و
  // باعث می‌شود مرورگر درخواست را رد کند یا تاییدیه‌ی اضافه نشان دهد.
  const readClipboardNow = () => {
    if (!navigator.clipboard?.readText) return Promise.reject(new Error('unsupported'));
    return navigator.clipboard.readText();
  };

  // اگر مرورگر خواندن مستقیم کلیپ‌بورد را اجازه ندهد، با یک فیلد مخفی و Ctrl+V ادامه می‌دهیم
  const fallbackPaste = (mode) => {
    pendingPaste.current = mode;
    const el = pasteCatcherRef.current;
    if (!el) return;
    el.value = '';
    el.focus();
    setSaveState(t('st.pressCtrlV'));
  };

  const onCatcherPaste = (e) => {
    const mode = pendingPaste.current;
    if (!mode) return;
    e.preventDefault();
    pendingPaste.current = null;
    const data = clean(e.clipboardData.getData('text'));
    if (mode === 'replace') {
      setText(data);
      setSaveState(t('st.clearedPasted'));
    } else {
      setText((prev) => prev + data);
      setSaveState(t('st.pasted'));
    }
    requestAnimationFrame(() => taRef.current?.focus());
  };

  const quickClear = () => {
    setText('');
    setSaveState(t('st.cleared'));
    requestAnimationFrame(() => taRef.current?.focus());
  };

  const quickPaste = () => {
    const p = readClipboardNow(); // بدون هیچ await قبل از آن
    setSaveState(t('st.reading'));
    p.then((raw) => {
      const clip = clean(raw);
      if (!clip) {
        setSaveState(t('st.clipEmpty'));
        return;
      }
      insertAtCursor(clip);
      setSaveState('چسبانده شد ✓');
    }).catch(() => fallbackPaste('insert'));
  };

  // یک کلیک: پاک کردن فوری + چسباندن خودکار محتوای کلیپ‌بورد
  const quickClearAndPaste = () => {
    const p = readClipboardNow(); // اولین دستور، داخل همان رویداد کلیک
    setText('');
    setSaveState('در حال خواندن کلیپ‌بورد…');
    p.then((raw) => {
      setText(clean(raw));
      setSaveState('پاک و چسبانده شد ✓');
      requestAnimationFrame(() => taRef.current?.focus());
    }).catch(() => fallbackPaste('replace'));
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

  // --- Ctrl+V در هر جای صفحه (مسیر بدون هیچ تاییدیه‌ی مرورگر) ---
  useEffect(() => {
    const onWindowPaste = (e) => {
      const t = e.target;
      if (t === taRef.current || t === pasteCatcherRef.current) return;
      if (pendingPaste.current) return;
      const data = e.clipboardData?.getData('text');
      if (!data) return;
      e.preventDefault();
      setText((prev) => (prev ? prev + '\n' + clean(data) : clean(data)));
      setSaveState('چسبانده شد ✓');
    };
    window.addEventListener('paste', onWindowPaste);
    return () => window.removeEventListener('paste', onWindowPaste);
  }, [clean]);

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

  useEffect(() => {
    if (!loaded) return;
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', 'rtl');
    try {
      localStorage.setItem('rtl-md-lang', lang);
    } catch {
      /* ذخیره‌سازی در دسترس نیست */
    }
  }, [lang, loaded]);

  // اگر کاربر هنوز چیزی ننوشته باشد، با تغییر زبان متن نمونه هم عوض می‌شود
  const switchLang = (code) => {
    const wasSample = LANGS.some((l) => getSample(l.code) === text);
    setLang(code);
    if (wasSample || !text.trim()) setText(getSample(code));
  };

  return (
    <div
      className="editor-root"
      data-theme={theme}
      dir={uiDir}
      lang={lang}
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
            <strong>{t('app.title')}</strong>
            <small>{t('app.subtitle')}</small>
          </div>
        </div>

        <div className="mode-switch" role="group" aria-label={t('mode.aria')}>
          <button className={mode === 'split' ? 'on' : ''} onClick={() => setMode('split')}>{t('mode.split')}</button>
          <button className={mode === 'edit' ? 'on' : ''} onClick={() => setMode('edit')}>{t('mode.edit')}</button>
          <button className={mode === 'preview' ? 'on' : ''} onClick={() => setMode('preview')}>{t('mode.preview')}</button>
        </div>

        <div className="toolbar-right">
          <div className="lang-switch" role="group" aria-label={t('menu.language')}>
            {LANGS.map((l) => (
              <button
                key={l.code}
                className={`lang-btn ${lang === l.code ? 'on' : ''}`}
                onClick={() => switchLang(l.code)}
                title={l.label}
                lang={l.code}
                dir={l.dir}
              >
                <span className="lang-flag">{l.flag}</span>
                <span className="lang-name">{l.label}</span>
              </button>
            ))}
          </div>
          <button
            className={`tool burger ${menuOpen ? 'open' : ''}`}
            title={menuOpen ? t('menu.close') : t('menu.open')}
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
          <button className="menu-item" onClick={() => { importFile(); setMenuOpen(false); }}>{t('menu.openFile')} <small>Ctrl+O</small></button>
          <button className="menu-item" onClick={() => { copyText(text); setMenuOpen(false); }}>{t('menu.copyAll')}</button>
          <button className="menu-item" onClick={() => { download(text, 'document.md', 'text/markdown'); setMenuOpen(false); }}>{t('menu.downloadMd')}</button>
          <button className="menu-item" onClick={() => { download(sanitizeHtml(renderMarkdown(text)), 'document.html', 'text/html'); setMenuOpen(false); }}>{t('menu.downloadHtml')}</button>
          <div className="menu-sep" />
          <button className="menu-item danger" onClick={() => { quickClear(); setMenuOpen(false); }}>{t('menu.clearAll')}</button>
          <button className="menu-item" onClick={() => { toggleTheme(); }}>{theme === 'light' ? t('menu.themeDark') : t('menu.themeLight')}</button>
          <button className="menu-item" onClick={() => { setShowSettings((v) => !v); setMenuOpen(false); }}>{t('menu.settings')}</button>
        </div>
      )}

      {/* ===== هدر دوم ثابت: دسترسی سریع ===== */}
      <div className="quickbar" role="toolbar" aria-label={t('quick.aria')}>
        {/* ناحیه‌ی راست: زوم */}
        <div className="qb-side qb-zoom">
          <button className="zoom-btn" title={t('zoom.out')} onClick={() => setZoom((z) => Math.max(60, z - 10))}>➖</button>
          <input
            className="zoom-range"
            type="range"
            min="60"
            max="200"
            step="5"
            value={zoom}
            title={t('zoom.slider')}
            aria-label={t('zoom.aria')}
            onChange={(e) => setZoom(+e.target.value)}
          />
          <button className="zoom-btn" title={t('zoom.in')} onClick={() => setZoom((z) => Math.min(200, z + 10))}>➕</button>
          <button className="zoom-val" title={t('zoom.reset')} onClick={() => setZoom(100)}>{zoom}٪</button>
        </div>

        {/* ناحیه‌ی وسط: اقدام‌های اصلی */}
        <div className="qb-center">
          <button className="qbtn qbtn-red" title={t('quick.clearTitle')} onClick={quickClear}>{t('quick.clear')}</button>
          <button className="qbtn qbtn-green" title={t('quick.pasteTitle')} onClick={quickPaste}>{t('quick.paste')}</button>
          <button className="qbtn qbtn-amber" title={t('quick.clearPasteTitle')} onClick={quickClearAndPaste}>{t('quick.clearPaste')}</button>
          <button className="qbtn qbtn-blue" title={t('quick.copyTitle')} onClick={quickCopy}>{t('quick.copy')}</button>
          <button
            className="qbtn qbtn-purple"
            title={t('quick.fixTitle')}
            onClick={actions.fix}
          >
            {t('quick.fix')}
          </button>
        </div>

        {/* ناحیه‌ی چپ: بازگرداندن / انجام دوباره */}
        <div className="qb-side qb-history">
          <button
            className="hbtn"
            title={t('history.undoTitle')}
            onClick={undo}
            disabled={!canUndo}
          >
            <span className="hico">↩️</span> {t('history.undo')}
          </button>
          <button
            className="hbtn"
            title={t('history.redoTitle')}
            onClick={redo}
            disabled={!canRedo}
          >
            <span className="hico">↪️</span> {t('history.redo')}
          </button>
        </div>
      </div>

      {/* ===== پاپ‌اور جدول ===== */}
      {showTable && (
        <div className="popover table-popover">
          <div className="tabs">
            <button className={tableTab === 'make' ? 'on' : ''} onClick={() => setTableTab('make')}>{t('table.make')}</button>
            <button className={tableTab === 'convert' ? 'on' : ''} onClick={() => setTableTab('convert')}>{t('table.convert')}</button>
          </div>
          {tableTab === 'make' ? (
            <div className="table-make">
              <label>
                {t('table.rows')}
                <input type="number" min="2" max="20" value={tRows}
                  onChange={(e) => setTRows(Math.max(2, Math.min(20, +e.target.value)))} />
              </label>
              <label>
                {t('table.cols')}
                <input type="number" min="1" max="10" value={tCols}
                  onChange={(e) => setTCols(Math.max(1, Math.min(10, +e.target.value)))} />
              </label>
              <label>
                {t('table.align')}
                <select value={tAlign} onChange={(e) => setTAlign(e.target.value)}>
                  <option value="right">{t('table.alignRight')}</option>
                  <option value="center">{t('table.alignCenter')}</option>
                  <option value="left">{t('table.alignLeft')}</option>
                  <option value="none">{t('table.alignNone')}</option>
                </select>
              </label>
              <button className="primary" onClick={actions.tableInsert}>{t('table.insert')}</button>
              <pre className="live-table">{buildTable(tRows, tCols, tAlign, t('ph.tableHeader'))}</pre>
            </div>
          ) : (
            <div className="table-convert">
              <textarea
                rows="5"
                placeholder={t('ph.tsv')}
                value={tsvInput}
                onChange={(e) => setTsvInput(e.target.value)}
              />
              <button className="primary" onClick={actions.tableInsert}>{t('table.convertBtn')}</button>
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
            {t('set.fontSize')}
            <input type="range" min="12" max="28" value={fontSize}
              onChange={(e) => setFontSize(+e.target.value)} />
            <span>{fontSize}px</span>
          </label>
          <label>
            {t('set.lineHeight')}
            <input type="range" min="1.2" max="2.4" step="0.1" value={lineHeight}
              onChange={(e) => setLineHeight(+e.target.value)} />
            <span>{lineHeight}</span>
          </label>
          <div className="switch-row dir-row">
            <span>{t('set.contentDir')}</span>
            <div className="dir-buttons">
              <button className={contentDir === 'rtl' ? 'on' : ''} onClick={() => setContentDir('rtl')}>{t('set.dirRtl')}</button>
              <button className={contentDir === 'ltr' ? 'on' : ''} onClick={() => setContentDir('ltr')}>{t('set.dirLtr')}</button>
            </div>
          </div>
          <label className="switch-row">
            <span>{t('set.autoClean')}</span>
            <input type="checkbox" checked={autoClean} onChange={(e) => setAutoClean(e.target.checked)} />
          </label>
          <label className="switch-row">
            <span>{t('set.rliCopy')}</span>
            <input type="checkbox" checked={rliCopy} onChange={(e) => setRliCopy(e.target.checked)} />
          </label>
          <label className="switch-row">
            <span>{t('set.autosave')}</span>
            <input type="checkbox" checked={autosave} onChange={(e) => setAutosave(e.target.checked)} />
          </label>
          <button className="primary" onClick={() => download(getSample(lang), t('set.sampleFile'), 'text/markdown')}>{t('set.downloadSample')}</button>
        </div>
      )}

      {/* ===== بدنه اصلی ===== */}
      <main className="body" ref={containerRef}>
        {(mode === 'split' || mode === 'edit') && (
          <section className="pane editor-pane" style={{ flex: mode === 'edit' ? '1' : undefined, width: mode === 'edit' ? '100%' : `${split}%` }}>
            <div className="format-bar" role="toolbar" aria-label={t('fmt.aria')}>
              <button className="tool" title={t('fmt.undo')} onClick={actions.undo}>↩️</button>
              <button className="tool" title={t('fmt.redo')} onClick={actions.redo}>↪️</button>
              <div className="sep" />
              <button className="tool" title={t('fmt.h1')} onClick={actions.h1}>H1</button>
              <button className="tool" title={t('fmt.h2')} onClick={actions.h2}>H2</button>
              <button className="tool" title={t('fmt.h3')} onClick={actions.h3}>H3</button>
              <div className="sep" />
              <button className="tool" title={t('fmt.bold')} onClick={actions.bold}><b>{t('fmt.boldLabel')}</b></button>
              <button className="tool" title={t('fmt.italic')} onClick={actions.italic}><i>{t('fmt.italicLabel')}</i></button>
              <button className="tool" title={t('fmt.strike')} onClick={actions.strike}><s>{t('fmt.strikeLabel')}</s></button>
              <button className="tool" title={t('fmt.code')} onClick={actions.code}>{t('fmt.codeLabel')}</button>
              <button className="tool" title={t('fmt.codeBlock')} onClick={actions.codeBlock}>{'</>'}</button>
              <div className="sep" />
              <button className="tool" title={t('fmt.quote')} onClick={actions.quote}>❝</button>
              <button className="tool" title={t('fmt.ul')} onClick={actions.ul}>•</button>
              <button className="tool" title={t('fmt.ol')} onClick={actions.ol}>{t('fmt.olLabel')}</button>
              <button className="tool" title={t('fmt.task')} onClick={actions.task}>☑</button>
              <button className="tool" title={t('fmt.hr')} onClick={actions.hr}>―</button>
              <div className="sep" />
              <button className="tool" title={t('fmt.link')} onClick={actions.link}>🔗</button>
              <button className="tool" title={t('fmt.image')} onClick={actions.image}>🖼️</button>
              <button className="tool" title={t('fmt.table')} onClick={() => { setShowTable((s) => !s); setShowEmoji(false); }}>⬛</button>
              <button className="tool" title={t('fmt.emoji')} onClick={() => { setShowEmoji((s) => !s); setShowTable(false); }}>😊</button>
            </div>
            <textarea
              ref={taRef}
              className="editor-area"
              dir={contentDir}
              spellCheck="true"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              onPaste={onPaste}
              onSelect={() => setInfo((p) => p)}
              style={{ fontSize: `${Math.round((fontSize * zoom) / 100)}px`, lineHeight }}
              placeholder={t('ph.editor')}
            />
          </section>
        )}

        {mode === 'split' && (
          <div className="divider" onMouseDown={onDividerDown} title={t('divider.title')}>
            <span>⋮</span>
          </div>
        )}

        {(mode === 'split' || mode === 'preview') && (
          <section className="pane preview-pane" style={{ flex: mode === 'preview' ? '1' : undefined, width: mode === 'preview' ? '100%' : `${100 - split}%` }}>
            <div
              ref={previewRef}
              className="preview-area markdown-body"
              dir={contentDir}
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
          {mode === 'edit' ? t('mode.editLabel') : mode === 'preview' ? t('mode.previewLabel') : t('mode.both')}
        </span>
        <span className="dot">•</span>
        <span className="hint">{t('foot.hint')}</span>
        <span className="dot">•</span>
        <span>{t('foot.words')} <b>{info.words}</b></span>
        <span>{t('foot.chars')} <b>{info.chars}</b></span>
        <span>{t('foot.line')} <b>{info.line}</b> {t('foot.col')} <b>{info.col}</b></span>
        {clipPerm === 'granted' && <span title={t('st.clipAllowedTitle')}>{t('st.clipAllowed')}</span>}
        <span className="grow" />
        <span className={`save ${saveState.startsWith('خطا') ? 'err' : ''}`}>{saveState}</span>
      </footer>

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
              ? t('drop.valid')
              : t('drop.invalid')}
          </div>
        </div>
      )}
    </div>
  );
}
