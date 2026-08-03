// =====================================================================
// Admin Panel — ระบบติดตามการส่งงาน
// Features: Auth, Tab switching, Submission CRUD, Teacher CRUD,
//           Cascading department→subject dropdown, inline editing
// =====================================================================

// ===================== Constants =====================
const STATUS_OPTIONS = [
  {value:"open",   label:"ยังไม่ส่ง"},
  {value:"review", label:"รอตรวจ"},
  {value:"sent",   label:"ส่งแล้ว"},
  {value:"late",   label:"เกินกำหนด"},
];

const DEPT_WITH_SUBJECTS = ["ประถม","มัธยม"];

// ===================== State =====================
let ALL_ROWS = [];
let ALL_TASKS = [];

// ===================== Auth =====================
async function checkSession(){
  const { data: { session } } = await sb.auth.getSession();
  if(session) showAdminPanel(session);
  else showLogin();
}

function showLogin(){
  document.getElementById('loginPanel').classList.remove('panel-hidden');
  document.getElementById('adminPanel').classList.add('panel-hidden');
}

function showAdminPanel(session){
  document.getElementById('loginPanel').classList.add('panel-hidden');
  document.getElementById('adminPanel').classList.remove('panel-hidden');
  document.getElementById('adminEmail').textContent = session.user.email;
  loadRows();
  loadTeachers();
}

document.getElementById('loginForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errBox = document.getElementById('loginError');
  errBox.style.display = 'none';

  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if(error){
    errBox.textContent = "เข้าสู่ระบบไม่สำเร็จ: อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    errBox.style.display = 'block';
    return;
  }
  showAdminPanel(data.session);
});

document.getElementById('logoutBtn').addEventListener('click', async ()=>{
  await sb.auth.signOut();
  showLogin();
});

// ===================== Tab Switching =====================
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');
  });
});

// ===================== Submissions Tab =====================
async function loadRows(){
  const [subRes, taskRes] = await Promise.all([
    sb.from('submissions')
      .select(`
        id, status, due_date,
        teacher:teachers ( id, name, subject, department ),
        task:tasks ( id, title )
      `)
      .order('due_date', { ascending: true }),
    sb.from('tasks')
      .select('id, title')
      .order('title', { ascending: true })
  ]);

  if(subRes.error){
    console.error(subRes.error);
    document.getElementById('adminTableBody').innerHTML =
      `<tr class="empty-row"><td colspan="5">โหลดข้อมูลไม่สำเร็จ: ${subRes.error.message}</td></tr>`;
    return;
  }

  ALL_ROWS = subRes.data || [];
  ALL_TASKS = taskRes.data || [];
  renderSubmissionTable();
}

