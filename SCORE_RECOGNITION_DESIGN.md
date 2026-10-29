# OnomaRise 樂譜辨識流程與設計細節

> 文件狀態：依目前 repository 實作整理
>
> 最後核對：2026-10-17
>
> 範圍：只描述「樂譜圖片／單頁 PDF → 辨識 → 五線譜與鋼琴播放 → Tonnetz／Timeline」這條流程

## 1. 功能定位

OnomaRise 的樂譜辨識不是只把圖片轉成 MIDI，也不是單純的五線譜掃描器。它把同一份辨識結果分成三種用途：

1. **保留記譜資訊**：使用 MusicXML 呈現譜表、節拍、聲部、反覆、演奏記號與音樂術語。
2. **產生可聽結果**：使用 MIDI 音符資料，加上專案自己的力度、速度、裝飾音、反覆與延長記號規則播放。
3. **產生可理解的分析**：把目前發聲音映射到 Tonnetz，並推測全曲調性、和弦、轉位與羅馬數字級數。

因此，系統的核心資料關係是：

```text
樂譜影像
   │
   ├── HOMR ────────────────► 音符、節奏、譜表、MusicXML 結構
   │
   ├── RapidOCR ────────────► 速度、力度、表情與反覆術語
   │
   └── optional YOLO ───────► 延長記號／附點候選診斷
                                   │
                                   ▼
                         修復、合併與規則轉換
                                   │
                  ┌────────────────┴────────────────┐
                  ▼                                 ▼
              MusicXML                         線性 MIDI
                  │                                 │
                  └──────────────┬──────────────────┘
                                 ▼
                       瀏覽器端演奏與分析模型
                                 │
            ┌────────────────────┼────────────────────┐
            ▼                    ▼                    ▼
          OSMD                 鋼琴音訊           Tonnetz／Timeline
```

## 2. 設計目標與非目標

### 2.1 目前目標

- 接受 PNG 或單頁 PDF，產生可排版的 MusicXML 與可播放的 MIDI。
- 在辨識工作時間較長時，讓使用者看到 queue、stage 與 percent，而不是讓單一 HTTP request 一直等待。
- 能取消正在排隊或執行中的辨識工作。
- 將 HOMR、OCR、YOLO 的失敗隔離；輔助辨識失敗時，盡量保留 HOMR 主結果。
- 控制模型推論的尖峰記憶體，使服務可在資源有限的主機運行。
- 五線譜排版、播放游標、鋼琴播放與 Tonnetz 各自容錯，不讓其中一項失敗拖垮全部功能。
- 讓音訊與視覺共用 Web Audio 時鐘，降低播放久了之後的累積漂移。
- 保留原始記譜座標與實際演奏時間兩套時間軸，支援速度變化、延長記號與反覆。

### 2.2 目前不是目標

- 不支援多頁 PDF。
- 不保證手寫譜、嚴重傾斜、低解析度或複雜現代記譜都能正確辨識。
- YOLO 結果目前只作為候選與 diagnostics，不直接改寫 HOMR 音符。
- 調性目前是全曲估計，不是完整的逐小節轉調分析。
- 和弦結果是規則式估計，不代表唯一正確的音樂分析。
- 尚未提供鋼琴指法建議。
- 樂譜辨識 job 目前沒有綁定會員 ID；知道 job UUID 且能通過 API proxy 的請求可以取得該工作。

## 3. 系統邊界與元件責任

```text
React／Vite 前端
  ├── 上傳、polling、取消
  ├── MIDI 解析與演奏規則
  ├── OSMD 五線譜
  ├── Web Audio 鋼琴
  └── Tonnetz、Timeline、調性與和弦分析

Node API
  ├── 對瀏覽器維持同源 API
  ├── 串流代理 /api/jobs 與辨識健康檢查
  └── 以 server-to-server token 呼叫 Python

Python FastAPI
  ├── 驗證上傳
  ├── 建立／查詢／取消 job
  ├── 提供結果下載
  └── 不在 HTTP process 直接執行模型

Python worker
  ├── 領取 queue 中最早的 job
  ├── 另開可取消的辨識子行程
  ├── 更新進度與 heartbeat
  └── 發布所有結果後才標記 complete

辨識子行程
  ├── 影像準備
  ├── HOMR
  ├── optional YOLO
  ├── RapidOCR
  ├── MusicXML 修復／合併
  └── MIDI、metadata 與 diagnostics
```

依賴方向維持為：

```text
api → repositories / services → recognition adapters / rules
```

API route 不直接做模型推論；HOMR、OCR、YOLO adapter 也不知道 FastAPI job 的存在。

## 4. 完整請求時序

```text
使用者       React       Node proxy       FastAPI       Queue       Worker       子行程
  │            │              │               │            │            │            │
  │ 選檔       │              │               │            │            │            │
  │───────────►│ client 驗證  │               │            │            │            │
  │            │ POST /jobs   │               │            │            │            │
  │            │─────────────►│ stream        │            │            │            │
  │            │              │──────────────►│ server 驗證│            │            │
  │            │              │               │ 儲存 source│            │            │
  │            │              │               │───────────►│ queued     │            │
  │            │◄─────────────┴───────────────┤ 202 + job  │            │            │
  │            │ 每秒 GET job                 │            │ claim      │            │
  │            │──────────────────────────────►│───────────►│───────────►│            │
  │            │              │               │            │ running    │ spawn      │
  │            │              │               │            │            │───────────►│
  │            │ 每秒取得 percent / stage     │            │ 解析 SCORE_EVENT         │
  │            │◄─────────────────────────────┤◄───────────┤◄───────────┤            │
  │            │              │               │            │            │ 結果檔案   │
  │            │              │               │            │ publish 全部結果         │
  │            │              │               │            │◄───────────┤            │
  │            │              │               │            │ complete   │            │
  │            │ GET MIDI / XML / notation    │            │            │            │
  │            │──────────────────────────────►│            │            │            │
  │            │◄─────────────────────────────┤            │            │            │
  │            │ parse + render + schedule    │            │            │            │
  │◄───────────┤ 五線譜／鋼琴／Tonnetz        │            │            │            │
```

