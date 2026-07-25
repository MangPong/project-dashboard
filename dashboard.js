:root{
  --navy:#12324F;
  --blue:#2E6DA4;
  --blue-soft:#EAF3FB;
  --blue-softer:#F5FAFE;
  --border:#E1E8EE;
  --text:#1F2D3D;
  --muted:#64748B;
  --white:#FFFFFF;
  --danger:#CC4125;
  --danger-bg:#F4CCCC;

  --st-sent-bg:#D9EAD3;   --st-sent-fg:#274E13;
  --st-review-bg:#CFE2F3; --st-review-fg:#1155CC;
  --st-open-bg:#F3F3F3;   --st-open-fg:#666666;
  --st-soon-bg:#FFF2CC;   --st-soon-fg:#B45F06;
  --st-today-bg:#FCE5CD;  --st-today-fg:#CC4125;
  --st-late-bg:#F4CCCC;   --st-late-fg:#990000;
}

*{box-sizing:border-box;}
html,body{margin:0;padding:0;}
body{
  background:linear-gradient(180deg,#F5FAFE 0%, #EEF5FB 260px, #F7FAFC 100%);
  font-family:'Sarabun',sans-serif;
  color:var(--text);
  min-height:100vh;
  padding:28px 18px 60px;
}

.wrap{max-width:1180px;margin:0 auto;}

/* ---------- Header ---------- */
.topbar{
  display:flex;justify-content:space-between;align-items:flex-start;
  flex-wrap:wrap;gap:14px;margin-bottom:26px;
}
.brand{display:flex;align-items:center;gap:14px;}
.brand-mark{
  width:48px;height:48px;border-radius:12px;
  background:linear-gradient(135deg,var(--navy),var(--blue));
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 6px 16px rgba(18,50,79,0.25);
  flex-shrink:0;
}
.brand-mark svg{width:26px;height:26px;}
.brand h1{
  font-family:'Kanit',sans-serif;font-weight:600;
  font-size:22px;color:var(--navy);margin:0 0 2px;letter-spacing:.2px;
}
.brand p{margin:0;color:var(--muted);font-size:13.5px;}
.term-badge{
  background:var(--white);border:1px solid var(--border);
  border-radius:999px;padding:8px 16px;font-size:13px;color:var(--navy);
  display:flex;align-items:center;gap:8px;font-weight:500;
  box-shadow:0 1px 2px rgba(18,50,79,0.04);
}
.term-badge .dot{width:7px;height:7px;border-radius:50%;background:#3AA35C;display:inline-block;}

.nav-links{display:flex;gap:10px;align-items:center;}
.nav-links a{
  font-size:13px;color:var(--navy);text-decoration:none;font-weight:500;
  padding:8px 14px;border-radius:999px;border:1px solid var(--border);background:var(--white);
  transition:background .15s;
}
.nav-links a:hover{background:var(--blue-soft);}
.nav-links a.primary{background:var(--blue);color:#fff;border-color:var(--blue);}

/* ---------- Stat row ---------- */
.stat-row{
  display:grid;
  grid-template-columns: 1.15fr 1fr 1fr 1fr 1fr;
  gap:14px;margin-bottom:22px;
}
@media (max-width:920px){ .stat-row{grid-template-columns:1fr 1fr;} }

.ring-card{
  background:linear-gradient(150deg,var(--navy) 0%, #1C4C74 100%);
  border-radius:16px;padding:20px 20px;color:#fff;
  display:flex;align-items:center;gap:16px;
  box-shadow:0 10px 24px -8px rgba(18,50,79,0.45);
}
.ring-wrap{position:relative;width:76px;height:76px;flex-shrink:0;}
.ring-wrap svg{transform:rotate(-90deg);}
.ring-bg{fill:none;stroke:rgba(255,255,255,0.18);stroke-width:8;}
.ring-fg{fill:none;stroke:#8FD3A0;stroke-width:8;stroke-linecap:round;
  stroke-dasharray:213.6; stroke-dashoffset:213.6;
  transition:stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1);}
.ring-num{
  position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  font-family:'Kanit',sans-serif;font-weight:600;font-size:17px;
}
.ring-label h3{margin:0 0 4px;font-family:'Kanit',sans-serif;font-weight:500;font-size:13.5px;opacity:.9;}
.ring-label .big{font-family:'Kanit',sans-serif;font-size:15px;font-weight:600;}
.ring-label .small{font-size:12px;opacity:.75;margin-top:2px;}

.stat-card{
  background:var(--white);border:1px solid var(--border);border-radius:16px;
  padding:16px 18px;display:flex;flex-direction:column;justify-content:space-between;
  box-shadow:0 1px 2px rgba(18,50,79,0.03);
}
.stat-card .top{display:flex;justify-content:space-between;align-items:flex-start;}
.stat-card .icon{
  width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;
}
.stat-card .icon svg{width:17px;height:17px;}
.stat-card .num{font-family:'Kanit',sans-serif;font-size:26px;font-weight:600;margin-top:10px;color:var(--navy);}
.stat-card .lbl{font-size:12.5px;color:var(--muted);margin-top:2px;}

.ic-sent{background:var(--st-sent-bg);} .ic-sent svg{stroke:var(--st-sent-fg);}
.ic-review{background:var(--st-review-bg);} .ic-review svg{stroke:var(--st-review-fg);}
.ic-open{background:var(--st-open-bg);} .ic-open svg{stroke:var(--st-open-fg);}
.ic-late{background:var(--st-late-bg);} .ic-late svg{stroke:var(--st-late-fg);}

/* ---------- Toolbar ---------- */
.toolbar{
  background:var(--white);border:1px solid var(--border);border-radius:14px;
  padding:14px 16px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;
  margin-bottom:16px;
}
.search-box{flex:1 1 260px;position:relative;}
.search-box svg{
  position:absolute;left:12px;top:50%;transform:translateY(-50%);
  width:16px;height:16px;stroke:var(--muted);
}
.search-box input{
  width:100%;padding:10px 12px 10px 36px;border-radius:10px;border:1px solid var(--border);
  font-family:'Sarabun',sans-serif;font-size:14px;background:var(--blue-softer);
  outline:none;transition:border-color .15s, background .15s;color:var(--text);
}
.search-box input:focus{border-color:var(--blue);background:#fff;}
.select-wrap select{
  padding:10px 32px 10px 14px;border-radius:10px;border:1px solid var(--border);
  font-family:'Sarabun',sans-serif;font-size:14px;background:var(--blue-softer) url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="%2364748B" stroke-width="2"><path d="M2 4l4 4 4-4"/></svg>') no-repeat right 12px center;
  appearance:none;-webkit-appearance:none;color:var(--text);cursor:pointer;outline:none;
}
.select-wrap select:focus{border-color:var(--blue);}
.result-count{font-size:12.5px;color:var(--muted);white-space:nowrap;}

/* ---------- Table ---------- */
.table-card{
  background:var(--white);border:1px solid var(--border);border-radius:16px;
  overflow:hidden;box-shadow:0 1px 2px rgba(18,50,79,0.03);
}
table{width:100%;border-collapse:collapse;}
thead th{
  text-align:left;font-family:'Kanit',sans-serif;font-weight:500;font-size:12.5px;
  color:var(--navy);background:var(--blue-soft);
  padding:13px 16px;border-bottom:1px solid var(--border);letter-spacing:.2px;
}
thead th:first-child{padding-left:20px;}
tbody td{padding:13px 16px;font-size:14px;border-bottom:1px solid #EEF2F6;vertical-align:middle;}
tbody td:first-child{padding-left:20px;}
tbody tr:last-child td{border-bottom:none;}
tbody tr{transition:background .12s;}
tbody tr:hover{background:#FAFCFE;}

.teacher-cell{display:flex;align-items:center;gap:10px;}
.avatar{
  width:32px;height:32px;border-radius:50%;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  background:var(--blue-soft);color:var(--blue);
  font-family:'Kanit',sans-serif;font-weight:600;font-size:12.5px;
}
.teacher-meta .name{font-weight:600;color:var(--text);font-size:14px;}
.teacher-meta .subject{font-size:12px;color:var(--muted);}

.task-name{font-weight:500;}
.due{color:var(--text);font-variant-numeric:tabular-nums;}
.due .days{display:block;font-size:11.5px;color:var(--muted);margin-top:1px;}

.badge{
  display:inline-flex;align-items:center;gap:6px;
  padding:5px 12px;border-radius:999px;font-size:12.5px;font-weight:700;
  font-family:'Sarabun',sans-serif;white-space:nowrap;
}
.badge .bdot{width:6px;height:6px;border-radius:50%;}

.b-sent{background:var(--st-sent-bg);color:var(--st-sent-fg);} .b-sent .bdot{background:var(--st-sent-fg);}
.b-review{background:var(--st-review-bg);color:var(--st-review-fg);} .b-review .bdot{background:var(--st-review-fg);}
.b-open{background:var(--st-open-bg);color:var(--st-open-fg);} .b-open .bdot{background:var(--st-open-fg);}
.b-soon{background:var(--st-soon-bg);color:var(--st-soon-fg);} .b-soon .bdot{background:var(--st-soon-fg);}
.b-today{background:var(--st-today-bg);color:var(--st-today-fg);} .b-today .bdot{background:var(--st-today-fg);}
.b-late{background:var(--st-late-bg);color:var(--st-late-fg);} .b-late .bdot{background:var(--st-late-fg);}

.status-select{
  padding:6px 26px 6px 10px;border-radius:8px;border:1px solid var(--border);
  font-family:'Sarabun',sans-serif;font-size:12.5px;font-weight:600;cursor:pointer;outline:none;
  background-color:var(--white);
}

.empty-row td{padding:44px 16px;text-align:center;color:var(--muted);font-size:14px;}

.legend{
  display:flex;flex-wrap:wrap;gap:10px 18px;padding:14px 20px;
  border-top:1px solid var(--border);background:var(--blue-softer);font-size:12.5px;color:var(--muted);
}
.legend span{display:flex;align-items:center;gap:6px;}
.legend .bdot{width:8px;height:8px;border-radius:50%;}

footer{text-align:center;font-size:12px;color:var(--muted);margin-top:22px;}

/* ---------- Admin: login ---------- */
.login-wrap{
  max-width:380px;margin:80px auto;background:var(--white);
  border:1px solid var(--border);border-radius:16px;padding:32px 28px;
  box-shadow:0 12px 32px -12px rgba(18,50,79,0.2);
}
.login-wrap h2{font-family:'Kanit',sans-serif;font-size:19px;color:var(--navy);margin:0 0 4px;}
.login-wrap p{font-size:13px;color:var(--muted);margin:0 0 20px;}
.field{margin-bottom:14px;}
.field label{display:block;font-size:13px;font-weight:600;color:var(--text);margin-bottom:6px;}
.field input{
  width:100%;padding:10px 12px;border-radius:9px;border:1px solid var(--border);
  font-family:'Sarabun',sans-serif;font-size:14px;outline:none;background:var(--blue-softer);
}
.field input:focus{border-color:var(--blue);background:#fff;}
.btn{
  width:100%;padding:11px;border-radius:9px;border:none;background:var(--blue);
  color:#fff;font-family:'Sarabun',sans-serif;font-weight:600;font-size:14.5px;cursor:pointer;
  transition:background .15s;
}
.btn:hover{background:var(--navy);}
.btn-secondary{background:var(--white);color:var(--navy);border:1px solid var(--border);}
.btn-secondary:hover{background:var(--blue-soft);}
.btn-sm{width:auto;padding:8px 16px;font-size:13px;}
.login-error{
  background:var(--danger-bg);color:var(--st-late-fg);font-size:12.5px;
  padding:9px 12px;border-radius:8px;margin-bottom:14px;display:none;
}

.admin-toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;}
.admin-toolbar .btn{width:auto;}

.panel-hidden{display:none !important;}
