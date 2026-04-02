// lib/models/question_model.dart
class QuestionModel {
  final String id;
  final String sousCategorieId;
  final String enonce;
  final List<OptionModel> options;
  final String explication;
  final int ordre;
  final String? auteurId;
  final DateTime? createdAt;
  final bool isPublished;

  QuestionModel({
    required this.id,
    required this.sousCategorieId,
    required this.enonce,
    required this.options,
    required this.explication,
    this.ordre = 0,
    this.auteurId,
    this.createdAt,
    this.isPublished = true,
  });

  factory QuestionModel.fromMap(Map<String, dynamic> map) {
    List<OptionModel> opts = [];
    if (map['options'] != null) {
      opts = (map['options'] as List)
          .map((o) => OptionModel.fromMap(o as Map<String, dynamic>))
          .toList();
    }
    return QuestionModel(
      id: map['id']?.toString() ?? '',
      sousCategorieId: map['sous_categorie_id']?.toString() ?? '',
      enonce: map['enonce'] as String? ?? '',
      options: opts,
      explication: map['explication'] as String? ?? '',
      ordre: map['ordre'] as int? ?? 0,
      auteurId: map['auteur_id']?.toString(),
      createdAt: map['created_at'] != null
          ? DateTime.tryParse(map['created_at'].toString())
          : null,
      isPublished: map['is_published'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'sous_categorie_id': sousCategorieId,
      'enonce': enonce,
      'options': options.map((o) => o.toMap()).toList(),
      'explication': explication,
      'ordre': ordre,
      'auteur_id': auteurId,
      'is_published': isPublished,
    };
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
