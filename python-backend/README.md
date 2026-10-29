# Python recognition backend

這個服務同時提供音訊分析、樂譜辨識 API，以及處理樂譜工作的背景 worker。
HTTP 對外仍由 Nginx 的統一 API 網域分流，Python 本身只負責辨識功能。

## 架構

```text
python-backend/
├── tonnze/
│   ├── api/             # FastAPI 路由與輸入驗證
│   ├── services/        # 音訊、樂譜辨識流程協調
│   ├── recognition/     # HOMR、OCR、YOLO 外部引擎 adapter
│   ├── rules/           # MusicXML、術語與演奏規則
│   ├── repositories/    # SQLite／MongoDB 工作 queue
│   ├── config.py        # runtime 環境設定
│   ├── main.py          # FastAPI 入口
│   └── worker.py        # 背景 worker 入口
├── tests/               # Python 測試
├── runtime/recognition/ # filesystem 模式的 queue 與檔案，不提交 Git
├── .env.example
└── requirements.txt
```

依賴方向維持單向：`api → services/repositories → recognition/rules`。路由不直接處理
模型推論；recognition adapter 也不依賴 FastAPI。

## 本機執行

先在 repository 根目錄建立並啟用 Python 3.12 虛擬環境，再安裝依賴：

```bash
pip install -r python-backend/requirements.txt
```

可從根目錄分別啟動：

```bash
npm run python-api
npm run python-worker
```

健康檢查：`GET http://127.0.0.1:8000/api/health/recognition`。

## 音樂術語目錄

`tonnze/rules/music_terms.json` 是速度、力度、表情與反覆指示的單一資料來源。
新增或修改術語時，請更新該檔案，不要在 `tempo.py`、`dynamics.py` 或
`expressions.py` 內另建規則表。

每筆資料至少包含：

- 穩定且唯一的 `id`
- 分類用的 `family` 與執行用的 `kind`
- 標準顯示文字 `canonical`、OCR 別名 `aliases` 與中文說明 `meaningZh`
- 本產品採用的 `playback` 參數
- 可追溯的 `referenceIds`

`tonnze.rules.vocabulary` 會在載入時檢查重複 ID／別名、未知來源，以及無效的
BPM、力度和表情參數。修改後請執行：

```bash
PYTHONPATH=. pytest tests/test_rule_vocabulary.py -q
```

MusicXML、SMuFL 用於記譜結構和符號名稱；JSON 內的 BPM、velocity、gate 等
數值屬於 Onoma Rise 的播放策略，不代表通用音樂標準。

## Runtime 資料

`SCORE_STORAGE_BACKEND=filesystem` 時，API 與 worker 必須使用相同的
`SCORE_DATA_DIR` 和 `SCORE_DB_PATH`。本機預設為 `runtime/recognition/`；除了
`.gitkeep`，此目錄內容均不得提交。

`SCORE_STORAGE_BACKEND=mongodb` 時，工作 queue 寫入 MongoDB collections，
上傳檔與辨識結果寫入 GridFS。API 與 worker 必須使用相同的 `MONGO_URI`、
`MONGO_DATABASE`、collection 與 bucket 名稱；HOMR 執行期間只會在系統暫存目錄落地單一工作，
完成上傳後即自動清除，因此不需要 persistent disk。
