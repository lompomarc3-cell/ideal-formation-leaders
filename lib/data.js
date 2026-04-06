// Demo questions - 10 fixed questions accessible sans connexion
export const DEMO_QUESTIONS = [
  {
    id: 'demo-1',
    question_text: "Quel arrêté porte création des clubs écologiques dans les établissements d'enseignement du Burkina Faso ?",
    option_a: "Arrêté N°2019-021/MENAPLN",
    option_b: "Arrêté N°2018-034/MEDD",
    option_c: "Arrêté N°2020-015/MENAPLN",
    option_d: "Arrêté N°2017-008/MEDD",
    bonne_reponse: "A",
    explication: "L'arrêté N°2019-021/MENAPLN porte création et organisation des clubs écologiques dans les établissements d'enseignement du Burkina Faso, dans le cadre de la sensibilisation à la protection de l'environnement."
  },
  {
    id: 'demo-2',
    question_text: "Selon le Code des marchés publics du Burkina Faso, quel est le seuil de passation des marchés par appel d'offres ouvert pour les travaux ?",
    option_a: "25 000 000 FCFA",
    option_b: "50 000 000 FCFA",
    option_c: "75 000 000 FCFA",
    option_d: "100 000 000 FCFA",
    bonne_reponse: "B",
    explication: "Selon le Code des marchés publics du Burkina Faso, le seuil pour les appels d'offres ouverts pour les travaux est fixé à 50 000 000 FCFA. En dessous de ce seuil, d'autres procédures simplifiées peuvent être utilisées."
  },
  {
    id: 'demo-3',
    question_text: "Quels sont les principes fondamentaux de la commande publique au Burkina Faso ?",
    option_a: "Transparence, efficacité, économie",
    option_b: "Liberté d'accès, égalité de traitement, transparence",
    option_c: "Concurrence, intégrité, célérité",
    option_d: "Neutralité, impartialité, confidentialité",
    bonne_reponse: "B",
    explication: "Les trois principes fondamentaux de la commande publique au Burkina Faso sont : la liberté d'accès à la commande publique, l'égalité de traitement des candidats, et la transparence des procédures."
  },
  {
    id: 'demo-4',
    question_text: "Quelle est la capitale du Burkina Faso ?",
    option_a: "Bobo-Dioulasso",
    option_b: "Koudougou",
    option_c: "Ouagadougou",
    option_d: "Banfora",
    bonne_reponse: "C",
    explication: "Ouagadougou est la capitale politique, administrative et économique du Burkina Faso. Elle est également la ville la plus peuplée du pays avec environ 3 millions d'habitants."
  },
  {
    id: 'demo-5',
    question_text: "En quelle année le Burkina Faso a-t-il obtenu son indépendance ?",
    option_a: "1958",
    option_b: "1960",
    option_c: "1962",
    option_d: "1964",
    bonne_reponse: "B",
    explication: "Le Burkina Faso (alors appelé Haute-Volta) a obtenu son indépendance de la France le 5 août 1960. Le pays a pris le nom de Burkina Faso en 1984 sous Thomas Sankara."
  },
  {
    id: 'demo-6',
    question_text: "De quoi est composé le drapeau national du Burkina Faso ?",
    option_a: "Deux bandes horizontales rouge et verte avec une étoile jaune",
    option_b: "Trois bandes verticales vert, blanc, rouge",
    option_c: "Une bande bleue et une rouge avec une étoile blanche",
    option_d: "Deux bandes horizontales noire et blanche avec une étoile rouge",
    bonne_reponse: "A",
    explication: "Le drapeau du Burkina Faso est composé de deux bandes horizontales égales : rouge en haut et verte en bas, avec une étoile jaune à cinq branches au centre. Il a été adopté le 4 août 1984."
  },
  {
    id: 'demo-7',
    question_text: "Quelle est la monnaie officielle du Burkina Faso ?",
    option_a: "Le Franc burkinabè",
    option_b: "Le Franc CFA (FCFA)",
    option_c: "Le Dalasi",
    option_d: "Le Cedi",
    bonne_reponse: "B",
    explication: "La monnaie officielle du Burkina Faso est le Franc CFA (FCFA), émis par la Banque Centrale des États de l'Afrique de l'Ouest (BCEAO). Cette monnaie est partagée par 8 pays de l'UEMOA."
  },
  {
    id: 'demo-8',
    question_text: "Combien de régions administratives compte le Burkina Faso ?",
    option_a: "11 régions",
    option_b: "13 régions",
    option_c: "15 régions",
    option_d: "17 régions",
    bonne_reponse: "B",
    explication: "Le Burkina Faso est divisé en 13 régions administratives, elles-mêmes subdivisées en 45 provinces et 351 communes. Les 13 régions sont dirigées par des gouverneurs nommés par le gouvernement."
  },
  {
    id: 'demo-9',
    question_text: "Quel est le fleuve principal du Burkina Faso ?",
    option_a: "La Comoé",
    option_b: "Le Nakambé (Volta Blanche)",
    option_c: "Le Mouhoun (Volta Noire)",
    option_d: "Le Pendjari",
    bonne_reponse: "C",
    explication: "Le Mouhoun, anciennement appelé Volta Noire, est le fleuve principal et le plus long du Burkina Faso. Il prend sa source dans la région des Hauts-Bassins et coule vers le Ghana."
  },
  {
    id: 'demo-10',
    question_text: "Selon la loi N°13-2007/AN du Burkina Faso, quel organisme est chargé du contrôle des marchés publics ?",
    option_a: "La Direction Générale des Marchés Publics (DGMP)",
    option_b: "L'Autorité de Régulation de la Commande Publique (ARCOP)",
    option_c: "Le Contrôle Général d'État (CGE)",
    option_d: "La Cour des Comptes",
    bonne_reponse: "B",
    explication: "L'ARCOP (Autorité de Régulation de la Commande Publique) est l'organe de régulation indépendant chargé de contrôler, réguler et évaluer le système de passation des marchés publics au Burkina Faso."
  }
]