function renderSubmissionTable(){
  const tbody = document.getElementById('adminTableBody');
  tbody.innerHTML = '';

  if(ALL_ROWS.length === 0){
    tbody.innerHTML = '<tr class="empty-row"><td colspan="5">ยังไม่มีข้อมูล</td></tr>';
    return;
  }

  ALL_ROWS.forEach(row => {
    const tr = document.createElement('tr');

    // Task dropdown
    const taskOpts = ALL_TASKS.map(t =>
      `<option value="${t.id}" ${t.id === row.task.id ? 'selected' : ''}>${t.title}</option>`
    ).join('');

    // Status dropdown
    const statusOpts = STATUS_OPTIONS.map(o =>
      `<option value="${o.value}" ${o.value === row.status ? 'selected' : ''}>${o.label}</option>`
    ).join('');

    // Teacher info
    const subjectLabel = row.teacher.subject || '';
    const deptLabel = row.teacher.department || '';
    const metaLine = [subjectLabel, deptLabel].filter(Boolean).join(' · ');

    tr.innerHTML = `
      <td>
        <span style="font-weight:600">${row.teacher.name}</span>
        ${metaLine ? `<br><span style="color:var(--muted);font-size:12px">${metaLine}</span>` : ''}
      </td>
      <td>
        <select class="task-select" data-sub-id="${row.id}">
          ${taskOpts}
        </select>
      </td>
      <td>
        <input type="date" class="date-input" data-sub-id="${row.id}" value="${row.due_date}">
      </td>
      <td>
        <select class="status-select" data-id="${row.id}">
          ${statusOpts}
        </select>
      </td>
      <td>
        <button class="btn btn-secondary btn-sm btn-danger-hover" data-delete="${row.id}">ลบ</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Bind events
  tbody.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', e => updateStatus(e.target.dataset.id, e.target.value));
  });
  tbody.querySelectorAll('.task-select').forEach(sel => {
    sel.addEventListener('change', e => updateTask(e.target.dataset.subId, e.target.value));
  });
  tbody.querySelectorAll('.date-input').forEach(inp => {
    inp.addEventListener('change', e => updateDueDate(e.target.dataset.subId, e.target.value));
  });
  tbody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', e => deleteSubmission(e.target.dataset.delete));
  });
}

async function updateStatus(id, newStatus){
  const payload = { status: newStatus };
  if(newStatus === 'sent') payload.submitted_at = new Date().toISOString();
  const { error } = await sb.from('submissions').update(payload).eq('id', id);
  if(error) alert('บันทึกไม่สำเร็จ: ' + error.message);
}

async function updateTask(submissionId, newTaskId){
  const { error } = await sb.from('submissions').update({ task_id: newTaskId }).eq('id', submissionId);
  if(error){ alert('เปลี่ยนงานไม่สำเร็จ: ' + error.message); return; }
  loadRows(); // reload to reflect new task
}

async function updateDueDate(submissionId, newDate){
  if(!newDate) return;
  const { error } = await sb.from('submissions').update({ due_date: newDate }).eq('id', submissionId);
  if(error){ alert('แก้ไขวันกำหนดส่งไม่สำเร็จ: ' + error.message); return; }
}

async function deleteSubmission(id){
  if(!confirm('ยืนยันลบรายการนี้?')) return;
  const { error } = await sb.from('submissions').delete().eq('id', id);
  if(error){ alert('ลบไม่สำเร็จ: ' + error.message); return; }
  loadRows();
}

// ===================== Teachers Tab =====================
async function loadTeachers(){
  const { data, error } = await sb
    .from('teachers')
    .select('id, name, department, subject, subject_group')
    .order('name', { ascending: true });

  if(error){
    console.error(error);
    document.getElementById('teacherTableBody').innerHTML =
      `<tr class="empty-row"><td colspan="4">โหลดข้อมูลไม่สำเร็จ: ${error.message}</td></tr>`;
    return;
  }

  renderTeacherTable(data || []);
}

function renderTeacherTable(teachers){
  const tbody = document.getElementById('teacherTableBody');
  tbody.innerHTML = '';

  if(teachers.length === 0){
    tbody.innerHTML = '<tr class="empty-row"><td colspan="4">ยังไม่มีข้อมูลครู</td></tr>';
    return;
  }

  teachers.forEach(t => {
    const tr = document.createElement('tr');
    // Escape for data attribute
    const safeData = encodeURIComponent(JSON.stringify({
      id: t.id, name: t.name, department: t.department, subject: t.subject
    }));
    tr.innerHTML = `
      <td style="font-weight:600">${t.name}</td>
      <td>${t.department || '—'}</td>
      <td>${t.subject || '—'}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-secondary btn-sm" data-edit-teacher="${safeData}">แก้ไข</button>
        <button class="btn btn-secondary btn-sm btn-danger-hover" data-delete-teacher="${t.id}" style="margin-left:4px">ลบ</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-edit-teacher]').forEach(btn => {
    btn.addEventListener('click', e => {
      const data = JSON.parse(decodeURIComponent(e.target.dataset.editTeacher));
      openTeacherModal(data);
    });
  });
  tbody.querySelectorAll('[data-delete-teacher]').forEach(btn => {
    btn.addEventListener('click', e => deleteTeacher(e.target.dataset.deleteTeacher));
  });
}

async function deleteTeacher(id){
  if(!confirm('ยืนยันลบครูคนนี้?\n(รายการส่งงานที่เกี่ยวข้องจะถูกลบด้วย เนื่องจาก ON DELETE CASCADE)')) return;
  const { error } = await sb.from('teachers').delete().eq('id', id);
  if(error){ alert('ลบไม่สำเร็จ: ' + error.message); return; }
  loadTeachers();
  loadRows();
}

