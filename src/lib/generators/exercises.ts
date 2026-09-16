// مولد التمارين التطبيقية السبعة للدرس
// كل تمرين: تعليمات + وثيقة عند الحاجة + أسئلة + نقاط + عناصر التصحيح
// المحتوى مبني حصرياً على ما استخرج من الكتاب
import type { LessonContext } from './common';
import { answerForQuestion } from './common';
import type { Provenance } from '../../types';

export interface ExQuestion {
  text: string;
  points: number;
  correction: string;
  provenance: Provenance;
}

export interface Exercise {
  id: string;
  type: number; // 1..7
  title: string;
  instructions: string;
  docTitle?: string;
  docPage?: number;
  questions: ExQuestion[];
  totalPoints: number;
  provenance: Provenance;
  note?: string;
}

export function generateExercises(ctx: LessonContext): Exercise[] {
  const out: Exercise[] = [];
  const { lesson } = ctx;

  /* تمرين 1: استيعاب المفاهيم */
  {
    const qs: ExQuestion[] = ctx.concepts.slice(0, 4).map((c) => ({
      text: `عرّف: ${c.term}.`,
      points: 2,
      correction:
        c.kind === 'explicit'
          ? `التعريف الوارد في الكتاب (ص ${c.page ?? '—'}): ${c.definition}`
          : `تعريف مستنتج من السياق (ص ${c.page ?? '—'}) — يحتاج إلى مراجعة الأستاذ: ${c.definition}`,
      provenance: c.kind === 'explicit' ? 'book' : 'organized',
    }));
    out.push({
      id: `ex1_${lesson.id}`,
      type: 1,
      title: 'استيعاب المفاهيم',
      instructions: 'إليك مجموعة من المصطلحات الواردة في درس «' + lesson.title + '». عرّف كل مصطلح اعتماداً على الكتاب المدرسي.',
      questions: qs.length ? qs : [{ text: 'لا توجد مفاهيم مستخرجة من هذا الدرس. أضفها من قسم المفاهيم ثم أعد التوليد.', points: 0, correction: '—', provenance: 'proposal' }],
      totalPoints: qs.length * 2,
      provenance: ctx.concepts.length ? 'organized' : 'proposal',
      note: ctx.concepts.length ? undefined : 'لم يُستخرج أي مفهوم من نص الدرس — أضفه يدوياً من الكتاب.',
    });
  }

  /* تمرين 2: أسئلة قصيرة */
  {
    const src = ctx.questions.slice(0, 4);
    const qs: ExQuestion[] = src.map((q) => ({
      text: q.text,
      points: 2,
      correction: answerForQuestion(q, ctx).content,
      provenance: answerForQuestion(q, ctx).provenance,
    }));
    out.push({
      id: `ex2_${lesson.id}`,
      type: 2,
      title: 'أسئلة قصيرة',
      instructions: 'أجب عن الأسئلة التالية إجابة موجزة ومبنية على مضامين الدرس (ص ' + lesson.pageStart + ' - ' + lesson.pageEnd + ').',
      questions: qs.length ? qs : [{ text: 'لا توجد أسئلة مستخرجة من هذا الدرس.', points: 0, correction: '—', provenance: 'proposal' }],
      totalPoints: qs.length * 2,
      provenance: src.length ? 'book' : 'proposal',
      note: src.length ? 'الأسئلة كما وردت في الكتاب.' : 'لا توجد أسئلة مستخرجة — أضفها يدوياً.',
    });
  }

  /* تمارين 3-6 حسب نوع الوثيقة المتوفرة */
  const kinds: Array<[string, string, number]> = [
    ['doc-analysis', 'تحليل وثيقة', 3],
    ['table', 'تحليل جدول', 4],
    ['chart', 'تحليل مبيان', 5],
    ['map', 'تحليل خريطة', 6],
  ];
  for (const [kind, title, type] of kinds) {
    const docs = kind === 'doc-analysis' ? ctx.docs : ctx.docs.filter((d) => d.kind === kind);
    const doc = docs[0];
    if (!doc) {
      out.push({
        id: `ex${type}_${lesson.id}`,
        type,
        title,
        instructions: '—',
        questions: [{ text: 'تعذر استخراج هذا الجزء من النسخة المرفوعة: لا توجد وثيقة من نوع «' + title.replace('تحليل ', '') + '» في هذا الدرس.', points: 0, correction: '—', provenance: 'external' }],
        totalPoints: 0,
        provenance: 'proposal',
        note: 'أضف الوثيقة يدوياً من قسم الوثائق ثم أعد التوليد.',
      });
      continue;
    }
    const qs: ExQuestion[] = [
      {
        text: `ما طبيعة الوثيقة (نوعها) وما موضوعها؟`,
        points: 2,
        correction: `طبيعتها: ${kindLabel(kind, doc.kind)}؛ موضوعها: ${doc.topic || doc.title}. (ص ${doc.page})`,
        provenance: doc.topic ? 'organized' : 'proposal',
      },
      {
        text: `استخرج من الوثيقة معطيين (بيانات/معلومات) أساسيين.`,
        points: 4,
        correction: `تُستخرج المعطيات من الوثيقة نفسها (ص ${doc.page}). لم يولّد النظام إجابة تلقائية — يلزم تدقيق الأستاذ حسب مضمون الوثيقة الأصلي.`,
        provenance: 'proposal',
      },
      {
        text: `حلّل ما تقرأه من الوثيقة، ثم استنتج العلاقة مع موضوع الدرس.`,
        points: 4,
        correction: `عناصر الاستنتاج تُبنى على ${lesson.summary ? `خلاصة الدرس: ${lesson.summary.slice(0, 160)}… (ص ${lesson.pageEnd})` : `مضامين الدرس (ص ${lesson.pageStart}-${lesson.pageEnd})`}. مقترح — للمراجعة.`,
        provenance: 'organized',
      },
    ];
    out.push({
      id: `ex${type}_${lesson.id}`,
      type,
      title,
      instructions: `تعتمد في هذا التمرين على: «${doc.title}» الواردة في الكتاب (ص ${doc.page}).` + (doc.origin ? ` المصدر: ${doc.origin}.` : ''),
      docTitle: doc.title,
      docPage: doc.page,
      questions: qs,
      totalPoints: 10,
      provenance: 'organized',
    });
  }

  /* تمرين 7: تركيب واستنتاج */
  {
    const themes = ctx.sections.map((s) => s.title.replace(/^المبحث [^\d:]*:\s*/, '')).slice(0, 3);
    out.push({
      id: `ex7_${lesson.id}`,
      type: 7,
      title: 'تركيب واستنتاج',
      instructions: `بالاستعانة بما درست في درس «${lesson.title}»${themes.length ? ` ومباحثه: ${themes.join('، ')}` : ''}، أجب عن السؤال الآتي إجابة منظمة.`,
      questions: [
        {
          text: `قارن بين ${themes.length >= 2 ? 'المبحث الأول والمبحث الثاني' : 'المظاهر الواردة في الدرس'} في ${lesson.title}، موضحاً العوامل والنتائج.`,
          points: 6,
          correction: lesson.summary
            ? `الأطروحة المنتظرة تلتزم بخلاصة الدرس (ص ${lesson.pageEnd}): ${lesson.summary.slice(0, 220)}… مقترح بناءً على الكتاب — للمراجعة.`
            : 'لم يُستخرج استنتاج من الدرس — يصيغ الأستاذ العناصر المنتظرة من الكتاب.',
          provenance: lesson.summary ? 'organized' : 'proposal',
        },
        {
          text: `علّل: لماذا تبقى الظاهرة المدروسة مرتبطة بالخصوصيات المجالية للوسط؟`,
          points: 4,
          correction: 'الإجابة تُبنى على مضامين الكتاب (ص ' + lesson.pageStart + '-' + lesson.pageEnd + ') — مقترح للمراجعة.',
          provenance: 'proposal',
        },
      ],
      totalPoints: 10,
      provenance: 'organized',
    });
  }

  return out;
}

function kindLabel(kind: string, actual: string): string {
  if (kind === 'doc-analysis') {
    const names: Record<string, string> = { map: 'خريطة', table: 'جدول', chart: 'مبيان', image: 'وثيقة مصورة', text: 'نص', other: 'وثيقة' };
    return names[actual] || 'وثيقة';
  }
  return actual;
}
