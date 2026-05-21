# 羽球校隊管理系統 — 需求與設計文件

> 版本：v1.0（已上線）
> 撰寫日期：2026-05-10
> 最後更新：2026-05-21
> 撰寫人：Tzu-Chiang Liou（tcliou）
> 狀態：Phase 1–3 完成交付；Phase 4 進行中

---

## 0. 文件目的

本文件作為羽球校隊管理系統的**單一真實來源（Single Source of Truth）**，涵蓋：

1. 完整功能需求（FR）與非功能需求（NFR）
2. 系統架構與技術選型理由
3. 資料模型、認證授權、API 設計
4. 測試與 CI/CD 策略
5. 分階段交付計劃（4 Phase）
6. 風險與未來擴充方向

確認本文後，開發將嚴格按 Phase 推進，每個 Phase 結束時提交可運作版本與對應測試。

---

## 1. 名詞定義

| 縮寫 / 術語 | 說明 |
| --- | --- |
| ACL | Access Control List，存取控制清單 |
| RBAC | Role-Based Access Control，角色式存取控制 |
| RLS | Row Level Security，PostgreSQL 列級安全策略 |
| BaaS | Backend as a Service |
| SPA | Single Page Application |
| Player / 球員 | 系統的最終使用者，每位球員有獨立帳號 |
| Coach / 教練 | 可管理訓練、審核請假 |
| Admin / 管理者 | 擁有全系統管理權 |
| Finance / 財務 | 負責費用設定與收支登錄 |

---

## 2. 系統範圍與目標

### 2.1 願景

打造一套**輕量、模組化、雙語、權限完善**的校隊管理系統，讓 20–50 人規模的羽球隊能：

- 取代散落於 LINE、Excel、紙本的隊務資訊。
- 球員、教練、家長都能在手機或電腦上隨時查閱。
- 未來可平滑擴充新模組（如比賽報名、器材租借）而不重寫核心。

### 2.2 主要使用情境（User Stories 摘要）

- 作為**球員**，我想登入後看到本週訓練、未繳費用與我的請假狀態，所有事一頁掌握。
- 作為**教練**，我想公告週末對外賽程並能快速看到誰請假。
- 作為**財務**，我想新增一筆「五月團服費」並列印當月收支 PDF 給家長會。
- 作為**管理者**，我想為新加入的學弟開戶並指定他可以看哪些頁面。

### 2.3 範圍外（Out of Scope，本期不做）

- 線上金流串接（僅做繳費登記，不實際收款）。
- 推播通知（Phase 4 評估）。
- 多隊伍 / SaaS 化（資料模型保留 `team_id` 欄位但僅 1 筆紀錄）。
- 自動翻譯使用者輸入內容（僅 UI i18n）。

---

## 3. 功能需求（FR）

> 編號規則：`FR-<頁面代號>-<序號>`。完成驗收條件以「Given/When/Then」描述。

### 3.1 P0：認證與授權系統

| ID | 需求 | 狀態 | 驗收條件 |
| --- | --- | --- | --- |
| FR-A-01 | 球員以 **username + 密碼** 登入（非 email） | ✅ 已完成 | Given 一個家庭兩位球員共用 email，When 各自註冊 username 後，Then 兩人能獨立登入且資料不互通 |
| FR-A-02 | 管理員可建立/停用帳號 | ✅ 已完成 | Given Admin 進入帳號管理，When 點「新增」並填 username/姓名/角色，Then 系統建立帳號並產生臨時密碼 |
| FR-A-03 | 帳號可掛多個角色 | ✅ 已完成 | 一位使用者可同時是 Coach + Finance |
| FR-A-04 | 頁面級 ACL | ✅ 已完成 | Admin 可勾選「此角色可看 / 可編輯 哪些頁面」，未授權者看不到該選單項 |
| FR-A-05 | 密碼重設 | ✅ 已完成 | Admin 後台「重設密碼」→ 產生 12 位臨時密碼 → 顯示於安全 modal；登入頁顯示「忘記密碼請聯絡管理員」 |
| FR-A-06 | Session 持久化 | ✅ 已完成 | 重新整理或關閉瀏覽器再開，仍維持登入（Supabase Auth 預設行為） |

### 3.2 P1：首頁

