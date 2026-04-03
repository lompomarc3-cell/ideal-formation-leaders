// lib/models/user_model.dart
// Adapté au schéma Supabase réel: phone, full_name (+ colonnes telephone/nom/prenom ajoutées)

class UserModel {
  final String id;
  final String telephone; // = phone dans Supabase
  final String nom;
  final String prenom;
  final String fullNameRaw; // = full_name dans Supabase
  final String role; // 'user', 'admin', 'superadmin'
  final List<String> abonnements; // IDs des catégories payées
  final DateTime? createdAt;

  UserModel({
    required this.id,
    required this.telephone,
    required this.nom,
    required this.prenom,
    required this.fullNameRaw,
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

    // Compatibilité double schéma: phone/full_name OU telephone/nom/prenom
    final phone = json['phone'] as String? ?? json['telephone'] as String? ?? '';
    final fullName = json['full_name'] as String? ?? '';
    final nom = json['nom'] as String? ??
        (fullName.contains(' ') ? fullName.split(' ').skip(1).join(' ') : fullName);
    final prenom = json['prenom'] as String? ??
        (fullName.contains(' ') ? fullName.split(' ').first : '');

    return UserModel(
      id: json['id'] as String? ?? '',
      telephone: phone,
      nom: nom,
      prenom: prenom,
      fullNameRaw: fullName.isNotEmpty ? fullName : '$prenom $nom'.trim(),
      role: json['role'] as String? ?? 'user',
      abonnements: abs,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'phone': telephone,
      'telephone': telephone,
      'full_name': fullName,
      'nom': nom,
      'prenom': prenom,
      'role': role,
    };
  }

  String get fullName => fullNameRaw.isNotEmpty
      ? fullNameRaw
      : '$prenom $nom'.trim();
  bool get isAdmin => role == 'admin' || role == 'superadmin';
  bool get isSuperAdmin => role == 'superadmin';

  bool hasCategorieAccess(String categorieId) {
    return isAdmin || abonnements.contains(categorieId);
  }
}
