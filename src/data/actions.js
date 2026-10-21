// "Regarde & fais": a short physical action for words that can be acted out (Total Physical Response).
//   i = icon(s) shown large, fr = one-line instruction, a = animation (rise | wave | nod | pulse).
// Words that are not listed here get a generic "invent a gesture" prompt (see views/learn.js).
// Rules: culturally neutral for Guinea. No pointing at people, no left-hand actions, nothing that could offend.
const eat = (i) => ({ i, fr: 'Fais semblant de manger', a: 'nod' });
const drink = (i) => ({ i, fr: 'Fais semblant de boire', a: 'nod' });
const count = (fr) => ({ i: '✋', fr, a: 'pulse' });

export const ACT = {
  // Greetings
  hello:       { i: '👋', fr: 'Fais signe de la main, comme pour saluer un ami', a: 'wave' },
  goodmorning: { i: '🌅', fr: 'Souris et salue de la main', a: 'wave' },
  goodbye:     { i: '🙋', fr: 'Fais signe de la main pour dire au revoir', a: 'wave' },
  thanks:      { i: '🙏', fr: 'Pose ta main sur ton cœur', a: 'nod' },
  please:      { i: '🤲', fr: 'Ouvre tes deux mains devant toi, poliment', a: 'pulse' },
  yes:         { i: '🙂', fr: 'Dis « oui » en hochant la tête', a: 'nod' },
  no:          { i: '🙅', fr: 'Dis « non » en secouant la tête', a: 'wave' },
  sorry:       { i: '🙇', fr: 'Baisse un peu la tête, comme pour t’excuser', a: 'nod' },
  friend:      { i: '🤝', fr: 'Serre la main d’un ami (ou mime-le)', a: 'pulse' },
  // Numbers: show it on your fingers
  one:   count('Montre 1 doigt'),
  two:   count('Montre 2 doigts'),
  three: count('Montre 3 doigts'),
  four:  count('Montre 4 doigts'),
  five:  count('Montre 5 doigts'),
  six:   count('Compte sur tes doigts jusqu’à 6'),
  seven: count('Compte sur tes doigts jusqu’à 7'),
  eight: count('Compte sur tes doigts jusqu’à 8'),
  nine:  count('Compte sur tes doigts jusqu’à 9'),
  ten:   count('Montre tes 10 doigts'),
  // Food & drink
  rice: eat('🍚'), fish: eat('🐟'), meat: eat('🥩'), bread: eat('🍞'), chicken: eat('🍗'), banana: eat('🍌'), mango: eat('🥭'),
  tea: drink('🍵'), water: drink('💧'),
  // Market & work
  buy:   { i: '🛒', fr: 'Fais semblant de payer avec de l’argent', a: 'pulse' },
  sell:  { i: '🧾', fr: 'Tends un article, comme pour le vendre', a: 'pulse' },
  money: { i: '💵', fr: 'Fais semblant de compter des billets', a: 'pulse' },
  phone: { i: '📱', fr: 'Fais semblant de téléphoner', a: 'wave' },
  work:  { i: '💼', fr: 'Fais semblant de travailler', a: 'nod' },
  house: { i: '🏠', fr: 'Dessine un toit avec tes deux mains', a: 'rise' },
  shop:  { i: '🏬', fr: 'Fais semblant d’ouvrir la porte d’une boutique', a: 'pulse' },
  receipt: { i: '🧾', fr: 'Tends la main pour recevoir un papier', a: 'pulse' },
  credit:  { i: '📶', fr: 'Fais semblant de taper un code sur ton téléphone', a: 'pulse' },
  // Getting around
  stop:      { i: '🛑', fr: 'Lève la main, paume ouverte : stop', a: 'rise' },
  left:      { i: '⬅️', fr: 'Tourne la tête vers ta gauche', a: 'wave' },
  right:     { i: '➡️', fr: 'Tourne la tête vers ta droite', a: 'wave' },
  taxi:      { i: '🚕', fr: 'Lève la main pour arrêter un taxi', a: 'rise' },
  motorbike: { i: '🏍️', fr: 'Tiens un guidon imaginaire à deux mains', a: 'pulse' },
  bus:       { i: '🚌', fr: 'Lève la main pour arrêter le bus', a: 'rise' },
  send:      { i: '📤', fr: 'Mime l’envoi d’un message sur ton téléphone', a: 'rise' },
  // Health & strength
  fever:     { i: '🌡️', fr: 'Pose la main sur ton front', a: 'nod' },
  strengths: { i: '💪', fr: 'Plie ton bras pour montrer ta force', a: 'pulse' },
};
