// lib/services/auth_service.dart
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/user_model.dart';

class AuthService extends ChangeNotifier {
  final SupabaseClient _client = Supabase.instance.client;
  UserModel? _currentUser;
  bool _isLoading = false;

  UserModel? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  bool get isLoggedIn => _currentUser != null;
  bool get isAdmin => _currentUser?.isAdmin ?? false;

  AuthService() {
    _initAuth();
  }

  void _initAuth() {
    // Écouter les changements d'authentification
    _client.auth.onAuthStateChange.listen((data) async {
      final session = data.session;
      if (session != null) {
        await _loadUserProfile(session.user.id);
      } else {
        _currentUser = null;
        notifyListeners();
      }
    });

    // Charger l'utilisateur actuel si déjà connecté
    final session = _client.auth.currentSession;
    if (session != null) {
      _loadUserProfile(session.user.id);
    }
  }

  Future<void> _loadUserProfile(String userId) async {
    try {
      final response = await _client
          .from('profiles')
          .select()
          .eq('id', userId)
          .single();
      _currentUser = UserModel.fromMap(response);
      notifyListeners();
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Erreur chargement profil: $e');
      }
    }
  }

  /// Connexion par téléphone + mot de passe
  /// Le téléphone est utilisé comme email fictif: telephone@ifl.app
  Future<Map<String, dynamic>> signIn({
    required String telephone,
    required String password,
  }) async {
    try {
      _isLoading = true;
      notifyListeners();

      // Normaliser le téléphone
      final cleanPhone = _cleanPhone(telephone);
      final fakeEmail = '$cleanPhone@ifl.app';

      final response = await _client.auth.signInWithPassword(
        email: fakeEmail,
        password: password,
      );

      if (response.user != null) {
        await _loadUserProfile(response.user!.id);
        return {'success': true};
      }
      return {'success': false, 'message': 'Connexion échouée'};
    } on AuthException catch (e) {
      return {'success': false, 'message': _getErrorMessage(e.message)};
    } catch (e) {
      return {'success': false, 'message': 'Erreur de connexion'};
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Inscription: nom, prénom, téléphone, mot de passe
  Future<Map<String, dynamic>> signUp({
    required String nom,
    required String prenom,
    required String telephone,
    required String password,
  }) async {
    try {
      _isLoading = true;
      notifyListeners();

      final cleanPhone = _cleanPhone(telephone);
      final fakeEmail = '$cleanPhone@ifl.app';

      // Vérifier que le téléphone n'existe pas déjà
      final existing = await _client
          .from('profiles')
          .select('id')
          .eq('phone', cleanPhone)
          .maybeSingle();

      if (existing != null) {
        return {
          'success': false,
          'message': 'Ce numéro de téléphone est déjà utilisé'
        };
      }

      // Créer le compte Supabase
      final response = await _client.auth.signUp(
        email: fakeEmail,
        password: password,
        data: {
          'nom': nom,
          'prenom': prenom,
          'telephone': cleanPhone,
        },
      );

      if (response.user != null) {
        // Créer le profil
        await _client.from('profiles').insert({
          'id': response.user!.id,
          'phone': cleanPhone,
          'full_name': '$nom $prenom'.trim(),
          'role': 'user',
          'subscription_status': 'free',
        });

        await _loadUserProfile(response.user!.id);
        return {'success': true};
      }
      return {'success': false, 'message': 'Inscription échouée'};
    } on AuthException catch (e) {
      return {'success': false, 'message': _getErrorMessage(e.message)};
    } catch (e) {
      return {'success': false, 'message': 'Erreur lors de l\'inscription: $e'};
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    await _client.auth.signOut();
    _currentUser = null;
    notifyListeners();
  }

  String _cleanPhone(String phone) {
    return phone.replaceAll(RegExp(r'[^\d+]'), '');
  }

  String _getErrorMessage(String message) {
    if (message.contains('Invalid login credentials')) {
      return 'Numéro de téléphone ou mot de passe incorrect';
    }
    if (message.contains('Email not confirmed')) {
      return 'Compte non confirmé';
    }
    if (message.contains('User already registered')) {
      return 'Ce numéro est déjà enregistré';
    }
    return message;
  }
}
