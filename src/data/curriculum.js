// Units -> lessons. Each lesson lists vocabulary keys (W) and phrase keys (P).
// Optional: tip (grammar card shown before the lesson), read (reading-comprehension exercise).
export const UNITS = [
  { id: 'u1', color: '#C9963A', emoji: '👋', title: { en: 'Greetings', fr: 'Salutations' }, lessons: [
    { id: 'u1l1', w: ['hello', 'goodmorning', 'goodbye', 'thanks', 'please'], p: ['hi'] },
    { id: 'u1l2', w: ['yes', 'no', 'sorry', 'thanks', 'friend'], p: ['fine', 'nicemeet'] },
    { id: 'u1l3', w: ['name', 'friend', 'hello', 'sorry'], p: ['whatname', 'myname', 'fromguinea'] } ] },
  { id: 'u2', color: '#4A9FD4', emoji: '👨‍👩‍👧', title: { en: 'Family & People', fr: 'Famille & personnes' }, lessons: [
    { id: 'u2l1', w: ['mother', 'father', 'child', 'man', 'woman'], p: ['mymother'] },
    { id: 'u2l2', w: ['brother', 'sister', 'friend', 'house'], p: ['myfriend', 'havechild'] } ] },
  { id: 'u3', color: '#8B6FD4', emoji: '🔢', title: { en: 'Numbers 1–10', fr: 'Nombres 1–10' }, lessons: [
    { id: 'u3l1', w: ['one', 'two', 'three', 'four', 'five'], p: ['havechild'] },
    { id: 'u3l2', w: ['six', 'seven', 'eight', 'nine', 'ten'], p: ['ihavefive', 'tenfish'] } ] },
  { id: 'u4', color: '#E8853A', emoji: '🍚', title: { en: 'Food & Drink', fr: 'Nourriture & boissons' }, lessons: [
    { id: 'u4l1', w: ['water', 'rice', 'fish', 'meat', 'bread'], p: ['wantwater', 'likerice'] },
    { id: 'u4l2', w: ['chicken', 'banana', 'mango', 'onion', 'tea'], p: ['hungry', 'buythree'] } ] },
  { id: 'u5', color: '#C0444A', emoji: '🏪', title: { en: 'At the Market', fr: 'Au marché' }, lessons: [
    { id: 'u5l1', w: ['market', 'money', 'price', 'buy', 'sell'], p: ['howmuch'] },
    { id: 'u5l2', w: ['cheap', 'expensive', 'price', 'money'], p: ['toocost', 'lowerprice'] },
    { id: 'u5l3', w: ['buy', 'sell', 'mango', 'fish'], p: ['buythree', 'howmuch'] } ] },
  { id: 'u6', color: '#3DAA72', emoji: '🚕', title: { en: 'Getting Around', fr: 'Se déplacer' }, lessons: [
    { id: 'u6l1', w: ['taxi', 'motorbike', 'bus', 'stop'], p: ['busstop', 'stophere'] },
    { id: 'u6l2', w: ['left', 'right', 'stop', 'driver', 'money'], p: ['turnleft', 'ridecost'],
      tip: { fr: 'Pour demander un prix ou un lieu, commence par « How much… ? » ou « Where is… ? ».', pat: 'Where is + the + lieu ? / How much is + the + chose ?', ex: 'Where is the bus stop?' } } ] },
  { id: 'u7', color: '#E8B455', emoji: '📲', title: { en: 'Phone & Mobile Money', fr: 'Téléphone & argent mobile' }, lessons: [
    { id: 'u7l1', w: ['phone', 'credit', 'balance', 'mobilemoney'], p: ['needcredit', 'mybalance'] },
    { id: 'u7l2', w: ['send', 'agent', 'mobilemoney', 'money', 'mother'], p: ['sendmoney'],
      tip: { fr: "« I want to + verbe » = « Je veux + verbe ». C'est poli et très utile.", pat: 'I want to + verbe de base', ex: 'I want to send money.' } } ] },
  { id: 'u8', color: '#16A085', emoji: '💼', title: { en: 'Work & Daily Life', fr: 'Travail & vie quotidienne' }, lessons: [
    { id: 'u8l1', w: ['work', 'shop', 'customer', 'boss', 'driver'], p: ['iwork', 'welcome'] },
    { id: 'u8l2', w: ['phone', 'today', 'tomorrow', 'work'], p: ['callme', 'mybossis'] },
    { id: 'u8l3', w: ['driver', 'customer', 'money', 'phone'], p: ['taxi', 'welcome'] } ] },
  // ── Real-life modules (from Al-Falah GlobalAI v7) ──
  { id: 'u9', color: '#3DAA72', emoji: '🛒', title: { en: 'At the Supermarket', fr: 'Au supermarché' }, lessons: [
    { id: 'u9l1', w: ['aisle', 'receipt', 'checkout', 'discount'], p: ['couldaisle', 'couldcheckout'],
      tip: { fr: '« Could you… ? » = « Pourriez-vous… ? ». Les anglophones préfèrent les demandes indirectes, plus polies que « Tell me ».', pat: 'Could you + verbe de base + complément ?', ex: 'Could you tell me where the checkout is?', ph: '« could you » se prononce /kʊdʒuː/ — comme un seul mot.' },
      read: { title: 'FRESHMART — Loyalty Card', doc: 'MEMBER BENEFITS:\n✔ Earn 1 point for every $1 spent\n✔ Exclusive member discounts every week\n✔ A special discount on your birthday 🎂\n✔ Free delivery on orders over $50\n\nELIGIBILITY: All customers aged 18+.',
        q: 'What do members receive on their birthday?', qfr: 'Que reçoivent les membres pour leur anniversaire ?', options: ['A special discount', 'Free delivery', 'One point', 'A gift card'], answer: 'A special discount' } } ] },
  { id: 'u10', color: '#4A9FD4', emoji: '🩺', title: { en: "At the Doctor's", fr: 'Chez le médecin' }, lessons: [
    { id: 'u10l1', w: ['appointment', 'symptom', 'prescription', 'fever'], p: ['sorethroat', 'needappt'],
      tip: { fr: "Chez le médecin, dis TOUJOURS depuis combien de temps : « for three days » (pendant 3 jours) ou « since yesterday » (depuis hier).", pat: "I've been + verbe-ing + for / since + durée", ex: "I've been having headaches for three days.", ph: "« I've » = /aɪv/, une seule syllabe rapide." },
      read: { title: 'CITY HEALTH CLINIC — Instructions', doc: 'DIAGNOSIS: Common cold\n\nMEDICATION:\nAmoxicillin 500mg — take twice a day with food, for 7 days\n\nReturn if fever rises above 38.9°C.\nFollow-up appointment if no improvement within 5 days.',
        q: 'How many times a day should the patient take the medication?', qfr: 'Combien de fois par jour faut-il prendre le médicament ?', options: ['Twice a day', 'Once a day', 'Three times a day', 'Every hour'], answer: 'Twice a day' } } ] },
  { id: 'u11', color: '#8B6FD4', emoji: '🤝', title: { en: 'Job Interview', fr: "Entretien d'embauche" }, lessons: [
    { id: 'u11l1', w: ['qualifications', 'strengths', 'availability', 'salary'], p: ['workedcs', 'strongest'],
      tip: { fr: "Pour parler de ton expérience, utilise « I have worked… for… » (j'ai travaillé… depuis…). Le passé simple « I worked » donne l'impression que c'est fini.", pat: 'I have + participe passé + for / since + durée', ex: 'I have worked in customer service for two years.', ph: '« I have » = /aɪv/ ou /aɪ əv/ à l\'oral.' },
      read: { title: 'BRIGHT PATH — Job Offer', doc: 'Dear Applicant,\nWe are pleased to offer you the position of Marketing Assistant.\n\nSTART DATE: Monday, September 14th\nSALARY: $48,000 per year\n\nSign and return this letter within 5 business days.',
        q: "What is the applicant's start date?", qfr: "Quelle est la date de début ?", options: ['September 14th', 'September 5th', 'October 1st', 'Monday, August 14th'], answer: 'September 14th' } } ] },
  { id: 'u12', color: '#C9963A', emoji: '🏠', title: { en: 'Renting a Home', fr: 'Louer un logement' }, lessons: [
    { id: 'u12l1', w: ['lease', 'deposit', 'utilities', 'rent'], p: ['signlease', 'utilsincl'],
      tip: { fr: "Pour une demande polie liée à l'argent ou un contrat : « If I…, could I… ? » adoucit la demande.", pat: 'If + présent, could + sujet + verbe de base… ?', ex: 'If I sign the lease today, could I move in this weekend?', ph: '« If I » se lie : /ɪfaɪ/.' },
      read: { title: 'PARKVIEW APARTMENTS — Lease', doc: 'TERM: 12 months\nMONTHLY RENT: $1,450\n\nUTILITIES INCLUDED:\n✔ Water and trash\n✘ Not included: electricity, internet, gas\n\nPets allowed with a $300 deposit.',
        q: 'What utilities are included in the rent?', qfr: 'Quelles charges sont incluses ?', options: ['Water and trash', 'Electricity and gas', 'Internet only', 'Nothing'], answer: 'Water and trash' } } ] },
];
export const ALL_LESSONS = UNITS.flatMap((u) => u.lessons.map((l) => ({ ...l, unit: u.id })));