關鍵一致性規則有兩個：

- 原始檔必須先成功寫入 storage，job 才可以公開為 `queued`，避免 worker 領到尚未完成的上傳。
- MIDI、MusicXML、metadata 等結果必須全部發布完成，job 才可以改成 `complete`，避免前端看到完成卻下載不到檔案。

## 5. 輸入驗證

### 5.1 瀏覽器端

前端先檢查：

- 副檔名只能是 `.png` 或 `.pdf`。
- 檔案不能是空檔。
- 最大 20 MB。

這層只提供快速回饋，不是安全邊界。

### 5.2 FastAPI 端

後端重新驗證，不信任瀏覽器提供的檔名或 MIME type：

- 以 1 MiB chunk 串流寫入暫存檔，避免一次將 20 MB 全讀入 RAM。
- 超過 20 MB 回傳 `413`。
- PDF 必須可由 PDFium 開啟、未加密且只有一頁。
- PNG 會檢查實際 `image.format`，不是只看副檔名。
- PNG 最短邊至少 100 px。
- Pillow 解碼像素上限為 25,000,000，decompression bomb warning 也視為錯誤。
- 檔名對外只保留 basename，並截到 200 字元。

## 6. Job 狀態機與 queue

### 6.1 狀態

```text
queued ─────► running ─────► complete
  │             │  │
  │ cancel      │  ├──────► failed
  ▼             │  │ cancel
cancelled       │  ▼
                │ cancelling ─────► cancelled
                └─────────────────► failed（非取消錯誤）
```

公開欄位包含：

- `id`
- `filename`
- `status`
- `percent`
- `stage`
- `created_at`、`started_at`、`finished_at`
- `error`
- `queue_position`
- `expires_at`

### 6.2 Queue 規則

- 預設最多接受 20 份**仍在 queued 的工作**；不是總共只能存 20 份結果。
- worker 以建立時間領取最早的 queued job。
- SQLite 使用 `BEGIN IMMEDIATE` 完成原子 claim。
- MongoDB 使用 `find_one_and_update` 完成原子 claim。
- percent 只允許往上增加，避免晚到的 log 讓進度倒退。
- worker 每 0.5 秒找一次工作；每 60 秒清除過期工作。
- 預設保留 86,400 秒，也就是 24 小時。
- worker heartbeat 超過 15 秒未更新即視為不健康。
- worker 重啟時，先前的 `running`／`cancelling` job 會被標記為中斷，而不是永遠卡住。

### 6.3 取消與逾時

- queued job 可直接變為 cancelled。
- running job 先變為 cancelling。
- worker 發現 cancelling 後，對整個辨識 process group 發送 `SIGTERM`。
- 3 秒仍未結束，再發送 `SIGKILL`。
- 單份工作預設最多執行 600 秒。
- 對使用者回傳經整理的錯誤；完整 traceback 保留在 worker log，不直接洩漏內部路徑。

## 7. 儲存設計

系統提供兩種後端，但 API、worker 與前端契約相同。

### 7.1 Filesystem + SQLite

用途：本機開發、單機部署、Oracle 主機配 persistent disk。

- SQLite 保存 job 與 runtime heartbeat。
- 啟用 WAL 與 10 秒 busy timeout。
- 每個 job 有自己的檔案目錄。
- API 與 worker 必須看到相同的 `SCORE_DATA_DIR` 與 `SCORE_DB_PATH`。

### 7.2 MongoDB + GridFS

用途：API 與 worker 不共享磁碟，或希望辨識檔案獨立於主機生命週期。

- job 與 heartbeat 使用獨立 collections。
- source、MusicXML、MIDI、metadata、diagnostics 與 log 使用 GridFS bucket。
- 可以與會員系統共用同一個 Atlas cluster／database，但使用不同 collection 與 bucket 名稱。
- 一份工作執行時才下載到系統 temporary directory；發布完成後暫存目錄自動清除。
- 同一 job、同一 kind 再發布時會取代舊 artifact。
- 下載採 chunk stream，不把完整檔案一次載入記憶體。

### 7.3 每份工作的 artifact

| kind | 典型檔名 | 用途 |
|---|---|---|
| source | `source.png`／`source.pdf` | 原始上傳 |
| musicxml | `result.musicxml` | OSMD 與記譜規則來源 |
| midi | `result.mid` | 瀏覽器音符與基礎時間資料 |
| metadata | `result.json` | 音符統計、術語、notation events |
| diagnostics | `diagnostics.json` | 引擎狀態、影像尺寸、warnings、規則處理結果 |
| log | `worker.log` | 子行程完整 stdout／stderr |

## 8. 辨識階段與進度

目前 stage 大致如下：

| percent | stage | 主要工作 |
|---:|---|---|
| 3 | 準備樂譜圖片 | 驗證後的 source 轉成 HOMR／auxiliary 影像 |
| 8 | 啟動 HOMR 音符辨識 | 啟動主 OMR 引擎 |
| 18 | 辨識延長記號與附點 | optional YOLO |
| 30 | 辨識音樂術語 | RapidOCR |
| 72 | HOMR 音符辨識完成 | 主 OMR 輸出已取得 |
| 82 | 合併 MusicXML 與音樂術語 | 結構修復、術語定位與 XML enrichment |
| 92 | 產生 MIDI | 解析 MusicXML 並輸出線性 MIDI |
| 99 | 儲存辨識結果 | 結果交還 worker 發布 |
| 100 | 辨識完成 | 所有 artifact 已發布，job complete |

percent 是 UX 進度提示，不是模型逐 token／逐 measure 的精確百分比。

## 9. 影像準備與記憶體控制

### 9.1 為什麼建立兩張工作影像

HOMR 與 OCR／YOLO 的解析度需求不同。如果所有引擎共用一張最大尺寸圖片，HOMR 的 tile activation、OCR session 與 RGB page buffer 容易同時佔住記憶體。因此目前使用：

- `homr-page.png`：寬度預設 1920 px，供 HOMR。
- `score.png`：長邊最多 3200 px，供 OCR、YOLO 與文字座標映射。

