const STATUS_OPTIONS = [
  {value:"open",   label:"ยังไม่ส่ง"},
  {value:"review", label:"รอตรวจ"},
  {value:"sent",   label:"ส่งแล้ว"},
  {value:"late",   label:"เกินกำหนด"},
];

let ALL_ROWS = [];

// ---------- Auth ----------
async function checkSession(){
  const { data: { session } } = await sb.auth.getSession();
  if(session){
    showAdminPanel(session);
  } else {
    showLogin();
  }
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

// ---------- Data ----------
async function loadRows(){
  const { data, error } = await sb
    .from('submissions')
    .select(`
      id, status,
      teacher:teachers ( id, name, subject ),
      task:tasks ( id, title, due_date )
    `)
    .order('due_date', { foreignTable: 'tasks', ascending: true });

  if(error){
    console.error(error);
    document.getElementById('adminTableBody').innerHTML =
      `<tr class="empty-row"><td colspan="5">โหลดข้อมูลไม่สำเร็จ: ${error.message}</td></tr>`;
    return;
  }

  ALL_ROWS = data;
  renderTable();
}

function renderTable(){
  const tbody = document.getElementById('adminTableBody');
  tbody.innerHTML = '';

  if(ALL_ROWS.length === 0){
    tbody.innerHTML = '<tr class="empty-row"><td colspan="5">ยังไม่มีข้อมูล</td></tr>';
    return;
  }

  ALL_ROWS.forEach(row=>{
    const tr = document.createElement('tr');
    const optionsHtml = STATUS_OPTIONS.map(o =>
      `<option value="${o.value}" ${o.value===row.status ? 'selected' : ''}>${o.label}</option>`
    ).join('');

    tr.innerHTML = `
      <td>${row.teacher.name}<br><span style="color:var(--muted);font-size:12px">${row.teacher.subject || ''}</span></td>
      <td>${row.task.title}</td>
      <td>${row.task.due_date}</td>
      <td>
        <select class="status-select" data-id="${row.id}">
          ${optionsHtml}
        </select>
      </td>
      <td><button class="btn btn-secondary btn-sm" data-delete="${row.id}">ลบ</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.status-select').forEach(sel=>{
    sel.addEventListener('change', (e)=> updateStatus(e.target.dataset.id, e.target.value));
  });
  tbody.querySelectorAll('[data-delete]').forEach(btn=>{
    btn.addEventListener('click', (e)=> deleteSubmission(e.target.dataset.delete));
  });
}

async function updateStatus(id, newStatus){
  const payload = { status: newStatus };
  if(newStatus === 'sent') payload.submitted_at = new Date().toISOString();

  const { error } = await sb.from('submissions').update(payload).eq('id', id);
  if(error){ alert('บันทึกไม่สำเร็จ: ' + error.message); }
}

async function deleteSubmission(id){
  if(!confirm('ยืนยันลบรายการนี้?')) return;
  const { error } = await sb.from('submissions').delete().eq('id', id);
  if(error){ alert('ลบไม่สำเร็จ: ' + error.message); return; }
  loadRows();
}

document.getElementById('refreshBtn').addEventListener('click', loadRows);

checkSession();
