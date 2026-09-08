/**
 * config.js
 * Paramètres publics du frontend. Ce fichier ne doit contenir AUCUN secret :
 * l'URL /exec d'Apps Script n'est pas un secret en soi (toute autorisation réelle
 * est vérifiée côté serveur via Google Sign-In), et l'ID client OAuth Google est
 * par nature public (il est visible dans toute requête d'authentification).
 *
 * Site prévu pour être hébergé sur : https://medailles.de-riberolles.fr
 * (fichier CNAME déjà présent à la racine de ce dossier frontend/).
 * L'origine JavaScript autorisée dans Google Cloud Console doit être exactement
 * https://medailles.de-riberolles.fr (voir docs/INSTALLATION.md, étape 8).
 */
const APP_CONFIG = {
  // ⚠️ À COMPLÉTER après le déploiement Apps Script : URL se terminant par /exec
  API_URL: 'https://script.google.com/macros/s/AKfycbzg84hppUAnH9Clin1KId62r5M-VoHZ38TSDDUE4gRZ7IV0-rHD_pJWVM2vwQ64Udgs4Q/exec',

  // ⚠️ À COMPLÉTER : ID client OAuth Google (Google Cloud Console > Identifiants)
  // Doit être IDENTIQUE à la propriété de script GOOGLE_CLIENT_ID côté Apps Script.
  GOOGLE_CLIENT_ID: '1093934650261-9nrpe9pu9nc9d1vlhn155osnvd09a365.apps.googleusercontent.com'
};
