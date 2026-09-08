/**
 * modeles.js — bibliothèque de modèles de courriers.
 */

let modelesList = [];

async function loadModeles() {
  const zone = document.getElementById('modeles-list');
  try {
    modelesList = await apiGet('getModeles', {});
    if (modelesList.length === 0) { zone.innerHTML = '<div class="empty">Aucun modèle pour le moment.</div>'; return; }
    zone.innerHTML = modelesList.map(function (m) {
      return '<div class="card"><div class="card-title-row"><h3>' + escapeHtml(m.nom) + ' <span class="badge b-neutral">' + escapeHtml(m.code || '') + '</span></h3>' +
        '<div><button class="btn btn-sm" onclick="openModeleModal(\'' + m.id + '\')">Modifier</button> <button class="btn btn-sm btn-danger" onclick="deleteModele(\'' + m.id + '\')">Supprimer</button></div></div>' +
        '<p><b>Objet :</b> ' + escapeHtml(m.objet || '') + '</p>' +
        '<p style="white-space:pre-wrap;color:var(--text2);font-size:13px;">' + escapeHtml(m.corps || '') + '</p></div>';
    }).join('');
  } catch (err) { zone.innerHTML = '<div class="empty">Erreur : ' + escapeHtml(err.message) + '</div>'; }
}

function openModeleModal(id) {
  const m = id ? modelesList.find(function (x) { return x.id === id; }) : {};
  document.getElementById('modal-content').innerHTML =
    '<h3>' + (id ? 'Modifier' : 'Nouveau') + ' modèle</h3>' +
    '<div class="grid grid-2">' +
    '<div class="field"><label>Code (identifiant court)</label><input type="text" id="mo-code" value="' + escapeHtml(m.code || '') + '" placeholder="ex. RELANCE"></div>' +
    '<div class="field"><label>Nom</label><input type="text" id="mo-nom" value="' + escapeHtml(m.nom || '') + '"></div>' +
    '</div>' +
    '<div class="field"><label>Type de distinction (vide = tous)</label><input type="text" id="mo-type_distinction" value="' + escapeHtml(m.type_distinction || '') + '"></div>' +
    '<div class="field"><label>Objet</label><input type="text" id="mo-objet" value="' + escapeHtml(m.objet || '') + '"></div>' +
    '<div class="field"><label>Corps</label><textarea id="mo-corps" rows="8">' + escapeHtml(m.corps || '') + '</textarea></div>' +
    '<div class="modal-actions"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn btn-primary" onclick="saveModeleAction(' + (id ? "'" + id + "'" : 'null') + ')">Enregistrer</button></div>';
  document.getElementById('modal-overlay').classList.add('open');
}

async function saveModeleAction(id) {
  const payload = {
    code: document.getElementById('mo-code').value, nom: document.getElementById('mo-nom').value,
    type_distinction: document.getElementById('mo-type_distinction').value,
    objet: document.getElementById('mo-objet').value, corps: document.getElementById('mo-corps').value
  };
  if (id) payload.id = id;
  try { await apiPost('saveModele', payload); closeModal(); showToast('Modèle enregistré.'); await loadModeles(); }
  catch (err) { showToast('Erreur : ' + err.message); }
}

async function deleteModele(id) {
  if (!confirm('Désactiver ce modèle ?')) return;
  try { await apiPost('deleteModele', { id: id }); showToast('Modèle désactivé.'); await loadModeles(); }
  catch (err) { showToast('Erreur : ' + err.message); }
}

function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); }
document.getElementById('modal-overlay').addEventListener('click', function (e) { if (e.target.id === 'modal-overlay') closeModal(); });

loadModeles();
