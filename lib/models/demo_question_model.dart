// lib/models/demo_question_model.dart
// QCM gratuits pour la démo - table demo_questions

class DemoQuestionModel {
  final String id;
  final int numero;
  final String enonce;
  final String optionA;
  final String optionB;
  final String optionC;
  final String optionD;
  final String reponseCorrecte;
  final String explication;
  final String categorie;
  final bool isActive;

  DemoQuestionModel({
    required this.id,
    required this.numero,
    required this.enonce,
    required this.optionA,
    required this.optionB,
    required this.optionC,
    required this.optionD,
    required this.reponseCorrecte,
    this.explication = '',
    this.categorie = 'general',
    this.isActive = true,
  });

  factory DemoQuestionModel.fromJson(Map<String, dynamic> json) {
    return DemoQuestionModel(
      id: json['id'] as String? ?? '',
      numero: (json['numero'] as num?)?.toInt() ?? 0,
      enonce: json['enonce'] as String? ?? '',
      optionA: json['option_a'] as String? ?? '',
      optionB: json['option_b'] as String? ?? '',
      optionC: json['option_c'] as String? ?? '',
      optionD: json['option_d'] as String? ?? '',
      reponseCorrecte: json['reponse_correcte'] as String? ?? 'A',
      explication: json['explication'] as String? ?? '',
      categorie: json['categorie'] as String? ?? 'general',
      isActive: json['is_active'] as bool? ?? true,
    );
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
