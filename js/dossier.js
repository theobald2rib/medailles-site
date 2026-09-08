/**
 * dossier.js - logique complète de la fiche dossier (tous les onglets).
 */

const DOSSIER_ID = qs('id');
let CONFIG = null;
let DATA = null; // dernière réponse de getDossier
let PIECE_TYPES = [];

if (!DOSSIER_ID) {
  document.getElementById('loading-zone').textContent = "Identifiant de dossier manquant dans l'URL.";
} else {
  loadAll();
}

async function loadAll() {
  try {
    CONFIG = await apiGet('getConfig');
    PIECE_TYPES = CONFIG.pieceTypes;
    await reloadDossier();
    setupTabs();
    setupAutosaveFields();
    document.getElementById('loading-zone').style.display = 'none';
    document.getElementById('dossier-content').style.display = 'block';
  } catch (err) {
    document.getElementById('loading-zone').textContent = 'Erreur : ' + err.message;
  }
}

async function reloadDossier() {
  DATA = await apiGet('getDossier', { id: DOSSIER_ID });
  renderHeader();
  renderChecklist();
  renderSynthese();
  fillAdminForm();
  renderParcours();
  fillMerites();
  renderFaits();
  renderDistinctions();
  renderDocuments();
  fillEnvoi();
  renderRelances();
  renderHistorique();
}

/* ================= EN-TÊTE ================= */

function renderHeader() {
  const c = DATA.candidat || {};
  const d = DATA.dossier;
  document.getElementById('d-titre').textContent = (c.civilite === 'Madame' ? 'Mme ' : 'M. ') + (c.prenom || '') + ' ' + (c.nom || '').toUpperCase();
  document.getElementById('d-sous-titre').textContent = 'Médaille ' + d.type_distinction + (d.echelon ? ' - ' + d.echelon : '') + ' · Promotion ' + d.promotion_annee;
  const badge = document.getElementById('d-badge-statut');
  badge.textContent = d.statut;
  badge.setAttribute('data-statut', d.statut);
  document.title = (c.prenom || '') + ' ' + (c.nom || '') + ' - Fiche dossier';
}

function renderChecklist() {
  const items = DATA.checklist.items;
  document.getElementById('checklist-zone').innerHTML = items.map(function (i) {
    return '<div class="checklist-item ' + (i.ok ? 'ok' : 'ko') + '"><span class="mark">' + (i.ok ? '✓' : '✗') + '</span>' + escapeHtml(i.label) + '</div>';
  }).join('');
  const pct = DATA.checklist.pourcentage;
  document.getElementById('d-progress-fill').style.width = pct + '%';
  document.getElementById('d-progress-label').textContent = 'Dossier complet à ' + pct + ' %';
}

function renderSynthese() {
  const dest = DATA.destinataire;
  document.getElementById('synth-destinataire').innerHTML = dest ?
    '<b>' + escapeHtml(dest.service || dest.organisme) + '</b><br>' +
    escapeHtml(dest.adresse || '') + '<br>' + escapeHtml(dest.code_postal || '') + ' ' + escapeHtml(dest.ville || '') +
    '<div style="margin-top:8px;"><button class="btn btn-sm" onclick="copyAdresse()">Copier l\'adresse</button></div>' :
    '<div class="empty">Aucun destinataire sélectionné - renseignez-le dans l\'onglet Administratif.</div>';
  document.getElementById('synth-resume').textContent = DATA.dossier.resume_court || 'Aucun résumé rédigé pour le moment.';
}

function copyAdresse() {
  const dest = DATA.destinataire;
  if (!dest) return;
  const txt = (dest.service || dest.organisme) + '\n' + (dest.adresse || '') + '\n' + (dest.code_postal || '') + ' ' + (dest.ville || '');
  navigator.clipboard.writeText(txt).then(function () { showToast('Adresse copiée.'); });
}

/* ================= ONGLETS ================= */

function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });
}

/* ================= SAUVEGARDE ================= */