| ID | 需求 | 驗收條件 |
| --- | --- | --- |
| FR-H-01 | 公告區分「置頂」與「一般」 | 置頂在上、一般在下，皆於同頁顯示 |
| FR-H-02 | 公告以**展開/收合**方式呈現 | 預設只顯示標題＋時間，點擊後內文展開 |
| FR-H-03 | 行事曆同頁顯示「球隊行程」與「個人行程」 | 兩者以不同顏色標示，圖例可勾選顯示 |
| FR-H-04 | 個人行程可在首頁直接新增 / 編輯 / 刪除 | 不需跳轉到其他頁 |
| FR-H-05 | 行事曆支援月 / 週 / 列表三種檢視 | 手機預設「列表」視圖 |
| FR-H-06 | 公告與行事曆均依 ACL 過濾 | 沒有對應權限的內容不顯示 |

### 3.3 P2：球員管理頁

| ID | 需求 | 驗收條件 |
| --- | --- | --- |
| FR-P-01 | 顯示個人照片（可上傳/裁切） | 上傳檔案存至 Supabase Storage，自動產生方形縮圖 |
| FR-P-02 | 比賽成績記錄（CRUD） | 欄位：賽事名稱、日期、單/雙打、組別、名次、備註 |
| FR-P-03 | 經歷記錄（CRUD） | 欄位：起訖年月、隊伍/學校、職務/角色 |
| FR-P-04 | 個人補充資訊（皆非必填） | 慣用手、身高、體重、最愛球拍、最愛球路、其他自訂 |
| FR-P-05 | 顯示請假狀況（唯讀） | 顯示最近 N 筆請假，行尾按鈕跳轉到請假頁面 |
| FR-P-06 | 顯示繳費狀況（唯讀） | 顯示所有費用項目 + 我的繳費狀態（未繳/部分/已繳），按鈕跳到繳費登記頁 |
| FR-P-07 | 球員列表頁（教練/管理員可見） | 卡片式呈現，可搜尋姓名 / 角色 / 年級 |

### 3.4 P3：請假頁

| ID | 需求 | 驗收條件 |
| --- | --- | --- |
| FR-L-01 | 球員可登記請假 | 欄位：起訖日期/時段、事由分類（病假/事假/公假/其他）、說明 |
| FR-L-02 | 請假可指定影響的訓練/賽程 | 從未來 14 天的球隊行事曆下拉選擇 |
| FR-L-03 | 請假可被教練審核（同意/退回） | 退回需附原因；球員收到狀態變更通知（in-app） |
| FR-L-04 | 請假狀況同步顯示在球隊行事曆 | 該日訓練的事件詳情可看到「請假名單」 |
| FR-L-05 | 我可看自己歷史請假 | 列表 + 篩選年度 |

### 3.5 P4：繳費登記頁

| ID | 需求 | 驗收條件 |
| --- | --- | --- |
| FR-PAY-01 | 列出所有「對我收費」的項目 | 由 Finance 頁面建立的費用，符合條件者出現 |
| FR-PAY-02 | 球員可登記繳費 | 欄位：繳費管道（轉帳/現金/Linepay/其他）、金額、繳費時間、轉帳帳號末五碼、附證明照片（選填） |
| FR-PAY-03 | 登記後狀態變「待確認」 | Finance 在後台確認後狀態變「已收」 |
| FR-PAY-04 | 顯示我的繳費歷史 | 含每筆的當下狀態、可檢視附件 |

### 3.6 P5：公告事項管理頁

| ID | 需求 | 驗收條件 |
| --- | --- | --- |
| FR-AN-01 | 公告 CRUD | 標題、內文（Markdown）、是否置頂、發布時間、可見對象（角色 / 全部） |
| FR-AN-02 | 排程發布 | 可設定未來時間自動發布 |
| FR-AN-03 | 草稿與已發布兩種狀態 | 草稿不出現在首頁 |
| FR-AN-04 | 編輯歷程紀錄 | 顯示最後更新者與時間 |

### 3.7 P6：財務與出納管理頁

| ID | 需求 | 驗收條件 |
| --- | --- | --- |
| FR-F-01 | 「應收費用」CRUD | 欄位：名稱、目的、描述、金額、繳費期限、收費對象（全隊 / 特定角色 / 點名選人）、是否週期性 |
| FR-F-02 | 收支總帳（Income / Expense Ledger） | 表格可編輯：日期、類別、項目、金額、付款方/收款方、憑證連結、備註 |
| FR-F-03 | 月份切換與摘要 | 顯示本月收入、本月支出、結餘；年度累計 |
| FR-F-04 | PDF 匯出 | 一鍵將指定區間的收支表（含合計列、頁尾簽核欄）匯出為 A4 PDF |
| FR-F-05 | 對帳輔助 | 與球員端「待確認」繳費清單一鍵核對：勾選後標記為「已收」並寫入收入帳 |

### 3.8 P7：訓練時間管理頁

