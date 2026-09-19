import { knowledgeTopics } from '../pages/knowledgeData';

export type PlacementOption = {
  id: string;
  label: string;
};

export type PlacementQuestion = {
  id: string;
  topicId: string;
  category: string;
  question: string;
  options: PlacementOption[];
  correctOptionId: string;
};

// Mock 題目：先用假資料撐起前端流程，之後會換成正式題庫。
// 每題對應一個 knowledgeData.ts 裡的單元，答錯/不知道會被視為該單元較不熟悉。
export const placementQuestions: PlacementQuestion[] = [
  {
    id: 'q1',
    topicId: 'sound-system',
    category: '音樂中',
    question: 'C、D、E、F、G、A、B這七個字母代表的是？',
    options: [
      { id: 'a', label: '音符的長度' },
      { id: 'b', label: '音的名稱' },
      { id: 'c', label: '音量大小' },
      { id: 'd', label: '節奏快慢' },
    ],
    correctOptionId: 'b',
  },
  {
    id: 'q2',
    topicId: 'pitch-system',
    category: '音高系統',
    question: '鋼琴上，一個八度之內總共有幾個半音？',
    options: [
      { id: 'a', label: '7個' },
      { id: 'b', label: '8個' },
      { id: 'c', label: '12個' },
      { id: 'd', label: '10個' },
    ],
    correctOptionId: 'c',
  },
  {
    id: 'q3',
    topicId: 'interval',
    category: '音程介紹',
    question: 'C 到 G 之間的音程，我們稱為？',
    options: [
      { id: 'a', label: '完全四度' },
      { id: 'b', label: '完全五度' },
      { id: 'c', label: '大三度' },
      { id: 'd', label: '小六度' },
    ],
    correctOptionId: 'b',
  },
  {
    id: 'q4',
    topicId: 'scale',
    category: '音階介紹',
    question: 'C 大調音階裡，總共有幾個升降記號？',
    options: [
      { id: 'a', label: '0個' },
      { id: 'b', label: '1個' },
      { id: 'c', label: '2個' },
      { id: 'd', label: '3個' },
    ],
    correctOptionId: 'a',
  },
  {
    id: 'q5',
    topicId: 'chord',
    category: '和弦介紹',
    question: '一個最基本的三和弦，是由幾個音堆疊組成的？',
    options: [
      { id: 'a', label: '2個音' },
      { id: 'b', label: '3個音' },
      { id: 'c', label: '4個音' },
      { id: 'd', label: '5個音' },
    ],
    correctOptionId: 'b',
  },
  {
    id: 'q6',
    topicId: 'tools',
    category: '視覺化工具',
    question: '「調性網路（Tonnetz）」主要是用來視覺化呈現什麼？',
    options: [
      { id: 'a', label: '節奏型態' },
      { id: 'b', label: '音量變化' },
      { id: 'c', label: '和弦與音高關係' },
      { id: 'd', label: '樂器音色' },
    ],
    correctOptionId: 'c',
  },
];

export const DONT_KNOW_OPTION_ID = '__dont_know__';

export type PlacementAnswer = {
  questionId: string;
  topicId: string;
  optionId: string;
  isCorrect: boolean;
};

export type PlacementRecommendedUnit = {
  topicId: string;
  title: string;
  description: string;
  route: string;
  gradient: string;
};

export type PlacementResult = {
  message: string;
  recommendedUnits: PlacementRecommendedUnit[];
};

function topicTitle(topicId: string): string {
  return knowledgeTopics.find((topic) => topic.id === topicId)?.title ?? topicId;
}

// 依照答錯/不知道優先排序，取前三名還不熟悉的單元做推薦。
// 這是先求「流程能動」的簡化版計分邏輯，之後可以再換成更精準的規則。
export function buildPlacementResult(answers: PlacementAnswer[]): PlacementResult {
  const weakTopics = answers
    .filter((answer) => !answer.isCorrect)
    .map((answer) => answer.topicId);

  const orderedTopicIds = [
    ...weakTopics,
    ...knowledgeTopics.map((topic) => topic.id).filter((id) => !weakTopics.includes(id)),
  ];

  const uniqueTopicIds = Array.from(new Set(orderedTopicIds)).slice(0, 3);

  const recommendedUnits: PlacementRecommendedUnit[] = uniqueTopicIds.map((topicId) => {
    const topic = knowledgeTopics.find((item) => item.id === topicId);
    return {
      topicId,
      title: topic?.title ?? topicId,
      description: topic?.description ?? '',
      route: topic?.route ?? `/knowledge/${topicId}`,
      gradient: topic?.gradient ?? 'linear-gradient(130deg, #DA8F86, #377589)',
    };
  });

  const weakestTitle = uniqueTopicIds.length > 0 ? topicTitle(uniqueTopicIds[0]) : null;
  const correctCount = answers.length - weakTopics.length;

  const message = weakestTitle
    ? `根據你的回答，你對「${weakestTitle}」還不太熟悉，答對了 ${correctCount}/${answers.length} 題。我們建議從下面這幾個單元開始。`
    : `根據你的回答，你已經對基礎樂理很熟悉了！答對了 ${correctCount}/${answers.length} 題。可以挑戰更進階的單元。`;

  return { message, recommendedUnits };
}
