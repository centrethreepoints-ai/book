// أدوات معالجة النص العربي
import type { Provenance } from '../types';

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/** تحويل الأرقام العربية/الفارسية إلى لاتينية */
export function normalizeDigits(s: string): string {
  return s
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)));
}

/** هل السطر نص عربي في الغالب؟ */
export function isArabic(s: string): boolean {
  const ar = (s.match(/[\u0600-\u06FF]/g) || []).length;
  const latin = (s.match(/[a-zA-Z]/g) || []).length;
  return ar >= latin;
}

/** أنماط العناوين الكبرى في كتاب جغرافيا الباكالوريا */
export const HEAD_PATTERNS = {
  unit: /^(الوحدة|المجال|وحدات|مجلد|السلك|المحور العام)\s*[.:：\-—\d٠-٩]*\s*/,
  domain: /^المجال\s*[.:：\-—\d٠-٩]*\s*/,
  axis: /^المحور\s*[.:：\-—\d٠-٩]*\s*/,
  lesson: /^(الدرس|درس)\s*[.:：\-—\d٠-٩]*\s*/,
  // ملاحظة: لا نستخدم \b لأنه لا يعمل مع الحروف العربية
  section: /^(المبحث(?:\s+(الأول|الثاني|الثالث|الرابع|الخامس))?|القسم|المحور\s+(الأول|الثاني|الثالث|الرابع|1|2|3|4))(?:\s|$|[.:：\-—\u0000])/,
  subsection: /^(أ|ب|ج|د|هـ|و|أولاً|ثانياً|ثالثاً|رابعاً|1[.)]|\d[.)])\s+/,
};

/** كشف نوع العنوان من نص السطر */
export function detectHeadingKind(text: string): 'unit' | 'domain' | 'axis' | 'lesson' | 'section' | 'subsection' | 'other' | null {
  const t = normalizeDigits(text).trim();
  if (!t || t.length > 90) return null;
  if (HEAD_PATTERNS.unit.test(t) && !HEAD_PATTERNS.axis.test(t)) return 'unit';
  if (HEAD_PATTERNS.domain.test(t)) return 'domain';
  if (HEAD_PATTERNS.axis.test(t)) return 'axis';
  if (HEAD_PATTERNS.lesson.test(t)) return 'lesson';
  if (HEAD_PATTERNS.section.test(t)) return 'section';
  if (HEAD_PATTERNS.subsection.test(t)) return 'subsection';
  return null;
}

/** أنماط العناوين الفرعية الوظيفية داخل الدرس */
export const FUNC_PATTERNS: Record<string, RegExp> = {
  problem: /إشكالي|التساؤلات?|التساؤل المركزي|المشكلة/,
  concepts: /المفاهيم|المصطلحات|معجم المفاهيم|المفاهيم الأساسية|مصطلحات/,
  conclusion: /الخاتمة|توصيات?|الختام/,
  summary: /خلاصة|الخلاصات?|الاستنتاجات?|الاستنتاج/,
  activity: /نشاط|أنشطة|تطبيق|قارن|حلّل|حلل|استخرج|اشرح|فكّر|تفكير|عمل|رسّم|ارسم|تعبئة|قراءة (خريطة|مبيان|جدول)/,
  questions: /أسئلة|الأسئلة|تقويم ذاتي|قوّم ذاتك/,
  intro: /تمهيد|مقدمة|مدخل|في (هذا|هذه) الدرس/,
  map: /خريطة|الخريطة/,
  table: /جدول|الجداول/,
  chart: /مبيان|المبيان|مخطط|شريط|إحصائيات|بيانات/,
  doc: /وثيقة|الوثيقة|شكل|صورة|نص|مخطوطة|مستند/,
};

export function matchFunc(text: string): string | null {
  const t = normalizeDigits(text).trim();
  for (const [key, re] of Object.entries(FUNC_PATTERNS)) {
    if (re.test(t)) return key;
  }
  return null;
}

/** أنواع الوثائق من العنوان */
export function docKindFromCaption(text: string): { kind: 'map' | 'table' | 'chart' | 'image' | 'text' | 'other'; title: string } | null {
  const raw = normalizeDigits(text).trim();
  if (!raw || raw.length > 120) return null;
  // بعد OCR قد يسبق السطر ضجيج رمزي — ننظفه
  const t = raw.replace(/^[\s\d|:.؛;,،\-—_»«()]+\u0000*/g, '').trim();
  if (!t) return null;
  // «وثيقة/الوثيقة» (+ ترقيم أو نقطة) — نمط صريح لا يحتاج غامقاً
  if (/^(?:ال)?وثيقة\s*[\d٠-٩.]*/.test(t) && t.length < 100) {
    return { kind: 'text', title: t };
  }
  const cap =
    /^(وثيقة|شكل|مبيان|خريطة|جدول|شريط|نص|صورة|مخطوطة|مستند|مخطط|شجرة|بطاقة|مقابلة|بيان|إحصائية|مسقط|مقطع)\s*\(?[.:：\-—]?\s*(.*)$/;
  const m = t.match(cap);
  if (!m) {
    // سطر كامل يبدأ بنوع الوثيقة بلا ترقيم
    const plain = /^(وثيقة|شكل|مبيان|خريطة|جدول|شريط|نص|صورة)\s+(.+)$/;
    const p = t.match(plain);
    if (p && t.length < 90) {
      return { kind: kindOf(p[1]), title: p[0] };
    }
    return null;
  }
  return { kind: kindOf(m[1]), title: t };
}

function kindOf(w: string): 'map' | 'table' | 'chart' | 'image' | 'text' | 'other' {
  switch (w) {
    case 'خريطة':
    case 'مسقط':
      return 'map';
    case 'جدول':
      return 'table';
    case 'مبيان':
    case 'مخطط':
    case 'شريط':
    case 'بيان':
    case 'إحصائية':
      return 'chart';
    case 'نص':
      return 'text';
    case 'صورة':
    case 'مخطوطة':
      return 'image';
    default:
      return 'other';
  }
}

/** هل السطر سؤال؟ */
export function looksLikeQuestion(text: string): boolean {
  const t = text.trim();
  if (t.includes('?') || t.includes('؟')) return true;
  const starts = /^(ما|ماذا|هل|لماذا|كيف|إلى أي|ما مدى|أين|متى|من|كم|عُرّف|عرّف|تعريف|اشرح|حلّل|حلل|قارن|استخرج|استنتاج|فسّر|فسر|علّل|علل|قوّم|قيّم|اذكر|أعطِ|أعط|اذكر|ارسم|قارن بين)/;
  return starts.test(normalizeDigits(t)) && t.length > 10 && t.length < 400;
}

/** تقسيم نص فقرة على الحدود المناسبة */
export function cleanText(s: string): string {
  // \u0000 = رموز ناقصة في الخط (نقاط/فاصلات...) — نحذفها ثم نظيف المسافات
  return s.replace(/\u0000+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** تنبيه المعطى غير الوارد في الكتاب */
export const NOT_IN_BOOK = 'هذه المعلومة غير واردة صراحة في الكتاب المدرسي.';
export const UNREADABLE = 'تعذر استخراج هذا الجزء من النسخة المرفوعة.';

export function provenanceLabel(p: Provenance): string {
  switch (p) {
    case 'book':
      return '🟢 مستخرج مباشرة من الكتاب';
    case 'organized':
      return '🟡 منظم تربوياً اعتماداً على الكتاب';
    case 'proposal':
      return '🔵 مقترح تربوي يحتاج إلى مراجعة الأستاذ';
    default:
      return '🔴 معلومة خارج الكتاب المدرسي';
  }
}