function markDirty() {
  const el = document.getElementById('save-indicator');
  el.textContent = 'Modifications non enregistrées…';
  el.className = 'save-indicator dirty';
}
function markSaved() {
  const el = document.getElementById('save-indicator');
  el.textContent = 'Enregistré à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  el.className = 'save-indicator saved';
}

window.addEventListener('beforeunload', function (e) {
  const el = document.getElementById('save-indicator');
  if (el && el.classList.contains('dirty')) {
    e.preventDefault();
    e.returnValue = '';
  }
});

/* ================= ADMINISTRATIF ================= */

function fillAdminForm() {
  const c = DATA.candidat || {};
  const d = DATA.dossier;

  const typeSel = document.getElementById('a-type_distinction');
  typeSel.innerHTML = CONFIG.distinctionsTypes.filter(function (t) { return t.actif; })
    .map(function (t) { return '<option value="' + t.id + '">' + escapeHtml(t.nom) + '</option>'; }).join('');
  typeSel.value = d.type_distinction;
  fillEchelonOptions();
  document.getElementById('a-echelon').value = d.echelon || '';

  document.getElementById('a-promotion_annee').value = d.promotion_annee || '';
  document.getElementById('a-departement').value = d.departement || '';

  ['civilite', 'nom', 'nom_naissance', 'prenom', 'date_naissance', 'lieu_naissance',
    'departement_naissance', 'nationalite', 'adresse', 'complement', 'code_postal', 'ville',
    'telephone', 'email', 'profession', 'fonction', 'organisme', 'organisme_adresse'].forEach(function (f) {
    const el = document.getElementById('a-' + f);
    if (el) el.value = c[f] || '';
  });
  document.getElementById('a-departement_candidat').value = c.departement || '';
  updateAgeDisplay();

  loadDestinatairesOptions();
  updateAncienneteHint();
}

function fillEchelonOptions() {
  const typeId = document.getElementById('a-type_distinction').value;
  const type = CONFIG.distinctionsTypes.find(function (t) { return t.id === typeId; });
  const sel = document.getElementById('a-echelon');
  sel.innerHTML = (type ? type.echelons : []).map(function (e) { return '<option value="' + e + '">' + e + '</option>'; }).join('');
}

function updateAncienneteHint() {
  const typeId = document.getElementById('a-type_distinction').value;
  const type = CONFIG.distinctionsTypes.find(function (t) { return t.id === typeId; });
  document.getElementById('anciennete-hint').textContent = type ? (type.anciennete_info || '') : '';
}

function updateAgeDisplay() {
  const dn = document.getElementById('a-date_naissance').value;
  if (!dn) { document.getElementById('a-age').value = ''; return; }
  const d = new Date(dn);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  document.getElementById('a-age').value = isNaN(age) ? '' : age + ' ans';
}

async function loadDestinatairesOptions() {
  try {
    const list = await apiGet('getDestinataires', { type_distinction: DATA.dossier.type_distinction, departement: DATA.dossier.departement });
    const sel = document.getElementById('a-autorite_destinataire_id');
    sel.innerHTML = '<option value="">- À sélectionner -</option>' +
      list.map(function (dst) { return '<option value="' + dst.id + '">' + escapeHtml(dst.service || dst.organisme) + (dst.ville ? ' (' + dst.ville + ')' : '') + '</option>'; }).join('');
    sel.value = DATA.dossier.autorite_destinataire_id || '';
  } catch (e) { /* non bloquant */ }
}

