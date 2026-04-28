import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'supabase_service.dart';

/// Profil utilisateur basé sur le schéma Supabase RÉEL :
/// profiles(id, phone, full_name, role, subscription_type, subscription_status,
///          avatar_url, subscription_expires_at, created_at)
///
/// Les abonnements aux dossiers payants (UUID) sont stockés en local (SharedPreferences)
/// + côté admin via subscription_type/subscription_status.
class UserProfile {
  final String id;
  final String phone;
  final String fullName;
  final String role; // 'user' / 'admin'
  final String? subscriptionType; // 'direct', 'pro', 'all', null
  final String? subscriptionStatus; // 'active', 'expired', null
  final String? avatarUrl;
  final DateTime? subscriptionExpiresAt;

  /// Liste locale des dossiers pros (UUID) débloqués (gérée localement)
  final List<String> proUnlockedIds;

  /// Indique si l'utilisateur a payé les concours directs (12 dossiers)
  final bool directUnlocked;

  /// Score & progression (en mémoire/local pour l'instant)
  final int totalScore;
  final Map<String, double> progress;

  UserProfile({
    required this.id,
    required this.phone,
    required this.fullName,
    this.role = 'user',
    this.subscriptionType,
    this.subscriptionStatus,
    this.avatarUrl,
    this.subscriptionExpiresAt,
    this.proUnlockedIds = const [],
    this.directUnlocked = false,
    this.totalScore = 0,
    this.progress = const {},
  });

  String get firstName {
    final parts = fullName.trim().split(RegExp(r'\s+'));
    return parts.isNotEmpty ? parts.first : '';
  }

  String get lastName {
    final parts = fullName.trim().split(RegExp(r'\s+'));
    if (parts.length <= 1) return '';
    return parts.sublist(1).join(' ');
  }

  bool get isAdmin => role == 'admin';

  bool get hasDirectSubscription {
    if (directUnlocked) return true;
    final st = subscriptionStatus?.toLowerCase();
    final tp = subscriptionType?.toLowerCase();
    if (st == 'active' && (tp == 'direct' || tp == 'all')) return true;
    return false;
  }

  bool get hasAnyProSubscription {
    if (proUnlockedIds.isNotEmpty) return true;
    final st = subscriptionStatus?.toLowerCase();
    final tp = subscriptionType?.toLowerCase();
    if (st == 'active' && (tp == 'pro' || tp == 'all')) return true;
    return false;
  }

  /// Compatibilité avec l'ancienne API utilisée dans les écrans
  List<String> get subscriptionsDirect =>
      hasDirectSubscription ? const ['all'] : const [];

  List<String> get subscriptionsPro => proUnlockedIds;

  factory UserProfile.fromSupabase(Map<String, dynamic> json) {
    DateTime? exp;
    final raw = json['subscription_expires_at'];
    if (raw != null) {
      try {
        exp = DateTime.parse(raw.toString());
      } catch (_) {}
    }
    return UserProfile(
      id: (json['id'] ?? '').toString(),
      phone: (json['phone'] ?? '').toString(),
      fullName: (json['full_name'] ?? '').toString(),
      role: (json['role'] ?? 'user').toString(),
      subscriptionType: json['subscription_type']?.toString(),
      subscriptionStatus: json['subscription_status']?.toString(),
      avatarUrl: json['avatar_url']?.toString(),
      subscriptionExpiresAt: exp,
    );
  }

  UserProfile copyWith({
    List<String>? proUnlockedIds,
    bool? directUnlocked,
    int? totalScore,
    Map<String, double>? progress,
  }) {
    return UserProfile(
      id: id,
      phone: phone,
      fullName: fullName,
      role: role,
      subscriptionType: subscriptionType,
      subscriptionStatus: subscriptionStatus,
      avatarUrl: avatarUrl,
      subscriptionExpiresAt: subscriptionExpiresAt,
      proUnlockedIds: proUnlockedIds ?? this.proUnlockedIds,
      directUnlocked: directUnlocked ?? this.directUnlocked,
      totalScore: totalScore ?? this.totalScore,
      progress: progress ?? this.progress,
    );
  }
}

class AuthService extends ChangeNotifier {
  UserProfile? _currentUser;
  bool _isLoading = false;

  UserProfile? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;
  bool get isLoading => _isLoading;

  static const String _kUserId = 'ifl_user_id';
  static const String _kProUnlocks = 'ifl_pro_unlocks';
  static const String _kDirectUnlock = 'ifl_direct_unlock';
  static const String _kTotalScore = 'ifl_total_score';

