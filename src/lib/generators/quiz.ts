// مولّد التقويم الفوري للدرس: أسئلة اختيار من متعدد (من مفاهيم الدرس)
// + صواب/خطأ (مطابقة التعاريف) + أسئلة الكتاب المفتوحة — كل عنصر موصول بصفحته
import type { LessonContext } from './common';
import type { Concept } from '../../types';
import { uid } from '../extractor';

export type QuizItem =
  | {
      id: string;
      type: 'mcq';
      text: string;
      options: string[];
      correct: number;
      page: number;
      points: number;
      prov: 'book' | 'organized' | 'proposal';
      term?: string;
    }
  | {
      id: string;
      type: 'tf';
      text: string;
      statement: string;
      answer: boolean;
      page: number;
      points: number;
      prov: 'book' | 'organized' | 'proposal';
      term?: string;
    }
  | { id: string; type: 'open'; text: string; page: number; points: number; prov: 'book' };

/** خلط حتمي ببذرة ثابتة (قابلة للتكرار) */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateLessonQuiz(ctx: LessonContext, allConcepts: Concept[]): QuizItem[] {
  const items: QuizItem[] = [];
  const lessonConcepts = ctx.concepts;
  const lessonIds = new Set(lessonConcepts.map((c) => c.id));

  /* 1) اختيار من متعدد: أي تعريف ينطبق على المفهوم؟ (حتى 4 أسئلة) */
  for (const c of lessonConcepts.slice(0, 4)) {
    const pool = allConcepts.filter((x) => x.id !== c.id && x.definition && x.definition !== c.definition);
    const sameLessonFirst = [...pool.filter((x) => lessonIds.has(x.id)), ...pool.filter((x) => !lessonIds.has(x.id))];
    const distractors = sameLessonFirst.slice(0, 3).map((x) => x.definition);
    const options = seededShuffle([c.definition, ...distractors, '— لا شيء مما سبق —'].slice(0, 4), c.term.length + c.id.length);
    const correct = options.findIndex((o) => o === c.definition);
    items.push({
      id: uid('qz'),
      type: 'mcq',
      text: `أي تعريف ينطبق على مفهوم «${c.term}»؟`,
      options,
      correct,
      page: c.page || ctx.lesson.pageStart,
      points: 2,
      prov: c.kind === 'explicit' ? 'book' : c.kind === 'manual' ? 'book' : 'organized',
      term: c.term,
    });
  }

  /* 2) صواب/خطأ: مطابقة المفهوم بتعريفه (حتى سؤالان) */
  if (lessonConcepts.length >= 2) {
    for (let i = 0; i < Math.min(2, lessonConcepts.length - 1); i++) {
      const c = lessonConcepts[i];
      const other = lessonConcepts[(i + 1) % lessonConcepts.length];
      if (!c.definition || !other.definition || c.definition === other.definition) continue;
      const swapped = i % 2 === 1; // نصف الأسئلة: تعريف المفهوم الآخر (خطأ)
      const shownDef = swapped ? other.definition : c.definition;
      items.push({
        id: uid('qz'),
        type: 'tf',
        text: 'صواب أم خطأ؟',
        statement: `المصطلح «${c.term}» يُعرَّف بأنه: ${shownDef.slice(0, 220)}${shownDef.length > 220 ? '…' : ''}`,
        answer: !swapped,
        page: c.page || ctx.lesson.pageStart,
        points: 2,
        prov: c.kind === 'explicit' ? 'book' : 'organized',
        term: c.term,
      });
    }
  }

  /* 3) أسئلة الكتاب المفتوحة (استخراج/تحليل) — تُقيَّم مقابل الصفحة الأصلية */
  for (const q of ctx.questions.slice(0, 3)) {
    if (!q.text || q.text.length < 15) continue;
    items.push({
      id: uid('qz'),
      type: 'open',
      text: q.text,
      page: q.page || ctx.lesson.pageStart,
      points: 2,
      prov: 'book',
    });
  }

  return items;
}
