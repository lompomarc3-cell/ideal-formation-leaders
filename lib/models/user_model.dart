// lib/models/user_model.dart
class UserModel {
  final String id;
  final String telephone;
  final String nom;
  final String prenom;
  final String role; // 'user' ou 'admin'
  final DateTime? createdAt;

  UserModel({
    required this.id,
    required this.telephone,
    required this.nom,
    required this.prenom,
    this.role = 'user',
    this.createdAt,
  });

  factory UserModel.fromMap(Map<String, dynamic> map) {
    return UserModel(
      id: map['id'] as String? ?? '',
      telephone: map['telephone'] as String? ?? '',
      nom: map['nom'] as String? ?? '',
      prenom: map['prenom'] as String? ?? '',
      role: map['role'] as String? ?? 'user',
      createdAt: map['created_at'] != null
          ? DateTime.tryParse(map['created_at'].toString())
          : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'telephone': telephone,
      'nom': nom,
      'prenom': prenom,
      'role': role,
    };
  }

  String get fullName => '$prenom $nom';
  bool get isAdmin => role == 'admin' || role == 'superadmin';
}
