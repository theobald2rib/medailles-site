/**
 * destinataires.js - gestion de la base des destinataires (services/organismes).
 */

let destList = [];

async function loadDestinataires() {
  const zone = document.getElementById('dest-list');
  try {
    destList = await apiGet('getDestinataires', {});
    if (destList.length === 0) { zone.innerHTML = '<div class="empty">Aucun destinataire enregistré.</div>'; return; }
    zone.innerHTML = '<table><thead><tr><th>Service</th><th>Organisme</th><th>Distinction</th><th>Département</th><th>Ville</th><th></th></tr></thead><tbody>' +
      destList.map(function (d) {
        return '<tr><td><b>' + escapeHtml(d.service || '') + '</b></td><td>' + escapeHtml(d.organisme || '') + '</td>' +
          '<td>' + escapeHtml(d.type_distinction || 'Toutes') + '</td><td>' + escapeHtml(d.departement || '') + '</td>' +
          '<td>' + escapeHtml(d.ville || '') + '</td>' +
          '<td><button class="btn btn-sm" onclick="openDestModal(\'' + d.id + '\')">Modifier</button> ' +
          '<button class="btn btn-sm btn-danger" onclick="deleteDest(\'' + d.id + '\')">Suppr.</button></td></tr>';
      }).join('') + '</tbody></table>';
  } catch (err) { zone.innerHTML = '<div class="empty">Erreur : ' + escapeHtml(err.message) + '</div>'; }
}

function openDestModal(id) {
  const d = id ? destList.find(function (x) { return x.id === id; }) : {};
  document.getElementById('modal-content').innerHTML =
    '<h3>' + (id ? 'Modifier' : 'Ajouter') + ' un destinataire</h3>' +
    '<div class="grid grid-2">' +
    '<div class="field"><label>Service</label><input type="text" id="d-service" value="' + escapeHtml(d.service || '') + '"></div>' +
    '<div class="field"><label>Organisme</label><input type="text" id="d-organisme" value="' + escapeHtml(d.organisme || '') + '"></div>' +
    '</div><div class="grid grid-2">' +
    '<div class="field"><label>Type de distinction (vide = toutes)</label><input type="text" id="d-type_distinction" value="' + escapeHtml(d.type_distinction || '') + '" placeholder="ex. JSEA"></div>' +
    '<div class="field"><label>Bureau / personne</label><input type="text" id="d-bureau" value="' + escapeHtml(d.bureau || '') + '"></div>' +
    '</div><div class="grid grid-3">' +
    '<div class="field"><label>Département</label><input type="text" id="d-departement" value="' + escapeHtml(d.departement || '') + '"></div>' +
    '<div class="field"><label>Région</label><input type="text" id="d-region" value="' + escapeHtml(d.region || '') + '"></div>' +
    '<div class="field"><label>Code postal</label><input type="text" id="d-code_postal" value="' + escapeHtml(d.code_postal || '') + '"></div>' +
    '</div>' +
    '<div class="field"><label>Adresse</label><input type="text" id="d-adresse" value="' + escapeHtml(d.adresse || '') + '"></div>' +
    '<div class="grid grid-2">' +
    '<div class="field"><label>Ville</label><input type="text" id="d-ville" value="' + escapeHtml(d.ville || '') + '"></div>' +
    '<div class="field"><label>Téléphone</label><input type="tel" id="d-telephone" value="' + escapeHtml(d.telephone || '') + '"></div>' +
    '</div><div class="grid grid-2">' +
    '<div class="field"><label>E-mail</label><input type="email" id="d-email" value="' + escapeHtml(d.email || '') + '"></div>' +
    '<div class="field"><label>URL</label><input type="text" id="d-url" value="' + escapeHtml(d.url || '') + '"></div>' +
    '</div>' +
    '<div class="field"><label>Observations</label><textarea id="d-observations" rows="2">' + escapeHtml(d.observations || '') + '</textarea></div>' +
    '<div class="modal-actions"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn btn-primary" onclick="saveDest(' + (id ? "'" + id + "'" : 'null') + ')">Enregistrer</button></div>';
  document.getElementById('modal-overlay').classList.add('open');
}

async function saveDest(id) {
  const fields = ['service', 'organisme', 'type_distinction', 'bureau', 'departement', 'region', 'code_postal', 'adresse', 'ville', 'telephone', 'email', 'url', 'observations'];
  const payload = {};
  fields.forEach(function (f) { payload[f] = document.getElementById('d-' + f).value; });
  if (id) payload.id = id;
  try { await apiPost('saveDestinataire', payload); closeModal(); showToast('Destinataire enregistré.'); await loadDestinataires(); }
  catch (err) { showToast('Erreur : ' + err.message); }
}

async function deleteDest(id) {
  if (!confirm('Désactiver ce destinataire ?')) return;
  try { await apiPost('deleteDestinataire', { id: id }); showToast('Destinataire désactivé.'); await loadDestinataires(); }
  catch (err) { showToast('Erreur : ' + err.message); }
}

function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); }
document.getElementById('modal-overlay').addEventListener('click', function (e) { if (e.target.id === 'modal-overlay') closeModal(); });

loadDestinataires();