// ===================== Teacher Modal =====================
function openTeacherModal(editData = null){
  const modal = document.getElementById('teacherModal');
  const title = document.getElementById('modalTitle');
  const form = document.getElementById('teacherForm');

  form.reset();
  document.getElementById('teacherId').value = '';
  document.getElementById('subjectField').style.display = 'none';

  if(editData){
    title.textContent = 'แก้ไขข้อมูลครู';
    document.getElementById('teacherId').value = editData.id;
    document.getElementById('teacherName').value = editData.name || '';
    document.getElementById('teacherDept').value = editData.department || '';
    onDepartmentChange(); // show/hide subject dropdown
    if(editData.subject){
      document.getElementById('teacherSubject').value = editData.subject;
    }
  } else {
    title.textContent = 'เพิ่มครูใหม่';
  }

  modal.style.display = 'flex';
  setTimeout(() => document.getElementById('teacherName').focus(), 120);
}

function closeTeacherModal(){
  document.getElementById('teacherModal').style.display = 'none';
}

function onDepartmentChange(){
  const dept = document.getElementById('teacherDept').value;
  const subjectField = document.getElementById('subjectField');
  if(DEPT_WITH_SUBJECTS.includes(dept)){
    subjectField.style.display = '';
  } else {
    subjectField.style.display = 'none';
    document.getElementById('teacherSubject').value = '';
  }
}

document.getElementById('teacherDept').addEventListener('change', onDepartmentChange);
document.getElementById('cancelModal').addEventListener('click', closeTeacherModal);

// Close modal on overlay click
document.getElementById('teacherModal').addEventListener('click', (e) => {
  if(e.target === e.currentTarget) closeTeacherModal();
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape' && document.getElementById('teacherModal').style.display === 'flex'){
    closeTeacherModal();
  }
});

document.getElementById('teacherForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('teacherId').value;
  const name = document.getElementById('teacherName').value.trim();
  const department = document.getElementById('teacherDept').value;
  const subject = document.getElementById('teacherSubject').value;

  if(!name){
    alert('กรุณาใส่ชื่อครู');
    return;
  }
  if(!department){
    alert('กรุณาเลือกแผนก');
    return;
  }

  const payload = {
    name,
    department: department || null,
    subject: subject || null,
    subject_group: department || null,
  };

  let error;
  if(id){
    ({ error } = await sb.from('teachers').update(payload).eq('id', id));
  } else {
    // ครูใหม่: insert แล้วขอ id กลับมา เพื่อสร้าง submission เริ่มต้นให้ 1 แถว
    const { data: newTeacher, error: insertError } = await sb
      .from('teachers')
      .insert(payload)
      .select('id')
      .single();

    error = insertError;

    if(!error && newTeacher){
      // ครูใหม่ยังไม่มี submission เลย -> ต้องสร้างให้อย่างน้อย 1 แถว
      // ไม่งั้นครูจะไม่โผล่ในแท็บ "รายการส่งงานทั้งหมด" (ตารางนั้นดึงจาก submissions เป็นหลัก)
      // สร้างแค่ 1 แถวโดยใช้ task แรกในระบบเป็นค่าเริ่มต้น แอดมินไปเปลี่ยน task ที่ถูกต้อง
      // ผ่าน dropdown ในตารางได้ทีหลัง (ไม่สร้างซ้ำครบทุก task)
      if(ALL_TASKS.length > 0){
        const defaultTask = ALL_TASKS[0];
        const { error: subError } = await sb.from('submissions').insert({
          teacher_id: newTeacher.id,
          task_id: defaultTask.id,
          status: 'open',
        });
        if(subError){
          console.error(subError);
          alert('เพิ่มครูสำเร็จ แต่สร้างรายการส่งงานให้ไม่สำเร็จ: ' + subError.message);
        }
      }
    }
  }

  if(error){
    alert('บันทึกไม่สำเร็จ: ' + error.message);
    return;
  }

  closeTeacherModal();
  loadTeachers();
  loadRows(); // refresh submissions in case name/dept changed
});

// =====================================================
// Excel Templates & Import Functions (SheetJS)
// =====================================================
let currentImportMode = 'teachers'; // 'teachers' or 'submissions'
let selectedImportFile = null;

