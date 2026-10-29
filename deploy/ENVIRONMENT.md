# 環境變數總表

專案有三組彼此獨立的設定。前端變數在 **建置時** 寫入靜態檔；Node 與
Python 變數則在服務 **啟動時** 讀取。

## Render 前端

設定位置：Render Static Site 的 Environment。

| 變數 | 用途 | 秘密 |
| --- | --- | --- |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth 用戶端識別碼 | 否 |
| `VITE_API_BASE_URL` | Render Node API 的公開 HTTPS 網址 | 否 |

`VITE_*` 會出現在瀏覽器 bundle，絕對不能放密碼、MongoDB URI 或私鑰。修改後
必須重新建置前端。正式建置缺少任一必要值時會直接失敗。

## Node API

設定位置：Render Web Service 的 Environment。

| 變數 | 用途 | 秘密 |
| --- | --- | --- |
| `NODE_ENV` | 正式環境固定為 `production` | 否 |
| `MONGO_URI` | MongoDB Atlas 連線字串 | **是** |
| `HOST` | Render 必須使用 `0.0.0.0` | 否 |
| `PORT` | Render 自動注入，不需手動設定 | 否 |
| `CORS_ORIGINS` | 允許的前端來源，多個值用逗號分隔 | 否 |
| `RECOGNITION_API_URL` | 辨識主機 Nginx 的公開 HTTPS 網址 | 否 |
| `RECOGNITION_PROXY_TOKEN` | Node 呼叫辨識主機使用的共用長隨機字串 | **是** |

## Python API 與 worker

API 和 worker 必須載入同一份設定，尤其是 `SCORE_DATA_DIR` 與
`SCORE_DB_PATH`，否則 API 看不到 worker 處理的工作。

| 變數 | 用途 | 秘密 |
| --- | --- | --- |
| `TONNZE_CORS_ORIGINS` | 允許的前端來源 | 否 |
| `RECOGNITION_PROXY_TOKEN` | 必須與 Render Node 的值完全相同 | **是** |
| `RECOGNITION_REQUIRE_PROXY_TOKEN` | 正式辨識主機固定為 `1`，缺少強 token 時拒絕啟動 | 否 |
| `MONGO_URI` | `SCORE_STORAGE_BACKEND=mongodb` 時才需要的 Atlas 連線字串 | **是** |
| `MONGO_DATABASE` | 與會員系統共用的 database 名稱 | 否 |
| `SCORE_STORAGE_BACKEND` | Lightsail 使用 `mongodb`；`filesystem` 僅保留給本機或 Oracle 模式 | 否 |
| `SCORE_MONGO_JOBS_COLLECTION` | 辨識工作 collection，建議 `recognition_jobs` | 否 |
| `SCORE_MONGO_RUNTIME_COLLECTION` | worker heartbeat／lease collection，建議 `recognition_runtime` | 否 |
| `SCORE_MONGO_GRIDFS_BUCKET` | 辨識原檔與結果的 GridFS bucket 前綴，建議 `recognition_files` | 否 |
| `SCORE_DATA_DIR` | 上傳檔案與辨識結果目錄 | 否 |
| `SCORE_DB_PATH` | SQLite queue 絕對路徑 | 否 |
| `SCORE_ENABLE_OCR` | 是否啟用 RapidOCR，`0` 或 `1` | 否 |
| `SCORE_ENABLE_YOLO` | 是否啟用 YOLO，`0` 或 `1` | 否 |
| `YOLO_WEIGHTS` | YOLO 權重檔路徑 | 否 |
| `YOLO_CONFIDENCE` | YOLO 信心門檻 | 否 |
| `SCORE_MAX_QUEUE` | 最多排隊工作數 | 否 |
| `JOB_TIMEOUT_SECONDS` | 單一辨識工作的逾時秒數 | 否 |
| `RETENTION_SECONDS` | 工作與結果保留秒數 | 否 |
| `HOMR_BIN` | 自訂 HOMR 執行檔路徑，通常省略 | 否 |
| `SCORE_HOMR_IMAGE_WIDTH` | HOMR 專用頁面寬度，預設 `1920` | 否 |
| `SCORE_AUX_IMAGE_MAX_EDGE` | OCR/YOLO 圖片最大邊，預設 `3200` | 否 |
| `SCORE_HOMR_BATCH_SIZE` | SegNet tile 批次上限，預設 `2` | 否 |
| `SCORE_HOMR_ONNX_THREADS` | 每個 HOMR ONNX 模型的執行緒上限，預設 `2` | 否 |
| `SCORE_HOMR_TITLE_OCR` | 是否啟用 HOMR 內建標題 OCR，預設 `0` | 否 |
| `SCORE_HOMR_MEMORY_PATCH` | 啟用 uint8 tile 與串流合併，預設 `1` | 否 |

## 上線核對

1. Render 兩個 `VITE_*` 值皆已設定，API 網址為 HTTPS。
2. `CORS_ORIGINS` 包含 Render 前端的完整 origin。
3. MongoDB Atlas 已換掉曾提交至 Git 的舊密碼；Node 與 Lightsail Python
   分別設定相同 URI/database，Atlas Network Access 允許 Lightsail Static IP，
   且辨識資料使用獨立的 `recognition_*` collections／GridFS bucket。
4. Oracle 或 Lightsail 的 `/etc/onoma-rise/recognition.env` 權限為 `600`，且不在 repository 內。
5. Render 與辨識主機的 `RECOGNITION_PROXY_TOKEN` 完全相同。
6. 統一入口 `/api/health` 回傳 Node 的 `database: true`。
7. 統一入口 `/api/health/recognition` 回傳 `api: true`，worker 啟動後 `worker: true`。
