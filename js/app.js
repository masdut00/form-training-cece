/**
 * Formulir Training Karyawan - Interactive Logic, Stepper & Sheet Integration
 */

// ==============================================================================
// KONFIGURASI GOOGLE SPREADSHEET (HARDCODE)
// ==============================================================================
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz_3OrTUdwweTOHFYTR4KMdq06HQTjub54z_Cae4q6ZN26YlW0DLwpovd2ggE2G8Pxb/exec";

// Configuration Keys
const SUBMISSIONS_STORAGE_KEY = 'training_submissions_master';
const ADMIN_PIN_KEY = 'training_admin_pin';
const DEFAULT_ADMIN_PIN = 'ubahpin123';

// State Management
let currentStep = 1;
const totalSteps = 4;
let participantCounter = 0;
let moduleCounter = 0;
let approvalCounter = 0;
let pendingSubmitData = null;

// ==========================================
// Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Auto-generate ID Training if empty
  generateNewTrainingId();

  // 2. Set default today's date for Tanggal Pengajuan & Pelaksanaan
  const today = new Date().toISOString().split('T')[0];
  const tglPengajuan = document.getElementById('tglPengajuan');
  if (tglPengajuan && !tglPengajuan.value) {
    tglPengajuan.value = today;
  }
  const tglPelaksanaan = document.getElementById('tglPelaksanaan');
  if (tglPelaksanaan && !tglPelaksanaan.value) {
    tglPelaksanaan.value = today;
  }

  // 3. Seed initial dynamic rows
  addParticipant('Budi Santoso', 'Technology & IT');
  addParticipant('Siti Rahma', 'Technology & IT');
  addModule('Dasar Arsitektur & Best Practices', '60 menit', 'Fasilitator Internal', 'Lecture', 'Pengenalan konsep dan standar kerja');
  addModule('Hands-on Workshop & Studi Kasus', '120 menit', 'Fasilitator Internal', 'Praktik', 'Simulasi langsung penerapan di modul proyek');
  addApproval('Direct Supervisor / Line Manager');
  addApproval('HR / People & Culture');

  // 4. Initial calculations & stepper UI
  calculateScheduleAndDuration();
  updateStepperUI();

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
});

