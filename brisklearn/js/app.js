/* ═══════════════════════════════════════════════════════════
   Shiva's Pro Learning LMS — Main Application
   Full multi-role LMS with AI, PWA, Email, Language Support
   ═══════════════════════════════════════════════════════════ */

const API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

// ── Global State ─────────────────────────────────────────────
const State = {
  user: null,
  currentPage: '',
  quizData: null,
  quizAnswers: {},
  quizSubmitted: false,
  coPoMatrix: [],
  activeTab: {},
};

// ── Toast ─────────────────────────────────────────────────────
function toast(msg, type = 'info', duration = 3500) {
  let tc = document.getElementById('toast-container');
  if (!tc) {
    tc = document.createElement('div');
    tc.id = 'toast-container';
    document.body.appendChild(tc);
  }
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  const icons = { success:'✅', error:'❌', info:'ℹ️', warn:'⚠️' };
  t.innerHTML = `<span style="font-size:16px">${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  tc.appendChild(t);
  setTimeout(() => t.remove(), duration);
}
window.toast = toast;

// ── AI Helper ────────────────────────────────────────────────
async function callAI(prompt, outputId, onDone) {
  const el = document.getElementById(outputId);
  if (!el) return;
  el.innerHTML = `<div class="ai-thinking"><div class="dot-spin"><span></span><span></span><span></span></div> AI is generating your content...</div>`;
  const lang = LangService.getCurrentLang();
  const langNote = lang !== 'en' ? `\n\nIMPORTANT: Respond in ${LangService.getLanguages()[lang]?.label || 'English'} language.` : '';

  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 1200, messages: [{ role: 'user', content: prompt + langNote }] })
    });
    const data = await res.json();
    const text = data.content?.map(b => b.text || '').join('') || 'Error generating content.';
    el.textContent = text;
    if (typeof onDone === 'function') onDone(text);
  } catch (e) {
    if (!navigator.onLine) {
      el.textContent = '[Offline] This response will be generated when you reconnect.';
      DB.queueSync('ai_generate', { prompt, outputId });
    } else {
      el.textContent = 'Error: ' + e.message;
    }
  }
}

// ── Routing ──────────────────────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById('page-' + name);
  if (pg) pg.classList.add('active');
  State.currentPage = name;
  document.querySelectorAll('.sb-item').forEach(b => {
    b.classList.toggle('active', b.dataset.page === name);
  });
  // Render page-specific content
  if (name === 'admin') renderAdminPage();
  if (name === 'standards') renderStandardsPage();
  if (name === 'copo') renderCOPOPage();
}
window.showPage = showPage;

// ── Login Screen ─────────────────────────────────────────────
function renderLogin() {
  document.getElementById('root').innerHTML = `
  <div id="login-screen">
    <div class="login-card">
      <div class="login-logo">
        <div class="logo-icon">B</div>
        <div>
          <div class="logo-text">Shiva's Pro Learning LMS</div>
          <div class="logo-sub" style="font-size:11px;color:var(--muted)">AI-Powered • NBA Ready • Offline First</div>
        </div>
      </div>

      <div class="role-tabs">
        <button class="role-tab admin active" onclick="setLoginRole('admin',this)">🛡️ Admin</button>
        <button class="role-tab faculty" onclick="setLoginRole('faculty',this)">👩‍🏫 Faculty</button>
        <button class="role-tab student" onclick="setLoginRole('student',this)">🎓 Student</button>
      </div>

      <div id="login-role-note" style="font-size:12px;color:var(--muted);background:var(--surface2);border-radius:7px;padding:8px 12px;margin-bottom:14px">
        Demo: admin@Shiva's Pro Learning.edu / Admin@123
      </div>

      <div class="form-group">
        <label>Email Address</label>
        <input type="email" id="login-email" placeholder="your@email.com" value="admin@Shiva's Pro Learning.edu"/>
      </div>
      <div class="form-group">
        <label>Password</label>
        <div class="input-group">
          <input type="password" id="login-pwd" placeholder="••••••••" value="Admin@123"/>
          <span class="input-icon" onclick="togglePwd()">👁️</span>
        </div>
        <div id="login-error" class="error-msg"></div>
      </div>

      <button class="btn btn-primary" style="width:100%;justify-content:center;padding:10px" onclick="doLogin()">
        Sign In →
      </button>

      <div style="text-align:center;margin-top:14px">
        <button class="btn-ghost" style="font-size:12px" onclick="showForgotPassword()">Forgot password?</button>
        <span style="color:var(--border2);margin:0 6px">|</span>
        <button class="btn-ghost" style="font-size:12px" onclick="showRegisterModal()">Register as Faculty</button>
      </div>
    </div>
  </div>
  `;
}

function setLoginRole(role, btn) {
  document.querySelectorAll('.role-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const demos = {
    admin:   'Demo: admin@Shiva's Pro Learning.edu / Admin@123',
    faculty: 'Demo: ramesh@Shiva's Pro Learning.edu / Faculty@123',
    student: 'Demo: arjun@student.Shiva's Pro Learning.edu / Student@123',
  };
  const emails = {
    admin: 'admin@Shiva's Pro Learning.edu',
    faculty: 'ramesh@Shiva's Pro Learning.edu',
    student: 'arjun@student.Shiva's Pro Learning.edu',
  };
  const pwds = { admin: 'Admin@123', faculty: 'Faculty@123', student: 'Student@123' };
  document.getElementById('login-role-note').textContent = demos[role];
  document.getElementById('login-email').value = emails[role];
  document.getElementById('login-pwd').value = pwds[role];
}
window.setLoginRole = setLoginRole;

function togglePwd() {
  const f = document.getElementById('login-pwd');
  f.type = f.type === 'password' ? 'text' : 'password';
}
window.togglePwd = togglePwd;

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pwd   = document.getElementById('login-pwd').value;
  const errEl = document.getElementById('login-error');
  errEl.classList.remove('show');
  try {
    const user = await Auth.login(email, pwd);
    State.user = user;
    initApp(user);
  } catch (e) {
    errEl.textContent = e.message;
    errEl.classList.add('show');
  }
}
window.doLogin = doLogin;

function showForgotPassword() {
  openModal('forgot-modal');
}
window.showForgotPassword = showForgotPassword;

async function doForgotPassword() {
  const email = document.getElementById('forgot-email').value.trim();
  try {
    const { user, tempPwd } = await Auth.resetPassword(email);
    await EmailService.sendPasswordReset({ name: user.name, email: user.email, tempPassword: tempPwd });
    toast('📧 Password reset email sent!', 'success');
    closeModal('forgot-modal');
  } catch (e) {
    toast('❌ ' + e.message, 'error');
  }
}
window.doForgotPassword = doForgotPassword;

function showRegisterModal() {
  openModal('register-modal');
}
window.showRegisterModal = showRegisterModal;

async function doRegister() {
  const name    = document.getElementById('reg-name').value.trim();
  const email   = document.getElementById('reg-email').value.trim();
  const pwd     = document.getElementById('reg-pwd').value;
  const dept    = document.getElementById('reg-dept').value;
  if (!name || !email || !pwd) { toast('Please fill all fields', 'error'); return; }

  const id = 'fac-' + Date.now();
  const tempPwd = 'Temp@' + Math.random().toString(36).slice(2,8).toUpperCase();
  await DB.put(DB.STORES.users, {
    id, name, email: email.toLowerCase(), password: tempPwd,
    role: 'faculty', status: 'pending', department: dept,
    subjects: [], classes: [], createdAt: new Date().toISOString(), avatar: name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
  });
  toast('✅ Registration submitted! Awaiting admin approval.', 'success');
  closeModal('register-modal');
}
window.doRegister = doRegister;

// ── App Shell ────────────────────────────────────────────────
function initApp(user) {
  document.getElementById('root').innerHTML = buildAppShell(user);
  const defaultPage = user.role === 'admin' ? 'admin' : user.role === 'faculty' ? 'dashboard' : 'student-home';
  showPage(defaultPage);
  LangService.setLang(LangService.getCurrentLang());
}

function buildAppShell(user) {
  const isAdmin   = user.role === 'admin';
  const isFaculty = user.role === 'faculty';
  const isStudent = user.role === 'student';

  const adminNav = isAdmin ? `
    <div class="sb-label">Admin</div>
    <button class="sb-item" data-page="admin" onclick="showPage('admin')"><span class="ic">🛡️</span><span>Admin Panel</span></button>
    <button class="sb-item" data-page="manage-users" onclick="showPage('manage-users')"><span class="ic">👥</span><span>Users</span><span class="badge-count" id="pending-count">0</span></button>
  ` : '';

  const facultyNav = (isAdmin || isFaculty) ? `
    <div class="sb-label">Teaching</div>
    <button class="sb-item" data-page="dashboard" onclick="showPage('dashboard')"><span class="ic">🏠</span><span>Dashboard</span></button>
    <button class="sb-item" data-page="generator" onclick="showPage('generator')"><span class="ic">✨</span><span>AI Generator</span></button>
    <button class="sb-item" data-page="feedback" onclick="showPage('feedback')"><span class="ic">📝</span><span>Writing Feedback</span></button>
    <button class="sb-item" data-page="quiz-builder" onclick="showPage('quiz-builder')"><span class="ic">❓</span><span>Quiz Builder</span></button>
    <button class="sb-item" data-page="podcast" onclick="showPage('podcast')"><span class="ic">🎙️</span><span>Podcast Studio</span></button>
    <button class="sb-item" data-page="standards" onclick="showPage('standards')"><span class="ic">📚</span><span>Standards Lib</span></button>
    <button class="sb-item" data-page="copo" onclick="showPage('copo')"><span class="ic">📊</span><span>NBA CO-PO</span></button>
  ` : '';

  const studentNav = isStudent ? `
    <div class="sb-label">Learning</div>
    <button class="sb-item" data-page="student-home" onclick="showPage('student-home')"><span class="ic">🏠</span><span>My Home</span></button>
    <button class="sb-item" data-page="boost" onclick="showPage('boost')"><span class="ic">🚀</span><span>AI Boost</span></button>
    <button class="sb-item" data-page="take-quiz" onclick="showPage('take-quiz')"><span class="ic">❓</span><span>Quizzes</span></button>
    <button class="sb-item" data-page="my-results" onclick="showPage('my-results')"><span class="ic">📈</span><span>My Results</span></button>
  ` : '';

  const roleClass = `avatar-${user.role}`;
  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);

  return `
  <div id="app">
    <nav id="sidebar">
      <div class="sb-logo">
        <div class="logo-icon">B</div>
        <div>
          <div class="logo-label">Shiva's Pro Learning</div>
        </div>
      </div>
      <div class="sb-section">
        ${adminNav}
        ${facultyNav}
        ${studentNav}
        <div class="sb-label">Settings</div>
        <button class="sb-item" data-page="settings" onclick="showPage('settings')"><span class="ic">⚙️</span><span>Settings</span></button>
      </div>
      <div class="sb-bottom">
        <div class="sb-user" onclick="showPage('settings')">
          <div class="avatar ${roleClass}">${user.avatar || user.name.slice(0,2)}</div>
          <div>
            <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px">${user.name}</div>
            <div style="font-size:11px;color:var(--muted)">${roleLabel}</div>
          </div>
        </div>
        <button class="sb-item mt-8" onclick="doLogout()" style="color:var(--danger)"><span class="ic">🚪</span><span>Sign Out</span></button>
      </div>
    </nav>
    <main id="main">
      ${buildAllPages(user)}
    </main>
  </div>

  ${buildModals()}

  <div id="toast-container"></div>
  `;
}

function buildModals() {
  return `
  <!-- Forgot Password Modal -->
  <div class="modal-overlay" id="forgot-modal">
    <div class="modal" style="max-width:380px">
      <div class="modal-header">
        <div class="modal-title">🔑 Reset Password</div>
        <button class="modal-close" onclick="closeModal('forgot-modal')">✕</button>
      </div>
      <div class="form-group">
        <label>Your registered email</label>
        <input type="email" id="forgot-email" placeholder="you@email.com"/>
      </div>
      <p style="font-size:12px;color:var(--muted);margin-bottom:14px">A temporary password will be sent to your email via EmailJS.</p>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal('forgot-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="doForgotPassword()">Send Reset Email</button>
      </div>
    </div>
  </div>

  <!-- Faculty Register Modal -->
  <div class="modal-overlay" id="register-modal">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">👩‍🏫 Faculty Registration</div>
        <button class="modal-close" onclick="closeModal('register-modal')">✕</button>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Full Name</label><input type="text" id="reg-name" placeholder="Dr. Jane Smith"/></div>
        <div class="form-group"><label>Email</label><input type="email" id="reg-email" placeholder="jane@school.edu"/></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Department</label><input type="text" id="reg-dept" placeholder="Science, Math..."/></div>
        <div class="form-group"><label>Password</label><input type="password" id="reg-pwd" placeholder="Create password"/></div>
      </div>
      <p style="font-size:12px;color:var(--muted);background:var(--surface2);padding:8px 12px;border-radius:7px;margin-bottom:14px">
        ℹ️ Your account will require admin approval. You'll receive your credentials via email once approved.
      </p>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal('register-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="doRegister()">Submit Registration</button>
      </div>
    </div>
  </div>

  <!-- View Material Modal -->
  <div class="modal-overlay" id="material-modal">
    <div class="modal" style="max-width:640px">
      <div class="modal-header">
        <div class="modal-title" id="material-modal-title">Material</div>
        <button class="modal-close" onclick="closeModal('material-modal')">✕</button>
      </div>
      <div class="ai-box" id="material-modal-content" style="min-height:200px;max-height:400px;overflow-y:auto"></div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="ExportService.exportToGoogleDocs(document.getElementById('material-modal-title').textContent, document.getElementById('material-modal-content').textContent)">📄 Google Docs</button>
        <button class="btn btn-outline" onclick="ExportService.exportToPDF({title:document.getElementById('material-modal-title').textContent,content:document.getElementById('material-modal-content').textContent})">📑 Export PDF</button>
        <button class="btn btn-primary" onclick="closeModal('material-modal')">Close</button>
      </div>
    </div>
  </div>
  `;
}

function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
window.openModal = openModal;
window.closeModal = closeModal;

// ── Build All Pages ──────────────────────────────────────────
function buildAllPages(user) {
  return `
  <!-- ADMIN PAGE -->
  <div class="page" id="page-admin">
    <div class="page-header">
      <div><div class="page-title">🛡️ Admin Control Panel</div><div class="page-sub">Manage users, approvals, and institution settings</div></div>
      <button class="btn btn-primary" onclick="showPage('manage-users')">👥 Manage Users</button>
    </div>
    <div class="page-content" id="admin-content">
      <div style="text-align:center;padding:40px;color:var(--muted)">Loading admin panel...</div>
    </div>
  </div>

  <!-- USER MANAGEMENT -->
  <div class="page" id="page-manage-users">
    <div class="page-header">
      <div><div class="page-title">👥 User Management</div><div class="page-sub">Manage all faculty, students, and admins</div></div>
      <button class="btn btn-primary" onclick="openAddUserModal()">+ Add User</button>
    </div>
    <div class="page-content" id="users-content">
      <div style="text-align:center;padding:40px;color:var(--muted)">Loading users...</div>
    </div>
  </div>

  <!-- FACULTY/ADMIN DASHBOARD -->
  <div class="page" id="page-dashboard">
    <div class="page-header">
      <div><div class="page-title">Good morning, ${user.name.split(' ')[0]} 👋</div><div class="page-sub">Manage your classes, AI tools, and student progress</div></div>
      <button class="btn btn-primary" onclick="showPage('generator')">✨ Create with AI</button>
    </div>
    <div class="page-content">
      <div class="grid-4" style="margin-bottom:18px">
        <div class="stat-card"><div class="stat-label">Total Students</div><div class="stat-num">142</div><span class="stat-delta delta-up">↑ 12 this week</span></div>
        <div class="stat-card"><div class="stat-label">Materials Created</div><div class="stat-num" id="mat-count">—</div><span class="stat-delta delta-up">↑ 5 new</span></div>
        <div class="stat-card"><div class="stat-label">Quizzes Graded</div><div class="stat-num">214</div><span class="stat-delta delta-up">↑ 24 this week</span></div>
        <div class="stat-card"><div class="stat-label">Avg. Class Score</div><div class="stat-num">78%</div><span class="stat-delta delta-dn">↓ 2% vs last</span></div>
      </div>
      <div class="grid-2" style="margin-bottom:18px">
        <div class="card">
          <div class="card-header"><div class="section-title" style="margin:0">Recent Materials</div><button class="btn-ghost btn-sm" onclick="showPage('generator')">+ Create</button></div>
          <div id="recent-materials-list"><div style="color:var(--muted);font-size:13px">Loading...</div></div>
        </div>
        <div class="card">
          <div class="section-title">Class Progress</div>
          <div style="display:flex;flex-direction:column;gap:14px">
            <div><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:13px">Grade 8 Science</span><span style="font-size:12px;color:var(--muted)">82%</span></div><div class="progress"><div class="progress-fill" style="width:82%"></div></div></div>
            <div><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:13px">Grade 7 English</span><span style="font-size:12px;color:var(--muted)">74%</span></div><div class="progress"><div class="progress-fill" style="width:74%;background:#8B5CF6"></div></div></div>
            <div><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:13px">Grade 8 History</span><span style="font-size:12px;color:var(--muted)">69%</span></div><div class="progress"><div class="progress-fill" style="width:69%;background:#D97706"></div></div></div>
            <div><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:13px">Grade 6 Math</span><span style="font-size:12px;color:var(--muted)">91%</span></div><div class="progress"><div class="progress-fill" style="width:91%;background:#16A34A"></div></div></div>
          </div>
        </div>
      </div>
      <div class="section-title">Quick Actions</div>
      <div class="grid-4">
        <div class="tool-card" onclick="showPage('generator');setTab('gen-tabs','lesson')"><div class="tool-icon" style="background:#EFF6FF">📖</div><div style="font-size:13px;font-weight:600">Lesson Plan</div><div style="font-size:12px;color:var(--muted)">AI-generated instantly</div></div>
        <div class="tool-card" onclick="showPage('quiz-builder')"><div class="tool-icon" style="background:#F0FDF4">❓</div><div style="font-size:13px;font-weight:600">Quiz Builder</div><div style="font-size:12px;color:var(--muted)">Auto-graded quizzes</div></div>
        <div class="tool-card" onclick="showPage('copo')"><div class="tool-icon" style="background:#F5F3FF">📊</div><div style="font-size:13px;font-weight:600">NBA CO-PO</div><div style="font-size:12px;color:var(--muted)">Attainment matrix</div></div>
        <div class="tool-card" onclick="showPage('feedback')"><div class="tool-icon" style="background:#FFFBEB">✍️</div><div style="font-size:13px;font-weight:600">Writing Feedback</div><div style="font-size:12px;color:var(--muted)">Glows, grows & next steps</div></div>
      </div>
    </div>
  </div>

  <!-- AI GENERATOR -->
  <div class="page" id="page-generator">
    <div class="page-header">
      <div><div class="page-title">✨ AI Content Generator</div><div class="page-sub">Lessons, quizzes, rubrics, slides — in any Indian language</div></div>
    </div>
    <div class="page-content">
      <div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap;margin-bottom:16px">
        <div class="tabs" id="gen-tabs">
          <button class="tab active" onclick="setTab('gen-tabs',this,0)">📖 Lesson</button>
          <button class="tab" onclick="setTab('gen-tabs',this,1)">❓ Quiz</button>
          <button class="tab" onclick="setTab('gen-tabs',this,2)">📋 Rubric</button>
          <button class="tab" onclick="setTab('gen-tabs',this,3)">🖼️ Slides</button>
          <button class="tab" onclick="setTab('gen-tabs',this,4)">📄 Worksheet</button>
        </div>
        <div id="gen-lang-container"></div>
      </div>
      <div class="grid-2">
        <div class="card">
          <div class="section-title" id="gen-form-title">Lesson Plan Generator</div>
          <div class="form-group"><label>Topic / Standard</label><input type="text" id="gen-topic" placeholder="e.g. Photosynthesis, Algebra, Water Cycle..."/></div>
          <div class="form-row">
            <div class="form-group"><label>Grade Level</label><select id="gen-grade"><option>Grade 5</option><option>Grade 6</option><option>Grade 7</option><option selected>Grade 8</option><option>Grade 9</option><option>Grade 10</option><option>Grade 11</option><option>Grade 12</option></select></div>
            <div class="form-group"><label>Duration</label><select id="gen-dur"><option>30 min</option><option selected>45 min</option><option>60 min</option><option>90 min</option></select></div>
          </div>
          <div class="form-group"><label>Learning Objectives / Notes (optional)</label><textarea id="gen-notes" style="min-height:70px" placeholder="Students will be able to... / Differentiation needs..."></textarea></div>
          <div class="form-group"><label>Align to Standard (optional)</label><input type="text" id="gen-standard" placeholder="e.g. NCERT-SCI-8.2 or NBA-PO1"/></div>
          <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="generateContent()">✨ Generate with AI</button>
        </div>
        <div class="card" style="display:flex;flex-direction:column;gap:10px">
          <div class="card-header">
            <div class="section-title" style="margin:0">AI Output</div>
            <div style="display:flex;gap:6px">
              <button class="btn btn-outline btn-sm" onclick="ExportService.exportToGoogleDocs(document.getElementById('gen-topic').value||'Content',document.getElementById('gen-output').textContent)">📄 Docs</button>
              <button class="btn btn-outline btn-sm" onclick="exportGenPDF()">📑 PDF</button>
              <button class="btn btn-primary btn-sm" onclick="saveContent()">💾 Save</button>
            </div>
          </div>
          <div id="gen-output" class="ai-box" style="flex:1;min-height:320px"><span style="color:var(--subtle)">Your AI-generated content will appear here.</span></div>
        </div>
      </div>
    </div>
  </div>

  <!-- QUIZ BUILDER -->
  <div class="page" id="page-quiz-builder">
    <div class="page-header">
      <div><div class="page-title">❓ Quiz Builder & Auto-Grader</div><div class="page-sub">AI-generated quizzes with instant auto-grading and result export</div></div>
    </div>
    <div class="page-content">
      <div class="grid-2">
        <div class="card">
          <div class="section-title">Create Quiz</div>
          <div class="form-group"><label>Quiz Topic</label><input type="text" id="qb-topic" placeholder="e.g. Photosynthesis, Newton's Laws..."/></div>
          <div class="form-row">
            <div class="form-group"><label>Grade</label><select id="qb-grade"><option>Grade 6</option><option>Grade 7</option><option selected>Grade 8</option><option>Grade 9</option><option>Grade 10</option></select></div>
            <div class="form-group"><label>Questions</label><select id="qb-count"><option>5</option><option selected>10</option><option>15</option><option>20</option></select></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Question Type</label><select id="qb-type"><option>Multiple Choice</option><option>True/False</option><option>Mixed</option></select></div>
            <div class="form-group"><label>Difficulty</label><select id="qb-diff"><option>Easy</option><option selected>Medium</option><option>Hard</option><option>Mixed</option></select></div>
          </div>
          <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="generateQuiz()">✨ Generate Quiz</button>
          <div class="divider"></div>
          <div class="section-title">Auto-Grade Submissions</div>
          <div id="quiz-submissions-list" style="font-size:13px;color:var(--muted)">No submissions yet. Generate and share a quiz first.</div>
        </div>
        <div class="card">
          <div id="quiz-preview-area">
            <div class="ai-box" style="min-height:420px"><span style="color:var(--subtle)">Your quiz will appear here after generation. Students can take it from the Student section.</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- STUDENT HOME -->
  <div class="page" id="page-student-home">
    <div class="page-header">
      <div><div class="page-title">Welcome back, ${user.name.split(' ')[0]} 🎓</div><div class="page-sub">Your learning dashboard</div></div>
    </div>
    <div class="page-content">
      <div class="grid-4" style="margin-bottom:18px">
        <div class="stat-card"><div class="stat-label">Quizzes Taken</div><div class="stat-num">8</div><span class="stat-delta delta-up">↑ 2 this week</span></div>
        <div class="stat-card"><div class="stat-label">Avg. Score</div><div class="stat-num">76%</div><span class="stat-delta delta-up">↑ 4%</span></div>
        <div class="stat-card"><div class="stat-label">Assignments</div><div class="stat-num">3</div><span class="stat-delta delta-dn">2 pending</span></div>
        <div class="stat-card"><div class="stat-label">AI Sessions</div><div class="stat-num">12</div><span class="stat-delta delta-up">Active learner!</span></div>
      </div>
      <div class="grid-2">
        <div class="card">
          <div class="section-title">📌 Pending Assignments</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="padding:10px;background:var(--surface2);border-radius:8px;border-left:3px solid var(--brand)">
              <div style="font-size:13px;font-weight:600">Water Cycle Essay</div>
              <div style="font-size:12px;color:var(--muted)">Due: March 18 · Prof. Ramesh Kumar</div>
            </div>
            <div style="padding:10px;background:var(--surface2);border-radius:8px;border-left:3px solid var(--warn)">
              <div style="font-size:13px;font-weight:600">Photosynthesis Quiz</div>
              <div style="font-size:12px;color:var(--muted)">Due: March 20 · Prof. Ramesh Kumar</div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="section-title">🚀 Quick Access</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <button class="btn btn-outline" style="justify-content:flex-start" onclick="showPage('boost')">🤖 AI Learning Assistant</button>
            <button class="btn btn-outline" style="justify-content:flex-start" onclick="showPage('take-quiz')">❓ Take a Quiz</button>
            <button class="btn btn-outline" style="justify-content:flex-start" onclick="showPage('my-results')">📈 View My Results</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- STUDENT BOOST -->
  <div class="page" id="page-boost">
    <div class="page-header">
      <div><div class="page-title">🚀 AI Learning Assistant (Boost)</div><div class="page-sub">Your personal AI tutor — works offline too</div></div>
      <div id="boost-lang-container"></div>
    </div>
    <div class="page-content">
      <div class="grid-2">
        <div class="card">
          <div class="section-title">📌 Current Assignment</div>
          <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:12px;margin-bottom:14px">
            <div style="font-size:13px;font-weight:600;color:#15803D">Water Cycle Essay</div>
            <div style="font-size:12px;color:#166534">Explain 3 stages using scientific vocabulary. Due: March 18</div>
          </div>
          <div class="form-group"><label>Your Work</label><textarea id="boost-work" style="min-height:160px" placeholder="Start writing here..."></textarea></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-outline btn-sm" onclick="boostAction('hint')">💡 Hint</button>
            <button class="btn btn-outline btn-sm" onclick="boostAction('check')">✅ Check Work</button>
            <button class="btn btn-primary btn-sm" onclick="boostAction('feedback')">📝 Get Feedback</button>
          </div>
        </div>
        <div class="card" style="display:flex;flex-direction:column">
          <div class="section-title">🤖 AI Tutor Chat</div>
          <div class="chat-area" id="boost-chat">
            <div class="msg msg-ai">Hi! I'm your AI learning assistant 👋 I'm here to help with your Water Cycle assignment. Ask me anything!</div>
          </div>
          <div class="chat-input-row">
            <input type="text" id="boost-msg" placeholder="Ask me anything..." onkeypress="if(event.key==='Enter')boostSend()"/>
            <button class="btn btn-primary" onclick="boostSend()">Send</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- TAKE QUIZ (Student) -->
  <div class="page" id="page-take-quiz">
    <div class="page-header">
      <div><div class="page-title">❓ Take a Quiz</div><div class="page-sub">Complete quizzes assigned by your teachers</div></div>
    </div>
    <div class="page-content" id="take-quiz-content">
      <div class="card">
        <div class="section-title">Available Quizzes</div>
        <table><tr><th>Quiz</th><th>Subject</th><th>Questions</th><th>Status</th><th></th></tr>
        <tr><td><b>Photosynthesis Quiz</b></td><td>Science</td><td>10</td><td><span class="badge badge-amber">Pending</span></td><td><button class="btn btn-primary btn-sm" onclick="startDemoQuiz()">Start</button></td></tr>
        <tr><td><b>Water Cycle Test</b></td><td>Science</td><td>5</td><td><span class="badge badge-green">Done — 80%</span></td><td><button class="btn-ghost btn-sm">Review</button></td></tr>
        </table>
      </div>
    </div>
  </div>

  <!-- MY RESULTS (Student) -->
  <div class="page" id="page-my-results">
    <div class="page-header">
      <div><div class="page-title">📈 My Results</div><div class="page-sub">Track your learning progress</div></div>
    </div>
    <div class="page-content">
      <div class="grid-3" style="margin-bottom:18px">
        <div class="stat-card"><div class="stat-label">Total Quizzes</div><div class="stat-num">8</div></div>
        <div class="stat-card"><div class="stat-label">Average Score</div><div class="stat-num">76%</div></div>
        <div class="stat-card"><div class="stat-label">Best Score</div><div class="stat-num">95%</div></div>
      </div>
      <div class="card">
        <div class="section-title">Quiz History</div>
        <table><tr><th>Quiz</th><th>Date</th><th>Score</th><th>Grade</th><th></th></tr>
        <tr><td>Photosynthesis</td><td>Mar 10</td><td>9/10</td><td><span class="badge badge-green">A+</span></td><td><button class="btn-ghost btn-sm" onclick="ExportService.exportToPDF({title:'Photosynthesis Quiz Result',content:'Score: 9/10 (90%) — Grade: A+'})">PDF</button></td></tr>
        <tr><td>Water Cycle</td><td>Mar 8</td><td>8/10</td><td><span class="badge badge-blue">A</span></td><td><button class="btn-ghost btn-sm">PDF</button></td></tr>
        <tr><td>Cell Biology</td><td>Mar 5</td><td>6/10</td><td><span class="badge badge-amber">C</span></td><td><button class="btn-ghost btn-sm">PDF</button></td></tr>
        </table>
      </div>
    </div>
  </div>

  <!-- WRITING FEEDBACK -->
  <div class="page" id="page-feedback">
    <div class="page-header">
      <div><div class="page-title">📝 Writing Feedback</div><div class="page-sub">AI-powered feedback — Glows, Grows, Next Steps</div></div>
    </div>
    <div class="page-content">
      <div class="tabs" style="margin-bottom:16px">
        <button class="tab active" onclick="setFbTab('single',this)">Single Student</button>
        <button class="tab" onclick="setFbTab('batch',this)">Batch Feedback</button>
        <button class="tab" onclick="setFbTab('inspect',this)">Inspect Writing</button>
      </div>
      <div id="fb-single-panel">
        <div class="grid-2">
          <div class="card">
            <div class="section-title">Student Writing</div>
            <div class="form-row">
              <div class="form-group"><label>Student Name</label><input type="text" id="fb-student" placeholder="Optional"/></div>
              <div class="form-group"><label>Feedback Style</label><select id="fb-style"><option>Glows & Grows</option><option>Rubric-Based</option><option>Next Steps Only</option><option>Comprehensive</option></select></div>
            </div>
            <div class="form-group"><label>Assignment Prompt</label><input type="text" id="fb-prompt" placeholder="e.g. Persuasive essay on climate change"/></div>
            <div class="form-group"><label>Paste Student Writing</label><textarea id="fb-text" style="min-height:180px" placeholder="Paste the student's writing here..."></textarea></div>
            <div id="fb-lang-container" style="margin-bottom:12px"></div>
            <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="generateFeedback()">✨ Generate Feedback</button>
          </div>
          <div class="card" style="display:flex;flex-direction:column;gap:10px">
            <div class="card-header">
              <div class="section-title" style="margin:0">AI Feedback</div>
              <div style="display:flex;gap:6px">
                <button class="btn btn-outline btn-sm" onclick="ExportService.exportToGoogleDocs('Feedback',document.getElementById('fb-output').textContent)">📄 Docs</button>
                <button class="btn btn-outline btn-sm" onclick="ExportService.exportToPDF({title:'Writing Feedback',content:document.getElementById('fb-output').textContent})">📑 PDF</button>
              </div>
            </div>
            <div id="fb-output" class="ai-box" style="flex:1;min-height:340px"><span style="color:var(--subtle)">Feedback will appear here.</span></div>
          </div>
        </div>
      </div>
      <div id="fb-batch-panel" class="hidden">
        <div class="card">
          <div class="section-title">Batch Feedback</div>
          <table><tr><th>#</th><th>Student</th><th>Preview</th><th>Status</th><th></th></tr>
          <tr><td>1</td><td>Arjun Sharma</td><td style="color:var(--muted)">The water cycle is...</td><td><span class="badge badge-green">Done</span></td><td><button class="btn-ghost btn-sm">View</button></td></tr>
          <tr><td>2</td><td>Meera Nair</td><td style="color:var(--muted)">In photosynthesis...</td><td><span class="badge badge-amber">Pending</span></td><td><button class="btn-ghost btn-sm">Add</button></td></tr>
          </table>
          <div style="margin-top:12px;display:flex;gap:8px">
            <button class="btn btn-outline btn-sm">+ Add Student</button>
            <button class="btn btn-primary btn-sm" onclick="generateFeedback()">✨ Run Batch</button>
          </div>
        </div>
      </div>
      <div id="fb-inspect-panel" class="hidden">
        <div class="card">
          <div class="section-title">🔍 Inspect Writing — Authenticity & Voice Analysis</div>
          <div class="form-group"><label>Paste writing to inspect</label><textarea style="min-height:130px" id="inspect-text" placeholder="Paste writing here..."></textarea></div>
          <button class="btn btn-primary btn-sm" onclick="runInspect()">🔍 Inspect</button>
          <div id="inspect-result-wrap" class="hidden mt-12">
            <div class="grid-3" style="margin-bottom:12px">
              <div class="stat-card"><div class="stat-label">Voice Consistency</div><div class="stat-num text-success" id="voice-score">High</div></div>
              <div class="stat-card"><div class="stat-label">Grade Level</div><div class="stat-num" style="color:var(--brand)" id="grade-score">Grade 8</div></div>
              <div class="stat-card"><div class="stat-label">AI Likelihood</div><div class="stat-num" style="color:var(--warn)" id="ai-score">Low</div></div>
            </div>
            <div class="ai-box" id="inspect-output"></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- STANDARDS LIBRARY -->
  <div class="page" id="page-standards">
    <div class="page-header">
      <div><div class="page-title">📚 Standards Library</div><div class="page-sub">NCERT, CBSE, NBA, NEP 2020 aligned standards</div></div>
    </div>
    <div class="page-content" id="standards-content">
      <div style="text-align:center;padding:40px;color:var(--muted)">Loading standards...</div>
    </div>
  </div>

  <!-- NBA CO-PO -->
  <div class="page" id="page-copo">
    <div class="page-header">
      <div><div class="page-title">📊 NBA CO-PO Attainment Matrix</div><div class="page-sub">Course Outcomes mapped to Programme Outcomes — NBA accreditation ready</div></div>
      <button class="btn btn-primary" onclick="exportCOPO()">📑 Export PDF</button>
    </div>
    <div class="page-content" id="copo-content">
      <div style="text-align:center;padding:40px;color:var(--muted)">Loading CO-PO matrix...</div>
    </div>
  </div>

  <!-- PODCAST STUDIO -->
  <div class="page" id="page-podcast">
    <div class="page-header">
      <div><div class="page-title">🎙️ Podcast Studio</div><div class="page-sub">Generate educational podcast scripts in any language</div></div>
    </div>
    <div class="page-content">
      <div class="grid-2">
        <div class="card">
          <div class="section-title">🎬 Script Generator</div>
          <div class="form-group"><label>Podcast Topic</label><input type="text" id="pod-topic" placeholder="Water Cycle, World War II, Algebra..."/></div>
          <div class="form-row">
            <div class="form-group"><label>Format</label><select id="pod-format"><option>Interview Style</option><option>Single Host</option><option>Debate</option><option>Storytelling</option></select></div>
            <div class="form-group"><label>Duration</label><select id="pod-dur"><option>5 min</option><option selected>10 min</option><option>15 min</option><option>20 min</option></select></div>
          </div>
          <div class="form-group"><label>Grade Level</label><select id="pod-grade"><option>Grade 5-6</option><option selected>Grade 7-8</option><option>Grade 9-10</option><option>Grade 11-12</option></select></div>
          <div class="form-group"><label>Learning Goal</label><textarea id="pod-goal" style="min-height:60px" placeholder="What should students understand?"></textarea></div>
          <div id="pod-lang-container" style="margin-bottom:12px"></div>
          <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="generatePodcast()">🎙️ Generate Script</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="card">
            <div class="section-title">📻 Episode Library</div>
            <div style="display:flex;flex-direction:column;gap:8px">
              ${buildEpisodeCards()}
            </div>
          </div>
          <div class="card" style="flex:1">
            <div class="card-header">
              <div class="section-title" style="margin:0">Generated Script</div>
              <button class="btn btn-outline btn-sm" onclick="ExportService.exportToPDF({title:document.getElementById('pod-topic').value||'Podcast Script',content:document.getElementById('pod-output').textContent})">📑 PDF</button>
            </div>
            <div id="pod-output" class="ai-box" style="min-height:150px"><span style="color:var(--subtle)">Your podcast script will appear here.</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- SETTINGS -->
  <div class="page" id="page-settings">
    <div class="page-header">
      <div><div class="page-title">⚙️ Settings</div><div class="page-sub">Account, language, notifications</div></div>
    </div>
    <div class="page-content">
      <div class="grid-2">
        <div class="card">
          <div class="section-title">👤 Account</div>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
            <div class="avatar avatar-lg avatar-${user.role}">${user.avatar || user.name.slice(0,2)}</div>
            <div><div style="font-weight:600">${user.name}</div><div style="font-size:12px;color:var(--muted)">${user.email}</div><span class="badge badge-${user.role}" style="margin-top:4px">${user.role}</span></div>
          </div>
          <div class="form-group"><label>Change Password</label><input type="password" id="new-pwd" placeholder="New password"/></div>
          <button class="btn btn-outline btn-sm" onclick="changePassword()">Update Password</button>
          <div class="divider"></div>
          <div class="section-title">📧 EmailJS Configuration</div>
          <div class="form-group"><label>Public Key</label><input type="text" id="ejs-key" placeholder="Your EmailJS public key" value="${EmailService.CONFIG.PUBLIC_KEY !== 'YOUR_EMAILJS_PUBLIC_KEY' ? '••••••••' : ''}"/></div>
          <div class="form-group"><label>Service ID</label><input type="text" id="ejs-service" placeholder="e.g. service_gmail"/></div>
          <button class="btn btn-outline btn-sm" onclick="saveEmailJSConfig()">Save Email Config</button>
        </div>
        <div class="card">
          <div class="section-title">🌐 Language & Localization</div>
          <div id="settings-lang-container"></div>
          <div class="divider"></div>
          <div class="section-title">📱 App Installation</div>
          <p style="font-size:13px;color:var(--muted);margin-bottom:12px">Install Shiva's Pro Learning as a mobile app for offline access. Your data syncs automatically when you reconnect.</p>
          <button class="btn btn-primary btn-sm" onclick="PWA.installApp()">📱 Install as App</button>
          <div class="divider"></div>
          <div class="section-title">🔔 Notifications</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" checked style="width:auto"/> Email notifications for quiz results</label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" checked style="width:auto"/> Account approval notifications</label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" style="width:auto"/> Weekly progress reports</label>
          </div>
        </div>
      </div>
    </div>
  </div>
  `;
}

function buildEpisodeCards() {
  const eps = [
    { id:'wave1', icon:'🌍', title:'The Water Cycle Explained', meta:'Grade 7-8 · 10 min · Interview' },
    { id:'wave2', icon:'🔬', title:'Photosynthesis Deep Dive', meta:'Grade 8 · 15 min · Single Host' },
    { id:'wave3', icon:'⚡', title:'Electric Circuits Basics', meta:'Grade 7 · 8 min · Storytelling' },
  ];
  return eps.map(e => `
    <div class="podcast-card">
      <div class="podcast-thumb">${e.icon}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600">${e.title}</div>
        <div style="font-size:12px;color:var(--muted)">${e.meta}</div>
        <div id="${e.id}" class="wave paused" style="margin-top:4px"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
      </div>
      <button class="podcast-play" onclick="togglePlay('${e.id}',this)">▶</button>
    </div>
  `).join('');
}

// ── Tab Helper ───────────────────────────────────────────────
let playingWave = null;
function setTab(tabsId, btnOrIndex, indexOrVoid) {
  const tabs = document.getElementById(tabsId);
  if (!tabs) return;
  const btns = tabs.querySelectorAll('.tab');
  let idx = typeof btnOrIndex === 'number' ? btnOrIndex : Array.from(btns).indexOf(btnOrIndex);
  btns.forEach((b,i) => b.classList.toggle('active', i === idx));
  // Update gen form title
  if (tabsId === 'gen-tabs') {
    const titles = ['Lesson Plan Generator','Quiz Generator','Rubric Builder','Slide Deck Generator','Worksheet Generator'];
    const t = document.getElementById('gen-form-title');
    if (t) t.textContent = titles[idx] || 'Content Generator';
  }
}
window.setTab = setTab;

function togglePlay(waveId, btn) {
  const wave = document.getElementById(waveId);
  const isPlaying = !wave.classList.contains('paused');
  if (playingWave && playingWave !== waveId) {
    document.getElementById(playingWave)?.classList.add('paused');
    document.querySelectorAll('.podcast-play').forEach(b => b.textContent='▶');
  }
  wave.classList.toggle('paused', isPlaying);
  btn.textContent = isPlaying ? '▶' : '⏸';
  playingWave = isPlaying ? null : waveId;
}
window.togglePlay = togglePlay;

// ── Page: Admin ──────────────────────────────────────────────
async function renderAdminPage() {
  const users = await DB.getAll(DB.STORES.users);
  const pending = users.filter(u => u.status === 'pending');
  const el = document.getElementById('admin-content');

  // Update pending badge
  const pc = document.getElementById('pending-count');
  if (pc) { pc.textContent = pending.length; pc.style.display = pending.length ? '' : 'none'; }

  const stats = {
    total: users.length,
    admins: users.filter(u=>u.role==='admin').length,
    faculty: users.filter(u=>u.role==='faculty').length,
    students: users.filter(u=>u.role==='student').length,
    pending: pending.length,
  };

  el.innerHTML = `
    <div class="grid-4" style="margin-bottom:18px">
      <div class="stat-card"><div class="stat-label">Total Users</div><div class="stat-num">${stats.total}</div></div>
      <div class="stat-card"><div class="stat-label">Faculty</div><div class="stat-num">${stats.faculty}</div></div>
      <div class="stat-card"><div class="stat-label">Students</div><div class="stat-num">${stats.students}</div></div>
      <div class="stat-card"><div class="stat-label">Pending Approval</div><div class="stat-num" style="color:${stats.pending?'var(--warn)':'var(--success)'}">${stats.pending}</div></div>
    </div>
    ${pending.length > 0 ? `
    <div class="card" style="margin-bottom:18px;border-color:var(--warn)">
      <div class="section-title">⚠️ Pending Approvals (${pending.length})</div>
      <div class="table-wrap"><table>
        <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Date</th><th>Actions</th></tr>
        ${pending.map(u => `
          <tr>
            <td><div style="display:flex;align-items:center;gap:8px"><div class="avatar avatar-faculty" style="width:28px;height:28px;font-size:11px">${u.avatar}</div>${u.name}</div></td>
            <td>${u.email}</td>
            <td><span class="badge badge-faculty">${u.role}</span></td>
            <td>${u.department || '—'}</td>
            <td>${new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
            <td>
              <button class="btn btn-success btn-xs" onclick="approveUser('${u.id}')">✅ Approve</button>
              <button class="btn btn-danger btn-xs" style="margin-left:4px" onclick="rejectUser('${u.id}')">❌ Reject</button>
            </td>
          </tr>
        `).join('')}
      </table></div>
    </div>
    ` : ''}
    <div class="card">
      <div class="card-header">
        <div class="section-title" style="margin:0">All Users</div>
        <button class="btn btn-primary btn-sm" onclick="showPage('manage-users')">Manage All</button>
      </div>
      <div class="table-wrap"><table>
        <tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
        ${users.slice(0,8).map(u => `
          <tr>
            <td><div style="display:flex;align-items:center;gap:8px"><div class="avatar avatar-${u.role}" style="width:28px;height:28px;font-size:11px">${u.avatar}</div><div><div style="font-weight:500">${u.name}</div><div style="font-size:11px;color:var(--muted)">${u.email}</div></div></div></td>
            <td><span class="badge badge-${u.role}">${u.role}</span></td>
            <td><span class="badge ${u.status==='active'?'badge-green':u.status==='pending'?'badge-amber':'badge-red'}">${u.status}</span></td>
            <td style="font-size:12px">${new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
            <td><button class="btn-ghost btn-xs" onclick="resetUserPassword('${u.id}')">🔑 Reset Pwd</button></td>
          </tr>
        `).join('')}
      </table></div>
    </div>
  `;
}

async function approveUser(userId) {
  const user = await DB.get(DB.STORES.users, userId);
  if (!user) return;
  const tempPwd = 'BL@' + Math.random().toString(36).slice(2,8).toUpperCase();
  user.status = 'active';
  user.password = tempPwd;
  await DB.put(DB.STORES.users, user);
  await EmailService.sendFacultyWelcome({ name: user.name, email: user.email, password: tempPwd, institution: 'Shiva's Pro Learning Academy' });
  toast(`✅ ${user.name} approved! Credentials sent via email.`, 'success');
  renderAdminPage();
}
window.approveUser = approveUser;

async function rejectUser(userId) {
  const user = await DB.get(DB.STORES.users, userId);
  if (!user) return;
  user.status = 'rejected';
  await DB.put(DB.STORES.users, user);
  await EmailService.sendRejectionNotification({ name: user.name, email: user.email });
  toast(`${user.name}'s application rejected. Notification sent.`, 'info');
  renderAdminPage();
}
window.rejectUser = rejectUser;

async function resetUserPassword(userId) {
  const user = await DB.get(DB.STORES.users, userId);
  if (!user) return;
  const tempPwd = 'Reset@' + Math.random().toString(36).slice(2,7).toUpperCase();
  user.password = tempPwd;
  await DB.put(DB.STORES.users, user);
  await EmailService.sendPasswordReset({ name: user.name, email: user.email, tempPassword: tempPwd });
  toast(`🔑 Password reset for ${user.name}. Email sent.`, 'success');
}
window.resetUserPassword = resetUserPassword;

// ── Page: Standards Library ──────────────────────────────────
async function renderStandardsPage() {
  const standards = await DB.getAll(DB.STORES.standards);
  const el = document.getElementById('standards-content');
  const boards = [...new Set(standards.map(s=>s.board))];

  el.innerHTML = `
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:16px;flex-wrap:wrap">
      <input type="text" id="std-search" placeholder="🔍 Search standards..." style="max-width:300px" oninput="filterStandards()"/>
      <select id="std-board" onchange="filterStandards()" style="width:auto">
        <option value="">All Boards</option>
        ${boards.map(b=>`<option value="${b}">${b}</option>`).join('')}
      </select>
      <button class="btn btn-outline btn-sm" onclick="generateFromStandard()">✨ Generate Content from Standard</button>
    </div>
    <div id="standards-list">
      ${standards.map(s => `
        <div class="standard-item" onclick="selectStandard('${s.code}')">
          <span class="standard-code">${s.code}</span>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:600">${s.description}</div>
            <div style="font-size:12px;color:var(--muted)">${s.board} · ${s.subject} · Grade ${s.grade}</div>
          </div>
          <button class="btn btn-outline btn-xs" onclick="event.stopPropagation();useStandard('${s.code}','${s.description}')">Use →</button>
        </div>
      `).join('')}
    </div>
  `;
}

function filterStandards() {
  const q = document.getElementById('std-search')?.value.toLowerCase() || '';
  const board = document.getElementById('std-board')?.value || '';
  document.querySelectorAll('.standard-item').forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = (text.includes(q) && (!board || text.includes(board.toLowerCase()))) ? '' : 'none';
  });
}
window.filterStandards = filterStandards;

function useStandard(code, desc) {
  showPage('generator');
  const inp = document.getElementById('gen-standard');
  const topic = document.getElementById('gen-topic');
  if (inp) inp.value = code;
  if (topic) topic.value = desc;
  toast(`📚 Standard ${code} loaded into generator!`, 'success');
}
window.useStandard = useStandard;
window.selectStandard = function(code) { toast(`Standard ${code} selected`, 'info'); };
window.generateFromStandard = function() { showPage('generator'); };

// ── Page: CO-PO Matrix ───────────────────────────────────────
function renderCOPOPage() {
  const el = document.getElementById('copo-content');
  const COs = ['CO1: Explain photosynthesis mechanism','CO2: Analyze plant cell structure','CO3: Apply scientific method','CO4: Evaluate experimental data','CO5: Design basic experiments'];
  const POs = ['PO1','PO2','PO3','PO4','PO5','PO6'];

  // Init matrix if not set
  if (!State.coPoMatrix.length) {
    State.coPoMatrix = COs.map(() => POs.map(() => 0));
    // Set some demo values
    [[0,0,3],[0,1,2],[0,2,1],[1,1,3],[1,3,2],[2,2,3],[2,4,2],[3,3,3],[3,5,1],[4,0,2],[4,2,3]].forEach(([r,c,v]) => { State.coPoMatrix[r][c] = v; });
  }

  el.innerHTML = `
    <div class="card" style="margin-bottom:16px">
      <div class="form-row" style="margin-bottom:12px">
        <div class="form-group"><label>Course Name</label><input type="text" id="copo-course" value="Science Grade 8 — Photosynthesis Unit"/></div>
        <div class="form-group"><label>Programme</label><select id="copo-prog"><option>B.Ed.</option><option>M.Ed.</option><option>B.Sc.</option><option>B.Tech.</option></select></div>
      </div>
      <p style="font-size:12px;color:var(--muted);margin-bottom:12px">Click a cell to cycle: No mapping (—) → Low (1) → Medium (2) → High (3)</p>
      <div class="table-wrap">
        <table class="matrix-table">
          <tr>
            <th style="text-align:left;min-width:200px">Course Outcome</th>
            ${POs.map(po=>`<th>${po}</th>`).join('')}
          </tr>
          ${COs.map((co, ci) => `
            <tr>
              <td style="font-size:12px;font-weight:500">${co}</td>
              ${POs.map((po, pi) => `
                <td>
                  <div class="co-cell co-${State.coPoMatrix[ci][pi]}"
                    id="cell-${ci}-${pi}"
                    onclick="cycleCell(${ci},${pi})"
                    title="${co} → ${po}">
                    ${State.coPoMatrix[ci][pi] || '—'}
                  </div>
                </td>
              `).join('')}
            </tr>
          `).join('')}
          <tr style="background:var(--surface2)">
            <td style="font-size:12px;font-weight:700;color:var(--muted)">Avg. Attainment</td>
            ${POs.map((po, pi) => {
              const avg = COs.reduce((s,_,ci) => s + State.coPoMatrix[ci][pi], 0) / COs.length;
              return `<td style="font-size:12px;font-weight:700;color:var(--brand)">${avg.toFixed(1)}</td>`;
            }).join('')}
          </tr>
        </table>
      </div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="section-title">📊 Attainment Summary</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${POs.map((po,pi) => {
            const avg = COs.reduce((s,_,ci) => s + State.coPoMatrix[ci][pi], 0) / COs.length;
            const pct = (avg / 3) * 100;
            const color = pct >= 60 ? 'var(--success)' : pct >= 40 ? 'var(--warn)' : 'var(--danger)';
            return `<div><div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="font-size:12px;font-weight:500">${po}</span><span style="font-size:12px;color:${color}">${avg.toFixed(2)}/3.0</span></div><div class="progress"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div></div>`;
          }).join('')}
        </div>
      </div>
      <div class="card">
        <div class="section-title">🤖 AI CO-PO Analysis</div>
        <button class="btn btn-primary btn-sm" style="margin-bottom:12px" onclick="analyzeCoPoWithAI()">✨ Analyze & Suggest Improvements</button>
        <div id="copo-ai-output" class="ai-box" style="min-height:180px"><span style="color:var(--subtle)">Click Analyze to get AI suggestions for improving CO-PO attainment.</span></div>
      </div>
    </div>
    <div style="margin-top:8px;display:flex;gap:8px">
      <div style="font-size:12px;color:var(--muted);display:flex;gap:12px;align-items:center">
        <span style="font-weight:600">Legend:</span>
        <span><span class="co-cell co-0" style="display:inline-flex;width:22px;height:22px">—</span> No mapping</span>
        <span><span class="co-cell co-1" style="display:inline-flex;width:22px;height:22px">1</span> Low</span>
        <span><span class="co-cell co-2" style="display:inline-flex;width:22px;height:22px">2</span> Medium</span>
        <span><span class="co-cell co-3" style="display:inline-flex;width:22px;height:22px">3</span> High</span>
      </div>
    </div>
  `;
}

function cycleCell(ci, pi) {
  State.coPoMatrix[ci][pi] = (State.coPoMatrix[ci][pi] + 1) % 4;
  const cell = document.getElementById(`cell-${ci}-${pi}`);
  if (cell) {
    cell.className = `co-cell co-${State.coPoMatrix[ci][pi]}`;
    cell.textContent = State.coPoMatrix[ci][pi] || '—';
  }
}
window.cycleCell = cycleCell;

async function analyzeCoPoWithAI() {
  const matrixSummary = State.coPoMatrix.map((row, i) =>
    `CO${i+1}: ${row.map((v,j) => `PO${j+1}=${v}`).join(', ')}`
  ).join('\n');
  const prompt = `Analyze this NBA CO-PO attainment matrix for a Science course and provide:\n1. Overall attainment assessment\n2. Weak CO-PO linkages that need improvement\n3. Specific teaching strategies to improve low-mapped outcomes\n4. NBA accreditation readiness score (out of 10)\n\nMatrix:\n${matrixSummary}`;
  callAI(prompt, 'copo-ai-output');
}
window.analyzeCoPoWithAI = analyzeCoPoWithAI;

function exportCOPO() {
  const course = document.getElementById('copo-course')?.value || 'Course';
  const COs = ['CO1','CO2','CO3','CO4','CO5'];
  const POs = ['PO1','PO2','PO3','PO4','PO5','PO6'];
  ExportService.exportCOPOMatrix(course, COs, POs, State.coPoMatrix);
}
window.exportCOPO = exportCOPO;

// ── AI Generator ─────────────────────────────────────────────
function generateContent() {
  const topic    = document.getElementById('gen-topic')?.value || 'General topic';
  const grade    = document.getElementById('gen-grade')?.value || 'Grade 8';
  const dur      = document.getElementById('gen-dur')?.value || '45 min';
  const notes    = document.getElementById('gen-notes')?.value || '';
  const standard = document.getElementById('gen-standard')?.value || '';
  const tabs     = document.getElementById('gen-tabs')?.querySelectorAll('.tab');
  const activeIdx= tabs ? Array.from(tabs).findIndex(t => t.classList.contains('active')) : 0;
  const types = ['lesson','quiz','rubric','slides','worksheet'];
  const type = types[activeIdx] || 'lesson';

  const prompts = {
    lesson: `Create a detailed ${dur} lesson plan for ${grade} students on: "${topic}". Include: Learning Objectives, Materials, Introduction/Hook, Main Activity, Discussion Questions, Assessment, Differentiation. ${standard ? 'Align to: '+standard+'.' : ''} ${notes}`,
    quiz: `Create a 10-question quiz for ${grade} on: "${topic}". Mix multiple choice and short answer. Provide answer key at the end. ${notes}`,
    rubric: `Create a grading rubric for ${grade} on: "${topic}". Include 4-5 criteria with Excellent/Proficient/Developing/Beginning levels. ${notes}`,
    slides: `Create a slide deck outline (8-10 slides) for ${grade} on: "${topic}" (${dur}). Include slide title, 3-4 bullet points, and visual suggestion for each. ${notes}`,
    worksheet: `Create a student worksheet for ${grade} on: "${topic}". Include 5 fill-in-the-blank, 3 short answer, and 2 diagram-labeling activities. ${notes}`,
  };

  callAI(prompts[type], 'gen-output', async (text) => {
    // Save to library
    const user = Auth.getUser();
    await DB.put(DB.STORES.materials, {
      id: 'mat-' + Date.now(), title: topic, type, content: text,
      grade, duration: dur, createdBy: user?.id,
      createdAt: new Date().toISOString()
    });
    loadRecentMaterials();
  });
}
window.generateContent = generateContent;

async function saveContent() {
  const content = document.getElementById('gen-output')?.textContent || '';
  const topic   = document.getElementById('gen-topic')?.value || 'Content';
  if (!content || content.includes('will appear here')) { toast('Generate content first', 'error'); return; }
  toast('💾 Saved to library!', 'success');
}
window.saveContent = saveContent;

function exportGenPDF() {
  const topic   = document.getElementById('gen-topic')?.value || 'Generated Content';
  const content = document.getElementById('gen-output')?.textContent || '';
  const grade   = document.getElementById('gen-grade')?.value;
  const dur     = document.getElementById('gen-dur')?.value;
  ExportService.exportToPDF({ title: topic, content, metadata: { grade, duration: dur, author: Auth.getUser()?.name } });
}
window.exportGenPDF = exportGenPDF;

async function loadRecentMaterials() {
  const user = Auth.getUser();
  if (!user) return;
  const mats = await DB.getAll(DB.STORES.materials);
  const el = document.getElementById('recent-materials-list');
  if (!el) return;
  const mc = document.getElementById('mat-count');
  if (mc) mc.textContent = mats.length;
  if (!mats.length) { el.innerHTML = '<div style="color:var(--muted);font-size:13px">No materials yet. Create your first with AI!</div>'; return; }
  const typeColors = { lesson:'badge-green', quiz:'badge-blue', rubric:'badge-purple', slides:'badge-amber', worksheet:'badge-gray' };
  el.innerHTML = `<table><tr><th>Title</th><th>Type</th><th>Date</th><th></th></tr>
  ${mats.slice(-5).reverse().map(m => `
    <tr>
      <td style="font-weight:500">${m.title}</td>
      <td><span class="badge ${typeColors[m.type]||'badge-gray'}">${m.type}</span></td>
      <td style="font-size:12px;color:var(--muted)">${new Date(m.createdAt).toLocaleDateString('en-IN')}</td>
      <td><button class="btn-ghost btn-xs" onclick="viewMaterial('${m.id}')">View</button></td>
    </tr>
  `).join('')}</table>`;
}

async function viewMaterial(id) {
  const mat = await DB.get(DB.STORES.materials, id);
  if (!mat) return;
  document.getElementById('material-modal-title').textContent = mat.title;
  document.getElementById('material-modal-content').textContent = mat.content;
  openModal('material-modal');
}
window.viewMaterial = viewMaterial;

// ── Quiz Builder & Auto-Grader ───────────────────────────────
async function generateQuiz() {
  const topic = document.getElementById('qb-topic')?.value || 'Science';
  const grade = document.getElementById('qb-grade')?.value;
  const count = document.getElementById('qb-count')?.value || '10';
  const type  = document.getElementById('qb-type')?.value;
  const diff  = document.getElementById('qb-diff')?.value;

  const prompt = `Create exactly ${count} ${type} questions (${diff} difficulty) for ${grade} on "${topic}".

Format STRICTLY as JSON array:
[
  {
    "q": "Question text",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "answer": "A",
    "explanation": "Brief explanation"
  }
]

For True/False, options should be ["A) True", "B) False"].
Return ONLY the JSON array, no other text.`;

  const area = document.getElementById('quiz-preview-area');
  area.innerHTML = `<div class="ai-box" style="min-height:200px"><div class="ai-thinking"><div class="dot-spin"><span></span><span></span><span></span></div> Generating quiz...</div></div>`;

  try {
    const res = await fetch(API, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ model:MODEL, max_tokens:2000, messages:[{role:'user',content:prompt}] })
    });
    const data = await res.json();
    const raw = data.content?.map(b=>b.text||'').join('') || '';
    const clean = raw.replace(/```json|```/g,'').trim();
    const questions = JSON.parse(clean);
    State.quizData = { topic, grade, questions };
    renderQuizPreview(questions, topic);
    toast('✅ Quiz generated! Share with students.', 'success');
  } catch(e) {
    area.innerHTML = `<div class="ai-box" style="min-height:200px"><span style="color:var(--danger)">Failed to parse quiz. Please try again.</span></div>`;
  }
}
window.generateQuiz = generateQuiz;

