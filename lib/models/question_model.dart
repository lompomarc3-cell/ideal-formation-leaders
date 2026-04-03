// lib/models/question_model.dart
// Correspond à la table 'questions' dans Supabase

class QuestionModel {
  final String id;
  final String categorieId;
  final String enonce;
  final String optionA;
  final String optionB;
  final String optionC;
  final String optionD;
  final String reponseCorrecte; // 'A', 'B', 'C', 'D'
  final String explication;
  final bool isPublished;
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
    this.ordre = 0,
    this.createdAt,
  });

  factory QuestionModel.fromJson(Map<String, dynamic> json) {
    // Support pour options JSONB ou colonnes séparées
    String optA = '';
    String optB = '';
    String optC = '';
    String optD = '';

    if (json['options'] != null) {
      final opts = json['options'];
      if (opts is List && opts.length >= 4) {
        optA = opts[0].toString();
        optB = opts[1].toString();
        optC = opts[2].toString();
        optD = opts[3].toString();
      }
    }

    return QuestionModel(
      id: json['id'] as String? ?? '',
      categorieId: json['categorie_id'] as String? ?? '',
      enonce: json['enonce'] as String? ?? json['question'] as String? ?? '',
      optionA: json['option_a'] as String? ?? optA,
      optionB: json['option_b'] as String? ?? optB,
      optionC: json['option_c'] as String? ?? optC,
      optionD: json['option_d'] as String? ?? optD,
      reponseCorrecte: json['reponse_correcte'] as String? ?? 
                       json['correct_answer'] as String? ?? 'A',
      explication: json['explication'] as String? ?? 
                   json['explanation'] as String? ?? '',
      isPublished: json['is_published'] as bool? ?? true,
      ordre: (json['ordre'] as num?)?.toInt() ?? 0,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'categorie_id': categorieId,
      'enonce': enonce,
      'option_a': optionA,
      'option_b': optionB,
      'option_c': optionC,
      'option_d': optionD,
      'reponse_correcte': reponseCorrecte,
      'explication': explication,
      'is_published': isPublished,
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
