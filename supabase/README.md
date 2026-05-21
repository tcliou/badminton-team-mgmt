# Supabase 設定指南

本目錄包含羽球校隊管理系統的資料庫 schema、RLS policies、Edge Functions 與遷移腳本。

---

## 目錄結構

```
supabase/
├── config.toml                          # 本機 Supabase 設定
├── migrations/                          # 資料庫遷移腳本（依序套用）
│   ├── 0001_init_auth_acl.sql           # Phase 1：認證/權限 schema + RLS + has_permission()
│   ├── 0002_seed_permissions_roles.sql  # Phase 1：預設角色（admin/coach/finance/player）與權限鍵
│   ├── 0003_create_admin_user.sql       # Phase 1：建立第一個 admin profile（手動執行）
│   ├── 0004_e2e_test_accounts.sql       # Phase 1：E2E 測試帳號種子
│   ├── 0010_phase2_core_tables.sql      # Phase 2：訓練/請假/出席/球員資料 + RLS
│   ├── 0011_storage_avatars.sql         # Phase 2：avatars Storage bucket + RLS
│   ├── 0020_phase3_announcements_finance.sql  # Phase 3：公告/費用/繳費/財務總帳
│   ├── 0021_storage_payment_proofs.sql  # Phase 3：payment-proofs bucket + RLS
│   ├── 0022_payment_confirm_fn.sql      # Phase 3：confirm_payment / reject_payment SECURITY DEFINER
│   ├── 0023_expense_advanced_by.sql     # Phase 3：finance_transactions 代墊欄位
│   ├── 0024_issues_tracker.sql          # Phase 3：議題追蹤器 issues 表
│   ├── 0025_issues_enhancements.sql     # Phase 3：issues 子任務、依賴、優先級欄位
│   ├── 0026_parent_role.sql             # Phase 3：parent 角色與 player_parents 關聯表
│   ├── 0027_parent_rls.sql              # Phase 3：家長讀取子女資料的 RLS 擴充
│   ├── 0028_audit_logs.sql              # Phase 4：稽核日誌表 + profiles 變更觸發器
│   ├── 0029_storage_rls_fixes.sql       # Phase 4：Storage RLS 補強（關聯球員讀取）
│   └── 0030_attendance_self_checkin.sql # Phase 4：球員自助打卡 RLS（限 present/late）
├── functions/                           # Edge Functions（Deno runtime）
│   ├── create-user/                     # 建立新帳號 + 臨時密碼
│   ├── delete-user/                     # 完整刪除帳號（含 Auth + Cascade）
│   ├── reset-user-password/             # Admin 重設任意帳號密碼
│   └── update-user-status/              # 停用 / 啟用帳號（Auth ban_duration）
├── snippets/                            # 常用查詢片段（Debug 用）
└── templates/                           # 手動 SQL 範本
```

---

## 快速上線（Supabase Cloud — 推薦）

### 步驟一：建立 Supabase 專案

1. 前往 <https://supabase.com> 建立免費專案，記下：
   - **Project URL**（`https://xxx.supabase.co`）
   - **anon public key**
   - **service_role key**（僅後台使用，**勿放前端**）
   - **Project Reference ID**（設定頁 → General）

2. 填入根目錄 `.env`：
   ```bash
   cp .env.example .env
   # VITE_SUPABASE_URL=https://xxx.supabase.co
   # VITE_SUPABASE_ANON_KEY=eyJ...
   ```

### 步驟二：套用資料庫 Migration

**方法 A — Supabase CLI（推薦，一鍵冪等）：**

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

**方法 B — 手動 SQL Editor：**

進入 Dashboard → SQL Editor，依序貼上並執行 `migrations/` 下所有 `.sql` 檔（`0001` → `0030`，跳過 `0004`）。

### 步驟三：建立第一個 Admin 帳號

1. Dashboard → Authentication → Users → **Add user**：
   - Email：`admin@team.local`（合成 email，不會寄信）
   - Password：自訂強密碼
   - Auto confirm user：✅ 勾選
2. 記下建立後顯示的 **user UUID**
3. 開啟 `migrations/0003_create_admin_user.sql`，將 `:ADMIN_USER_ID` 替換為上述 UUID 後執行

### 步驟四：部署 Edge Functions

```bash
# 需先 export SUPABASE_ACCESS_TOKEN
supabase functions deploy create-user        --project-ref <ref>
supabase functions deploy delete-user        --project-ref <ref>
supabase functions deploy reset-user-password --project-ref <ref>
supabase functions deploy update-user-status --project-ref <ref>
```

> CI/CD 已整合到 `.github/workflows/deploy.yml`，推送 main 分支後自動部署。

### 步驟五：設定 Edge Function 環境變數

Dashboard → Project Settings → Edge Functions → 新增：

| Key | 說明 |
|-----|------|
| `SYNTHETIC_EMAIL_DOMAIN` | 合成 email 網域（預設 `team.local`） |

> `SUPABASE_URL` 與 `SUPABASE_SERVICE_ROLE_KEY` 會自動注入，無需手動設定。

### 步驟六：登入應用程式

- URL：你的 GitHub Pages 部署 URL
- Username：`admin`
- Password：步驟三設定的密碼
- 系統會強制要求首次改密

---

## 本機開發（Supabase CLI Local）

```bash
# 安裝 Supabase CLI
brew install supabase/tap/supabase   # macOS
# 或參考官方文件其他平台安裝方式

# 啟動本機 Supabase stack（PostgreSQL + Auth + Storage + Studio）
supabase start

# 套用所有 migration（每次 schema 變更後執行）
supabase db reset

# 查看本機 Studio
open http://localhost:54323
```

本機 anon key 與 URL 在 `supabase start` 輸出中，填入 `.env` 即可。

---

## RLS 設計重點

| 機制 | 說明 |
|------|------|
| `has_permission(uid, key)` | 所有 policy 共用的權限查詢 helper，定義於 `0001` |
| `is_parent_of(player_id)` | 家長角色專用 helper，定義於 `0027` |
| SECURITY DEFINER + search_path | 所有自訂函式防止 schema injection |
| audit_logs 觸發器 | profiles 變更自動寫入稽核日誌，走 SECURITY DEFINER 繞過 RLS |
| Storage signed URL | payment-proofs / finance-receipts 私密 bucket，簽名 URL 限時 15 分鐘 |

查詢自己的完整 profile：

```sql
select * from public.v_my_profile;
```

查詢稽核日誌（需 action:users:manage 權限）：

```sql
select * from public.v_audit_logs order by created_at desc limit 50;
```

---

## 新增 Migration 規則

1. 檔名格式：`NNNN_<描述>.sql`，`NNNN` 為目前最大編號 + 1
2. 每個 migration **必須是冪等的**（使用 `IF NOT EXISTS`、`IF EXISTS`、`OR REPLACE`）
3. 新表必須啟用 RLS 並至少設定一條 policy
4. SECURITY DEFINER 函式必須加 `set search_path = public`
5. 推送到 remote：`supabase db push --linked`

---

## 常見問題

**Q：db push 出現 `already exists` 錯誤？**  
A：代表 migration 之前手動執行過。加 `--include-all` 強制重套用，或確認 `supabase_migrations.schema_migrations` 表的記錄。

**Q：Edge Function 呼叫返回 401？**  
A：前端需要在 request header 帶入 Supabase session 的 access_token（`supabase.functions.invoke` 自動處理），請確認使用者已登入。

**Q：本機 `supabase start` 跑很慢？**  
A：首次需下載 Docker images，之後會快很多。確認 Docker Desktop 在執行。
