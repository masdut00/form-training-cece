/**
 * Formulir Training Karyawan - Interactive Logic & Sheet Integration
 */

// ==============================================================================
// KONFIGURASI GOOGLE SPREADSHEET (HARDCODE)
// Tempelkan URL Web App Google Apps Script Anda di dalam tanda petik di bawah:
// ==============================================================================
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz_3OrTUdwweTOHFYTR4KMdq06HQTjub54z_Cae4q6ZN26YlW0DLwpovd2ggE2G8Pxb/exec"; // contoh: "https://script.google.com/macros/s/AKfycb.../exec"

// Configuration Keys
const SCRIPT_URL_KEY = 'training_app_script_url';
const SUBMISSIONS_STORAGE_KEY = 'training_submissions_master';
const ADMIN_PIN_KEY = 'training_admin_pin';
const DEFAULT_ADMIN_PIN = 'ubahpin123';

// Counters for Dynamic Tables
let participantCounter = 0;
let moduleCounter = 0;
let approvalCounter = 0;
let pendingSubmitData = null;

// ==========================================
// Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Seed initial rows
  addParticipant();
  addParticipant();
  addModule();
  addApproval('Line Manager');
  addApproval('HR / People & Culture');

  // Set default today's date if empty
  const tglPengajuan = document.getElementById('tglPengajuan');
  if (tglPengajuan && !tglPengajuan.value) {
    const today = new Date().toISOString().split('T')[0];
    tglPengajuan.value = today;
  }

  // Handle URL Hash on load
  handleHashNavigation();
  window.addEventListener('hashchange', handleHashNavigation);

  // Close status dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('statusMenu');
    const pill = document.getElementById('statusPill');
    if (menu && !menu.contains(e.target) && e.target !== pill && !pill.contains(e.target)) {
      menu.classList.remove('open');
    }
  });

  // Init Settings field
  const currentUrl = localStorage.getItem(SCRIPT_URL_KEY) || '';
  const settingInput = document.getElementById('scriptUrlInput');
  if (settingInput) settingInput.value = currentUrl;
});

