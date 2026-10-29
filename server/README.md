# Node API

正式環境部署在 Render，除了登入、章節與進度 API，也作為瀏覽器的單一 API 入口。
設定 `RECOGNITION_API_URL` 後，辨識路由會代理到 Oracle Python API；同時必須設定
`RECOGNITION_PROXY_TOKEN`。本機兩者留空，仍由 Vite 分流到 Python `:8000`。

Node/Express API 負責登入、章節互動與學習進度，資料儲存在 MongoDB。

```text
server.js                  啟動程序與連線資料庫
src/app.js                 Express、CORS、路由與錯誤處理
src/features/auth.js       一般登入與 Google 登入
src/features/chapters.js   章節瀏覽及按讚
src/features/users.js      學習進度與 dashboard
src/models/                Mongoose schemas
```

本機啟動：

```bash
cp .env.example .env
npm install
npm start
```

健康檢查：`GET /api/health`。MongoDB 尚未就緒時會回傳 HTTP 503。
