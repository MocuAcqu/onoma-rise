# 專案名稱
### 音擬而起 OnomaRise
- Onoma（來自 Onomatopoeia 擬聲詞）
- Rise（而起）

### 介面畫面
| 起始畫面 | 登入畫面 | Home | About |
|:--:|:--:|:--:|:--:|
|<img src="https://github.com/MocuAcqu/onoma-rise/blob/main/readme_img/%E8%B5%B7%E5%A7%8B%E7%95%AB%E9%9D%A2.png"> | <img src="https://github.com/MocuAcqu/onoma-rise/blob/main/readme_img/%E7%99%BB%E5%85%A5%E7%95%AB%E9%9D%A2.png"> |  |  |

# 技術
- 建構工具: Vite - 啟動快、反應迅速，開發體驗極佳。
- 前端框架: React.js - 元件化開發，管理複雜的 UI 狀態。
- 程式語言: TypeScript - 增加程式碼的穩定性，避免很多低級錯誤。
- 核心音訊庫: Tone.js - Web Audio API 的最佳封裝，處理聲音合成、錄音、節拍都非常方便。
- 樣式方案: Styled-components 或 Tailwind CSS - 依團隊喜好選擇，前者適合元件化的精細樣式，後者適合快速排版。

# 預計資料夾結構
```
音擬而起/
├── public/              # 靜態資源，如 favicon.ico
├── server/
│   ├── server.js        # 主程式，設置 API
│   └── models/             
│       └── User.js      # 定義使用者的資料格式
├── src/
│   ├── assets/          # 圖片 (svg, png), 音檔範本 (mp3)
│   ├── components/      # 可重用的 React 元件
│   ├── core/            # 核心商業邏輯 (純 TS/JS)
│   │   ├── piano.ts     # 鋼琴的音高、琴鍵
│   │   └── Tonnetz.ts   # Tonnetz 座標、音高計算的核心演算法
│   ├── hooks/           # 自定義 Hooks (例如 useAudioPlayer)
│   ├── pages/           # 頁面對應的元件 (HomePage, AboutPage)
│   └── App.tsx          # 應用程式主進入點
├── package.json         # 專案設定檔
└── tsconfig.json        # TypeScript 設定檔
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

