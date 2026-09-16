// محرك البحث الذكي في الكتاب والمنصة
import type {
  Book,
  Lesson,
  Concept,
  DocRef,
  Question,
  PageRecord,
  Activity,
} from '../types';

export interface SearchHit {
  id: string;
  type: 'concept' | 'term' | 'document' | 'map' | 'table' | 'chart' | 'question' | 'page' | 'lesson' | 'activity';
  typeLabel: string;
  title: string;
  snippet: string; // السياق
  page?: number;
  lessonId?: string;
  lessonTitle?: string;
  related?: string[]; // أنشطة/عناصر مرتبطة
  conceptId?: string;
  docId?: string;
  questionId?: string;
  lessonLink?: string;
}

export interface SearchData {
  books: Book[];
  lessons: Lesson[];
  concepts: Concept[];
  docs: DocRef[];
  questions: Question[];
  pages: PageRecord[];
  activities: Activity[];
}

function highlight(snippet: string, q: string): string {
  const idx = snippet.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return snippet;
  const start = Math.max(0, idx - 60);
  const end = Math.min(snippet.length, idx + q.length + 90);
  return (start > 0 ? '…' : '') + snippet.slice(start, end) + (end < snippet.length ? '…' : '');
}

export function searchAll(data: SearchData, rawQuery: string): SearchHit[] {
  const q = rawQuery.trim();
  if (q.length < 2) return [];
  const hits: SearchHit[] = [];
  const qLower = q.toLowerCase();
  const lessonTitleOf = (id?: string) => data.lessons.find((l) => l.id === id)?.title;

  // 1) المفاهيم والمصطلحات
  for (const c of data.concepts) {
    if (c.term.toLowerCase().includes(qLower) || c.definition.toLowerCase().includes(qLower)) {
      const rel = data.activities.filter((a) => a.lessonId === c.lessonId).slice(0, 3).map((a) => a.title);
      hits.push({
        id: `h_c_${c.id}`,
        type: c.term === q.trim() ? 'term' : 'concept',
        typeLabel: 'مفهوم/مصطلح',
        title: c.term,
        snippet: c.definition,
        page: c.page,
        lessonId: c.lessonId,
        lessonTitle: lessonTitleOf(c.lessonId),
        related: rel,
        conceptId: c.id,
      });
    }
  }

  // 2) الوثائق (خرائط، جداول، مبيانات، نصوص)
  for (const d of data.docs) {
    const t = d.title.toLowerCase();
    if (t.includes(qLower) || (d.topic || '').toLowerCase().includes(qLower)) {
      const kindLabel = { map: 'خريطة', table: 'جدول', chart: 'مبيان', image: 'وثيقة', text: 'نص', other: 'وثيقة' }[d.kind];
      hits.push({
        id: `h_d_${d.id}`,
        type: d.kind === 'map' ? 'map' : d.kind === 'table' ? 'table' : d.kind === 'chart' ? 'chart' : 'document',
        typeLabel: kindLabel,
        title: d.title,
        snippet: d.topic ? `الموضوع: ${d.topic}` : (d.description || 'وثيقة من الكتاب'),
        page: d.page,
        lessonId: d.lessonId,
        lessonTitle: lessonTitleOf(d.lessonId),
        docId: d.id,
      });
    }
  }

  // 3) الأسئلة
  for (const qu of data.questions) {
    if (qu.text.toLowerCase().includes(qLower)) {
      hits.push({
        id: `h_q_${qu.id}`,
        type: 'question',
        typeLabel: 'سؤال',
        title: qu.text.slice(0, 90) + (qu.text.length > 90 ? '…' : ''),
        snippet: `ورد في الدرس (ص ${qu.page ?? '—'})`,
        page: qu.page,
        lessonId: qu.lessonId,
        lessonTitle: lessonTitleOf(qu.lessonId),
        questionId: qu.id,
      });
    }
  }

  // 4) الدروس
  for (const l of data.lessons) {
    if (l.title.toLowerCase().includes(qLower)) {
      hits.push({
        id: `h_l_${l.id}`,
        type: 'lesson',
        typeLabel: 'درس',
        title: l.title,
        snippet: `الصفحات ${l.pageStart} - ${l.pageEnd}${l.problem ? ' — ' + l.problem.slice(0, 80) + '…' : ''}`,
        page: l.pageStart,
        lessonId: l.id,
        lessonTitle: l.title,
      });
    }
  }

  // 5) الأنشطة
  for (const a of data.activities) {
    if (a.instruction.toLowerCase().includes(qLower) || a.title.toLowerCase().includes(qLower)) {
      hits.push({
        id: `h_a_${a.id}`,
        type: 'activity',
        typeLabel: 'نشاط',
        title: a.title,
        snippet: a.instruction,
        page: a.page,
        lessonId: a.lessonId,
        lessonTitle: lessonTitleOf(a.lessonId),
      });
    }
  }

  // 6) نص الصفحات
  for (const p of data.pages) {
    if (!p.readable) continue;
    const idx = p.text.toLowerCase().indexOf(qLower);
    if (idx >= 0) {
      hits.push({
        id: `h_p_${p.id}`,
        type: 'page',
        typeLabel: 'صفحة',
        title: `الصفحة ${p.pageNum} في الكتاب`,
        snippet: highlight(p.text, qLower),
        page: p.pageNum,
      });
    }
  }

  // ترتيب: المفاهيم أولاً ثم الوثائق ثم الدروس ثم الصفحات
  const rank: Record<string, number> = {
    term: 0,
    concept: 1,
    map: 2,
    table: 3,
    chart: 4,
    document: 5,
    lesson: 6,
    question: 7,
    activity: 8,
    page: 9,
  };
  return hits.sort((a, b) => rank[a.type] - rank[b.type] || (a.page ?? 999) - (b.page ?? 999));
}
