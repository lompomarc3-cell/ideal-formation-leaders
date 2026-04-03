// lib/models/paiement_model.dart

class PaiementModel {
  final String id;
  final String userId;
  final String categorieId;
  final String categorieNom;
  final int montant;
  final String statut; // 'en_attente', 'valide', 'refuse'
  final String? captureUrl; // URL screenshot WhatsApp
  final String? numeroOm; // numéro Orange Money utilisé
  final DateTime? createdAt;
  final DateTime? validatedAt;

  PaiementModel({
    required this.id,
    required this.userId,
    required this.categorieId,
    required this.categorieNom,
    required this.montant,
    required this.statut,
    this.captureUrl,
    this.numeroOm,
    this.createdAt,
    this.validatedAt,
  });

  factory PaiementModel.fromJson(Map<String, dynamic> json) {
    return PaiementModel(
      id: json['id'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      categorieId: json['categorie_id'] as String? ?? '',
      categorieNom: json['categorie_nom'] as String? ?? '',
      montant: (json['montant'] as num?)?.toInt() ?? 0,
      statut: json['statut'] as String? ?? 'en_attente',
      captureUrl: json['capture_url'] as String?,
      numeroOm: json['numero_om'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String)
          : null,
      validatedAt: json['validated_at'] != null
          ? DateTime.tryParse(json['validated_at'] as String)
          : null,
    );
  }

  bool get isEnAttente => statut == 'en_attente';
  bool get isValide => statut == 'valide';
  bool get isRefuse => statut == 'refuse';

  String get statutLibelle {
    switch (statut) {
      case 'valide': return 'Validé';
      case 'refuse': return 'Refusé';
      default: return 'En attente';
    }
  }
}
