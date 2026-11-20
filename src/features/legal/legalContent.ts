// 使用條款與隱私權政策的文字內容。
// 修改條款時只需編輯此檔，並同步更新 LAST_UPDATED。

export const LAST_UPDATED = '2026 年 11 月 20 日';
export const CONTACT_EMAIL = 'a0901422997@gmail.com';

export type LegalSummary = {
  title: string;
  text: string;
};

export type LegalSection = {
  id: string;
  title: string;
  /** 條列前的引言 */
  lead?: string;
  /** 條列項目 */
  items?: string[];
  /** 一般段落（顯示在條列之後） */
  paragraphs?: string[];
};

export type LegalDocument = {
  id: 'terms' | 'privacy';
  label: string;
  intro: string;
  summaries: LegalSummary[];
  sections: LegalSection[];
};

export const termsDocument: LegalDocument = {
  id: 'terms',
  label: '使用條款',
  intro:
    '歡迎使用「音擬而起 OnomaRise」（以下稱「本網站」）。本網站為學生畢業專題作品，由團隊成員共同開發與維護（以下稱「我們」）。當您開始使用本網站，即表示您已閱讀、理解並同意遵守以下條款。',
  summaries: [
    { title: '非商業的學習工具', text: '本網站是畢業專題作品，免費提供，僅供音樂學習與研究使用。' },
    { title: '辨識結果僅供參考', text: '樂譜辨識、音訊辨識與和聲分析都是演算法估計，可能有誤。' },
    { title: '請上傳有權使用的內容', text: '上傳的樂譜或音訊須為您擁有或已獲授權的內容。' },
    { title: '服務可能停止', text: '專題結束後，網站可能停止服務並刪除資料，我們會盡量事先公告。' },
  ],
  sections: [
    {
      id: 'terms-service',
      title: '服務說明',
      paragraphs: [
        '本網站提供互動式樂理教材、程度測驗、調性網路（Tonnetz）視覺化，以及音訊與樂譜辨識等功能，目的在協助使用者連結樂譜、聲音與和聲結構。',
        '本網站為學生畢業專題作品，不以營利為目的，也不收取任何費用。',
      ],
    },
    {
      id: 'terms-account',
      title: '帳號註冊與使用',
      items: [
        '部分功能（例如學習紀錄、按讚、個人資料頁）需要登入後才能使用。您可以使用 Email 註冊，或使用 Google 帳號登入。',
        '請提供正確的資料，並妥善保管您的密碼。透過您的帳號進行的操作，將視為您本人的行為。',
        '若發現帳號遭他人盜用，請盡快與我們聯絡。',
      ],
    },
    {
      id: 'terms-conduct',
      title: '使用規範',
      lead: '使用本網站時，請勿從事下列行為：',
      items: [
        '上傳違法、侵害他人權利，或含有惡意程式的檔案。',
        '以自動化程式大量存取、大量上傳檔案，或以其他方式干擾、破壞本網站的運作。',
        '嘗試未經授權存取他人帳號、系統或資料。',
        '冒用他人身分，或將本網站用於任何違法用途。',
      ],
    },
    {
      id: 'terms-content',
      title: '上傳內容與著作權',
      items: [
        '您上傳的樂譜圖片、PDF 或音訊檔案，著作權仍屬於原權利人，本網站不會取得其所有權。',
        '上傳前，請確認您擁有該內容的權利，或您的使用方式符合著作權法的合理使用範圍。因上傳內容所引起的著作權爭議，由上傳者自行負責。',
        '您同意我們為了提供辨識功能，在必要範圍內暫時儲存與處理您上傳的檔案。檔案保存方式請見「隱私權政策」。',
        '若您認為本網站上的內容侵害您的權利，請來信通知，我們會盡快處理。',
      ],
    },
    {
      id: 'terms-ip',
      title: '智慧財產權',
      paragraphs: [
        '本網站的教材內容、介面設計、品牌 Logo、吉祥物、角色動畫與程式碼，著作權均屬於本網站開發團隊。未經同意，請勿重製、改作或用於商業用途。',
        '本網站使用的開源軟體與第三方素材（例如 Tone.js、OpenSheetMusicDisplay、Salamander 鋼琴音源等），依各自的授權條款使用，其權利屬於原作者。',
      ],
    },
    {
      id: 'terms-disclaimer',
      title: '免責聲明',
      items: [
        '樂譜辨識、音訊辨識、調性推測、和弦與級數分析都是由演算法自動產生，結果可能因圖片品質、錄音條件或樂曲複雜度而有錯誤，僅供學習參考，不代表唯一或正確的音樂分析。',
        '本網站的教材與分析不能取代專業教師的指導或評量。',
        '本網站以「現況」提供，我們會盡力維持正常運作，但不保證服務不中斷、沒有錯誤，或辨識功能隨時可用。',
      ],
    },
    {
      id: 'terms-liability',
      title: '責任限制',
      paragraphs: [
        '在法律允許的範圍內，對於您因使用或無法使用本網站所產生的任何損失（包括資料遺失或依據辨識結果所做的判斷），我們不負賠償責任。',
      ],
    },
    {
      id: 'terms-termination',
      title: '服務變更與終止',
      items: [
        '本網站為畢業專題作品，我們可能在專題結束後停止維護或關閉服務，並刪除所有帳號與資料。若有此安排，我們會盡量事先在網站上公告。',
        '我們也可能因維護、改版或其他原因，修改、暫停或停止部分功能。',
        '若您違反本條款，我們有權暫停或刪除您的帳號。',
      ],
    },
    {
      id: 'terms-changes',
      title: '條款修改',
      paragraphs: [
        '我們可能視需要修改本條款，修改後會更新本頁上方的「最後更新日期」。條款修改後，您繼續使用本網站即表示同意修改後的內容。',
      ],
    },
    {
      id: 'terms-law',
      title: '準據法',
      paragraphs: ['本條款的解釋與適用，以中華民國法律為準據法。'],
    },
    {
      id: 'terms-contact',
      title: '聯絡我們',
      paragraphs: [`若對本條款有任何疑問，請來信至 ${CONTACT_EMAIL}。`],
    },
  ],
};

