// lib/models/demo_question_model.dart

class DemoQuestion {
  final int numero;
  final String enonce;
  final String optionA;
  final String optionB;
  final String optionC;
  final String optionD;
  final String reponseCorrecte; // 'A', 'B', 'C', 'D'
  final String explication;
  final String categorie;

  const DemoQuestion({
    required this.numero,
    required this.enonce,
    required this.optionA,
    required this.optionB,
    required this.optionC,
    required this.optionD,
    required this.reponseCorrecte,
    required this.explication,
    required this.categorie,
  });

  factory DemoQuestion.fromJson(Map<String, dynamic> json) {
    return DemoQuestion(
      numero: json['numero'] as int,
      enonce: json['enonce'] as String,
      optionA: json['option_a'] as String,
      optionB: json['option_b'] as String,
      optionC: json['option_c'] as String,
      optionD: json['option_d'] as String,
      reponseCorrecte: json['reponse_correcte'] as String,
      explication: json['explication'] as String? ?? '',
      categorie: json['categorie'] as String? ?? 'general',
    );
  }

  String getOptionText(String lettre) {
    switch (lettre) {
      case 'A':
        return optionA;
      case 'B':
        return optionB;
      case 'C':
        return optionC;
      case 'D':
        return optionD;
      default:
        return '';
    }
  }

  Map<String, String> get allOptions => {
        'A': optionA,
        'B': optionB,
        'C': optionC,
        'D': optionD,
      };
}

