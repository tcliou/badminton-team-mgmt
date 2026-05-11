-- =============================================================================
-- 0020_phase3_announcements_finance.sql
-- Phase 3：公告 / 應收費用 / 繳費登記 / 收支總帳
--
-- 新表：
--   - announcements          公告
--   - payment_items          應收費用（finance 角色建立）
--   - payment_records        繳費紀錄（球員登記，finance 確認）
--   - finance_transactions   收支總帳
-- =============================================================================

-- ---------------------------------------------------------------------------
-- announcements：公告
-- ---------------------------------------------------------------------------
create table if not exists public.announcements (
    id                  uuid primary key default uuid_generate_v4(),
    team_id             uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
    title               text not null,
    body_md             text not null default '',
    is_pinned           boolean not null default false,
    status              text not null default 'draft'
                        check (status in ('draft','scheduled','published')),
    publish_at          timestamptz,                       -- scheduled / published 必填
    -- 可見對象 role id 陣列；空陣列代表「全員可見」
    visible_to_role_ids uuid[] not null default '{}'::uuid[],
    author_id           uuid references public.profiles(id) on delete set null,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);
create index if not exists announcements_status_idx on public.announcements(status, publish_at desc);
create index if not exists announcements_pinned_idx on public.announcements(is_pinned);

drop trigger if exists announcements_set_updated_at on public.announcements;
create trigger announcements_set_updated_at
before update on public.announcements
for each row execute function public.trg_set_updated_at();

-- ---------------------------------------------------------------------------
-- payment_items：應收費用定義
-- ---------------------------------------------------------------------------
create table if not exists public.payment_items (
    id                uuid primary key default uuid_generate_v4(),
    team_id           uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
    name              text not null,         -- 例 "5 月團服費"
    purpose           text,                  -- 用途
    description       text,                  -- 詳細說明（轉帳資訊、發票備註等）
    amount            numeric(10,2) not null,
    due_date          date,                  -- 繳費期限
    -- 收費對象：兩擇一
    --   target_role_ids 不空 → 對指定角色收（角色 id 列表）
    --   target_user_ids 不空 → 對指定球員收（user id 列表）
    --   兩者都空 → 全隊
    target_role_ids   uuid[] not null default '{}'::uuid[],
    target_user_ids   uuid[] not null default '{}'::uuid[],
    status            text not null default 'active' check (status in ('active','closed')),
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now(),
    created_by        uuid references public.profiles(id) on delete set null
);
create index if not exists payment_items_status_idx on public.payment_items(status, due_date);

drop trigger if exists payment_items_set_updated_at on public.payment_items;
create trigger payment_items_set_updated_at
before update on public.payment_items
for each row execute function public.trg_set_updated_at();

-- ---------------------------------------------------------------------------
-- payment_records：球員繳費紀錄
-- ---------------------------------------------------------------------------
create table if not exists public.payment_records (
    id                uuid primary key default uuid_generate_v4(),
    item_id           uuid not null references public.payment_items(id) on delete cascade,
    player_id         uuid not null references public.profiles(id) on delete cascade,
    channel           text not null check (channel in ('bank','cash','linepay','other')),
    amount            numeric(10,2) not null,
    paid_at           timestamptz not null default now(),
    transfer_last5    text,                  -- 轉帳末五碼
    proof_url         text,                  -- Storage 路徑
    status            text not null default 'pending'
                      check (status in ('pending','confirmed','rejected')),
    confirmed_by      uuid references public.profiles(id) on delete set null,
    confirmed_at      timestamptz,
    note              text,                  -- finance 確認時的備註
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now()
);
create index if not exists payment_records_item_idx on public.payment_records(item_id);
create index if not exists payment_records_player_idx on public.payment_records(player_id);
create index if not exists payment_records_status_idx on public.payment_records(status);

drop trigger if exists payment_records_set_updated_at on public.payment_records;
create trigger payment_records_set_updated_at
before update on public.payment_records
for each row execute function public.trg_set_updated_at();

