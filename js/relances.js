/**
 * relances.js — vue globale de toutes les relances (planifiées et effectuées).
 */

async function loadRelances() {
  const zone = document.getElementById('relances-list');
  try {
    const list = await apiGet('listRelances');
    if (list.length === 0) { zone.innerHTML = '<div class="empty">Aucune relance pour le moment.</div>'; return; }
    const planifiees = list.filter(function (r) { return r.statut === 'Planifiée'; });
    const effectuees = list.filter(function (r) { return r.statut !== 'Planifiée'; });

    let html = '<h3>À venir (' + planifiees.length + ')</h3>';
    html += renderRelanceTable(planifiees, true);
    html += '<h3 style="margin-top:24px;">Historique des relances effectuées</h3>';
    html += renderRelanceTable(effectuees, false);
    zone.innerHTML = html;
  } catch (err) {
    zone.innerHTML = '<div class="empty">Erreur : ' + escapeHtml(err.message) + '</div>';
  }
}

function renderRelanceTable(list, actionable) {
  if (list.length === 0) return '<div class="empty">Aucune.</div>';
  return '<table><thead><tr><th>Candidat</th><th>Distinction</th><th>Niveau</th><th>Date prévue</th><th>Statut</th>' + (actionable ? '<th></th>' : '') + '</tr></thead><tbody>' +
    list.map(function (r) {
      const badgeCls = r.urgence === 'retard' ? 'b-red' : r.urgence === 'aujourdhui' ? 'b-amber' : r.urgence === 'faite' ? 'b-green' : 'b-neutral';
      return '<tr>' +
        '<td><a href="dossier.html?id=' + encodeURIComponent(r.dossier_id) + '">' + escapeHtml(r.candidat_nom) + ' ' + escapeHtml(r.candidat_prenom) + '</a></td>' +
        '<td>' + escapeHtml(r.type_distinction) + ' — ' + escapeHtml(r.echelon || '') + '</td>' +
        '<td>' + r.niveau + '</td>' +
        '<td>' + formatDateFr(r.date_prevue) + '</td>' +
        '<td><span class="badge ' + badgeCls + '">' + (r.statut === 'Effectuée' ? 'Effectuée le ' + formatDateFr(r.date_effectuee) : r.urgence) + '</span></td>' +
        (actionable ? '<td><a class="btn btn-sm" href="dossier.html?id=' + encodeURIComponent(r.dossier_id) + '">Traiter →</a></td>' : '') +
        '</tr>';
    }).join('') + '</tbody></table>';
}

loadRelances();
