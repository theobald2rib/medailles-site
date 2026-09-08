/**
 * dossiers.js — liste, recherche, tri et filtres des dossiers.
 * Gère aussi la vue "Archives" (dossiers.html?archive=true).
 */

let allDossiers = [];
let sortKey = 'date_creation';
let sortDir = -1;
const isArchiveView = qs('archive') === 'true';

const COLUMNS = [
  { key: 'nom', label: 'Nom' },
  { key: 'prenom', label: 'Prénom' },
  { key: 'type_distinction', label: 'Distinction' },
  { key: 'echelon', label: 'Échelon' },
  { key: 'departement', label: 'Département' },
  { key: 'date_creation', label: 'Créé le' },
  { key: 'statut', label: 'État' },
  { key: 'date_envoi', label: 'Envoyé le' },
  { key: 'derniere_action', label: 'Dernière action' },
  { key: 'prochaine_relance', label: 'Relance' }
];

async function initDossiersPage() {
  if (isArchiveView) {
    document.querySelector('.topbar h1').textContent = 'Archives';
    document.querySelectorAll('.sidebar-nav a').forEach(function (a) { a.classList.remove('active'); });
    const archLink = document.querySelector('.sidebar-nav a[href="dossiers.html?archive=true"]');
    if (archLink) archLink.classList.add('active');
  }

  try {
    const config = await apiGet('getConfig');
    fillSelect('f-statut', config.statutsDossier, 'Tous les statuts');
    const echelons = new Set();
    config.distinctionsTypes.forEach(function (t) { t.echelons.forEach(function (e) { echelons.add(e); }); });
    fillSelect('f-echelon', Array.from(echelons), 'Tous les échelons');
  } catch (e) { /* filtres non bloquants */ }

  document.getElementById('f-search').addEventListener('input', debounce(loadDossiers, 250));
  ['f-statut', 'f-annee', 'f-echelon', 'f-departement'].forEach(function (id) {
    document.getElementById(id).addEventListener('change', loadDossiers);
  });

  await loadDossiers();
}

function fillSelect(id, values, placeholder) {
  const sel = document.getElementById(id);
  const current = sel.value;
  sel.innerHTML = '<option value="">' + placeholder + '</option>' +
    values.map(function (v) { return '<option value="' + escapeHtml(v) + '">' + escapeHtml(v) + '</option>'; }).join('');
  sel.value = current;
}

async function loadDossiers() {
  const zone = document.getElementById('dossiers-zone');
  const params = {
    q: document.getElementById('f-search').value,
    statut: document.getElementById('f-statut').value,
    annee: document.getElementById('f-annee').value,
    echelon: document.getElementById('f-echelon').value,
    departement: document.getElementById('f-departement').value,
    archive: isArchiveView ? 'true' : 'false'
  };
  try {
    allDossiers = await apiGet('listDossiers', params);
    populateYearAndDeptFilters();
    renderTable();
  } catch (err) {
    zone.innerHTML = '<div class="empty">Erreur : ' + escapeHtml(err.message) + '</div>';
  }
}

function populateYearAndDeptFilters() {
  const yearSel = document.getElementById('f-annee');
  if (yearSel.options.length <= 1) {
    const years = Array.from(new Set(allDossiers.map(function (d) { return d.promotion_annee; }))).sort().reverse();
    fillSelect('f-annee', years, 'Toutes les années');
  }
  const deptSel = document.getElementById('f-departement');
  if (deptSel.options.length <= 1) {
    const depts = Array.from(new Set(allDossiers.map(function (d) { return d.departement; }).filter(Boolean))).sort();
    fillSelect('f-departement', depts, 'Tous les départements');
  }
}

function renderTable() {
  const zone = document.getElementById('dossiers-zone');
  if (allDossiers.length === 0) {
    zone.innerHTML = '<div class="empty">Aucun dossier ne correspond à ces critères.</div>';
    return;
  }
  const sorted = allDossiers.slice().sort(function (a, b) {
    const av = String(a[sortKey] || ''), bv = String(b[sortKey] || '');
    return av.localeCompare(bv) * sortDir;
  });

  const head = '<tr>' + COLUMNS.map(function (c) {
    const arrow = sortKey === c.key ? (sortDir === 1 ? ' ▲' : ' ▼') : '';
    return '<th onclick="setSort(\'' + c.key + '\')">' + c.label + arrow + '</th>';
  }).join('') + '</tr>';

  const body = sorted.map(function (d) {
    return '<tr class="row-link" onclick="window.location.href=\'dossier.html?id=' + encodeURIComponent(d.id) + '\'">' +
      '<td><b>' + escapeHtml(d.nom) + '</b></td>' +
      '<td>' + escapeHtml(d.prenom) + '</td>' +
      '<td>' + escapeHtml(d.type_distinction) + '</td>' +
      '<td>' + escapeHtml(d.echelon || '') + '</td>' +
      '<td>' + escapeHtml(d.departement || '') + '</td>' +
      '<td>' + formatDateFr(d.date_creation) + '</td>' +
      '<td><span class="badge" data-statut="' + escapeHtml(d.statut) + '">' + escapeHtml(d.statut) + '</span></td>' +
      '<td>' + (d.date_envoi ? formatDateFr(d.date_envoi) : '—') + '</td>' +
      '<td style="max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(d.derniere_action || '') + '</td>' +
      '<td>' + (d.prochaine_relance ? formatDateFr(d.prochaine_relance) : '—') + '</td>' +
      '</tr>';
  }).join('');

  zone.innerHTML = '<table><thead>' + head + '</thead><tbody>' + body + '</tbody></table>' +
    '<div class="save-indicator" style="margin-top:10px;">' + sorted.length + ' dossier(s)</div>';
}

function setSort(key) {
  if (sortKey === key) sortDir *= -1; else { sortKey = key; sortDir = 1; }
  renderTable();
}

initDossiersPage();
