// مولّد أسئلة الاشتغال على الوثيقة (تُستخدم في النشاط داخل الدرس وفي العرض التفاعلي)
import type { LessonContext } from './common';
import type { DocRef } from '../../types';
import { DOC_KIND_META } from '../../types';

export interface DocQuestion {
  n: number;
  lv: string;
  q: string;
  a: string;
  prov: 'book' | 'organized' | 'proposal';
}

export const DOC_ANALYSIS_STEPS = [
  { t: 'الملاحظة', d: 'حدد طبيعة الوثيقة وعناصرها الظاهرة الرئيسية.' },
  { t: 'الوصف', d: 'صف ما تلاحظه بدقة (أسماء، أرقام، اتجاهات، توزيعات).' },
  { t: 'التفسير', d: 'اشرح العلاقات والسببية بين المعطيات.' },
  { t: 'الاستنتاج', d: 'صغ خلاصة تربط الوثيقة بموضوع الدرس.' },
];

/** أسئلة تدريجية على الوثيقة: فهم ← استخراج ← تحليل ← تفسير ← تركيب */
export function buildDocQuestions(doc: DocRef, ctx: LessonContext): DocQuestion[] {
  const meta = DOC_KIND_META[doc.kind];
  return [
    {
      n: 1,
      lv: 'الفهم',
      q: `ما طبيعة الوثيقة «${doc.title}»؟ وما موضوعها العام؟`,
      a: `طبيعتها: ${meta.label}؛ موضوعها: ${doc.topic || 'مستفاد من عنوانها وعرضها في الدرس (ص ' + doc.page + ')'}${doc.origin ? '؛ مصدرها: ' + doc.origin : ''}.`,
      prov: doc.topic || doc.origin ? 'organized' : 'proposal',
    },
    {
      n: 2,
      lv: 'الاستخراج',
      q: 'استخرج من الوثيقة معطيين أساسيين يتصلان بموضوع الدرس.',
      a: 'تُستخرج المعطيات من الوثيقة نفسها (ص ' + doc.page + '). لم يولّد النظام إجابة تلقائية — يلزم تدقيق الأستاذ حسب مضمون الوثيقة الأصلي.',
      prov: 'proposal',
    },
    {
      n: 3,
      lv: 'التحليل',
      q: 'حلّل العلاقات الظاهرة في الوثيقة واستخلص منها ملاحظتين.',
      a: 'الملاحظات تُبنى على قراءة الوثيقة الأصلية وربطها بمضامين الدرس (ص ' + ctx.lesson.pageStart + '-' + ctx.lesson.pageEnd + ').',
      prov: 'proposal',
    },
    {
      n: 4,
      lv: 'التفسير',
      q: 'فسّر ما تلاحظه من تفاوت/تركّز/اتجاهات في الوثيقة.',
      a: ctx.lesson.summary
        ? 'التفسير يرتكز على خلاصة الدرس (ص ' + ctx.lesson.pageEnd + '): ' + ctx.lesson.summary.slice(0, 150) + '…'
        : 'التفسير مقترح بناءً على مضامين الدرس — للمراجعة.',
      prov: 'organized',
    },
    {
      n: 5,
      lv: 'التركيب والاستنتاج',
      q: 'استنتج من الوثيقة خلاصة تعزز الإجابة على إشكالية الدرس.',
      a: ctx.lesson.problem
        ? 'الخلاصة المرتبطة بالإشكالية: ' + ctx.lesson.problem.slice(0, 120) + '… — تُبنى على الوثيقة وكتاب الدرس.'
        : 'تُصاغ الخلاصة من الوثيقة ودروس الكتاب — للمراجعة.',
      prov: 'organized',
    },
  ];
}
