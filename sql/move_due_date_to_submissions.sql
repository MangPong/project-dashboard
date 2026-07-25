-- =========================================================
-- Migration: ย้าย due_date จากตาราง tasks ไปที่ตาราง submissions
-- สำหรับ DB ที่มีอยู่แล้ว
-- วิธีใช้: Supabase Dashboard -> SQL Editor -> New query -> วางแล้วกด Run
-- =========================================================

-- 1. เพิ่มคอลัมน์ due_date ใน submissions
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS due_date date NOT NULL DEFAULT current_date;

-- 2. คัดลอก due_date จาก tasks มาใส่ใน submissions (ถ้าคอลัมน์ tasks.due_date มีอยู่)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'due_date'
  ) THEN
    UPDATE submissions s
    SET due_date = t.due_date
    FROM tasks t
    WHERE s.task_id = t.id AND t.due_date IS NOT NULL;
    
    -- 3. ลบคอลัมน์ due_date ออกจาก tasks
    ALTER TABLE tasks DROP COLUMN due_date;
  END IF;
END $$;

-- 4. สร้าง index ช่วยค้นหาตาม due_date
CREATE INDEX IF NOT EXISTS idx_submissions_due_date ON submissions(due_date);
