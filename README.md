# 羽球校隊管理系統 (Badminton Team Manager)

模組化、雙語、權限完善的校隊管理系統，前端 React + Vite + TypeScript，後端 Supabase，部署到 GitHub Pages。

> 完整需求與設計：[`docs/01-requirements-and-design.md`](docs/01-requirements-and-design.md)

## 開發階段

當前進度：**Phase 1 — 地基（Foundation）已完成**

- ✅ Phase 1：專案骨架、認證、ACL、i18n、CI/CD、首頁框架
- ⬜ Phase 2：球員、請假、訓練（含行事曆整合）
- ⬜ Phase 3：費用、財務、公告、權限後台
- ⬜ Phase 4：PDF、效能、無障礙、營運準備

## 技術棧

| 層 | 技術 |
| --- | --- |
| 前端 | React 18 + Vite + TypeScript |
| UI | Tailwind CSS + 自製元件（shadcn/ui 風格） |
| 狀態 | Zustand（全域）+ TanStack Query（伺服器） |
| 路由 | React Router v6 |
| 表單 | React Hook Form + Zod |
| i18n | react-i18next（自動掃描模組翻譯） |
| 後端 | Supabase（PostgreSQL + Auth + Storage） |
| 測試 | Vitest + React Testing Library |
| 部署 | GitHub Pages（前端）+ Supabase Cloud（後端） |

## 本機開發

### 0. 前置需求

- Node.js ≥ 20
- pnpm ≥ 9（`npm i -g pnpm`）
- Supabase 專案（[建立教學](supabase/README.md)）

### 1. 安裝

```bash
git clone <repo-url>
cd badminton-team-mgmt
pnpm install
```

> **重要**：第一次 `pnpm install` 後產生的 `pnpm-lock.yaml`
> **必須 commit 進 repo**。CI 用 `pnpm install --frozen-lockfile`
> 確保所有人裝到一模一樣的相依版本，沒有 lockfile 會直接 build 失敗。
> 若團隊新手沒裝 pnpm，可以 `corepack enable && corepack prepare pnpm@9 --activate`
> 用 Node 內建 corepack 啟用，不需要額外 npm 全域安裝。

### 2. 設定環境變數

```bash
cp .env.example .env
# 編輯 .env，填入：
#   VITE_SUPABASE_URL
#   VITE_SUPABASE_ANON_KEY
```

### 3. 初始化資料庫

進入 Supabase Dashboard → SQL Editor，依序執行：

1. `supabase/migrations/0001_init_auth_acl.sql` — 建表 + RLS
2. `supabase/migrations/0002_seed_permissions_roles.sql` — 種子權限與角色
3. 在 Authentication → Users 新增 `admin@team.local`，記下 user UUID
4. `supabase/migrations/0003_create_admin_user.sql` — 建立 admin profile

詳見 [`supabase/README.md`](supabase/README.md)。

### 4. 啟動

```bash
pnpm dev
# 開啟 http://localhost:5173
# username: admin
# password: 第 3 步在 Supabase 設定的初始密碼
```

首次登入會強制改密。

### 5. 安裝 Git Hook（一次性）

```bash
pnpm prepare         # 初始化 husky
echo "pnpm lint-staged" > .husky/pre-commit
chmod +x .husky/pre-commit
```

之後每次 commit 會自動 ESLint + Prettier。

## 常用指令

```bash
pnpm dev             # 啟動開發伺服器
pnpm build           # 建置 production
pnpm preview         # 預覽 production build
pnpm lint            # ESLint
pnpm typecheck       # tsc --noEmit
pnpm test            # 單元測試
pnpm test:watch      # watch 模式
pnpm test:coverage   # 含覆蓋率
pnpm format          # Prettier 格式化
```

## 專案結構

```
src/
├─ core/                  系統核心（請保持輕量穩定）
│  ├─ acl/                權限工具（PermissionGate, useCan, PERMISSIONS）
│  ├─ auth/               AuthProvider, useAuth, authApi
│  ├─ i18n/               react-i18next 初始化、LocaleSwitcher
│  ├─ router/             AppRouter, ModuleDescriptor 註冊機制, ProtectedRoute
│  ├─ store/              authStore, uiStore (Zustand)
│  └─ supabase/           client.ts 單例、資料庫型別
├─ modules/               功能模組（新增頁面 = 新增資料夾）
│  ├─ auth/               登入頁、改密頁
│  ├─ home/               首頁
│  └─ players/            球員（Phase 2 實作）
└─ shared/                跨模組共用
   ├─ components/         AppLayout, SideNav, BottomNav, TopBar, Button, Input...
   └─ utils/              cn (className merge), eventBus
```