function downloadTeacherTemplate() {
  const data = [
    { "ชื่อ-สกุล": "ครูสมชาย ใจดี", "แผนก": "ประถม", "กลุ่มสาระ/วิชา": "คณิตศาสตร์" },
    { "ชื่อ-สกุล": "ครูสุนีย์ พรหมมา", "แผนก": "มัธยม", "กลุ่มสาระ/วิชา": "ภาษาไทย" },
    { "ชื่อ-สกุล": "ครูวิชัย ศรีสุข", "แผนก": "ประถม", "กลุ่มสาระ/วิชา": "วิทยาศาสตร์" },
    { "ชื่อ-สกุล": "ครูอารีย์ บุญมี", "แผนก": "ปฐมวัย", "กลุ่มสาระ/วิชา": "" }
  ];
  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 24 }, // ชื่อ-สกุล
    { wch: 14 }, // แผนก
    { wch: 22 }  // กลุ่มสาระ/วิชา
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "รายชื่อครู");
  XLSX.writeFile(workbook, "แบบฟอร์มนำเข้า_รายชื่อครู.xlsx");
}

function downloadSubmissionTemplate() {
  const data = [
    { "ชื่อครู": "ครูสมชาย ใจดี", "งานที่ต้องส่ง": "แผนการสอนหน่วยที่ 3", "กำหนดส่ง (YYYY-MM-DD)": "2026-08-15", "สถานะ": "ยังไม่ส่ง" },
    { "ชื่อครู": "ครูสุนีย์ พรหมมา", "งานที่ต้องส่ง": "รายงานผลการปฏิบัติงาน (SAR)", "กำหนดส่ง (YYYY-MM-DD)": "2026-08-20", "สถานะ": "รอตรวจ" },
    { "ชื่อครู": "ครูวิชัย ศรีสุข", "งานที่ต้องส่ง": "คะแนนเก็บกลางภาค", "กำหนดส่ง (YYYY-MM-DD)": "2026-08-10", "สถานะ": "ส่งแล้ว" }
  ];
  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 24 }, // ชื่อครู
    { wch: 30 }, // งานที่ต้องส่ง
    { wch: 22 }, // กำหนดส่ง
    { wch: 14 }  // สถานะ
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "รายการส่งงาน");
  XLSX.writeFile(workbook, "แบบฟอร์มนำเข้า_การส่งงาน.xlsx");
}

function openImportModal(mode) {
  currentImportMode = mode;
  selectedImportFile = null;
  
  const modal = document.getElementById('importModal');
  const title = document.getElementById('importModalTitle');
  const desc = document.getElementById('importModalDesc');
  const dropzoneText = document.getElementById('dropzoneText');
  const resultArea = document.getElementById('importResultArea');
  const progress = document.getElementById('importProgress');
  const fileInput = document.getElementById('excelFileInput');
  const processBtn = document.getElementById('processImportBtn');

  fileInput.value = '';
  progress.style.display = 'none';
  resultArea.style.display = 'none';
  resultArea.innerHTML = '';
  processBtn.disabled = true;

  if (mode === 'teachers') {
    title.textContent = 'นำเข้ารายชื่อครูจาก Excel';
    desc.textContent = 'เลือกไฟล์ Excel (.xlsx, .csv) ที่มีคอลัมน์: ชื่อ-สกุล, แผนก, กลุ่มสาระ/วิชา';
  } else {
    title.textContent = 'นำเข้าข้อมูลการส่งงานจาก Excel';
    desc.textContent = 'เลือกไฟล์ Excel (.xlsx, .csv) ที่มีคอลัมน์: ชื่อครู, งานที่ต้องส่ง, กำหนดส่ง (YYYY-MM-DD), สถานะ';
  }

  dropzoneText.textContent = 'คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่';
  modal.style.display = 'flex';
}

function closeImportModal() {
  document.getElementById('importModal').style.display = 'none';
}

// Drag & Drop
const dropzone = document.getElementById('dropzone');
const excelFileInput = document.getElementById('excelFileInput');

dropzone.addEventListener('click', () => excelFileInput.click());
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    handleFileSelected(e.dataTransfer.files[0]);
  }
});

excelFileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files.length > 0) {
    handleFileSelected(e.target.files[0]);
  }
});

function handleFileSelected(file) {
  selectedImportFile = file;
  document.getElementById('dropzoneText').textContent = `เลือกไฟล์แล้ว: ${file.name}`;
  document.getElementById('processImportBtn').disabled = false;
}

document.getElementById('closeImportModalBtn').addEventListener('click', closeImportModal);
document.getElementById('importModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeImportModal();
});

