// سياق مشترك لمولدات المحتوى التربوي
import type {
  Lesson,
  BookUnit,
  Chapter,
  Section,
  Subsection,
  Concept,
  DocRef,
  Activity,
  Question,
  Provenance,
} from '../../types';
import { DOC_KIND_META } from '../../types';

export interface LessonContext {
  lesson: Lesson;
  unit: BookUnit | undefined;
  chapter: Chapter | undefined;
  sections: Section[];
  subsections: Subsection[];
  concepts: Concept[];
  docs: DocRef[];
  activities: Activity[];
  questions: Question[];
  bookTitle: string;
  level: string;
}

export function buildLessonContext(
  lesson: Lesson,
  units: BookUnit[],
  chapters: Chapter[],
  sections: Section[],
  subsections: Subsection[],
  concepts: Concept[],
  docs: DocRef[],
  activities: Activity[],
  questions: Question[],
  bookTitle: string
): LessonContext {
  return {
    lesson,
    unit: units.find((u) => u.id === lesson.unitId),
    chapter: chapters.find((c) => c.id === lesson.chapterId),
    sections: sections.filter((s) => s.lessonId === lesson.id).sort((a, b) => a.order - b.order),
    subsections: subsections.filter((s) => s.lessonId === lesson.id).sort((a, b) => a.order - b.order),
    concepts: concepts.filter((c) => c.lessonId === lesson.id),
    docs: docs.filter((d) => d.lessonId === lesson.id).sort((a, b) => a.page - b.page),
    activities: activities.filter((a) => a.lessonId === lesson.id),
    questions: questions.filter((q) => q.lessonId === lesson.id).sort((a, b) => (a.page || 0) - (b.page || 0)),
    bookTitle,
    level: lesson.level,
  };
}

/** المصدر الموحّد: {عنوان الكتاب} — الصفحة X */
export function sourceLabel(bookTitle: string, page?: number): string {
  return page ? `${bookTitle} — الصفحة ${page}` : bookTitle;
}

/** الأهداف التعليمية المقترحة (تُبنى من مفاهيم ومحاور الدرس) */
export function suggestedObjectives(ctx: LessonContext): string[] {
  const out: string[] = [];
  ctx.concepts.slice(0, 3).forEach((c) => {
    out.push(`أن يتعرف المتعلم على مفهوم «${c.term}» ويفهم مضمونه كما ورد في الدرس.`);
  });
  if (ctx.sections.length) {
    const s1 = ctx.sections[0].title.replace(/^المبحث [^\d:]*:\s*/, '');
    out.push(`أن يحلل المتعلم مظاهر: ${s1}.`);
    if (ctx.sections[1]) {
      const s2 = ctx.sections[1].title.replace(/^المبحث [^\d:]*:\s*/, '');
      out.push(`أن يفسر المتعلم: ${s2}.`);
    }
    if (ctx.sections[2]) {
      const s3 = ctx.sections[2].title.replace(/^المبحث [^\d:]*:\s*/, '');
      out.push(`أن يقيّم المتعلم: ${s3}.`);
    }
  }
  if (ctx.docs.length) {
    out.push(`أن يستثمر المتعلم الوثائق (${ctx.docs.length}) الواردة في الدرس لاستخراج المعطيات والربط بينها.`);
  }
  return out;
}

/** الكفايات المقترحة */
export function suggestedCompetencies(ctx: LessonContext): string[] {
  const out = [
    'كفاية استثمار الخرائط والمبيانات والجداول الجغرافية.',
    'كفاية التعاطي مع المفاهيم والمصطلحات الجغرافية الواردة في الدرس.',
  ];
  const hasMap = ctx.docs.some((d) => d.kind === 'map');
  const hasChart = ctx.docs.some((d) => d.kind === 'chart' || d.kind === 'table');
  if (hasMap) out.push('كفاية القراءة الموجهة للخريطة وربطها بالظاهرة المدروسة.');
  if (hasChart) out.push('كفاية تحليل البيانات الإحصائية واستخلاص الاتجاهات.');
  return out;
}

/** المكتسبات السابقة المقترحة (من مفاهيم الدرس — للمراجعة) */
export function suggestedPriorKnowledge(ctx: LessonContext): string[] {
  return ctx.concepts.slice(0, 4).map((c) => `مكتسب سابق متوقع: التعريف المبدئي لمصطلح «${c.term}» (${c.kind === 'explicit' ? 'موجود في الدرس' : 'مستنتج — للمراجعة'} · ص ${c.page ?? '—'}).`);
}

/** الوسائل التعليمية حسب أنواع الوثائق الموجودة */
export function suggestedTools(ctx: LessonContext, bookTitle: string): string[] {
  const tools = [bookTitle, 'السبورة والأقلام الملونة'];
  const kinds = new Set(ctx.docs.map((d) => d.kind));
  if (kinds.has('map')) tools.push('خرائط الدرس (ص ' + ctx.docs.filter((d) => d.kind === 'map').map((d) => d.page).join('، ص ') + ')');
  if (kinds.has('chart')) tools.push('مبيانات الدرس');
  if (kinds.has('table')) tools.push('جداول الدرس');
  return tools;
}

/** عناصر الإجابة لسؤال معرفي بناءً على مفاهيم الدرس */
export function answerForQuestion(q: Question, ctx: LessonContext): { content: string; provenance: Provenance } {
  const term = ctx.concepts.find((c) => q.text.includes(c.term) || c.term.includes(normalizeArabic(q.text.split('؟')[0]).slice(0, 20)));
  if (term) {
    return {
      content: `العناصر المنتظرة: ${term.definition} (ص ${term.page ?? ctx.lesson.pageStart}).`,
      provenance: term.kind === 'explicit' ? 'book' : 'organized',
    };
  }
  if (q.level === 'extraction') {
    return {
      content: `عناصر الإجابة تُستخرج مباشرة من ${docOrText(q, ctx)} (ص ${q.page ?? ctx.lesson.pageStart}). لم يولّد النظام إجابة تلقائية تفادياً لأي معلومات خارج الكتاب — يلزم تدقيق الأستاذ.`,
      provenance: 'proposal',
    };
  }
  return {
    content: 'عناصر الإجابة: تُبنى من مضامين الدرس الواردة في الكتاب (انظر الصفحة المرجعية). هذا التصحيح مقترح ويحتاج إلى مراجعة الأستاذ قبل الاستعمال.',
    provenance: 'proposal',
  };
}

function docOrText(q: Question, ctx: LessonContext): string {
  const d = q.docId ? ctx.docs.find((x) => x.id === q.docId) : undefined;
  if (d) return `${DOC_KIND_META[d.kind].label} «${d.title}»`;
  return 'نص الدرس';
}

function normalizeArabic(s: string): string {
  return s.replace(/[؟?،,.]/g, '').trim();
}