點陣圖片只縮小、不放大。放大像素不會補回符號細節，只會增加 RAM 與推論時間。PDF 則可直接按目標尺寸 rasterize。

### 9.2 影像生命週期

- PDF 的 HOMR 圖與 auxiliary 圖分開 rasterize，以少量額外 CPU 換取較低 peak RSS。
- raster upload 依序輸出兩種尺寸，同一時間只保留一張 resized buffer。
- 透明圖片直接壓成白底 RGB，避免同時保留多份 RGBA／RGB full-page buffer。
- 每個 Pillow image／PDF bitmap 都使用 context manager 或明確 close。

### 9.3 HOMR 記憶體 patch

HOMR 0.7 原本的 segmentation hot path 會讓所有 tile 的大型 `int64` 結果同時留在記憶體。專案的 runner 在 import HOMR 前安裝替代流程：

- segmentation tile 以小批次推論，預設 batch size 2。
- 每批立刻 `argmax` 成 `uint8` mask，再合併回 page buffer。
- 只把目前活著的灰階 tile 展開為三個 float channel，不把整頁先展開。
- page accumulation 只保留兩個 `float32` buffer，最終輸出 `uint8` mask。
- ONNX Runtime 預設 intra-op 2 threads、inter-op 1 thread、sequential execution。
- HOMR 內建 title OCR 預設關閉，避免與稍後的 RapidOCR 重複載入文字模型。

### 9.4 模型隔離

- HOMR、YOLO、OCR 依序執行，不同重型模型不在同一時段推論。
- RapidOCR 另開一次性子行程；回傳 JSON 後 process 結束，ONNX native arena 可由作業系統回收。
- 每一份 score job 本身也在獨立子行程執行；工作完成後，Python／ONNX／模型的殘留記憶體不會長期累積在 worker。

這個設計降低的是**單份工作尖峰與跨工作殘留**，不是保證任何 1 GB 主機都一定不會 OOM。實際容量仍取決於樂譜尺寸、HOMR 版本、是否啟用 YOLO、平台 native allocator 與同機服務數量。

## 10. 三種辨識引擎的角色

### 10.1 HOMR：主 OMR

HOMR 負責音符、休止符、節奏、譜表、聲部、調號、拍號、連線等主要 MusicXML 結構。若 HOMR 無法產生唯一 MusicXML／MXL，整份工作失敗。

HOMR adapter 只負責：

- 準備獨立工作目錄。
- 呼叫 project-owned runner 或設定的 HOMR executable。
- 傳入 batch、thread 與 title OCR 設定。
- 收集且確認唯一輸出。

### 10.2 RapidOCR：音樂文字

RapidOCR 辨識速度、力度、表情、漸強漸弱與反覆相關文字：

- 先做整頁 OCR。
- 若結果少於 16 行，或沒有命中音樂術語，再做重疊 detail tiles。
- detail tiles 由 4 個水平 band × 2 個半頁 column 組成。
- confidence 低於 0.35 的文字不採用。
- 相同正規化文字且框重疊度達 0.45 時去重。
- OCR 失敗只記錄 unavailable warning，不讓 HOMR 主結果失效。

### 10.3 YOLO：符號候選

YOLO 目前用於延長記號與附點的候選偵測。只有在安裝 `ultralytics` 且 weights 存在，或明確開啟時才執行。

目前它的結果只寫入 diagnostics，不直接覆寫 MusicXML。原因是模型在真實掃描譜上的誤判，可能比漏判更破壞節奏結構。

## 11. MusicXML 修復與術語合併

處理順序如下：

```text
HOMR MusicXML
   │
   ├── normalize_measure_timing
   ├── apply_notation_rules
   ├── enrich_musicxml（OCR terms）
   ├── music21 parse 驗證
   ├── 產生 notation events
   └── 產生 linear MIDI
```

### 11.1 保守的 measure timing 修復

系統只修正可明確判定不合理的情況，例如超出小節長度的單一全小節休止。它不會為了讓 XML 好看而全面重排 notes、voices、backup 與 forward，因為自動猜錯時會改壞原本可播放的內容。

### 11.2 記譜規則

- slur 以 staff、voice、number 配對。
- 沒有配對或跨越過度模糊的 slur 會移除，避免 OSMD 因壞資料排版失敗。
- placement 優先沿用原資料；必要時才依多聲部平均音高、stem 與 staff position 推測。

### 11.3 避免 MusicXML 全檔 round-trip

修復後不把整份 XML 經過 music21 write 回存。完整 round-trip 可能重新編號 slur、遺失不完整配對的一端，或改動 voices／staves／beams。music21 在這裡主要用於：

- 驗證修復後 XML 可以解析。
- 計算 note count、BPM 與基本鋼琴資訊。
- 建立線性 MIDI。
- 產生演奏規則事件。

### 11.4 OCR 文字如何放回樂譜

OCR box 會依系統與小節幾何位置映射到：

- measure
- beat offset
- 上下 lane
- 最近實際 note onset

找到的術語會同時：

- 寫入 MusicXML direction／sound，使結果可攜。
- 轉成前端可直接使用的 performance events。
- 保留在 diagnostics，方便檢查原文字、位置與匹配結果。

## 12. 音樂術語資料模型

`python-backend/tonnze/rules/music_terms.json` 是術語的單一資料來源。速度、力度與表情模組不再各自維護容易不一致的字典。

每筆術語至少包含：

- 穩定唯一的 `id`
- 分類 `family`
- 執行類型 `kind`
- 標準文字 `canonical`
- OCR 別名 `aliases`
- 中文意義 `meaningZh`
- 本產品播放參數 `playback`
- 參考來源 ID `referenceIds`

載入時會檢查重複 ID、重複 alias、未知來源與不合理的 BPM／velocity／gate。

重要界線：MusicXML 與 SMuFL 定義記譜結構和符號名稱；JSON 內具體 BPM、velocity、gate 與 ramp 幅度是 OnomaRise 的播放策略，不是普遍適用的音樂學定律。

## 13. 後端產生的演奏事件

notation endpoint 回傳四類資料：

```ts
{
  articulations: ArticulationEvent[];
  marks: NotationMark[];
  ornaments: OrnamentEvent[];
  performance: PerformanceEvent[];
}
```

