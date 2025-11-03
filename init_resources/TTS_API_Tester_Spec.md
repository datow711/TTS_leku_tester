# TTS API 測試器 MVP 規格書

## 一、專案簡介
本專案為一個前端網頁工具，用來測試台語 TTS API。  
目標是讓使用者可以：
1. 從資料庫（xlsx 檔）隨機抽一句台語句子。
2. 即時呼叫 TTS API 生成語音並播放。
3. 針對語音輸出或文字內容進行修正並儲存至 Supabase。
4. 在右側檢視過去儲存過的修正紀錄。

---

## 二、系統架構概述

| 模組 | 功能 | 技術 |
|------|------|------|
| 前端 | 主要操作介面與互動邏輯 | React + Vite（或備用方案：HTML + CSS + JS + jQuery） |
| TTS API | 語音合成 | https://dev.taigiedu.com/backend/synthesize_speech |
| 資料來源 | 句子資料 | repo 中的 xlsx 檔 |
| 資料儲存 | 使用者修正紀錄 | Supabase（尚未建立） |
| 部署 | 靜態網站 | GitHub Pages |

---

## 三、資料來源（xlsx）

**檔案位置**：放在 GitHub repo（可放 `/assets/data/sentences.xlsx`）  
**欄位格式：**

| 詞目id | 義項id | 例句順序 | 漢字 | 羅馬字 | 華語 | 音檔檔名 |
|--------|--------|-----------|------|---------|------|-----------|
| 1 | 1 | 1 | 一蕊花 | tsi̍t luí hue | 一朵花 | 1-1-1 |
| … | … | … | … | … | … | … |

**前端行為：**
- 點擊「抽一句」時，從表格中隨機選出一筆。
- 顯示「漢字」與「羅馬字」兩欄。
- 其他欄位（如華語、音檔檔名）暫不顯示。

---

## 四、TTS API

**Endpoint**
```
POST https://dev.taigiedu.com/backend/synthesize_speech
```

**Request Payload**
```json
{
  "tts_lang": "tb",
  "tts_data": "test"
}
```

**Response**
```json
{
  "result": "<base64編碼音訊>"
}
```

**備註**
- 回傳的 base64 須轉成 Blob 再播放。
- 預設音訊格式：`audio/mp3`
- 不需授權 header（若未來需要可擴充）。

---

## 五、Supabase 建置指導（AI 工具需指導用戶完成）

在開始部署前，請依以下步驟建立 Supabase 專案：

1. **建立專案**
   - 前往 [https://supabase.com](https://supabase.com)
   - 建立新專案，選擇免費方案。
   - 複製「Project URL」與「anon 公鑰」。

2. **建立資料表**
   - 資料表名稱：`tts_corrections`
   - 欄位結構如下：

| 欄位名稱 | 類型 | 說明 |
|----------|------|------|
| id | uuid（主鍵，自動生成） | 唯一識別碼 |
| hanji | text | 原句漢字 |
| lomaji | text | 原句羅馬字 |
| correction | text | 修正內容 |
| created_at | timestamptz（預設 now()） | 建立時間 |

3. **設定 RLS（Row Level Security）**
   - 開啟 RLS。
   - 新增 Policy：「允許所有使用者插入資料」。

     ```sql
     CREATE POLICY "allow insert for anon"
     ON tts_corrections
     FOR INSERT
     TO anon
     WITH CHECK (true);
     ```

4. **允許 CORS**
   - 在 Supabase 設定「Allowed Origins」中新增你的 GitHub Pages 網域，例如：
     ```
     https://<your-username>.github.io
     ```
   - 儲存設定。

5. **前端使用設定**
   - 在前端環境變數中新增：
     ```
     VITE_SUPABASE_URL=<Project URL>
     VITE_SUPABASE_KEY=<anon key>
     ```

---

## 六、前端介面設計（功能區）

### 左側（3/4）
| 區塊 | 功能 |
|------|------|
| 抽一句按鈕 | 從 xlsx 隨機抽句並顯示 |
| 顯示區 | 顯示「漢字」與「羅馬字」兩行文字 |
| 播放按鈕 | 呼叫 TTS API 生成語音（base64 → Blob → 播放） |
| 修正輸入框 | 可輸入需要修正的內容 |
| 儲存按鈕 | 將原句與修正內容存入 Supabase |

### 右側（1/4）
| 區塊 | 功能 |
|------|------|
| 修正紀錄列表 | 從 Supabase 讀取，依時間倒序顯示 |
| 每筆項目 | 顯示漢字、羅馬字、修正內容、時間 |

---

## 七、部署教學

### A. Vite + React 版本（推薦）

1. **建立專案**
   ```bash
   npm create vite@latest tts-tester --template react
   cd tts-tester
   npm install
   ```

2. **安裝 gh-pages 套件**
   ```bash
   npm install gh-pages --save-dev
   ```

3. **設定 `vite.config.js`**
   ```js
   export default {
     base: '/<repo-name>/',
   }
   ```

4. **修改 `package.json`**
   ```json
   "homepage": "https://<username>.github.io/<repo-name>",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

5. **部署**
   ```bash
   npm run deploy
   ```

6. **驗證**
   - 開啟 GitHub Pages 網址。
   - 確認可呼叫 API 並正常播放音訊。

---

### B. 純 HTML / CSS / JS 版本（無打包工具）

1. 建立 `index.html`, `style.css`, `main.js`
2. 將所有檔案放進 repo 根目錄。
3. 在 GitHub Repo → Settings → Pages → Source 選擇「main branch / root」。
4. 儲存後等待部署完成。
5. 頁面網址將為：
   ```
   https://<username>.github.io/<repo-name>/
   ```

---

## 八、MVP 功能清單

| 功能項目 | 狀態 | 備註 |
|-----------|-------|------|
| 從 xlsx 隨機抽句 | ✅ 規格完成 | 需前端讀檔 |
| 呼叫 TTS API 播放 | ✅ 規格完成 | 回傳 base64 |
| 修正內容輸入 | ✅ 規格完成 | 單欄即可 |
| 儲存至 Supabase | 🚧 等資料庫建立 | 規格已列出 |
| 顯示修正紀錄 | 🚧 同上 |
| 部署 GitHub Pages | ✅ 兩方案皆可 |

---

## 九、後續擴充方向（非 MVP）

- 增加「重播」按鈕。
- 支援多語言（如台語、華語對照）。
- 使用者登入（Supabase Auth）。
- 增加「批次測試」模式（一次抽多句）。

---

## 十、開發者注意事項
- 所有 API 呼叫都需支援 HTTPS。
- 若 TTS 音訊格式非 MP3，請調整 `<audio>` 的 MIME type。
- 由於是開放式前端，建議：
  - Supabase RLS 僅允許 INSERT。
  - 每分鐘呼叫數限制可由 Edge Function 實作。
- 若有延遲問題，可在播放鍵旁加入「Loading...」提示。

---

**製作人：**  
黃思齊（Kun-uí Nâ）  
**文件版本：** 1.0  
**建立日期：** 2025-11-03
