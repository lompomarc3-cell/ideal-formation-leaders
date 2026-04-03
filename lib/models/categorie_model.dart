// lib/models/categorie_model.dart
// Correspond à la table 'categories' dans Supabase
// Colonnes: id, nom, type, description, prix, question_count, is_active, created_at

class CategorieModel {
  final String id;
  final String nom;
  final String type; // 'direct' ou 'professionnel'
  final String? description;
  final int prix; // 5000 pour direct, 20000 pour professionnel
  final int questionCount;
  final bool isActive;
  final DateTime? createdAt;

  CategorieModel({
    required this.id,
    required this.nom,
    required this.type,
    this.description,
    required this.prix,
    this.questionCount = 0,
    this.isActive = true,
    this.createdAt,
  });

  factory CategorieModel.fromJson(Map<String, dynamic> json) {
    return CategorieModel(
      id: json['id'] as String,
      nom: json['nom'] as String? ?? '',
      type: json['type'] as String? ?? 'direct',
      description: json['description'] as String?,
      prix: (json['prix'] as num?)?.toInt() ?? 5000,
      questionCount: (json['question_count'] as num?)?.toInt() ?? 0,
      isActive: json['is_active'] as bool? ?? true,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'nom': nom,
      'type': type,
      'description': description,
      'prix': prix,
      'is_active': isActive,
    };
  }

  String get prixFormate => '$prix FCFA';

  bool get isDirect => type == 'direct';
  bool get isProfessionnel => type == 'professionnel';
}
