import 'package:flutter/foundation.dart';
import '../models/dossier.dart';
import 'supabase_service.dart';

class DossiersService extends ChangeNotifier {
  List<Dossier> _direct = [];
  List<Dossier> _proPaid = [];
  List<Dossier> _proBonus = [];
  bool _loading = false;
  bool _loaded = false;
  String? _error;

  List<Dossier> get direct => _direct;
  List<Dossier> get proPaid => _proPaid;
  List<Dossier> get proBonus => _proBonus;
  List<Dossier> get allPro => [..._proPaid, ..._proBonus];
  bool get loading => _loading;
  bool get loaded => _loaded;
  String? get error => _error;

  /// Charge les dossiers depuis la table `categories`
  Future<void> loadDossiers({bool force = false}) async {
    if (_loaded && !force) return;
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await SupabaseConfig.client
          .from('categories')
          .select('id,nom,type,prix,question_count,description,is_active')
          .eq('is_active', true)
          .order('nom', ascending: true);

      final all = (res as List)
          .map((e) => Dossier.fromCategory(Map<String, dynamic>.from(e)))
          .toList();

      _direct = all.where((d) => d.type == 'direct').toList();
      _proPaid = all.where((d) => d.type == 'pro_paid').toList();
      _proBonus = all.where((d) => d.type == 'pro_bonus').toList();

      _loaded = true;
    } catch (e) {
      if (kDebugMode) debugPrint('loadDossiers error: $e');
      _error = e.toString();
      // Fallback : laisser les listes vides
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  /// Trouver un dossier par id (toutes catégories)
  Dossier? findById(String id) {
    final all = [..._direct, ..._proPaid, ..._proBonus];
    try {
      return all.firstWhere((d) => d.id == id);
    } catch (_) {
      return null;
    }
  }
}