// ==========================================
// Dynamic Rows: Participants
// ==========================================
function addParticipant(name = '', dept = '', attendance = '') {
  participantCounter++;
  const tbody = document.getElementById('participantBody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td style="color:var(--ink-faint);font-size:13px;width:40px;">${participantCounter}</td>
    <td><input type="text" placeholder="Nama karyawan" value="${name}"></td>
    <td style="width:180px;"><input type="text" placeholder="Departemen / Divisi" value="${dept}"></td>
    <td style="width:160px;">
      <div class="attend-toggle">
        <button type="button" class="${attendance === 'present' ? 'active-present' : ''}" onclick="setAttendance(this,'present')">Hadir</button>
        <button type="button" class="${attendance === 'absent' ? 'active-absent' : ''}" onclick="setAttendance(this,'absent')">Absen</button>
      </div>
    </td>
    <td style="width:40px;"><button type="button" class="row-remove" onclick="removeRow(this)" title="Hapus baris">&times;</button></td>
  `;
  tbody.appendChild(tr);
  updateParticipantCount();
}

function setAttendance(btn, state) {
  const wrap = btn.parentElement;
  const isAlreadyActive = btn.classList.contains(state === 'present' ? 'active-present' : 'active-absent');
  wrap.querySelectorAll('button').forEach(b => b.classList.remove('active-present', 'active-absent'));
  if (!isAlreadyActive) {
    btn.classList.add(state === 'present' ? 'active-present' : 'active-absent');
  }
}

function updateParticipantCount() {
  const rows = document.getElementById('participantBody').querySelectorAll('tr').length;
  const countEl = document.getElementById('participantCount');
  if (countEl) {
    countEl.textContent = `${rows} peserta`;
  }
}

// ==========================================
// Dynamic Rows: Modules
// ==========================================
function addModule(mod = '', dur = '', pic = '', method = '', desc = '') {
  moduleCounter++;
  const tbody = document.getElementById('moduleBody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td style="color:var(--ink-faint);font-size:13px;width:36px;">${moduleCounter}</td>
    <td><input type="text" placeholder="Nama modul / topik" value="${mod}"></td>
    <td style="width:110px;"><input type="text" placeholder="cth. 90 menit" value="${dur}"></td>
    <td style="width:150px;"><input type="text" placeholder="Fasilitator / PIC" value="${pic}"></td>
    <td style="width:130px;">
      <select>
        <option value="">Pilih</option>
        <option ${method === 'Lecture' ? 'selected' : ''}>Lecture</option>
        <option ${method === 'Praktik' ? 'selected' : ''}>Praktik</option>
        <option ${method === 'Diskusi' ? 'selected' : ''}>Diskusi</option>
        <option ${method === 'Studi kasus' ? 'selected' : ''}>Studi kasus</option>
      </select>
    </td>
    <td><input type="text" placeholder="Deskripsi ringkas aktivitas" value="${desc}"></td>
    <td style="width:40px;"><button type="button" class="row-remove" onclick="removeRow(this)" title="Hapus baris">&times;</button></td>
  `;
  tbody.appendChild(tr);
}

// ==========================================
// Dynamic Rows: Approval Workflow
// ==========================================
function addApproval(role = '', name = '', date = '') {
  approvalCounter++;
  const wrap = document.getElementById('approvalSteps');
  const div = document.createElement('div');
  div.className = 'approval-step';
  div.innerHTML = `
    <div class="step-badge voice">${approvalCounter}</div>
    <div>
      <span class="field-label">Role / Jabatan</span>
      <input type="text" placeholder="cth. Line Manager" value="${role}">
    </div>
    <div>
      <span class="field-label">Nama Approver</span>
      <input type="text" placeholder="Nama lengkap" value="${name}">
    </div>
    <div>
      <span class="field-label">Tanggal Approval</span>
      <input type="date" value="${date}">
    </div>
    <button type="button" class="row-remove" style="margin-top:14px;" onclick="removeApproval(this)" title="Hapus level">&times;</button>
  `;
  wrap.appendChild(div);
}

function removeApproval(btn) {
  const step = btn.closest('.approval-step');
  step.remove();
  renumberApprovals();
}

function renumberApprovals() {
  const steps = document.querySelectorAll('#approvalSteps .approval-step');
  approvalCounter = steps.length;
  steps.forEach((step, i) => {
    const badge = step.querySelector('.step-badge');
    if (badge) badge.textContent = i + 1;
  });
}

// ==========================================
// General Row Removal & Renumbering
// ==========================================
function removeRow(btn) {
  const tr = btn.closest('tr');
  const tbody = tr.parentElement;
  tr.remove();
  renumber(tbody);
}

function renumber(tbody) {
  const rows = tbody.querySelectorAll('tr');
  rows.forEach((row, i) => {
    const firstCol = row.querySelector('td');
    if (firstCol) firstCol.textContent = i + 1;
  });
  if (tbody.id === 'participantBody') {
    participantCounter = rows.length;
    updateParticipantCount();
  }
  if (tbody.id === 'moduleBody') {
    moduleCounter = rows.length;
  }
}

// ==========================================
// Status Dropdown
// ==========================================
function toggleStatusMenu(e) {
  e.stopPropagation();
  document.getElementById('statusMenu').classList.toggle('open');
}

function setStatus(cls, label) {
  const pill = document.getElementById('statusPill');
  const text = document.getElementById('statusText');
  pill.className = `status-pill ${cls}`;
  text.textContent = label;
  document.getElementById('statusMenu').classList.remove('open');
  showToast(`Status dokumen diubah menjadi: ${label}`, 'info');
}

// ==========================================
// Budget Calculation & Formatting
// ==========================================
function formatRupiah(input) {
  let digits = input.value.replace(/\D/g, '');
  if (digits === '') {
    input.value = '';
    calcVariance();
    return;
  }
  digits = digits.replace(/^0+(?=\d)/, '');
  const formatted = 'Rp ' + new Intl.NumberFormat('id-ID').format(parseInt(digits, 10));
  input.value = formatted;
  calcVariance();
}

function rupiahToNumber(str) {
  const digits = (str || '').replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

function calcVariance() {
  const appr = rupiahToNumber(document.getElementById('apprBudget').value);
  const act = rupiahToNumber(document.getElementById('actBudget').value);
  const el = document.getElementById('varianceText');
  if (!el) return;

  if (appr === 0 && act === 0) {
    el.textContent = 'Selisih akan muncul di sini';
    el.style.color = 'var(--ink-faint)';
    return;
  }
  const diff = appr - act;
  const formatted = new Intl.NumberFormat('id-ID').format(Math.abs(diff));
  if (diff >= 0) {
    el.textContent = `Hemat Rp ${formatted} dari budget disetujui`;
    el.style.color = 'var(--moss)';
  } else {
    el.textContent = `Melebihi budget Rp ${formatted}`;
    el.style.color = 'var(--danger)';
  }
}

// ==========================================
// Navigation & Admin Gate
// ==========================================
function handleHashNavigation() {
  const hash = window.location.hash;
  if (hash === '#admin' || hash === '#master') {
    requestAdminAccess();
  } else {
    switchView('form');
  }
}

function requestAdminAccess() {
  const isUnlocked = sessionStorage.getItem('admin_unlocked') === 'true';
  if (isUnlocked) {
    switchView('master');
  } else {
    openModal('modalAdminPin');
    const pinInput = document.getElementById('adminPinInput');
    if (pinInput) {
      pinInput.value = '';
      setTimeout(() => pinInput.focus(), 150);
    }
  }
}

function checkAdminPin() {
  const pinInput = document.getElementById('adminPinInput');
  const storedPin = localStorage.getItem(ADMIN_PIN_KEY) || DEFAULT_ADMIN_PIN;
  if (pinInput.value === storedPin) {
    sessionStorage.setItem('admin_unlocked', 'true');
    closeModal('modalAdminPin');
    showToast('Akses Admin berhasil dibuka.', 'success');
    switchView('master');
  } else {
    pinInput.classList.add('error');
    showToast('PIN Admin salah. Silakan coba lagi.', 'error');
    setTimeout(() => pinInput.classList.remove('error'), 1200);
  }
}

function switchView(view) {
  const formView = document.getElementById('formView');
  const masterView = document.getElementById('masterView');
  const tabForm = document.getElementById('tabForm');
  const tabMaster = document.getElementById('tabMaster');

  if (view === 'form') {
    formView.style.display = '';
    masterView.style.display = 'none';
    tabForm.classList.add('active');
    tabMaster.classList.remove('active');
    if (window.location.hash === '#admin' || window.location.hash === '#master') {
      history.replaceState(null, null, ' ');
    }
  } else {
    formView.style.display = 'none';
    masterView.style.display = '';
    tabForm.classList.remove('active');
    tabMaster.classList.add('active');
    window.location.hash = '#master';
    loadMasterData();
  }
}

// ==========================================
// Form Data Collection & Validation
// ==========================================
function collectFormData() {
  const meta = {};
  document.querySelectorAll('#formView [data-field]').forEach(el => {
    meta[el.dataset.field] = el.value || '';
  });

  const participants = [];
  document.querySelectorAll('#participantBody tr').forEach(tr => {
    const inputs = tr.querySelectorAll('input');
    const activeBtn = tr.querySelector('.attend-toggle button.active-present, .attend-toggle button.active-absent');
    participants.push({
      nama: inputs[0] ? inputs[0].value.trim() : '',
      departemen: inputs[1] ? inputs[1].value.trim() : '',
      kehadiran: activeBtn ? (activeBtn.classList.contains('active-present') ? 'Hadir' : 'Absen') : '-'
    });
  });

  const modules = [];
  document.querySelectorAll('#moduleBody tr').forEach(tr => {
    const inputs = tr.querySelectorAll('input');
    const select = tr.querySelector('select');
    modules.push({
      modul: inputs[0] ? inputs[0].value.trim() : '',
      durasi: inputs[1] ? inputs[1].value.trim() : '',
      pic: inputs[2] ? inputs[2].value.trim() : '',
      metode: select ? select.value : '',
      deskripsi: inputs[3] ? inputs[3].value.trim() : ''
    });
  });

  const approvals = [];
  document.querySelectorAll('#approvalSteps .approval-step').forEach(step => {
    const inputs = step.querySelectorAll('input');
    approvals.push({
      role: inputs[0] ? inputs[0].value.trim() : '',
      nama: inputs[1] ? inputs[1].value.trim() : '',
      tanggal: inputs[2] ? inputs[2].value : ''
    });
  });

  return {
    meta,
    participants,
    modules,
    approvals,
    status: document.getElementById('statusText').textContent,
    statusClass: document.getElementById('statusPill').className.replace('status-pill', '').trim() || 'draft'
  };
}

function validateForm(data) {
  const idValue = (data.meta['ID training'] || '').trim();
  const leader = (data.meta['Leader pengaju'] || '').trim();
  const dept = (data.meta['Departemen / divisi'] || '').trim();

  let isValid = true;
  let firstErrorEl = null;

  const checkField = (id, valid) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!valid) {
      el.classList.add('error');
      if (!firstErrorEl) firstErrorEl = el;
      isValid = false;
    } else {
      el.classList.remove('error');
    }
  };

  checkField('trainingId', idValue.length > 0);
  checkField('leaderName', leader.length > 0);
  checkField('deptName', dept.length > 0);

  if (!isValid) {
    showToast('Harap lengkapi field wajib (ID Training, Leader, Departemen)', 'error');
    if (firstErrorEl) {
      firstErrorEl.focus();
      firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return false;
  }
  return true;
}

// ==========================================
// Submission Workflow (Modal & Sync)
// ==========================================
function submitPlan() {
  const data = collectFormData();
  if (!validateForm(data)) return;

  pendingSubmitData = data;

  // Populate Confirm Modal Summary
  const countPeserta = (data.participants || []).filter(p => p.nama).length;
  const summaryBox = document.getElementById('confirmSummaryBox');
  if (summaryBox) {
    summaryBox.innerHTML = `
      <div><strong>ID Training:</strong> ${data.meta['ID training']}</div>
      <div><strong>Leader:</strong> ${data.meta['Leader pengaju']} (${data.meta['Departemen / divisi'] || '-'})</div>
      <div><strong>Kategori:</strong> ${data.meta['Kategori training'] || '-'} / ${data.meta['Metode training'] || '-'}</div>
      <div><strong>Jadwal:</strong> ${data.meta['Tanggal & jam pelaksanaan'] || '-'}</div>
      <div><strong>Jumlah Peserta:</strong> ${countPeserta} orang terdaftar</div>
      <div><strong>Budget Disetujui:</strong> ${data.meta['Budget disetujui'] || 'Rp 0'}</div>
    `;
  }

  openModal('modalConfirmSubmit');
}

async function confirmAndExecuteSubmit() {
  if (!pendingSubmitData) return;
  const data = pendingSubmitData;
  closeModal('modalConfirmSubmit');

  const btn = document.getElementById('submitBtn');
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Mengirim data...`;

  const statusEl = document.getElementById('submitStatus');
  statusEl.textContent = 'Menyimpan data ke sistem...';

  const entry = {
    ...data,
    id: data.meta['ID training'],
    submittedAt: new Date().toISOString()
  };

  // 1. Simpan ke Local / Master Data
  saveToLocalStorage(entry);

  // 2. Kirim ke Google Apps Script (Spreadsheet)
  const scriptUrl = GOOGLE_SCRIPT_URL.trim() || localStorage.getItem(SCRIPT_URL_KEY) || '';
  let sheetSaved = false;

  if (scriptUrl) {
    try {
      // Mengirim POST ke Google Apps Script
      // mode: 'no-cors' agar tidak terblokir pembatasan CORS browser pada web app redirect Google
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
      });
      sheetSaved = true;
    } catch (err) {
      console.warn('Gagal sync ke Google Sheet:', err);
      sheetSaved = false;
    }
  }

  btn.disabled = false;
  btn.innerHTML = originalHtml;

  // Persiapkan Draft Email
  openMailDraft(data);

  // Show Success Modal
  populateSuccessModal(data, sheetSaved, scriptUrl);
  openModal('modalSuccessSubmit');

  showToast('Pengajuan training berhasil disimpan!', 'success');
  statusEl.textContent = 'Data berhasil disimpan.';
}

function saveToLocalStorage(entry) {
  let list = [];
  try {
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    if (raw) list = JSON.parse(raw);
  } catch (e) {
    list = [];
  }
  // Masukkan data terbaru di awal
  list.unshift(entry);
  localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(list));
}

function populateSuccessModal(data, sheetSaved, scriptUrl) {
  const box = document.getElementById('successSummaryBox');
  if (!box) return;

  const m = data.meta;
  let sheetStatusNote = '';
  if (scriptUrl) {
    sheetStatusNote = sheetSaved
      ? `<div style="color:var(--moss);font-weight:600;margin-top:6px;">&#10003; Berhasil dikirim ke Google Spreadsheet</div>`
      : `<div style="color:var(--danger);font-weight:600;margin-top:6px;">&#9888; Pengiriman ke Google Sheet sedang diproses/tertunda, data tersimpan aman di riwayat lokal.</div>`;
  } else {
    sheetStatusNote = `<div style="color:var(--clay);margin-top:6px;"><small>Catatan: Masukkan URL Web App pada variabel <code>GOOGLE_SCRIPT_URL</code> di file <code>js/app.js</code> agar terkirim otomatis ke Google Sheet.</small></div>`;
  }

  box.innerHTML = `
    <div><strong>ID:</strong> ${m['ID training']}</div>
    <div><strong>Diajukan oleh:</strong> ${m['Leader pengaju']} (${m['Departemen / divisi'] || '-'})</div>
    <div><strong>Status:</strong> ${data.status}</div>
    ${sheetStatusNote}
  `;
}