### 13.1 Articulation

目前規則包含：

| 記號 | gate | velocity 變化 |
|---|---:|---:|
| staccato | 0.50 | 0 |
| staccatissimo | 0.25 | +0.02 |
| tenuto | 0.95 | 0 |
| accent | 0.90 | +0.12 |
| strong accent | 0.80 | +0.20 |
| detached legato | 0.75 | 0 |
| spiccato | 0.40 | +0.05 |

gate 改變 audible duration，不改寫原本 notation duration。

### 13.2 Ornament

目前可轉換 grace note、appoggiatura、acciaccatura、trill、mordent、turn、shake、schleifer、tremolo 與 arpeggiate。輔助音會參考 MusicXML key signature 決定音高，而不是固定加減一個半音。

主要策略：

- appoggiatura 最多取主音 50% 或 1 beat。
- acciaccatura 最多取主音 25% 或 0.25 beat。
- arpeggio 同一和弦由低到高，每音延後 0.06 beat。
- trill／tremolo／shake 以 0.25 beat 為基礎 subdivision。

### 13.3 Fermata 與 dots

- 附點優先由 MusicXML note duration 表現，marks 仍保留供診斷與相容使用。
- fermata 預設把該時間點延長為 2 倍。
- 同時出現在多聲部的 ensemble fermata 會去重，避免整段被重複延長。

### 13.4 Tempo、dynamic、expression

performance event 使用 beat-domain 的 `step` 或 `linear` curve：

- 明確速度術語產生 tempo step。
- ritardando／accelerando 類術語在預設兩小節內線性改變，或到結構邊界為止。
- 明確力度記號產生 dynamic step。
- crescendo／diminuendo 形成 dynamic ramp，若後面有明確力度，就以該力度作為目標。
- expression 可同時調整 gate 與 velocity delta。

雙小節線、終止線、heavy barline 與反覆記號是力度 section boundary：

- 漸強／漸弱必須在邊界前完成，不跨越到下一段。
- 邊界後先回到專案設定的中強 `mf` 基準。
- 若邊界同一拍印有新的力度，先 reset，再由新力度立即覆蓋。

## 14. MIDI 輸出策略

後端輸出的是**樂譜順序的一次線性 MIDI**：

- MusicXML 中 forward／backward repeat barline 會在 MIDI copy 中移除。
- D.C.／D.S.／Coda／Fine 等 repeat expressions 也會移除。
- 真正的反覆展開交給瀏覽器端，因為前端還需要保留「演奏到哪一次反覆」與「原譜是哪一拍」的映射。

這可避免後端 MIDI 已展開一次、前端又展開一次造成雙重反覆。

## 15. API 契約

| Method | Path | 說明 |
|---|---|---|
| POST | `/api/jobs` | 上傳檔案，建立 job，成功回 `202` |
| GET | `/api/jobs/:id` | 取得狀態、進度、queue position |
| POST | `/api/jobs/:id/cancel` | 取消 queued／running job |
| GET | `/api/jobs/:id/notation` | 取得 articulation、mark、ornament、performance |
| GET | `/api/jobs/:id/files/source` | 取得原始上傳 |
| GET | `/api/jobs/:id/files/midi` | 完成後下載 MIDI |
| GET | `/api/jobs/:id/files/musicxml` | 完成後下載 MusicXML |
| GET | `/api/jobs/:id/files/diagnostics` | 完成後下載 diagnostics |
| GET | `/api/health/recognition` | API、worker 與引擎健康狀態 |

結果下載使用 `no-store`、`nosniff` 與明確 `Content-Disposition`。未完成時下載結果回 `409`；過期或不存在回 `404`。

notation 通常直接讀取 `result.json` cache。若是舊 job 缺少其中一個分類，只重建缺少的分類，不重新跑 HOMR。

## 16. Node proxy 與網路安全

瀏覽器不直接知道 Python service 的內部網址。Node 對以下 route 做串流代理：

- `/api/jobs`
- `/api/audio`
- `/api/health/recognition`

代理特性：

- 必須放在 `express.json()` 前，才能保留 multipart body stream。
- 會附加 `X-Recognition-Token`。
- 正式設定辨識目標時，Node 端 token 至少 32 字元。
- Python 可用 `RECOGNITION_REQUIRE_PROXY_TOKEN=1` 強制只接受帶正確 token 的流量。
- upstream timeout 為 660 秒，略大於預設 job timeout。
- Python 的 CORS allowlist 預設只有本機 Vite 網址；正式環境需明確設定。

token 驗證的是「可信任的 Node service」，不是個別會員權限。若未來要讓辨識資料跟會員生命週期綁定，仍需在 Node 建立 user-job ownership，不能只依賴 UUID。

## 17. 前端匯入流程

`useScoreImport` 負責整個非同步匯入狀態：

1. client validation。
2. `POST /api/jobs`。
3. job 為 queued／running／cancelling 時，每 1 秒 polling。
4. cancelled 時停止，不下載結果。
5. complete 後平行下載 MIDI、MusicXML 與 notation。
6. 用 `@tonejs/midi` 解析 MIDI。
7. 組成瀏覽器內的 `Score`。
8. 切換到 score workspace。

切換檔案或 component unmount 時使用 `AbortController` 取消尚未完成的 HTTP request。

`Score` 主要保存：

- 原始 MIDI bytes 與 MusicXML string。
- 每顆 note 的 MIDI、name、seconds、duration、velocity、part。
- 同一顆 note 的 `startBeat`、`durationBeats`。
- articulation、mark、ornament、performance events。
- BPM、總秒數、總拍數與有效 track 數量。

若 MIDI 沒有音符或 duration 無效，前端拒絕載入，避免後續 player 進入不完整狀態。

## 18. 前端演奏資料管線

規則轉換順序固定為：

```text
原始 Score
  → articulation playback
  → ornament playback
  → performance playback（tempo / dynamic / expression）
  → fermata playback
  → repeat playback
  → performance timeline
  → global key estimation
  → harmonic timeline
```

