// پیکربندی مارک‌داون: رنگ‌آمیزی نحوی کد و افزودن دکمه‌ی کپی مستقیماً در خروجی HTML
import { marked } from 'marked';
import hljs from 'highlight.js/lib/common';

let LABELS = { code: 'کپی', table: 'کپی جدول', codeTitle: 'کپی کد در کلیپ‌بورد', tableTitle: 'کپی جدول در کلیپ‌بورد' };

const COPY_BTN = (cls, label, title) =>
  `<button type="button" class="copy-btn ${cls}" title="${title}">` +
  `<span class="copy-ico">📋</span><span class="copy-label">${label}</span></button>`;

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const baseTable = marked.Renderer.prototype.table;

marked.use({
  gfm: true,
  breaks: true,
  renderer: {
    code(token) {
      const raw = typeof token === 'string' ? token : token.text || '';
      const info = (typeof token === 'string' ? arguments[1] : token.lang) || '';
      let lang = String(info).trim().split(/\s+/)[0].toLowerCase();
      let body = '';
      try {
        if (lang && hljs.getLanguage(lang)) {
          body = hljs.highlight(raw, { language: lang, ignoreIllegals: true }).value;
        } else {
          const res = hljs.highlightAuto(raw);
          body = res.value;
          lang = res.language || lang;
        }
      } catch {
        body = escapeHtml(raw);
      }
      const label = lang ? lang.toUpperCase() : 'کد';
      return (
        `<div class="code-block">` +
        `<div class="code-head"><span class="code-lang">${escapeHtml(label)}</span>` +
        COPY_BTN('code-copy', LABELS.code, LABELS.codeTitle) +
        `</div>` +
        `<pre><code class="hljs${lang ? ` language-${escapeHtml(lang)}` : ''}">${body}</code></pre>` +
        `</div>`
      );
    },
    table(token) {
      const html = baseTable.call(this, token);
      return (
        `<div class="table-wrap">` +
        COPY_BTN('table-copy', LABELS.table, LABELS.tableTitle) +
        html +
        `</div>`
      );
    },
  },
});

export function renderMarkdown(text, labels) {
  if (labels) LABELS = { ...LABELS, ...labels };
  return marked.parse(text || '');
}

export function tableToTSV(table) {
  if (!table) return '';
  return Array.from(table.querySelectorAll('tr'))
    .map((tr) =>
      Array.from(tr.querySelectorAll('th,td'))
        .map((c) => (c.textContent || '').trim())
        .join('\t')
    )
    .join('\n');
}

/** متنی که با کلیک روی یک دکمه‌ی کپی باید در کلیپ‌بورد قرار بگیرد */
export function copyTargetText(btn) {
  if (!btn) return '';
  const codeBlock = btn.closest('.code-block');
  if (codeBlock) {
    const pre = codeBlock.querySelector('pre');
    return pre ? pre.textContent || '' : '';
  }
  const wrap = btn.closest('.table-wrap');
  if (wrap) return tableToTSV(wrap.querySelector('table'));
  return '';
}