// ==========================================
// Email Draft Generator
// ==========================================
function buildMailBody(data) {
  const m = data.meta;
  const participantCount = (data.participants || []).filter(p => p.nama).length;
  const lines = [
    'Halo Tim TnD / HR,',
    '',
    'Berikut pengajuan formulir training internal baru:',
    '--------------------------------------------------',
    'ID Training         : ' + (m['ID training'] || '-'),
    'Leader Pengaju      : ' + (m['Leader pengaju'] || '-'),
    'Departemen / Divisi : ' + (m['Departemen / divisi'] || '-'),
    'Kategori Training   : ' + (m['Kategori training'] || '-'),
    'Metode Training     : ' + (m['Metode training'] || '-'),
    'Jadwal Pelaksanaan : ' + (m['Tanggal & jam pelaksanaan'] || '-'),
    'Lokasi / Venue      : ' + (m['Lokasi / venue'] || '-'),
    'Trainer             : ' + (m['Trainer'] || '-'),
    'Peserta Terdaftar   : ' + participantCount + ' orang',
    'Budget Disetujui    : ' + (m['Budget disetujui'] || '-'),
    'Status Dokumen      : ' + (data.status || '-'),
    '--------------------------------------------------',
    '',
    'Detail lengkap (peserta, rincian modul, approval) tersimpan di master data spreadsheet internal.'
  ];
  return lines.join('\n');
}

