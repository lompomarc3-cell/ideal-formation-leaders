// lib/services/paiement_service.dart
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/paiement_model.dart';

class PaiementService extends ChangeNotifier {
  final _client = Supabase.instance.client;

  List<PaiementModel> _paiements = [];
  bool _isLoading = false;
  String? _error;

  List<PaiementModel> get paiements => _paiements;
  List<PaiementModel> get paiementsEnAttente =>
      _paiements.where((p) => p.isEnAttente).toList();
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Soumettre une demande de paiement
  Future<bool> soumettreDemande({
    required String userId,
    required String categorieId,
    required String categorieNom,
    required int montant,
    required String numeroOm,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _client.from('paiements').insert({
        'user_id': userId,
        'categorie_id': categorieId,
        'categorie_nom': categorieNom,
        'montant': montant,
        'numero_om': numeroOm,
        'statut': 'en_attente',
      });

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Admin: Charger tous les paiements en attente
  Future<void> loadPaiementsEnAttente() async {
    _isLoading = true;
    notifyListeners();

    try {
      final data = await _client
          .from('paiements')
          .select('*')
          .eq('statut', 'en_attente')
          .order('created_at', ascending: false);

      _paiements = (data as List)
          .map((e) => PaiementModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _error = e.toString();
      if (kDebugMode) debugPrint('loadPaiements error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Admin: Valider un paiement → activer l'abonnement
  Future<bool> validerPaiement(String paiementId, String userId, String categorieId) async {
    try {
      // 1. Mettre à jour le statut du paiement
      await _client
          .from('paiements')
          .update({
            'statut': 'valide',
            'validated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', paiementId);

      // 2. Créer l'abonnement
      await _client.from('abonnements').upsert({
        'user_id': userId,
        'categorie_id': categorieId,
        'statut': 'actif',
        'activated_at': DateTime.now().toIso8601String(),
      });

      await loadPaiementsEnAttente();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  // Admin: Refuser un paiement
  Future<bool> refuserPaiement(String paiementId) async {
    try {
      await _client
          .from('paiements')
          .update({'statut': 'refuse'})
          .eq('id', paiementId);

      await loadPaiementsEnAttente();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  // Vérifier si l'utilisateur a un paiement en attente
  Future<bool> hasPaiementEnAttente(String userId, String categorieId) async {
    try {
      final data = await _client
          .from('paiements')
          .select('id')
          .eq('user_id', userId)
          .eq('categorie_id', categorieId)
          .eq('statut', 'en_attente')
          .limit(1);
      return (data as List).isNotEmpty;
    } catch (_) {
      return false;
    }
  }
}
