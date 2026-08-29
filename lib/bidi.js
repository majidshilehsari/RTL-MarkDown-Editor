// ابزارهای اصلاح متن چپ‌به‌راست و نرمال‌سازی متن فارسی
// خروجیِ چت‌بات‌ها و هوش مصنوعی معمولاً چپ‌به‌راست است و حروف/نشانه‌ها را خراب می‌کند.
// این ماژول با حذف نویسه‌های کنترل دوجهته، جا‌به‌جای‌کردن علائم، و یکسان‌سازی حروف فارسی
// متن را برای نمایش راست‌چین آماده می‌کند.

export const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

// نویسه‌های کنترل دوجهته و نویسه‌های نامرئی که باید حذف شوند
const BIDI_CONTROL_RE = /[\u200B\u200E\u200F\u202A-\u202E\u2060\u2066-\u2069\u206A-\u206F\uFEFF]/g;

// تبدیل حروف عربی به معادل فارسی (برای فارسی‌زبان)
const ARABIC_TO_PERSIAN = {
  'ي': 'ی',
  'ى': 'ی',
  'ك': 'ک',
  'ة': 'ه',
  'أ': 'ا',
  'إ': 'ا',
  'ٱ': 'ا',
  'ؤ': 'و',
  'ئ': 'ی',
  '۰': '۰', '١': '۱', '٢': '۲', '٣': '۳', '٤': '۴',
  '٥': '۵', '٦': '۶', '٧': '۷', '٨': '۸', '٩': '۹',
};

function convertArabicToPersian(text) {
  return text
    .split('')
    .map((ch) => ARABIC_TO_PERSIAN[ch] ?? ch)
    .join('');
}

const OPEN_TO_CLOSE = { '(': ')', '[': ']', '{': '}', '«': '»' };
const CLOSE_TO_OPEN = { ')': '(', ']': '[', '}': '{', '»': '«' };

// اگر خط با پرانتز/کروشه‌ی بسته شروع شود و جفتِ بازِ آن بعداً بیاید، جایشان را عوض کن
function fixLeadingClosingBracket(line) {
  const ch = line[0];
  if (!CLOSE_TO_OPEN[ch]) return line;
  const open = CLOSE_TO_OPEN[ch];
  const idx = line.indexOf(open, 1);
  if (idx < 0) return line;
  const arr = line.split('');
  arr[0] = open;
  arr[idx] = ch;
  return arr.join('');
}

// اگر خط با پرانتز/کروشه‌ی باز تمام شود و جفتِ بسته‌ی آن قبلش آمده باشد، جایشان را عوض کن
function fixTrailingOpeningBracket(line) {
  const ch = line[line.length - 1];
  if (!OPEN_TO_CLOSE[ch]) return line;
  const close = OPEN_TO_CLOSE[ch];
  const idx = line.lastIndexOf(close, line.length - 2);
  if (idx < 0) return line;
  const arr = line.split('');
  arr[line.length - 1] = close;
  arr[idx] = ch;
  return arr.join('');
}

// نرمال‌سازی نیم‌فاصله (ZWNJ): چندتایی به یک‌تا، و حذف در ابتدا/انتها
function normalizeZWNJ(text) {
  return text
    .replace(/\u200c{2,}/g, '\u200c')
    .replace(/(^|\n)\u200c/g, '$1')
    .replace(/\u200c($|\n)/g, '$1');
}

// اصلاح یک خطِ حاوی حروف فارسی
function fixLine(line) {
  const trimmed = line.trimEnd();
  let out = trimmed;

  const hasArabic = ARABIC_RE.test(out);
  if (!hasArabic) return out;

  // ۱) علائم نگارشی که در ابتدای خط افتاده‌اند (مشکل رایج خروجی هوش مصنوعی) به انتهای خط منتقل شوند
  const punctStart = out.match(/^([\.,،;؛:!؟?]+)(\s*)(.+)$/);
  if (punctStart && ARABIC_RE.test(punctStart[3])) {
    out = punctStart[3] + punctStart[2] + punctStart[1];
  }

  // ۲) جای پرانتز/کروشه‌های وارونه را اصلاح کن
  out = fixLeadingClosingBracket(out);
  out = fixTrailingOpeningBracket(out);

  // ۳) فاصله‌ی اضافه قبل از علائم را حذف کن  («سلام .» → «سلام.»)
  out = out.replace(/\s+([،؛:!؟?.])/g, '$1');

  // ۴) بازگرداندن عادی پس از جابه‌جاییِ علائم ابتدای خط (دو بار اعمال نکن)
  return out;
}

/**
 * اصلاح کامل متن چپ‌به‌راست و نرمال‌سازی فارسی
 * @param {string} input
 * @returns {string}
 */
export function fixRTLText(input) {
  if (!input) return '';

  let text = input;
  // ۱) نرمال‌سازی خطوط
  text = text.replace(/\r\n?/g, '\n');

  // ۲) حذف نویسه‌های کنترل دوجهته و نامرئی
  text = text.replace(BIDI_CONTROL_RE, '');

  // ۳) نرمال‌سازی نیم‌فاصله
  text = normalizeZWNJ(text);

  // ۴) تبدیل حروف عربی به فارسی
  text = convertArabicToPersian(text);

  // ۵) اصلاح خط‌به‌خط علائم و پرانتزها
  text = text
    .split('\n')
    .map(fixLine)
    .join('\n');

  // ۶) حذف فاصله‌های اضافی انتهای سطرها و چندفاصله‌ی پشت‌سرهم در میان متن
  text = text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/ {2,}/g, ' ');

  // ۷) فشرده‌سازی سطرهای خالیِ اضافی
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/**
 * بررسی اینکه آیا متن «مخلوط» است (هم حروف لاتین و هم حروف فارسی دارد)
 * برای بسته‌بندی با نشانه‌های جهت‌دهنده هنگام کپی در برنامه‌های چت
 */
export function isMixedDirection(text) {
  return /[A-Za-z0-9]/.test(text) && ARABIC_RE.test(text);
}

/**
 * بسته‌بندی متن با نشانه‌های RLI/PDI برای نمایش صحیح متن مخلوط در اپ‌های چت
 * که معمولاً چپ‌به‌راست رندر می‌کنند.
 */
export function wrapForRTL(text) {
  if (!isMixedDirection(text)) return text;
  return '\u2067' + text + '\u2069';
}

// حروف فارسی برای جداکردن فقط اگر نیاز بود
export const HAS_PERSIAN = ARABIC_RE;
