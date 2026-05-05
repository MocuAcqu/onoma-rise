# 專案名稱
### 音擬而起 OnomaRise
- Onoma（來自 Onomatopoeia 擬聲詞）
- Rise（而起）

### 介面畫面
| 起始畫面 | 登入畫面 | HomePage | About |
|:--:|:--:|:--:|:--:|
|<img src="https://github.com/MocuAcqu/onoma-rise/blob/main/readme_img/%E8%B5%B7%E5%A7%8B%E7%95%AB%E9%9D%A2.png"> | <img src="https://github.com/MocuAcqu/onoma-rise/blob/main/readme_img/%E7%99%BB%E5%85%A5%E7%95%AB%E9%9D%A2.png"> | <img src="https://github.com/MocuAcqu/onoma-rise/blob/main/readme_img/HomePage.png"> |  |

# 技術
- 建構工具: Vite - 啟動快、反應迅速，開發體驗極佳。
- 前端框架: React.js - 元件化開發，管理複雜的 UI 狀態。
- 程式語言: TypeScript - 增加程式碼的穩定性，避免很多低級錯誤。
- 核心音訊庫: Tone.js - Web Audio API 的最佳封裝，處理聲音合成、錄音、節拍都非常方便。
- 樣式方案: Styled-components 或 Tailwind CSS - 依團隊喜好選擇，前者適合元件化的精細樣式，後者適合快速排版。

# 預計資料夾結構
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

# 啟動方式
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


# 初步建立步驟 (供參考)
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

