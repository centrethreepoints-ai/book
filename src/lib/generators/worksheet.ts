// مولد الجذاذة التربوية — يُبنى حصرياً على محتوى الدرس المستخرج من الكتاب
import type { LessonContext } from './common';
import { suggestedObjectives, suggestedCompetencies, suggestedPriorKnowledge, suggestedTools, answerForQuestion } from './common';
import type { Worksheet, WorksheetStage } from '../../types';
import { uid } from '../extractor';

export interface WorksheetInput {
  bookId: string;
  institution: string;
  teacherName: string;
  duration: string;
}

export function generateWorksheet(ctx: LessonContext, input: WorksheetInput): Worksheet {
  const { lesson } = ctx;
  const sections = ctx.sections;

  // مراحل الدرس حسب عدد المباحث (ساعة = 50 دقيقة عادة)
  const stages: WorksheetStage[] = [];
  stages.push({
    stage: 'التمهيد ووضع الإشكالية',
    teacher: lesson.intro
      ? `يتحفز المتعلمين بعرض تمهيدي مستمد من مقدمة الدرس: «${short(lesson.intro, 140)}» ثم يطرح التساؤلات المركزية.`
      : 'يطرح أسئلة تمهيدية حول الظاهرة المدروسة ويستخرج مع المتعلمين التساؤلات المركزية.',
    learner: lesson.intro
      ? 'يستمع للعرض التمهيدي ويربط بين المكتسبات السابقة والموضوع الجديد، ويساعد في بلورة الإشكالية.'
      : 'يشارك في المناقشة ويربط بين المعارف السابقة والموضوع الجديد.',
    tools: 'السبورة، الكتاب المدرسي',
    time: '10 د',
  });
  sections.forEach((s, i) => {
    const subs = ctx.subsections.filter((x) => x.sectionId === s.id).map((x) => x.title);
    stages.push({
      stage: `المبحث ${i + 1}: ${s.title.replace(/^المبحث [^\d:]*:\s*/, '')} (ص ${s.pageStart ?? '—'})`,
      teacher: `يتولى عرض مضامين المبحث${subs.length ? ` من خلال العناوين الفرعية: ${subs.slice(0, 3).join('، ')}` : ''} كما وردت في الكتاب، ويتكلف بتنظيم المعلومات على السبورة.`,
      learner: 'يقرأ في الكتاب ويستخرج العناصر الأساسية للمبحث، ويسجل النقاط الرئيسية.',
      tools: `الكتاب المدرسي (ص ${s.pageStart ?? '—'})، السبورة`,
      time: sections.length >= 3 ? '10 د' : '15 د',
    });
  });
  if (ctx.docs.length) {
    stages.push({
      stage: 'الاشتغال على الوثائق',
      teacher: `يقود المتعلمين في قراءة وتحليل ${ctx.docs.length <= 1 ? 'الوثيقة' : 'الوثائق'} الواردة في الدرس (${ctx.docs.slice(0, 3).map((d) => `ص ${d.page}`).join('، ')}) وفق أسئلة الفهم والاستخراج والتحليل.`,
      learner: 'يلاحظ الوثيقة ويصفها ويستخرج المعطيات ويحاول استنتاج العلاقات.',
      tools: ctx.docs.slice(0, 3).map((d) => d.title).join('؛ '),
      time: '10 د',
    });
  }
  stages.push({
    stage: 'الاستنتاج والتقويم',
    teacher: `يوجه المتعلمين نحو استخلاص الخلاصة${lesson.summary ? ' كما وردت في نهاية الدرس' : ''}، ثم يطرح أسئلة التقويم.`,
    learner: 'يصيغ الاستنتاجات الجماعية ويجيب عن أسئلة التقويم.',
    tools: 'السبورة، أسئلة الدرس',
    time: '5 د',
  });

  return {
    id: uid('ws'),
    bookId: ctx.lesson.bookId,
    lessonId: lesson.id,
    institution: input.institution,
    teacherName: input.teacherName,
    subject: 'الجغرافيا',
    level: lesson.level,
    unitTitle: ctx.unit?.title || '—',
    lessonTitle: lesson.title,
    duration: input.duration,
    competencies: suggestedCompetencies(ctx),
    objectives: suggestedObjectives(ctx),
    priorKnowledge: suggestedPriorKnowledge(ctx),
    problem: lesson.problem || 'لم يتم العثور على إشكالية صريحة في النص المستخرج من الكتاب.',
    concepts: ctx.concepts.map((c) => `${c.term}: ${c.definition}`),
    tools: suggestedTools(ctx, ctx.bookTitle),
    documents: ctx.docs.map((d) => `${d.title} (ص ${d.page})`),
    stages,
    evaluation: ctx.questions.length
      ? ctx.questions.slice(0, 4).map((q) => `• ${q.text}  [عناصر: ${answerForQuestion(q, ctx).content}]`).join('\n')
      : 'لا توجد أسئلة مستخرجة من الدرس — يضيفها الأستاذ من الكتاب.',
    support:
      'الدعم والمعالجة: إعادة عرض المفاهيم الصعبة مع الأمثلة من الكتاب، وإسناد تمارين استيعاب المفاهيم للتلاميذ المتعثرين، مع متابعة فردية عند الحاجة. (مقترح تربوي — للمراجعة)',
    provenance: 'proposal',
    createdAt: Date.now(),
  };
}

function short(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '…' : s;
}
