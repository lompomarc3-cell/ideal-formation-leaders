// lib/services/auth_service.dart
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/user_model.dart';

class AuthService extends ChangeNotifier {
  final _client = Supabase.instance.client;

  UserModel? _currentUser;
  bool _isLoading = false;
  String? _error;

  UserModel? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _currentUser != null;
  bool get isAdmin => _currentUser?.isAdmin ?? false;

  AuthService() {
    _initAuth();
  }

  void _initAuth() {
    _client.auth.onAuthStateChange.listen((data) {
      final session = data.session;
      if (session != null) {
        _loadUserProfile(session.user.id);
      } else {
        _currentUser = null;
        notifyListeners();
      }
    });

    final session = _client.auth.currentSession;
    if (session != null) {
      _loadUserProfile(session.user.id);
    }
  }

  Future<void> _loadUserProfile(String userId) async {
    try {
      final data = await _client
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

      // Charger les abonnements
      List<String> abonnements = [];
      try {
        final abs = await _client
            .from('abonnements')
            .select('categorie_id')
            .eq('user_id', userId)
            .eq('statut', 'actif');
        abonnements = (abs as List)
            .map((e) => e['categorie_id'].toString())
            .toList();
      } catch (_) {}

      _currentUser = UserModel.fromJson({
        ...data as Map<String, dynamic>,
        'abonnements': abonnements,
      });
      notifyListeners();
    } catch (e) {
      if (kDebugMode) debugPrint('_loadUserProfile error: $e');
    }
  }

  Future<bool> signIn(String telephone, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Essayer d'abord avec @ifl.app (domaine du vrai admin)
      final emailApp = _buildEmail(telephone, domain: 'ifl.app');
      try {
        final res = await _client.auth.signInWithPassword(
          email: emailApp,
          password: password,
        );
        if (res.session != null) {
          await _loadUserProfile(res.user!.id);
          _isLoading = false;
          notifyListeners();
          return true;
        }
      } catch (_) {
        // Essayer avec @ifl.bf (ancien domaine)
      }

      final emailBf = _buildEmail(telephone, domain: 'ifl.bf');
      final res2 = await _client.auth.signInWithPassword(
        email: emailBf,
        password: password,
      );

      if (res2.session != null) {
        await _loadUserProfile(res2.user!.id);
        _isLoading = false;
        notifyListeners();
        return true;
      }
      _error = 'Numéro ou mot de passe incorrect';
      _isLoading = false;
      notifyListeners();
      return false;
    } on AuthException catch (e) {
      _error = _translateAuthError(e.message);
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Erreur: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> signUp({
    required String telephone,
    required String nom,
    required String prenom,
    required String password,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Utiliser @ifl.app comme domaine standard
      final email = _buildEmail(telephone, domain: 'ifl.app');
      final fullName = '$prenom $nom'.trim();

      final res = await _client.auth.signUp(
        email: email,
        password: password,
      );

      if (res.user != null) {
        // Insérer en utilisant le schéma réel (phone, full_name)
        await _client.from('profiles').upsert({
          'id': res.user!.id,
          'phone': telephone,
          'telephone': telephone,
          'full_name': fullName,
          'nom': nom,
          'prenom': prenom,
          'role': 'user',
        });

        await _loadUserProfile(res.user!.id);
        _isLoading = false;
        notifyListeners();
        return true;
      }
      _error = 'Inscription échouée';
      _isLoading = false;
      notifyListeners();
      return false;
    } on AuthException catch (e) {
      _error = _translateAuthError(e.message);
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Erreur: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> signOut() async {
    await _client.auth.signOut();
    _currentUser = null;
    notifyListeners();
  }

  Future<void> refreshUser() async {
    final session = _client.auth.currentSession;
    if (session != null) {
      await _loadUserProfile(session.user.id);
    }
  }

  // Changer le mot de passe (pour l'admin)
  Future<bool> changePassword(String newPassword) async {
    try {
      await _client.auth.updateUser(UserAttributes(password: newPassword));
      return true;
    } catch (e) {
      _error = 'Erreur lors du changement de mot de passe: ${e.toString()}';
      notifyListeners();
      return false;
    }
  }

  String _buildEmail(String telephone, {String domain = 'ifl.app'}) {
    final cleaned = telephone.replaceAll(RegExp(r'[^0-9+]'), '');
    return '$cleaned@$domain';
  }

  String _translateAuthError(String msg) {
    if (msg.contains('Invalid login credentials')) {
      return 'Numéro ou mot de passe incorrect';
    }
    if (msg.contains('User already registered')) {
      return 'Ce numéro est déjà inscrit';
    }
    if (msg.contains('Password should be')) {
      return 'Mot de passe trop court (minimum 6 caractères)';
    }
    return msg;
  }
}