順序不能任意交換。例如 ornament 先在拍點域建立額外音符，tempo 才能把它們轉成正確秒數；repeat 最後展開，才不會讓全曲調性 histogram 被重複段落偏置。

## 19. 三種時間座標

系統同時保留三種時間：

| 座標 | 單位 | 用途 |
|---|---|---|
| notation beat | quarter-note beat | OSMD 游標、點擊樂譜、原始記譜位置 |
| performance time | seconds | 速度／力度／fermata 已套用後的線性演奏時間 |
| repeat-expanded time | seconds | 真正播放，包含反覆後的時間 |

需要逆向顯示游標時，流程為：

```text
目前播放秒數
  → 反覆 occurrence 映回 source time
  → 移除 fermata 造成的額外時間
  → 由 tempo 積分反求 notation beat
  → OSMD cursor
```

tempo ramp 的秒數不是用固定 BPM 近似，而是對線性 BPM 曲線做解析積分；秒數反求 beat 使用 36 次 binary search。

## 20. 反覆播放

前端解析第一個 part 的 measure、divisions、time、backup、forward、repeat barline、ending 與 D.C.／D.S.／Coda／Fine 類指示，建立 `RepeatSegment[]`。

- backward repeat 目前固定總共演奏 2 次，即使 OMR 產生其他 times 值。
- 每次展開都保留 source beat，讓 OSMD 可以回到原譜位置。
- 使用者點同一個 notation beat 時，系統選擇距離目前 playhead 最近的反覆 occurrence，避免每次都跳回第一次。

限制：沒有反覆的線性 fallback 目前只建立一個整體 segment，因此完整的「第幾小節」顯示仍需要更細的 measure map。

## 21. 力度與速度的實際播放

### 21.1 Tempo

- step tempo 直接改變後續 BPM。
- linear tempo 透過積分轉成實際秒數。
- playback speed（0.1×、0.25×、0.5×、0.75×、1×、1.25×、1.5×）是在完整演奏結果外再縮放排程時間。

### 21.2 Dynamic

鋼琴引擎使用：

```text
amplitude gain = velocity²
```

因此 crescendo／diminuendo 不使用 velocity 的線性插值，而使用幾何插值，讓聽感上的 dB 變化較平均，不會所有變化都擠在 ramp 尾端。

velocity 最終限制在 `0.05...1.0`；加入 articulation／expression delta 後仍會 clamp。

### 21.3 Duration

expression gate、articulation gate 只縮短可聽 envelope，不延長或改寫原譜的 beat duration。這可讓 OSMD、反覆映射與演奏聲音維持各自正確的語意。

## 22. ScorePianoEngine

樂譜辨識使用獨立的 sample piano engine，不與 Tonnetz 點按音效共用 voice 管理。

### 22.1 Samples

- 使用 Salamander piano samples。
- MIDI 21 到 96，每小三度一個 sample，共 26 個。
- 播放其他音高時選最近 sample，再用 `playbackRate = 2^(semitone/12)` 移調。
- sample 由 Vite base path 下的 `assets/sounds/salamander/` 載入。

### 22.2 Web Audio graph

```text
AudioBufferSourceNode（每音獨立）
  → note GainNode
  → master GainNode（+6 dB）
  → DynamicsCompressorNode / limiter
  → destination
```

Limiter 設定：threshold `-1 dB`、ratio `20:1`、attack `0.002 s`、release `0.1 s`。總音量提高後，強和弦峰值由 limiter 控制，避免直接 clipping。

### 22.3 Envelope 與停止

- 每顆音都有自己的 source 與 gain envelope。
- 一般 release 為 0.22 秒，且不因快速播放做立方壓縮，避免「每音急煞」的感覺。
- pause／stop 時以 0.008 秒 fade out，再停止 source，減少 click。
- `dispose()` 會取消音符、斷開 nodes、清空 decoded buffers 與 dynamic import cache。

使用者第一次按播放時先在 click gesture 內 `tone.start()`，再等待 samples 解碼，以符合瀏覽器 autoplay policy。

## 23. 連續音與排程策略

所有完全相同 onset 的音先組成一個 batch，以同一個 audio-clock timestamp 發聲，避免和弦音因 JavaScript loop 產生細小錯位。

對同 part、同 pitch 的下一次 strike：

- 在下一次 attack 前最多 0.025 秒開始 fade。
- release tail 保留 0.05–0.10 秒並重疊下一次 attack。
- 不插入完整靜音縫隙，保留鋼琴自然共鳴。

密集音群有 0.012–0.04 秒的 minimum duration。快速播放且音符接在休止後時，只針對短旋律音使用 0.82 gate，避免第一顆音的 tail 壓住下一顆；刻意持續的長和聲音不縮短。

## 24. 播放同步器

`ScorePlaybackSynchronizer` 保存：

- duration
- offset
- audio clock anchor
- speed
- playing state

唯一主時鐘是 `AudioContext.currentTime`。開始播放時：

1. 先準備 12 秒 lookahead 內的 batches。
2. 音訊起點設為 `currentTime + 0.1 s`。
3. 同步器保存這個 audio origin。
4. 後續 requestAnimationFrame 只從同一 audio clock 計算位置。
5. 每幀補排接下來 12 秒的音符。

畫面掉幀後，下個 frame 會直接追上音訊時鐘，不會用「每幀加固定毫秒」而累積誤差。

### 24.1 降低 React 更新頻率

requestAnimationFrame 仍然每幀檢查位置，但只有 active performance event 改變時才 `setPosition()`，所以整個 Tonnetz workspace 不會 60 FPS 全面 rerender。

播放進度 slider 使用 imperative update；靜態 SVG layer 與 timeline item 也採 memoization。這會降低 CPU／layout 工作量，但不會降低音訊排程精度。視覺更新點跟著音符事件，而不是任意降成很低的固定 FPS。

## 25. 五線譜排版與互動

### 25.1 OSMD cold start

`opensheetmusicdisplay` 在 Tonnetz route evaluation 時就開始 dynamic import，讓辨識期間可以平行下載模組。真正顯示時：

