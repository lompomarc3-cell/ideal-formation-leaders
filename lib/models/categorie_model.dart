// lib/models/categorie_model.dart
// Adapté au vrai schéma Supabase: categories(id, nom, type, description, prix, question_count, is_active, created_at)
class CategorieModel {
  final String id;
  final String nom;
  final String typeConcours; // 'direct' ou 'professionnel'
  final int ordre;
  final String? description;
  final String? icon;
  final int prix;
  final int questionCount;
  final bool isActive;

  CategorieModel({
    required this.id,
    required this.nom,
    required this.typeConcours,
    required this.ordre,
    this.description,
    this.icon,
    this.prix = 5000,
    this.questionCount = 0,
    this.isActive = true,
  });

  factory CategorieModel.fromMap(Map<String, dynamic> map) {
    return CategorieModel(
      id: map['id']?.toString() ?? '',
      nom: map['nom'] as String? ?? '',
      // Champ réel dans la BD est 'type' (pas 'type_concours')
      typeConcours: map['type_concours'] as String? ?? map['type'] as String? ?? 'direct',
      // Pas de colonne 'ordre' dans la vraie BD — on utilise 0 par défaut
      ordre: map['ordre'] as int? ?? 0,
      description: map['description'] as String?,
      icon: map['icon'] as String?,
      prix: (map['prix'] as num?)?.toInt() ?? 5000,
      questionCount: (map['question_count'] as num?)?.toInt() ?? 0,
      isActive: map['is_active'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'nom': nom,
      'type': typeConcours,
      'description': description,
      'icon': icon,
      'prix': prix,
      'is_active': isActive,
    };
  }
}
