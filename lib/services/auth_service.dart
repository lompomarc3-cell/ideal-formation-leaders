// lib/services/auth_service.dart
// Adapté au VRAI schéma Supabase profiles:
// - phone (pas telephone)
// - full_name (pas nom + prenom séparés)
// - subscription_status, subscription_type, subscription_expires_at

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

      // Charger les abonnements depuis la table abonnements si elle existe
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
      } catch (_) {
        // La table abonnements n'existe pas encore - pas de problème
      }

      final profileData = Map<String, dynamic>.from(data as Map);
      _currentUser = UserModel.fromJson({
        ...profileData,
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
      // Format principal: tel22676223962@ifl.app
      final emailTel = _buildEmail(telephone, domain: 'ifl.app');
      
      // Essayer avec le format tel{numero}@ifl.app (nouveau format standard)
      try {
        final res = await _client.auth.signInWithPassword(
          email: emailTel,
          password: password,
        );
        if (res.session != null) {
          await _loadUserProfile(res.user!.id);
          _isLoading = false;
          notifyListeners();
          return true;
        }
      } catch (_) {}

      // Essayer avec l'ancien format +{numero}@ifl.app
      final cleaned = telephone.replaceAll(RegExp(r'[^0-9+]'), '');
      final emailOld = '$cleaned@ifl.app';
      try {
        final res2 = await _client.auth.signInWithPassword(
          email: emailOld,
          password: password,
        );
        if (res2.session != null) {
          await _loadUserProfile(res2.user!.id);
          _isLoading = false;
          notifyListeners();
          return true;
        }
      } catch (_) {}

      // Essayer avec @ifl.bf (ancien domaine)
      final emailBf = '$cleaned@ifl.bf';
      try {
        final res3 = await _client.auth.signInWithPassword(
          email: emailBf,
          password: password,
        );
        if (res3.session != null) {
          await _loadUserProfile(res3.user!.id);
          _isLoading = false;
          notifyListeners();
          return true;
        }
      } catch (_) {}

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
      final email = _buildEmail(telephone, domain: 'ifl.app');
      final fullName = '$prenom $nom'.trim();

      final res = await _client.auth.signUp(
        email: email,
        password: password,
      );

      if (res.user != null) {
        // Mettre à jour le profil créé automatiquement par le trigger Supabase
        // (upsert pour gérer le cas où le profil existe déjà via trigger)
        try {
          await _client.from('profiles').upsert({
            'id': res.user!.id,
            'phone': telephone,
            'full_name': fullName,
            'role': 'user',
            'subscription_status': 'free',
          }, onConflict: 'id');
        } catch (profileError) {
          // Si le profil existe déjà (créé par trigger), ignorer l'erreur
          if (kDebugMode) debugPrint('Profile upsert (harmless): $profileError');
        }

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

  // Changer le mot de passe
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
    // Format: tel{numeros}@ifl.app
    // Ex: +22676223962 → tel22676223962@ifl.app
    // Enlever le + et tous les caractères non numériques
    final cleaned = telephone.replaceAll(RegExp(r'[^0-9]'), '');
    return 'tel$cleaned@$domain';
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
    if (msg.contains('Email not confirmed')) {
      return 'Compte non confirmé. Essayez de vous reconnecter.';
    }
    return msg;
  }
}
