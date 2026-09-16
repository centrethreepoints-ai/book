// مولد التقويم التشخيصي: يقيس المكتسبات الأساسية اللازمة لفهم دروس الثانية باكالوريا
// كل سؤال مرتبط بمفهوم ودرس من الكتاب المرفوع
import type { DiagnosticQuiz, DiagItem, Concept } from '../../types';
import { uid } from '../extractor';

export interface DiagnosticInput {
  bookId: string;
  bookTitle: string;
  concepts: Concept[];
  lessonTitles: Record<string, string>; // lessonId -> title
}

export function generateDiagnostic(input: DiagnosticInput): DiagnosticQuiz {
  const cs = input.concepts.slice(0, 10);
  const items: DiagItem[] = [];
  for (const c of cs) {
    // الخيارات: التعريف الصحيح + تعريفات مفاهيم أخرى (من الكتاب فقط)
    const others = input.concepts.filter((x) => x.id !== c.id).slice(0, 3);
    const options: string[] = [c.definition, ...others.map((o) => o.definition)];
    // خلط حتمي ببذرة ثابتة حتى تبقى النتائج قابلة للتكرار
    const seed = c.id.length + c.term.length;
    const shuffled = [...options].sort((a, b) => ((a.length * (seed + 3)) % 7) - ((b.length * (seed + 5)) % 7));
    const correctIndex = shuffled.findIndex((o) => o === c.definition);
    items.push({
      id: uid('di'),
      text: `أي تعريف ينطبق على مفهوم «${c.term}»؟ (${input.lessonTitles[c.lessonId || ''] ? 'مرتبط بدرس: ' + input.lessonTitles[c.lessonId || ''] : 'مفهوم عام في الكتاب'})`,
      options: shuffled.length >= 2 ? shuffled.slice(0, 4) : [...options, '—'],
      correctIndex: Math.max(0, correctIndex),
      concept: c.term,
      linkedLesson: c.lessonId ? input.lessonTitles[c.lessonId] : undefined,
      points: 2,
    });
  }
  return {
    id: uid('diag'),
    bookId: input.bookId,
    title: `تقويم تشخيصي — ${input.bookTitle}`,
    items,
    totalPoints: items.length * 2,
    createdAt: Date.now(),
  };
}

export interface DiagnosticAnalysis {
  score: number;
  total: number;
  percent: number;
  pass: boolean;
  mastered: string[]; // مفاهيم متحكم فيها
  needsSupport: string[]; // مفاهيم تحتاج إلى دعم
  skillsToWork: string[]; // مهارات تحتاج معالجة
  suggestions: string[]; // أنشطة داعمة مقترحة
}

export function analyzeDiagnostic(
  quiz: DiagnosticQuiz,
  answers: Record<string, number>,
  lessonTitles: Record<string, string>
): DiagnosticAnalysis {
  let score = 0;
  const mastered: string[] = [];
  const needsSupport: string[] = [];
  for (const it of quiz.items) {
    if (answers[it.id] === it.correctIndex) {
      score += it.points;
      mastered.push(it.concept);
    } else {
      needsSupport.push(it.concept);
    }
  }
  const total = quiz.totalPoints;
  const percent = total ? Math.round((score / total) * 100) : 0;
  const pass = percent >= 50;

  const skillsToWork: string[] = [];
  if (needsSupport.length) {
    skillsToWork.push('قراءة التعريفات وتمييز المفاهيم الأساسية.');
    if (needsSupport.length > quiz.items.length / 2) {
      skillsToWork.push('الاستثمار المنظم للوثائق والبيانات.');
    }
    skillsToWork.push('الربط بين المفهوم ومجاله الجغرافي.');
  }

  const suggestions = needsSupport.map((c) => {
    const lesson = quiz.items.find((i) => i.concept === c)?.linkedLesson;
    return `إعادة عرض مفهوم «${c}»${lesson ? ` في سياق درس «${lesson}»` : ''} مع تمارين استيعاب، ثم اختبار تعاقدي قصير.`;
  });

  void lessonTitles;
  return { score, total, percent, pass, mastered, needsSupport, skillsToWork, suggestions };
}