function openMailDraft(data) {
  const subject = `Training Internal Plan - ${data.meta['ID training'] || 'TRN'} - ${data.meta['Leader pengaju'] || '-'}`;
  const body = buildMailBody(data);
  const mailto = `mailto:training@cpssoft.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const link = document.getElementById('emailLink');
  if (link) {
    link.href = mailto;
    link.style.display = 'inline-flex';
  }
  const modalMailLink = document.getElementById('modalSuccessEmailLink');
  if (modalMailLink) {
    modalMailLink.href = mailto;
  }
}

// ==========================================
// Master Data Handling
// ==========================================
function loadMasterData() {
  const tbody = document.getElementById('masterBody');
  const empty = document.getElementById('masterEmpty');
  const detailPanel = document.getElementById('detailPanel');
  if (detailPanel) detailPanel.innerHTML = '';

  let entries = [];
  try {
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    if (raw) entries = JSON.parse(raw);
  } catch (e) {
    entries = [];
  }

  if (!entries || entries.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  tbody.innerHTML = '';

  entries.forEach((entry, idx) => {
    const m = entry.meta || {};
    const cls = entry.statusClass || 'draft';
    const date = entry.submittedAt
      ? new Date(entry.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '-';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${m['ID training'] || '-'}</strong></td>
      <td>${m['Leader pengaju'] || '-'}</td>
      <td>${m['Departemen / divisi'] || '-'}</td>
      <td>${m['Kategori training'] || '-'}</td>
      <td><span class="mini-pill ${cls}"><span class="dot"></span>${entry.status || 'Pending approval'}</span></td>
      <td>${(entry.participants || []).filter(p => p.nama).length} peserta</td>
      <td>${date}</td>
    `;
    tr.addEventListener('click', () => showDetail(entry, idx));
    tbody.appendChild(tr);
  });
}