document.getElementById('processImportBtn').addEventListener('click', async () => {
  if (!selectedImportFile) return;

  const processBtn = document.getElementById('processImportBtn');
  const progress = document.getElementById('importProgress');
  const progressBar = document.getElementById('importProgressBar');
  const progressText = document.getElementById('importProgressText');
  const resultArea = document.getElementById('importResultArea');

  processBtn.disabled = true;
  progress.style.display = 'block';
  progressBar.style.width = '10%';
  progressText.textContent = 'กำลังอ่านไฟล์ Excel...';
  resultArea.style.display = 'block';
  resultArea.innerHTML = '<div class="log-info">เริ่มประมวลผลไฟล์...</div>';

  try {
    const data = await selectedImportFile.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows || rows.length === 0) {
      resultArea.innerHTML += '<div class="log-error">ไม่พบข้อมูลในไฟล์ Excel</div>';
      return;
    }

    progressBar.style.width = '30%';
    progressText.textContent = `พบข้อมูล ${rows.length} รายการ กำลังนำเข้าฐานข้อมูล...`;

    if (currentImportMode === 'teachers') {
      await processTeacherImport(rows, resultArea, progressBar);
    } else {
      await processSubmissionImport(rows, resultArea, progressBar);
    }

    progressBar.style.width = '100%';
    progressText.textContent = 'นำเข้าข้อมูลเสร็จสิ้น!';
    loadRows();
    loadTeachers();
  } catch (err) {
    console.error(err);
    resultArea.innerHTML += `<div class="log-error">เกิดข้อผิดพลาดในการอ่านไฟล์: ${err.message}</div>`;
  }
});

async function processTeacherImport(rows, logArea, progressBar) {
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const nameKey = Object.keys(row).find(k => k.includes('ชื่อ'));
    const deptKey = Object.keys(row).find(k => k.includes('แผนก'));
    const subjectKey = Object.keys(row).find(k => k.includes('สาระ') || k.includes('วิชา'));

    const name = nameKey ? String(row[nameKey]).trim() : '';
    const department = deptKey ? String(row[deptKey]).trim() : '';
    const subject = subjectKey ? String(row[subjectKey]).trim() : '';

    if (!name) {
      logArea.innerHTML += `<div class="log-error">แถวที่ ${i + 2}: ข้าม - ไม่ระบุชื่อครู</div>`;
      failCount++;
      continue;
    }

    const payload = {
      name,
      department: department || null,
      subject: subject || null,
      subject_group: department || null
    };

    const { data: existing } = await sb.from('teachers').select('id').eq('name', name).maybeSingle();

    let err;
    let teacherId;
    if (existing) {
      teacherId = existing.id;
      const { error } = await sb.from('teachers').update(payload).eq('id', teacherId);
      err = error;
    } else {
      const { data: inserted, error } = await sb.from('teachers').insert(payload).select().single();
      err = error;
      if (inserted) teacherId = inserted.id;
    }

    if (err) {
      logArea.innerHTML += `<div class="log-error">แถวที่ ${i + 2} (${name}): บันทึกไม่สำเร็จ - ${err.message}</div>`;
      failCount++;
    } else {
      if (teacherId && ALL_TASKS.length > 0) {
        const { data: sub } = await sb.from('submissions').select('id').eq('teacher_id', teacherId).limit(1);
        if (!sub || sub.length === 0) {
          await sb.from('submissions').insert({
            teacher_id: teacherId,
            task_id: ALL_TASKS[0].id,
            status: 'open'
          });
        }
      }
      successCount++;
    }

    const pct = Math.round(30 + ((i + 1) / rows.length) * 65);
    progressBar.style.width = pct + '%';
  }

  logArea.innerHTML += `<div class="log-success"><b>สรุป:</b> นำเข้าสำเร็จ ${successCount} รายการ, ล้มเหลว/ข้าม ${failCount} รายการ</div>`;
}

