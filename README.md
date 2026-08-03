# ระบบติดตามการส่งงาน — กลุ่มบริหารงานวิชาการ

Dashboard สาธารณะ + แผงควบคุม Admin สำหรับติดตามสถานะการส่งงานของครู  
Frontend host บน **GitHub Pages** (static) ต่อกับฐานข้อมูล **Supabase** (Postgres + Auth)

---

## โครงสร้างไฟล์

```
project-dashboard/
├── index.html              หน้า dashboard สาธารณะ (อ่านอย่างเดียว)
├── admin.html              หน้า login + จัดการสถานะงาน (ต้อง auth)
├── css/
│   └── style.css           สไตล์ชีตรวม
├── js/
│   ├── config.js           ใส่ Supabase URL + anon key ตรงนี้
│   ├── supabase-client.js  สร้าง client ใช้ร่วมกัน
│   ├── dashboard.js        โลจิกหน้า dashboard
│   └── admin.js            โลจิกหน้า admin (login/CRUD)
├── sql/
│   └── schema.sql          SQL schema + RLS policy รันบน Supabase
└── README.md               เอกสารนี้
```

---

## ขั้นตอนติดตั้ง

### 1. สร้างโปรเจกต์ Supabase
- ไปที่ https://supabase.com → **New project**
- รอจน provision เสร็จ

### 2. รัน schema
- เปิด **SQL Editor** ในโปรเจกต์ → **New query**
- คัดลอกเนื้อหาทั้งหมดจาก `sql/schema.sql` → **Run**

### 3. สร้างบัญชี Admin (คนเดียว)
- ไปที่ **Authentication → Users → Add user**
- ใส่อีเมล/รหัสผ่านของ admin
- ไปที่ **Authentication → Settings** → ปิด "Enable email signups"  
  (กันไม่ให้คนอื่นสมัครเองได้ ระบบนี้มี admin แค่ user เดียว)

### 4. ตั้งค่า Site URL
- **Authentication → URL Configuration**
- ใส่ Site URL เป็น `https://<username>.github.io/<repo-name>/`

### 5. เชื่อมโค้ดกับ Supabase
- เปิด `js/config.js`
- แทนที่ `SUPABASE_URL` และ `SUPABASE_ANON_KEY` ด้วยค่าจาก  
  **Project Settings → API**

### 6. Deploy ขึ้น GitHub Pages
```bash
git init
git add .
git commit -m "init dashboard"
git branch -M main
git remote add origin https://github.com/<username>/<repo-name>.git
git push -u origin main
```
แล้วไปที่ repo → **Settings → Pages** → Source: `main` branch, root folder → **Save**

เว็บจะขึ้นที่ `https://<username>.github.io/<repo-name>/`

---

## การใช้งาน

### หน้า Dashboard (`index.html`)
- เปิดดูได้ทุกคนโดยไม่ต้อง login
- แสดงสถานะการส่งงานของครูทุกคน
- ค้นหาด้วยชื่อครู/ชื่องาน, กรองตามสถานะ/กลุ่มสาระ
- ข้อมูลอัปเดตอัตโนมัติทุก 30 วินาที

### หน้า Admin (`admin.html`)
- เข้าระบบด้วยอีเมล/รหัสผ่าน ที่สร้างไว้ในขั้นตอนที่ 3
- เปลี่ยนสถานะงานของครูแต่ละคนได้ (ยังไม่ส่ง / รอตรวจ / ส่งแล้ว / เกินกำหนด)
- กำหนดวันส่งงาน (`due_date`) รายบุคคลได้
- จัดการรายชื่อครู (เพิ่ม / แก้ไข / ลบ)
- **ดาวน์โหลดแบบฟอร์ม Excel**: กดปุ่ม "แม่แบบ Excel" เพื่อโหลดไฟล์ตัวอย่าง (.xlsx) สำหรับนำเข้าข้อมูล
- **นำเข้าข้อมูลจาก Excel**: กดปุ่ม "นำเข้า Excel" เพื่ออัปโหลดไฟล์ (.xlsx, .xls, .csv) เข้าสู่ฐานข้อมูล Supabase อัตโนมัติ (รองรับทั้งนำเข้ารายชื่อครู และการส่งงาน)

### สถานะที่ใช้

| สถานะ | เก็บใน DB | คำอธิบาย |
|---|---|---|
| ส่งแล้ว | `sent` | งานเสร็จสมบูรณ์ |
| รอตรวจ | `review` | รอดำเนินการตรวจสอบ |
| ยังไม่ส่ง | `open` | ยังไม่ถึงกำหนด |
| ใกล้ครบกำหนด | `open` (คำนวณ) | เหลือ 1–3 วัน |
| ครบกำหนดวันนี้ | `open` (คำนวณ) | วันนี้เป็นวันสุดท้าย |
| เกินกำหนด | `late` | ต้องติดตามด่วน |

> **หมายเหตุ**: สถานะ "ใกล้ครบกำหนด" และ "ครบกำหนดวันนี้" ไม่ได้เก็บใน DB แต่คำนวณจาก `due_date` ฝั่ง frontend

---

## หมายเหตุด้านความปลอดภัย

- `anon key` ฝังใน frontend ได้ตามปกติ (ออกแบบมาให้ public)
- ความปลอดภัยจริงอยู่ที่ **RLS policy**: อ่านได้ทุกคน, เขียน/แก้/ลบได้เฉพาะผู้ที่ login แล้ว
- **ห้ามใช้ `service_role key`** ในโค้ดฝั่ง frontend เด็ดขาด
- เพราะปิด public signup ไว้ ผู้ใช้ที่ login สำเร็จได้จึงมีแค่ admin ที่สร้างไว้คนเดียว

---

## แผนขยายในอนาคต (ถ้าต้องการ)
- เพิ่มฟอร์มสำหรับเพิ่ม/แก้ไข รายชื่อครู และงานใหม่ ในหน้า admin
- ใช้ Supabase Realtime subscription แทนการ poll ทุก 30 วินาที
- เพิ่มการแจ้งเตือนอีเมลอัตโนมัติเมื่อใกล้ครบกำหนด (Supabase Edge Functions + cron)
