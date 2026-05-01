import 'package:flutter/foundation.dart';

import 'api_service.dart';

/// Service centralisé pour les prix et promotions.
///
/// Charge les prix une seule fois depuis l'API publique et notifie tous
/// les écrans (Accueil, Direct, Pro, Profil, Admin) lors des changements.
///
/// Utilisation :
///   final ps = context.watch[PriceService]();
///   ps.directPrix; ps.directPrixPromo; ps.directHasPromo; ps.directDateFin; ps.directLabel;
///   ps.proPrix;    ps.proPrixPromo;    ps.proHasPromo;    ps.proDateFin;    ps.proLabel;
///   ps.refresh(); // forcer un rafraîchissement
class PriceService extends ChangeNotifier {
  final ApiService _api;
  PriceService(this._api);

  bool _loading = false;
  bool _loaded = false;
  DateTime? _lastLoad;

  // --- Direct ---
  int _directPrix = 5000;
  int? _directPrixPromo;
  bool _directHasPromo = false;
  String? _directDateFin;
  String? _directLabel;

  // --- Pro ---
  int _proPrix = 20000;
  int? _proPrixPromo;
  bool _proHasPromo = false;
  String? _proDateFin;
  String? _proLabel;

  // Getters
  bool get loading => _loading;
  bool get loaded => _loaded;

  int get directPrix => _directPrix;
  int? get directPrixPromo => _directPrixPromo;
  bool get directHasPromo => _directHasPromo;
  String? get directDateFin => _directDateFin;
  String? get directLabel => _directLabel;
  int get directPrixEffectif =>
      _directHasPromo && _directPrixPromo != null ? _directPrixPromo! : _directPrix;

  int get proPrix => _proPrix;
  int? get proPrixPromo => _proPrixPromo;
  bool get proHasPromo => _proHasPromo;
  String? get proDateFin => _proDateFin;
  String? get proLabel => _proLabel;
  int get proPrixEffectif =>
      _proHasPromo && _proPrixPromo != null ? _proPrixPromo! : _proPrix;

  /// Format "5 000 FCFA"
  static String formatFcfa(int v) {
    final s = v.toString();
    final buf = StringBuffer();
    for (int i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write(' ');
      buf.write(s[i]);
    }
    return '${buf.toString()} FCFA';
  }

  /// Compte à rebours de fin de promo, ou null si non applicable.
  static String? countdown(String? iso) {
    if (iso == null) return null;
    try {
      final end = DateTime.parse(iso);
      final diff = end.difference(DateTime.now());
      if (diff.isNegative) return null;
      if (diff.inDays > 0) return 'Fin dans ${diff.inDays}j ${diff.inHours % 24}h';
      if (diff.inHours > 0) return 'Fin dans ${diff.inHours}h ${diff.inMinutes % 60}min';
      return 'Fin dans ${diff.inMinutes}min';
    } catch (_) {
      return null;
    }
  }

  /// Charge les prix depuis l'API. Cache de 30 secondes par défaut.
  Future<void> load({bool force = false}) async {
    if (_loading) return;
    if (!force && _lastLoad != null) {
      final age = DateTime.now().difference(_lastLoad!);
      if (age.inSeconds < 30 && _loaded) return;
    }
    _loading = true;
    notifyListeners();
    try {
      final res = await _api.publicPrices();
      final prices = (res['prices'] as Map?) ?? {};
      final direct = prices['direct'] is Map
          ? Map<String, dynamic>.from(prices['direct'] as Map)
          : null;
      final pro = prices['professionnel'] is Map
          ? Map<String, dynamic>.from(prices['professionnel'] as Map)
          : null;
      if (direct != null) {
        _directPrix = (direct['prix'] as num?)?.toInt() ?? 5000;
        _directPrixPromo = (direct['prix_promo'] as num?)?.toInt();
        _directHasPromo = direct['has_promo'] == true && _directPrixPromo != null;
        _directDateFin = direct['date_fin']?.toString();
        _directLabel = direct['label']?.toString();
      }
      if (pro != null) {
        _proPrix = (pro['prix'] as num?)?.toInt() ?? 20000;
        _proPrixPromo = (pro['prix_promo'] as num?)?.toInt();
        _proHasPromo = pro['has_promo'] == true && _proPrixPromo != null;
        _proDateFin = pro['date_fin']?.toString();
        _proLabel = pro['label']?.toString();
      }
      _loaded = true;
      _lastLoad = DateTime.now();
    } catch (e) {
      if (kDebugMode) debugPrint('[PriceService] load error: $e');
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> refresh() => load(force: true);
}
