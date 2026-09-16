// ============================================================
//  بيانات تجريبية توضيحية (ليست محتوى الكتاب الفعلي)
//  تُستخدم فقط لعرض وظائف المنصة قبل رفع نسخة PDF حقيقية.
//  كل ما فيها موسوم بـ isDemo ويعرضه الشريط التوضيحي أعلى الصفحات.
// ============================================================

import { uid } from './extractor';
import type {
  Book,
  BookUnit,
  Chapter,
  Lesson,
  Section,
  Subsection,
  Concept,
  DocRef,
  Activity,
  Question,
  PageRecord,
} from '../types';

export interface DemoBundle {
  book: Book;
  units: BookUnit[];
  chapters: Chapter[];
  lessons: Lesson[];
  sections: Section[];
  subsections: Subsection[];
  concepts: Concept[];
  docs: DocRef[];
  activities: Activity[];
  questions: Question[];
  pages: PageRecord[];
}

export function buildDemoData(bookId: string): DemoBundle {
  const units: BookUnit[] = [
    { id: uid('unit'), bookId, title: 'المجال الديموغرافي والاجتماعي', kind: 'domain', order: 1, pageStart: 10, pageEnd: 42 },
    { id: uid('unit'), bookId, title: 'المجال الاقتصادي والتنمية', kind: 'domain', order: 2, pageStart: 43, pageEnd: 78 },
  ];
  const [u1, u2] = units;

  const chapters: Chapter[] = [
    { id: uid('chap'), bookId, unitId: u1.id, title: 'الدينامية الديموغرافية', order: 1, pageStart: 10, pageEnd: 26 },
    { id: uid('chap'), bookId, unitId: u1.id, title: 'المدن والبيئة', order: 2, pageStart: 27, pageEnd: 42 },
    { id: uid('chap'), bookId, unitId: u2.id, title: 'الأنشطة الاقتصادية', order: 1, pageStart: 43, pageEnd: 60 },
  ];
  const [c1, c2, c3] = chapters;

  const mkLesson = (
    title: string,
    unitId: string,
    chapterId: string,
    pageStart: number,
    pageEnd: number,
    intro: string,
    problem: string,
    summary: string
  ): Lesson => ({
    id: uid('les'),
    bookId,
    unitId,
    chapterId,
    title,
    order: 0,
    level: 'الثانية باكالوريا',
    subject: 'الجغرافيا',
    pageStart,
    pageEnd,
    intro,
    problem,
    problemExplicit: true,
    summary,
  });

  const lessons: Lesson[] = [
    mkLesson(
      'الزيادة الطبيعية: عواملها وتأثيرها (درس تجريبي)',
      u1.id,
      c1.id,
      10,
      16,
      'تتحدد الزيادة الطبيعية بفارق عدد المواليد وعدد الوفيات في فترة زمنية معطاة، وهي أحد العوامل الرئيسية لتطور عدد السكان. وقد ارتبطت بالتحولات الاقتصادية والاجتماعية والصحية التي عرفتها المجتمعات في العصر الحديث.',
      'كيف تؤثر العوامل الاقتصادية والاجتماعية والصحية في حجم الزيادة الطبيعية؟ وإلى أي مدى ينعكس ذلك على تطور عدد السكان وتوزيعهم؟',
      'تبين أن حجم الزيادة الطبيعية يرتبط ارتباطاً وثيقاً بمستوى التنمية الاقتصادية، والخدمات الصحية والتعليمية، والبنية الاجتماعية للمجتمع. فكلما تحسنت هذه الشروط انخفضت معدلات الوفيات، وتغيرت أنماط الخصوبة، مما ينعكس على البنية السكانية وتوزيع السكان.',
    ),
    mkLesson(
      'الهجرة الداخلية: أنماطها ودلالاتها (درس تجريبي)',
      u1.id,
      c1.id,
      17,
      23,
      'تعد الهجرة الداخلية من الظواهر السكانية الملموسة في معظم الدول، حيث تنتقل فئات واسعة من السكان بين البوادي والمدن، أو بين الجهات، بحثاً عن فرص العمل وتحسين مستوى المعيشة.',
      'ما العوامل الدافعة والجاذبة للهجرة الداخلية؟ وما الآثار الديموغرافية والاجتماعية التي تتركها على الجهات الشاهدة للهجرة والجهة المستقبلة؟',
      'تبقى الهجرة الداخلية نتيجة اختلال التوازن بين الفرص السوسيو-اقتصادية بين الجهات، وتترك آثاراً عميقة على البنية الديموغرافية والحيوية، كما تطرح إشكالية التخطيط الترابي العادل بين الوسط القروي والوسط الحضري.',
    ),
    mkLesson(
      'المدينة المغربية: ديناميات التمدن (درس تجريبي)',
      u1.id,
      c2.id,
      27,
      34,
      'عرف المغرب تطوراً حضرياً لافتاً خلال العقود الأخيرة، إذ تضاعف عدد سكان المدن وتوسعت الأقطاب الحضرية الكبرى، في ظل تحولات اقتصادية واجتماعية عميقة.',
      'كيف تتوزع المدن المغربية وتتطور دينامياتها؟ وما التحديات التي يطرحها هذا التمدن المتسارع على المستوى الاقتصادي والاجتماعي والبيئي؟',
      'يشهد التمدن بالمغرب دينامية قوية تفاوتت بين الجهات، وتتركز في الأقطاب الكبرى (الدار البيضاء، الدار البيضاء الكبرى، مراكش، طنجة). ويضع هذا التطور أسئلة التخطيط الحضري، وإدماج الأحياء الهامشية، وضمان جودة الحياة.',
    ),
    mkLesson(
      'القطاع الفلاحي المغربي: مكانته وتحولاته (درس تجريبي)',
      u2.id,
      c3.id,
      43,
      50,
      'يظل القطاع الفلاحي من ركائز الاقتصاد الوطني المغربي، إذ يوفر نحو ثلث فرص الشغل، ويساهم بحصة مهمة في الصادرات، ويتأثر مباشرة بخصائص الوسط الطبيعي وتقلبات المناخ.',
      'ما العوامل التي تحدد الانتشار المجالي لأنشطة القطاع الفلاحي؟ وكيف تتأثر مردوديته بالبنية التحتية والسياسات العمومية؟',
      'يحدد الانتشار المجالي للفلاحة المغربية بترابط العوامل الطبيعية (الماء، المناخ، التضاريس، التربة) والعوامل البشرية (الاستثمار، التقنية، التسويق). وتظل سياسة السقي والاعتماد على الأمطار مصدر تفاوت الجهوي الكبير في المردودية.',
    ),
  ];
  lessons[0].order = 1;
  lessons[1].order = 2;
  lessons[2].order = 3;
  lessons[3].order = 4;

  const sections: Section[] = [];
  const subsections: Subsection[] = [];
  const secDefs: Array<[Lesson, string[]]> = [
    [
      lessons[0],
      [
        'مفهوم الزيادة الطبيعية ومعايير قياسها',
        'العوامل المؤثرة في حجم الزيادة الطبيعية',
        'الانعكاسات الديموغرافية للزيادة الطبيعية',
      ],
    ],
    [
      lessons[1],
      [
        'أنماط الهجرة الداخلية بالمغرب',
        'العوامل الدافعة والعوامل الجاذبة',
        'آثار الهجرة الداخلية على الجهات',
      ],
    ],
    [
      lessons[2],
      [
        'التطور التاريخي للتمدين بالمغرب',
        'التوزيع المجالي للكتل الحضرية',
        'تحديات التمدن المتسارع',
      ],
    ],
    [
      lessons[3],
      [
        'الانتشار المجالي للأنشطة الفلاحية',
        'مردودية القطاع الفلاحي وعواملها',
        'سياسات التنمية الفلاحية',
      ],
    ],
  ];
  const SUBS: string[][] = [
    ['المواليد والوفيات', 'المعدل الطبيعي للزيادة', 'البنية السكانية العمرية'],
    ['الهجرة الريفي-الحضري', 'هجرة الجهات', 'البنية العمرية للمهاجرين'],
    ['نمو الأقطاب الحضرية', 'تفاوت الجهوي', 'مسألة الإطار العمراني'],
    ['الزراعات المطرية', 'الزراعات المسقية', 'الاستثمار الفلاحي'],
  ];
  secDefs.forEach(([les, titles], li) => {
    titles.forEach((t, i) => {
      sections.push({
        id: uid('sec'),
        lessonId: les.id,
        title: `المبحث ${['الأول', 'الثاني', 'الثالث'][i]}: ${t}`,
        order: i + 1,
        pageStart: les.pageStart + i * 2,
        pageEnd: les.pageStart + i * 2 + 1,
      });
    });
    (SUBS[li] || []).forEach((t, i) => {
      subsections.push({
        id: uid('sub'),
        lessonId: les.id,
        sectionId: sections.filter((s) => s.lessonId === les.id)[i]?.id,
        title: t,
        order: i + 1,
        pageStart: les.pageStart + i * 2,
      });
    });
  });
  const concepts: Concept[] = [
    {
      id: uid('cnc'),
      bookId,
      lessonId: lessons[0].id,
      term: 'الزيادة الطبيعية',
      definition: 'الفارق بين عدد المواليد وعدد الوفيات في فترة زمنية معطاة.',
      page: 10,
      kind: 'explicit',
      context: 'ورد في مقدمة الدرس حول العوامل المؤثرة في تطور عدد السكان.',
    },
    {
      id: uid('cnc'),
      bookId,
      lessonId: lessons[0].id,
      term: 'المعدل الطبيعي للزيادة',
      definition: 'فرق معدل المواليد الحيين ومعدل الوفيات، ويعبر بالمية لكل ألف نسمة.',
      page: 11,
      kind: 'explicit',
    },
    {
      id: uid('cnc'),
      bookId,
      lessonId: lessons[1].id,
      term: 'الهجرة الداخلية',
      definition: 'انتقال الأشخاص بشكل دائم أو شبه دائم داخل حدود الدولة الواحدة.',
      page: 17,
      kind: 'explicit',
      context: 'ورد في عرض أنماط الهجرة داخل المجال الوطني.',
    },
    {
      id: uid('cnc'),
      bookId,
      lessonId: lessons[1].id,
      term: 'العوامل الدافعة والجاذبة',
      definition: 'الظروف السوسيو-اقتصادية التي تدفع السكان لمغادرة المنطقة الأصلية أو تجذبهم نحو منطقة الاستقبال.',
      page: 18,
      kind: 'inferred',
    },
    {
      id: uid('cnc'),
      bookId,
      lessonId: lessons[2].id,
      term: 'التمدين (التمدد الحضري)',
      definition: 'التوسع المجالي للمدينة باتجاه المحيط القروي، وامتداد البناء الحضري على حساب المجال الريفي.',
      page: 28,
      kind: 'explicit',
    },
    {
      id: uid('cnc'),
      bookId,
      lessonId: lessons[2].id,
      term: 'القطب الحضري',
      definition: 'المدينة الكبرى التي تؤطر مجالاً حضرياً محيطاً بشبكة من المدن الصغرى والأحياء.',
      page: 29,
      kind: 'inferred',
    },
    {
      id: uid('cnc'),
      bookId,
      lessonId: lessons[3].id,
      term: 'المردودية الفلاحية',
      definition: 'حجم المنتوج المحصل عليه مقابل حجم الموارد المستعملة في الإنتاج.',
      page: 45,
      kind: 'explicit',
    },
  ];

  const docs: DocRef[] = [
    { id: uid('doc'), bookId, lessonId: lessons[0].id, kind: 'chart', title: 'مبيان 1: تطور الزيادة الطبيعية في المغرب خلال الفترة 1960-2020', page: 12, topic: 'تطور الزيادة الطبيعية', origin: 'المكتب الوطني للإحصاء' },
    { id: uid('doc'), bookId, lessonId: lessons[0].id, kind: 'table', title: 'جدول 2: معدلات المواليد والوفيات حسب الجهات', page: 13, topic: 'التفاوت الجهوي في النجاعة الحيوية' },
    { id: uid('doc'), bookId, lessonId: lessons[1].id, kind: 'map', title: 'خريطة 1: تيارات الهجرة الداخلية الكبرى بالمغرب', page: 19, topic: 'اتجاهات الهجرة الداخلية', origin: 'إعداد الأستاذ' },
    { id: uid('doc'), bookId, lessonId: lessons[1].id, kind: 'chart', title: 'مبيان 3: توزيع المهاجرين حسب السن والجنس', page: 20, topic: 'البنية الديموغرافية للهجرة' },
    { id: uid('doc'), bookId, lessonId: lessons[2].id, kind: 'map', title: 'خريطة 2: التوزيع المجالي للمدن الكبرى بالمغرب', page: 29, topic: 'الأقطاب الحضرية' },
    { id: uid('doc'), bookId, lessonId: lessons[2].id, kind: 'table', title: 'جدول 4: تطور عدد سكان المدن الرئيسية', page: 30, topic: 'التمدد الحضري' },
    { id: uid('doc'), bookId, lessonId: lessons[2].id, kind: 'chart', title: 'مبيان 5: نسبة التمدن حسب الجهات', page: 31, topic: 'تفاوت التمدن الجهوي' },
    { id: uid('doc'), bookId, lessonId: lessons[3].id, kind: 'map', title: 'خريطة 3: انتشار الزراعات المسقية والمطرية', page: 46, topic: 'الانتشار المجالي للفلاحة' },
    { id: uid('doc'), bookId, lessonId: lessons[3].id, kind: 'table', title: 'جدول 6: المساحة المزروعة حسب الفلاحات', page: 47, topic: 'التركيب الفلاحي' },
  ];

  const activities: Activity[] = [
    { id: uid('act'), bookId, lessonId: lessons[0].id, docId: docs[0].id, title: 'النشاط 1: قراءة مبيان الزيادة الطبيعية', instruction: 'اقرأ مبيان تطور الزيادة الطبيعية ثم أجب: استخرج اتجاه المنحنى بين 1960 و1980، وعلل التراجع المسجل بعد 1990.', page: 12, provenance: 'book' },
    { id: uid('act'), bookId, lessonId: lessons[1].id, docId: docs[2].id, title: 'النشاط 2: قراءة خريطة تيارات الهجرة', instruction: 'حدد من الخريطة أهم الجهات الشاهدة للهجرة وأهم الجهات المستقبلة، ثم اشرح سببها.', page: 19, provenance: 'book' },
    { id: uid('act'), bookId, lessonId: lessons[2].id, docId: docs[4].id, title: 'النشاط 3: قراءة خريطة المدن الكبرى', instruction: 'لاحظ الخريطة ثم اذكر ثلاث ملاحظات بخصوص توزيع المدن الكبرى بالمغرب.', page: 29, provenance: 'book' },
    { id: uid('act'), bookId, lessonId: lessons[3].id, docId: docs[7].id, title: 'النشاط 4: قراءة خريطة الزراعات المسقية', instruction: 'أين تنتشر الزراعات المسقية؟ استخلص من الخريطة علاقتها بالمياه.', page: 46, provenance: 'book' },
  ];

  const questions: Question[] = [
    { id: uid('q'), bookId, lessonId: lessons[0].id, text: 'عرّف الزيادة الطبيعية.', level: 'comprehension', page: 10, provenance: 'book' },
    { id: uid('q'), bookId, lessonId: lessons[0].id, text: 'استخرج من المبيان الفترة التي عرفت فيها الزيادة الطبيعية أعلى معدل لها.', level: 'extraction', page: 12, provenance: 'book' },
    { id: uid('q'), bookId, lessonId: lessons[0].id, text: 'حلل العوامل الاجتماعية المؤثرة في التراجع المسجل في معدلات الزيادة الطبيعية.', level: 'analysis', page: 14, provenance: 'book' },
    { id: uid('q'), bookId, lessonId: lessons[0].id, text: 'علل أثر التحسن الصحي في انخفاض معدل الوفيات.', level: 'interpretation', page: 15, provenance: 'book' },
    { id: uid('q'), bookId, lessonId: lessons[1].id, text: 'ما الفرق بين الهجرة الداخلية والهجرة الخارجية؟', level: 'comprehension', page: 17, provenance: 'book' },
    { id: uid('q'), bookId, lessonId: lessons[1].id, text: 'استخرج من الخريطة تيارين للهجرة الداخلية.', level: 'extraction', page: 19, provenance: 'book' },
    { id: uid('q'), bookId, lessonId: lessons[1].id, text: 'قارن بين آثار الهجرة على الجهة الشاهدة والجهة المستقبلة.', level: 'analysis', page: 21, provenance: 'book' },
    { id: uid('q'), bookId, lessonId: lessons[2].id, text: 'عرّف التمدين.', level: 'comprehension', page: 27, provenance: 'book' },
    { id: uid('q'), bookId, lessonId: lessons[2].id, text: 'استخرج من الجدول مدينتين عرفت أكبر تطور سكاني.', level: 'extraction', page: 30, provenance: 'book' },
    { id: uid('q'), bookId, lessonId: lessons[2].id, text: 'حلل أسباب تفاوت نسبة التمدن بين الجهات.', level: 'analysis', page: 32, provenance: 'book' },
    { id: uid('q'), bookId, lessonId: lessons[3].id, text: 'عرّف المردودية الفلاحية.', level: 'comprehension', page: 45, provenance: 'book' },
    { id: uid('q'), bookId, lessonId: lessons[3].id, text: 'استخرج من الخريطة فوجين فلاحيين مختلفين.', level: 'extraction', page: 46, provenance: 'book' },
  ];

  const pages: PageRecord[] = [];
  for (let p = 1; p <= 78; p++) {
    let text = '';
    let heads: string[] = [];
    for (const les of lessons) {
      if (p >= les.pageStart && p <= les.pageEnd) {
        text += ` ${les.intro} ${les.problem} ${les.summary}`;
        if (p === les.pageStart) heads = [les.title];
      }
    }
    for (const s of sections) {
      if (s.pageStart === p) heads.push(s.title);
    }
    for (const d of docs) {
      if (d.page === p) text += ` ${d.title}. ${d.topic || ''}`;
    }
    for (const a of activities) {
      if (a.page === p) text += ` ${a.instruction}`;
    }
    pages.push({
      id: `pg_${bookId}_${p}`,
      bookId,
      pageNum: p,
      text: text.trim(),
      readable: true,
      headingTitles: heads,
    });
  }

  const book: Book = {
    id: bookId,
    title: 'منار الجغرافيا للسنة الثانية باكالوريا — نموذج توضيحي',
    subject: 'الجغرافيا',
    level: 'الثانية باكالوريا',
    fileName: 'demo-manar-geo.pdf',
    pageCount: 78,
    status: 'ready',
    isDemo: true,
    uploadedAt: Date.now(),
  };

  return { book, units, chapters, lessons, sections, subsections, concepts, docs, activities, questions, pages };
}