1. 建立新的 host element。
2. 等待 OSMD module。
3. `display.load(MusicXML)`。
4. 最多等字型 500 ms。
5. 最多等 10 個 animation frame，直到 container width 大於 1 px。
6. 設定 zoom 0.85 並 render。
7. 第一次 render 失敗時，等兩個 frame，再以**同一個已 load 的 OSMD instance**重試一次。

目前不是「清掉全部狀態、建立全新 OSMD instance、重新 load XML」的完整重試。

### 25.2 錯誤分層

以下錯誤分開處理：

- OSMD module 下載失敗。
- MusicXML load 失敗。
- container 尚未完成 layout。
- SVG render 兩次都失敗。
- cursor 初始化失敗。
- resize 後重新排版失敗。

只有前三種排版關鍵錯誤會讓五線譜不可用。cursor 失敗時保留已成功的 SVG，只顯示游標 warning。resize render 失敗時保留上一張成功 SVG，不改成通用錯誤畫面。

### 25.3 播放游標

- 初始化時遍歷 OSMD iterator，最多 100,000 個 timestamp。
- `RealValue × 4` 轉成 quarter-note beat。
- 更新位置時以 binary search 找目標 timestamp。
- 往回 seek 才 reset cursor；往前只逐步 next。
- 游標離開 notation viewport 時，只調整 notation container 自己的 scrollTop。

### 25.4 點擊音符

點擊座標依序轉成 DOM → SVG → OSMD engraving coordinate，再用小範圍 nearest-note hit test。點到休止符或空白不動作；點到音符後：

- 取得 note 的 absolute notation beat。
- 映射到離目前 playhead 最近的 repeat occurrence。
- seek 共享 playhead。
- 不自動開始播放。

## 26. Performance Timeline

Timeline 不是直接把 MIDI notes 排一排，而是先建立所有音符 start／end 邊界，再將每個區間內仍在發聲的 notes 放入 event。這可表達：

- 長音與新 onset 重疊。
- 不同譜表／聲部同時發聲。
- 休止區間。
- 調整過的 ornament、tempo、fermata 與 repeat 時間。

上譜表旋律定義為最小 part number。若同一 onset 有多音，選最高音作 melody note。這是目前的工程 heuristic，不等同於一般音樂中所有情況的「旋律聲部」。

畫面提供可切換、可展開／收縮的上譜表 Timeline 與下譜表和聲 Timeline。點選 segment 會 seek，共用同一播放位置。

## 27. 調性推測

目前只估計一個全曲 global key。

### 27.1 優先順序

1. MusicXML 同時提供合法 fifths 與 `major`／`minor` mode：直接採用，confidence 0.99。
2. 只有 fifths：只比較該調號的關係大調與關係小調。
3. 沒有可用 key：比較 12 個大調與 12 個小調，共 24 個候選。

### 27.2 音高統計

- 將所有音折疊成 12 個 pitch class。
- 以 duration beat 加權，每音最少權重 0.125。
- 使用 Krumhansl–Kessler major／minor profile correlation。
- 終點音包含候選 tonic 時加 0.12 cadence bonus。
- confidence 是最佳與第二名 score gap 的工程化映射，範圍最高 0.95；不是統計機率。

分析使用原始 written score，不使用 repeat-expanded score，避免反覆段落被重複加權。

### 27.3 升降記號拼法

- fifths 為負時偏好降記號。
- fifths 為正時偏好升記號。
- 調號中立或缺失時，參考 MusicXML 內 alter／accidental 的實際使用。
- Tonnetz 內部仍用 canonical pitch class；顯示層才轉成 A♯ 或 B♭。

## 28. 和弦、轉位與級數

### 28.1 使用哪些音

和弦分析使用當下所有仍在發聲的譜表與聲部，不只上譜表 melody。至少需要 3 個不同 pitch class 才輸出和弦。

### 28.2 模板

目前包含：

- major、minor、diminished、augmented
- dominant 7、major 7、minor 7
- half-diminished 7、diminished 7
- sus2、sus4

對每個 root 與模板計算：matched、missing、extra、是否有 root、bass 是否為 root、是否 exact match。允許最多缺一個模板音，但至少需匹配三音。

### 28.3 轉位

- root 由最佳 chord template 決定。
- bass 是當下所有發聲音中最低 MIDI note 的 pitch class。
- bass 在 chord intervals 中的位置決定轉位。
- 顯示名稱使用 slash bass，例如 `F/A`。
- 三和弦級數使用 root position／6／6/4；七和弦使用 7／6/5／4/3／4/2。

最低音只決定轉位，不直接被當作根音。

### 28.4 羅馬數字

chord root 相對全曲 key tonic 轉成級數，並依 major／minor／diminished／augmented／seventh quality 調整大小寫與符號。

相鄰事件若 chord name 與 roman numeral 相同，會合併成一個穩定 block；跨越 note boundary 時保留 confidence 較高的 observation。

### 28.5 Tonnetz 顯示

major／minor-like chord 可轉成 Tonnetz 三角形。dim、aug、sus 與大部分非單純大小三和弦目前不強制畫三角形，避免用錯誤幾何表示複雜結構。仍可顯示實際發聲 pitch nodes、和弦名稱與級數。

## 29. Melody／Harmony 顯示語意

樂譜模式的上方狀態區保留：

```text
G · E · C                         C    I
目前發聲音                        和弦  級數
```

並保留目前估計的調名，但不顯示多餘的「Tonnetz」或「調性」標題字。

- 左側是目前實際仍在發聲的音。
- 右側是目前和弦名稱與相對全曲調性的級數。
- 尚未匯入樂譜時，window 仍存在，顯示使用者直接點 Tonnetz 所選的音，且不改動音訊辨識模式。

## 30. 故障隔離與使用者訊息

| 故障 | 目前行為 |
|---|---|
| 檔案格式／大小錯誤 | 上傳前與後端各自阻擋 |
| Queue 已滿 | `429`，提示稍後再試 |
| HOMR 無結果／無音符 | job failed，不產生假成功 |
| OCR 失敗 | 保留 HOMR，寫 warning |
| YOLO 失敗 | 保留 HOMR，寫 warning |
| MusicXML 可下載但 OSMD render 失敗 | 仍可播放與查看 Tonnetz |
| OSMD cursor 失敗 | 保留五線譜，只停用游標 |
| 鋼琴 sample 載入失敗 | 停止播放，提示再按一次 |
| worker 消失 | health 顯示 worker false；重啟時回收中斷工作 |
| job 過期 | 回 `404`，提示檔案可能已清除 |

