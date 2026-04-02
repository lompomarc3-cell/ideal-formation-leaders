// lib/models/sous_categorie_model.dart
class SousCategorieModel {
  final String id;
  final String categorieId;
  final String nom;
  final String typeConcours;
  final int ordre;
  final String? description;
  final String? icon;
  final int? nombreQuestions;

  SousCategorieModel({
    required this.id,
    required this.categorieId,
    required this.nom,
    required this.typeConcours,
    required this.ordre,
    this.description,
    this.icon,
    this.nombreQuestions,
  });

  factory SousCategorieModel.fromMap(Map<String, dynamic> map) {
    return SousCategorieModel(
      id: map['id']?.toString() ?? '',
      categorieId: map['categorie_id']?.toString() ?? '',
      nom: map['nom'] as String? ?? '',
      typeConcours: map['type_concours'] as String? ?? 'direct',
      ordre: map['ordre'] as int? ?? 0,
      description: map['description'] as String?,
      icon: map['icon'] as String?,
      nombreQuestions: map['nombre_questions'] as int?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'categorie_id': categorieId,
      'nom': nom,
      'type_concours': typeConcours,
      'ordre': ordre,
      'description': description,
      'icon': icon,
    };
  }
}
