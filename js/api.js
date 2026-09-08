/**
 * api.js
 * Client HTTP générique vers l'API Apps Script. Lecture en GET, écriture en POST
 * (en text/plain pour éviter le préflight CORS, comme dans les projets existants).
 */

const SESSION_KEY = 'medailles_session';

function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); }
  catch (e) { return null; }
}
function setSession(session) { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
function clearSession() { sessionStorage.removeItem(SESSION_KEY); }
function getToken() { const s = getSession(); return s ? s.token : ''; }

function requireLogin() {
  const s = getSession();
  if (!s || !s.token) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

async function apiGet(action, params) {
  const qs = new URLSearchParams(Object.assign({ action: action, token: getToken() }, params || {}));
  const res = await fetch(APP_CONFIG.API_URL + '?' + qs.toString());
  return handleApiResponse_(res);
}

async function apiPost(action, body) {
  const payload = Object.assign({ action: action, token: getToken() }, body || {});
  const res = await fetch(APP_CONFIG.API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  return handleApiResponse_(res);
}

async function handleApiResponse_(res) {
  let data;
  try { data = await res.json(); }
  catch (e) { throw new Error("Réponse invalide du serveur (vérifiez l'URL de l'API dans js/config.js)."); }

  if (!data.success) {
    const code = data.error && data.error.code;
    if (code === 'AUTH_REQUIRED' || code === 'AUTH_EXPIRED' || code === 'AUTH_NOT_ALLOWED') {
      clearSession();
      if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
        window.location.href = 'index.html';
      }
    }
    throw new Error((data.error && data.error.message) || 'Erreur inconnue.');
  }
  return data.data;
}
