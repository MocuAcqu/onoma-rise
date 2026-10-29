# Render + 辨識主機部署

根目錄的 `render.yaml` 會建立兩個 Render 服務：

- `onoma-rise`：Vite/React Static Site。
- `onoma-rise-api`：Node/Express Web Service，對瀏覽器提供唯一 API 入口。

Python 辨識不放 Render，而是放 AWS Lightsail 或 Oracle VM；Node 會把辨識
路由代理到該主機。

## 1. 先部署辨識主機

使用 AWS 時依照 [`../aws-lightsail/README.md`](../aws-lightsail/README.md)；使用
Oracle 時依照 [`../oracle/README.md`](../oracle/README.md)。完成 Python API 與
worker 後，取得可由 Render 連線的 HTTPS 網址。先確認：

```bash
curl https://recognition.example.com/api/health/recognition
```

## 2. 建立 Render Blueprint

在 Render Dashboard 選擇 **New → Blueprint**，連接這個 repository。Render 會讀取
根目錄的 `render.yaml`。第一次建立時填入所有標記為 `sync: false` 的值。

Node Web Service：

```dotenv
MONGO_URI=mongodb+srv://...
CORS_ORIGINS=https://onoma-rise.onrender.com
RECOGNITION_API_URL=https://recognition.example.com
RECOGNITION_PROXY_TOKEN=與辨識主機完全相同的長隨機字串
```

Static Site：

```dotenv
VITE_GOOGLE_CLIENT_ID=你的-google-client-id
VITE_API_BASE_URL=https://onoma-rise-api.onrender.com
```

實際 Render 名稱若被占用而改名，以上兩個 `.onrender.com` 網址也要跟著改。前端的
`VITE_*` 是建置期設定，修改後要重新部署 Static Site。

## 3. 外部服務設定

- Google OAuth 的 Authorized JavaScript origins 加入 Static Site 的完整 HTTPS origin。
- MongoDB Atlas 建立專用資料庫帳號，並允許 Render Web Service 與
  Lightsail Static IP 連線。Lightsail 使用 MongoDB storage backend 時，需在
  `/etc/onoma-rise/recognition.env` 另外設定同一組 `MONGO_URI` 及
  `MONGO_DATABASE`。
- 回到辨識主機的 `/etc/onoma-rise/recognition.env`，確認 shared token 與
  Render 相同。

## 4. 驗收

依序檢查：

```bash
curl https://onoma-rise-api.onrender.com/api/health
curl https://onoma-rise-api.onrender.com/api/health/recognition
```

第二個請求是經由 Render Node 轉送，不是瀏覽器直連辨識主機。最後再從前端測試登入、
音訊分析、樂譜上傳、輪詢與結果下載。

Render 免費 Web Service 閒置後會休眠，因此第一次 API 請求可能較慢；正式展示若不能
接受冷啟動，需改用不休眠的方案。

## 免費版試跑 Python 辨識

若 Node API 與 Static Site 已經存在，只想先驗證樂譜辨識，不要再次套用根目錄的
`render.yaml`。改在 Render 建立另一個 Blueprint，將 Blueprint Path 指向：

```text
render-recognition-free.yaml
```

這份 Blueprint 只建立 `onoma-rise-recognition-free`。Render 免費方案沒有免費
Background Worker，因此 `python-backend/render-start-free.sh` 會在同一個 Web Service
內同時監督 FastAPI 與一個 worker。這是測試配置，不是正式部署架構。

建立 Blueprint 時填入：

```dotenv
MONGO_URI=與現有 Node API 相同的 Atlas URI
MONGO_DATABASE=與現有 Node API 相同的資料庫名稱
RECOGNITION_PROXY_TOKEN=至少 32 字元的隨機字串
```

部署完成後，把既有 Node API 的環境變數更新為：

```dotenv
RECOGNITION_API_URL=https://onoma-rise-recognition-free.onrender.com
RECOGNITION_PROXY_TOKEN=與 Python 服務完全相同的字串
```

然後重新部署 Node API，依序檢查：

```bash
curl https://onoma-rise-recognition-free.onrender.com/api/health/recognition
curl https://你的-node-api.onrender.com/api/health/recognition
```

免費 instance 只有 512 MB RAM／0.1 CPU，且閒置 15 分鐘會休眠。試跑設定已關閉
RapidOCR 與 YOLO，並將 HOMR 改為 batch 1、單執行緒；若 Render log 出現 Out of
memory，代表 HOMR 的實際尖峰仍超過免費方案，應改用至少 1 GB 的運算方案，而不是
繼續壓低解析度犧牲辨識品質。
