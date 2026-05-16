<p align="center">
  <img src="https://github.com/MocuAcqu/onoma-rise/blob/main/src/assets/images/main-logo.png" alt="OnomaRise" width="40%">
</p>

<h1 align="center">
  <strong>讓抽象的音樂理論直觀可見</strong>
</h1>

<p align="center">
  <strong>以調性網路為核心，結合音訊辨識與雙通道的樂理知識學習，帶你用全新的幾何視角看見音樂、感受和聲。</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB">
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white">
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white">
</p>
<br>

---

# | 為什麼需要 OnomaRise？
### 解決傳統音樂學習的痛點，降低認知門檻

- ### 調性網路
  - 問題發現： 傳統鋼琴鍵盤為「線性」排列，難以直接看透調性之間的距離與和聲走向。
  - 我們的優勢： 結合歐拉發明的調性網路，將複雜和弦簡化為三角幾何關係，提供全新的音樂閱讀方式。

- ### 音樂辨識
  - 問題發現： 市面上缺乏將「聽覺聲音」與「視覺化樂理」即時整合的分析系統。
  - 我們的優勢： 整合 pYIN / CQT 演算法，實作聲音訊號轉化空間路徑，拆解並分析音檔結構，用多種形式解析和視覺化音訊資料。

- ### 樂理知識
  - 問題發現： 樂理知識繁雜且抽象，非科班出身的初學者容易感到挫折或不易理解。
  - 我們的優勢： 將音樂概念進行統整與分類，透過網頁互動機制，讓使用者實際操作並雙通道學習，降低學習門檻。

---

# | 三大核心功能

### 1. 幾何視覺化的調性網路
用點、線、面看見音樂的距離，將抽象的和聲移動化為直觀的幾何翻轉。
<p align="center"><img src="https://github.com/MocuAcqu/onoma-rise/blob/main/readme_img/MK.gif" width="70%" style="border-radius: 10px;"></p>

### 2. 音樂辨識的訊號轉換
將聲音訊號化，並在調性網路上即時亮起對應軌跡，看見音樂的形狀。
<p align="center"><img src="https://github.com/MocuAcqu/onoma-rise/blob/main/readme_img/MK.gif" width="70%" style="border-radius: 10px;"></p>

### 3. 雙通道互動的樂理學習
六大主題、十六個知識章節，一共53種頁面可以互動，實現在網頁直覺式地做中學。
<p align="center"><img src="https://github.com/MocuAcqu/onoma-rise/blob/main/readme_img/MK.gif" width="70%" style="border-radius: 10px;"></p>

---

# | 專案資訊

<details>
<summary>目前資料夾結構</summary>
  
```
音擬而起/
├── public/                  # 靜態資源
│   ├── assets/
│   │   ├── accidentals-example-left.png
│   │   ├── accidentals-example-right.png
│   │   └── interval-degree-static.png
│   ├── sounds/
│   │   └── solfege/         # 唱名音檔 (do, re, mi...)
│   │       ├── do.mp3
│   │       ├── re.mp3
│   │       ├── mi.mp3
│   │       ├── fa.mp3
│   │       ├── sol.mp3
│   │       ├── la.mp3
│   │       └── si.mp3
│   └── logo.png
├── readme_img/              # README 使用的截圖
│   ├── HomePage.png
│   ├── 登入畫面.png
│   └── 起始畫面.png
├── server/                  # 後端伺服器 (Node.js/Express)
│   ├── models/
│   │   └── User.js          # 定義使用者的資料格式
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   └── server.js            # 主程式，設置 API 路由與資料庫連線
├── src/                     # 前端原始碼 (React + TypeScript)
│   ├── assets/
│   │   └── images/          # 專案介面圖示
│   │       ├── footer-logo.png
│   │       ├── login-logo.png
│   │       ├── main-logo.png
│   │       └── navbar-logo.png
│   ├── components/          # 可重用的 React 元件
│   │   ├── interactive/     # 互動式樂理教學組件
│   │   │   ├── Accidentals/     # 變音記號
│   │   │   ├── EqualTemperament/# 十二平均律
│   │   │   ├── Interval/         # 音程定義
│   │   │   ├── PitchClassSet/    # 音級集合
│   │   │   ├── PitchName/        # 音名教學
│   │   │   ├── Quality/          # 音程性質
│   │   │   ├── Scale/            # 音階基礎
│   │   │   ├── ScaleTypes/       # 音階種類
│   │   │   ├── SeventhChords/    # 七和弦
│   │   │   ├── Solfege/          # 唱名教學
│   │   │   ├── SoundFormation/   # 聲音的形成 (物理特性)
│   │   │   ├── Triads/           # 三和弦
│   │   │   ├── AirMoleculeCanvas.tsx
│   │   │   ├── ChordStaff.tsx
│   │   │   ├── InteractiveStaff.tsx
│   │   │   ├── PianoKeyboard.tsx
│   │   │   ├── WaveformCanvas.tsx
│   │   │   └── WaveformCanvas2.tsx
│   │   ├── Footer.tsx
│   │   ├── LandingPage.tsx
│   │   ├── Navbar.tsx
│   │   └── SphereTransition.tsx  # 球體轉換動畫元件
│   ├── pages/               # 頁面路由元件
│   │   ├── AboutPage.tsx
│   │   ├── ChapterContentPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── Identify.tsx
│   │   ├── KnowledgePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── Profile.tsx
│   │   ├── TonnetzPage.tsx       # Tonnetz 音網圖形頁面
│   │   ├── TopicDetailPage.tsx
│   │   └── knowledgeData.ts      # 樂理課程資料定義
│   ├── App.tsx              # 應用程式主進入點與路由配置
│   ├── index.css
│   └── main.tsx             # React 渲染起點
├── .env.example
├── .gitattributes
├── .gitignore
├── README.md
├── eslint.config.js
├── index.html               # 網頁入口 HTML
├── package.json             # 前端依賴與腳本
├── package-lock.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts           # Vite 建構工具配置

```
</details>

<details>
<summary>專案啟動方式</summary>

移動到資料夾的位置:
```
cd onoma-rise
```

啟動本地前端:
```
npm run dev
```

啟動本地後端:
```
cd server
node server.js
```
</details>

<details>
<summary>建立專案參考步驟</summary>
  
```
npm create vite@latest onoma-rise --template react-ts
```

```
cd onoma-rise
```

```
npm install tone
git init
git add .
git commit -m "Initial commit: Setup project with Vite, React, TS"
```

```
git remote add origin https://github.com/MocuAcqu/onoma-rise.git
```

```
git branch -M main
git push -u origin main
```
</details>

# | 貢獻成員

<p align="center">
  <a href="https://github.com/MocuAcqu">
    <img src="https://github.com/MocuAcqu.png" width="80" style="border-radius: 50%; margin: 0 10px;" alt="邱鈺婷">
  </a>
  <a href="https://github.com/PhoebeLu1011">
    <img src="https://github.com/PhoebeLu1011.png" width="80" style="border-radius: 50%; margin: 0 10px;" alt="盧姵帆">
  </a>
  <a href="https://github.com/kurakanja">
    <img src="https://github.com/kurakanja.png" width="80" style="border-radius: 50%; margin: 0 10px;" alt="李佳璇">
  </a>
  <a href="https://github.com/pingxi2299">
    <img src="https://github.com/pingxi2299.png" width="80" style="border-radius: 50%; margin: 0 10px;" alt="呂雨璇">
  </a>
</p>

