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

// ===================== Event Listeners =====================
document.getElementById('addTeacherBtn').addEventListener('click', () => openTeacherModal());
document.getElementById('refreshBtn').addEventListener('click', () => {
  loadRows();
  loadTeachers();
});

// ===================== Init =====================
checkSession();