「五線譜無法排版，仍可播放並查看 Tonnetz」只代表 OSMD SVG render 最後失敗，不等於 HOMR 辨識失敗。MIDI、MusicXML parsing、音訊與 Tonnetz 仍可能是正常的。

## 31. 部署選項

### 31.1 目前建議的分工

```text
Render Static Site：React/Vite
Render Web Service：Node API、會員與 recognition proxy
Oracle／獨立運算主機：FastAPI + worker + HOMR/OCR
MongoDB Atlas：會員資料；可選擇再放 recognition jobs/GridFS
```

Vercel／Render static 適合前端，不適合直接承載目前 HOMR 長工作。Python API 與 worker 需要可控 timeout、原生依賴、足夠 RAM，以及可取消的背景 process。

### 31.2 Storage 選擇

- API 與 worker 在同機且有 persistent disk：filesystem + SQLite 最簡單。
- API 與 worker 分離、主機可能重建或沒有 disk：MongoDB + GridFS。
- MongoDB 的主要價值是持久化與跨服務共享，不會直接降低 HOMR 模型的 inference RAM。

### 31.3 Render Standard／Railway

能否部署不是只看方案名稱，需實測：

- 單份代表性樂譜的 peak RSS。
- cold-start 時間。
- HOMR + OCR 的總執行時間。
- service timeout 與背景 process 限制。
- 暫存磁碟容量。
- 同機 Node／Python 是否搶 RAM。

低資源環境應先關閉 YOLO，保持 queue 單 worker，再依測量結果調低 HOMR width／batch 或 auxiliary edge。

## 32. 環境變數

### 32.1 Storage 與 queue

| 變數 | 預設 | 說明 |
|---|---:|---|
| `SCORE_STORAGE_BACKEND` | `filesystem` | `filesystem` 或 `mongodb` |
| `SCORE_DATA_DIR` | `runtime/recognition` | filesystem artifact 與 worker lock |
| `SCORE_DB_PATH` | `runtime/recognition/jobs.sqlite3` | SQLite queue |
| `MONGO_URI` | 空 | Atlas／MongoDB URI |
| `MONGO_DATABASE` | 空 | 可與會員共用 database |
| `SCORE_MONGO_JOBS_COLLECTION` | `recognition_jobs` | job collection |
| `SCORE_MONGO_RUNTIME_COLLECTION` | `recognition_runtime` | heartbeat collection |
| `SCORE_MONGO_GRIDFS_BUCKET` | `recognition_files` | artifact bucket |
| `SCORE_MAX_QUEUE` | `20` | queued 工作上限 |
| `JOB_TIMEOUT_SECONDS` | `600` | 單 job timeout |
| `RETENTION_SECONDS` | `86400` | artifact 保留秒數 |

### 32.2 模型與影像

| 變數 | 預設 | 說明 |
|---|---:|---|
| `SCORE_HOMR_IMAGE_WIDTH` | `1920` | HOMR 工作圖寬度 |
| `SCORE_AUX_IMAGE_MAX_EDGE` | `3200` | OCR／YOLO 長邊上限 |
| `SCORE_HOMR_BATCH_SIZE` | `2` | segmentation batch |
| `SCORE_HOMR_ONNX_THREADS` | `2` | ONNX intra-op threads |
| `SCORE_HOMR_TITLE_OCR` | `0` | HOMR 內建 title OCR |
| `SCORE_HOMR_MEMORY_PATCH` | `1` | 專案 streaming tile patch |
| `SCORE_ENABLE_OCR` | `1` | RapidOCR |
| `SCORE_ENABLE_YOLO` | 自動判斷 | optional YOLO |
| `YOLO_WEIGHTS` | 專案 models path | weights 路徑 |
| `YOLO_CONFIDENCE` | `0.65` | detection threshold |

### 32.3 網路

| 變數 | 說明 |
|---|---|
| `RECOGNITION_API_URL` | Node proxy 的 Python upstream |
| `RECOGNITION_PROXY_TOKEN` | Node 與 Python 共享 secret |
| `RECOGNITION_REQUIRE_PROXY_TOKEN` | Python 是否強制 token |
| `TONNZE_CORS_ORIGINS` | Python CORS allowlist |

API 與 worker 必須使用完全相同的 storage、database、collection 與 bucket 設定。

## 33. 可觀測性與 diagnostics

每份工作可檢查：

- 原圖、HOMR 圖、auxiliary 圖尺寸。
- 是否發生 upscaling。
- HOMR、OCR、YOLO 狀態。
- OCR 原始 rows 與術語匹配結果。
- YOLO detections。
- note count、BPM、part／staff／measure 數量。
- 是否確認 grand staff。
- measure timing／notation repair 結果。
- 低解析度、輔助引擎失敗等 warnings。
- worker 完整 log。

正式 UI 不應直接顯示 traceback，但管理／研究階段可以使用 diagnostics 比對「模型錯」、「規則錯」、「OSMD 排版錯」或「播放轉換錯」。

## 34. 測試策略

### 34.1 Python

- 上傳與格式驗證。
- queue state、atomic claim、cancel、retention 與 worker recovery。
- Mongo score storage／GridFS 契約。
- memory patch 的 tile batching、dtype 與 thread 設定。
- music term vocabulary schema、alias 與 reference 檢查。
- measure timing、notation layout、OCR merge 與 performance event 規則。

### 34.2 TypeScript

- articulation、ornament、fermata 與 performance timing。
- repeat expansion 與 source-position mapping。
- performance timeline 的 overlapping notes／rests。
- key、chord、inversion、roman numeral 與 flat spelling。
- repeated-note scheduling、release overlap 與 dense notes。
- piano velocity-to-gain。
- playback synchronizer 的 play／pause／seek／speed。

### 34.3 必要人工回歸

自動測試以外，仍需用同一份代表性鋼琴譜確認：

