const STATUS_META = {
  sent:  {label:"ส่งแล้ว",         cls:"b-sent"},
  review:{label:"รอตรวจ",         cls:"b-review"},
  open:  {label:"ยังไม่ส่ง",       cls:"b-open"},
  soon:  {label:"ใกล้ครบกำหนด",   cls:"b-soon"},
  today: {label:"ครบกำหนดวันนี้", cls:"b-today"},
  late:  {label:"เกินกำหนด",      cls:"b-late"},
};

const THAI_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

let ALL_ROWS = [];

function formatThaiDate(dateStr){
  const d = new Date(dateStr + "T00:00:00");
  const beYear = d.getFullYear() + 543;
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${beYear}`;
}

function daysDiff(dateStr){
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(dateStr + "T00:00:00");
  return Math.round((due - today) / 86400000);
}

// รวม status ที่เก็บจริงใน DB (sent/review/open/late) เข้ากับความใกล้กำหนด
// เพื่อได้ 6 สถานะที่ใช้แสดงผลจริงตามสเปค (soon/today เป็นสถานะที่คำนวณ ไม่ได้เก็บใน DB)
function deriveDisplayStatus(row){
  if(row.status === 'sent') return 'sent';
  if(row.status === 'review') return 'review';
  if(row.status === 'late') return 'late';
  // status === 'open' -> เช็คระยะห่างจาก due_date
  const diff = daysDiff(row.due_date);
  if(diff < 0) return 'late';
  if(diff === 0) return 'today';
  if(diff <= 3) return 'soon';
  return 'open';
}

function initials(name){
  return name.replace("ครู","").trim().slice(0,2);
}

async function loadData(){
  const { data, error } = await sb
    .from('submissions')
    .select(`
      id, status, due_date,
      teacher:teachers ( name, department, subject ),
      task:tasks ( title )
    `);

  if(error){
    console.error(error);
    document.getElementById('tableBody').innerHTML =
      `<tr class="empty-row"><td colspan="4">โหลดข้อมูลไม่สำเร็จ: ${error.message}</td></tr>`;
    return;
  }

  ALL_ROWS = data.map(r => ({
    id: r.id,
    name: r.teacher.name,
    department: r.teacher.department,
    subject: r.teacher.subject,
    task: r.task.title,
    due_date: r.due_date,
    status: r.status,
  }));

  populateGroupFilter();
  render();
}

function populateGroupFilter(){
  const subjects = [...new Set(ALL_ROWS.map(r => r.subject).filter(Boolean))];
  const sel = document.getElementById('groupFilter');
  sel.querySelectorAll('option:not([value="all"])').forEach(o => o.remove());
  subjects.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s; opt.textContent = s;
    sel.appendChild(opt);
  });
}

function render(){
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const statusVal = document.getElementById('statusFilter').value;
  const groupVal = document.getElementById('groupFilter').value;

  const rows = ALL_ROWS.map(r => ({...r, display: deriveDisplayStatus(r)}));

  const deptVal = document.getElementById('deptFilter').value;

  const filtered = rows.filter(row=>{
    const matchesQ = !q || row.name.toLowerCase().includes(q) || row.task.toLowerCase().includes(q);
    const matchesStatus = statusVal === 'all' || row.display === statusVal;
    const matchesGroup = groupVal === 'all' || row.subject === groupVal;
    const matchesDept = deptVal === 'all' || row.department === deptVal;
    return matchesQ && matchesStatus && matchesGroup && matchesDept;
  });

  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';
  if(filtered.length === 0){
    tbody.innerHTML = '<tr class="empty-row"><td colspan="4">ไม่พบรายการที่ตรงกับการค้นหา</td></tr>';
  } else {
    filtered.forEach(row=>{
      const meta = STATUS_META[row.display];
      const diff = daysDiff(row.due_date);
      let daysLabel = '';
      if(row.status === 'sent'){ daysLabel = 'ส่งแล้ว'; }
      else if(diff === 0){ daysLabel = 'วันนี้'; }
      else if(diff > 0){ daysLabel = `อีก ${diff} วัน`; }
      else { daysLabel = `เลย ${Math.abs(diff)} วัน`; }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="teacher-cell">
            <div class="avatar">${initials(row.name)}</div>
            <div class="teacher-meta">
              <div class="name">${row.name}</div>
              <div class="subject">${[row.department, row.subject].filter(Boolean).join(' · ')}</div>
            </div>
          </div>
        </td>
        <td class="task-name">${row.task}</td>
        <td class="due">${formatThaiDate(row.due_date)}<span class="days">${daysLabel}</span></td>
        <td><span class="badge ${meta.cls}"><span class="bdot"></span>${meta.label}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  document.getElementById('resultCount').textContent = `${filtered.length} รายการ`;

  const total = rows.length || 1;
  const sent = rows.filter(r=>r.display==='sent').length;
  const review = rows.filter(r=>r.display==='review').length;
  const open = rows.filter(r=>['open','soon','today'].includes(r.display)).length;
  const late = rows.filter(r=>r.display==='late').length;
  const pct = Math.round((sent/total)*100);

  document.getElementById('cSent').textContent = sent;
  document.getElementById('cReview').textContent = review;
  document.getElementById('cOpen').textContent = open;
  document.getElementById('cLate').textContent = late;
  document.getElementById('sentOfTotal').textContent = `${sent} / ${rows.length} งาน`;
  document.getElementById('ringNum').textContent = pct + '%';

  const circumference = 213.6;
  const offset = circumference - (pct/100)*circumference;
  requestAnimationFrame(()=>{
    document.getElementById('ringFg').style.strokeDashoffset = offset;
  });
}

document.getElementById('searchInput').addEventListener('input', render);
document.getElementById('statusFilter').addEventListener('change', render);
document.getElementById('groupFilter').addEventListener('change', render);
document.getElementById('deptFilter').addEventListener('change', render);

loadData();

// รีเฟรชข้อมูลอัตโนมัติทุก 30 วินาที (แบบง่าย ไม่ใช้ realtime subscription)
setInterval(loadData, 30000);