  /// Charger l'utilisateur depuis le stockage local
  Future<void> loadCurrentUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      // Vérifier d'abord la session Supabase
      final session = SupabaseConfig.client.auth.currentSession;
      String? userId;
      if (session != null) {
        userId = session.user.id;
      } else {
        userId = prefs.getString(_kUserId);
      }
      if (userId != null && userId.isNotEmpty) {
        await _fetchUserProfile(userId);
      }
    } catch (e) {
      if (kDebugMode) debugPrint('loadCurrentUser error: $e');
    }
  }

  Future<void> _fetchUserProfile(String userId) async {
    try {
      final res = await SupabaseConfig.client
          .from('profiles')
          .select()
          .eq('id', userId)
          .maybeSingle();
      if (res != null) {
        var profile = UserProfile.fromSupabase(Map<String, dynamic>.from(res));
        // Charger les déblocages locaux
        final prefs = await SharedPreferences.getInstance();
        final pros = prefs.getStringList(_kProUnlocks) ?? const [];
        final direct = prefs.getBool(_kDirectUnlock) ?? false;
        final score = prefs.getInt(_kTotalScore) ?? 0;
        profile = profile.copyWith(
          proUnlockedIds: pros,
          directUnlocked: direct,
          totalScore: score,
        );
        _currentUser = profile;
        notifyListeners();
      }
    } catch (e) {
      if (kDebugMode) debugPrint('_fetchUserProfile error: $e');
    }
  }

  /// Inscription par téléphone + mot de passe
  Future<String?> register({
    required String firstName,
    required String lastName,
    required String phone,
    required String password,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final cleanPhone = phone.replaceAll(RegExp(r'\s+'), '');
      final fullName = '$firstName $lastName'.trim();

      // Vérifier si le téléphone existe
      try {
        final existing = await SupabaseConfig.client
            .from('profiles')
            .select('id')
            .eq('phone', cleanPhone)
            .maybeSingle();
        if (existing != null) {
          return 'Ce numéro est déjà utilisé';
        }
      } catch (_) {}

      // Email synthétique pour l'auth Supabase
      final email = '$cleanPhone@ifl.app';
      final authResponse = await SupabaseConfig.client.auth.signUp(
        email: email,
        password: password,
        data: {
          'phone': cleanPhone,
          'full_name': fullName,
        },
      );

      if (authResponse.user == null) {
        return 'Échec de la création du compte. Réessayez.';
      }

      final userId = authResponse.user!.id;

      // Créer/mettre à jour le profil
      try {
        await SupabaseConfig.client.from('profiles').upsert({
          'id': userId,
          'phone': cleanPhone,
          'full_name': fullName,
          'role': 'user',
          'subscription_status': 'inactive',
        });
      } catch (e) {
        if (kDebugMode) debugPrint('profile upsert error: $e');
        // On continue : le profil sera relu plus tard
      }

      // Construire le UserProfile local
      _currentUser = UserProfile(
        id: userId,
        phone: cleanPhone,
        fullName: fullName,
        role: 'user',
        subscriptionStatus: 'inactive',
      );

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_kUserId, userId);

      return null;
    } catch (e) {
      if (kDebugMode) debugPrint('register error: $e');
      final s = e.toString().toLowerCase();
      if (s.contains('already registered') ||
          s.contains('user already') ||
          s.contains('already exists')) {
        return 'Ce numéro est déjà utilisé';
      }
      if (s.contains('password')) {
        return 'Mot de passe trop faible (minimum 6 caractères)';
      }
      return 'Erreur d\'inscription. Vérifiez vos informations et réessayez.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Connexion par téléphone + mot de passe
  Future<String?> login({
    required String phone,
    required String password,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final cleanPhone = phone.replaceAll(RegExp(r'\s+'), '');
      final email = '$cleanPhone@ifl.app';

      final authResponse = await SupabaseConfig.client.auth.signInWithPassword(
        email: email,
        password: password,
      );

      if (authResponse.user == null) {
        return 'Téléphone ou mot de passe incorrect';
      }

      final userId = authResponse.user!.id;
      await _fetchUserProfile(userId);

      // Si le profil n'a pas pu être chargé, créer un profil minimal local
      _currentUser ??= UserProfile(
        id: userId,
        phone: cleanPhone,
        fullName: '',
      );

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_kUserId, userId);

      return null;
    } catch (e) {
      if (kDebugMode) debugPrint('login error: $e');
      final s = e.toString().toLowerCase();
      if (s.contains('invalid') ||
          s.contains('credential') ||
          s.contains('password')) {
        return 'Téléphone ou mot de passe incorrect';
      }
      return 'Erreur de connexion. Vérifiez votre numéro et mot de passe.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Déconnexion
  Future<void> logout() async {
    try {
      await SupabaseConfig.client.auth.signOut();
    } catch (_) {}
    _currentUser = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kUserId);
    notifyListeners();
  }

  /// Vérifie si un dossier est débloqué pour l'utilisateur
  bool isDossierUnlocked(String dossierId, String type) {
    if (_currentUser == null) return false;

    if (type == 'direct') {
      return _currentUser!.hasDirectSubscription;
    }
    if (type == 'pro_paid') {
      if (_currentUser!.proUnlockedIds.contains(dossierId)) return true;
      // Si abonnement pro/all global actif → tout débloqué
      final st = _currentUser!.subscriptionStatus?.toLowerCase();
      final tp = _currentUser!.subscriptionType?.toLowerCase();
      return st == 'active' && (tp == 'pro' || tp == 'all');
    }
    if (type == 'pro_bonus') {
      return _currentUser!.hasAnyProSubscription;
    }
    return false;
  }
}