function showDetail(entry, index) {
  const m = entry.meta || {};
  const panel = document.getElementById('detailPanel');
  if (!panel) return;

  const participantsList = (entry.participants || []).filter(p => p.nama)
    .map(p => `• <strong>${p.nama}</strong> &mdash; ${p.departemen || '-'} (Kehadiran: <em>${p.kehadiran}</em>)`)
    .join('<br>') || 'Belum ada peserta terdaftar.';

  const modulesList = (entry.modules || []).filter(mo => mo.modul)
    .map(mo => `• <strong>${mo.modul}</strong> (${mo.durasi || '-'}) &mdash; Fasilitator: ${mo.pic || '-'} [${mo.metode || '-'}]<br><small style="color:var(--ink-soft);padding-left:14px;display:inline-block;">${mo.deskripsi || ''}</small>`)
    .join('<br>') || 'Belum ada modul.';

  const approvalsList = (entry.approvals || []).filter(ap => ap.role)
    .map(ap => `• <strong>${ap.role}:</strong> ${ap.nama || '(Belum diisi)'} ${ap.tanggal ? '&mdash; ' + ap.tanggal : ''}`)
    .join('<br>') || 'Belum ada approval.';

  panel.innerHTML = `
    <div class="detail-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <h3 class="voice" style="margin:0;">${m['ID training'] || 'Detail Submission'}</h3>
        <button type="button" class="btn-danger" onclick="deleteSubmission(${index})">Hapus Catatan</button>
      </div>
      <div class="detail-grid">
        <div class="detail-item"><label>Leader Pengaju</label><div>${m['Leader pengaju'] || '-'}</div></div>
        <div class="detail-item"><label>Departemen / Divisi</label><div>${m['Departemen / divisi'] || '-'}</div></div>
        <div class="detail-item"><label>Kategori Training</label><div>${m['Kategori training'] || '-'}</div></div>
        <div class="detail-item"><label>Metode Training</label><div>${m['Metode training'] || '-'}</div></div>
        <div class="detail-item"><label>Jadwal Pelaksanaan</label><div>${m['Tanggal & jam pelaksanaan'] || '-'}</div></div>
        <div class="detail-item"><label>Lokasi / Venue</label><div>${m['Lokasi / venue'] || '-'}</div></div>
        <div class="detail-item"><label>Trainer</label><div>${m['Trainer'] || '-'}</div></div>
        <div class="detail-item"><label>Budget Disetujui</label><div>${m['Budget disetujui'] || '-'}</div></div>
      </div>
      <div class="detail-sub">Tujuan & Goals</div>
      <div class="detail-list">
        <div><strong>Purpose:</strong> ${m['Training plan purpose'] || '-'}</div>
        <div><strong>Goals:</strong> ${m['Training goals'] || '-'}</div>
      </div>
      <div class="detail-sub">Daftar Peserta</div>
      <div class="detail-list">${participantsList}</div>
      <div class="detail-sub">Modul Training</div>
      <div class="detail-list">${modulesList}</div>
      <div class="detail-sub">Approval Workflow</div>
      <div class="detail-list">${approvalsList}</div>
    </div>
  `;
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function deleteSubmission(index) {
  if (!confirm('Apakah Anda yakin ingin menghapus data submission ini dari riwayat lokal?')) return;
  try {
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      list.splice(index, 1);
      localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(list));
      showToast('Data submission berhasil dihapus.', 'info');
      loadMasterData();
    }
  } catch (e) {
    showToast('Gagal menghapus data.', 'error');
  }
}

