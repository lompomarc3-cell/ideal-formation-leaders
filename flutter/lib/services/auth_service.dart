import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/user.dart';
import 'api_service.dart';

/// Gère la persistance du token JWT (compatible Next.js : SHA-256 + jose HS256)
/// et l'état de l'utilisateur connecté côté Flutter.
class AuthService extends ChangeNotifier {
  static const String _tokenKey = 'ifl_token';
  static const String _userKey = 'ifl_user_cache';
  static const String _welcomeSeenKey = 'ifl_welcome_seen';

  final ApiService _api = ApiService();

  AppUser? _user;
  bool _loading = true;
  String? _token;

  AppUser? get user => _user;
  bool get loading => _loading;
  bool get isAuthenticated => _user != null && _token != null;
  bool get isAdmin => _user?.isAdmin ?? false;
  String? get token => _token;
  ApiService get api => _api;

  /// À appeler au démarrage : rétablit la session depuis SharedPreferences.
  Future<void> bootstrap() async {
    _loading = true;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      _token = prefs.getString(_tokenKey);
      // Charger un cache local pour éviter le flash visuel
      final cached = prefs.getString(_userKey);
      if (cached != null) {
        try {
          _user = AppUser.fromJson(jsonDecode(cached));
        } catch (_) {}
      }
      if (_token != null && _token!.isNotEmpty) {
        await refreshUser();
      }
    } catch (e) {
      if (kDebugMode) debugPrint('[Auth] bootstrap error: $e');
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> refreshUser() async {
    if (_token == null || _token!.isEmpty) return;
    try {
      final data = await _api.me(_token!);
      if (data['id'] != null) {
        _user = AppUser.fromJson(data);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_userKey, jsonEncode(data));
        notifyListeners();
      } else if (data['error'] != null) {
        // Token expiré ou invalide -> logout silencieux
        await logout();
      }
    } catch (e) {
      if (kDebugMode) debugPrint('[Auth] refreshUser error: $e');
    }
  }

  /// Login : appelle /api/auth/login (Next.js Edge), stocke le token et l'utilisateur.
  Future<String?> login(String phone, String password) async {
    final data = await _api.login(phone, password);
    if (data['token'] != null) {
      _token = data['token'].toString();
      _user = AppUser.fromJson(Map<String, dynamic>.from(data['user'] ?? {}));
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_tokenKey, _token!);
      await prefs.setString(_userKey, jsonEncode(_user!.toJson()));
      notifyListeners();
      // Rafraîchir pour obtenir dossiers_debloques etc.
      refreshUser();
      return null;
    }
    return data['error']?.toString() ?? 'Identifiants incorrects';
  }

  Future<String?> register({
    required String phone,
    required String nom,
    required String prenom,
    required String password,
  }) async {
    final data = await _api.register(
      phone: phone,
      nom: nom,
      prenom: prenom,
      password: password,
    );
    if (data['token'] != null) {
      _token = data['token'].toString();
      _user = AppUser.fromJson(Map<String, dynamic>.from(data['user'] ?? {}));
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_tokenKey, _token!);
      await prefs.setString(_userKey, jsonEncode(_user!.toJson()));
      notifyListeners();
      return null;
    }
    return data['error']?.toString() ?? "Erreur lors de l'inscription";
  }

  Future<void> logout() async {
    _token = null;
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
    notifyListeners();
  }

  // ===== Welcome screen (1ère fois) =====
  Future<bool> isWelcomeSeen() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_welcomeSeenKey) == '1';
  }

  Future<void> markWelcomeSeen() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_welcomeSeenKey, '1');
  }

  // ===== Progression locale (équivalent localStorage Next.js) =====
  Future<int> getLocalProgressIndex(String categorieId) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt('ifl_progress_$categorieId') ?? 0;
  }

  Future<void> saveLocalProgressIndex(String categorieId, int index) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('ifl_progress_$categorieId', index);
  }
}
