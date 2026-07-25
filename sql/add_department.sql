-- =========================================================
-- Migration: เพิ่มคอลัมน์ department ใน teachers
-- ใช้รันเพิ่มถ้า DB มีอยู่แล้ว (ไม่ต้องรัน schema.sql ใหม่ทั้งหมด)
-- วิธีใช้: Supabase Dashboard -> SQL Editor -> New query -> วางแล้วกด Run
-- =========================================================

ALTER TABLE teachers ADD COLUMN IF NOT EXISTS department text;

-- อัปเดตข้อมูลตัวอย่างเดิม (ถ้ามี)
UPDATE teachers SET department = 'ประถม' WHERE department IS NULL;