// ==========================================
// Settings Modal (Google Apps Script URL)
// ==========================================
function openSettingsModal() {
  const currentUrl = localStorage.getItem(SCRIPT_URL_KEY) || '';
  const input = document.getElementById('scriptUrlInput');
  if (input) input.value = currentUrl;
  openModal('modalSettings');
}

function saveSettings() {
  const input = document.getElementById('scriptUrlInput');
  const url = (input ? input.value : '').trim();
  localStorage.setItem(SCRIPT_URL_KEY, url);
  closeModal('modalSettings');
  showToast('Pengaturan URL Google Apps Script disimpan.', 'success');
}

// ==========================================
// Modal Helpers
// ==========================================
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Close modals when clicking backdrop
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// Close modals with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
  }
});

// ==========================================
// Toast Notification System
// ==========================================
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = '&#9432;';
  if (type === 'success') icon = '&#10003;';
  if (type === 'error') icon = '&#9888;';

  toast.innerHTML = `<span style="font-size:16px;">${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

// ==========================================
// Export to CSV Feature
// ==========================================
function exportToCsv() {
  let entries = [];
  try {
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    if (raw) entries = JSON.parse(raw);
  } catch (e) {
    entries = [];
  }

  if (entries.length === 0) {
    showToast('Belum ada data untuk diekspor.', 'error');
    return;
  }

  const headers = ['ID Training', 'Leader', 'Departemen', 'Kategori', 'Metode', 'Jadwal', 'Lokasi', 'Trainer', 'Jumlah Peserta', 'Budget Disetujui', 'Status', 'Tanggal Dikirim'];
  const rows = entries.map(entry => {
    const m = entry.meta || {};
    const countPeserta = (entry.participants || []).filter(p => p.nama).length;
    return [
      `"${(m['ID training'] || '').replace(/"/g, '""')}"`,
      `"${(m['Leader pengaju'] || '').replace(/"/g, '""')}"`,
      `"${(m['Departemen / divisi'] || '').replace(/"/g, '""')}"`,
      `"${(m['Kategori training'] || '').replace(/"/g, '""')}"`,
      `"${(m['Metode training'] || '').replace(/"/g, '""')}"`,
      `"${(m['Tanggal & jam pelaksanaan'] || '').replace(/"/g, '""')}"`,
      `"${(m['Lokasi / venue'] || '').replace(/"/g, '""')}"`,
      `"${(m['Trainer'] || '').replace(/"/g, '""')}"`,
      countPeserta,
      `"${(m['Budget disetujui'] || '').replace(/"/g, '""')}"`,
      `"${(entry.status || '').replace(/"/g, '""')}"`,
      `"${entry.submittedAt || ''}"`
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Training_Submissions_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast('File CSV berhasil diunduh.', 'success');
}