function setupAutosaveFields() {
  const dossierFieldIds = ['a-type_distinction', 'a-echelon', 'a-promotion_annee', 'a-departement', 'a-autorite_destinataire_id'];
  const candidatFieldMap = {
    'a-civilite': 'civilite', 'a-nom': 'nom', 'a-nom_naissance': 'nom_naissance', 'a-prenom': 'prenom',
    'a-date_naissance': 'date_naissance', 'a-lieu_naissance': 'lieu_naissance',
    'a-departement_naissance': 'departement_naissance', 'a-nationalite': 'nationalite',
    'a-adresse': 'adresse', 'a-complement': 'complement', 'a-code_postal': 'code_postal',
    'a-ville': 'ville', 'a-departement_candidat': 'departement', 'a-telephone': 'telephone',
    'a-email': 'email', 'a-profession': 'profession', 'a-fonction': 'fonction',
    'a-organisme': 'organisme', 'a-organisme_adresse': 'organisme_adresse'
  };

  const saveAdmin = debounce(async function () {
    const dossierUpdates = {};
    dossierFieldIds.forEach(function (id) { dossierUpdates[id.replace('a-', '')] = document.getElementById(id).value; });
    const candidatUpdates = {};
    Object.keys(candidatFieldMap).forEach(function (id) { candidatUpdates[candidatFieldMap[id]] = document.getElementById(id).value; });
    try {
      await apiPost('updateDossier', { id: DOSSIER_ID, dossier: dossierUpdates, candidat: candidatUpdates });
      markSaved();
      await reloadDossier();
    } catch (err) { showToast('Erreur : ' + err.message); }
  }, 700);

  document.getElementById('a-type_distinction').addEventListener('change', function () {
    fillEchelonOptions(); updateAncienneteHint(); markDirty(); saveAdmin();
  });
  document.getElementById('a-date_naissance').addEventListener('change', updateAgeDisplay);

  ['a-echelon', 'a-promotion_annee', 'a-departement', 'a-autorite_destinataire_id'].concat(Object.keys(candidatFieldMap))
    .forEach(function (id) {
      const el = document.getElementById(id);
      el.addEventListener('input', function () { markDirty(); saveAdmin(); });
      el.addEventListener('change', function () { markDirty(); saveAdmin(); });
    });

  // Mérites : autosave
  const saveMerites = debounce(async function () {
    try {
      await apiPost('updateMerites', {
        id: DOSSIER_ID,
        notes_libres: document.getElementById('m-notes_libres').value,
        resume_court: document.getElementById('m-resume_court').value,
        expose_developpe: document.getElementById('m-expose_developpe').value
      });
      markSaved();
    } catch (err) { showToast('Erreur : ' + err.message); }
  }, 800);
  ['m-notes_libres', 'm-resume_court', 'm-expose_developpe'].forEach(function (id) {
    document.getElementById(id).addEventListener('input', function () { markDirty(); saveMerites(); });
  });
}

function fillMerites() {
  document.getElementById('m-notes_libres').value = DATA.dossier.notes_libres || '';
  document.getElementById('m-resume_court').value = DATA.dossier.resume_court || '';
  document.getElementById('m-expose_developpe').value = DATA.dossier.expose_developpe || '';
}

/* ================= PARCOURS ================= */

function renderParcours() {
  const list = DATA.parcours.slice().sort(function (a, b) { return String(a.date_debut || '').localeCompare(String(b.date_debut || '')); });
  document.getElementById('parcours-anciennete').textContent = "Ancienneté utile estimée : " + DATA.ancienneteAnnees + ' an(s)';
  const zone = document.getElementById('parcours-zone');
  if (list.length === 0) { zone.innerHTML = '<div class="empty">Aucune ligne de parcours pour le moment.</div>'; return; }
  zone.innerHTML = '<ul class="timeline">' + list.map(function (p) {
    return '<li><span class="t-date">' + formatDateFr(p.date_debut) + ' – ' + (p.date_fin ? formatDateFr(p.date_fin) : "aujourd'hui") + '</span>' +
      '<div class="t-desc" style="flex:1;"><b>' + escapeHtml(p.fonction || '') + '</b>' + (p.organisme ? ' - ' + escapeHtml(p.organisme) : '') +
      (p.association ? ' (' + escapeHtml(p.association) + ')' : '') +
      (p.description ? '<br><span style="color:var(--text3);font-size:12.5px;">' + escapeHtml(p.description) + '</span>' : '') + '</div>' +
      '<div><button class="btn btn-sm" onclick="openParcoursModal(\'' + p.id + '\')">Modifier</button> ' +
      '<button class="btn btn-sm btn-danger" onclick="deleteParcours(\'' + p.id + '\')">Suppr.</button></div></li>';
  }).join('') + '</ul>';
}