### 新增功能模組（Phase 2 之後）

只要在 `src/modules/<your-module>/` 建立：

```
src/modules/leaves/
├─ pages/LeavesPage.tsx       (頁面元件)
├─ components/...             (此模組私有元件)
├─ api/...                    (TanStack Query hooks)
├─ i18n/zh-TW.json
├─ i18n/en.json
└─ index.ts                   (export default ModuleDescriptor)
```

`index.ts` 範例：

```ts
import { lazy } from 'react';
import type { ModuleDescriptor } from '@/core/router/types';
import { PERMISSIONS } from '@/core/acl/permissions';

const leavesModule: ModuleDescriptor = {
  id: 'leaves',
  navLabelKey: 'common:nav.leaves',
  navIcon: 'CalendarOff',
  permissionKey: PERMISSIONS.PageLeaves,
  order: 30,
  showInNav: true,
  routes: [{ path: '/leaves', element: lazy(() => import('./pages/LeavesPage')) }],
};
export default leavesModule;
```

完成後：路由、側欄、底部導航、ACL 守衛、i18n namespace 全部自動接上 — 不需要動 core 的任何檔案。

## 部署到 GitHub Pages

### 一次性設定

1. 在 repo 設定 → Pages → Build and deployment → Source 選 **GitHub Actions**。
2. 在 repo 設定 → Secrets and variables → Actions：
   - **Secrets**：
     - `VITE_SUPABASE_URL` — Supabase 專案 URL
     - `VITE_SUPABASE_ANON_KEY` — anon public key
   - **Variables**（選填，有預設）：
     - `VITE_SYNTHETIC_EMAIL_DOMAIN`（預設 `team.local`）
     - `VITE_APP_NAME`（預設「羽球校隊管理系統」）
     - `VITE_BASE_PATH`（預設 `/<repo-name>/`，user repo 改 `/`）

### 自動部署

推送到 `main` 即觸發 `.github/workflows/deploy.yml`：

1. 安裝相依套件
2. `pnpm build`
3. 複製 `index.html` → `404.html`（SPA fallback）
4. 推送到 `gh-pages` 環境

部署 URL 會出現在 Action 摘要頁。

## 認證設計

> 因為「同家庭兩位球員可能共用 email」，本系統採用 **username + 密碼** 登入。

- **Supabase Auth 仍以 email 為唯一鍵**，但對外只看到 username。
- 註冊時自動產生 `${username}@<VITE_SYNTHETIC_EMAIL_DOMAIN>` 作為 Auth 用的合成 email。
- 真實聯絡用 email 存於 `profiles.email`，可重複、可空。
- 密碼重設：若 `profiles.email` 有值則寄信；否則由 Admin 後台重設。

## 權限系統

- **彈性 RBAC + 頁面/動作級 ACL**。
- 權限鍵（`permissions` 表）：`page:<name>:view` / `action:<feature>:<verb>`。
- 角色（`roles` 表）：預設 `admin` / `coach` / `finance` / `player`，Admin 後台可任意新增。
- 對應在 `role_permissions`、使用者掛角色在 `user_roles`。
- DB 層：所有 RLS policy 透過 `has_permission(auth.uid(), 'key')` 把關。
- 前端層：`<PermissionGate need="...">`、`useCan(...)`、`<ProtectedRoute need="...">`。
- 完整 key 列表：`src/core/acl/permissions.ts`。

## i18n

- 預設 `zh-TW`，可切 `en`。
- 共用文案：`src/core/i18n/locales/{zh-TW,en}.json`。
- 模組文案：`src/modules/<id>/i18n/{zh-TW,en}.json`，自動掛在 namespace `<id>`。
- 切換不需重新整理。日期/數字會走 `Intl` API。

## 測試

```bash
pnpm test:coverage
```

CI 設下界 70%（lines/functions/statements），未達門檻 build 失敗。

新增測試請放在元件旁的 `*.test.ts(x)`。範例：
- `src/core/acl/permissions.test.ts` — 純函式
- `src/core/acl/PermissionGate.test.tsx` — 元件 + store 整合

## 授權與貢獻

內部專案。bug 與 feature request 請開 GitHub Issue。
