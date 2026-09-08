/**
 * parametres.js - administration des types de distinctions (médailles) et raccourcis.
 */

let paramConfig = null;

async function loadParametres() {
  const zone = document.getElementById('types-zone');
  try {
    paramConfig = await apiGet('getConfig');
    renderTypes();
  } catch (err) { zone.innerHTML = '<div class="empty">Erreur : ' + escapeHtml(err.message) + '</div>'; }
}

function renderTypes() {
  const zone = document.getElementById('types-zone');
  const list = paramConfig.distinctionsTypes;
  if (list.length === 0) { zone.innerHTML = '<div class="empty">Aucun type configuré.</div>'; return; }
  zone.innerHTML = list.map(function (t) {
    return '<div class="doc-item" style="align-items:flex-start;">' +
      '<div><div class="doc-name">' + escapeHtml(t.nom) + ' ' + (t.actif ? '' : '<span class="badge b-neutral">Inactif</span>') + '</div>' +
      '<div class="doc-meta">Échelons : ' + t.echelons.join(', ') + '<br>Pièces obligatoires : ' + t.pieces_obligatoires.map(pieceLabel).join(', ') +
      '<br>Relances : ' + t.delai_relance1_jours + ' j puis ' + t.delai_relance2_jours + ' j</div></div>' +
      '<button class="btn btn-sm" onclick="openTypeModal(\'' + t.id + '\')">Modifier</button></div>';
  }).join('');
}

function pieceLabel(code) {
  const p = paramConfig.pieceTypes.find(function (x) { return x.code === code; });
  return p ? p.label : code;
}

function openTypeModal(id) {
  const t = id ? paramConfig.distinctionsTypes.find(function (x) { return x.id === id; }) : { echelons: [], pieces_obligatoires: [], actif: true, delai_relance1_jours: 45, delai_relance2_jours: 30 };
  const pieceCheckboxes = paramConfig.pieceTypes.map(function (p) {
    const checked = t.pieces_obligatoires.indexOf(p.code) !== -1 ? 'checked' : '';
    return '<label class="checkbox-row" style="font-weight:400;margin-bottom:4px;"><input type="checkbox" value="' + p.code + '" class="tp-piece" ' + checked + '> ' + p.label + '</label>';
  }).join('');

  document.getElementById('modal-content').innerHTML =
    '<h3>' + (id ? 'Modifier' : 'Ajouter') + ' un type de distinction</h3>' +
    '<div class="field"><label>Nom complet</label><input type="text" id="tp-nom" value="' + escapeHtml(t.nom || '') + '"></div>' +
    '<div class="grid grid-2">' +
    '<div class="field"><label>Échelons (séparés par des virgules)</label><input type="text" id="tp-echelons" value="' + escapeHtml(t.echelons.join(',')) + '" placeholder="Bronze,Argent,Or"></div>' +
    '<div class="field"><label>Couleur</label><input type="text" id="tp-couleur" value="' + escapeHtml(t.couleur || '#1a2744') + '"></div>' +
    '</div>' +
    '<div class="field"><label>Autorité par défaut</label><input type="text" id="tp-autorite" value="' + escapeHtml(t.autorite_defaut || '') + '"></div>' +
    '<div class="field"><label>Information d\'ancienneté (affichée à titre indicatif)</label><textarea id="tp-anciennete" rows="2">' + escapeHtml(t.anciennete_info || '') + '</textarea></div>' +
    '<div class="field"><label>Pièces obligatoires</label>' + pieceCheckboxes + '</div>' +
    '<div class="grid grid-2">' +
    '<div class="field"><label>Délai 1<sup>re</sup> relance (jours)</label><input type="number" id="tp-relance1" value="' + t.delai_relance1_jours + '"></div>' +
    '<div class="field"><label>Délai 2<sup>e</sup> relance (jours)</label><input type="number" id="tp-relance2" value="' + t.delai_relance2_jours + '"></div>' +
    '</div>' +
    '<label class="checkbox-row"><input type="checkbox" id="tp-actif" ' + (t.actif !== false ? 'checked' : '') + '> Actif (visible dans les formulaires)</label>' +
    '<div class="modal-actions"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn btn-primary" onclick="saveType(' + (id ? "'" + id + "'" : 'null') + ')">Enregistrer</button></div>';
  document.getElementById('modal-overlay').classList.add('open');
}

async function saveType(id) {
  const pieces = Array.from(document.querySelectorAll('.tp-piece:checked')).map(function (el) { return el.value; }).join(',');
  const payload = {
    nom: document.getElementById('tp-nom').value,
    echelons: document.getElementById('tp-echelons').value,
    couleur: document.getElementById('tp-couleur').value,
    autorite_defaut: document.getElementById('tp-autorite').value,
    anciennete_info: document.getElementById('tp-anciennete').value,
    pieces_obligatoires: pieces,
    delai_relance1_jours: document.getElementById('tp-relance1').value,
    delai_relance2_jours: document.getElementById('tp-relance2').value,
    actif: document.getElementById('tp-actif').checked
  };
  if (id) payload.id = id;
  try { await apiPost('saveDistinctionType', payload); closeModal(); showToast('Type enregistré.'); await loadParametres(); }
  catch (err) { showToast('Erreur : ' + err.message); }
}

function openSheet() {
  if (paramConfig && paramConfig.spreadsheetUrl) window.open(paramConfig.spreadsheetUrl, '_blank');
  else showToast('URL du classeur indisponible pour le moment.');
}

function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); }
document.getElementById('modal-overlay').addEventListener('click', function (e) { if (e.target.id === 'modal-overlay') closeModal(); });

loadParametres();
