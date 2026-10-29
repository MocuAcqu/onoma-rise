# AWS Lightsail 辨識主機部署

這套部署預設給 **General purpose、2 GB RAM、2 vCPU、Dual-stack** 的
Ubuntu 24.04 LTS Lightsail instance 使用。Lightsail 只執行 Python 辨識 API、
一個背景 worker 與 Nginx；前端和 Node API 維持在 Render，帳號資料與
辨識 queue/files 都使用 MongoDB Atlas。

```text
瀏覽器 → Render Static Site → Render Node API
                                  │ HTTPS + shared token
                                  ▼
                         Lightsail Nginx :443
                                  │
                                  ▼
                         FastAPI 127.0.0.1:8000
                                  ↕
                           background worker
                                  ↕
                     MongoDB queue + GridFS (Atlas)
```

## Free Tier 怎麼計算

以 2026 年的新 AWS 帳號方案為準：註冊後先取得 USD 100 credits，完成
Explore AWS 指定任務最多再取得 USD 100。Free account plan 最長 6 個月，
或在 credits 用完時提前結束。Lightsail 現在是依實際時數計價、每月不超過
方案月費，再由 credits 抵扣；不是這台 2 GB instance 本身永久免費。

如果只開一台 USD 12/月的 instance，不含 snapshot、DNS、額外磁碟、Atlas
費用或超額流量，
6 個月的名目費用約為 USD 72，可由註冊時的 USD 100 credits 覆蓋。
實際抵扣、到期日與服務資格以 Billing 裡的 **Credits** 與 **Free Tier** 頁面為準。
舊帳號或過去曾有 AWS 帳號者可能不具新客 credits 資格。

- [AWS Free Tier FAQ](https://aws.amazon.com/free/free-tier-faqs/)
- [Lightsail billing FAQ](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-frequently-asked-questions-faq-billing-and-account-management.html)

## 1. 建立 Lightsail instance

在 Lightsail 建立：

- Region：優先選擇靠近 Render Singapore 的區域。
- Platform：Linux/Unix。
- Blueprint：OS Only → Ubuntu 24.04 LTS。
- Plan type：General purpose。
- Network：Dual-stack。
- Size：2 GB RAM / 2 vCPU。

建立後立即附加 Static IP。在 Lightsail Networking 防火牆中：

- TCP 22：只允許你的 IP。
- TCP 80：先用於 HTTP 驗證與 Let's Encrypt challenge。
- TCP 443：對外開放 HTTPS。
- 不要開放 8000；FastAPI 只監聽 `127.0.0.1`。

## 2. 取得程式並安裝主機

SSH 進入 instance 後：

```bash
sudo apt-get update
sudo apt-get install -y git
sudo git clone https://github.com/PhoebeLu1011/onoma-rise-v2.git /opt/onoma-rise
sudo bash /opt/onoma-rise/deploy/aws-lightsail/install.sh
```

`install.sh` 會安裝 Python 3.12、ffmpeg、FluidSynth、Nginx、Certbot、Python
依賴、systemd units，並建立 2 GB swap。它不會啟動服務，因為私密環境
變數還沒有填寫。

## 3. 設定環境變數

```bash
sudo editor /etc/onoma-rise/recognition.env
```

至少要更改：

```dotenv
TONNZE_CORS_ORIGINS=https://你的前端.onrender.com
RECOGNITION_PROXY_TOKEN=至少-32-字元的隨機字串
MONGO_URI=與-Render-Node-API-相同的-Atlas-URI
MONGO_DATABASE=實際的-database-名稱
```

可用下列指令產生 token：

```bash
openssl rand -hex 32
```

預設已設為 `SCORE_STORAGE_BACKEND=mongodb`。Render 的私密環境變數不會自動
傳到 AWS，因此必須將 Render Node API 使用的 `MONGO_URI` 另外複製到
Lightsail，並明確填寫 `MONGO_DATABASE`。不要把這些真實值寫回 repository。

MongoDB Atlas 的 Network Access 還要允許 Lightsail Static IP。Node API 和 Python
辨識服務可使用同一 database，辨識服務只會使用這些獨立名稱：

```dotenv
SCORE_MONGO_JOBS_COLLECTION=recognition_jobs
SCORE_MONGO_RUNTIME_COLLECTION=recognition_runtime
SCORE_MONGO_GRIDFS_BUCKET=recognition_files
```

`/var/lib/onoma-rise/recognition` 仍會存在，但只保留 worker runtime lock；
HOMR 的單次工作檔會在系統暫存目錄中建立，處理完自動移除。queue、上傳
原檔和結果都會寫入 MongoDB/GridFS，不再依賴 SQLite 持久化。

2 GB 預設為：

```dotenv
SCORE_ENABLE_OCR=0
SCORE_ENABLE_YOLO=0
SCORE_HOMR_IMAGE_WIDTH=1920
SCORE_AUX_IMAGE_MAX_EDGE=2400
SCORE_HOMR_BATCH_SIZE=2
SCORE_HOMR_ONNX_THREADS=2
SCORE_MAX_QUEUE=10
```

先不開 OCR 與 YOLO，避免兩套額外模型與 HOMR 同時造成記憶體尖峰。

## 4. 啟動與 IP 驗收

```bash
sudo bash /opt/onoma-rise/deploy/aws-lightsail/activate.sh
curl http://127.0.0.1/api/health/recognition
curl http://LIGHTSAIL_STATIC_IP/api/health/recognition
```

預期健康檢查回傳 `api: true` 與 `worker: true`。沒有 shared token 的受保護
endpoint 應回傳 403：

```bash
curl -i http://LIGHTSAIL_STATIC_IP/api/jobs
```

## 5. 網域與 HTTPS

1. 在 DNS 新增 A record，指向 Lightsail Static IP，例如
   `recognition.example.com`。
2. 將 Nginx 設定裡的 `server_name _;` 改成該網域。
3. 驗證並申請憑證：

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d recognition.example.com
curl https://recognition.example.com/api/health/recognition
```

shared token 只是授權，不會加密傳輸；正式串接 Render 前必須先完成
HTTPS。

## 6. 連接 Render Node API

在 Render 的 `onoma-rise-api` 設定：

```dotenv
RECOGNITION_API_URL=https://recognition.example.com
RECOGNITION_PROXY_TOKEN=與-Lightsail-完全相同
```

重新部署 Node API 後，從統一入口驗收：

```bash
curl https://你的-node-api.onrender.com/api/health/recognition
```

## 更新程式

```bash
sudo bash /opt/onoma-rise/deploy/aws-lightsail/update.sh
```

這個腳本只允許 fast-forward update，不會覆蓋主機上的 Git 修改；更新依賴後
會重啟 API 與 worker。它不會覆蓋 Nginx，因此 Certbot 與正式網域設定會保留。

## 監控與排錯

```bash
free -h
swapon --show
sudo systemctl status onoma-recognition-api onoma-recognition-worker nginx
sudo journalctl -u onoma-recognition-api -u onoma-recognition-worker -n 100
sudo journalctl -k --since today | grep -i -E 'out of memory|oom|killed process'
```

如果 2 GB 仍出現 OOM，先將 `SCORE_HOMR_BATCH_SIZE` 改為 `1`、
`SCORE_HOMR_ONNX_THREADS` 改為 `1`，然後重啟 worker：

```bash
sudo systemctl restart onoma-recognition-worker
```

