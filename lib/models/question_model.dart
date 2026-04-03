// lib/models/question_model.dart
// Adapté au VRAI schéma Supabase:
// - category_id (pas categorie_id)
// - is_active (pas is_published)
// - matiere, difficulte, annee (nouvelles colonnes)

class QuestionModel {
  final String id;
  final String categorieId; // = category_id dans Supabase
  final String enonce;
  final String optionA;
  final String optionB;
  final String optionC;
  final String optionD;
  final String reponseCorrecte; // 'A', 'B', 'C', 'D'
  final String explication;
  final bool isPublished; // = is_active dans Supabase
  final bool isDemo;
  final String matiere;
  final String difficulte;
  final int? annee;
  final int ordre;
  final DateTime? createdAt;

  QuestionModel({
    required this.id,
    required this.categorieId,
    required this.enonce,
    required this.optionA,
    required this.optionB,
    required this.optionC,
    required this.optionD,
    required this.reponseCorrecte,
    this.explication = '',
    this.isPublished = true,
    this.isDemo = false,
    this.matiere = '',
    this.difficulte = '',
    this.annee,
    this.ordre = 0,
    this.createdAt,
  });

  factory QuestionModel.fromJson(Map<String, dynamic> json) {
    return QuestionModel(
      id: json['id'] as String? ?? '',
      // Support double schéma: category_id (nouveau) et categorie_id (ancien)
      categorieId: json['category_id'] as String? ?? 
                   json['categorie_id'] as String? ?? '',
      enonce: json['enonce'] as String? ?? json['question'] as String? ?? '',
      optionA: json['option_a'] as String? ?? '',
      optionB: json['option_b'] as String? ?? '',
      optionC: json['option_c'] as String? ?? '',
      optionD: json['option_d'] as String? ?? '',
      reponseCorrecte: json['reponse_correcte'] as String? ?? 
                       json['correct_answer'] as String? ?? 'A',
      explication: json['explication'] as String? ?? 
                   json['explanation'] as String? ?? '',
      // Support double: is_active (nouveau) et is_published (ancien)
      isPublished: json['is_active'] as bool? ?? 
                   json['is_published'] as bool? ?? true,
      isDemo: json['is_demo'] as bool? ?? false,
      matiere: json['matiere'] as String? ?? '',
      difficulte: json['difficulte'] as String? ?? '',
      annee: (json['annee'] as num?)?.toInt(),
      ordre: (json['ordre'] as num?)?.toInt() ?? 0,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'category_id': categorieId, // ✅ Vrai nom de colonne
      'enonce': enonce,
      'option_a': optionA,
      'option_b': optionB,
      'option_c': optionC,
      'option_d': optionD,
      'reponse_correcte': reponseCorrecte,
      'explication': explication,
      'is_active': isPublished, // ✅ Vrai nom de colonne
      'is_demo': isDemo,
      'matiere': matiere,
    };
  }

  String getOption(String letter) {
    switch (letter.toUpperCase()) {
      case 'A': return optionA;
      case 'B': return optionB;
      case 'C': return optionC;
      case 'D': return optionD;
      default: return '';
    }
  }

  bool isCorrect(String selected) =>
      selected.toUpperCase() == reponseCorrecte.toUpperCase();
}