function renderQuizPreview(questions, title) {
  const area = document.getElementById('quiz-preview-area');
  area.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <div class="section-title" style="margin:0">${title} — ${questions.length} Questions</div>
      <div style="display:flex;gap:6px">
        <button class="btn btn-outline btn-sm" onclick="ExportService.exportToPDF({title:'${title} Quiz',content:${JSON.stringify(questions.map((q,i)=>`Q${i+1}. ${q.q}\n${q.options.join('\n')}\nAnswer: ${q.answer}`).join('\n\n'))}})">📑 PDF</button>
        <button class="btn btn-primary btn-sm" onclick="showPage('take-quiz');loadQuizForStudent()">Share to Students</button>
      </div>
    </div>
    <div style="max-height:360px;overflow-y:auto;display:flex;flex-direction:column;gap:12px">
      ${questions.map((q,i) => `
        <div style="padding:10px;background:var(--surface2);border-radius:8px;border:1px solid var(--border)">
          <div style="font-size:13px;font-weight:600;margin-bottom:7px">Q${i+1}. ${q.q}</div>
          <div style="display:flex;flex-direction:column;gap:4px">
            ${q.options.map(o => `<div style="font-size:12px;padding:4px 8px;border-radius:5px;background:${o.startsWith(q.answer)?'#DCFCE7':'var(--surface)'};color:${o.startsWith(q.answer)?'#15803D':'var(--text)'};">${o}</div>`).join('')}
          </div>
          <div style="font-size:11px;color:var(--muted);margin-top:5px">✅ ${q.answer} · ${q.explanation}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function startDemoQuiz() {
  if (!State.quizData) {
    State.quizData = {
      topic: 'Photosynthesis', grade: 'Grade 8',
      questions: [
        { q:'What is the primary product of photosynthesis?', options:['A) Oxygen','B) Glucose','C) Carbon dioxide','D) Water'], answer:'B', explanation:'Glucose (C6H12O6) is the primary product.' },
        { q:'Which organelle is responsible for photosynthesis?', options:['A) Mitochondria','B) Nucleus','C) Chloroplast','D) Ribosome'], answer:'C', explanation:'Chloroplasts contain chlorophyll.' },
        { q:'What gas is released as a by-product?', options:['A) Nitrogen','B) Carbon dioxide','C) Oxygen','D) Hydrogen'], answer:'C', explanation:'Oxygen is released.' },
        { q:'Photosynthesis requires sunlight', options:['A) True','B) False'], answer:'A', explanation:'Light energy drives the process.' },
        { q:'The raw materials for photosynthesis are:', options:['A) O2 and glucose','B) CO2 and water','C) Starch and oxygen','D) Sugar and sunlight'], answer:'B', explanation:'CO2 from air and H2O from roots.' },
      ]
    };
  }
  showStudentQuizPage(State.quizData.questions, State.quizData.topic);
}
window.startDemoQuiz = startDemoQuiz;

function showStudentQuizPage(questions, title) {
  State.quizAnswers = {};
  State.quizSubmitted = false;
  const content = document.getElementById('take-quiz-content');
  content.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div class="section-title" style="margin:0">📝 ${title}</div>
        <span class="badge badge-blue">${questions.length} Questions</span>
      </div>
      <div id="quiz-questions">
        ${questions.map((q,i) => `
          <div style="margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid var(--border)">
            <div style="font-size:14px;font-weight:600;margin-bottom:10px">Q${i+1}. ${q.q}</div>
            ${q.options.map((o,oi) => `
              <div class="quiz-option" id="opt-${i}-${oi}" onclick="selectAnswer(${i},${oi},'${o.charAt(0)}')">
                <div class="quiz-letter" id="ql-${i}-${oi}">${o.charAt(0)}</div>
                <span style="font-size:13px">${o.slice(3)}</span>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
      <button class="btn btn-primary" style="width:100%;justify-content:center" id="submit-quiz-btn" onclick="submitQuiz(${JSON.stringify(questions).replace(/"/g,'&quot;')})">Submit Quiz →</button>
    </div>
  `;
}
window.loadQuizForStudent = function() { startDemoQuiz(); };

function selectAnswer(qi, oi, letter) {
  // Clear previous selection for this question
  document.querySelectorAll(`[id^="opt-${qi}-"]`).forEach(el => el.classList.remove('selected'));
  document.getElementById(`opt-${qi}-${oi}`)?.classList.add('selected');
  State.quizAnswers[qi] = letter;
}
window.selectAnswer = selectAnswer;

function submitQuiz(questions) {
  if (Object.keys(State.quizAnswers).length < questions.length) {
    toast('Please answer all questions before submitting', 'warn'); return;
  }
  let score = 0;
  questions.forEach((q,i) => {
    const correct = State.quizAnswers[i] === q.answer;
    if (correct) score++;
    document.querySelectorAll(`[id^="opt-${i}-"]`).forEach(el => {
      const letter = el.querySelector('.quiz-letter')?.textContent;
      if (letter === q.answer) el.classList.add('correct');
      else if (letter === State.quizAnswers[i]) el.classList.add('wrong');
    });
  });
  const pct = Math.round((score / questions.length) * 100);
  const grade = pct>=90?'A+':pct>=80?'A':pct>=70?'B':pct>=60?'C':pct>=50?'D':'F';
  const gradeColor = pct>=70?'var(--success)':pct>=50?'var(--warn)':'var(--danger)';

  document.getElementById('submit-quiz-btn')?.replaceWith(Object.assign(document.createElement('div'), { innerHTML: `
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px;text-align:center;margin-top:14px">
      <div style="font-size:32px;font-weight:700;color:${gradeColor}">${score}/${questions.length}</div>
      <div style="font-size:24px;font-weight:700;color:${gradeColor}">${pct}% — Grade ${grade}</div>
      <div style="font-size:13px;color:var(--muted);margin-top:6px">Quiz completed! Review your answers above.</div>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:12px">
        <button class="btn btn-outline btn-sm" onclick="ExportService.exportToPDF({title:'Quiz Result',content:'Score: ${score}/${questions.length} (${pct}%) - Grade: ${grade}'})">📑 Export Result</button>
        <button class="btn btn-primary btn-sm" onclick="showPage('my-results')">View All Results</button>
      </div>
    </div>
  `}));

  // Auto-send email result
  const user = Auth.getUser();
  if (user?.role === 'student') {
    EmailService.sendQuizResult({ studentName: user.name, studentEmail: user.email, quizTitle: State.quizData?.topic || 'Quiz', score, total: questions.length, percentage: pct });
  }

  // Save result to DB
  DB.put(DB.STORES.quizSubmissions, {
    studentId: user?.id, quizId: State.quizData?.topic,
    score, total: questions.length, answers: State.quizAnswers,
    submittedAt: new Date().toISOString()
  });
}
window.submitQuiz = submitQuiz;

// ── Writing Feedback ─────────────────────────────────────────
function setFbTab(tab, btn) {
  ['single','batch','inspect'].forEach(t => {
    document.getElementById(`fb-${t}-panel`)?.classList.toggle('hidden', t !== tab);
  });
  document.querySelectorAll('#page-feedback .tab').forEach(b => b.classList.remove('active'));
  btn?.classList.add('active');
}
window.setFbTab = setFbTab;

function generateFeedback() {
  const text    = document.getElementById('fb-text')?.value || '';
  const prompt2 = document.getElementById('fb-prompt')?.value || 'writing assignment';
  const style   = document.getElementById('fb-style')?.value || 'Glows & Grows';
  const student = document.getElementById('fb-student')?.value || 'the student';
  if (!text.trim()) { toast('Please paste student writing first', 'error'); return; }
  const prompt = `You are an expert teacher giving ${style} feedback on ${student}'s writing.\n\nAssignment: ${prompt2}\n\nWriting:\n"${text}"\n\nProvide structured, encouraging, actionable feedback. Be specific with examples from their text.`;
  callAI(prompt, 'fb-output');
}
window.generateFeedback = generateFeedback;

function runInspect() {
  const text = document.getElementById('inspect-text')?.value || '';
  if (!text.trim()) return;
  document.getElementById('inspect-result-wrap')?.classList.remove('hidden');
  const prompt = `Analyze this student writing for:
1. Voice and authenticity (High/Medium/Low)
2. Vocabulary grade level
3. AI-generated content likelihood (High/Medium/Low) 
4. Structural patterns
5. Strengths and areas for growth

Be concise and teacher-friendly. Start with a quick summary.

Writing: "${text}"`;
  callAI(prompt, 'inspect-output');
}
window.runInspect = runInspect;

// ── Boost (Student AI Tutor) ─────────────────────────────────
function boostAction(type) {
  const work = document.getElementById('boost-work')?.value || '';
  const prompts = {
    hint: `A Grade 8 student is writing about the water cycle. Give a brief, encouraging hint to help them get unstuck. ${work ? 'Their writing: "'+work.slice(0,200)+'"' : ''}`,
    check: `Briefly review this work-in-progress (water cycle): "${work.slice(0,300)||'(no text yet)'}". What's working? One thing to improve?`,
    feedback: `Give Glows & Grows feedback on this Grade 8 essay: "${work.slice(0,500)||'(no text yet)'}". Be specific and brief.`,
  };
  const userMsgs = { hint:'💡 Give me a hint', check:'✅ Check my work', feedback:'📝 Give me feedback' };
  addChatMsg(userMsgs[type], 'user');
  streamBoostResponse(prompts[type]);
}
window.boostAction = boostAction;

function boostSend() {
  const input = document.getElementById('boost-msg');
  const msg = input?.value?.trim();
  if (!msg) return;
  addChatMsg(msg, 'user');
  input.value = '';
  const prompt = `You're a helpful AI learning assistant for Grade 8 students. Answer concisely and encouragingly: "${msg}"`;
  streamBoostResponse(prompt);
}
window.boostSend = boostSend;

async function streamBoostResponse(prompt) {
  const area = document.getElementById('boost-chat');
  const thinking = document.createElement('div');
  thinking.className = 'msg msg-ai ai-thinking';
  thinking.innerHTML = '<div class="dot-spin"><span></span><span></span><span></span></div>';
  area.appendChild(thinking);
  area.scrollTop = area.scrollHeight;

  if (!navigator.onLine) {
    thinking.remove();
    addChatMsg('You\'re offline. I\'ll answer when you reconnect!', 'ai');
    DB.queueSync('boost_chat', { prompt });
    return;
  }

  try {
    const res = await fetch(API, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ model:MODEL, max_tokens:400, messages:[{role:'user',content:prompt}] })
    });
    const data = await res.json();
    const text = data.content?.map(b=>b.text||'').join('') || 'Sorry, try again!';
    thinking.remove();
    addChatMsg(text, 'ai');
  } catch(e) {
    thinking.remove();
    addChatMsg('Connection error. Please try again.', 'ai');
  }
}

function addChatMsg(text, role) {
  const area = document.getElementById('boost-chat');
  if (!area) return;
  const msg = document.createElement('div');
  msg.className = 'msg msg-' + role;
  msg.textContent = text;
  area.appendChild(msg);
  area.scrollTop = area.scrollHeight;
}

// ── Podcast ──────────────────────────────────────────────────
function generatePodcast() {
  const topic  = document.getElementById('pod-topic')?.value || 'Science';
  const format = document.getElementById('pod-format')?.value;
  const dur    = document.getElementById('pod-dur')?.value;
  const grade  = document.getElementById('pod-grade')?.value;
  const goal   = document.getElementById('pod-goal')?.value;
  const prompt = `Write a ${dur} educational podcast script in ${format} format for ${grade} students on: "${topic}". ${goal ? 'Goal: '+goal : ''}\n\nInclude intro, engaging content with dialogue, key facts, and reflection question at the end. Use natural conversational language. Label speakers as HOST/GUEST.`;
  callAI(prompt, 'pod-output');
}
window.generatePodcast = generatePodcast;

// ── Settings ─────────────────────────────────────────────────
async function changePassword() {
  const pwd = document.getElementById('new-pwd')?.value;
  if (!pwd || pwd.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }
  const user = Auth.getUser();
  await Auth.changePassword(user.id, pwd);
  toast('✅ Password updated!', 'success');
  document.getElementById('new-pwd').value = '';
}
window.changePassword = changePassword;

function saveEmailJSConfig() {
  const key = document.getElementById('ejs-key')?.value;
  const svc = document.getElementById('ejs-service')?.value;
  if (key && key !== '••••••••') {
    EmailService.CONFIG.PUBLIC_KEY = key;
    EmailService.CONFIG.SERVICE_ID = svc;
    EmailService.init();
    toast('✅ EmailJS configured!', 'success');
  }
}
window.saveEmailJSConfig = saveEmailJSConfig;

async function doLogout() {
  await Auth.logout();
  State.user = null;
  renderLogin();
}
window.doLogout = doLogout;

// ── Language selectors ────────────────────────────────────────
function initLangSelectors() {
  ['gen-lang-container','boost-lang-container','fb-lang-container','pod-lang-container','settings-lang-container'].forEach(id => {
    if (document.getElementById(id)) {
      LangService.renderSelector(id, (lang) => {
        toast(`🌐 Language set to ${LangService.getLanguages()[lang]?.native || lang}`, 'info');
      });
    }
  });
}

// ── App Bootstrap ────────────────────────────────────────────
async function bootstrap() {
  await DB.open();
  await DB.seedDemoData();
  EmailService.init();
  PWA.init();

  const user = await Auth.restoreSession();
  if (user) {
    State.user = user;
    initApp(user);
  } else {
    renderLogin();
  }
}

// Run when DOM ready
document.addEventListener('DOMContentLoaded', bootstrap);

// Post-render hooks
document.addEventListener('click', e => {
  // Close modals on overlay click
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// Override showPage to init lang selectors and load data after render
const _origShowPage = showPage;
window.showPage = function(name) {
  _origShowPage(name);
  setTimeout(() => {
    initLangSelectors();
    if (name === 'dashboard' || name === 'admin') loadRecentMaterials();
    if (name === 'manage-users') renderAdminPage();
  }, 50);
};
