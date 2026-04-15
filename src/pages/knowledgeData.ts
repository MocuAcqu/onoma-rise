export type ChapterPage = {
  id: string;
};

export type KnowledgeChapter = {
  id: string;
  title: string;
  route: string;
  pages: ChapterPage[];
};

export type KnowledgeTopic = {
  id: string;
  title: string;
  description: string;
  route: string;
  gradient: string;
  chapters: KnowledgeChapter[];
};

export const knowledgeTopics: KnowledgeTopic[] = [
  {
    id: 'sound-system',
    title: '聲音的語言系統',
    description: '介紹音名、升降記號，以及頻率、唱名、簡譜、五線譜等關係。',
    route: '/knowledge/sound-system',
    gradient: 'linear-gradient(130deg, #DA8F86, #377589)',
    chapters: [
      { id: 'pitch-name', title: '什麼是音名？', route: '/knowledge/sound-system/pitch-name',pages: [ { id: 'page-1' }, { id: 'page-2' }, { id: 'page-3' }, { id: 'page-4' },] },
      { id: 'solfege', title: '什麼是唱名？', route: '/knowledge/sound-system/solfege', pages: [ { id: 'page-1' }, { id: 'page-2' }, { id: 'page-3' }] },
      { id: 'accidentals', title: '什麼是升/降記號？', route: '/knowledge/sound-system/accidentals', pages: [ { id: 'page-1' }, { id: 'page-2' }, { id: 'page-3' },] },
    ]
  },
  {
    id: 'pitch-system',
    title: '音高系統',
    description: '認識12平均律、12音循環、 Pitch class，了解音符的種類。',
    route: '/knowledge/pitch-system',
    gradient: 'linear-gradient(130deg, #DA8F86, #377589)',
    chapters: [
      { id: 'sound-formation', title: '聲音的形成', route: '/knowledge/pitch-system/sound-formation', pages: [ { id: 'page-1' }, { id: 'page-2' }, { id: 'page-3' }, { id: 'page-4' },] },
      { id: 'equalTemperament', title: '十二平均律', route: '/knowledge/pitch-system/equalTemperament', pages: [ { id: 'page-1' }, { id: 'page-2' }, { id: 'page-3' }, { id: 'page-4' },] },
      { id: 'pitch-class-set', title: '音高集合', route: '/knowledge/pitch-system/pitch-class-set', pages: [ { id: 'page-1' }, { id: 'page-2' }, { id: 'page-3' }, { id: 'page-4' },] },
    ]
  },
  {
    id: 'interval',
    title: '音程介紹',
    description: '說明全音半音、音程的定義，並學習音程品質與八度關係。',
    route: '/knowledge/interval',
    gradient: 'linear-gradient(130deg, #DA8F86, #377589)',
    chapters: [
      { id: 'interval-definition', title: '音程定義', route: '/knowledge/interval/definition', pages: [ { id: 'page-1' }, { id: 'page-2' }, { id: 'page-3' }, { id: 'page-4' },] },
      { id: 'interval-quality', title: '音程性質', route: '/knowledge/interval/quality', pages: [ { id: 'page-1' }, { id: 'page-2' }, { id: 'page-3' }, { id: 'page-4' },] },
    ]
  },
  {
    id: 'scale',
    title: '音階介紹',
    description: '音階結構與大小調。',
    route: '/knowledge/scale',
    gradient: 'linear-gradient(130deg, #DA8F86, #377589)',
    chapters: [
      { id: 'scale-definition', title: '音階定義', route: '/knowledge/scale/definition', pages: [ { id: 'page-1' }, { id: 'page-2' }, { id: 'page-3' }, { id: 'page-4' },] },
      { id: 'scale-types', title: '音階類型', route: '/knowledge/scale/types', pages: [ { id: 'page-1' }, { id: 'page-2' }, { id: 'page-3' }, { id: 'page-4' },] },
    ]
  },
  {
    id: 'chord',
    title: '和弦介紹',
    description: '包含三度、五度的關係，以及和弦的種類。',
    route: '/knowledge/chord',
    gradient: 'linear-gradient(130deg, #DA8F86, #377589)',
    chapters: [
      { id: 'triads', title: '三和弦', route: '/knowledge/chord/triads', pages: [ { id: 'page-1' }, { id: 'page-2' }, { id: 'page-3' }, { id: 'page-4' },] },
      { id: 'seventh-chords', title: '七和弦', route: '/knowledge/chord/seventh-chords', pages: [ { id: 'page-1' }, { id: 'page-2' }, { id: 'page-3' }, { id: 'page-4' },] },
      { id: 'chord-symbols', title: '和弦記號', route: '/knowledge/chord/symbols', pages: [ { id: 'page-1' }, { id: 'page-2' }, { id: 'page-3' }, { id: 'page-4' },] },
    ]
  },
  {
    id: 'visualization-tools',
    title: '視覺化工具',
    description: '透過半音圈、五度圈、調性網路，理解不同樂理概念。',
    route: '/knowledge/visualization-tools',
    gradient: 'linear-gradient(130deg, #DA8F86, #377589)',
    chapters: [
      { id: 'tonnetz', title: '調性網路', route: '/knowledge/tools/tonnetz', pages: [ { id: 'page-1' }, { id: 'page-2' }, { id: 'page-3' }, { id: 'page-4' },] },
      { id: 'circle-of-fifths', title: '五度圈', route: '/knowledge/tools/circle-of-fifths', pages: [ { id: 'page-1' }, { id: 'page-2' }, { id: 'page-3' }, { id: 'page-4' },] },
      { id: 'chromatic-circle', title: '半音圈', route: '/knowledge/tools/chromatic-circle', pages: [ { id: 'page-1' }, { id: 'page-2' }, { id: 'page-3' }, { id: 'page-4' },] },
    ]
  },
]
