// ============================================================
//  نماذج بيانات المنصة — تعكس بنية قاعدة البيانات المطلوبة:
//  books, units, chapters, lessons, sections, subsections,
//  concepts, terms, documents, maps, tables, charts,
//  activities, questions, answers, worksheets, lesson_plans,
//  tests, test_questions, corrections, pages, sources
// ============================================================

/** تمييز مصدر المحتوى (نظام التحقق من المصدر) */
export type Provenance =
  | 'book' // 🟢 مستخرج مباشرة من الكتاب
  | 'organized' // 🟡 منظم تربوياً اعتماداً على الكتاب
  | 'proposal' // 🔵 مقترح تربوي يحتاج إلى مراجعة الأستاذ
  | 'external'; // 🔴 معلومة خارج الكتاب (غير مسموح إضافتها تلقائياً)

export const PROVENANCE_META: Record<
  Provenance,
  { label: string; short: string; icon: string; cls: string }
> = {
  book: {
    label: 'مستخرج مباشرة من الكتاب',
    short: 'من الكتاب',
    icon: '🟢',
    cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  organized: {
    label: 'منظم تربوياً اعتماداً على الكتاب',
    short: 'منظم تربوياً',
    icon: '🟡',
    cls: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  proposal: {
    label: 'مقترح تربوي يحتاج إلى مراجعة الأستاذ',
    short: 'مقترح — للمراجعة',
    icon: '🔵',
    cls: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  external: {
    label: 'معلومة خارج الكتاب المدرسي',
    short: 'خارج الكتاب',
    icon: '🔴',
    cls: 'bg-rose-50 text-rose-800 border-rose-200',
  },
};

export interface SourceRef {
  bookId: string;
  page: number; // رقم الصفحة الأصلية في الكتاب
  label: string; // مثال: منار الجغرافيا للسنة الثانية باكالوريا
}

/* ---------- الكيانات الأساسية ---------- */

export interface Book {
  id: string;
  title: string;
  publisher?: string;
  subject: string;
  level: string;
  fileName: string;
  fileSize?: number;
  pageCount: number;
  status: 'pending' | 'extracting' | 'ready' | 'error';
  isDemo?: boolean;
  /** تعذر جلب ملف الـ PDF (المحتوى النصي متاح من نفس الصفحات) */
  pdfMissing?: boolean;
  uploadedAt: number;
}

/** وحدة كبرى في الكتاب (الوحدة / المجال) */
export interface BookUnit {
  id: string;
  bookId: string;
  title: string;
  kind: 'unit' | 'domain'; // وحدة أو مجال
  order: number;
  pageStart?: number;
  pageEnd?: number;
}

/** محور داخل الوحدة */
export interface Chapter {
  id: string;
  bookId: string;
  unitId: string;
  title: string;
  order: number;
  pageStart?: number;
  pageEnd?: number;
}

/** الدرس */
export interface Lesson {
  id: string;
  bookId: string;
  unitId: string;
  chapterId?: string;
  title: string;
  order: number;
  level: string; // المستوى: الثانية باكالوريا
  subject: string;
  pageStart: number;
  pageEnd: number;
  /** المقدمة كما وردت في الكتاب (إن وجدت) */
  intro?: string;
  /** الإشكالية كما وردت في الكتاب (إن وجدت) */
  problem?: string;
  problemExplicit: boolean; // هل الإشكالية صريحة في النص؟
  /** الخلاصة/الاستنتاج كما ورد في الكتاب */
  summary?: string;
  /** الخاتمة إن وجدت */
  conclusion?: string;
  notes?: string;
}

/** مبحث رئيس داخل الدرس */
export interface Section {
  id: string;
  lessonId: string;
  title: string;
  order: number;
  pageStart?: number;
  pageEnd?: number;
}

/** عنوان فرعي / صغير داخل الدرس */
export interface Subsection {
  id: string;
  lessonId: string;
  sectionId?: string;
  title: string;
  order: number;
  pageStart?: number;
  pageEnd?: number;
}

/* ---------- المفاهيم والوثائق ---------- */

export interface Concept {
  id: string;
  bookId: string;
  lessonId?: string;
  term: string;
  definition: string;
  page?: number;
  kind: 'explicit' | 'inferred' | 'manual'; // صريح / مستنتج / يدوي
  context?: string; // السياق الذي ورد فيه المفهوم
}

export type DocKind = 'map' | 'table' | 'chart' | 'image' | 'text' | 'other';

export const DOC_KIND_META: Record<DocKind, { label: string; icon: string }> = {
  map: { label: 'خريطة', icon: '🗺️' },
  table: { label: 'جدول', icon: '📊' },
  chart: { label: 'مبيان', icon: '📈' },
  image: { label: 'وثيقة مصورة', icon: '🖼️' },
  text: { label: 'نص', icon: '📄' },
  other: { label: 'وثيقة', icon: '📎' },
};

/** وثيقة في الكتاب (خريطة، جدول، مبيان، صورة، نص...) */
export interface DocRef {
  id: string;
  bookId: string;
  lessonId?: string;
  kind: DocKind;
  title: string; // ما ورد في الكتاب: "خريطة 1: توزيع..."
  page: number;
  description?: string; // الوصف المستخرج أو المدخل يدوياً
  nature?: string; // طبيعة الوثيقة
  origin?: string; // مصدرها
  date?: string; // تاريخها إن وجد
  topic?: string; // موضوعها
}

/* ---------- الأنشطة والأسئلة ---------- */

export type QuestionLevel =
  | 'comprehension' // الفهم
  | 'extraction' // الاستخراج
  | 'analysis' // التحليل
  | 'interpretation' // التفسير
  | 'synthesis'; // التركيب والاستنتاج

export const QLEVEL_META: Record<QuestionLevel, string> = {
  comprehension: 'الفهم',
  extraction: 'الاستخراج',
  analysis: 'التحليل',
  interpretation: 'التفسير',
  synthesis: 'التركيب والاستنتاج',
};

export interface Activity {
  id: string;
  bookId: string;
  lessonId?: string;
  docId?: string;
  title: string;
  instruction: string;
  page?: number;
  provenance: Provenance;
}

export interface Question {
  id: string;
  bookId: string;
  lessonId?: string;
  docId?: string;
  text: string;
  level: QuestionLevel;
  page?: number;
  provenance: Provenance;
}

export interface Answer {
  id: string;
  questionId: string;
  content: string;
  provenance: Provenance;
  page?: number;
}

/* ---------- الجذاذات وخطط الدروس ---------- */

export interface WorksheetStage {
  stage: string; // مرحلة الدرس
  teacher: string; // أنشطة الأستاذ
  learner: string; // أنشطة المتعلم
  tools: string; // الوسائل/الوثائق
  time: string; // الزمن
}

export interface Worksheet {
  id: string;
  bookId: string;
  lessonId: string;
  institution: string;
  teacherName: string;
  subject: string;
  level: string;
  unitTitle: string;
  lessonTitle: string;
  duration: string;
  competencies: string[];
  objectives: string[];
  priorKnowledge: string[];
  problem: string;
  concepts: string[];
  tools: string[];
  documents: string[];
  stages: WorksheetStage[];
  evaluation: string;
  support: string;
  provenance: Provenance;
  createdAt: number;
  updated?: boolean;
}

/* ---------- الفروض ---------- */

export type TestScope = 'lesson' | 'chapter' | 'unit' | 'multi';
export type Difficulty = 'easy' | 'medium' | 'hard';

export const DIFF_META: Record<Difficulty, { label: string; cls: string }> = {
  easy: { label: 'سهل', cls: 'bg-emerald-100 text-emerald-800' },
  medium: { label: 'متوسط', cls: 'bg-amber-100 text-amber-800' },
  hard: { label: 'متقدم', cls: 'bg-rose-100 text-rose-800' },
};

export interface TestItem {
  id: string;
  text: string;
  points: number;
  level?: QuestionLevel;
  docRef?: string; // عنوان الوثيقة المرتبطة
  correction: string; // عناصر الإجابة / التصحيح
  provenance: Provenance;
}

export interface TestPart {
  id: string;
  title: string; // الجزء الأول: استثمار الوثائق...
  intro?: string;
  items: TestItem[];
}

export interface Test {
  id: string;
  bookId: string;
  title: string;
  scopeType: TestScope;
  scopeLabel: string;
  lessonIds: string[];
  difficulty: Difficulty;
  parts: TestPart[];
  totalPoints: number;
  createdAt: number;
}

/* ---------- التقويم التشخيصي ---------- */

export interface DiagItem {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  concept: string; // المفهوم المرتبط
  linkedLesson?: string; // الدرس/المكتسب السابق المرتبط
  points: number;
}

export interface DiagnosticQuiz {
  id: string;
  bookId: string;
  title: string;
  items: DiagItem[];
  totalPoints: number;
  createdAt: number;
}

export interface DiagnosticResult {
  quizId: string;
  score: number;
  total: number;
  answers: Record<string, number>;
  doneAt: number;
}

/* ---------- الصفحات والمصادر ---------- */

export interface PageRecord {
  id: string;
  bookId: string;
  pageNum: number;
  text: string; // النص المستخرج من الصفحة (فارغ إذا كانت مصورة)
  readable: boolean;
  headingTitles: string[]; // العناوين الموجودة في الصفحة
}

export interface Source {
  id: string;
  bookId: string;
  label: string;
  page: number;
}

/* ---------- إعدادات المنصة ---------- */

export interface AppSettings {
  institution: string;
  teacherName: string;
  subject: string;
  level: string;
  bookTitle: string;
  durationDefault: string;
  pointsDefault: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  institution: '',
  teacherName: '',
  subject: 'الجغرافيا',
  level: 'الجدع المشترك — علوم',
  bookTitle: 'المسار — التاريخ والجغرافيا (الجدع المشترك علوم)',
  durationDefault: 'ساعة واحدة (50 دقيقة)',
  pointsDefault: 20,
};

/* ---------- استجابة الاستخراج ---------- */

export interface ExtractionReport {
  ok: boolean;
  pagesTotal: number;
  pagesReadable: number;
  pagesScanned: number; // صفحات غير قابلة للقراءة نصياً
  lessonsFound: number;
  sectionsFound: number;
  conceptsFound: number;
  docsFound: number;
  questionsFound: number;
  warnings: string[];
}
