// สร้าง client ตัวเดียว ใช้ร่วมกันทั้ง index.html และ admin.html
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
