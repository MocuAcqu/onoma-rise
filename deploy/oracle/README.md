# Oracle 辨識主機部署

Oracle VM 只執行 Python 辨識 API、背景 worker、SQLite queue 與 Nginx。Node API 已移到
Render。

```text
Render Node ─HTTP + shared token→ Nginx :80 → FastAPI 127.0.0.1:8000
                                                   ↕ SQLite queue
                                              recognition worker
```

## 建議位置

| 用途 | 位置 |
| --- | --- |
| Repository | `/opt/onoma-rise` |
| Python venv | `/opt/onoma-rise/.venv` |
| 私密環境變數 | `/etc/onoma-rise/recognition.env` |
| 辨識資料與 SQLite | `/var/lib/onoma-rise/recognition` |

## 1. 安裝依賴與程式

以下以 Ubuntu ARM VM 及 `onoma` 系統帳號為例：

```bash
sudo apt update
sudo apt install -y python3.12 python3.12-venv build-essential ffmpeg fluidsynth nginx git
sudo useradd --system --create-home --shell /usr/sbin/nologin onoma
sudo git clone YOUR_REPOSITORY_URL /opt/onoma-rise
sudo chown -R onoma:onoma /opt/onoma-rise
sudo -u onoma bash /opt/onoma-rise/deploy/oracle/install-python.sh
```

ARM64 上需實際確認 HOMR、ONNX Runtime、RapidOCR 與 Basic Pitch 都能安裝；若其中套件
沒有相容 wheel，先停在這一步處理，不能假設 x86 的安裝結果會相同。

## 2. 建立 runtime 與環境變數

```bash
sudo install -d -o onoma -g onoma /var/lib/onoma-rise/recognition
sudo install -d -m 700 /etc/onoma-rise
sudo cp /opt/onoma-rise/deploy/oracle/env.example /etc/onoma-rise/recognition.env
sudo chmod 600 /etc/onoma-rise/recognition.env
sudo editor /etc/onoma-rise/recognition.env
```

用密碼產生器建立至少 32 bytes 的隨機 token，填入
`RECOGNITION_PROXY_TOKEN`；稍後 Render Node 必須使用完全相同的值。

## 3. 安裝 systemd 與 Nginx

```bash
sudo cp /opt/onoma-rise/deploy/oracle/systemd/onoma-recognition-api.service /etc/systemd/system/
sudo cp /opt/onoma-rise/deploy/oracle/systemd/onoma-recognition-worker.service /etc/systemd/system/
sudo cp /opt/onoma-rise/deploy/oracle/nginx/onoma-rise.conf /etc/nginx/sites-available/onoma-rise
sudo unlink /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/onoma-rise /etc/nginx/sites-enabled/onoma-rise
sudo nginx -t
sudo systemctl daemon-reload
sudo systemctl enable --now onoma-recognition-api onoma-recognition-worker nginx
```

Oracle Cloud 的 Security List/NSG 與 VM 防火牆需要允許 TCP 80。FastAPI 的 8000 port
不要對外開放。IP HTTP 只適合第一階段連線測試；正式上線要替 Oracle 綁定網域並用
Certbot 配置 HTTPS，再把 Render 的 `RECOGNITION_API_URL` 改為 `https://...`。shared token
只負責授權，不會加密傳輸。

## 4. 驗收與診斷

```bash
curl http://ORACLE_PUBLIC_IP/api/health/recognition
curl -i http://ORACLE_PUBLIC_IP/api/jobs
sudo systemctl status onoma-recognition-api onoma-recognition-worker
sudo journalctl -u onoma-recognition-api -u onoma-recognition-worker -n 100
```

健康檢查應回傳 `api: true`、`worker: true`。沒有 token 的 `/api/jobs` 應回傳 403。
SQLite 與辨識結果都保留在 `/var/lib/onoma-rise/recognition`，重新部署程式不會覆蓋它們；
仍需自行做 VM volume 備份與過期資料清理。
