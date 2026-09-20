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
  reference?: string;
};

// 題庫：每個單元對應多題，前測開始時從各單元的題庫隨機抽一題出來，
// 讓不同次作答可以交叉出到不同題目，而不是每次都看到一樣的 6 題。
// sound-system / interval / scale / chord 這幾單元的題目，部分參考了
// 《國中音樂樂理成就測驗之發展》（何煜琦，2005）附錄一的測驗指標與範例題；
// pitch-system（十二平均律、pitch class）與 tools（半音圈、五度圈、調性網路）
// 是這個網站自己的現代樂理視覺化單元，該論文沒有對應素材，題目為自行編寫。
const placementQuestionBank: PlacementQuestion[] = [
  // sound-system 聲音的語言系統
  {
    id: 'sound-system-1',
    topicId: 'sound-system',
    category: '聲音的語言系統',
    question: 'C、D、E、F、G、A、B這七個字母代表的是？',
    options: [
      { id: 'a', label: '音符的長度' },
      { id: 'b', label: '音的名稱' },
      { id: 'c', label: '音量大小' },
      { id: 'd', label: '節奏快慢' },
    ],
    correctOptionId: 'b',
    reference: '附錄一｜記憶・確認・事實知識 3「能確認正確音名」',
  },
  {
    id: 'sound-system-2',
    topicId: 'sound-system',
    category: '聲音的語言系統',
    question: '唱名 Do Re Mi Fa Sol La Si 中，「Sol」對應到哪一個音名？',
    options: [
      { id: 'a', label: 'C' },
      { id: 'b', label: 'F' },
      { id: 'c', label: 'G' },
      { id: 'd', label: 'A' },
    ],
    correctOptionId: 'c',
    reference: '附錄一｜記憶・回憶・事實知識 2「能回憶音名與唱名的關係」',
  },
  {
    id: 'sound-system-3',
    topicId: 'sound-system',
    category: '聲音的語言系統',
    question: '音符前方加上「♯」（升記號），代表這個音要？',
    options: [
      { id: 'a', label: '升高半音' },
      { id: 'b', label: '降低半音' },
      { id: 'c', label: '時值加倍' },
      { id: 'd', label: '停頓半拍' },
    ],
    correctOptionId: 'a',
    reference: '附錄一｜記憶・確認・事實知識 12「能確認各項記號」（升記號屬於記號的一種，對應較寬鬆）',
  },
  {
    id: 'sound-system-4',
    topicId: 'sound-system',
    category: '聲音的語言系統',
    question: '唱名（Do、Re、Mi…）屬於哪一種音高？',
    options: [
      { id: 'a', label: '相對音高，會隨調性不同而對應不同音高' },
      { id: 'b', label: '絕對音高，永遠對應鋼琴上同一個鍵' },
      { id: 'c', label: '沒有音高，只是節奏的名稱' },
      { id: 'd', label: '只有 C 大調才有唱名' },
    ],
    correctOptionId: 'a',
    reference: '自行編寫；答案出處：網站「聲音的語言系統」→ 什麼是唱名？第 3 頁',
  },
  {
    id: 'sound-system-5',
    topicId: 'sound-system',
    category: '聲音的語言系統',
    question: '寫在音符左方的升降記號（臨時記號），效力範圍是？',
    options: [
      { id: 'a', label: '只在同一小節內有效' },
      { id: 'b', label: '整首曲子都有效' },
      { id: 'c', label: '只對下一個音符有效' },
      { id: 'd', label: '只對同一個八度的音有效' },
    ],
    correctOptionId: 'a',
    reference: '自行編寫；答案出處：網站「聲音的語言系統」→ 什麼是升/降記號？第 3 頁',
  },
  {
    id: 'sound-system-6',
    topicId: 'sound-system',
    category: '聲音的語言系統',
    question: '簡譜的「5」，在 C 大調中對應到哪一個唱名？',
    options: [
      { id: 'a', label: 'Fa' },
      { id: 'b', label: 'Sol' },
      { id: 'c', label: 'La' },
      { id: 'd', label: 'Si' },
    ],
    correctOptionId: 'b',
    reference: '自行編寫；答案出處：網站「聲音的語言系統」→ 什麼是唱名？第 2 頁（唱名與簡譜對照）',
  },
  // pitch-system 音高系統
  {
    id: 'pitch-system-1',
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
    reference: '自行編寫（論文沒有對應指標）',
  },
  {
    id: 'pitch-system-2',
    topicId: 'pitch-system',
    category: '音高系統',
    question: '在十二平均律中，每兩個相鄰半音之間的頻率比例是？',
    options: [
      { id: 'a', label: '每次都相同' },
      { id: 'b', label: '依音高不同而不同' },
      { id: 'c', label: '依樂器不同而不同' },
      { id: 'd', label: '無法計算' },
    ],
    correctOptionId: 'a',
    reference: '自行編寫（論文沒有對應指標）',
  },
  {
    id: 'pitch-system-3',
    topicId: 'pitch-system',
    category: '音高系統',
    question: '若不考慮八度高低，只看「音高類別（pitch class）」，C4 和 C5 這兩個音屬於？',
    options: [
      { id: 'a', label: '不同的 pitch class' },
      { id: 'b', label: '同一個 pitch class' },
      { id: 'c', label: '無法判斷' },
      { id: 'd', label: '只有 C4 算數' },
    ],
    correctOptionId: 'b',
    reference: '自行編寫（論文沒有對應指標）',
  },
  // interval 音程介紹
  {
    id: 'interval-1',
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
    reference: '附錄一｜應用・執行・概念知識 5「能執行音程知識」；了解・推論・概念知識 1「能推論音程的距離」',
  },
  {
    id: 'interval-2',
    topicId: 'interval',
    category: '音程介紹',
    question: '唱名 Mi 到 Sol 之間，是幾度音程？',
    options: [
      { id: 'a', label: '二度' },
      { id: 'b', label: '三度' },
      { id: 'c', label: '四度' },
      { id: 'd', label: '五度' },
    ],
    correctOptionId: 'b',
    reference: '表 3-1-2 E 類（事實應用）範例「Mi 到 Sol 是幾度音程」改編；附錄一｜應用・執行・概念知識 5「能執行音程知識」',
  },
  {
    id: 'interval-3',
    topicId: 'interval',
    category: '音程介紹',
    question: '「全音」跟「半音」的關係是？',
    options: [
      { id: 'a', label: '一個全音等於兩個半音' },
      { id: 'b', label: '一個全音等於三個半音' },
      { id: 'c', label: '全音比半音短' },
      { id: 'd', label: '兩者一樣長' },
    ],
    correctOptionId: 'a',
    reference: '附錄一｜了解・說明・概念知識 2「能說明全音與半音」；應用・執行・概念知識 4「能執行全音與半音知識」',
  },
  {
    id: 'interval-4',
    topicId: 'interval',
    category: '音程介紹',
    question: '計算音程的「度數」時，是怎麼數的？',
    options: [
      { id: 'a', label: '數兩音之間（含頭尾）包含幾個音名' },
      { id: 'b', label: '數兩音之間（不含頭尾）有幾個音名' },
      { id: 'c', label: '數兩音之間相差幾個半音' },
      { id: 'd', label: '數兩音的頻率差幾 Hz' },
    ],
    correctOptionId: 'a',
    reference: '附錄一｜了解・說明・概念知識 3「能說明音程的意義」',
  },
  {
    id: 'interval-5',
    topicId: 'interval',
    category: '音程介紹',
    question: '從 C 往上到高一個八度的 C，這個音程稱為幾度？',
    options: [
      { id: 'a', label: '五度' },
      { id: 'b', label: '七度' },
      { id: 'c', label: '八度' },
      { id: 'd', label: '九度' },
    ],
    correctOptionId: 'c',
    reference: '附錄一｜了解・推論・概念知識 1「能推論音程的距離」',
  },
  {
    id: 'interval-6',
    topicId: 'interval',
    category: '音程介紹',
    question: '鋼琴上 E 到 F 之間的距離是？',
    options: [
      { id: 'a', label: '一個半音' },
      { id: 'b', label: '一個全音' },
      { id: 'c', label: '一個半全音' },
      { id: 'd', label: '兩個全音' },
    ],
    correctOptionId: 'a',
    reference: '附錄一｜了解・比較・概念知識 3「能比較全音與半音」',
  },
  // scale 音階介紹
  {
    id: 'scale-1',
    topicId: 'scale',
    category: '音階介紹',
    question: '音階起始的第一個音，稱為什麼？',
    options: [
      { id: 'a', label: '屬音' },
      { id: 'b', label: '導音' },
      { id: 'c', label: '主音' },
      { id: 'd', label: '中音' },
    ],
    correctOptionId: 'c',
    reference: '自行編寫；答案出處：網站「音階介紹」→ 音階定義第 3 頁',
  },
  {
    id: 'scale-2',
    topicId: 'scale',
    category: '音階介紹',
    question: '一個大調音階，扣掉最後回到主音的那個重複音之外，總共包含幾個不同的音？',
    options: [
      { id: 'a', label: '5個' },
      { id: 'b', label: '6個' },
      { id: 'c', label: '7個' },
      { id: 'd', label: '8個' },
    ],
    correctOptionId: 'c',
    reference: '附錄一｜了解・說明・概念知識 4「能說明音階的組成」；5「能說明大音階的組成」',
  },
  {
    id: 'scale-3',
    topicId: 'scale',
    category: '音階介紹',
    question: 'C 大調音階中，第七個音（B）稱為？',
    options: [
      { id: 'a', label: '中音' },
      { id: 'b', label: '導音' },
      { id: 'c', label: '下中音' },
      { id: 'd', label: '上主音' },
    ],
    correctOptionId: 'b',
    reference: '自行編寫；答案出處：網站「音階介紹」→ 音階定義第 2 頁（音級名稱）',
  },
  {
    id: 'scale-4',
    topicId: 'scale',
    category: '音階介紹',
    question: '大音階中，音與音之間的「全音、半音」排列順序是？',
    options: [
      { id: 'a', label: '全 全 半 全 全 全 半' },
      { id: 'b', label: '全 半 全 全 半 全 全' },
      { id: 'c', label: '半 全 全 半 全 全 全' },
      { id: 'd', label: '全 全 全 半 全 全 半' },
    ],
    correctOptionId: 'a',
    reference: '附錄一｜記憶・回憶・概念知識 3「能回憶大音階的組成方式」',
  },
  {
    id: 'scale-5',
    topicId: 'scale',
    category: '音階介紹',
    question: '小音階常見的三種形式是？',
    options: [
      { id: 'a', label: '大、中、小小音階' },
      { id: 'b', label: '自然、和聲、旋律小音階' },
      { id: 'c', label: '上行、下行、平行小音階' },
      { id: 'd', label: '純、增、減小音階' },
    ],
    correctOptionId: 'b',
    reference: '附錄一｜記憶・確認・概念知識 13「能確認正確的小音階形式與名稱」；了解・說明・概念知識 10「能說明小音階的形式」',
  },
  {
    id: 'scale-6',
    topicId: 'scale',
    category: '音階介紹',
    question: '大調五聲音階（Pentatonic scale）總共由幾個音組成？',
    options: [
      { id: 'a', label: '3 個' },
      { id: 'b', label: '5 個' },
      { id: 'c', label: '7 個' },
      { id: 'd', label: '12 個' },
    ],
    correctOptionId: 'b',
    reference: '自行編寫；答案出處：網站「音階介紹」→ 音階類型第 7 頁；論文附錄一｜了解・說明・事實知識 6「能說明中國的五聲音階」（範圍相近）',
  },
  {
    id: 'scale-7',
    topicId: 'scale',
    category: '音階介紹',
    question: '半音音階（Chromatic scale）中，每兩個相鄰音之間的音程是？',
    options: [
      { id: 'a', label: '全音' },
      { id: 'b', label: '半音' },
      { id: 'c', label: '大三度' },
      { id: 'd', label: '完全五度' },
    ],
    correctOptionId: 'b',
    reference: '自行編寫；答案出處：網站「音階介紹」→ 音階類型第 5 頁',
  },
  // chord 和弦介紹
  {
    id: 'chord-1',
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
    reference: '附錄一｜記憶・確認・概念知識 8「能確認正確的三和弦」',
  },
  {
    id: 'chord-2',
    topicId: 'chord',
    category: '和弦介紹',
    question: '在三和弦上方再疊加一個音，形成的和弦稱為？',
    options: [
      { id: 'a', label: '二和弦' },
      { id: 'b', label: '五和弦' },
      { id: 'c', label: '七和弦' },
      { id: 'd', label: '全音和弦' },
    ],
    correctOptionId: 'c',
    reference: '附錄一｜記憶・確認・概念知識 9「能確認正確的七和弦」；了解・分類・概念知識 4「能分類三和弦、七和弦與屬七和弦」',
  },
  {
    id: 'chord-3',
    topicId: 'chord',
    category: '和弦介紹',
    question: '和弦是由音符如何組合而成的？',
    options: [
      { id: 'a', label: '同時演奏的多個音' },
      { id: 'b', label: '依序彈奏的單音旋律' },
      { id: 'c', label: '只有兩個音的組合' },
      { id: 'd', label: '只能用鋼琴彈奏的音' },
    ],
    correctOptionId: 'a',
    reference: '自行編寫（論文沒有對應指標）；範圍屬於「三和弦、七和弦」相關指標，但沒有直接對應條目',
  },
  {
    id: 'chord-4',
    topicId: 'chord',
    category: '和弦介紹',
    question: '由 C、E、G 三個音疊成的和弦，是什麼和弦？',
    options: [
      { id: 'a', label: 'C 大三和弦' },
      { id: 'b', label: 'C 小三和弦' },
      { id: 'c', label: 'C 七和弦' },
      { id: 'd', label: 'G 大三和弦' },
    ],
    correctOptionId: 'a',
    reference: '附錄一｜應用・執行・概念知識 14「能執行三和弦、七和弦與屬七和弦知識」',
  },
  {
    id: 'chord-5',
    topicId: 'chord',
    category: '和弦介紹',
    question: '三和弦最下面的那個音，稱為什麼？',
    options: [
      { id: 'a', label: '三音' },
      { id: 'b', label: '五音' },
      { id: 'c', label: '根音' },
      { id: 'd', label: '七音' },
    ],
    correctOptionId: 'c',
    reference: '自行編寫（論文沒有對應指標）；「根音」不在論文指標內，僅範圍屬於三和弦',
  },
  {
    id: 'chord-6',
    topicId: 'chord',
    category: '和弦介紹',
    question: '三和弦一共有哪四種型態？',
    options: [
      { id: 'a', label: '大、小、增、減' },
      { id: 'b', label: '大、中、小、微' },
      { id: 'c', label: '完全、大、小、增' },
      { id: 'd', label: '主、屬、下屬、導' },
    ],
    correctOptionId: 'a',
    reference: '自行編寫；答案出處：網站「和弦介紹」→ 三和弦第 2 頁',
  },
  // tools 視覺化工具
  {
    id: 'tools-1',
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
    reference: '自行編寫（論文沒有對應指標）',
  },
  {
    id: 'tools-2',
    topicId: 'tools',
    category: '視覺化工具',
    question: '「五度圈（Circle of Fifths）」是把 12 個音，依照什麼關係排成一圈？',
    options: [
      { id: 'a', label: '完全五度' },
      { id: 'b', label: '完全四度' },
      { id: 'c', label: '大三度' },
      { id: 'd', label: '半音' },
    ],
    correctOptionId: 'a',
    reference: '自行編寫（論文沒有對應指標）',
  },
  {
    id: 'tools-3',
    topicId: 'tools',
    category: '視覺化工具',
    question: '「半音圈（Chromatic Circle）」把 12 個半音排成一圈，主要是為了呈現什麼？',
    options: [
      { id: 'a', label: '音的長短' },
      { id: 'b', label: '12 音之間的循環關係' },
      { id: 'c', label: '音量大小' },
      { id: 'd', label: '樂器種類' },
    ],
    correctOptionId: 'b',
    reference: '自行編寫（論文沒有對應指標）',
  },
];

// 依 knowledgeTopics 的單元順序，從每個單元的題庫裡各隨機抽一題，
// 組成這次前測要問的題目（目前每個單元都有題目，過濾寫法是為了在
// 題庫跟 knowledgeTopics 之後各自增修時，不會因為單元對不上而壞掉）。
export function pickPlacementQuestions(): PlacementQuestion[] {
  return knowledgeTopics
    .map((topic) => {
      const pool = placementQuestionBank.filter((question) => question.topicId === topic.id);
      if (pool.length === 0) return null;
      return pool[Math.floor(Math.random() * pool.length)];
    })
    .filter((question): question is PlacementQuestion => question !== null);
}

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
    ? `根據你的回答，你對「${weakestTitle}」還不太熟悉，答對了 ${correctCount}/${answers.length} 題。\n我們建議從下面這幾個單元開始。`
    : `根據你的回答，你已經對基礎樂理很熟悉了！答對了 ${correctCount}/${answers.length} 題。\n可以挑戰更進階的單元。`;

  return { message, recommendedUnits };
}
