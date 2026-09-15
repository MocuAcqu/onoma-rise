export type GuideNote = { solfege: string; pitch: string; degree?: number };
export type GuideExample = { label: string; title: string; explanation: string; notes: GuideNote[]; showDegrees?: boolean; lineBreakAfter?: number; spokenSyllables?: boolean };
export type GuideLesson = { hints: string[]; example?: GuideExample };

const twinkle: GuideNote[] = [
  { solfege: 'Do', pitch: 'C' }, { solfege: 'Do', pitch: 'C' }, { solfege: 'Sol', pitch: 'G' }, { solfege: 'Sol', pitch: 'G' }, { solfege: 'La', pitch: 'A' }, { solfege: 'La', pitch: 'A' }, { solfege: 'Sol', pitch: 'G' },
];

// 角色提示。
const lessons: Record<string, GuideLesson> = {
  'pitch-name': { hints: ['嗨，我是 Onoma。我將用《小星星》帶你認識音樂！發光時，可以點我看看!',  '我在發光就點我!記得開啟音量喔!','音名是每個音在鍵盤上的固定位置。'], example: { label: '顯示《小星星》範例', title: '《小星星》開頭：唱名與音名', explanation: 'Do、Sol、La 分別對應 C、G、A；讓旋律的聲音與琴鍵位置直接連起來。', notes: twinkle } },
  solfege: { hints: ['換成唱名來讀讀看：Do Do Sol Sol~', '點我!點我!疑?沒發光就沒事了', '看看唱名怎麼落在琴鍵上。'], example: { label: '顯示唱名範例', title: '《小星星》開頭：跟著唱名走', explanation: '用首調唱名跟著旋律走，感受 Do 出發、跳到 Sol、再回到 Sol 的輪廓。', notes: twinkle } },
  accidentals: { hints: ['升降記號會讓同一個位置上下移動半音。', '像是鋼琴鍵盤上有黑鍵與白鍵。', '聽出它變高或變低了嗎?'] },
  'sound-formation': { hints: ['聲音先振動，才成為我們聽見的音，就像Onoma講話，也要震動小舌!', '聲波有高有低!', '觀察到不同的頻率和波長了嗎?'] },
  equalTemperament: { hints: ['十二平均律讓每個半音有相同的距離。', '跟著圓與鍵盤慢慢走一圈，你聽到甚麼?', '按按看!聽聽看!'] },
  'pitch-class-set': { hints: ['把不同高低的同名音，想成同一個類別。', '先找找看，有重複出現的音名嗎?', '同一類音可以出現在不同八度。'] },
  'interval-definition': { hints: ['《小星星》的 1 跳到 5，是純五度......Onoma沒辦法跳這麼遠', '第二句 4 4 3 3 2 2 1，是向下級進，像星星滾下草坪一樣!', '用數字看看跳進與級進!'], example: { label: '比較《小星星》音程', title: '《小星星》：1155665／4433221', explanation: '第一行 1 1 5 5 6 6 5 裡的 1 → 5 是開闊的純五度；第二行 4 4 3 3 2 2 1 每次只移動一級，形成平穩的向下級進。', notes: [{ solfege: 'Do', pitch: 'C', degree: 1 }, { solfege: 'Do', pitch: 'C', degree: 1 }, { solfege: 'Sol', pitch: 'G', degree: 5 }, { solfege: 'Sol', pitch: 'G', degree: 5 }, { solfege: 'La', pitch: 'A', degree: 6 }, { solfege: 'La', pitch: 'A', degree: 6 }, { solfege: 'Sol', pitch: 'G', degree: 5 }, { solfege: 'Fa', pitch: 'F', degree: 4 }, { solfege: 'Fa', pitch: 'F', degree: 4 }, { solfege: 'Mi', pitch: 'E', degree: 3 }, { solfege: 'Mi', pitch: 'E', degree: 3 }, { solfege: 'Re', pitch: 'D', degree: 2 }, { solfege: 'Re', pitch: 'D', degree: 2 }, { solfege: 'Do', pitch: 'C', degree: 1 }], showDegrees: true, lineBreakAfter: 6 } },
  'interval-quality': { hints: ['音程除了距離，也有不同的性質。', '多操作幾次，開啟聲音聽聽!', '相同音程數字也可能聽起來不太一樣喔'] },
  'scale-definition': { hints: ['《小星星》只使用 C 大調的自然音。', '把旋律音收集起來，就能看見它落在音階裡。', '你知道對話框也能點擊嗎?雖然不太重要'], example: { label: '查看 C 大調音高集合', title: '《小星星》：C 大調的聲音空間', explanation: '這段旋律使用 C、D、E、F、G、A，自然落在明亮的 C 大調音階之中。', notes: twinkle } },
  'scale-types': { hints: ['同一首歌，把 La 降半音......怎麼感覺陰森森的><。', '音階排列改變，有時造就了大調與小調的差異呢', '聽聽同旋律的暗色版本，你喜歡嗎'], example: { label: '顯示小調變奏片段', title: '《小星星》小調變奏：色彩改變', explanation: '保留旋律輪廓，將 La 改為降 La，聽見同一顆星星從明亮轉為暗色。', notes: [{ solfege: 'Do', pitch: 'C' }, { solfege: 'Do', pitch: 'C' }, { solfege: 'Sol', pitch: 'G' }, { solfege: 'Sol', pitch: 'G' }, { solfege: 'La♭', pitch: 'A' }, { solfege: 'La♭', pitch: 'A' }, { solfege: 'Sol', pitch: 'G' }] } },
  triads: { hints: ['與畫面互動，聽聽看!', 'C、F、G 是最基本的三個功能和弦。', '和別人一起唱歌也是在製作和聲呢'], example: { label: '顯示 I IV V 三和弦', title: '《小星星》：I - IV - V 的和聲柱子', explanation: '已刪除用 C（I）、F（IV）、G（V）三個大三和弦，就能為《小星星》建立最基本的和聲走向。', notes: [{ solfege: 'Do', pitch: 'C' }, { solfege: 'Mi', pitch: 'E' }, { solfege: 'Sol', pitch: 'G' }, { solfege: 'Fa', pitch: 'F' }, { solfege: 'La', pitch: 'A' }, { solfege: 'Sol', pitch: 'G' }] } },
  'seventh-chords': { hints: ['七和弦和三和弦，你喜歡哪個?', '有時候風格就來自不同和弦排列呢!', '回答過測驗題目了嗎? Onoma常常拿滿分~'], example: { label: '顯示 ii V I 和聲片段', title: '爵士感的 ii - V - I：七和弦色彩', explanation: '已刪除以短小原創的 ii - V - I 音型，感受七和弦多出來的色彩與回到主和弦的釋放。', notes: [{ solfege: 'Re', pitch: 'D' }, { solfege: 'Fa', pitch: 'F' }, { solfege: 'Sol', pitch: 'G' }, { solfege: 'Si', pitch: 'B' }, { solfege: 'Do', pitch: 'C' }, { solfege: 'Mi', pitch: 'E' }] } },
  'chord-symbols': { hints: ['和弦記號是把一組聲音濃縮成短代號。', '注意記號後面的補充，他很小，但有不同意思!', 'C、Cm、C7......差在哪呢'] },
  tonnetz: { hints: ['哇!好像一張音樂藏寶圖!', 'Tonnetz 能把電影感的和弦滑動變成一張地圖。', '去玩玩調性網路吧!'], example: { label: '顯示電影感和聲移動', title: 'Tonnetz：共同音與最短移動', explanation: '已刪除這是一個原創的電影感和聲片段：留住共同音、只讓少數音滑動，便能產生非傳統但連貫的變化。', notes: [{ solfege: 'Do', pitch: 'C' }, { solfege: 'Mi', pitch: 'E' }, { solfege: 'Sol', pitch: 'G' }, { solfege: 'Mi', pitch: 'E' }, { solfege: 'La', pitch: 'A' }, { solfege: 'Do', pitch: 'C' }] } },
  'chromatic-circle': { hints: ['半音圈把一個八度排成圓，像甜甜圈一樣......好餓', '你聽!每往旁邊一格，都是最小的半音移動', '跟著圓上的位置慢慢認識音高吧!'] },
  'circle-of-fifths': { hints: ['五度圈把關係密切的調排在一起。', '相鄰位置經常只差一個升降記號。', '點選相鄰調，觀察它們有什麼共同點。'] },
};

const fallback: GuideLesson = { hints: ['我是 Onoma，陪你把聽見的聲音慢慢看懂。', '試著按按看頁面上的互動按鍵。'] };
export const getGuideLesson = (chapterId?: string) => lessons[chapterId ?? ''] ?? fallback;
