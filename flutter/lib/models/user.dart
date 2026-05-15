class AppUser {
  final String id;
  final String? phone;
  final String? nom;
  final String? prenom;
  final String? fullName;
  final String? role;
  final bool isAdmin;
  final String? abonnementType;
  final String? abonnementValideJusqua;
  final String? subscriptionStatus;
  final bool subscriptionExpired;
  final bool hasActiveDirect;
  final bool hasActivePro;
  final String? dossierPrincipal;
  final List<String> dossiersDebloques;
  final List<String> dossiersPrincipaux;
  final bool isActive;

  AppUser({
    required this.id,
    this.phone,
    this.nom,
    this.prenom,
    this.fullName,
    this.role,
    this.isAdmin = false,
    this.abonnementType,
    this.abonnementValideJusqua,
    this.subscriptionStatus,
    this.subscriptionExpired = false,
    this.hasActiveDirect = false,
    this.hasActivePro = false,
    this.dossierPrincipal,
    this.dossiersDebloques = const [],
    this.dossiersPrincipaux = const [],
    this.isActive = true,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) {
    List<String> toStrList(dynamic v) {
      if (v is List) return v.map((e) => e.toString()).toList();
      return const [];
    }

    return AppUser(
      id: (json['id'] ?? '').toString(),
      phone: json['phone']?.toString(),
      nom: json['nom']?.toString(),
      prenom: json['prenom']?.toString(),
      fullName: json['full_name']?.toString(),
      role: json['role']?.toString(),
      isAdmin: json['is_admin'] == true,
      abonnementType: json['abonnement_type']?.toString(),
      abonnementValideJusqua: json['abonnement_valide_jusqua']?.toString(),
      subscriptionStatus: json['subscription_status']?.toString(),
      subscriptionExpired: json['subscription_expired'] == true,
      hasActiveDirect: json['has_active_direct'] == true,
      hasActivePro: json['has_active_pro'] == true,
      dossierPrincipal: json['dossier_principal']?.toString(),
      dossiersDebloques: toStrList(json['dossiers_debloques']),
      dossiersPrincipaux: toStrList(json['dossiers_principaux']),
      isActive: json['is_active'] != false,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'phone': phone,
        'nom': nom,
        'prenom': prenom,
        'full_name': fullName,
        'role': role,
        'is_admin': isAdmin,
        'abonnement_type': abonnementType,
        'abonnement_valide_jusqua': abonnementValideJusqua,
        'subscription_status': subscriptionStatus,
        'subscription_expired': subscriptionExpired,
        'has_active_direct': hasActiveDirect,
        'has_active_pro': hasActivePro,
        'dossier_principal': dossierPrincipal,
        'dossiers_debloques': dossiersDebloques,
        'dossiers_principaux': dossiersPrincipaux,
        'is_active': isActive,
      };

  /// Vrai si l'utilisateur a un abonnement réellement actif (non expiré).
  bool get hasActiveSubscription =>
      isAdmin || (subscriptionStatus == 'active' && !subscriptionExpired);

  /// Vrai si l'abonnement a expiré (au moins un jour dans le passé).
  bool get isExpired => subscriptionExpired;
}