// Les 20 QCM démo intégrés directement dans le code (fallback si DB indisponible)
final List<DemoQuestion> demoQuestionsLocales = [
  const DemoQuestion(
    numero: 1,
    enonce: 'Quel arrêté porte création de clubs écologiques au sein des établissements d\'enseignement ?',
    optionA: 'Arrêté N°2025-010 MEEA/ MESFPT/ MESRI',
    optionB: 'Arrêté N°2025-24/ MEBAPLN/SG/DRH',
    optionC: 'Arrêté N°2024-0304/ MENAPLN/ SG/ DGEC',
    optionD: 'Arrêté N°2025-176/ MESRI/ CAB',
    reponseCorrecte: 'A',
    explication: 'Cet arrêté interministériel vise à instaurer des clubs écologiques dans les lycées, collèges et centres de formation.',
    categorie: 'legislation',
  ),
  const DemoQuestion(
    numero: 2,
    enonce: 'Quel arrêté proroge la validité des attestations de succès au BEPC, BEP et CAP session 2023 ?',
    optionA: 'Arrêté N°2023-177/ MEFP/ MENAPLN',
    optionB: 'Arrêté N°2024-0304/ MENAPLN/ SG / DGEC',
    optionC: 'Arrêté N°2025-0063/ MESFPT/CB',
    optionD: 'Arrêté N°2021-0214/ PRESE/PM/MATD/MINEFID/MENAPLN',
    reponseCorrecte: 'B',
    explication: 'Cet arrêté de 2024 prolonge la validité des attestations de succès de la session 2023.',
    categorie: 'legislation',
  ),
  const DemoQuestion(
    numero: 3,
    enonce: 'Quel arrêté fixe les taux de prise en charge et indemnités diverses pour l\'organisation des examens et concours scolaires ?',
    optionA: 'Arrêté N°2025-24/ MEBAPLN/SG/DRH',
    optionB: 'Arrêté conjoint N°2023-177/ MEFP/ MENAPLN',
    optionC: 'Arrêté N°2025-176/ MESRI/ CAB',
    optionD: 'Arrêté N°2019-094/ MENAPLN/ SG/DGEFG',
    reponseCorrecte: 'B',
    explication: 'Cet arrêté conjoint de 2023 fixe les taux et indemnités liés aux examens et concours scolaires.',
    categorie: 'legislation',
  ),
  const DemoQuestion(
    numero: 4,
    enonce: 'Quel décret fixe les âges d\'entrée aux différents niveaux d\'enseignement au Burkina Faso ?',
    optionA: 'Décret N°2021-1123/ PRES/ PM/ MINEFID/ MENAPLN/ MESRI',
    optionB: 'Décret N°2019-0157/ PRES/PM/ MENA',
    optionC: 'Décret N°2009-228/ PRES/PM MASSN/MEBA/MESSRS',
    optionD: 'Arrêté N°2019-094/ MENAPLN/ SG/DGEFG',
    reponseCorrecte: 'C',
    explication: 'Ce décret de 2009 fixe les âges d\'entrée du préscolaire au supérieur.',
    categorie: 'legislation',
  ),
  const DemoQuestion(
    numero: 5,
    enonce: 'Quel arrêté porte modalité de rachat dans les enseignements post-primaire et secondaire ?',
    optionA: 'Arrêté N°2019-094/ MENAPLN/ SG /DGEFG',
    optionB: 'Arrêté N°2025-0063/ MESFPT/CB',
    optionC: 'Arrêté N°2025-010 MEEA/ MESFPT/ MESRI',
    optionD: 'Arrêté N°2022-062 MENAPLN/SG/DGD-LSCPA',
    reponseCorrecte: 'A',
    explication: 'Cet arrêté de 2019 définit les modalités de rachat au post-primaire et au secondaire.',
    categorie: 'legislation',
  ),
  const DemoQuestion(
    numero: 6,
    enonce: 'Quelle est la loi qui régit les marchés publics au Burkina Faso ?',
    optionA: 'Loi n°003-2010/AN',
    optionB: 'Loi n°039-2016/AN',
    optionC: 'Loi n°12-2005/AN',
    optionD: 'Loi n°21-2012/AN',
    reponseCorrecte: 'B',
    explication: 'La loi n°039-2016/AN portant réglementation générale des marchés publics et des délégations de service public encadre la commande publique au Burkina Faso.',
    categorie: 'marches_publics',
  ),
  const DemoQuestion(
    numero: 7,
    enonce: 'Quelle institution est chargée du contrôle a priori des marchés publics ?',
    optionA: 'Cour des Comptes',
    optionB: 'ARMP',
    optionC: 'DGCMEF',
    optionD: 'Direction de la commande publique',
    reponseCorrecte: 'C',
    explication: 'La Direction Générale du Contrôle des Marchés Publics et des Engagements Financiers (DGCMEF) exerce le contrôle a priori sur les marchés.',
    categorie: 'marches_publics',
  ),
  const DemoQuestion(
    numero: 8,
    enonce: 'Quel est l\'organe de recours en matière de marchés publics ?',
    optionA: 'Ministère de l\'Économie',
    optionB: 'ARMP',
    optionC: 'DGCMEF',
    optionD: 'Cour des Comptes',
    reponseCorrecte: 'B',
    explication: 'L\'Autorité de Régulation de la Commande Publique (ARMP) reçoit et traite les recours des candidats ou soumissionnaires.',
    categorie: 'marches_publics',
  ),
  const DemoQuestion(
    numero: 9,
    enonce: 'Quel est le seuil de passation en appel d\'offres ouvert pour les marchés de travaux ?',
    optionA: '50 millions FCFA',
    optionB: '100 millions FCFA',
    optionC: '200 millions FCFA',
    optionD: '300 millions FCFA',
    reponseCorrecte: 'C',
    explication: 'Pour les marchés de travaux, le seuil à partir duquel un appel d\'offres ouvert est obligatoire est de 200 millions FCFA.',
    categorie: 'marches_publics',
  ),
  const DemoQuestion(
    numero: 10,
    enonce: 'Quelle procédure est utilisée pour les marchés de faible montant ?',
    optionA: 'Appel d\'offres restreint',
    optionB: 'Demande de prix',
    optionC: 'Appel d\'offres ouvert',
    optionD: 'Gré à gré',
    reponseCorrecte: 'B',
    explication: 'La demande de prix est la procédure simplifiée utilisée pour les petits montants en dessous des seuils fixés.',
    categorie: 'marches_publics',
  ),
  const DemoQuestion(
    numero: 11,
    enonce: 'Quel principe impose la justification des décisions d\'attribution ?',
    optionA: 'Transparence',
    optionB: 'Confidentialité',
    optionC: 'Sélectivité',
    optionD: 'Moralité',
    reponseCorrecte: 'A',
    explication: 'Les décisions doivent pouvoir être expliquées et contrôlées selon le principe de transparence.',
    categorie: 'principes',
  ),
  const DemoQuestion(
    numero: 12,
    enonce: 'La lutte contre la corruption est directement liée au principe de :',
    optionA: 'Libre concurrence',
    optionB: 'Moralité',
    optionC: 'Efficacité',
    optionD: 'Publicité',
    reponseCorrecte: 'B',
    explication: 'Le principe de moralité exige l\'intégrité dans toutes les procédures.',
    categorie: 'principes',
  ),
  const DemoQuestion(
    numero: 13,
    enonce: 'Quel principe garantit l\'accès équitable à l\'information sur les marchés ?',
    optionA: 'Égalité de traitement',
    optionB: 'Transparence',
    optionC: 'Efficacité',
    optionD: 'Performance',
    reponseCorrecte: 'B',
    explication: 'L\'information doit être diffusée de façon claire et ouverte selon le principe de transparence.',
    categorie: 'principes',
  ),
  const DemoQuestion(
    numero: 14,
    enonce: 'Le principe de libre concurrence suppose :',
    optionA: 'Des critères flous',
    optionB: 'Une publicité suffisante',
    optionC: 'Une sélection directe',
    optionD: 'Une négociation secrète',
    reponseCorrecte: 'B',
    explication: 'Sans information, il ne peut y avoir de concurrence réelle. La publicité suffisante est donc indispensable.',
    categorie: 'principes',
  ),
  const DemoQuestion(
    numero: 15,
    enonce: 'L\'application simultanée des principes des marchés publics vise surtout à :',
    optionA: 'Complexifier les procédures',
    optionB: 'Sécuriser la commande publique',
    optionC: 'Favoriser l\'administration',
    optionD: 'Retarder les projets',
    reponseCorrecte: 'B',
    explication: 'Ces principes garantissent légalité, équité et efficacité pour sécuriser la commande publique.',
    categorie: 'principes',
  ),
  const DemoQuestion(
    numero: 16,
    enonce: 'Quelle institution nationale vérifie la gestion des fonds issus des marchés publics ?',
    optionA: 'ARCOP',
    optionB: 'Cour des comptes',
    optionC: 'DG-CMP',
    optionD: 'Ministère du Commerce',
    reponseCorrecte: 'B',
    explication: 'La Cour des comptes assure le contrôle juridictionnel des finances publiques.',
    categorie: 'controle',
  ),
  const DemoQuestion(
    numero: 17,
    enonce: 'Quel seuil approximatif est souvent utilisé pour les marchés de fournitures avant l\'appel d\'offres ?',
    optionA: '10 millions FCFA',
    optionB: '25 millions FCFA',
    optionC: '75 millions FCFA',
    optionD: '300 millions FCFA',
    reponseCorrecte: 'B',
    explication: 'Ce seuil de 25 millions FCFA sert généralement de limite pour certaines procédures simplifiées.',
    categorie: 'seuils',
  ),
  const DemoQuestion(
    numero: 18,
    enonce: 'Quel seuil déclenche généralement l\'appel d\'offres international ?',
    optionA: '10 millions FCFA',
    optionB: '50 millions FCFA',
    optionC: '500 millions FCFA',
    optionD: '5 milliards FCFA',
    reponseCorrecte: 'C',
    explication: 'Les montants très élevés (500 millions FCFA et plus) nécessitent souvent une concurrence internationale.',
    categorie: 'seuils',
  ),
  const DemoQuestion(
    numero: 19,
    enonce: 'Pour les prestations intellectuelles, quel seuil peut conduire à la sélection basée sur la qualité et le coût ?',
    optionA: '5 millions FCFA',
    optionB: '10 millions FCFA',
    optionC: '25 millions FCFA',
    optionD: '200 millions FCFA',
    reponseCorrecte: 'C',
    explication: 'Ce seuil de 25 millions FCFA peut déclencher des procédures spécifiques pour les consultants.',
    categorie: 'seuils',
  ),
  const DemoQuestion(
    numero: 20,
    enonce: 'Quelle entité administrative est chargée du contrôle a priori de la commande publique au Burkina Faso ?',
    optionA: 'ARMP',
    optionB: 'Autorité contractante',
    optionC: 'Direction générale du contrôle des marchés publics (DGCMP)',
    optionD: 'Cour des comptes',
    reponseCorrecte: 'C',
    explication: 'La DGCMP exerce le contrôle administratif préalable sur les procédures de passation des marchés publics.',
    categorie: 'controle',
  ),
];
