/**
 * shell.js
 * Construit la barre latérale et la barre supérieure communes à toutes les pages
 * (hors index.html), gère la déconnexion, le menu mobile, et quelques utilitaires
 * partagés (toast, formatage de dates, échappement HTML, anti-rebond).
 */

const NAV_ITEMS = [
  { key: 'dashboard', href: 'dashboard.html', label: 'Tableau de bord', icon: '&#9670;' },
  { key: 'dossiers', href: 'dossiers.html', label: 'Dossiers', icon: '&#128193;' },
  { key: 'nouvelle', href: 'nouvelle-candidature.html', label: 'Nouvelle candidature', icon: '&#10010;' },
  { key: 'relances', href: 'relances.html', label: 'Relances', icon: '&#8635;' },
  { key: 'destinataires', href: 'destinataires.html', label: 'Destinataires', icon: '&#9993;' },
  { key: 'modeles', href: 'modeles.html', label: 'Modèles de courrier', icon: '&#128196;' },
  { key: 'archives', href: 'dossiers.html?archive=true', label: 'Archives', icon: '&#128451;' },
  { key: 'parametres', href: 'parametres.html', label: 'Paramètres', icon: '&#9881;' }
];

function initShell(activeKey, title, subtitle) {
  if (!requireLogin()) return;
  const session = getSession();

  const navHtml = NAV_ITEMS.map(function (item) {
    return '<a href="' + item.href + '" class="' + (item.key === activeKey ? 'active' : '') + '">' +
      '<span class="icon">' + item.icon + '</span>' + item.label + '</a>';
  }).join('');

  document.getElementById('sidebar-container').innerHTML =
    '<div class="sidebar-brand">' +
      '<div class="label">Distinctions honorifiques</div>' +
      '<div class="title">Suivi des propositions</div>' +
    '</div>' +
    '<nav class="sidebar-nav">' + navHtml + '</nav>' +
    '<div class="sidebar-foot">' +
      '<div class="user-email">' + escapeHtml(session.email || '') + '</div>' +
      '<button id="logout-btn">Se déconnecter</button>' +
    '</div>';

  document.getElementById('topbar-container').innerHTML =
    '<div style="display:flex;align-items:center;">' +
      '<button class="mobile-toggle" id="mobile-toggle" aria-label="Menu">&#9776;</button>' +
      '<div><h1>' + escapeHtml(title || '') + '</h1>' +
      (subtitle ? '<div class="sub">' + escapeHtml(subtitle) + '</div>' : '') + '</div>' +
    '</div>' +
    '<div id="topbar-extra"></div>';

  document.getElementById('logout-btn').addEventListener('click', async function () {
    try { await apiPost('logout', {}); } catch (e) { /* ignore */ }
    clearSession();
    window.location.href = 'index.html';
  });

  const sidebar = document.querySelector('.sidebar');
  document.getElementById('mobile-toggle').addEventListener('click', function () {
    sidebar.classList.toggle('open');
  });
  document.addEventListener('click', function (e) {
    if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target.id !== 'mobile-toggle') {
      sidebar.classList.remove('open');
    }
  });
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(t._timer);
  t._timer = setTimeout(function () { t.style.display = 'none'; }, 3000);
}

function formatDateFr(isoOrYmd) {
  if (!isoOrYmd) return '';
  const d = new Date(isoOrYmd);
  if (isNaN(d.getTime())) return isoOrYmd;
  return d.toLocaleDateString('fr-FR');
}

function formatDateTimeFr(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  return d.toLocaleDateString('fr-FR') + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function debounce(fn, delay) {
  let t;
  return function () {
    clearTimeout(t);
    const args = arguments, ctx = this;
    t = setTimeout(function () { fn.apply(ctx, args); }, delay);
  };
}

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/** Fusionne les variables {{VAR}} d'un modèle de courrier avec un dossier/candidat/destinataire. */
function mergeModele(texte, ctx) {
  const vars = {
    CIVILITE: (ctx.candidat && ctx.candidat.civilite) || '',
    NOM: (ctx.candidat && ctx.candidat.nom ? ctx.candidat.nom.toUpperCase() : ''),
    PRENOM: (ctx.candidat && ctx.candidat.prenom) || '',
    DATE_NAISSANCE: formatDateFr(ctx.candidat && ctx.candidat.date_naissance),
    LIEU_NAISSANCE: (ctx.candidat && ctx.candidat.lieu_naissance) || '',
    ADRESSE: (ctx.candidat && ctx.candidat.adresse) || '',
    CODE_POSTAL: (ctx.candidat && ctx.candidat.code_postal) || '',
    VILLE: (ctx.candidat && ctx.candidat.ville) || '',
    PROFESSION: (ctx.candidat && ctx.candidat.profession) || '',
    MEDAILLE: (ctx.dossier && ctx.dossier.type_distinction) || '',
    ECHELON: (ctx.dossier && ctx.dossier.echelon) || '',
    DATE_ENVOI: formatDateFr(ctx.dossier && ctx.dossier.date_envoi),
    REFERENCE: (ctx.dossier && ctx.dossier.reference_admin) ? (', référence ' + ctx.dossier.reference_admin) : ''
  };
  return String(texte || '').replace(/\{\{(\w+)\}\}/g, function (m, key) {
    return vars[key] !== undefined ? vars[key] : m;
  });
}