| ID | 需求 | 驗收條件 |
| --- | --- | --- |
| FR-T-01 | 訓練時段 CRUD | 欄位：日期、開始/結束、地點、教練、訓練主題、備註、出席對象（全隊/分組） |
| FR-T-02 | 支援週期性建立 | 例如「每週二、五 19:00–21:00 共 8 週」 |
| FR-T-03 | 同步到球隊行事曆 | 一筆訓練 = 一筆 calendar event |
| FR-T-04 | 出席紀錄 | 教練可在訓練當日勾選實到名單，缺席自動標記（除非已請假） |

---

## 4. 非功能需求（NFR）

| 類別 | 需求 |
| --- | --- |
| 響應式 | 所有頁面在 360px–1920px 寬度下排版正常；觸控目標 ≥ 44px |
| 效能 | 首頁初次載入 < 2.5 秒（4G 環境）；後續頁面切換 < 500ms |
| 可用性 | 月可用率 ≥ 99%（受 Supabase 免費方案 SLA 限制） |
| 國際化 | 全部 UI 文案皆透過 i18n key 管理；切換語言不需重整 |
| 無障礙 | 符合 WCAG 2.1 AA：鍵盤可操作、語意化 HTML、對比度 ≥ 4.5:1 |
| 安全 | 所有資料存取走 Supabase RLS；密碼使用 Supabase Auth（bcrypt）；HTTPS only |
| 隱私 | 球員照片預設僅同隊可見；可設定為「教練可見」 |
| 可維護 | 模組化目錄結構、TypeScript 嚴格模式、ESLint + Prettier 強制套用 |
| 可擴充 | 新增功能模組只需在 `/src/modules/<name>/` 建立，不需改動核心 |
| 測試 | 核心邏輯單元測試覆蓋率 ≥ 70%；E2E 涵蓋 5 條關鍵路徑 |

---

## 5. 技術架構

### 5.1 技術棧（已確認）

| 層 | 技術 | 理由 |
| --- | --- | --- |
| 前端框架 | **React 18 + Vite + TypeScript** | 生態最大、AI 工具支援好、Vite 編譯快 |
| UI | **Tailwind CSS + shadcn/ui** | 響應式優、可客製、bundle 小 |
| 狀態管理 | **Zustand**（全域） + **TanStack Query**（伺服器狀態） | 輕量、TS 友善、避免 Redux 樣板 |
| 路由 | **React Router v6** | 支援 lazy + nested routes，模組化路由註冊 |
| 表單 | **React Hook Form + Zod** | 校驗集中、效能好 |
| i18n | **react-i18next** | 業界標準，支援命名空間與懶載 |
| 行事曆 | **FullCalendar React** | 月/週/列表視圖齊全、可自訂事件渲染 |
| 圖表 | **Recharts** | 財務頁面所需 |
| Markdown | **react-markdown + remark-gfm** | 公告編輯與顯示 |
| 富文字 | **Tiptap**（公告編輯） | 輕量、擴充性強 |
| PDF | **@react-pdf/renderer** | 可在瀏覽器產出 PDF，A4 排版可控 |
| 後端 / DB | **Supabase**（PostgreSQL + Auth + Storage + Realtime） | SQL、RLS、免維運、免費方案夠 50 人用 |
| 圖片裁切 | **react-easy-crop** | 大頭照上傳 |
| 測試 | **Vitest + React Testing Library + Playwright** | Vite 原生整合，E2E 跨瀏覽器 |
| Lint / Format | **ESLint + Prettier + Husky + lint-staged** | commit hook 強制 |
| CI/CD | **GitHub Actions** | test → build → deploy 自動化 |
| Hosting | **GitHub Pages**（前端）+ **Supabase**（後端） | 0 成本，符合需求 |

### 5.2 高階架構圖

