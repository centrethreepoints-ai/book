// مولد الفروض: اختيار النطاق (درس/محور/وحدة/عدة دروس) + مستوى الصعوبة
// الجزء 1: استثمار الوثائق — الجزء 2: أسئلة معرفية — الجزء 3: التركيب
import type { Test, TestPart, TestItem, Difficulty, TestScope } from '../../types';
import { uid } from '../extractor';
import type { LessonContext } from './common';
import { answerForQuestion, sourceLabel } from './common';

export interface TestInput {
  bookId: string;
  bookTitle: string;
  scopeType: TestScope;
  scopeLabel: string;
  contexts: LessonContext[]; // سياق كل درس في النطاق
  difficulty: Difficulty;
  totalPoints: number;
  title?: string;
}

const EASY = { docQuestions: 3, knowQuestions: 3, synthesis: 1, levels: ['comprehension', 'extraction'] as const };
const MEDIUM = { docQuestions: 4, knowQuestions: 4, synthesis: 1, levels: ['comprehension', 'extraction', 'analysis'] as const };
const HARD = { docQuestions: 5, knowQuestions: 5, synthesis: 1, levels: ['comprehension', 'extraction', 'analysis', 'interpretation'] as const };

export function generateTest(input: TestInput): Test {
  const cfg = input.difficulty === 'easy' ? EASY : input.difficulty === 'medium' ? MEDIUM : HARD;
  const allDocs = input.contexts.flatMap((c) => c.docs);
  const allConcepts = input.contexts.flatMap((c) => c.concepts);
  const allQuestions = input.contexts.flatMap((c) => c.questions);
  const allSummaries = input.contexts.map((c) => c.lesson.summary).filter(Boolean) as string[];

  const total = input.totalPoints || 20;

  /* الجزء الأول: استثمار الوثائق */
  const chosenDocs = allDocs.slice(0, input.difficulty === 'easy' ? 1 : 2);
  const part1Items: (TestItem & { w: number })[] = [];
  if (chosenDocs.length) {
    chosenDocs.forEach((d) => {
      const ctx = input.contexts.find((c) => c.docs.includes(d));
      const lessonTitle = ctx?.lesson.title || '';
      part1Items.push({
        id: uid('ti'),
        text: `${d.title} (ص ${d.page})${d.origin ? ' — المصدر: ' + d.origin : ''}`,
        points: 0,
        level: 'extraction',
        docRef: d.title,
        correction: `معطيات الوثيقة من «${lessonTitle}» (ص ${d.page}). عناصر الإجابة: يحدد المتعلم نوع الوثيقة وموضوعها ويستخرج معطيين أساسيين — حسب مضمون الوثيقة الأصلي (دقيق الأستاذ).`,
        provenance: 'organized',
        w: 1,
      });
      const qDefs = cfg.levels;
      for (const lv of qDefs.slice(0, cfg.docQuestions)) {
        part1Items.push({
          id: uid('ti'),
          text: questionForLevel(lv, d.title, d.topic),
          points: 0,
          level: lv,
          docRef: d.title,
          correction: ctx
            ? answerForQuestion({ id: 'x', bookId: '', lessonId: ctx.lesson.id, text: '', level: lv, provenance: 'book' } as never, ctx).content
            : 'تُبنى عناصر الإجابة على مضامين الدرس في الكتاب — للمراجعة.',
          provenance: 'organized',
          w: 1,
        });
      }
    });
  } else {
    part1Items.push({
      id: uid('ti'),
      text: 'تعذر استخراج وثائق من هذا النطاق في النسخة المرفوعة. أضف وثيقة يدوياً ثم أعد توليد الفرض.',
      points: 0,
      correction: '—',
      provenance: 'external',
      w: 0,
    });
  }

  /* الجزء الثاني: أسئلة معرفية */
  const part2Items: (TestItem & { w: number })[] = [];
  const defQs = allConcepts.slice(0, cfg.knowQuestions).map((c) => ({
    id: uid('ti'),
    text: `عرّف: ${c.term}.`,
    points: 0,
    level: 'comprehension' as const,
    correction: c.kind === 'explicit' ? `التعريف الوارد في الكتاب (ص ${c.page ?? '—'}): ${c.definition}` : `تعريف مستنتج — للمراجعة (ص ${c.page ?? '—'}): ${c.definition}`,
    provenance: (c.kind === 'explicit' ? 'book' : 'organized') as 'book' | 'organized',
    w: 1,
  }));
  const shortQs = allQuestions
    .filter((q) => q.level === 'comprehension' || q.level === 'extraction')
    .slice(0, Math.max(0, cfg.knowQuestions - defQs.length))
    .map((q) => ({
      id: uid('ti'),
      text: q.text,
      points: 0,
      level: q.level,
      correction: answerForQuestion(q, input.contexts[0]).content,
      provenance: answerForQuestion(q, input.contexts[0]).provenance,
      w: 1,
    }));
  part2Items.push(...defQs, ...shortQs);
  if (!part2Items.length) {
    part2Items.push({
      id: uid('ti'),
      text: 'لا توجد مفاهيم أو أسئلة مستخرجة في هذا النطاق — أضفها ثم أعد التوليد.',
      points: 0,
      correction: '—',
      provenance: 'external',
      w: 0,
    });
  }

  /* الجزء الثالث: التركيب */
  const lessonsInScope = input.contexts.map((c) => c.lesson.title);
  const part3Items: (TestItem & { w: number })[] = [
    {
      id: uid('ti'),
      text: input.difficulty === 'easy'
        ? `استخرج من دروس «${scopeShort(lessonsInScope)}» معطيات ثلاثة توضح موضوع الدرس، ثم استنتج خلاصة عامة. (سؤال تركيبي)`
        : `موضوع مقالي: حلّل وعلّل الظواهر الجغرافية المدروسة في «${scopeShort(lessonsInScope)}» مع الاستعانة بالخرائط والمبيانات والجداول الواردة في الكتاب، ثم صغ استنتاجاً ختامياً.`,
      points: 0,
      level: 'synthesis',
      correction: allSummaries.length
        ? `الأطروحة النموذجية تنطلق من الخلاصات الواردة في الكتاب: ${allSummaries.join(' ‖ ').slice(0, 300)}… ${sourceLabel(input.bookTitle)}`
        : 'لم تُستخرج خلاصات من النطاق — يصيغ الأستاذ التصحيح النموذجي من الكتاب.',
      provenance: allSummaries.length ? 'organized' : 'proposal',
      w: 3,
    },
  ];

  /* توزيع النقاط: حصة كل جزء من إجمالي الفرض، ثم توزيع داخلي تنازلياً */
  const p1W = Math.round(total * 0.5);
  const p2W = Math.round(total * 0.3);
  const p3W = total - p1W - p2W;
  assignPoints(part1Items, p1W);
  assignPoints(part2Items, p2W);
  assignPoints(part3Items, p3W);
  const clean = (arr: (TestItem & { w: number })[]): TestItem[] => arr.map(({ w, ...rest }) => rest);
  const f1 = clean(part1Items);
  const f2 = clean(part2Items);
  const f3 = clean(part3Items);

  const parts: TestPart[] = [
    {
      id: uid('tp'),
      title: 'الجزء الأول: استثمار الوثائق',
      intro: 'يختار المتعلم قراءة الوثائق الآتية الواردة في الكتاب المدرسي ثم يجيب عن الأسئلة.',
      items: f1,
    },
    {
      id: uid('tp'),
      title: 'الجزء الثاني: أسئلة معرفية',
      intro: 'أجب عن الأسئلة التالية اعتماداً على مفاهيم ومضامين الدروس.',
      items: f2,
    },
    {
      id: uid('tp'),
      title: 'الجزء الثالث: التركيب',
      intro: 'سؤال تركيبي لتقييم القدرة على الربط والاستنتاج.',
      items: f3,
    },
  ];

  return {
    id: uid('test'),
    bookId: input.bookId,
    title: input.title || `فرض في: ${input.scopeLabel}`,
    scopeType: input.scopeType,
    scopeLabel: input.scopeLabel,
    lessonIds: input.contexts.map((c) => c.lesson.id),
    difficulty: input.difficulty,
    parts,
    totalPoints: total,
    createdAt: Date.now(),
  };
}

