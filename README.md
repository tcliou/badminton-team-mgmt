# 羽球校隊管理系統 (Badminton Team Manager)

模組化、雙語、權限完善的校隊管理系統。  
前端 React + Vite + TypeScript，後端 Supabase（PostgreSQL + Auth + Storage），CI/CD 自動部署到 GitHub Pages。

> 完整需求與設計：[`docs/01-requirements-and-design.md`](docs/01-requirements-and-design.md)

---

## 開發進度

**當前狀態：Phase 3 已完成，Phase 4 進行中**

| Phase | 內容 | 狀態 |
|-------|------|------|
| 1 | 專案骨架、認證、ACL、i18n、CI/CD | ✅ 完成 |
| 2 | 球員管理、請假與審核、訓練 CRUD（含週期性 + 出席）、首頁行事曆 | ✅ 完成 |
| 3 | 費用/繳費、財務總帳、公告（Markdown）、管理後台、議題追蹤器、家長角色 | ✅ 完成 |
| 4 | 稽核日誌、儲存 RLS 強化、球員自助打卡、Admin 重設密碼、安全掃描 CI | 🔄 進行中 |

---

## 功能模組一覽

| 模組 | 角色 | 功能摘要 |
|------|------|---------|
| **首頁** | 全員 | 本週訓練、待審請假、未繳費用、行事曆 |
| **球員** | Admin/Coach | 球員資料管理、頭像上傳、繳費/請假狀態 |
| **家長** | Admin/Parent | 家長帳號與球員綁定關係管理 |
| **請假** | Player/Coach | 申請、多選影響訓練、審核、歷史記錄 |
| **訓練** | Coach/Player | 訓練 CRUD、週期性安排、教練勾出席、球員自助打卡 |
| **繳費** | Player/Finance | 費用項目設定、球員繳費確認（含家長代繳）、証明上傳 |
| **財務** | Finance | 收支總帳、對帳確認、月份切換 |
| **公告** | Coach/Admin | Markdown 公告（含安全連結過濾）、置頂、分頁 |
| **議題追蹤** | Admin/Coach | 問題回報、Epic/Task 層次、狀態追蹤 |
| **管理後台** | Admin | 使用者 CRUD、角色/權限管理、稽核日誌 |

---

## 技術棧

| 層 | 技術 |
|---|---|
| 前端框架 | React 18 + Vite + TypeScript |
| UI / 樣式 | Tailwind CSS + 自製元件（shadcn/ui 風格） |
| 狀態管理 | Zustand（全域）+ TanStack Query（伺服器快取） |
| 路由 | React Router v6 |
| 表單驗證 | React Hook Form + Zod |
| 日曆 | FullCalendar |
| i18n | react-i18next（zh-TW / en，模組自動命名空間） |
| Markdown | react-markdown + remark-gfm（含 XSS 防護） |
| 後端 | Supabase（PostgreSQL + Row Level Security + Auth + Storage） |
| Edge Functions | Deno（create-user / delete-user / update-user-status / reset-user-password） |
| 單元測試 | Vitest + React Testing Library |
| E2E 測試 | Playwright |
| 安全掃描 | CodeQL（JS/TS）+ Trivy（npm CVE）+ GitHub Secret Scanning |
| 部署 | GitHub Pages（前端）+ Supabase Cloud（後端） |

---

## 本機開發

### 0. 前置需求

