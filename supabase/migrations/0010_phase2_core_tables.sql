-- =============================================================================
-- 0010_phase2_core_tables.sql
-- Phase 2：球員 / 請假 / 訓練 / 行事曆 / 出席
--
-- 新表：
--   - calendar_events     球隊行程（訓練 / 比賽 / 會議）
--   - personal_events     個人行程（只本人可見可寫）
--   - training_sessions   訓練（與 calendar_events 1:1 透過 source_id）
--   - leave_requests      請假
--   - attendance_records  出席紀錄
--   - player_match_records 比賽成績
--   - player_experiences  經歷
-- =============================================================================

-- ---------------------------------------------------------------------------
-- calendar_events：球隊共享行事曆
-- ---------------------------------------------------------------------------
create table if not exists public.calendar_events (
    id          uuid primary key default uuid_generate_v4(),
    team_id     uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
    title       text not null,
    description text,
    starts_at   timestamptz not null,
    ends_at     timestamptz not null,
    location    text,
    event_type  text not null default 'other'
                check (event_type in ('training','match','meeting','other')),
    -- source_id 指向產生這筆事件的來源（如 training_sessions.id），方便追溯
    source_id   uuid,
    color       text,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    created_by  uuid references public.profiles(id) on delete set null
);
create index if not exists calendar_events_starts_idx on public.calendar_events(starts_at);
create index if not exists calendar_events_team_idx on public.calendar_events(team_id);

drop trigger if exists calendar_events_set_updated_at on public.calendar_events;
create trigger calendar_events_set_updated_at
before update on public.calendar_events
for each row execute function public.trg_set_updated_at();

-- ---------------------------------------------------------------------------
-- personal_events：個人私有行事曆
-- ---------------------------------------------------------------------------
create table if not exists public.personal_events (
    id          uuid primary key default uuid_generate_v4(),
    owner_id    uuid not null references public.profiles(id) on delete cascade,
    title       text not null,
    description text,
    starts_at   timestamptz not null,
    ends_at     timestamptz not null,
    color       text,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);
create index if not exists personal_events_owner_idx on public.personal_events(owner_id);
create index if not exists personal_events_starts_idx on public.personal_events(starts_at);

drop trigger if exists personal_events_set_updated_at on public.personal_events;
create trigger personal_events_set_updated_at
before update on public.personal_events
for each row execute function public.trg_set_updated_at();

-- ---------------------------------------------------------------------------
-- training_sessions：訓練詳情
-- 與 calendar_events 一對一（source_id 從 calendar_events 反查）
-- ---------------------------------------------------------------------------
create table if not exists public.training_sessions (
    id            uuid primary key default uuid_generate_v4(),
    calendar_event_id uuid not null unique references public.calendar_events(id) on delete cascade,
    coach_id      uuid references public.profiles(id) on delete set null,
    topic         text,
    group_tag     text,
    -- 群組批次建立時用同一個 batch_id，方便整批刪除
    batch_id      uuid,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);
create index if not exists training_batch_idx on public.training_sessions(batch_id);

drop trigger if exists training_sessions_set_updated_at on public.training_sessions;
create trigger training_sessions_set_updated_at
before update on public.training_sessions
for each row execute function public.trg_set_updated_at();

-- ---------------------------------------------------------------------------
-- leave_requests：請假
-- ---------------------------------------------------------------------------
create table if not exists public.leave_requests (
    id                  uuid primary key default uuid_generate_v4(),
    player_id           uuid not null references public.profiles(id) on delete cascade,
    start_at            timestamptz not null,
    end_at              timestamptz not null,
    reason_type         text not null default 'personal'
                        check (reason_type in ('sick','personal','official','other')),
    reason_text         text,
    -- 影響的訓練/賽程 calendar_event ids；用 array 儲存，N 通常 ≤ 5 不需要單獨表
    affected_event_ids  uuid[] not null default '{}'::uuid[],
    status              text not null default 'pending'
                        check (status in ('pending','approved','rejected')),
    reviewed_by         uuid references public.profiles(id) on delete set null,
    reviewed_at         timestamptz,
    review_note         text,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);
create index if not exists leave_requests_player_idx on public.leave_requests(player_id);
create index if not exists leave_requests_status_idx on public.leave_requests(status);
create index if not exists leave_requests_start_idx on public.leave_requests(start_at);

drop trigger if exists leave_requests_set_updated_at on public.leave_requests;
create trigger leave_requests_set_updated_at
before update on public.leave_requests
for each row execute function public.trg_set_updated_at();

-- ---------------------------------------------------------------------------
-- attendance_records：訓練出席
-- ---------------------------------------------------------------------------
create table if not exists public.attendance_records (
    id            uuid primary key default uuid_generate_v4(),
    training_id   uuid not null references public.training_sessions(id) on delete cascade,
    player_id     uuid not null references public.profiles(id) on delete cascade,
    status        text not null default 'present'
                  check (status in ('present','absent','on_leave','late')),
    note          text,
    recorded_by   uuid references public.profiles(id) on delete set null,
    recorded_at   timestamptz not null default now(),
    unique (training_id, player_id)
);
create index if not exists attendance_player_idx on public.attendance_records(player_id);

-- ---------------------------------------------------------------------------
-- player_match_records：比賽成績
-- ---------------------------------------------------------------------------
create table if not exists public.player_match_records (
    id           uuid primary key default uuid_generate_v4(),
    player_id    uuid not null references public.profiles(id) on delete cascade,
    event_name   text not null,
    event_date   date not null,
    -- singles / doubles_men / doubles_women / doubles_mixed / team
    category     text not null default 'singles',
    division     text,
    placement    text,            -- 例 "冠軍"、"4 強"
    note         text,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now(),
    created_by   uuid references public.profiles(id) on delete set null
);
create index if not exists match_records_player_idx on public.player_match_records(player_id, event_date desc);

