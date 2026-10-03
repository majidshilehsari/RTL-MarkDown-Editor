// افزودن رنگ‌آمیزی نحوی و دکمه‌ی کپی به بلاک‌های کد و جدول‌های پیش‌نمایش
// این ماژول مستقل از React است تا بتوان آن را جداگانه تست کرد.

export function tableToTSV(table) {
  return Array.from(table.querySelectorAll('tr'))
    .map((tr) =>
      Array.from(tr.querySelectorAll('th,td'))
        .map((c) => (c.textContent || '').trim())
        .join('\t')
    )
    .join('\n');
}

function makeCopyButton(doc, { className, label, title, getText, onCopy }) {
  const btn = doc.createElement('button');
  btn.type = 'button';
  btn.className = className;
  btn.title = title;
  btn.innerHTML = `<span class="copy-ico">📋</span><span class="copy-label">${label}</span>`;
  btn.addEventListener('click', async (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const labelEl = btn.querySelector('.copy-label');
    const icoEl = btn.querySelector('.copy-ico');
    try {
      await onCopy(getText());
      btn.classList.add('done');
      if (icoEl) icoEl.textContent = '✓';
      if (labelEl) labelEl.textContent = 'کپی شد';
    } catch {
      btn.classList.add('failed');
      if (icoEl) icoEl.textContent = '⚠️';
      if (labelEl) labelEl.textContent = 'خطا';
    }
    setTimeout(() => {
      btn.classList.remove('done', 'failed');
      if (icoEl) icoEl.textContent = '📋';
      if (labelEl) labelEl.textContent = label;
    }, 1600);
  });
  return btn;
}

/**
 * @param {HTMLElement} root ریشه‌ی ناحیه‌ی پیش‌نمایش
 * @param {object} opts { hljs, onCopy }
 * @returns {{codeBlocks:number, tables:number}} شمارش موارد پردازش‌شده
 */
export function enhancePreview(root, opts = {}) {
  if (!root) return { codeBlocks: 0, tables: 0 };
  const doc = root.ownerDocument || document;
  const hljs = opts.hljs || null;
  const onCopy =
    opts.onCopy || ((t) => navigator.clipboard.writeText(t));

  let codeBlocks = 0;
  let tables = 0;

  // ===== بلاک‌های کد =====
  root.querySelectorAll('pre').forEach((pre) => {
    if (pre.parentElement && pre.parentElement.classList.contains('code-block')) return;
    const codeEl = pre.querySelector('code');
    const rawCode = (codeEl || pre).textContent || '';
    let lang = '';
    const m = ((codeEl && codeEl.className) || '').match(/language-([\w+#-]+)/i);
    if (m) lang = m[1].toLowerCase();

    if (codeEl && hljs) {
      try {
        const res =
          lang && hljs.getLanguage(lang)
            ? hljs.highlight(rawCode, { language: lang, ignoreIllegals: true })
            : hljs.highlightAuto(rawCode);
        codeEl.innerHTML = res.value;
        codeEl.classList.add('hljs');
        if (!lang) lang = res.language || '';
      } catch {
        /* اگر رنگ‌آمیزی شکست خورد، کد خام باقی می‌ماند */
      }
    }

    const wrap = doc.createElement('div');
    wrap.className = 'code-block';
    const head = doc.createElement('div');
    head.className = 'code-head';
    const labelEl = doc.createElement('span');
    labelEl.className = 'code-lang';
    labelEl.textContent = lang ? lang.toUpperCase() : 'کد';
    const btn = makeCopyButton(doc, {
      className: 'copy-btn code-copy',
      label: 'کپی',
      title: 'کپی کد در کلیپ‌بورد',
      getText: () => rawCode,
      onCopy,
    });
    // نام زبان سمت چپ، دکمه‌ی کپی در گوشه‌ی بالا-راست
    head.append(labelEl, btn);

    pre.parentNode.insertBefore(wrap, pre);
    wrap.append(head, pre);
    codeBlocks += 1;
  });

  // ===== جدول‌ها =====
  root.querySelectorAll('table').forEach((table) => {
    if (table.parentElement && table.parentElement.classList.contains('table-wrap')) return;
    const wrap = doc.createElement('div');
    wrap.className = 'table-wrap';
    const btn = makeCopyButton(doc, {
      className: 'copy-btn table-copy',
      label: 'کپی جدول',
      title: 'کپی جدول در کلیپ‌بورد',
      getText: () => tableToTSV(table),
      onCopy,
    });
    table.parentNode.insertBefore(wrap, table);
    wrap.append(btn, table);
    tables += 1;
  });

  return { codeBlocks, tables };
}
