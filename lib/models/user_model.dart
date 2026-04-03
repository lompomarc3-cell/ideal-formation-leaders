// lib/models/user_model.dart
// Adapté au VRAI schéma Supabase:
// profiles(id, full_name, phone, province_id, exam_category_id, avatar_url, role, subscription_status, subscription_expires_at, subscription_type, created_at)
class UserModel {
  final String id;
  final String fullName;
  final String phone;
  final String role; // 'user', 'admin', 'superadmin'
  final String? avatarUrl;
  final String subscriptionStatus; // 'free', 'active', etc.
  final String? subscriptionType;
  final DateTime? subscriptionExpiresAt;
  final DateTime? createdAt;

  UserModel({
    required this.id,
    required this.fullName,
    required this.phone,
    this.role = 'user',
    this.avatarUrl,
    this.subscriptionStatus = 'free',
    this.subscriptionType,
    this.subscriptionExpiresAt,
    this.createdAt,
  });

  // Compatibilité avec le code existant qui utilise nom/prenom/telephone
  String get nom {
    final parts = fullName.split(' ');
    return parts.isNotEmpty ? parts[0] : fullName;
  }

  String get prenom {
    final parts = fullName.split(' ');
    return parts.length > 1 ? parts.sublist(1).join(' ') : '';
  }

  String get telephone => phone;

  factory UserModel.fromMap(Map<String, dynamic> map) {
    return UserModel(
      id: map['id'] as String? ?? '',
      // Support des deux formats: full_name (nouveau) ou nom+prenom (ancien)
      fullName: map['full_name'] as String? ??
          '${map['nom'] ?? ''} ${map['prenom'] ?? ''}'.trim(),
      phone: map['phone'] as String? ?? map['telephone'] as String? ?? '',
      role: map['role'] as String? ?? 'user',
      avatarUrl: map['avatar_url'] as String?,
      subscriptionStatus: map['subscription_status'] as String? ?? 'free',
      subscriptionType: map['subscription_type'] as String?,
      subscriptionExpiresAt: map['subscription_expires_at'] != null
          ? DateTime.tryParse(map['subscription_expires_at'].toString())
          : null,
      createdAt: map['created_at'] != null
          ? DateTime.tryParse(map['created_at'].toString())
          : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'full_name': fullName,
      'phone': phone,
      'role': role,
      'subscription_status': subscriptionStatus,
    };
  }

  bool get isAdmin => role == 'admin' || role == 'superadmin';
  bool get hasActiveSubscription => subscriptionStatus == 'active';
}