1. 第一次辨識與第二次辨識結果一致。
2. OSMD cold start 可排版，或只在真正 render 失敗時顯示 fallback。
3. 上下譜表可同時發聲。
4. 重複音不吃音、沒有明顯煞車感。
5. crescendo／diminuendo 聽得出差異，且在雙小節線／反覆前完成。
6. pause／seek／speed change 不留殘音。
7. 五線譜、狀態 window、Tonnetz 與 Timeline 指向同一位置。
8. 降號調顯示 B♭、E♭ 等正確拼法，而不是 A♯、D♯。
9. 反覆第二次點譜時跳到合理 occurrence。
10. 連續執行多份工作後，worker RSS 不持續單向上升。

## 35. 已知限制與風險

- 單頁限制使實際完整樂曲仍需先拆頁。
- HOMR 對影像品質與複雜排版敏感；後處理不能補回不存在的符號資訊。
- OCR 文字位置映射仍是幾何 heuristic，跨 system 或印刷位置特殊時可能放錯 measure／beat。
- YOLO 尚未形成可靠的 MusicXML conflict-resolution 規則。
- OSMD render retry 使用同一 instance；若 instance 本身已進入壞狀態，第二次仍可能失敗。
- 全曲調性無法描述中途轉調、主音化或調式混合。
- chord-template 方法容易把 passing tone、suspension、non-chord tone 當成 extra note。
- 上譜表最高音 heuristic 不等於完整 voice separation。
- 和聲 timeline 目前顯示「當下 sounding set」的最佳標籤，還沒有利用前後文做序列推論。
- score job 尚未與會員 ownership、quota、rate limit 完整整合。
- Windows 缺少 `fcntl` 時，單 worker OS lock 行為不等同 Unix 部署。

## 36. 後續演進順序

建議依風險由低到高進行：

1. 建立固定 benchmark scores，記錄辨識正確度、執行時間與 peak RSS。
2. 補上每小節／每 system 的穩定 source map，讓 UI 可以說明「第幾小節」。
3. 為 OSMD 增加完整 fresh-instance fallback，但維持 cursor error 隔離。
4. 加入 user-job ownership、會員 quota 與 rate limit。
5. 以 confidence／geometry／MusicXML consistency 決定 YOLO 是否可修正 HOMR，而非直接覆蓋。
6. 加入局部調性 window、change-point 與轉調 confidence。
7. 和聲分析加入前後文、non-chord tone 與 voice-leading cost。
8. 把分析結果轉成可驗證的教學敘述，例如共同音、低音線條、半音解決與終止式。
9. 完成使用者研究前，將「可能協助理解」維持為研究假設，不宣稱已有學習成效。

## 37. 主要程式位置

### 前端

- `src/features/tonnetz/score/useScoreImport.ts`：上傳、polling、取消與結果匯入。
- `src/features/tonnetz/api/ScoreRecognitionApi.ts`：API 契約。
- `src/features/tonnetz/score/music.ts`：MIDI 解析與 Score model。
- `src/features/tonnetz/score/ScoreNotation.tsx`：OSMD、cursor 與點譜 seek。
- `src/features/tonnetz/score/useScorePlaybackModel.ts`：演奏轉換總管線。
- `src/features/tonnetz/score/useScorePlayback.ts`：音訊排程與畫面更新。
- `src/features/tonnetz/score/ScorePlaybackSynchronizer.ts`：共享時鐘。
- `src/features/tonnetz/audio/ScorePianoEngine.ts`：sample piano engine。
- `src/features/tonnetz/score/playbackScheduling.ts`：batch、重複音與 release。
- `src/features/tonnetz/score/harmonicAnalysis.ts`：調性、和弦、轉位與級數。
- `src/features/tonnetz/score/performanceTimeline.ts`：發聲事件與點擊映射。
- `src/features/tonnetz/components/ScoreTimelineDock/`：可切換 Timeline UI。

### Node

- `server/src/recognitionProxy.js`：辨識 API 串流代理與 token。
- `server/src/app.js`：proxy middleware 順序與其他 API 組裝。

### Python

- `python-backend/tonnze/api/scores.py`：上傳驗證與 job endpoints。
- `python-backend/tonnze/worker.py`：claim、heartbeat、取消、timeout 與發布。
- `python-backend/tonnze/services/score_recognition.py`：辨識 pipeline。
- `python-backend/tonnze/recognition/homr.py`：HOMR adapter。
- `python-backend/tonnze/recognition/homr_memory.py`：segmentation 記憶體 patch。
- `python-backend/tonnze/recognition/ocr.py`：OCR 與 tile fallback。
- `python-backend/tonnze/recognition/storage.py`：filesystem／GridFS artifact。
- `python-backend/tonnze/repositories/jobs.py`：repository selector／SQLite queue。
- `python-backend/tonnze/repositories/mongo_jobs.py`：Mongo queue。
- `python-backend/tonnze/rules/music_terms.json`：音樂術語總表。
- `python-backend/tonnze/rules/performance.py`：速度、力度與 section boundary。
- `python-backend/tonnze/rules/xml_enricher.py`：OCR 文字與 MusicXML 合併。

## 38. 成功條件

一份樂譜工作只有在以下條件同時成立時才算辨識成功：

- source 通過後端驗證並已持久化。
- HOMR 產生可解析且至少含一顆音的 MusicXML。
- 修復／enrichment 後的 MusicXML 可被 music21 解析。
- linear MIDI 成功產生。
- result metadata 與 diagnostics 成功寫出。
- storage 已發布所有必要 artifacts。
- queue 最後才將 job 設為 `complete`。

前端的完整體驗則再加上：

- MIDI 可解析成有效 Score。
- 鋼琴 samples 可在使用者手勢後啟動。
- 播放、Tonnetz 與 Timeline 共用相同時鐘。
- OSMD 成功時顯示五線譜；失敗時不影響其餘可用結果。

這種定義刻意把「辨識成功」、「排版成功」與「播放成功」拆開。它能讓錯誤訊息更精確，也避免單一前端元件失敗時，錯誤地把整條樂譜辨識流程判定為失敗。
