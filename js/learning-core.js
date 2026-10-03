// ============================================================
// CONFIG — same Firebase project as all other workspaces
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyC7kppUyHUaPzeLBV62NEZWuHiuz1Kz0mA",
  authDomain: "mugera-e51cc.firebaseapp.com",
  databaseURL: "https://mugera-e51cc-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mugera-e51cc"
};

// ============================================================
// STATE
// ============================================================
let currentUser = null;
let currentPerms = {};
let currentEntitlements = {};
let isAdmin = false;

const coreReady = new Promise((resolve) => {
  document.addEventListener('learning:ready', () => resolve(), { once: true });
});

// ============================================================
// HELPERS — same patterns as your other workspaces
// ============================================================
function showToast(msg, type = 'success') {
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle', premium: 'fa-crown' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span></span>`;
  t.querySelector('span').textContent = msg;
  c.appendChild(t);
  setTimeout(() => {
    t.classList.add('leaving');
    setTimeout(() => t.remove(), 400);
  }, 4000);
}

function escapeHtml(text) {
  if (text == null) return '';
  return String(text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getTimeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return 'now';
}

function getFullTime(ts) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch (e) { return '—'; }
}

function getInitials(name) {
  if (!name) return 'U';
  const p = name.trim().split(/[\s._-]+/).filter(Boolean);
  if (p.length === 0) return 'U';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function slugify(s) {
  return String(s || '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

function hasEntitlement(key) {
  // Priority 1: admin — always has everything
  if (isAdmin) return true;

  // Priority 2: explicit learning entitlement
  if (currentEntitlements && currentEntitlements[key] === true) return true;

  // Priority 3: legacy — workspace permission covers it
  if (key === 'learning' && currentPerms.learning === true) return true;
  if (key === 'advancedCourses' && currentPerms.advancedCourses === true) return true;
  if (key === 'mentorship' && currentPerms.mentorship === true) return true;

  return false;
}

function isLearningUnlocked() {
  return hasEntitlement('learning') ||
         hasEntitlement('advancedCourses') ||
         hasEntitlement('mentorship');
}

// ============================================================
// FIREBASE BOOT — same pattern as your other workspaces
// ============================================================
function bootFirebase() {
  if (typeof firebase === 'undefined') {
    console.warn('Firebase SDK not loaded');
    showToast('Could not load authentication service', 'error');
    return;
  }
  try {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  } catch (e) { console.warn(e); }

  const auth = firebase.auth();
  const db = firebase.database();
  window._auth = auth;
  window._db = db;

  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});
  auth.onAuthStateChanged(onAuthChanged);
}

async function onAuthChanged(user) {
  // Not signed in → send to workspace home (matches your SSO pattern)
  if (!user) {
    window.location.href = '../index.html';
    return;
  }

  currentUser = user;
  const uid = user.uid;

  // 1. Read user record from `users/{uid}` — same as every other workspace
  try {
    await window._db.ref(`users/${uid}`).once('value');
  } catch (e) {
    console.warn('users read failed:', e);
  }

  // 2. Read workspace permissions — the SINGLE source of truth for access
  try {
    const snap = await window._db.ref(`workspacePermissions/${uid}`).once('value');
    currentPerms = snap.exists() ? (snap.val() || {}) : {};
  } catch (e) {
    currentPerms = {};
  }

  // 3. Read learning entitlements (parallel to workspacePermissions)
  try {
    const snap = await window._db.ref(`learning_entitlements/${uid}`).once('value');
    currentEntitlements = snap.exists() ? (snap.val() || {}) : {};
  } catch (e) {
    currentEntitlements = {};
  }

  // 4. Read admin flag — same check used throughout your rules
  try {
    const snap = await window._db.ref(`admins/${uid}`).once('value');
    isAdmin = snap.val() === true;
  } catch (e) {
    isAdmin = false;
  }

  // 5. Render account chip in header (same as other workspaces)
  renderAccountChip();

  // 6. Fire the ready event — pages wait on this
  document.dispatchEvent(new CustomEvent('learning:ready'));

  // 7. Setup realtime entitlement listener (admin can grant while page is open)
  const entRef = window._db.ref(`learning_entitlements/${uid}`);
  entRef.on('value', (snap) => {
    currentEntitlements = snap.exists() ? (snap.val() || {}) : {};
    document.dispatchEvent(new CustomEvent('learning:entitlements-changed'));
  });
}

function renderAccountChip() {
  const el = document.getElementById('headerAccount');
  if (!el || !currentUser) return;
  const displayName = currentUser.displayName || currentUser.email.split('@')[0] || 'User';
  const initials = getInitials(displayName);
  el.innerHTML = `
    <a href="../index.html" class="ws-account-chip" title="Back to workspace">
      <div class="ws-avatar" aria-hidden="true">${escapeHtml(initials)}</div>
      <span>${escapeHtml(displayName)}</span>
    </a>
  `;
}
// ============================================================
// CERTIFICATE ID GENERATION
// ============================================================
// Format: KAZ-YYYY-XXXXXX  (e.g., KAZ-2026-A7B3F9)
// Ambiguous characters removed: 0/O, 1/I/L
function generateCertificateCode() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const year = new Date().getFullYear();
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `KAZ-${year}-${code}`;
}

async function generateUniqueCertificateId() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateCertificateCode();
    const snap = await window._db.ref(`learning_certificate_index/${candidate}`).once('value');
    if (!snap.exists()) return candidate;
  }
  // Fallback — statistically near-impossible
  return `KAZ-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

// ============================================================
// BOOT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('footerYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  bootFirebase();
});

// ============================================================
// ISSUE CERTIFICATE
// Writes two records:
//   1. learning_certificates/{uid}/{courseId}      — user's private record
//   2. learning_certificate_index/{certificateId}  — public verifiable entry
// ============================================================
async function issueCertificate(courseId, courseTitle, options = {}) {
  if (!currentUser) {
    console.warn('[issueCertificate] No current user');
    return null;
  }

  const status = options.status || 'auto_issued'; // auto_issued | quiz_passed | verified
  const grade = typeof options.grade === 'number' ? options.grade : undefined;

  const certificateId = await generateUniqueCertificateId();
  const issuedAt = Date.now();
  const recipientName = currentUser.displayName
    || (currentUser.email ? currentUser.email.split('@')[0] : 'KazInni Learner');

  const userPayload = {
    courseId,
    courseTitle,
    certificateId,
    issuedAt,
    status
  };
  if (typeof grade === 'number') userPayload.grade = grade;

  const indexPayload = {
    uid: currentUser.uid,
    recipientName,
    courseId,
    courseTitle,
    issuedAt,
    status
  };
  if (typeof grade === 'number') indexPayload.grade = grade;

  try {
    await Promise.all([
      window._db.ref(`learning_certificates/${currentUser.uid}/${courseId}`).set(userPayload),
      window._db.ref(`learning_certificate_index/${certificateId}`).set(indexPayload)
    ]);
    console.log('[issueCertificate] Issued:', certificateId);
    return userPayload;
  } catch (e) {
    console.error('[issueCertificate] Failed:', e);
    throw e;
  }
}

// Expose globally so course.html can call it without duplicating code
window.issueCertificate = issueCertificate;
window.generateUniqueCertificateId = generateUniqueCertificateId;