- Node.js ≥ 20
- pnpm ≥ 9（`npm i -g pnpm` 或 `corepack enable && corepack prepare pnpm@9 --activate`）
- Supabase CLI（[安裝說明](#supabase-cli)）

### 1. Clone 與安裝

```bash
git clone https://github.com/tcliou/badminton-gemini.git
cd badminton-gemini
pnpm install
```

> **重要**：`pnpm-lock.yaml` 必須 commit，CI 以 `--frozen-lockfile` 確保版本一致。

### 2. 設定環境變數

```bash
cp .env.example .env
# 填入：
#   VITE_SUPABASE_URL      ← Supabase 專案 URL
#   VITE_SUPABASE_ANON_KEY ← anon public key
```

### 3. 初始化資料庫

**推薦：Supabase CLI（一鍵套用所有 migration）**

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

**或手動**：進入 Supabase Dashboard → SQL Editor，依序執行 `supabase/migrations/` 中所有 `.sql` 檔（按編號順序）。

建立第一個 Admin 帳號，詳見 [`supabase/README.md`](supabase/README.md)。

### 4. 啟動開發伺服器

```bash
pnpm dev
# http://localhost:5173
# username: admin  /  password: 第一次設定的密碼
```

首次登入會強制要求改密。

### 5. Git Hook（一次性）

```bash
pnpm prepare   # 初始化 husky，之後每次 commit 自動執行 ESLint + Prettier
```

---

## 常用指令

```bash
pnpm dev              # 開發伺服器
pnpm build            # 建置 production bundle
pnpm preview          # 預覽 production build
pnpm lint             # ESLint 檢查
pnpm typecheck        # TypeScript 型別檢查
pnpm test             # 單元測試
pnpm test:watch       # 測試 watch 模式
pnpm test:coverage    # 含覆蓋率報告（門檻 70%）
pnpm format           # Prettier 格式化
```

---

## 專案結構

```
src/
├─ core/              系統核心（保持輕量穩定）
│  ├─ acl/            PermissionGate · useCan · permissions.ts
│  ├─ auth/           AuthProvider · authApi · ChangePasswordPage
│  ├─ i18n/           react-i18next 初始化 · 共用翻譯
│  ├─ router/         AppRouter · ProtectedRoute · ModuleDescriptor
│  ├─ store/          authStore · uiStore（Zustand）
│  └─ supabase/       client.ts · database.types.ts
├─ modules/           功能模組（新增頁面 = 新增資料夾）
│  ├─ admin/          使用者/角色/稽核日誌管理後台
│  ├─ announcements/  公告 + Markdown 預覽
│  ├─ auth/           登入頁 · 改密頁
│  ├─ finance/        財務總帳
│  ├─ home/           首頁儀表板 + 行事曆
│  ├─ issues/         議題追蹤器
│  ├─ leaves/         請假申請 / 審核
│  ├─ parents/        家長管理
│  ├─ payments/       繳費管理
│  ├─ players/        球員管理 + 頭像
│  └─ training/       訓練 CRUD + 出席 + 自助打卡
└─ shared/            跨模組共用
   ├─ components/     AppLayout · Button · Input · Dialog · ...
   └─ utils/          cn · exportSheet · formatters
supabase/
├─ functions/         Edge Functions（Deno）
│  ├─ create-user/
│  ├─ delete-user/
│  ├─ reset-user-password/
│  └─ update-user-status/
└─ migrations/        0001 → 0030 資料庫遷移腳本
```

### 新增功能模組

在 `src/modules/<your-module>/` 建立以下結構，**路由/側欄/底部導航/ACL/i18n 全部自動掛載**，不需要動 core：

```
src/modules/example/
├─ pages/ExamplePage.tsx
├─ components/...
├─ api/exampleApi.ts        ← TanStack Query hooks
├─ i18n/zh-TW.json
├─ i18n/en.json
└─ index.ts                 ← export default ModuleDescriptor
```

---

## 認證設計

> 「同家庭多位球員可能共用 email」→ 採用 **username + 密碼** 登入。

- Supabase Auth 仍以 email 為唯一鍵，但系統對外只暴露 username。
- 帳號建立時自動產生 `${username}@<VITE_SYNTHETIC_EMAIL_DOMAIN>` 作為合成 email。
- 真實聯絡 email 存於 `profiles.email`，可重複、可空。
- 密碼重設：Admin 後台一鍵產生臨時密碼，使用者首次登入後強制更改。

---

## 權限系統

- **彈性 RBAC + 頁面/動作級 ACL**
- 預設角色：`admin` / `coach` / `finance` / `player` / `parent`（Admin 後台可任意新增自訂角色）
- 權限鍵格式：`page:<name>:view` / `action:<feature>:<verb>`
- DB 層：所有資料表 RLS policy 透過 `has_permission(auth.uid(), 'key')` 把關
- 前端層：`<PermissionGate need="...">` · `useCan(...)` · `<ProtectedRoute need="...">`
- 完整 key 列表：[`src/core/acl/permissions.ts`](src/core/acl/permissions.ts)

---

## 安全性

| 機制 | 說明 |
|------|------|
| Row Level Security | 所有業務表強制啟用 |
| Edge Function 驗證 | 所有敏感操作以 JWT + 權限二次確認 |
| Audit Log | `audit_logs` 表記錄 profiles 敏感變更（Actor / IP / diff） |
| Storage Signed URL | 私密 bucket（繳費證明）簽名 URL 限時 15 分鐘 |
| Markdown XSS 防護 | `SafeLink` renderer 過濾非 http/https 連結 |
| Secret Scanning | GitHub Push Protection 即時攔截 API key 外洩 |
| CodeQL | 每次 PR 靜態分析 60+ CWE 漏洞規則 |
| Trivy | 掃描 npm 依賴 HIGH/CRITICAL CVE |
| Dependabot | 每週自動修補套件漏洞 PR |

---

## 部署到 GitHub Pages

### 一次性設定

1. Repo 設定 → Pages → Source 選 **GitHub Actions**
2. Repo 設定 → Secrets and variables → Actions 新增：

| Key | 說明 |
|-----|------|
| `VITE_SUPABASE_URL` | Supabase 專案 URL |
| `VITE_SUPABASE_ANON_KEY` | anon public key |
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI token（Edge Function 部署用） |
| `SUPABASE_PROJECT_ID` | Supabase 專案 ID |

### 自動部署流程

推送到 `main` 即觸發 `.github/workflows/deploy.yml`：

```
push to main
  → CI: Lint / TypeCheck / Test / Build / Trivy CVE scan
  → CodeQL: JS/TS 靜態安全分析
  → deploy:
      ├── Edge Functions 部署（create-user / delete-user / update-user-status / reset-user-password）
      ├── DB Migrations（冪等套用）
      └── GitHub Pages 靜態部署
```

---

## i18n

- 預設 `zh-TW`，可切換 `en`（不需重新整理）
- 共用文案：`src/core/i18n/locales/{zh-TW,en}.json`
- 模組文案：`src/modules/<id>/i18n/{zh-TW,en}.json`，自動掛在 namespace `<id>`
- 日期/數字使用 `Intl` API 在地化

---

## 測試

```bash
pnpm test:coverage    # 單元測試 + 覆蓋率（門檻 70%）
pnpm e2e              # Playwright E2E（需本機 Supabase 運行）
```

新增測試請放在元件旁的 `*.test.ts(x)`，E2E 放在 `e2e/`。

---

## 授權

本專案採用 **MIT License with Attribution**。  
您可以自由使用、修改、再發布，但**必須**在衍生作品的文件或 About 頁面中，以可見方式標註原始專案與作者：

> "Based on Badminton Team Manager by Tzu-Chiang Liou — https://github.com/tcliou/badminton-gemini"

詳見 [LICENSE](LICENSE)。

---

## 貢獻與回報

Bug 回報與功能建議請開 [GitHub Issue](https://github.com/tcliou/badminton-gemini/issues)。