function openParcoursModal(id) {
  const p = id ? DATA.parcours.find(function (x) { return x.id === id; }) : {};
  openModal('<h3>' + (id ? 'Modifier' : 'Ajouter') + ' une ligne de parcours</h3>' +
    '<div class="grid grid-2">' +
    '<div class="field"><label>Date de début</label><input type="date" id="mp-date_debut" value="' + (p.date_debut || '') + '"></div>' +
    '<div class="field"><label>Date de fin (laisser vide si en cours)</label><input type="date" id="mp-date_fin" value="' + (p.date_fin || '') + '"></div>' +
    '</div>' +
    '<div class="grid grid-2">' +
    '<div class="field"><label>Organisme</label><input type="text" id="mp-organisme" value="' + escapeHtml(p.organisme || '') + '"></div>' +
    '<div class="field"><label>Association</label><input type="text" id="mp-association" value="' + escapeHtml(p.association || '') + '"></div>' +
    '</div>' +
    '<div class="grid grid-2">' +
    '<div class="field"><label>Fonction</label><input type="text" id="mp-fonction" value="' + escapeHtml(p.fonction || '') + '"></div>' +
    '<div class="field"><label>Domaine</label><input type="text" id="mp-domaine" value="' + escapeHtml(p.domaine || '') + '"></div>' +
    '</div>' +
    '<div class="field"><label>Description</label><textarea id="mp-description" rows="3">' + escapeHtml(p.description || '') + '</textarea></div>' +
    '<div class="grid grid-2">' +
    '<div class="field"><label>Type d\'activité</label><select id="mp-type_activite"><option value="Bénévole"' + (p.type_activite === 'Bénévole' ? ' selected' : '') + '>Bénévole</option><option value="Professionnel"' + (p.type_activite === 'Professionnel' ? ' selected' : '') + '>Professionnel</option></select></div>' +
    '<div class="field"><label>Années estimées</label><input type="number" step="0.5" id="mp-annees_estimees" value="' + (p.annees_estimees || '') + '"></div>' +
    '</div>' +
    '<div class="field"><label>Observations</label><textarea id="mp-observations" rows="2">' + escapeHtml(p.observations || '') + '</textarea></div>' +
    '<div class="modal-actions"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn btn-primary" onclick="saveParcours(' + (id ? "'" + id + "'" : 'null') + ')">Enregistrer</button></div>');
}

async function saveParcours(id) {
  const payload = {
    date_debut: val('mp-date_debut'), date_fin: val('mp-date_fin'), organisme: val('mp-organisme'),
    association: val('mp-association'), fonction: val('mp-fonction'), domaine: val('mp-domaine'),
    description: val('mp-description'), type_activite: val('mp-type_activite'), annees_estimees: val('mp-annees_estimees'),
    observations: val('mp-observations')
  };
  try {
    if (id) { payload.id = id; await apiPost('updateParcours', payload); }
    else { payload.dossier_id = DOSSIER_ID; await apiPost('addParcours', payload); }
    closeModal(); showToast('Parcours enregistré.'); await reloadDossier();
  } catch (err) { showToast('Erreur : ' + err.message); }
}

async function deleteParcours(id) {
  if (!confirm('Supprimer cette ligne de parcours ?')) return;
  try { await apiPost('deleteParcours', { id: id }); showToast('Ligne supprimée.'); await reloadDossier(); }
  catch (err) { showToast('Erreur : ' + err.message); }
}

/* ================= FAITS MARQUANTS ================= */

const CATEGORIES_FAITS = ['Responsabilités', 'Actions réalisées', 'Résultats obtenus', 'Événements organisés',
  'Développement association', 'Actions jeunesse', 'Actions sportives', 'Engagement associatif',
  'Rayonnement local', 'Distinction déjà reçue'];