-- ---------------------------------------------------------------------------
-- finance_transactions：收支總帳
-- ---------------------------------------------------------------------------
create table if not exists public.finance_transactions (
    id                       uuid primary key default uuid_generate_v4(),
    team_id                  uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
    direction                text not null check (direction in ('income','expense')),
    occurred_on              date not null,
    category                 text,                  -- 自訂分類，例 "團服費"、"場地租金"
    item                     text not null,         -- 摘要
    amount                   numeric(10,2) not null,
    counterparty             text,                  -- 付款方 / 收款方
    receipt_url              text,
    -- 來自球員回報的繳費自動入帳時，記錄來源
    linked_payment_record_id uuid references public.payment_records(id) on delete set null,
    note                     text,
    created_at               timestamptz not null default now(),
    updated_at               timestamptz not null default now(),
    created_by               uuid references public.profiles(id) on delete set null
);
create index if not exists finance_transactions_date_idx
  on public.finance_transactions(occurred_on desc);
create index if not exists finance_transactions_dir_idx
  on public.finance_transactions(direction, occurred_on desc);

drop trigger if exists finance_transactions_set_updated_at on public.finance_transactions;
create trigger finance_transactions_set_updated_at
before update on public.finance_transactions
for each row execute function public.trg_set_updated_at();

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.announcements         enable row level security;
alter table public.payment_items         enable row level security;
alter table public.payment_records       enable row level security;
alter table public.finance_transactions  enable row level security;

-- announcements：所有登入者可讀「已發布且可見對象包含自己」；管理者可任意寫
drop policy if exists announcements_read on public.announcements;
create policy announcements_read on public.announcements
  for select to authenticated
  using (
    -- 管理員看全部（含草稿、排程）
    public.has_permission(auth.uid(), 'action:announcements:manage')
    or (
      status = 'published'
      and (publish_at is null or publish_at <= now())
      and (
        array_length(visible_to_role_ids, 1) is null
        or exists (
          select 1 from public.user_roles ur
          where ur.user_id = auth.uid()
            and ur.role_id = any(visible_to_role_ids)
        )
      )
    )
  );

drop policy if exists announcements_write on public.announcements;
create policy announcements_write on public.announcements for all to authenticated
  using (public.has_permission(auth.uid(), 'action:announcements:manage'))
  with check (public.has_permission(auth.uid(), 'action:announcements:manage'));

-- payment_items：所有登入者可讀（球員要看到對自己收的費用）；finance:manage 可寫
drop policy if exists payment_items_read on public.payment_items;
create policy payment_items_read on public.payment_items
  for select to authenticated using (true);

drop policy if exists payment_items_write on public.payment_items;
create policy payment_items_write on public.payment_items for all to authenticated
  using (public.has_permission(auth.uid(), 'action:finance:manage'))
  with check (public.has_permission(auth.uid(), 'action:finance:manage'));

-- payment_records：本人讀寫自己的；finance:confirm 可讀全部 + 改 status
drop policy if exists payment_records_self_read on public.payment_records;
create policy payment_records_self_read on public.payment_records
  for select to authenticated
  using (
    player_id = auth.uid()
    or public.has_permission(auth.uid(), 'action:finance:confirm')
  );

drop policy if exists payment_records_self_insert on public.payment_records;
create policy payment_records_self_insert on public.payment_records
  for insert to authenticated
  with check (player_id = auth.uid());

drop policy if exists payment_records_self_update on public.payment_records;
create policy payment_records_self_update on public.payment_records
  for update to authenticated
  using (player_id = auth.uid() and status = 'pending')
  with check (player_id = auth.uid() and status = 'pending');

drop policy if exists payment_records_finance_update on public.payment_records;
create policy payment_records_finance_update on public.payment_records
  for update to authenticated
  using (public.has_permission(auth.uid(), 'action:finance:confirm'))
  with check (public.has_permission(auth.uid(), 'action:finance:confirm'));

drop policy if exists payment_records_self_delete on public.payment_records;
create policy payment_records_self_delete on public.payment_records
  for delete to authenticated
  using (player_id = auth.uid() and status = 'pending');

-- finance_transactions：finance:manage 可讀寫；其他人不能讀（避免外洩支出明細）
drop policy if exists finance_transactions_manage on public.finance_transactions;
create policy finance_transactions_manage on public.finance_transactions for all to authenticated
  using (public.has_permission(auth.uid(), 'action:finance:manage'))
  with check (public.has_permission(auth.uid(), 'action:finance:manage'));