export const privacyDocument: LegalDocument = {
  id: 'privacy',
  label: '隱私權政策',
  intro:
    '我們重視您的隱私。本政策說明本網站會收集哪些資料、如何使用與保存，以及您可以如何管理自己的資料。',
  summaries: [
    { title: '只收集必要資料', text: '暱稱、Email、加密後的密碼與學習紀錄，用來提供登入與學習進度功能。' },
    { title: '上傳檔案會自動刪除', text: '上傳的樂譜最長保留 24 小時；音訊處理完畢後立即刪除。' },
    { title: '不販售、不用於廣告', text: '我們不會出售您的資料，也不會用於廣告或行銷。' },
    { title: '可以要求刪除', text: `來信 ${CONTACT_EMAIL}，即可要求查詢或刪除您的帳號與資料。` },
  ],
  sections: [
    {
      id: 'privacy-collect',
      title: '我們收集的資料',
      items: [
        '帳號資料：註冊時填寫的暱稱與 Email，以及密碼。密碼會先以 bcrypt 加密後才儲存，我們無法得知您的原始密碼。',
        'Google 登入資料：若使用 Google 帳號登入，我們會取得您的 Google 名稱、Email 與 Google 帳號識別碼，不會取得您的 Google 密碼。',
        '學習紀錄：您瀏覽過與按讚的章節、各單元測驗的作答次數與是否通過，以及是否使用過「關於我們」、音訊辨識、樂譜辨識等功能。',
        '上傳檔案：您為了辨識而上傳的樂譜圖片、PDF 或音訊檔案，以及系統產生的辨識結果。',
        '章節統計：各章節的觀看數與按讚數（以總數統計顯示）。',
      ],
    },
    {
      id: 'privacy-use',
      title: '資料的使用目的',
      items: [
        '提供登入、身分驗證與帳號管理。',
        '記錄並顯示您的學習進度、測驗紀錄與喜歡的章節。',
        '執行音訊辨識與樂譜辨識，並回傳結果。',
        '以不識別個人的方式，統計功能使用情形，用於專題研究與改善網站。',
      ],
      paragraphs: ['我們不會將您的資料出售或提供給他人，也不會用於廣告或行銷。'],
    },
    {
      id: 'privacy-retention',
      title: '資料的保存與刪除',
      items: [
        '帳號資料與學習紀錄：保存至您要求刪除帳號，或本網站停止服務為止。',
        '上傳的樂譜檔案與辨識結果：辨識完成後最長保留 24 小時，期滿自動刪除。',
        '上傳的音訊檔案：僅在辨識處理期間暫存，處理完成後立即刪除，不會長期保存。',
        '本網站停止服務時，我們會刪除所有帳號與資料。',
      ],
    },
    {
      id: 'privacy-browser',
      title: '瀏覽器儲存空間',
      paragraphs: [
        '本網站使用瀏覽器的 localStorage 記錄您的登入名稱，以及 sessionStorage 暫存程度測驗的推薦結果，用來維持登入狀態與頁面顯示。這些資料只存在您的瀏覽器中，您可以透過「登出」或清除瀏覽器資料將其移除。',
        '本網站沒有使用廣告追蹤或第三方分析工具。',
      ],
    },
    {
      id: 'privacy-third-party',
      title: '第三方服務',
      lead: '為了提供網站功能，本網站會使用下列第三方服務，這些服務可能依其自身的隱私權政策處理您的部分連線資訊（例如 IP 位址）：',
      items: [
        'Google 登入（Google Identity Services）：處理 Google 帳號登入。',
        'Google Fonts：提供網站字型。',
        'Tone.js 音源（tonejs.github.io）：提供鋼琴取樣音源。',
        'MongoDB 資料庫與雲端主機服務：儲存帳號、學習紀錄與辨識工作資料。',
      ],
    },
    {
      id: 'privacy-security',
      title: '資料安全',
      paragraphs: [
        '我們以加密方式儲存密碼，並限制資料庫的存取權限，盡力保護您的資料。但網路傳輸與儲存無法保證百分之百安全，請勿在本網站上傳含有敏感個人資料的檔案。',
      ],
    },
    {
      id: 'privacy-rights',
      title: '您的權利',
      paragraphs: [
        `依據個人資料保護法，您可以要求查詢、閱覽、補充、更正、停止使用或刪除您的個人資料。目前網站上尚未提供自行刪除帳號的功能，請來信至 ${CONTACT_EMAIL}，並註明您的帳號 Email，我們會在確認身分後盡快處理。`,
      ],
    },
    {
      id: 'privacy-minors',
      title: '未成年使用者',
      paragraphs: ['若您未滿 18 歲，請在父母或法定代理人閱讀並同意本政策後再註冊使用。'],
    },
    {
      id: 'privacy-changes',
      title: '政策修改',
      paragraphs: ['我們可能視需要修改本政策，修改後會更新本頁上方的「最後更新日期」。'],
    },
    {
      id: 'privacy-contact',
      title: '聯絡我們',
      paragraphs: [`若對本政策或您的資料有任何疑問，請來信至 ${CONTACT_EMAIL}。`],
    },
  ],
};

export const legalDocuments = [termsDocument, privacyDocument];
