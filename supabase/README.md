# Supabase 設定指南

本目錄包含本系統的資料庫 schema、RLS policies、與 seed 腳本。

## 目錄

```
supabase/
└── migrations/
    ├── 0001_init_auth_acl.sql            # Phase 1：認證/權限 schema + RLS
    ├── 0002_seed_permissions_roles.sql   # Phase 1：預設角色與權限鍵
    ├── 0003_create_admin_user.sql        # Phase 1：建立第一個 admin profile
    ├── 0010_phase2_core_tables.sql       # Phase 2：行事曆 / 訓練 / 請假 / 球員附帶資料 + RLS
    └── 0011_storage_avatars.sql          # Phase 2：avatars Storage bucket + policies
```

## 部署到 Supabase Cloud（推薦給校隊使用）

1. 到 <https://supabase.com> 註冊專案，取得：
   - **Project URL**（`https://xxx.supabase.co`）
   - **anon public key**
   - **service_role key**（僅後台用，不要放前端）
2. 將以上兩個 anon 變數填入專案根目錄 `.env`：
   ```bash
   cp .env.example .env
   # 編輯 .env，填入 VITE_SUPABASE_URL 與 VITE_SUPABASE_ANON_KEY
   ```
3. 進入 Supabase Dashboard → **SQL Editor**，依序執行：
   1. `0001_init_auth_acl.sql`
   2. `0002_seed_permissions_roles.sql`
   3. （Phase 2 之後）`0010_phase2_core_tables.sql`
   4. （Phase 2 之後）`0011_storage_avatars.sql`
4. 建立第一個 admin 帳號：
   - 進入 **Authentication → Users → Add user**
   - Email：`admin@team.local`
   - Password：自訂一組強密碼（這是首登入用，之後 admin 必須改密）
   - Auto-confirm user：勾選
   - 建立後執行 `0003_create_admin_user.sql`
5. 登入應用程式：username 輸入 `admin`、密碼輸入步驟 4 設定的密碼。系統會強制要求改密。

## 部署到本機 Supabase（開發者）

```bash
# 安裝 Supabase CLI
brew install supabase/tap/supabase

# 啟動本機 stack
supabase start

# 套用 migration
supabase db reset
```

## RLS 重點

- 所有業務表都啟用 Row Level Security。
- 共用 helper：`public.has_permission(user_id, key)` — 任何 policy 都可呼叫。
- 取得登入者完整資料：`select * from public.v_my_profile;`

## 後續擴充

Phase 2 之後新增的 migration 會編號為 `0010_*`、`0011_*`，請保持遞增不要覆蓋舊檔。
