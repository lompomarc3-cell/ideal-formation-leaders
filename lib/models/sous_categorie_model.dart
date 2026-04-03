// lib/models/sous_categorie_model.dart
// Dans le vrai schéma Supabase, il n'y a pas de table sous_categories.
// Ce modèle sert de wrapper pour les CategorieModel afin de maintenir
// la compatibilité avec le code existant (CategoriesScreen, etc.)

class SousCategorieModel {
  final String id;
  final String categorieId;
  final String nom;
  final String typeConcours;
  final int ordre;
  final String? description;
  final String? icon;
  final int? nombreQuestions;
  final int prix;

  SousCategorieModel({
    required this.id,
    required this.categorieId,
    required this.nom,
    required this.typeConcours,
    required this.ordre,
    this.description,
    this.icon,
    this.nombreQuestions,
    this.prix = 5000,
  });

  factory SousCategorieModel.fromMap(Map<String, dynamic> map) {
    return SousCategorieModel(
      id: map['id']?.toString() ?? '',
      categorieId: map['categorie_id']?.toString() ?? map['id']?.toString() ?? '',
      nom: map['nom'] as String? ?? '',
      typeConcours: map['type_concours'] as String? ?? map['type'] as String? ?? 'direct',
      ordre: map['ordre'] as int? ?? 0,
      description: map['description'] as String?,
      icon: map['icon'] as String?,
      nombreQuestions: map['question_count'] as int?,
      prix: (map['prix'] as num?)?.toInt() ?? 5000,
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

  // Construire depuis un CategorieModel
  static SousCategorieModel fromCategorie(dynamic cat, int index) {
    return SousCategorieModel(
      id: cat.id,
      categorieId: cat.id,
      nom: cat.nom,
      typeConcours: cat.typeConcours,
      ordre: index,
      description: cat.description,
      icon: cat.icon,
      nombreQuestions: cat.questionCount,
      prix: cat.prix,
    );
  }
}