drop trigger if exists match_records_set_updated_at on public.player_match_records;
create trigger match_records_set_updated_at
before update on public.player_match_records
for each row execute function public.trg_set_updated_at();

-- ---------------------------------------------------------------------------
-- player_experiences：經歷
-- ---------------------------------------------------------------------------
create table if not exists public.player_experiences (
    id           uuid primary key default uuid_generate_v4(),
    player_id    uuid not null references public.profiles(id) on delete cascade,
    start_ym     text not null,   -- "2024-09"
    end_ym       text,            -- null 代表至今
    organization text not null,
    role         text,
    note         text,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now(),
    created_by   uuid references public.profiles(id) on delete set null
);
create index if not exists experiences_player_idx on public.player_experiences(player_id);

drop trigger if exists experiences_set_updated_at on public.player_experiences;
create trigger experiences_set_updated_at
before update on public.player_experiences
for each row execute function public.trg_set_updated_at();

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.calendar_events     enable row level security;
alter table public.personal_events     enable row level security;
alter table public.training_sessions   enable row level security;
alter table public.leave_requests      enable row level security;
alter table public.attendance_records  enable row level security;
alter table public.player_match_records enable row level security;
alter table public.player_experiences  enable row level security;

-- calendar_events：所有登入者可讀；管理訓練的角色可寫
drop policy if exists calendar_events_select on public.calendar_events;
create policy calendar_events_select on public.calendar_events
  for select to authenticated using (true);

drop policy if exists calendar_events_write on public.calendar_events;
create policy calendar_events_write on public.calendar_events
  for all to authenticated
  using (public.has_permission(auth.uid(), 'action:training:manage'))
  with check (public.has_permission(auth.uid(), 'action:training:manage'));

-- personal_events：本人讀寫
drop policy if exists personal_events_owner_all on public.personal_events;
create policy personal_events_owner_all on public.personal_events
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- training_sessions：所有登入者可讀；training:manage 寫
drop policy if exists training_sessions_select on public.training_sessions;
create policy training_sessions_select on public.training_sessions
  for select to authenticated using (true);

drop policy if exists training_sessions_write on public.training_sessions;
create policy training_sessions_write on public.training_sessions
  for all to authenticated
  using (public.has_permission(auth.uid(), 'action:training:manage'))
  with check (public.has_permission(auth.uid(), 'action:training:manage'));

-- leave_requests：本人讀自己；具 leaves:approve 權限者可讀全部 + 寫 status；本人寫自己的
drop policy if exists leave_requests_self_select on public.leave_requests;
create policy leave_requests_self_select on public.leave_requests
  for select to authenticated
  using (
    player_id = auth.uid()
    or public.has_permission(auth.uid(), 'action:leaves:approve')
  );

drop policy if exists leave_requests_self_insert on public.leave_requests;
create policy leave_requests_self_insert on public.leave_requests
  for insert to authenticated
  with check (player_id = auth.uid());

-- 球員只能在 pending 狀態下改自己的請假；教練可任意改 status
drop policy if exists leave_requests_self_update on public.leave_requests;
create policy leave_requests_self_update on public.leave_requests
  for update to authenticated
  using (player_id = auth.uid() and status = 'pending')
  with check (player_id = auth.uid() and status = 'pending');

drop policy if exists leave_requests_reviewer_update on public.leave_requests;
create policy leave_requests_reviewer_update on public.leave_requests
  for update to authenticated
  using (public.has_permission(auth.uid(), 'action:leaves:approve'))
  with check (public.has_permission(auth.uid(), 'action:leaves:approve'));

drop policy if exists leave_requests_self_delete on public.leave_requests;
create policy leave_requests_self_delete on public.leave_requests
  for delete to authenticated
  using (player_id = auth.uid() and status = 'pending');

-- attendance_records：所有登入者可讀（看自己的訓練出席）；training:attendance 寫
drop policy if exists attendance_select on public.attendance_records;
create policy attendance_select on public.attendance_records
  for select to authenticated using (true);

drop policy if exists attendance_write on public.attendance_records;
create policy attendance_write on public.attendance_records
  for all to authenticated
  using (public.has_permission(auth.uid(), 'action:training:attendance'))
  with check (public.has_permission(auth.uid(), 'action:training:attendance'));

-- player_match_records / player_experiences：
-- 所有登入者讀；本人或具 players:manage 寫
drop policy if exists match_records_select on public.player_match_records;
create policy match_records_select on public.player_match_records
  for select to authenticated using (true);

drop policy if exists match_records_write on public.player_match_records;
create policy match_records_write on public.player_match_records
  for all to authenticated
  using (
    player_id = auth.uid()
    or public.has_permission(auth.uid(), 'action:players:manage')
  )
  with check (
    player_id = auth.uid()
    or public.has_permission(auth.uid(), 'action:players:manage')
  );

drop policy if exists experiences_select on public.player_experiences;
create policy experiences_select on public.player_experiences
  for select to authenticated using (true);

drop policy if exists experiences_write on public.player_experiences;
create policy experiences_write on public.player_experiences
  for all to authenticated
  using (
    player_id = auth.uid()
    or public.has_permission(auth.uid(), 'action:players:manage')
  )
  with check (
    player_id = auth.uid()
    or public.has_permission(auth.uid(), 'action:players:manage')
  );
