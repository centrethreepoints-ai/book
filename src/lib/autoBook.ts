// دمج الكتاب المدرسي المرفوع في مستودع GitHub مباشرة في المنصة:
// عند أول تشغيل (وعدم وجود كتاب محمّل) تُجلب النسخة من مجلد public/books
// ثم يُشغَّل محرك الاستخراج عليها تلقائياً.

/** اسم ملف الكتاب داخل مجلد public/books */
export const AUTO_BOOK_FILE = 'المسار التاريخ والجغرافيا جدع علوم.pdf';

/** عنوان جلب الملف من خادم Vite */
export const AUTO_BOOK_URL = `books/${encodeURIComponent(AUTO_BOOK_FILE)}`;

/** طبقة OCR مسبقة (لأن الكتاب يستخدم ترميز خطوط غير قياسي) */
export const AUTO_BOOK_OCR_URL = 'books/almasar-ocr.json';

/** عنوان العرض للكتاب المدمج */
export const AUTO_BOOK_TITLE = 'المسار — التاريخ والجغرافيا (جدع علوم)';

/** مفتاح localStorage المؤرّخ لآخر كتاب مُدمج تلقائياً */
export const AUTO_BOOK_KEY = 'manar_auto_book_id';

export interface AutoBookState {
  status: 'idle' | 'fetching' | 'extracting' | 'error';
  done: number;
  total: number;
  stage: string;
  error?: string;
}

export const AUTO_BOOK_IDLE: AutoBookState = { status: 'idle', done: 0, total: 0, stage: '' };