function renderFaits() {
  const list = DATA.faits;
  const zone = document.getElementById('faits-zone');
  if (list.length === 0) { zone.innerHTML = '<div class="empty">Aucun fait marquant enregistré.</div>'; return; }
  zone.innerHTML = list.map(function (f) {
    return '<div class="doc-item"><div><div class="doc-name">' + escapeHtml(f.categorie || '') + '</div>' +
      '<div class="doc-meta">' + escapeHtml(f.description || '') + (f.date ? ' - ' + formatDateFr(f.date) : '') + '</div></div>' +
      '<div><button class="btn btn-sm" onclick="openFaitModal(\'' + f.id + '\')">Modifier</button> ' +
      '<button class="btn btn-sm btn-danger" onclick="deleteFait(\'' + f.id + '\')">Suppr.</button></div></div>';
  }).join('');
}

function openFaitModal(id) {
  const f = id ? DATA.faits.find(function (x) { return x.id === id; }) : {};
  openModal('<h3>' + (id ? 'Modifier' : 'Ajouter') + ' un fait marquant</h3>' +
    '<div class="field"><label>Catégorie</label><select id="mf-categorie">' +
    CATEGORIES_FAITS.map(function (c) { return '<option' + (f.categorie === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label>Description</label><textarea id="mf-description" rows="3">' + escapeHtml(f.description || '') + '</textarea></div>' +
    '<div class="field"><label>Date (facultatif)</label><input type="date" id="mf-date" value="' + (f.date || '') + '"></div>' +
    '<div class="modal-actions"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn btn-primary" onclick="saveFait(' + (id ? "'" + id + "'" : 'null') + ')">Enregistrer</button></div>');
}

async function saveFait(id) {
  const payload = { categorie: val('mf-categorie'), description: val('mf-description'), date: val('mf-date') };
  try {
    if (id) { payload.id = id; await apiPost('updateFait', payload); }
    else { payload.dossier_id = DOSSIER_ID; payload.ordre = DATA.faits.length; await apiPost('addFait', payload); }
    closeModal(); showToast('Fait enregistré.'); await reloadDossier();
  } catch (err) { showToast('Erreur : ' + err.message); }
}

async function deleteFait(id) {
  if (!confirm('Supprimer ce fait marquant ?')) return;
  try { await apiPost('deleteFait', { id: id }); showToast('Supprimé.'); await reloadDossier(); }
  catch (err) { showToast('Erreur : ' + err.message); }
}

/* ================= DISTINCTIONS ANTÉRIEURES ================= */

function renderDistinctions() {
  const list = DATA.distinctionsAnterieures;
  const zone = document.getElementById('distinctions-zone');
  if (list.length === 0) { zone.innerHTML = '<div class="empty">Aucune distinction antérieure enregistrée.</div>'; return; }
  zone.innerHTML = list.map(function (d) {
    return '<div class="doc-item"><div><div class="doc-name">' + escapeHtml(d.distinction || '') + (d.echelon ? ' - ' + escapeHtml(d.echelon) : '') + '</div>' +
      '<div class="doc-meta">Attribuée le ' + formatDateFr(d.date_attribution) + (d.observations ? ' · ' + escapeHtml(d.observations) : '') + '</div></div>' +
      '<div><button class="btn btn-sm" onclick="openDistinctionModal(\'' + d.id + '\')">Modifier</button> ' +
      '<button class="btn btn-sm btn-danger" onclick="deleteDistinction(\'' + d.id + '\')">Suppr.</button></div></div>';
  }).join('');
}

function openDistinctionModal(id) {
  const d = id ? DATA.distinctionsAnterieures.find(function (x) { return x.id === id; }) : {};
  openModal('<h3>' + (id ? 'Modifier' : 'Ajouter') + ' une distinction antérieure</h3>' +
    '<div class="grid grid-2">' +
    '<div class="field"><label>Décoration / distinction</label><input type="text" id="md-distinction" value="' + escapeHtml(d.distinction || '') + '"></div>' +
    '<div class="field"><label>Échelon</label><input type="text" id="md-echelon" value="' + escapeHtml(d.echelon || '') + '"></div>' +
    '</div><div class="grid grid-2">' +
    '<div class="field"><label>Date d\'attribution</label><input type="date" id="md-date_attribution" value="' + (d.date_attribution || '') + '"></div>' +
    '<div class="field"><label>Date du décret/arrêté</label><input type="date" id="md-date_decret" value="' + (d.date_decret || '') + '"></div>' +
    '</div>' +
    '<div class="field"><label>Observations</label><textarea id="md-observations" rows="2">' + escapeHtml(d.observations || '') + '</textarea></div>' +
    '<div class="modal-actions"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn btn-primary" onclick="saveDistinction(' + (id ? "'" + id + "'" : 'null') + ')">Enregistrer</button></div>');
}

async function saveDistinction(id) {
  const payload = {
    distinction: val('md-distinction'), echelon: val('md-echelon'),
    date_attribution: val('md-date_attribution'), date_decret: val('md-date_decret'), observations: val('md-observations')
  };
  try {
    if (id) { payload.id = id; await apiPost('updateDistinctionAnterieure', payload); }
    else { payload.dossier_id = DOSSIER_ID; await apiPost('addDistinctionAnterieure', payload); }
    closeModal(); showToast('Enregistré.'); await reloadDossier();
  } catch (err) { showToast('Erreur : ' + err.message); }
}

async function deleteDistinction(id) {
  if (!confirm('Supprimer cette distinction antérieure ?')) return;
  try { await apiPost('deleteDistinctionAnterieure', { id: id }); showToast('Supprimé.'); await reloadDossier(); }
  catch (err) { showToast('Erreur : ' + err.message); }
}

/* ================= DOCUMENTS ================= */

function renderDocuments() {
  const sel = document.getElementById('doc-type');
  if (sel.options.length === 0) {
    sel.innerHTML = PIECE_TYPES.map(function (t) { return '<option value="' + t.code + '">' + t.label + '</option>'; }).join('');
  }
  const zone = document.getElementById('documents-zone');
  const list = DATA.documents;
  if (list.length === 0) { zone.innerHTML = '<div class="empty">Aucune pièce déposée.</div>'; return; }
  zone.innerHTML = list.map(function (d) {
    const typeLabel = (PIECE_TYPES.find(function (t) { return t.code === d.type; }) || {}).label || d.type;
    return '<div class="doc-item"><div><div class="doc-name">' + escapeHtml(d.nom) + '</div>' +
      '<div class="doc-meta">' + escapeHtml(typeLabel) + ' · ' + formatDateFr(d.date) + (d.commentaire ? ' · ' + escapeHtml(d.commentaire) : '') + '</div></div>' +
      '<div><a class="btn btn-sm" href="' + d.drive_url + '" target="_blank" rel="noopener">Ouvrir</a> ' +
      '<button class="btn btn-sm btn-danger" onclick="deleteDocument(\'' + d.id + '\')">Suppr.</button></div></div>';
  }).join('');
}

document.addEventListener('DOMContentLoaded', function () {
  const drop = document.getElementById('doc-drop');
  const input = document.getElementById('doc-file');
  if (!drop) return;
  drop.addEventListener('click', function () { input.click(); });
  drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('drag'); });
  drop.addEventListener('dragleave', function () { drop.classList.remove('drag'); });
  drop.addEventListener('drop', function (e) {
    e.preventDefault(); drop.classList.remove('drag');
    if (e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]);
  });
  input.addEventListener('change', function () { if (input.files[0]) uploadFile(input.files[0]); });
});

