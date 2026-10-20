// UI strings. French is the complete reference; other languages fall back to French.
// pul / man / sus are DRAFTS — only short, high-confidence strings are filled. See TRANSLATION_REVIEW.md.
export const LANGS = [
  { code: 'fr', name: 'Français', native: 'Français', flag: '🇫🇷', note: 'Langue officielle' },
  { code: 'pul', name: 'Pular', native: 'Pular (Fulfulde)', flag: '🟢', note: 'Fuuta Djalon', draft: true },
  { code: 'sus', name: 'Susu', native: 'Susu', flag: '🔵', note: 'Basse-Guinée', draft: true },
  { code: 'man', name: 'Maninka', native: 'Maninka (Mandingue)', flag: '🟠', note: 'Haute-Guinée', draft: true },
];

export const UI = {
  fr: {
    appName: 'Al-Falah GlobalAI', tagline: "L'anglais de la vie de tous les jours — même sans internet.",
    tr_read: 'Lis le document et réponds', grammarTip: 'Astuce de grammaire', pronScore: 'Prononciation :',
    chooseLang: 'Choisis ta langue', chooseLangSub: "Les explications seront dans cette langue. L'anglais s'apprend à partir d'elle.",
    draftBadge: 'en cours de traduction', continue: 'Continuer', start: 'Commencer', learn: 'Apprendre', profile: 'Profil',
    check: 'Vérifier', skip: 'Passer', next: 'Suivant', retry: 'Réessayer', done: 'Terminé',
    correct: 'Bravo !', wrong: 'Pas tout à fait', correctAnswer: 'Bonne réponse :', mistakes: 'Erreurs',
    tr_pick: 'Choisis la bonne traduction en anglais', tr_image: 'Quelle image correspond à ce mot ?',
    tr_listen: "Écoute et choisis ce que tu entends", tr_match: 'Associe les paires', tr_type: 'Écoute et écris en anglais',
    tr_bank: 'Traduis en anglais', tr_speak: 'Dis cette phrase à voix haute', typeHere: 'Écris en anglais…',
    speakBtn: 'Appuie et parle', saidIt: "Je l'ai dit", listening: "J'écoute…", tryAgainSpeak: 'Presque ! Réessaie.',
    lessonComplete: 'Leçon terminée !', xpEarned: 'XP gagnés', accuracy: 'Précision', streakDays: 'jours de suite',
    outOfHearts: 'Plus de cœurs !', heartsBack: 'Prochain cœur dans', practiceHeart: 'Pratiquer pour gagner un cœur',
    quit: 'Quitter la leçon ?', quitSub: 'Tu perdras ta progression sur cette leçon.', stay: 'Rester', leave: 'Quitter',
    totalXp: 'XP total', dayStreak: 'Série', hearts: 'Cœurs', lessonsDone: 'Leçons faites', dailyGoal: 'Objectif du jour',
    sound: 'Sons', changeLang: 'Changer de langue', reset: 'Effacer ma progression', resetConfirm: 'Effacer toute ta progression ?',
    offline: 'Hors ligne — tu peux continuer !', installApp: "Installer l'application", installed: 'Prêt hors ligne',
    unitDone: 'Unité terminée !', locked: 'Termine la leçon précédente', practice: 'Révision', legendary: 'Série en feu !',
    ttsMissing: "Pas de voix anglaise sur cet appareil : lis la phrase à la place.", min: 'min',
    lang_hint: 'Dans ta langue',
    sponsored: 'Sponsorisé', presentedBy: 'Présenté par', learnMore: 'En savoir plus',
    houseTitle: 'Votre marque ici', houseTag: 'Parrainez cette leçon et touchez des apprenants guinéens.', houseCta: 'Devenir sponsor',
    consentTitle: "Aide-nous à améliorer l'app", consentBody: "Avec ton accord, nous enregistrons comment tu utilises l'app : leçons terminées, réponses justes ou fausses, temps passé. Ni numéro de téléphone, ni position. Tu peux arrêter et effacer tes données à tout moment dans Profil.",
    consentName: 'Prénom ou pseudo (facultatif)', consentYes: "J'accepte", consentNo: 'Non merci',
    privacy: 'Politique de confidentialité',
    shareUsage: "Partager mon utilisation (anonyme)", forgetMe: 'Supprimer mes données', forgotten: 'Données supprimées', yourName: 'Ton prénom ou pseudo',
  },
  en: {
    appName: 'Al-Falah GlobalAI', tagline: 'Learn English, a little every day.',
    chooseLang: 'Choose your language', chooseLangSub: 'Explanations will use this language.',
    continue: 'Continue', start: 'Start', learn: 'Learn', profile: 'Profile', check: 'Check',
  },
  pul: {
    thanks: 'Jaaraama', continue: 'Jokku', start: 'Fuɗɗo', learn: 'Janngugo', profile: 'Kuutiniroowo',
    correct: 'Jaaraama!', done: 'Timmi',
  },
  man: {
    thanks: 'I ni ce', continue: 'Taa ɲɛ', start: 'Daminɛ', learn: 'Kalan', profile: 'Ne ka sɛbɛn',
    correct: 'I ni ce!', done: 'A banna',
  },
  sus: {
    start: 'Fɔlɔ', done: 'A raba',
  },
};