```
┌─────────────────── 使用者裝置（手機 / 電腦） ───────────────────┐
│                                                                 │
│    React SPA（GitHub Pages CDN 派送的靜態檔）                    │
│    ├─ /core      認證、路由、i18n、權限守衛                       │
│    ├─ /modules                                                   │
│    │   ├─ home          首頁（公告 + 行事曆）                     │
│    │   ├─ players       球員管理                                 │
│    │   ├─ leaves        請假                                     │
│    │   ├─ payments      繳費登記                                 │
│    │   ├─ announcements 公告管理                                 │
│    │   ├─ finance       財務與出納                                │
│    │   └─ training      訓練時間                                  │
│    └─ /shared    共用元件、hooks、types、utils                    │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS（PostgREST / Auth API / Storage）
                         ▼
┌─────────────────── Supabase（雲端）─────────────────────────────┐
│  Auth（GoTrue）  │ PostgREST API │ Storage │ Realtime（預留） │
│  PostgreSQL（Row Level Security 強制執行 ACL）                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 模組化前端目錄

```
src/
├─ core/
│  ├─ auth/           # AuthProvider, useAuth, login/logout
│  ├─ router/         # AppRouter, route registry
│  ├─ acl/            # PermissionGate, useCan
│  ├─ i18n/           # init, locale switcher
│  ├─ supabase/       # client.ts（單例）
│  └─ store/          # Zustand globals (currentUser, locale, theme)
├─ modules/
│  ├─ home/
│  │  ├─ pages/HomePage.tsx
│  │  ├─ components/AnnouncementList.tsx
│  │  ├─ components/CalendarPanel.tsx
│  │  ├─ api/         # TanStack Query hooks
│  │  ├─ types.ts
│  │  ├─ i18n/zh-TW.json
│  │  ├─ i18n/en.json
│  │  └─ index.ts     # 模組註冊（路由 + 選單 + 權限 key）
│  ├─ players/...
│  ├─ leaves/...
│  ├─ payments/...
│  ├─ announcements/...
│  ├─ finance/...
│  └─ training/...
├─ shared/
│  ├─ components/     # Button, Modal, Table, EmptyState, ...
│  ├─ hooks/          # useDebounce, usePagination, ...
│  └─ utils/
├─ App.tsx
└─ main.tsx
```

#### 模組註冊範例（每個模組唯一對外 API）

```ts
// src/modules/home/index.ts
import { lazy } from 'react';
import type { ModuleDescriptor } from '@/core/router/types';

export const homeModule: ModuleDescriptor = {
  id: 'home',
  navLabelKey: 'home.nav.label',     // i18n key
  navIcon: 'Home',
  permissionKey: 'page:home:view',   // ACL 對應
  routes: [
    { path: '/', element: lazy(() => import('./pages/HomePage')) },
  ],
};
```

`AppRouter` 啟動時掃描所有模組 descriptor，自動注入路由與側邊選單，**新增功能頁面只要新增資料夾與描述子，不動其他檔案**。

### 5.4 跨模組溝通方式

| 場景 | 方式 |
| --- | --- |
| 取得登入者 / 語系 / ACL | Zustand global store（`useAuthStore`、`useUiStore`） |
| 跨模組讀寫資料 | TanStack Query 共享 cache key（如 `['team-events']`），任何模組更動 → 自動 refetch |
| 模組間導航 | React Router `useNavigate`，路徑常數集中於 `@/core/router/paths.ts` |
| 一次性事件廣播 | `mitt` event bus（如「請假成功 → 行事曆刷新」） |

---

## 6. 資料模型

### 6.1 ER 概念圖

```
auth.users (Supabase 內建)
   │ 1:1
   ▼
profiles ────────< user_roles >──── roles ──── role_permissions ──── permissions
   │                                                                       │
   │                                                                       │ (page key)
   │ 1:N
   ├── player_match_records
   ├── player_experiences
   ├── personal_events
   ├── leave_requests ────── affects ─── calendar_events
   └── payment_records ───── for ─────── payment_items

