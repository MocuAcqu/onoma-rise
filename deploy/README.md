# 部署檔案

正式環境採用以下分工：

- `render/`：React/Vite 靜態前端與 Node 統一 API。
- `oracle/`：Python 辨識 API、背景 worker、SQLite 與 Nginx。
- `aws-lightsail/`：可取代 Oracle 的 Lightsail Python 辨識主機，預設為 2 GB
  方案與 MongoDB/GridFS storage backend。
- MongoDB Atlas：儲存使用者、章節及學習進度。

```text
瀏覽器 → Render Static Site → Render Node API → Lightsail / Oracle Python API
                              └→ MongoDB Atlas ←─────────────┘
                                      └→ recognition queue + GridFS (Lightsail)
```

部署密碼、MongoDB URI、Google Client ID 與正式網域不得提交到 Git。所有範例檔只能保留佔位值。

使用 AWS 時先完成 [`aws-lightsail/README.md`](aws-lightsail/README.md)，再將
Render Node API 的 `RECOGNITION_API_URL` 指向 Lightsail HTTPS 網域。若使用
Oracle，則從 [`render/README.md`](render/README.md) 依原流程部署。

所有環境變數的用途、設定位置與是否屬於秘密，統一記錄在
[`ENVIRONMENT.md`](ENVIRONMENT.md)。部署前應逐項核對，不要把正式值寫入範例檔。
