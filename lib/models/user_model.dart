// lib/models/user_model.dart

class UserModel {
  final String id;
  final String telephone;
  final String nom;
  final String prenom;
  final String role; // 'user', 'admin', 'superadmin'
  final List<String> abonnements; // IDs des catégories payées
  final DateTime? createdAt;

  UserModel({
    required this.id,
    required this.telephone,
    required this.nom,
    required this.prenom,
    required this.role,
    this.abonnements = const [],
    this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    List<String> abs = [];
    final rawAbs = json['abonnements'];
    if (rawAbs is List) {
      abs = rawAbs.map((e) => e.toString()).toList();
    }
    return UserModel(
      id: json['id'] as String? ?? '',
      telephone: json['telephone'] as String? ?? '',
      nom: json['nom'] as String? ?? '',
      prenom: json['prenom'] as String? ?? '',
      role: json['role'] as String? ?? 'user',
      abonnements: abs,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'telephone': telephone,
      'nom': nom,
      'prenom': prenom,
      'role': role,
    };
  }

  String get fullName => '$prenom $nom'.trim();
  bool get isAdmin => role == 'admin' || role == 'superadmin';
  bool get isSuperAdmin => role == 'superadmin';

  bool hasCategorieAccess(String categorieId) {
    return isAdmin || abonnements.contains(categorieId);
  }
}