calendar_events  (球隊行程：訓練、賽事、公告所衍生)
training_sessions ──── 1:1 ──── calendar_events
announcements
finance_transactions  (income/expense ledger)
```

### 6.2 主要資料表（PostgreSQL）

> 注意：所有 PK 皆為 `uuid`；所有表均含 `team_id uuid` 欄位（單隊先固定一個值），方便未來擴 multi-tenant；皆有 `created_at`, `updated_at`, `created_by`。

#### `profiles`（球員主資料；對應 auth.users）
| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | uuid PK | 同 auth.users.id |
| username | text UNIQUE | 登入用，家中多人不重複 |
| display_name | text | 顯示名稱 |
| email | text | 可空、可重複（家庭共用） |
| phone | text | 可空 |
| avatar_url | text | Storage 路徑 |
| birthday | date | 可空 |
| dominant_hand | text | enum: left/right/both，可空 |
| height_cm | int | 可空 |
| weight_kg | numeric | 可空 |
| favorite_racket | text | 可空 |
| extra_info | jsonb | 自訂欄位彈性放置 |
| status | text | active / suspended |

> **登入機制**：Supabase Auth 仍以 email 為唯一鍵，故註冊時自動產生 `synthetic_email = ${username}@team.local`。前端登入畫面只收 username，提交前先轉換為 synthetic email 再呼叫 `signInWithPassword`。真正的家庭 email 存於 `profiles.email`（用於通知）。

#### `roles`
| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | uuid PK | |
| name | text UNIQUE | admin / coach / finance / player / 自訂 |
| description | text | |
| is_system | bool | 系統預設不可刪 |

#### `permissions`（頁面/動作鍵）
| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| key | text PK | e.g. `page:players:view`, `action:leaves:approve` |
| description | text | |
| category | text | page / action |

#### `role_permissions`（M:N）
`role_id`、`permission_key`，唯一鍵 (role_id, permission_key)。

#### `user_roles`（M:N）
`user_id`、`role_id`，唯一鍵 (user_id, role_id)。

#### `announcements`
| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | uuid PK | |
| title | text | |
| body_md | text | Markdown |
| is_pinned | bool | |
| status | text | draft / scheduled / published |
| publish_at | timestamptz | |
| visible_to_role_ids | uuid[] | 空陣列代表全員 |
| author_id | uuid | profiles.id |

#### `calendar_events`（球隊行程）
| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | uuid PK | |
| title | text | |
| description | text | |
| starts_at | timestamptz | |
| ends_at | timestamptz | |
| location | text | |
| event_type | text | training / match / meeting / other |
| source_id | uuid | 來源（如 training_sessions.id） |
| color | text | |

#### `personal_events`（個人行程）
與 `calendar_events` 類似，多一欄 `owner_id uuid` 指向 profile，RLS 限定本人可讀寫。

#### `leave_requests`
| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | uuid PK | |
| player_id | uuid | profiles.id |
| start_at | timestamptz | |
| end_at | timestamptz | |
| reason_type | text | sick / personal / official / other |
| reason_text | text | |
| affected_event_ids | uuid[] | 影響的 calendar_events |
| status | text | pending / approved / rejected |
| reviewed_by | uuid | |
| reviewed_at | timestamptz | |
| review_note | text | |

#### `training_sessions`
與 `calendar_events` 一對一（透過 `source_id`），加上 `coach_id`、`topic`、`group_tag`。

#### `attendance_records`
| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | uuid PK | |
| training_id | uuid | training_sessions.id |
| player_id | uuid | |
| status | text | present / absent / on_leave / late |
| recorded_by | uuid | |

#### `payment_items`（應收費用）
| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | uuid PK | |
| name | text | e.g. "5 月團服費" |
| purpose | text | |
| description | text | |
| amount | numeric(10,2) | |
| due_date | date | |
| target_role_ids | uuid[] | 為空＝全員 |
| target_user_ids | uuid[] | 點名收費（與上者擇一） |
| recurrence | jsonb | 例 `{"freq":"monthly","count":12}`，可空 |
| status | text | active / closed |

#### `payment_records`（球員登記繳費）
| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | uuid PK | |
| item_id | uuid | payment_items.id |
| player_id | uuid | |
| channel | text | bank / cash / linepay / other |
| amount | numeric(10,2) | |
| paid_at | timestamptz | |
| transfer_last5 | text | |
| proof_url | text | Storage |
| status | text | pending / confirmed / rejected |
| confirmed_by | uuid | finance |
| confirmed_at | timestamptz | |

#### `finance_transactions`（總帳）
| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | uuid PK | |
| direction | text | income / expense |
| occurred_on | date | |
| category | text | 自訂分類 |
| item | text | |
| amount | numeric(10,2) | |
| counterparty | text | |
| receipt_url | text | |
| linked_payment_record_id | uuid | 可空（從繳費自動入帳） |
| note | text | |

### 6.3 RLS 策略原則

每張表的 SELECT/INSERT/UPDATE/DELETE 政策皆呼叫 SQL function `has_permission(auth.uid(), 'permission:key')`。範例：

```sql
-- announcements: 任何人都能看已發布且符合對象的；只有 announcements 編輯權限可寫
create policy "read published announcements"
on announcements for select
using (
  status = 'published'
  and publish_at <= now()
  and (
    array_length(visible_to_role_ids, 1) is null
    or exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role_id = any(visible_to_role_ids)
    )
  )
);