export const CATEGORIES_DIRECT = [
  { ordre: 1, nom: "Actualité / Culture générale", icone: "🌍" },
  { ordre: 2, nom: "Français", icone: "📚" },
  { ordre: 3, nom: "Littérature et art", icone: "🎨" },
  { ordre: 4, nom: "Histoire-Géographie", icone: "🗺️" },
  { ordre: 5, nom: "SVT", icone: "🧬" },
  { ordre: 6, nom: "Psychotechniques", icone: "🧠" },
  { ordre: 7, nom: "Maths", icone: "📐" },
  { ordre: 8, nom: "Physique-Chimie", icone: "⚗️" },
  { ordre: 9, nom: "Entraînement QCM", icone: "✏️" },
  { ordre: 10, nom: "Accompagnement final", icone: "🎯" }
]

export const CATEGORIES_PRO = [
  { ordre: 1, nom: "Spécialités Vie scolaire (CASU/AASU)", icone: "🏫" },
  { ordre: 2, nom: "Spécialités CISU/AISU/ENAREF", icone: "🏛️" },
  { ordre: 3, nom: "Inspectorat (IES/IEPENF)", icone: "🔍" },
  { ordre: 4, nom: "Agrégés", icone: "🎓" },
  { ordre: 5, nom: "CAPES toutes options", icone: "📖" },
  { ordre: 6, nom: "Administrateur des hôpitaux", icone: "🏥" },
  { ordre: 7, nom: "Spécialités santé", icone: "💊" },
  { ordre: 8, nom: "Spécialités GSP", icone: "🛡️" },
  { ordre: 9, nom: "Spécialités police", icone: "👮" },
  { ordre: 10, nom: "Administrateur civil", icone: "📋" },
  { ordre: 11, nom: "Entraînement QCM", icone: "✏️" },
  { ordre: 12, nom: "Accompagnement final", icone: "🎯" }
]
