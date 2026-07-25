-- =========================================================
-- ระบบติดตามการส่งงาน กลุ่มบริหารงานวิชาการ
-- Schema + Row Level Security สำหรับ Supabase (Postgres)
-- วิธีใช้: คัดลอกทั้งไฟล์ไปรันใน Supabase Dashboard
--   -> SQL Editor -> New query -> วางแล้วกด Run
-- =========================================================

-- เปิด extension สำหรับสุ่ม uuid (Supabase มักเปิดให้แล้ว แต่กันเหนียว)
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- ตาราง teachers : รายชื่อคุณครู
-- ---------------------------------------------------------
create table if not exists teachers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  subject       text,
  subject_group text,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------
-- ตาราง tasks : งาน/ภาระงานที่ต้องส่ง (แม่แบบงาน ไม่ผูกกับครูคนใดคนหนึ่ง)
-- ---------------------------------------------------------
create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,           -- เช่น "แผนการสอนหน่วยที่ 3"
  description text,
  due_date    date not null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------
-- ตาราง submissions : สถานะการส่งงานของครูแต่ละคน ต่องานแต่ละชิ้น
-- ---------------------------------------------------------
create table if not exists submissions (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   uuid not null references teachers(id) on delete cascade,
  task_id      uuid not null references tasks(id) on delete cascade,
  status       text not null default 'open'
               check (status in ('sent', 'review', 'open', 'late')),
  -- sent   = ส่งแล้ว
  -- review = รอตรวจ
  -- open   = ยังไม่ส่ง (สถานะ "ใกล้ครบกำหนด" / "ครบกำหนดวันนี้" คำนวณฝั่ง frontend จาก due_date)
  -- late   = เกินกำหนด
  submitted_at timestamptz,
  updated_at   timestamptz not null default now(),
  unique (teacher_id, task_id)
);

-- index ช่วยให้ query เร็วขึ้นเวลา filter/join บ่อยๆ
create index if not exists idx_submissions_teacher on submissions(teacher_id);
create index if not exists idx_submissions_task on submissions(task_id);
create index if not exists idx_submissions_status on submissions(status);

-- trigger อัปเดต updated_at อัตโนมัติทุกครั้งที่แก้ไขแถว
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_submissions_updated_at on submissions;
create trigger trg_submissions_updated_at
  before update on submissions
  for each row execute function set_updated_at();

-- =========================================================
-- ROW LEVEL SECURITY
-- แนวคิด: ระบบมี admin แค่ 1 คน (สร้าง user ผ่าน Supabase Auth
-- โดยตรง ไม่เปิด public signup) ดังนั้นแค่เช็คว่า "login แล้ว
-- หรือยัง" ก็เพียงพอสำหรับแยกสิทธิ์ อ่านอย่างเดียว vs แก้ไขได้
-- =========================================================

alter table teachers    enable row level security;
alter table tasks       enable row level security;
alter table submissions enable row level security;

-- ---- อ่านได้ทุกคน (ครูเข้ามาดูสถานะตัวเองผ่านหน้า dashboard สาธารณะ) ----
create policy "public read teachers"
  on teachers for select
  using (true);

create policy "public read tasks"
  on tasks for select
  using (true);

create policy "public read submissions"
  on submissions for select
  using (true);

-- ---- เขียน/แก้ไข/ลบได้เฉพาะผู้ที่ login แล้ว (admin คนเดียว) ----
create policy "admin write teachers"
  on teachers for insert
  to authenticated
  with check (true);

create policy "admin update teachers"
  on teachers for update
  to authenticated
  using (true) with check (true);

create policy "admin delete teachers"
  on teachers for delete
  to authenticated
  using (true);

create policy "admin write tasks"
  on tasks for insert
  to authenticated
  with check (true);

create policy "admin update tasks"
  on tasks for update
  to authenticated
  using (true) with check (true);

create policy "admin delete tasks"
  on tasks for delete
  to authenticated
  using (true);

create policy "admin write submissions"
  on submissions for insert
  to authenticated
  with check (true);

create policy "admin update submissions"
  on submissions for update
  to authenticated
  using (true) with check (true);

create policy "admin delete submissions"
  on submissions for delete
  to authenticated
  using (true);

-- =========================================================
-- ข้อมูลตัวอย่าง (ลบทิ้งได้ถ้าไม่ต้องการ)
-- =========================================================
insert into teachers (name, subject, subject_group) values
  ('ครูสมชาย ใจดี', 'คณิตศาสตร์', 'คณิตศาสตร์'),
  ('ครูสุนีย์ พรหมมา', 'ภาษาไทย', 'ภาษาไทย'),
  ('ครูวิชัย ศรีสุข', 'วิทยาศาสตร์', 'วิทยาศาสตร์')
on conflict do nothing;

insert into tasks (title, due_date) values
  ('แผนการสอนหน่วยที่ 3', current_date + 4),
  ('รายงานผลการปฏิบัติงาน (SAR)', current_date),
  ('คะแนนเก็บกลางภาค', current_date - 4)
on conflict do nothing;

-- หมายเหตุ: การสร้าง admin user ให้ทำผ่าน
-- Supabase Dashboard -> Authentication -> Users -> Add user
-- (ปิด "Enable email signups" ในหน้า Auth settings เพื่อไม่ให้คนอื่นสมัครเองได้)
