/**
 * dashboard.js - logique de la page Tableau de bord.
 */

const STAT_DEFS = [
  { key: 'total', label: 'Dossiers au total' },
  { key: 'en_preparation', label: 'En préparation' },
  { key: 'incomplet', label: 'Incomplets' },
  { key: 'pret_a_envoyer', label: 'Prêts à envoyer' },
  { key: 'envoye', label: 'Envoyés' },
  { key: 'en_attente', label: 'En attente' },
  { key: 'a_relancer', label: 'À relancer' },
  { key: 'accepte', label: 'Acceptés' }
];

async function loadDashboard() {
  try {
    const data = await apiGet('dashboard');
    renderStats(data.counts);
    renderTodos(data.todos);
    renderEcheances(data.echeances);
    renderDerniers(data.derniersDossiers);
  } catch (err) {
    document.getElementById('stats-zone').innerHTML = '<div class="empty">Erreur : ' + escapeHtml(err.message) + '</div>';
  }
}

function renderStats(counts) {
  document.getElementById('stats-zone').innerHTML = STAT_DEFS.map(function (s) {
    return '<div class="stat-card"><div class="num">' + (counts[s.key] || 0) + '</div><div class="lbl">' + s.label + '</div></div>';
  }).join('');
}

function renderTodos(todos) {
  const zone = document.getElementById('todos-zone');
  if (!todos || todos.length === 0) { zone.innerHTML = '<div class="empty">Rien à signaler pour le moment.</div>'; return; }
  zone.innerHTML = '<ul class="timeline">' + todos.map(function (t) {
    const badge = t.urgence === 'retard' ? '<span class="badge b-red">En retard</span>' :
      t.urgence === 'aujourdhui' ? '<span class="badge b-amber">Aujourd\'hui</span>' : '';
    return '<li><div class="t-desc" style="flex:1;"><a href="dossier.html?id=' + encodeURIComponent(t.dossierId) + '">' + escapeHtml(t.label) + '</a></div>' + badge + '</li>';
  }).join('') + '</ul>';
}

function renderEcheances(echeances) {
  const zone = document.getElementById('echeances-zone');
  if (!echeances || echeances.length === 0) { zone.innerHTML = '<div class="empty">Aucune échéance programmée.</div>'; return; }
  zone.innerHTML = '<ul class="timeline">' + echeances.map(function (e) {
    const cls = e.niveau === 'retard' ? 'b-red' : e.niveau === 'aujourdhui' ? 'b-amber' : 'b-neutral';
    return '<li><span class="t-date">' + formatDateFr(e.date) + '</span><div class="t-desc" style="flex:1;"><a href="dossier.html?id=' + encodeURIComponent(e.dossierId) + '">' + escapeHtml(e.label) + '</a></div><span class="badge ' + cls + '">' + e.niveau + '</span></li>';
  }).join('') + '</ul>';
}

function renderDerniers(list) {
  const zone = document.getElementById('derniers-zone');
  if (!list || list.length === 0) { zone.innerHTML = '<div class="empty">Aucun dossier pour le moment. <a href="nouvelle-candidature.html">Créer le premier</a>.</div>'; return; }
  zone.innerHTML = '<table><thead><tr><th>Candidat</th><th>Distinction</th><th>Statut</th><th>Modifié le</th></tr></thead><tbody>' +
    list.map(function (d) {
      return '<tr class="row-link" onclick="window.location.href=\'dossier.html?id=' + encodeURIComponent(d.id) + '\'">' +
        '<td><b>' + escapeHtml(d.nom) + '</b> ' + escapeHtml(d.prenom) + '</td>' +
        '<td>' + escapeHtml(d.type_distinction) + ' - ' + escapeHtml(d.echelon || '') + '</td>' +
        '<td><span class="badge" data-statut="' + escapeHtml(d.statut) + '">' + escapeHtml(d.statut) + '</span></td>' +
        '<td>' + formatDateTimeFr(d.date_maj) + '</td></tr>';
    }).join('') + '</tbody></table>';
}

loadDashboard();