async function processSubmissionImport(rows, logArea, progressBar) {
  let successCount = 0;
  let failCount = 0;

  const { data: currentTeachers } = await sb.from('teachers').select('id, name');
  const { data: currentTasks } = await sb.from('tasks').select('id, title');

  const teacherMap = new Map((currentTeachers || []).map(t => [t.name.trim(), t.id]));
  const taskMap = new Map((currentTasks || []).map(t => [t.title.trim(), t.id]));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const teacherKey = Object.keys(row).find(k => k.includes('ครู') || k.includes('ชื่อ'));
    const taskKey = Object.keys(row).find(k => k.includes('งาน'));
    const dueKey = Object.keys(row).find(k => k.includes('กำหนด') || k.includes('วัน'));
    const statusKey = Object.keys(row).find(k => k.includes('สถานะ'));

    const teacherName = teacherKey ? String(row[teacherKey]).trim() : '';
    const taskTitle = taskKey ? String(row[taskKey]).trim() : '';
    let rawDue = dueKey ? row[dueKey] : '';
    const rawStatus = statusKey ? String(row[statusKey]).trim() : '';

    if (!teacherName || !taskTitle) {
      logArea.innerHTML += `<div class="log-error">แถวที่ ${i + 2}: ข้าม - ต้องมีทั้งชื่อครูและชื่องาน</div>`;
      failCount++;
      continue;
    }

    // Parse Due Date
    let dueDateStr = '';
    if (rawDue instanceof Date) {
      dueDateStr = rawDue.toISOString().split('T')[0];
    } else if (typeof rawDue === 'number') {
      const dateObj = new Date(Math.round((rawDue - 25569) * 86400 * 1000));
      dueDateStr = dateObj.toISOString().split('T')[0];
    } else if (rawDue) {
      dueDateStr = String(rawDue).trim();
    }
    if (!dueDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dueDateStr)) {
      dueDateStr = new Date().toISOString().split('T')[0];
    }

    // Map Status
    let status = 'open';
    if (rawStatus.includes('ส่งแล้ว') || rawStatus === 'sent') status = 'sent';
    else if (rawStatus.includes('รอตรวจ') || rawStatus === 'review') status = 'review';
    else if (rawStatus.includes('เกินกำหนด') || rawStatus === 'late') status = 'late';

    // Get or Create Teacher
    let teacherId = teacherMap.get(teacherName);
    if (!teacherId) {
      const { data: newT, error: errT } = await sb.from('teachers').insert({ name: teacherName }).select().single();
      if (errT || !newT) {
        logArea.innerHTML += `<div class="log-error">แถวที่ ${i + 2}: สร้างครู ${teacherName} ไม่สำเร็จ</div>`;
        failCount++;
        continue;
      }
      teacherId = newT.id;
      teacherMap.set(teacherName, teacherId);
    }

    // Get or Create Task
    let taskId = taskMap.get(taskTitle);
    if (!taskId) {
      const { data: newTk, error: errTk } = await sb.from('tasks').insert({ title: taskTitle }).select().single();
      if (errTk || !newTk) {
        logArea.innerHTML += `<div class="log-error">แถวที่ ${i + 2}: สร้างงาน ${taskTitle} ไม่สำเร็จ</div>`;
        failCount++;
        continue;
      }
      taskId = newTk.id;
      taskMap.set(taskTitle, taskId);
    }

    // Upsert Submission
    const subPayload = {
      teacher_id: teacherId,
      task_id: taskId,
      due_date: dueDateStr,
      status: status
    };
    if (status === 'sent') subPayload.submitted_at = new Date().toISOString();

    const { error: subErr } = await sb.from('submissions').upsert(subPayload, { onConflict: 'teacher_id,task_id' });

    if (subErr) {
      logArea.innerHTML += `<div class="log-error">แถวที่ ${i + 2} (${teacherName} - ${taskTitle}): บันทึกไม่สำเร็จ - ${subErr.message}</div>`;
      failCount++;
    } else {
      successCount++;
    }

    const pct = Math.round(30 + ((i + 1) / rows.length) * 65);
    progressBar.style.width = pct + '%';
  }

  logArea.innerHTML += `<div class="log-success"><b>สรุป:</b> นำเข้าสำเร็จ ${successCount} รายการ, ล้มเหลว/ข้าม ${failCount} รายการ</div>`;
}

// ===================== Event Listeners =====================
document.getElementById('addTeacherBtn').addEventListener('click', () => openTeacherModal());
document.getElementById('downloadTeacherTemplateBtn').addEventListener('click', downloadTeacherTemplate);
document.getElementById('downloadSubTemplateBtn').addEventListener('click', downloadSubmissionTemplate);
document.getElementById('importTeacherBtn').addEventListener('click', () => openImportModal('teachers'));
document.getElementById('importSubBtn').addEventListener('click', () => openImportModal('submissions'));

document.getElementById('refreshBtn').addEventListener('click', () => {
  loadRows();
  loadTeachers();
});

// ===================== Init =====================
checkSession();