function fileToBase64(file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onload = function () { resolve(reader.result.split(',')[1]); };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadFile(file) {
  const statusEl = document.getElementById('doc-upload-status');
  if (file.size > 25 * 1024 * 1024) { statusEl.textContent = 'Fichier trop volumineux (25 Mo max).'; return; }
  statusEl.textContent = 'Envoi de ' + file.name + '…';
  try {
    const base64 = await fileToBase64(file);
    await apiPost('uploadDocument', {
      dossier_id: DOSSIER_ID,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      base64: base64,
      type: document.getElementById('doc-type').value,
      commentaire: document.getElementById('doc-commentaire').value
    });
    statusEl.textContent = '';
    document.getElementById('doc-commentaire').value = '';
    showToast('Pièce déposée.');
    await reloadDossier();
  } catch (err) { statusEl.textContent = 'Erreur : ' + err.message; }
}

async function deleteDocument(id) {
  if (!confirm('Supprimer cette pièce (elle sera déplacée dans la corbeille Drive) ?')) return;
  try { await apiPost('deleteDocument', { id: id }); showToast('Pièce supprimée.'); await reloadDossier(); }
  catch (err) { showToast('Erreur : ' + err.message); }
}

/* ================= ENVOI ================= */

function fillEnvoi() {
  const d = DATA.dossier;
  document.getElementById('e-date_envoi').value = d.date_envoi || '';
  document.getElementById('e-mode_envoi').value = d.mode_envoi || 'Courrier';
  document.getElementById('e-destinataire_envoi').value = d.destinataire_envoi || (DATA.destinataire ? (DATA.destinataire.service || DATA.destinataire.organisme) : '');
  document.getElementById('e-reference_admin').value = d.reference_admin || '';
  document.getElementById('e-numero_courrier').value = d.numero_courrier || '';
  document.getElementById('e-numero_recommande').value = d.numero_recommande || '';
  document.getElementById('e-commentaire_envoi').value = d.commentaire_envoi || '';
}

async function submitEnvoi() {
  try {
    await apiPost('envoyerDossier', {
      id: DOSSIER_ID,
      date_envoi: val('e-date_envoi'), mode_envoi: val('e-mode_envoi'),
      destinataire_envoi: val('e-destinataire_envoi'), reference_admin: val('e-reference_admin'),
      numero_courrier: val('e-numero_courrier'), numero_recommande: val('e-numero_recommande'),
      commentaire_envoi: val('e-commentaire_envoi')
    });
    showToast('Envoi enregistré, statut mis à jour et première relance programmée.');
    await reloadDossier();
  } catch (err) { showToast('Erreur : ' + err.message); }
}

/* ================= RELANCES ================= */

function renderRelances() {
  const zone = document.getElementById('relances-zone');
  const list = DATA.relances;
  if (list.length === 0) { zone.innerHTML = '<div class="empty">Aucune relance programmée.</div>'; return; }
  zone.innerHTML = list.map(function (r) {
    const badge = r.statut === 'Effectuée' ? '<span class="badge b-green">Effectuée</span>' :
      (r.date_prevue < todayStr_() ? '<span class="badge b-red">En retard</span>' :
        r.date_prevue === todayStr_() ? '<span class="badge b-amber">Aujourd\'hui</span>' : '<span class="badge b-neutral">Planifiée</span>');
    return '<div class="doc-item"><div><div class="doc-name">Relance niveau ' + r.niveau + ' - ' + formatDateFr(r.date_prevue) + '</div>' +
      '<div class="doc-meta">' + escapeHtml(r.commentaire || '') + (r.date_effectuee ? ' · effectuée le ' + formatDateFr(r.date_effectuee) : '') + '</div></div>' +
      '<div>' + badge + ' ' +
      (r.statut !== 'Effectuée' ? '<button class="btn btn-sm btn-gold" onclick="prepareRelance(\'' + r.id + '\')">Préparer la relance</button> <button class="btn btn-sm" onclick="doMarkRelanceDone(\'' + r.id + '\')">Marquer effectuée</button>' : '') +
      '</div></div>';
  }).join('');
}

function todayStr_() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

async function planRelance() {
  const date = document.getElementById('rel-date').value;
  if (!date) { showToast('Choisissez une date.'); return; }
  try {
    await apiPost('createRelance', { dossier_id: DOSSIER_ID, date_prevue: date, niveau: 1 });
    showToast('Relance programmée.');
    await reloadDossier();
  } catch (err) { showToast('Erreur : ' + err.message); }
}

async function doMarkRelanceDone(id) {
  try {
    await apiPost('markRelanceDone', { id: id });
    showToast('Relance marquée comme effectuée.');
    await reloadDossier();
  } catch (err) { showToast('Erreur : ' + err.message); }
}

async function prepareRelance(id) {
  try {
    const modeles = await apiGet('getModeles', { type_distinction: DATA.dossier.type_distinction });
    const modele = modeles.find(function (m) { return m.code === 'RELANCE'; }) || modeles[0];
    if (!modele) { showToast('Aucun modèle de relance configuré (page Modèles).'); return; }
    const objet = mergeModele(modele.objet, DATA);
    const corps = mergeModele(modele.corps, DATA);
    const email = DATA.destinataire ? DATA.destinataire.email : '';
    openModal('<h3>Relance - ' + escapeHtml(objet) + '</h3>' +
      '<div class="field"><label>Objet</label><input type="text" id="prep-objet" value="' + escapeHtml(objet) + '"></div>' +
      '<div class="field"><label>Corps du message</label><textarea id="prep-corps" rows="10">' + escapeHtml(corps) + '</textarea></div>' +
      '<div class="modal-actions">' +
      (email ? '<a class="btn btn-primary" href="mailto:' + encodeURIComponent(email) + '?subject=' + encodeURIComponent(objet) + '&body=' + encodeURIComponent(corps) + '">Ouvrir dans le client mail</a>' : '') +
      '<button class="btn" onclick="copyPrepared()">Copier le texte</button>' +
      '<button class="btn" onclick="closeModal()">Fermer</button></div>');
  } catch (err) { showToast('Erreur : ' + err.message); }
}

function copyPrepared() {
  const txt = 'Objet : ' + document.getElementById('prep-objet').value + '\n\n' + document.getElementById('prep-corps').value;
  navigator.clipboard.writeText(txt).then(function () { showToast('Texte copié.'); });
}

/* ================= HISTORIQUE ================= */

function renderHistorique() {
  const list = DATA.historique;
  const zone = document.getElementById('historique-zone');
  if (list.length === 0) { zone.innerHTML = '<div class="empty">Aucun événement enregistré.</div>'; return; }
  zone.innerHTML = '<ul class="timeline">' + list.map(function (h) {
    return '<li><span class="t-date">' + formatDateTimeFr(h.date) + '</span><div class="t-desc">' + escapeHtml(h.description) + '</div></li>';
  }).join('') + '</ul>';
}

async function addNote() {
  const txt = document.getElementById('hist-note').value.trim();
  if (!txt) return;
  try {
    await apiPost('addHistorique', { dossier_id: DOSSIER_ID, type: 'note', description: txt });
    document.getElementById('hist-note').value = '';
    await reloadDossier();
  } catch (err) { showToast('Erreur : ' + err.message); }
}

/* ================= ACTIONS GLOBALES ================= */

async function openDriveFolder() {
  try {
    const res = await apiPost('openOrCreateDriveFolder', { id: DOSSIER_ID });
    window.open(res.url, '_blank');
  } catch (err) { showToast('Erreur : ' + err.message); }
}

async function archiveThisDossier() {
  if (!confirm('Archiver ce dossier ? Il ne sera plus affiché dans la liste principale ni dans le tableau de bord.')) return;
  try {
    await apiPost('archiveDossier', { id: DOSSIER_ID });
    showToast('Dossier archivé.');
    await reloadDossier();
  } catch (err) { showToast('Erreur : ' + err.message); }
}

async function confirmDeleteDossier() {
  if (!confirm('Supprimer définitivement ce dossier et toutes ses données associées (parcours, pièces, historique) ? Cette action est irréversible.')) return;
  try {
    await apiPost('deleteDossier', { id: DOSSIER_ID });
    showToast('Dossier supprimé.');
    window.location.href = 'dossiers.html';
  } catch (err) { showToast('Erreur : ' + err.message); }
}

/* ================= UTILITAIRES MODALE ================= */

function openModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-overlay').classList.add('open');
}
function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); }
document.getElementById('modal-overlay') && document.getElementById('modal-overlay').addEventListener('click', function (e) {
  if (e.target.id === 'modal-overlay') closeModal();
});

function val(id) { const el = document.getElementById(id); return el ? el.value : ''; }
