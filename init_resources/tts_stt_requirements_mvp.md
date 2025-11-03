# TTS + STT 測試頁 MVP 需求書 (純 HTML + JS 版本)

## 1. 專案目標
- 建立一個 **TTS + STT 測試頁面**，部署於 GitHub Pages。
- 採用 **純 HTML + 原生 JavaScript + IndexedDB/localStorage + Hash 路由**，避免繁雜建置。
- 頁面分為兩種視圖：
  - **Admin 後台**：團隊內測試用，有簡單密碼保護。
  - **Result 公開頁**：僅顯示結果，不可修改。
- 頂部可切換 **TTS** 或 **STT** 模式。
- 主要功能：載入台語音素表格（v5）、逐 cell 測試 TTS/STT，並記錄 O/X 判斷。

---

## 2. 資料來源（v5）
- 檔案：`/data/syllable_tone_grid_v5.json`（主）與 `/data/syllable_tone_grid_v5.csv`（備）。
- 資料結構：
  ```json
  {
    "rime_group": "a",
    "initial": "k",
    "base": "ka",
    "tone1": "ka", 
    "tone1_num": "ka1",
    "tone2": "ká",
    ...
    "tone9": "ka̋",
    "tone9_num": "ka9"
  }
  ```
- **tone6 不存在**。
- **tone4、tone8**：僅限結尾 -t/-p/-k/-h 的韻母，其餘必為空白。
- 每個韻母組的第一列為獨立韻母（`initial=""`）。

---

## 3. API 規格

### 3.1 TTS
- **URL**: `https://dev.taigiedu.com/backend/synthesize_speech`
- **Method**: `POST`
- **Payload**:
  ```json
  { "tts_lang": "tb", "tts_data": "siūnn" }
  ```
- **Response**: base64 音訊。

### 3.2 STT
- **URL**: `https://dev.taigiedu.com/backend/transcribe_speech`
- **Method**: `POST`
- **Payload**:
  ```json
  {
    "stt_data": "<base64 audio>",
    "stt_lang": "tw",
    "stt_type": "base64"
  }
  ```
- **Response**:
  ```json
  { "message": { "tw": "台文漢字", "tl": "台羅", "poj": "白話字" } }
  ```
- **特殊值**: 若無音則回傳 `"<{silent}>"`。

---

## 4. 前端功能需求

### 4.1 共用
- **Grid 表格**：
  - 列 = 韻母組 × 聲母（含獨立韻母）。
  - 欄 = tone1,2,3,4,5,7,8,9。
  - 空白欄位 → 顯示「—」並禁用。
- **O/X 標記**：三態（O=綠、X=紅、未測試=灰）。
- **即時儲存**：O/X 狀態存至 IndexedDB 或 localStorage。
- **Hash 路由**：`/#/tts/admin`, `/#/tts/results`, `/#/stt/admin`, `/#/stt/results`。

### 4.2 TTS 模式
- 每 cell 提供「播放」按鈕 → 呼叫 TTS API 播放。

### 4.3 STT 模式
- 每 cell 提供「錄音」按鈕 → 錄音 → 呼叫 STT API → 顯示結果。

---

## 5. Admin 後台
- 簡單密碼保護（雜湊比對）。
- 功能：Grid 操作、O/X 標記、匯出 JSON/CSV。

---

## 6. Result 公開頁
- 顯示：Grid + 播放/錄音鍵 + 測試結果。
- **不可修改**。
- 提供「下載測試結果」按鈕。

---

## 7. 資料儲存
- IndexedDB（或 localStorage 備援）。
- 匯出檔名：`tts_stt_eval_{YYYYMMDD_HHMMSS}.json` / `.csv`。

---

## 8. 顯示規則
- O=綠色、X=紅色、未測試=灰色。
- tone4/8 僅限 -t/-p/-k/-h，否則為空白。
- 錄音中顯示紅點與計時。

---

## 9. 風格規範
- **主色系**：白底（#FFFFFF）+ 輔色綠（#22C55E）。
- **按鈕**：綠色主按鈕、紅色錯誤、灰色禁用。
- **字型**：系統預設（Noto Sans TC / 微軟正黑體 / system-ui）。
- **設計理念**：簡單清楚，不要過度裝飾。

---

## 10. 佈署
- 放在 GitHub Pages。
- 採 hash 路由避免 404。
- 不需 Node 打包流程，直接純 HTML/JS/CSS。

---

## 11. 完成定義（DoD）
- Grid 成功載入 v5。
- TTS 播放正常。
- STT 錄音並顯示文字。
- O/X 標記可存取並持久化。
- 匯出 JSON/CSV 正確。
- Admin 與 Result 頁面可切換，Result 僅顯示。

