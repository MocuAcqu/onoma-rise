# OnomaRise 樂譜辨識與播放規則

本文件集中說明 `python-backend/tonnze/rules` 中的所有規則，包括速度、力度、演奏法、表情術語、樂曲導引、裝飾音、延長記號，以及 MusicXML 結構修復。

> `BPM`、`velocity`、`gate` 與 `velocityDelta` 是 OnomaRise 的播放詮釋值，用來產生穩定且可預期的播放效果，並非通用的音樂常數。

## 目錄

1. [規則處理流程](#1-規則處理流程)
2. [共用播放參數](#2-共用播放參數)
3. [速度規則](#3-速度規則tempo)
4. [力度規則](#4-力度規則dynamic)
5. [演奏法規則](#5-演奏法規則articulation)
6. [表情術語規則](#6-表情術語規則expression)
7. [樂曲導引與段落標記](#7-樂曲導引與段落標記)
8. [裝飾音與倚音規則](#8-裝飾音與倚音規則)
9. [附點與延長記號](#9-附點與延長記號)
10. [小節時值修復](#10-小節時值修復)
11. [圓滑線排版修復](#11-圓滑線排版修復)
12. [文字辨識與 MusicXML 寫入](#12-文字辨識與-musicxml-寫入)
13. [詞彙表格式與驗證](#13-詞彙表格式與驗證)
14. [前端播放套用順序](#14-前端播放套用順序)
15. [相關檔案](#15-相關檔案)

## 1. 規則處理流程

```text
樂譜圖片 / MusicXML
        ↓
HOMR 與 OCR 辨識
        ↓
music_terms.json 統一術語、別名與播放值
        ↓
將辨識結果補入 MusicXML，並修復保守可判定的結構問題
        ↓
產生 articulation、ornament、mark、performance 事件
        ↓
前端依序套用規則並播放
```

[`music_terms.json`](./music_terms.json) 是速度、力度、表情術語與導引文字的唯一資料來源；Python 模組負責載入、驗證、辨識及轉換成事件。逐音符的演奏法與 MusicXML 裝飾音則由各自的規則模組處理。

## 2. 共用播放參數

### 2.1 `gate`

`gate` 是實際發聲時值占原始音符時值的比例：

```text
發聲時值 = 原始音符時值 × gate
```

- `1.00`：完整保留原時值。
- `0.50`：只發聲原時值的 50%。
- 數值越小，音符越短促、分離。
- 音符處理後至少保留 `0.03 beat`。
- 表情規則不會把聲音延長到超過樂譜原時值。

### 2.2 `velocity`

`velocity` 是正規化後的播放力度，範圍為 `0–1`。寫入 MusicXML 時會概略換算成 `0–127`：

```text
MIDI velocity ≈ round(velocity × 127)
```

前端實際播放時會把力度限制在 `0.05–1.00`，避免完全無聲或超出範圍。

### 2.3 `velocityDelta`

`velocityDelta` 是加到播放力度上的相對增量：

```text
播放力度 = clamp(基礎力度 + velocityDelta, 0.05, 1.00)
```

- `0.00`：力度不變。
- 正數：加強力度。
- 負數：減弱力度。
- MIDI 力度的概略變化量為 `velocityDelta × 127`。

例如，基礎力度為 `0.60`，`velocityDelta = 0.12` 時，結果為 `0.72`，約等於 MIDI velocity `91`。

### 2.4 `curve`

播放事件有兩種變化方式：

| 值 | 說明 |
|---|---|
| `step` | 從指定拍點立即切換到新值 |
| `linear` | 在 `startBeat` 到 `endBeat` 之間逐步改變 |

速度漸變以 BPM 線性變化並積分成實際秒數；力度漸變在前端使用幾何插值，使音量的分貝變化較均勻。

## 3. 速度規則（Tempo）

### 3.1 固定速度術語

| 術語 | 中文 | BPM |
|---|---|---:|
| `Larghissimo` | 極緩板 | 24 |
| `Grave` | 莊板 | 40 |
| `Largo` | 廣板 | 50 |
| `Lento` | 慢板 | 52 |
| `Larghetto` | 小廣板 | 60 |
| `Adagio` | 柔板 | 66 |
| `Adagietto` | 小柔板 | 72 |
| `Andante` | 行板 | 80 |
| `Andantino` | 小行板 | 84 |
| `Maestoso` | 莊嚴地 | 88 |
| `Moderato` | 中板 | 100 |
| `Allegretto` | 小快板 | 108 |
| `Brightly`／`bright` | 明快地 | 116 |
| `Allegro` | 快板 | 120 |
| `Vivace` | 活潑的快板 | 144 |
| `Presto` | 急板 | 168 |
| `Prestissimo` | 最急板 | 192 |

固定速度會產生 `curve: step` 事件，從術語所在拍點立即套用指定 BPM。若整份樂譜沒有可辨識的速度，規則引擎以 `120 BPM` 作為預設初始速度。

### 3.2 恢復速度

| 標準文字 | 可辨識別名 | 行為 |
|---|---|---|
| `a tempo` | `a tempo` | 恢復樂譜最初辨識到的明確速度 |
| `Tempo primo` | `tempo primo` | 恢復樂譜最初辨識到的明確速度 |

### 3.3 相對與漸變速度

| 標準文字 | 可辨識別名 | 類型 | 播放規則 |
|---|---|---|---|
| `rit.` | `rit.`、`rit`、`ritardando`、`rall.`、`rall`、`rallentando` | 漸慢 | 目前 BPM × `0.82`，預設跨兩小節線性變化 |
| `accel.` | `accelerando`、`accel.`、`accel` | 漸快 | 目前 BPM × `1.18`，預設跨兩小節線性變化 |
| `più mosso` | `più mosso`、`piu mosso` | 立即加快 | 目前 BPM × `1.12` |
| `meno mosso` | `meno mosso` | 立即減慢 | 目前 BPM × `0.88` |
| `stringendo` | `stringendo` | 漸快 | 目前 BPM × `1.18`，預設跨兩小節線性變化 |
| `allargando` | `allargando` | 漸慢並加寬 | BPM × `0.82`、力度 `+0.14`，預設跨兩小節 |
| `calando` | `calando`、`morendo`、`smorzando` | 漸慢並漸弱 | BPM × `0.82`、力度 `−0.18`，預設跨兩小節 |

若 MusicXML 已提供漸變結束位置，會使用該位置；否則使用開始位置後兩小節。`allargando` 和 `calando` 不會跨越下一個正式段落邊界。

## 4. 力度規則（Dynamic）

### 4.1 固定力度記號

| 記號 | 中文 | `velocity` | 約略 MIDI velocity |
|---|---|---:|---:|
| `pppp` | 極極弱 | 0.16 | 20 |
| `ppp` | 極弱 | 0.22 | 28 |
| `pp` | 很弱 | 0.30 | 38 |
| `p` | 弱 | 0.40 | 51 |
| `mp` | 中弱 | 0.52 | 66 |
| `mf` | 中強 | 0.64 | 81 |
| `f` | 強 | 0.76 | 97 |
| `ff` | 很強 | 0.88 | 112 |
| `fff` | 極強 | 0.96 | 122 |
| `ffff` | 極極強 | 1.00 | 127 |
| `fp` | 強後立即轉弱 | 0.68 | 86 |
| `sf` | 突強 | 0.90 | 114 |
| `sfz` | 突強音 | 0.94 | 119 |
| `sfp` | 突強後轉弱 | 0.86 | 109 |
| `rf` | 加強 | 0.90 | 114 |
| `rfz` | 突然加強 | 0.94 | 119 |

目前固定力度記號會產生 `step` 事件。`fp`、`sfp` 等複合符號在目前實作中使用表中的單一代表力度，尚未拆成「先強、後弱」的兩段包絡。

### 4.2 漸強與漸弱

| 標準文字 | 可辨識別名 | 行為 |
|---|---|---|
| `cresc.` | `crescendo`、`cresc.`、`cresc` | 線性漸強 |
| `dim.` | `diminuendo`、`dim.`、`dim`、`decrescendo`、`decresc.`、`decresc` | 線性漸弱 |

漸變的目標與範圍依以下順序決定：

1. 若後方有明確力度記號，以該記號作為終點與目標。
2. 否則預設變化量為 `0.28`：漸強 `+0.28`，漸弱 `−0.28`。
3. 沒有明確終點時，預設延續兩小節。
4. 力度目標限制在 `0.12–1.00`。
5. 漸變不跨越下一個正式段落邊界。

### 4.3 段落力度重設

遇到下列小節線或反覆邊界時，新段落會先重設為 `mf = 0.64`；若同一拍點另有明確力度記號，該記號會立即覆蓋重設值。

- `double`
- `final`
- `heavy-light`
- `heavy-heavy`
- 反覆記號小節線

## 5. 演奏法規則（Articulation）

逐音符演奏法定義於 [`articulations.py`](./articulations.py)。

| 演奏法 | 中文說明 | `gate` | 發聲長度 | `velocityDelta` |
|---|---|---:|---:|---:|
| `staccato` | 斷奏 | 0.50 | 原時值的 50% | 0.00 |
| `staccatissimo` | 極短斷奏 | 0.25 | 原時值的 25% | +0.02 |
| `tenuto` | 保持音、充分奏出 | 0.95 | 原時值的 95% | 0.00 |
| `accent` | 重音 | 0.90 | 原時值的 90% | +0.12 |
| `strong accent` | 強重音 | 0.80 | 原時值的 80% | +0.20 |
| `detached legato` | 分離式圓滑奏 | 0.75 | 原時值的 75% | 0.00 |
| `spiccato` | 跳弓、跳音 | 0.40 | 原時值的 40% | +0.05 |

同一音符符合多個演奏法時：

1. `gate` 使用其中最小值。
2. `velocityDelta` 全部相加。
3. 力度結果限制在 `0.05–1.00`。

範例：原始音符為 `1 beat`、力度 `0.60`，套用 `accent` 後會得到 `0.90 beat`、力度 `0.72`。

## 6. 表情術語規則（Expression）

表情術語從術語所在位置生效，到下一個表情術語或樂曲結尾為止。

| 術語 | 中文 | `gate` | `velocityDelta` |
|---|---|---:|---:|
| `dolce` | 柔和地 | 0.98 | −0.08 |
| `legato` | 圓滑地 | 1.00 | 0.00 |
| `cantabile` | 如歌地 | 1.00 | +0.04 |
| `espressivo`／`espr.`／`espr` | 富有表情地 | 1.00 | +0.08 |
| `marcato` | 強調地 | 0.90 | +0.12 |
| `risoluto` | 果斷地 | 0.88 | +0.15 |
| `sostenuto` | 持續地 | 1.00 | 0.00 |
| `con brio` | 有活力地 | 0.92 | +0.10 |
| `rubato` | 自由速度地 | 1.00 | +0.03 |

若同一音符同時位於多個表情事件內，`gate` 彼此相乘，`velocityDelta` 彼此相加。表情規則只能縮短發聲包絡，不會把音符延長到超過記譜時值。

目前 `rubato` 只套用表中的力度增量，尚未產生自由速度曲線。

## 7. 樂曲導引與段落標記

這些文字會被辨識並保留在 MusicXML 或術語結果中，但不會由 `performance_events` 直接建立速度或力度事件。

| 標準文字 | 可辨識別名 | 中文 | 類型 |
|---|---|---|---|
| `D.C.` | `D.C.`、`D. C.`、`D C`、`DC`、`da capo` | 回到開頭 | `da_capo` |
| `D.S.` | `D.S.`、`D. S.`、`D S`、`DS`、`dal segno` | 回到反覆記號 | `dal_segno` |
| `To Coda` | `to coda`、`al coda` | 跳至尾聲 | `to_coda` |
| `Segno` | `segno` | 反覆記號 | `segno` |
| `Trio` | `trio` | 中段 | `section` |
| `Coda` | `coda`，但排除前方為 `to` 或 `al` | 尾聲 | `section` |
| `Fine` | `fine`，但排除前方為 `al` | 結束 | `section` |

`Coda` 與 `To Coda`、`Fine` 與 `al Fine` 使用不同匹配規則，避免同一句文字被重複判定成兩個標記。

## 8. 裝飾音與倚音規則

裝飾音由 [`ornaments.py`](./ornaments.py) 從 MusicXML 擷取成 beat-domain 事件，再由前端展開成實際音符。輔助音會依主音音名與當前調號計算，而不是固定使用上下兩個半音。

### 8.1 倚音

| MusicXML 狀態 | 事件名稱 | 播放規則 |
|---|---|---|
| `<grace slash="yes">` | `acciaccatura`，短倚音 | 使用主音時值的 25%，但最多取 `0.25 beat` |
| `<grace>` 無斜線 | `appoggiatura`，長倚音 | 使用主音時值的 50%，但最多取 `1 beat` |

多個倚音會平均分配取得的時值，每個倚音實際發聲為其片段的 92%；主音移到倚音後開始，並扣除相同時值。

### 8.2 一般裝飾音

| 名稱 | 播放音型 |
|---|---|
| `trill` | 主音 ↔ 上方輔助音，反覆至事件結尾 |
| `mordent` | 主音 → 下方輔助音 → 主音 |
| `inverted-mordent` | 主音 → 上方輔助音 → 主音 |
| `turn` | 上方輔助音 → 主音 → 下方輔助音 → 主音 |
| `inverted-turn` | 下方輔助音 → 主音 → 上方輔助音 → 主音 |
| `delayed-turn` | 與 `turn` 相同，但從事件時值的後半段開始 |
| `shake` | 主音 ↔ 上方輔助音，反覆至事件結尾 |
| `schleifer` | 下方輔助音 → 主音 → 上方輔助音 → 主音 |

`trill`、`shake` 和 `tremolo` 的反覆單位為 `0.25 beat`，每個展開音符發聲為片段的 92%。若 MusicXML 有成對的 `wavy-line start/stop`，顫音會延續到 stop 所在音符結束；否則至少保留 `0.25 beat`。

### 8.3 震音

- 單音震音：反覆主音。
- 雙音震音：在 `start` 與 `stop` 的兩個音高之間交替。
- `strokes` 會保留在事件資料中；目前前端反覆速度固定為每 `0.25 beat` 一次，尚未依 strokes 改變密度。

### 8.4 琶音

同一聲部、同一拍點的和弦音會由低到高排列，每個後續音延遲 `0.06 beat`，並從原時值扣除相同延遲；音符至少保留 `0.03 beat`。

## 9. 附點與延長記號

[`marks.py`](./marks.py) 保留附點與 fermata 的記譜資訊，包括聲部、小節、音名、開始拍、時值、附點數與是否為延長記號。

- 附點時值已包含在 MusicXML／MIDI 的原始音符時值中，前端不會再次拉長。
- Fermata 的播放倍率為 `2`，也就是在音符或休止符結束處加入一段與原發聲時間相同的停留。
- 多聲部在同一時間點出現 fermata 時，只建立一次合奏停留，並取最長的停留時間，避免重複加倍。

## 10. 小節時值修復

[`measure_timing.py`](./measure_timing.py) 只修復可安全判定的 OMR 小節錯誤：HOMR 有時會在 `2/4` 或 `3/4` 中，把視覺上的全小節休止符錯寫成四個四分音符。

修復條件必須全部成立：

1. 小節不是 `implicit` 小節。
2. divisions、拍號與小節容量皆可正確計算。
3. 同一 staff／voice 中只有一個音符事件。
4. 該事件是全小節休止符或 whole rest。
5. 休止符時值大於目前拍號允許的小節容量。

符合時會把休止符 duration 限制為小節容量並標記 `measure="yes"`；同一小節中超出容量的 `<backup>` 也會一併修正。旋律音、不完整小節和無法確定的內容不會被修改。

## 11. 圓滑線排版修復

[`notation_layout.py`](./notation_layout.py) 不新增音符或猜測不存在的圓滑線，只修復可判定的結構與方向。

### 11.1 配對規則

- 以 `staff + voice + slur number` 配對 `start`、`continue`、`stop`。
- 未配對的 start、continue 或 stop 會移除。
- 跨越超過一個換行且沒有 continue 資料的長圓滑線會視為 OMR 歧義並移除。

### 11.2 上下方向判斷

依下列優先順序決定 `above` 或 `below`：

1. 保留 MusicXML 已有的明確 placement。
2. 同一譜表有多聲部時，平均音高較高的聲部置於上方，較低的置於下方。
3. 有一致符桿方向時，符桿向下則圓滑線在上，符桿向上則在下。
4. 無符桿資訊時，比較音高與當前譜號所推算的譜表中心：高音置上、低音置下。
5. 無足夠資訊時維持自動排版。

## 12. 文字辨識與 MusicXML 寫入

### 12.1 文字比對

- 比對不分大小寫。
- 一般別名使用 Unicode 安全的完整詞界線，避免從其他單字中誤抓短記號。
- 同一段文字可辨識多個術語，例如 `p dolce` 會保留兩個事件及其左右順序。
- OCR 辨識出的力度記號只在 confidence 至少為 `0.7` 時接受。
- 同一文字在 x、y 各相差不超過 `20 px` 時視為重複，只保留信心值較高者。

### 12.2 位置對應

- 優先使用樂譜幾何分析，把 OCR 座標對應到 system、measure、staff 與上下位置。
- 無幾何資料時，依頁面相對座標作保守推算。
- 方向會吸附到小節內最近的實際 note onset。
- 小節開頭的譜號、調號與拍號不消耗音樂時間，計算水平拍點時會扣除其視覺空間。
- 第一個明確速度通常固定放在第一小節開頭，避免標題區使垂直位置判斷偏移。

### 12.3 寫入 MusicXML

- 固定速度寫成 `<sound tempo="…">`。
- 恢復原速會寫回最初速度。
- 力度符號寫入 `<dynamics>`，並以 `round(velocity × 127)` 寫入 `<sound dynamics="…">`。
- `Coda` 寫入 `<coda>`，其他段落文字寫入 rehearsal 或 words。
- 已存在於 MusicXML 的同術語與小節位置不重複新增。

## 13. 詞彙表格式與驗證

[`music_terms.json`](./music_terms.json) 使用 `schemaVersion: 1`。每個術語必須包含：

```text
id
family
canonical
aliases
kind
meaningZh
playback
referenceIds
```

啟動時會驗證：

- schema version 必須為 `1`。
- `id` 不可重複。
- 同一 family 內的 alias 不可重複。
- alias 不可為空，且正規表示式必須可編譯。
- `referenceIds` 必須存在於 references。
- `kind: tempo` 必須有數值 BPM。
- `dynamic_mark` 的 velocity 必須介於 `0–1`。
- `kind: expression` 必須同時有 `gate` 與 `velocityDelta`。

資料來源包含 MusicXML 4.0、SMuFL 1.4，以及 OnomaRise playback policy v1；實際 URL 與版本記錄在詞彙表的 `references` 欄位。

## 14. 前端播放套用順序

播放模型依序處理：

```text
原始記譜音符
  → articulation
  → ornament / grace / arpeggiate
  → tempo / dynamic / expression
  → fermata
  → repeat
```

這個順序代表：

- 演奏法先調整逐音符時值與力度。
- 裝飾音再展開成實際播放音符。
- 速度、整體力度與表情術語接著換算成秒數及最終包絡。
- Fermata 在完成速度換算後加入停留。
- 最後展開反覆段落，建立完整播放時間軸。

## 15. 相關檔案

| 功能 | 後端／資料 | 前端播放 |
|---|---|---|
| 術語詞彙表 | [`music_terms.json`](./music_terms.json)、[`vocabulary.py`](./vocabulary.py) | — |
| 文字規則入口 | [`registry.py`](./registry.py) | — |
| 速度 | [`tempo.py`](./tempo.py)、[`performance.py`](./performance.py) | [`performanceTiming.ts`](../../../src/features/tonnetz/score/performanceTiming.ts) |
| 力度 | [`dynamics.py`](./dynamics.py)、[`performance.py`](./performance.py) | [`performanceTiming.ts`](../../../src/features/tonnetz/score/performanceTiming.ts) |
| 演奏法 | [`articulations.py`](./articulations.py) | [`articulationTiming.ts`](../../../src/features/tonnetz/score/articulationTiming.ts) |
| 表情術語 | [`expressions.py`](./expressions.py)、[`performance.py`](./performance.py) | [`performanceTiming.ts`](../../../src/features/tonnetz/score/performanceTiming.ts) |
| 裝飾音 | [`ornaments.py`](./ornaments.py) | [`ornamentTiming.ts`](../../../src/features/tonnetz/score/ornamentTiming.ts) |
| 附點與 Fermata | [`marks.py`](./marks.py) | [`fermataTiming.ts`](../../../src/features/tonnetz/score/fermataTiming.ts) |
| 小節修復 | [`measure_timing.py`](./measure_timing.py) | — |
| 圓滑線修復 | [`notation_layout.py`](./notation_layout.py) | — |
| MusicXML 寫入 | [`xml_enricher.py`](./xml_enricher.py) | — |
| 播放處理順序 | — | [`useScorePlaybackModel.ts`](../../../src/features/tonnetz/score/useScorePlaybackModel.ts) |