// ==========================================
// Stepper Navigation Logic
// ==========================================
function goToStep(step) {
  if (step < 1 || step > totalSteps) return;

  // If moving forward, validate current step required fields
  if (step > currentStep) {
    if (!validateStep(currentStep)) return;
  }

  currentStep = step;
  updateStepperUI();

  if (currentStep === 4) {
    populateReviewSummary();
  }

  // Scroll to top of form
  const formView = document.getElementById('formView');
  if (formView) {
    formView.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function nextStep() {
  goToStep(currentStep + 1);
}

function prevStep() {
  goToStep(currentStep - 1);
}

function updateStepperUI() {
  // 1. Panels visibility
  for (let i = 1; i <= totalSteps; i++) {
    const panel = document.getElementById(`stepPanel${i}`);
    if (panel) {
      if (i === currentStep) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    }
  }

  // 2. Desktop Stepper Tabs
  for (let i = 1; i <= totalSteps; i++) {
    const tab = document.getElementById(`stepTab${i}`);
    if (tab) {
      tab.classList.remove('active', 'completed');
      if (i === currentStep) {
        tab.classList.add('active');
      } else if (i < currentStep) {
        tab.classList.add('completed');
      }
    }
  }

  // 3. Progress Bar Fill
  const percent = Math.round((currentStep / totalSteps) * 100);
  const fill = document.getElementById('stepperProgressFill');
  if (fill) fill.style.width = `${percent}%`;

  // 4. Mobile Text
  const stepTitles = [
    'Profil & Sasaran',
    'Pelaksanaan & Peserta',
    'Biaya & Evaluasi',
    'Review & Approval'
  ];
  const mobileText = document.getElementById('mobileStepText');
  if (mobileText) {
    mobileText.textContent = `Langkah ${currentStep} dari 4: ${stepTitles[currentStep - 1]}`;
  }
  const mobilePercent = document.getElementById('mobileProgressPercent');
  if (mobilePercent) mobilePercent.textContent = `${percent}%`;

  // 5. Bottom Sticky Bar
  const bottomInfo = document.getElementById('bottomStepIndicator');
  if (bottomInfo) {
    bottomInfo.textContent = `Langkah ${currentStep} dari 4: ${stepTitles[currentStep - 1]}`;
  }

  const prevBtn = document.getElementById('prevStepBtn');
  if (prevBtn) prevBtn.disabled = currentStep === 1;

  const nextBtn = document.getElementById('nextStepBtn');
  const submitBtn = document.getElementById('submitBtn');

  if (currentStep === totalSteps) {
    if (nextBtn) nextBtn.style.display = 'none';
    if (submitBtn) submitBtn.style.display = 'inline-flex';
  } else {
    if (nextBtn) nextBtn.style.display = 'inline-flex';
    if (submitBtn) submitBtn.style.display = 'none';
  }
}

function validateStep(step) {
  if (step === 1) {
    const idVal = (document.getElementById('trainingId')?.value || '').trim();
    const leaderVal = (document.getElementById('leaderName')?.value || '').trim();
    const deptVal = (document.getElementById('deptName')?.value || '').trim();

    if (!idVal || !leaderVal || !deptVal) {
      showToast('Lengkapi field wajib (ID Training, Leader, Departemen)', 'error');
      if (!leaderVal) document.getElementById('leaderName')?.focus();
      else if (!deptVal) document.getElementById('deptName')?.focus();
      return false;
    }
  }
  return true;
}

// ==========================================
// Chip Selection (Level & Method)
// ==========================================
function selectChip(type, value, cardEl) {
  if (type === 'level') {
    document.querySelectorAll('#levelChipGrid .chip-card').forEach(c => c.classList.remove('selected'));
    cardEl.classList.add('selected');
    const input = document.getElementById('levelKemahiran');
    if (input) input.value = value;
  } else if (type === 'method') {
    document.querySelectorAll('#methodChipGrid .chip-card').forEach(c => c.classList.remove('selected'));
    cardEl.classList.add('selected');
    const input = document.getElementById('metode');
    if (input) input.value = value;

    // Toggle Online platform details
    const onlineRow = document.getElementById('onlineDetailsRow');
    if (onlineRow) {
      if (value === 'Online' || value === 'Hybrid') {
        onlineRow.style.display = 'grid';
      } else {
        onlineRow.style.display = 'none';
      }
    }
  }
}

// ==========================================
// Automation Helpers
// ==========================================
function generateNewTrainingId() {
  const d = new Date();
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(100 + Math.random() * 900);
  const newId = `TRN-${yr}${mo}${da}-${rand}`;
  const input = document.getElementById('trainingId');
  if (input) {
    input.value = newId;
    input.classList.remove('error');
  }
  return newId;
}

function handleDeptChange(selectEl) {
  const customInput = document.getElementById('customDeptInput');
  if (selectEl.value === 'custom') {
    if (customInput) {
      customInput.style.display = 'block';
      customInput.focus();
    }
  } else {
    if (customInput) {
      customInput.style.display = 'none';
      customInput.value = '';
    }
  }
}

function calculateScheduleAndDuration() {
  const tglInput = document.getElementById('tglPelaksanaan');
  const jamMulaiInput = document.getElementById('jamMulai');
  const jamSelesaiInput = document.getElementById('jamSelesai');
  const jadwalHidden = document.getElementById('jadwal');
  const totalDuration = document.getElementById('totalDuration');

  if (!tglInput || !jamMulaiInput || !jamSelesaiInput) return;

  const tglVal = tglInput.value;
  const mulaiVal = jamMulaiInput.value || '09:00';
  const selesaiVal = jamSelesaiInput.value || '15:00';

  let formattedDate = '';
  if (tglVal) {
    const parts = tglVal.split('-');
    if (parts.length === 3) {
      const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      formattedDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }

  const scheduleText = formattedDate
    ? `${formattedDate}, ${mulaiVal} – ${selesaiVal} WIB`
    : `${mulaiVal} – ${selesaiVal} WIB`;

  if (jadwalHidden) jadwalHidden.value = scheduleText;

  // Calculate Duration
  const [h1, m1] = mulaiVal.split(':').map(Number);
  const [h2, m2] = selesaiVal.split(':').map(Number);
  let diffMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);

  if (diffMinutes > 0) {
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    let durStr = '';
    if (hours > 0 && mins > 0) {
      durStr = `${hours} jam ${mins} menit`;
    } else if (hours > 0) {
      durStr = `${hours} jam`;
    } else {
      durStr = `${mins} menit`;
    }
    if (totalDuration) totalDuration.value = durStr;
  } else if (totalDuration) {
    let moduleTotalMinutes = 0;
    document.querySelectorAll('#moduleBody tr').forEach(tr => {
      const sel = tr.querySelector('select');
      if (sel) {
        const val = sel.value;
        if (val.includes('30')) moduleTotalMinutes += 30;
        else if (val.includes('45')) moduleTotalMinutes += 45;
        else if (val.includes('60')) moduleTotalMinutes += 60;
        else if (val.includes('90')) moduleTotalMinutes += 90;
        else if (val.includes('120')) moduleTotalMinutes += 120;
        else if (val.includes('180')) moduleTotalMinutes += 180;
        else if (val.includes('Full day')) moduleTotalMinutes += 360;
      }
    });
    if (moduleTotalMinutes > 0) {
      const h = Math.floor(moduleTotalMinutes / 60);
      const m = moduleTotalMinutes % 60;
      totalDuration.value = h > 0 ? `${h} jam ${m > 0 ? m + ' menit' : ''}`.trim() : `${m} menit`;
    } else {
      totalDuration.value = '6 jam';
    }
  }
}

// ==========================================
// Dynamic Rows: Participants
// ==========================================
function addParticipant(name = '', dept = '', attendance = 'present') {
  participantCounter++;
  const tbody = document.getElementById('participantBody');
  const deptSelect = document.getElementById('deptName');
  let currentDept = '';
  if (deptSelect && deptSelect.value && deptSelect.value !== 'custom') {
    currentDept = deptSelect.value;
  }
  const defaultDept = dept || currentDept;

  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td style="color:var(--ink-faint);font-size:13px;width:36px;">${participantCounter}</td>
    <td><input type="text" placeholder="Nama lengkap karyawan" value="${name}"></td>
    <td style="width:180px;"><input type="text" placeholder="Departemen / Divisi" value="${defaultDept}"></td>
    <td style="width:150px;">
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
    countEl.textContent = `${rows} peserta terdaftar`;
  }
  const plannedEl = document.getElementById('plannedParticipants');
  if (plannedEl) {
    plannedEl.value = rows;
  }
}

// Quick Import from Excel Textarea
function importPesertaFromText() {
  const textarea = document.getElementById('excelPasteArea');
  if (!textarea || !textarea.value.trim()) {
    showToast('Teks daftar peserta masih kosong.', 'error');
    return;
  }

  const lines = textarea.value.split('\n');
  let addedCount = 0;
  const deptSelect = document.getElementById('deptName');
  const fallbackDept = (deptSelect && deptSelect.value !== 'custom') ? deptSelect.value : '';

  lines.forEach(line => {
    const cleanLine = line.trim();
    if (!cleanLine) return;

    let name = cleanLine;
    let dept = fallbackDept;

    if (cleanLine.includes('\t')) {
      const parts = cleanLine.split('\t');
      name = parts[0].trim();
      dept = parts[1] ? parts[1].trim() : fallbackDept;
    } else if (cleanLine.includes(' - ')) {
      const parts = cleanLine.split(' - ');
      name = parts[0].trim();
      dept = parts[1] ? parts[1].trim() : fallbackDept;
    } else if (cleanLine.includes(';')) {
      const parts = cleanLine.split(';');
      name = parts[0].trim();
      dept = parts[1] ? parts[1].trim() : fallbackDept;
    }

    if (name) {
      addParticipant(name, dept);
      addedCount++;
    }
  });

  textarea.value = '';
  closeModal('modalQuickPasteExcel');
  showToast(`Berhasil menambahkan ${addedCount} peserta!`, 'success');
}

// ==========================================
// Dynamic Rows: Modules
// ==========================================
function addModule(mod = '', dur = '90 menit', pic = '', method = '', desc = '') {
  moduleCounter++;
  const tbody = document.getElementById('moduleBody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td style="color:var(--ink-faint);font-size:13px;width:36px;">${moduleCounter}</td>
    <td><input type="text" placeholder="Nama modul / topik" value="${mod}"></td>
    <td style="width:130px;">
      <select onchange="calculateScheduleAndDuration()">
        <option value="30 menit" ${dur === '30 menit' ? 'selected' : ''}>30 menit</option>
        <option value="45 menit" ${dur === '45 menit' ? 'selected' : ''}>45 menit</option>
        <option value="60 menit" ${dur === '60 menit' ? 'selected' : ''}>60 menit (1 jam)</option>
        <option value="90 menit" ${dur === '90 menit' || !dur ? 'selected' : ''}>90 menit (1.5 jam)</option>
        <option value="120 menit" ${dur === '120 menit' ? 'selected' : ''}>120 menit (2 jam)</option>
        <option value="180 menit" ${dur === '180 menit' ? 'selected' : ''}>180 menit (3 jam)</option>
        <option value="Full day" ${dur === 'Full day' ? 'selected' : ''}>Full day (6 jam)</option>
      </select>
    </td>
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
  calculateScheduleAndDuration();
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
      <span class="field-label">Role / Otoritas</span>
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
    calculateScheduleAndDuration();
  }
}

// ==========================================
// Budget Calculation & Breakdown
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

function calcBudgetBreakdown() {
  const fee = rupiahToNumber(document.getElementById('budgetFee')?.value);
  const konsumsi = rupiahToNumber(document.getElementById('budgetKonsumsi')?.value);
  const materi = rupiahToNumber(document.getElementById('budgetMateri')?.value);
  const venue = rupiahToNumber(document.getElementById('budgetVenue')?.value);

  const total = fee + konsumsi + materi + venue;
  const estInput = document.getElementById('estBudget');
  if (estInput) {
    estInput.value = total > 0 ? 'Rp ' + new Intl.NumberFormat('id-ID').format(total) : '';
  }
  calcVariance();
}

function calcVariance() {
  const appr = rupiahToNumber(document.getElementById('apprBudget')?.value);
  const act = rupiahToNumber(document.getElementById('actBudget')?.value);
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
  const stickyBar = document.getElementById('stickyBottomBar');

  if (view === 'form') {
    formView.style.display = '';
    masterView.style.display = 'none';
    tabForm.classList.add('active');
    tabMaster.classList.remove('active');
    if (stickyBar) stickyBar.style.display = '';
    if (window.location.hash === '#admin' || window.location.hash === '#master') {
      history.replaceState(null, null, ' ');
    }
  } else {
    formView.style.display = 'none';
    masterView.style.display = '';
    tabForm.classList.remove('active');
    tabMaster.classList.add('active');
    if (stickyBar) stickyBar.style.display = 'none';
    window.location.hash = '#master';
    loadMasterData();
  }
}

// ==========================================
// Executive Review Summary Populator (Step 4)
// ==========================================
function populateReviewSummary() {
  const data = collectFormData();
  const m = data.meta;

  const setRev = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '-';
  };

  setRev('revId', m['ID training']);
  setRev('revLeader', m['Leader pengaju']);
  setRev('revDept', m['Departemen / divisi']);
  setRev('revCategory', `${m['Kategori training'] || '-'} (${m['Target level kemahiran'] || 'All Level'})`);
  setRev('revSchedule', m['Tanggal & jam pelaksanaan']);

  let venueDisplay = m['Lokasi / venue'] || '-';
  if (m['Metode training'] === 'Online' || m['Metode training'] === 'Hybrid') {
    const platform = m['Platform online'] || 'Online';
    const link = m['Link meeting online'] ? ` (${m['Link meeting online']})` : '';
    venueDisplay = `${venueDisplay} [${platform}${link}]`;
  }
  setRev('revVenue', venueDisplay);
  setRev('revTrainer', m['Trainer']);

  const countPeserta = (data.participants || []).filter(p => p.nama).length;
  setRev('revDurationParticipants', `${m['Total durasi belajar'] || '-'} • ${countPeserta} Peserta`);
  setRev('revBudget', m['Budget disetujui'] || m['Estimasi biaya'] || 'Rp 0');
  setRev('revStatus', data.status);
}