create policy "manage announcements"
on announcements for all
using (has_permission(auth.uid(), 'action:announcements:manage'));
```

`profiles.email` 等隱私欄位以 view 控制，避免 RLS 無法做欄位級隔離。

---

## 7. 認證與權限詳細設計

### 7.1 註冊流程
1. Admin 在後台填 username、display_name、初始角色 → 點建立。
2. 後端（Supabase Edge Function）：
   - 產生 `synthetic_email = ${username}@team.local`。
   - 呼叫 `auth.admin.createUser()` 建 user，產隨機 12 碼密碼。
   - INSERT into `profiles`、`user_roles`。
3. 系統顯示一次性密碼供 Admin 轉交球員，球員首次登入強制改密。

### 7.2 登入流程
1. 球員輸入 username + password。
2. 前端 `await supabase.auth.signInWithPassword({ email: synthEmail, password })`。
3. 取得 session 後 `useAuthStore` 存入 `user`、`profile`、`roles`、`permissions`（透過 `select profile_with_perms()` view）。
4. 若 `profile.must_change_password = true`，路由守衛強制導到改密頁。

### 7.3 ACL 在前端的展現
- **PermissionGate 元件**：`<PermissionGate need="page:finance:view"><FinanceMenu/></PermissionGate>`
- **useCan hook**：`const canApprove = useCan('action:leaves:approve');`
- **路由守衛**：每個模組 descriptor 帶 `permissionKey`，`AppRouter` 進入前驗證，未授權 → 403 頁。

### 7.4 ACL 在後端的展現
- 所有寫入動作以 RLS 為最後防線（前端被繞過也擋住）。
- 危險操作（如刪除帳號、批量改權限）透過 Edge Function 實作，內含 `assertHasPermission()` 檢查。

---

## 8. 國際化（i18n）設計

- 預設語系：`zh-TW`，可切換 `en`。
- 檔案配置：每個模組目錄下 `i18n/zh-TW.json`、`i18n/en.json`，用 `namespace = moduleId`。
- `react-i18next` 初始化時動態 `import.meta.glob` 載入所有模組翻譯檔。
- 切換語系：寫入 `localStorage.locale`，`useUiStore.setLocale()` 觸發 `i18n.changeLanguage()`，畫面即時更新。
- 日期 / 數字：`Intl.DateTimeFormat` + `Intl.NumberFormat` 對應 locale。
- **使用者輸入內容（公告本文、費用名稱）不自動翻譯**，由建立者選擇語言；可未來擴充「同筆內容雙語欄位」。

---

## 9. UI / UX 重點

- **Mobile First**：先設計 360px 寬樣板，桌機僅展開兩欄。
- **底部導航**：手機螢幕寬 < 768px 時顯示底部 5 大主選單（首頁/球員/請假/繳費/更多），桌機改側邊欄。
- **大頭照預設**：用 username 首字 + 隨機底色產生 avatar fallback。
- **Loading / Empty / Error 三態**：每個列表頁皆需明確顯示，不留白。
- **暗色模式**：Phase 4 評估，預留 Tailwind `dark:` class。
- **無障礙**：所有 icon 按鈕需 `aria-label`，shadcn/ui 已內建焦點環。

---

## 10. 測試策略

| 層級 | 工具 | 覆蓋範圍 |
| --- | --- | --- |
| 單元 | **Vitest** | 純函式（utils、ACL、日期格式化、Zod schema） |
| 元件 | **React Testing Library** | 共用元件、PermissionGate、表單驗證 |
| Hook | **Vitest + RTL renderHook** | useAuth、useCan、TanStack Query hooks（mock supabase client） |
| 整合 | **Vitest + msw** | 模擬 Supabase REST 回傳，驗證頁面流程 |
| E2E | **Playwright** | 5 條關鍵路徑：登入 / 看公告 / 請假 / 繳費登記 / 訓練建立 |

**目標覆蓋率**：核心邏輯（`/core`）≥ 85%，模組頁面 ≥ 70%。CI 設下界，掉到門檻以下 build fail。

---

## 11. CI / CD

### 11.1 GitHub Actions Workflows

```
.github/workflows/
├─ ci.yml           # PR 觸發：lint → typecheck → test → build
├─ e2e.yml          # 每日排程 + main push：Playwright E2E
└─ deploy.yml       # main 推送：build → 上傳 GitHub Pages
```

#### ci.yml 概要
1. `actions/checkout`
2. `actions/setup-node@v4`，Node 20、cache pnpm
3. `pnpm install --frozen-lockfile`
4. `pnpm lint`（ESLint）
5. `pnpm typecheck`（tsc --noEmit）
6. `pnpm test --coverage`，覆蓋率 artifact 上傳
7. `pnpm build`，build artifact 上傳（供 deploy.yml 重用）

#### deploy.yml 概要
1. 等 ci.yml 成功（`workflow_run`）。
2. 下載 build artifact。
3. `actions/upload-pages-artifact` → `actions/deploy-pages`。
4. Vite 設 `base: '/<repo-name>/'`。
5. SPA 路由 fallback：複製 `index.html` 為 `404.html` 處理 React Router。

### 11.2 環境變數

- `.env.example`：列出 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`。
- 真實值放 GitHub Secrets，Action 階段注入。
- Service Role Key **僅** 用於 Edge Function，**絕不**暴露於前端。

