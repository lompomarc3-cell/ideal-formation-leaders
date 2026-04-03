// lib/models/question_model.dart
// Adapté au vrai schéma: questions(id, category_id, enonce, option_a/b/c/d, reponse_correcte, explication, annee, matiere, difficulte, is_demo, is_active, created_at)
class QuestionModel {
  final String id;
  final String categoryId;
  // sousCategorieId gardé pour compatibilité, mais correspond à categoryId
  String get sousCategorieId => categoryId;
  final String enonce;
  final String optionA;
  final String optionB;
  final String optionC;
  final String optionD;
  final String reponseCorrecte; // 'A', 'B', 'C', 'D'
  final String explication;
  final String? annee;
  final String? matiere;
  final String? difficulte;
  final bool isDemo;
  final bool isActive;
  final DateTime? createdAt;

  // Pour compatibilité avec les options en liste
  List<OptionModel> get options => [
        OptionModel(id: 'A', texte: optionA, isCorrect: reponseCorrecte == 'A'),
        OptionModel(id: 'B', texte: optionB, isCorrect: reponseCorrecte == 'B'),
        OptionModel(id: 'C', texte: optionC, isCorrect: reponseCorrecte == 'C'),
        OptionModel(id: 'D', texte: optionD, isCorrect: reponseCorrecte == 'D'),
      ];

  bool get isPublished => isActive;
  int get ordre => 0;

  QuestionModel({
    required this.id,
    required this.categoryId,
    required this.enonce,
    required this.optionA,
    required this.optionB,
    required this.optionC,
    required this.optionD,
    required this.reponseCorrecte,
    this.explication = '',
    this.annee,
    this.matiere,
    this.difficulte,
    this.isDemo = false,
    this.isActive = true,
    this.createdAt,
  });

  factory QuestionModel.fromMap(Map<String, dynamic> map) {
    return QuestionModel(
      id: map['id']?.toString() ?? '',
      categoryId: map['category_id']?.toString() ?? map['sous_categorie_id']?.toString() ?? '',
      enonce: map['enonce'] as String? ?? '',
      optionA: map['option_a'] as String? ?? '',
      optionB: map['option_b'] as String? ?? '',
      optionC: map['option_c'] as String? ?? '',
      optionD: map['option_d'] as String? ?? '',
      reponseCorrecte: map['reponse_correcte'] as String? ?? 'A',
      explication: map['explication'] as String? ?? '',
      annee: map['annee']?.toString(),
      matiere: map['matiere'] as String?,
      difficulte: map['difficulte'] as String?,
      isDemo: map['is_demo'] as bool? ?? false,
      isActive: map['is_active'] as bool? ?? true,
      createdAt: map['created_at'] != null
          ? DateTime.tryParse(map['created_at'].toString())
          : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'category_id': categoryId,
      'enonce': enonce,
      'option_a': optionA,
      'option_b': optionB,
      'option_c': optionC,
      'option_d': optionD,
      'reponse_correcte': reponseCorrecte,
      'explication': explication,
      'annee': annee,
      'matiere': matiere,
      'difficulte': difficulte,
      'is_demo': isDemo,
      'is_active': isActive,
    };
  }

  String getOptionText(String lettre) {
    switch (lettre) {
      case 'A': return optionA;
      case 'B': return optionB;
      case 'C': return optionC;
      case 'D': return optionD;
      default: return '';
    }
  }
}

class OptionModel {
  final String id;
  final String texte;
  final bool isCorrect;

  OptionModel({
    required this.id,
    required this.texte,
    required this.isCorrect,
  });

  factory OptionModel.fromMap(Map<String, dynamic> map) {
    return OptionModel(
      id: map['id']?.toString() ?? '',
      texte: map['texte'] as String? ?? '',
      isCorrect: map['is_correct'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'texte': texte,
      'is_correct': isCorrect,
    };
  }
}
