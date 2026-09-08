/**
 * wizard.js — assistant de création d'une nouvelle candidature en 4 étapes.
 */

let wizardStep = 1;
let wizardConfig = null;

async function initWizard() {
  try {
    wizardConfig = await apiGet('getConfig');
    const sel = document.getElementById('w-type_distinction');
    sel.innerHTML = wizardConfig.distinctionsTypes.filter(function (t) { return t.actif; })
      .map(function (t) { return '<option value="' + t.id + '">' + escapeHtml(t.nom) + '</option>'; }).join('');
    sel.addEventListener('change', updateEchelons);
    updateEchelons();
    document.getElementById('w-promotion_annee').value = wizardConfig.configMap.ANNEE_COURANTE || new Date().getFullYear();
  } catch (err) { showToast('Erreur de chargement de la configuration : ' + err.message); }
}

function updateEchelons() {
  const typeId = document.getElementById('w-type_distinction').value;
  const type = wizardConfig.distinctionsTypes.find(function (t) { return t.id === typeId; });
  document.getElementById('w-echelon').innerHTML = (type ? type.echelons : []).map(function (e) { return '<option>' + e + '</option>'; }).join('');
  document.getElementById('w-anciennete-hint').textContent = type ? (type.anciennete_info || '') : '';
}

function wizardNext() {
  if (wizardStep === 1 && !document.getElementById('w-type_distinction').value) { showToast('Choisissez un type de distinction.'); return; }
  if (wizardStep === 2 && (!val('w-nom') || !val('w-prenom'))) { showToast('Le nom et le prénom sont obligatoires.'); return; }
  if (wizardStep === 4) { createCandidature(); return; }

  document.getElementById('wp-' + wizardStep).style.display = 'none';
  document.getElementById('ws-' + wizardStep).classList.remove('active');
  document.getElementById('ws-' + wizardStep).classList.add('done');
  wizardStep++;
  document.getElementById('wp-' + wizardStep).style.display = 'block';
  document.getElementById('ws-' + wizardStep).classList.add('active');
  document.getElementById('w-prev').disabled = false;
  if (wizardStep === 4) { renderRecap(); document.getElementById('w-next').textContent = 'Créer le dossier'; }
}

function wizardPrev() {
  if (wizardStep === 1) return;
  document.getElementById('wp-' + wizardStep).style.display = 'none';
  document.getElementById('ws-' + wizardStep).classList.remove('active');
  wizardStep--;
  document.getElementById('wp-' + wizardStep).style.display = 'block';
  document.getElementById('ws-' + wizardStep).classList.remove('done');
  document.getElementById('ws-' + wizardStep).classList.add('active');
  document.getElementById('w-prev').disabled = wizardStep === 1;
  document.getElementById('w-next').textContent = 'Suivant →';
}

function renderRecap() {
  document.getElementById('w-recap').innerHTML =
    '<table><tbody>' +
    '<tr><td><b>Distinction</b></td><td>' + escapeHtml(val('w-type_distinction')) + ' — ' + escapeHtml(val('w-echelon')) + ' (' + escapeHtml(val('w-promotion_annee')) + ')</td></tr>' +
    '<tr><td><b>Candidat</b></td><td>' + escapeHtml(val('w-civilite')) + ' ' + escapeHtml(val('w-prenom')) + ' ' + escapeHtml(val('w-nom').toUpperCase()) + '</td></tr>' +
    '<tr><td><b>Né(e) le</b></td><td>' + (val('w-date_naissance') ? formatDateFr(val('w-date_naissance')) : '—') + ' à ' + escapeHtml(val('w-lieu_naissance') || '—') + '</td></tr>' +
    '<tr><td><b>Adresse</b></td><td>' + escapeHtml(val('w-adresse') || '—') + ', ' + escapeHtml(val('w-code_postal') || '') + ' ' + escapeHtml(val('w-ville') || '') + '</td></tr>' +
    '<tr><td><b>Organisme</b></td><td>' + escapeHtml(val('w-organisme') || '—') + '</td></tr>' +
    '</tbody></table>';
}

async function createCandidature() {
  const btn = document.getElementById('w-next');
  btn.disabled = true; btn.textContent = 'Création en cours…';
  try {
    const res = await apiPost('createDossier', {
      dossier: {
        type_distinction: val('w-type_distinction'), echelon: val('w-echelon'),
        promotion_annee: val('w-promotion_annee'), departement: val('w-departement')
      },
      candidat: {
        civilite: val('w-civilite'), nom: val('w-nom'), prenom: val('w-prenom'),
        date_naissance: val('w-date_naissance'), lieu_naissance: val('w-lieu_naissance'),
        adresse: val('w-adresse'), ville: val('w-ville'), code_postal: val('w-code_postal'),
        email: val('w-email'), organisme: val('w-organisme'), fonction: val('w-fonction')
      }
    });
    showToast('Dossier créé.');
    window.location.href = 'dossier.html?id=' + encodeURIComponent(res.dossier.id);
  } catch (err) {
    showToast('Erreur : ' + err.message);
    btn.disabled = false; btn.textContent = 'Créer le dossier';
  }
}

function val(id) { const el = document.getElementById(id); return el ? el.value : ''; }

initWizard();