---

## 12. 部署拓撲

```
┌────────────────┐      ┌────────────────────┐
│  GitHub Pages  │ ───► │  使用者瀏覽器       │
│  (前端 SPA)    │      │  (React + Tailwind)│
└────────────────┘      └─────────┬──────────┘
                                  │ HTTPS
                                  ▼
                       ┌────────────────────┐
                       │  Supabase Project  │
                       │  - Auth            │
                       │  - PostgREST       │
                       │  - Storage (avatar,│
                       │    proof, receipt) │
                       │  - Edge Functions  │
                       └────────────────────┘
```

備份：Supabase 免費方案每日自動備份 7 天；另外撰寫 Action 每週將 DB dump 推到 private repo 一份。

---

## 13. 分階段交付計劃（Phased Plan）

> 每個 Phase 產出一個可運作 release，附 demo URL 與測試報告。預估時程僅供規劃，實際依進度調整。

### Phase 1：地基（Foundation）— 預估 1.5 週
**交付**：可登入、可切語系、可見首頁骨架。

- [P1-1] 專案初始化：Vite + TS + Tailwind + shadcn/ui + ESLint/Prettier/Husky
- [P1-2] 模組化目錄結構與 `ModuleDescriptor` 路由註冊機制
- [P1-3] Supabase 專案建立、`profiles`/`roles`/`permissions`/`user_roles`/`role_permissions` 表 + RLS
- [P1-4] 認證模組：username 登入、登出、改密、Session 持久化、AuthProvider
- [P1-5] ACL 模組：`PermissionGate`、`useCan`、路由守衛
- [P1-6] i18n 框架：`react-i18next` 初始化、語系切換器、模組翻譯動態載入
- [P1-7] 首頁骨架（公告佔位 + 行事曆佔位）+ 響應式 Layout（手機底部導航 / 桌機側欄）
- [P1-8] CI workflow：lint / typecheck / test / build
- [P1-9] Deploy workflow：GitHub Pages（含 base path 設定 + 404 fallback）
- [P1-10] 種子資料 SQL：建立 admin 帳號、預設 4 角色、所有 permission keys

**驗收**：Admin 可在線上版本登入、切英文、看到首頁、看不到沒權限的選單。CI 通過、自動部署成功。

---

### Phase 2：球員與訓練（People & Training）— 預估 2 週
**交付**：球員管理、請假、訓練時間管理三大頁面完整可用。

- [P2-1] `players` 模組：列表、詳情、編輯、頭像上傳（Storage 整合 + 裁切）
- [P2-2] `players` 子模組：比賽成績 / 經歷 / 補充資訊 CRUD
- [P2-3] `training` 模組：訓練 CRUD、週期性建立、出席紀錄
- [P2-4] `leaves` 模組：球員請假表單、教練審核流程、影響事件多選
- [P2-5] `calendar_events` 整合：訓練 / 請假 → 行事曆事件自動同步
- [P2-6] 首頁行事曆接上真實資料：球隊事件 + 個人事件，雙顏色、可勾選圖例
- [P2-7] 個人行程 CRUD（首頁直接操作）
- [P2-8] Vitest 單元 / 元件測試補完上述模組
- [P2-9] Playwright E2E：登入 → 請假 → 教練審核 流程

**驗收**：教練能在訓練前一天看到請假名單。球員手機開首頁能看見本週訓練 + 自己的事。

---

### Phase 3：財務、公告與權限後台（Finance & Comms）— 預估 2 週
**交付**：財務、繳費、公告、權限管理後台。

- [P3-1] `announcements` 模組：CRUD、Tiptap 編輯器、置頂 / 排程 / 草稿、可見對象
- [P3-2] 首頁公告區整合：分置頂 / 一般、展開折疊
- [P3-3] `finance` 模組 - 應收費用 CRUD：含週期、目標對象選擇
- [P3-4] `payments` 模組（球員端）：列出我的費用、登記繳費、上傳證明
- [P3-5] `finance` 模組 - 對帳：finance 確認繳費 → 寫入 transactions
- [P3-6] `finance` 模組 - 收支總帳：表格編輯、月份切換、摘要圖表
- [P3-7] **權限管理後台**：Admin 可建/刪角色、勾選 role_permissions、指派 user_roles
- [P3-8] `players` 頁面顯示繳費 / 請假狀態（接上 Phase 2、3 資料）
- [P3-9] 對應測試補完