function questionForLevel(lv: string, docTitle: string, topic?: string): string {
  switch (lv) {
    case 'comprehension':
      return `ما طبيعة الوثيقة «${docTitle}»؟ وما موضوعها؟`;
    case 'extraction':
      return `استخرج من «${docTitle}» معطيين أساسيين${topic ? ` يتصلان بـ«${topic}»` : ''}.`;
    case 'analysis':
      return `حلّل المعطيات الواردة في «${docTitle}» واستخلص منها ملاحظتين. (ص الوثيقة)`;
    case 'interpretation':
      return `علّل العلاقات الظاهرة في «${docTitle}» وربطها بالظاهرة المدروسة.`;
    default:
      return `استنتج من «${docTitle}» خلاصة تعزز موضوع الدرس.`;
  }
}

function scopeShort(titles: string[]): string {
  if (titles.length === 1) return titles[0];
  return titles.length <= 2 ? titles.join(' و') : `${titles.slice(0, 2).join(' و')} وغيرها`;
}

/** توزيع نقاط صحيحة على عناصر بأوزان (أكبر الباقي) مع حد أدنى نقطة لكل عنصر موزون */
function assignPoints(items: { points: number; w: number }[], total: number) {
  const weighted = items.filter((i) => i.w > 0);
  const zeros = items.filter((i) => i.w === 0);
  for (const z of zeros) z.points = 0;
  if (!weighted.length || total <= 0) return;
  const minPoints = Math.min(weighted.length, total);
  const remaining = total - minPoints;
  const totalW = weighted.reduce((s, i) => s + i.w, 0);
  if (totalW <= 0) return;
  const raw = weighted.map((i) => (i.w / totalW) * remaining);
  const base = raw.map((r) => Math.floor(r));
  let used = base.reduce((s, b) => s + b, 0);
  const fracs = raw
    .map((r, idx) => ({ idx, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);
  for (const f of fracs) {
    if (used >= remaining) break;
    base[f.idx] += 1;
    used += 1;
  }
  weighted.forEach((i, idx) => (i.points = 1 + base[idx]));
}