// ==========================================
// Form Data Collection & Validation
// ==========================================
function collectFormData() {
  calculateScheduleAndDuration();

  const meta = {};
  document.querySelectorAll('#formView [data-field]').forEach(el => {
    meta[el.dataset.field] = el.value || '';
  });

  // Handle custom department if selected
  if (meta['Departemen / divisi'] === 'custom') {
    const custom = document.getElementById('customDeptInput');
    meta['Departemen / divisi'] = custom && custom.value.trim() ? custom.value.trim() : 'Lainnya';
  }

  // Ensure schedule, duration, and participant counts are fresh
  meta['Tanggal & jam pelaksanaan'] = document.getElementById('jadwal')?.value || meta['Tanggal & jam pelaksanaan'] || '';
  meta['Total durasi belajar'] = document.getElementById('totalDuration')?.value || meta['Total durasi belajar'] || '';
  meta['Jumlah partisipan (rencana)'] = document.getElementById('plannedParticipants')?.value || meta['Jumlah partisipan (rencana)'] || '';

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
    const selects = tr.querySelectorAll('select');
    modules.push({
      modul: inputs[0] ? inputs[0].value.trim() : '',
      durasi: selects[0] ? selects[0].value : '',
      pic: inputs[1] ? inputs[1].value.trim() : '',
      metode: selects[1] ? selects[1].value : '',
      deskripsi: inputs[2] ? inputs[2].value.trim() : ''
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

// ==========================================
// Submission Workflow (Modal & Sync)
// ==========================================
function submitPlan() {
  const data = collectFormData();
  const idValue = (data.meta['ID training'] || '').trim();
  const leader = (data.meta['Leader pengaju'] || '').trim();
  const dept = (data.meta['Departemen / divisi'] || '').trim();

  if (!idValue || !leader || !dept) {
    showToast('Lengkapi field wajib (ID Training, Leader, Departemen)', 'error');
    goToStep(1);
    return;
  }

  pendingSubmitData = data;

  const countPeserta = (data.participants || []).filter(p => p.nama).length;
  const summaryBox = document.getElementById('confirmSummaryBox');
  if (summaryBox) {
    summaryBox.innerHTML = `
      <div><strong>ID Training:</strong> ${data.meta['ID training']}</div>
      <div><strong>Leader:</strong> ${data.meta['Leader pengaju']} (${data.meta['Departemen / divisi']})</div>
      <div><strong>Kategori:</strong> ${data.meta['Kategori training']} / ${data.meta['Metode training']} [${data.meta['Target level kemahiran'] || 'General'}]</div>
      <div><strong>Jadwal:</strong> ${data.meta['Tanggal & jam pelaksanaan']}</div>
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
  btn.innerHTML = `<span class="spinner"></span> Mengirim...`;

  const entry = {
    ...data,
    id: data.meta['ID training'],
    submittedAt: new Date().toISOString()
  };

  // 1. Simpan ke Local Master Data
  saveToLocalStorage(entry);

  // 2. Kirim ke Google Apps Script (Spreadsheet)
  const scriptUrl = GOOGLE_SCRIPT_URL.trim();
  let sheetSaved = false;

  if (scriptUrl) {
    try {
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      sheetSaved = true;
    } catch (err) {
      console.warn('Sync ke Google Sheet tertunda/offline:', err);
      sheetSaved = false;
    }
  }

  btn.disabled = false;
  btn.innerHTML = originalHtml;

  // Siapkan Draft Email
  openMailDraft(data);

  // Tampilkan Success Modal
  populateSuccessModal(data, sheetSaved, scriptUrl);
  openModal('modalSuccessSubmit');
  showToast('Pengajuan training berhasil disimpan!', 'success');
}

function saveToLocalStorage(entry) {
  let list = [];
  try {
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    if (raw) list = JSON.parse(raw);
  } catch (e) {
    list = [];
  }
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
      : `<div style="color:var(--danger);font-weight:600;margin-top:6px;">&#9888; Pengiriman ke Google Sheet sedang diproses, data aman di riwayat lokal.</div>`;
  } else {
    sheetStatusNote = `<div style="color:var(--clay);margin-top:6px;"><small>Data tersimpan di riwayat lokal.</small></div>`;
  }

  box.innerHTML = `
    <div><strong>ID:</strong> ${m['ID training']}</div>
    <div><strong>Diajukan oleh:</strong> ${m['Leader pengaju']} (${m['Departemen / divisi']})</div>
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
    'Kategori / Level    : ' + (m['Kategori training'] || '-') + ' [' + (m['Target level kemahiran'] || 'General') + ']',
    'Metode Training     : ' + (m['Metode training'] || '-'),
    'Jadwal Pelaksanaan : ' + (m['Tanggal & jam pelaksanaan'] || '-'),
    'Lokasi / Platform   : ' + (m['Lokasi / venue'] || '-'),
    'Trainer             : ' + (m['Trainer'] || '-'),
    'Peserta Terdaftar   : ' + participantCount + ' orang',
    'Total Durasi        : ' + (m['Total durasi belajar'] || '-'),
    'Budget Disetujui    : ' + (m['Budget disetujui'] || '-'),
    'Status Dokumen      : ' + (data.status || '-'),
    'Link Silabus        : ' + (m['Link silabus materi'] || '-'),
    '--------------------------------------------------',
    '',
    'Detail lengkap tersimpan di master data Google Spreadsheet internal.'
  ];
  return lines.join('\n');
}

function openMailDraft(data) {
  const subject = `Training Internal Plan - ${data.meta['ID training'] || 'TRN'} - ${data.meta['Leader pengaju'] || '-'}`;
  const body = buildMailBody(data);
  const mailto = `mailto:training@cpssoft.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
      <td>${m['Kategori training'] || '-'} [${m['Target level kemahiran'] || 'General'}]</td>
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
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
        <h3 class="voice" style="margin:0;">${m['ID training'] || 'Detail Submission'}</h3>
        <button type="button" class="btn-secondary" style="color:var(--danger);border-color:#F5C6BE;" onclick="deleteSubmission(${index})">Hapus Catatan</button>
      </div>
      <div class="review-grid">
        <div class="review-item"><label>Leader Pengaju</label><div>${m['Leader pengaju'] || '-'}</div></div>
        <div class="review-item"><label>Departemen / Divisi</label><div>${m['Departemen / divisi'] || '-'}</div></div>
        <div class="review-item"><label>Kategori & Level</label><div>${m['Kategori training'] || '-'} (${m['Target level kemahiran'] || 'General'})</div></div>
        <div class="review-item"><label>Metode Training</label><div>${m['Metode training'] || '-'}</div></div>
        <div class="review-item"><label>Jadwal Pelaksanaan</label><div>${m['Tanggal & jam pelaksanaan'] || '-'}</div></div>
        <div class="review-item"><label>Lokasi / Venue</label><div>${m['Lokasi / venue'] || '-'}</div></div>
        <div class="review-item"><label>Trainer</label><div>${m['Trainer'] || '-'}</div></div>
        <div class="review-item"><label>Budget Disetujui</label><div>${m['Budget disetujui'] || '-'}</div></div>
      </div>
      <div style="font-weight:600;margin:14px 0 6px;">Tujuan & Goals:</div>
      <div style="font-size:13px;line-height:1.6;margin-bottom:12px;">
        <div><strong>Purpose:</strong> ${m['Training plan purpose'] || '-'}</div>
        <div><strong>Goals:</strong> ${m['Training goals'] || '-'}</div>
        <div><strong>Link Silabus:</strong> ${m['Link silabus materi'] ? `<a href="${m['Link silabus materi']}" target="_blank">${m['Link silabus materi']}</a>` : '-'}</div>
      </div>
      <div style="font-weight:600;margin:14px 0 6px;">Daftar Peserta:</div>
      <div style="font-size:13px;line-height:1.7;">${participantsList}</div>
      <div style="font-weight:600;margin:14px 0 6px;">Modul Training:</div>
      <div style="font-size:13px;line-height:1.7;">${modulesList}</div>
      <div style="font-weight:600;margin:14px 0 6px;">Alur Approval:</div>
      <div style="font-size:13px;line-height:1.7;">${approvalsList}</div>
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

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
  }
});

// ==========================================
// Toast Notification System
// ==========================================
function showToast(message, type = 'info', duration = 3200) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  if (type === 'success') {
    iconSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  }

  toast.innerHTML = `<span style="display:flex;align-items:center;">${iconSvg}</span><span>${message}</span>`;
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

  const headers = ['ID Training', 'Leader', 'Departemen', 'Kategori', 'Level', 'Metode', 'Jadwal', 'Lokasi', 'Trainer', 'Jumlah Peserta', 'Budget Disetujui', 'Status', 'Tanggal Dikirim'];
  const rows = entries.map(entry => {
    const m = entry.meta || {};
    const countPeserta = (entry.participants || []).filter(p => p.nama).length;
    return [
      `"${(m['ID training'] || '').replace(/"/g, '""')}"`,
      `"${(m['Leader pengaju'] || '').replace(/"/g, '""')}"`,
      `"${(m['Departemen / divisi'] || '').replace(/"/g, '""')}"`,
      `"${(m['Kategori training'] || '').replace(/"/g, '""')}"`,
      `"${(m['Target level kemahiran'] || 'General').replace(/"/g, '""')}"`,
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