**驗收**：Finance 能新增費用、確認繳費、看到當月收支。Admin 能新建「家長代表」角色並指派頁面權限。

---

### Phase 4：強化與營運準備（Hardening & Ops）— 預估 1.5 週
**交付**：PDF、效能、可靠性、上線文件。

- [P4-1] 財務 PDF 匯出（`@react-pdf/renderer`）：A4、表頭表尾、簽核欄
- [P4-2] In-app 通知（請假狀態、費用即將到期）— 不發推播，登入後紅點
- [P4-3] 暗色模式 + 主題切換
- [P4-4] 效能：route-level code splitting、圖片懶載入、TanStack Query persist
- [P4-5] 無障礙審查：axe-core 自動掃 + 鍵盤手動測試
- [P4-6] E2E 路徑補齊到 5 條
- [P4-7] 監控：Sentry 免費方案接前端錯誤
- [P4-8] 備份 Action：每週 pg_dump → private repo
- [P4-9] 使用手冊（Admin / Coach / Player 各一份 Markdown）
- [P4-10] 安全自評清單（OWASP Top 10 對照）

**驗收**：財務人員一鍵列印 PDF。Lighthouse 分數 ≥ 90 / ≥ 90 / ≥ 95 / ≥ 95（Perf/A11y/BP/SEO）。

---

## 14. 風險與對策

| 風險 | 影響 | 對策 |
| --- | --- | --- |
| Supabase 免費方案被封或限額 | 中 | 預留可遷 PocketBase 的抽象層；每週備份 |
| GitHub Pages 不支援 SPA 路由（直連子路徑 404） | 低 | `404.html` fallback 已規劃 |
| 同家庭多帳號 username 撞名 | 低 | DB UNIQUE + 註冊時即時檢查 |
| 資料外洩（avatar / 繳費證明） | 高 | Storage bucket 設 RLS；signed URL 限時 15 分鐘 |
| 教練忘了審核請假 | 中 | Phase 4 in-app 紅點；未來可加 email 提醒 |
| 球員亂改個人資訊 | 低 | RLS + audit log（profiles 改動寫 `audit_logs` 表） |
| 翻譯漏掉 | 中 | i18n key 缺漏在 dev 模式拋警告，CI 加 `i18next-parser` 偵測 |
| **xlsx 套件升版授權變更** | 低 | 目前使用 v0.18.5（Apache-2.0，免費）；v0.19+ SheetJS 已改為商業授權。若需升版，改用 `exceljs`（MIT）作為替代方案。Dependabot 自動 PR 升版時需人工確認授權。 |

---

## 15. 未來擴充方向（路線圖外）

- 比賽報名與分組抽籤
- 器材借還
- 推播通知（OneSignal 或 Web Push）
- 多隊伍 SaaS 化（移除 `team_id` 固定值）
- 與校務系統 SSO 串接
- In-app 紅點通知（Phase 4 持續評估）

---

## 16. 設計決策記錄（ADR）

| # | 問題 | 決策 | 理由 |
|---|------|------|------|
| 1 | 認證主鍵 | username + synthetic email | 同家庭多帳號可共用 email |
| 2 | 球員照片可見範圍 | 全隊皆可看 | 資訊透明，利於凝聚感 |
| 3 | 家長角色 | 實作獨立家長帳號 + player_parents 綁定 | 需求確認後決定支援 |
| 4 | 訓練出席填寫者 | 球員自助打卡（教練可修改） | 降低教練操作負擔 |
| 5 | 公告格式 | 支援 Markdown（含 XSS SafeLink 防護） | 增加排版彈性 |
| 6 | 部署目標 | GitHub Pages（user repo，base = `/`） | 免費、易維護 |
| 7 | 密碼重設 | Admin 後台產生臨時密碼，顯示於安全 modal | 系統使用合成 email，無法走標準 email 重設流程 |
| 8 | issues / player_parents SELECT 可見度 | 不收緊（全隊透明） | 內部協作專案，透明有助溝通 |

---

## 17. 文件歷程

| 版本 | 日期 | 變更 |
| --- | --- | --- |
| v0.1 | 2026-05-10 | 初版（架構規劃） |
| v0.2 | 2026-05-12 | Phase 2 完成：球員/請假/訓練/行事曆 |
| v0.3 | 2026-05-15 | Phase 3 完成：費用/財務/公告/管理後台/議題追蹤/家長角色 |
| v1.0 | 2026-05-21 | Phase 4 進行中：Audit Log / Storage RLS / 自助打卡 / 密碼重設 / 安全掃描 CI；文件同步更新 |
