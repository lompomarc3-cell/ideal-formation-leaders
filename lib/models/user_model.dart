// lib/models/user_model.dart
// Adapté au VRAI schéma Supabase profiles:
// Colonnes réelles: id, full_name, phone, province_id, exam_category_id, 
//                  avatar_url, role, subscription_status, subscription_expires_at, 
//                  subscription_type, created_at

class UserModel {
  final String id;
  final String telephone; // = phone dans Supabase
  final String fullNameRaw; // = full_name dans Supabase
  final String role; // 'user', 'admin', 'superadmin'
  final String subscriptionStatus; // 'free', 'premium', 'expired'
  final String? subscriptionType; // ID de la catégorie ou type d'abonnement
  final DateTime? subscriptionExpiresAt;
  final List<String> abonnements; // IDs des catégories payées (calculé)
  final DateTime? createdAt;

  UserModel({
    required this.id,
    required this.telephone,
    required this.fullNameRaw,
    required this.role,
    this.subscriptionStatus = 'free',
    this.subscriptionType,
    this.subscriptionExpiresAt,
    this.abonnements = const [],
    this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    List<String> abs = [];
    final rawAbs = json['abonnements'];
    if (rawAbs is List) {
      abs = rawAbs.map((e) => e.toString()).toList();
    }
    
    // Ajouter subscriptionType aux abonnements si premium
    final subStatus = json['subscription_status'] as String? ?? 'free';
    final subType = json['subscription_type'] as String?;
    if (subStatus == 'premium' && subType != null && !abs.contains(subType)) {
      abs = [...abs, subType];
    }

    return UserModel(
      id: json['id'] as String? ?? '',
      // Compatibilité: phone (nouveau) ou telephone (ancien)
      telephone: json['phone'] as String? ?? json['telephone'] as String? ?? '',
      fullNameRaw: json['full_name'] as String? ?? '',
      role: json['role'] as String? ?? 'user',
      subscriptionStatus: subStatus,
      subscriptionType: subType,
      subscriptionExpiresAt: json['subscription_expires_at'] != null
          ? DateTime.tryParse(json['subscription_expires_at'] as String)
          : null,
      abonnements: abs,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'phone': telephone,
      'full_name': fullName,
      'role': role,
    };
  }

  // Nom complet
  String get fullName => fullNameRaw.isNotEmpty ? fullNameRaw : telephone;
  
  // Prénom (premier mot du fullName)
  String get prenom => fullNameRaw.contains(' ') 
      ? fullNameRaw.split(' ').first 
      : fullNameRaw;
  
  // Nom de famille (reste après le prénom)
  String get nom => fullNameRaw.contains(' ')
      ? fullNameRaw.split(' ').skip(1).join(' ')
      : '';

  bool get isAdmin => role == 'admin' || role == 'superadmin';
  bool get isSuperAdmin => role == 'superadmin';
  bool get isPremium => subscriptionStatus == 'premium';

  bool hasCategorieAccess(String categorieId) {
    if (isAdmin) return true;
    if (abonnements.contains(categorieId)) return true;
    // Vérifier si l'abonnement n'est pas expiré
    if (subscriptionType == categorieId && isPremium) {
      if (subscriptionExpiresAt == null) return true;
      return DateTime.now().isBefore(subscriptionExpiresAt!);
    }
    return false;
  }
}
