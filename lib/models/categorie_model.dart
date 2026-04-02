// lib/models/categorie_model.dart
class CategorieModel {
  final String id;
  final String nom;
  final String typeConcours; // 'direct' ou 'professionnel'
  final int ordre;
  final String? description;
  final String? icon;

  CategorieModel({
    required this.id,
    required this.nom,
    required this.typeConcours,
    required this.ordre,
    this.description,
    this.icon,
  });

  factory CategorieModel.fromMap(Map<String, dynamic> map) {
    return CategorieModel(
      id: map['id']?.toString() ?? '',
      nom: map['nom'] as String? ?? '',
      typeConcours: map['type_concours'] as String? ?? 'direct',
      ordre: map['ordre'] as int? ?? 0,
      description: map['description'] as String?,
      icon: map['icon'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'nom': nom,
      'type_concours': typeConcours,
      'ordre': ordre,
      'description': description,
      'icon': icon,
    };
  }
}
