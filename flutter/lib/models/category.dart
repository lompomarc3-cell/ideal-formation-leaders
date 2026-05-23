class Category {
  final String id;
  final String nom;
  final String type; // 'direct' ou 'professionnel'
  final String? description;
  final int questionCount;
  final int prix;
  final String? icone;
  final int ordre;
  /// true si la programmation est expirée/désactivée → l'utilisateur n'a accès qu'aux 5 premières questions
  final bool limitedToDemo;
  /// true si le dossier était programmé (a eu une programmation active)
  final bool isProgrammed;

  Category({
    required this.id,
    required this.nom,
    required this.type,
    this.description,
    this.questionCount = 0,
    this.prix = 0,
    this.icone,
    this.ordre = 99,
    this.limitedToDemo = false,
    this.isProgrammed = false,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: (json['id'] ?? '').toString(),
      nom: (json['nom'] ?? '').toString(),
      type: (json['type'] ?? 'direct').toString(),
      description: json['description']?.toString(),
      questionCount: (json['question_count'] is num) ? (json['question_count'] as num).toInt() : 0,
      prix: (json['prix'] is num) ? (json['prix'] as num).toInt() : 0,
      icone: json['icone']?.toString(),
      ordre: (json['ordre'] is num) ? (json['ordre'] as num).toInt() : 99,
      // _limited_to_demo : renvoyé par /api/quiz/categories quand la programmation est expirée
      limitedToDemo: json['_limited_to_demo'] == true,
      isProgrammed: json['_is_programmed'] == true,
    );
  }
}

class Question {
  final String id;
  final String questionText;
  final String optionA;
  final String optionB;
  final String optionC;
  final String optionD;
  final String bonneReponse;
  final String? explication;
  final bool isDemo;
  final String? matiere;
  final String? difficulte;

  Question({
    required this.id,
    required this.questionText,
    required this.optionA,
    required this.optionB,
    required this.optionC,
    required this.optionD,
    required this.bonneReponse,
    this.explication,
    this.isDemo = false,
    this.matiere,
    this.difficulte,
  });

  factory Question.fromJson(Map<String, dynamic> json) {
    return Question(
      id: (json['id'] ?? '').toString(),
      questionText: (json['question_text'] ?? '').toString(),
      optionA: (json['option_a'] ?? '').toString(),
      optionB: (json['option_b'] ?? '').toString(),
      optionC: (json['option_c'] ?? '').toString(),
      optionD: (json['option_d'] ?? '').toString(),
      bonneReponse: (json['bonne_reponse'] ?? '').toString().toUpperCase(),
      explication: json['explication']?.toString(),
      isDemo: json['is_demo'] == true,
      matiere: json['matiere']?.toString(),
      difficulte: json['difficulte']?.toString(),
    );
  }

  String getOption(String letter) {
    switch (letter.toUpperCase()) {
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
}

class PriceInfo {
  final String typeConcours;
  final int prixNormal;
  final int? prixPromo;
  final bool hasPromo;
  final String? dateFin;
  final String? label;

  PriceInfo({
    required this.typeConcours,
    required this.prixNormal,
    this.prixPromo,
    this.hasPromo = false,
    this.dateFin,
    this.label,
  });

  int get prixEffectif => prixPromo ?? prixNormal;

  factory PriceInfo.fromList(Map<String, dynamic> json) {
    return PriceInfo(
      typeConcours: (json['type_concours'] ?? '').toString(),
      prixNormal: (json['prix_normal'] is num) ? (json['prix_normal'] as num).toInt() : 0,
      prixPromo: (json['prix_promo'] is num) ? (json['prix_promo'] as num).toInt() : null,
      hasPromo: json['promo'] != null,
      dateFin: json['promo']?['date_fin']?.toString(),
      label: json['promo']?['label']?.toString(),
    );
  }

  factory PriceInfo.fromMap(String type, Map<String, dynamic> json) {
    return PriceInfo(
      typeConcours: type,
      prixNormal: (json['prix'] is num) ? (json['prix'] as num).toInt() : 0,
      prixPromo: (json['prix_promo'] is num) ? (json['prix_promo'] as num).toInt() : null,
      hasPromo: json['has_promo'] == true,
      dateFin: json['date_fin']?.toString(),
      label: json['label']?.toString(),
    );
  }
}
