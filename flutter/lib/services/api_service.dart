import 'dart:convert';
import 'package:http/http.dart' as http;

/// Service API : appelle les endpoints Next.js existants déployés sur Cloudflare Pages.
/// La SERVICE_ROLE_KEY n'est JAMAIS exposée côté client : tout passe par les Workers Edge.
class ApiService {
  /// URL de base configurable via --dart-define=API_BASE_URL=...
  /// Par défaut : production Cloudflare Pages (les API Next.js continuent de tourner).
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://ideal-formation-leaders.pages.dev',
  );

  final http.Client _client = http.Client();

  Map<String, String> _jsonHeaders([String? token]) {
    final h = <String, String>{'Content-Type': 'application/json'};
    if (token != null && token.isNotEmpty) {
      h['Authorization'] = 'Bearer $token';
    }
    return h;
  }

  Future<Map<String, dynamic>> _decode(http.Response res) async {
    try {
      final body = res.body.isEmpty ? '{}' : res.body;
      final decoded = jsonDecode(body);
      if (decoded is Map<String, dynamic>) return decoded;
      return {'data': decoded};
    } catch (_) {
      return {'error': 'Réponse invalide (${res.statusCode})'};
    }
  }

  // ==================== AUTH ====================

  Future<Map<String, dynamic>> login(String phone, String password) async {
    final res = await _client.post(
      Uri.parse('$baseUrl/api/auth/login'),
      headers: _jsonHeaders(),
      body: jsonEncode({'phone': phone, 'password': password}),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> register({
    required String phone,
    required String nom,
    required String prenom,
    required String password,
  }) async {
    final res = await _client.post(
      Uri.parse('$baseUrl/api/auth/register'),
      headers: _jsonHeaders(),
      body: jsonEncode({
        'phone': phone,
        'nom': nom,
        'prenom': prenom,
        'password': password,
      }),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> me(String token) async {
    final res = await _client.get(
      Uri.parse('$baseUrl/api/auth/me'),
      headers: _jsonHeaders(token),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> changePassword(
    String token,
    String oldPassword,
    String newPassword,
  ) async {
    final res = await _client.post(
      Uri.parse('$baseUrl/api/auth/change-password'),
      headers: _jsonHeaders(token),
      body: jsonEncode({
        'oldPassword': oldPassword,
        'newPassword': newPassword,
      }),
    );
    return _decode(res);
  }

  // ==================== QUIZ - PUBLIC ====================

  Future<Map<String, dynamic>> publicCategories({String? type}) async {
    final qp = type != null ? '?type=$type' : '';
    final res = await _client.get(
      Uri.parse('$baseUrl/api/quiz/public-categories$qp'),
      headers: _jsonHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> publicQuestions(String categorieId) async {
    final res = await _client.get(
      Uri.parse('$baseUrl/api/quiz/public-questions?categorie_id=$categorieId'),
      headers: _jsonHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> publicPrices() async {
    final res = await _client.get(
      Uri.parse('$baseUrl/api/quiz/public-prices'),
      headers: _jsonHeaders(),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> prices() async {
    final res = await _client.get(
      Uri.parse('$baseUrl/api/quiz/prices'),
      headers: _jsonHeaders(),
    );
    return _decode(res);
  }

  // ==================== DEMO (questions gratuites) ====================

  /// Récupère 10 vraies questions de démo marquées is_demo=true dans Supabase.
  /// Appel direct à Supabase REST API (anonyme, sécurisé via RLS).
  Future<List<Map<String, dynamic>>> fetchDemoQuestions({int limit = 10}) async {
    const supabaseUrl = 'https://cyasoaihjjochwhnhwqf.supabase.co';
    const anonKey =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTkyMDUsImV4cCI6MjA4OTkzNTIwNX0.iZx5CKV4oY80POmPYs6_PMa-2vG5kNTHhOHD5M3HX44';

    try {
      final uri = Uri.parse(
          '$supabaseUrl/rest/v1/questions?is_demo=eq.true&is_active=eq.true&select=id,enonce,option_a,option_b,option_c,option_d,reponse_correcte,explication,category_id&order=created_at.asc&limit=$limit');
      final res = await _client.get(uri, headers: {
        'apikey': anonKey,
        'Authorization': 'Bearer $anonKey',
        'Content-Type': 'application/json',
      });
      if (res.statusCode != 200) return [];
      final body = jsonDecode(res.body);
      if (body is! List) return [];
      return body.map<Map<String, dynamic>>((q) {
        final qm = Map<String, dynamic>.from(q);
        return {
          'id': qm['id'],
          'question_text': qm['enonce'],
          'option_a': qm['option_a'],
          'option_b': qm['option_b'],
          'option_c': qm['option_c'],
          'option_d': qm['option_d'],
          'bonne_reponse': qm['reponse_correcte'],
          'explication': qm['explication'] ?? '',
          'category_id': qm['category_id'],
        };
      }).toList();
    } catch (_) {
      return [];
    }
  }

  // ==================== QUIZ - AUTHENTIFIÉ ====================

  Future<Map<String, dynamic>> categories(String token, {String? type}) async {
    final qp = type != null ? '?type=$type' : '';
    final res = await _client.get(
      Uri.parse('$baseUrl/api/quiz/categories$qp'),
      headers: _jsonHeaders(token),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> questions(String token, String categorieId) async {
    final res = await _client.get(
      Uri.parse('$baseUrl/api/quiz/questions?categorie_id=$categorieId'),
      headers: _jsonHeaders(token),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> getProgress(String token, String categorieId) async {
    final res = await _client.get(
      Uri.parse('$baseUrl/api/quiz/progress?categorie_id=$categorieId'),
      headers: _jsonHeaders(token),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> saveProgress(
    String token, {
    required String categorieId,
    String? questionId,
    bool? isCorrect,
    int? derniereQuestionIndex,
    int? score,
  }) async {
    final res = await _client.post(
      Uri.parse('$baseUrl/api/quiz/progress'),
      headers: _jsonHeaders(token),
      body: jsonEncode({
        'categorie_id': categorieId,
        if (questionId != null) 'question_id': questionId,
        if (isCorrect != null) 'is_correct': isCorrect,
        if (derniereQuestionIndex != null)
          'derniere_question_index': derniereQuestionIndex,
        if (score != null) 'score': score,
      }),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> userStats(String token) async {
    final res = await _client.get(
      Uri.parse('$baseUrl/api/quiz/user-stats'),
      headers: _jsonHeaders(token),
    );
    return _decode(res);
  }

  // ==================== PAIEMENTS ====================

  Future<Map<String, dynamic>> createPaymentRequest(
    String token, {
    required String typeConcours,
    String? dossierPrincipal,
    int? montant,
    String? numeroPaiement,
    String? notes,
  }) async {
    final res = await _client.post(
      Uri.parse('$baseUrl/api/payment/request'),
      headers: _jsonHeaders(token),
      body: jsonEncode({
        'type_concours': typeConcours,
        if (dossierPrincipal != null) 'dossier_principal': dossierPrincipal,
        if (montant != null) 'montant': montant,
        if (numeroPaiement != null) 'numero_paiement': numeroPaiement,
        if (notes != null) 'notes': notes,
      }),
    );
    return _decode(res);
  }

  // ==================== ADMIN - STATS / USERS / PAYMENTS ====================

  Future<Map<String, dynamic>> adminStats(String token) async {
    final res = await _client.get(
      Uri.parse('$baseUrl/api/admin/stats'),
      headers: _jsonHeaders(token),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> adminUsers(String token) async {
    final res = await _client.get(
      Uri.parse('$baseUrl/api/admin/users'),
      headers: _jsonHeaders(token),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> adminUpdateUser(
    String token, {
    required String id,
    String? subscriptionType,
    String? subscriptionStatus,
    String? subscriptionExpiresAt,
    String? dossierPrincipal,
  }) async {
    final res = await _client.put(
      Uri.parse('$baseUrl/api/admin/users'),
      headers: _jsonHeaders(token),
      body: jsonEncode({
        'id': id,
        if (subscriptionType != null) 'subscription_type': subscriptionType,
        if (subscriptionStatus != null) 'subscription_status': subscriptionStatus,
        if (subscriptionExpiresAt != null)
          'subscription_expires_at': subscriptionExpiresAt,
        if (dossierPrincipal != null) 'dossier_principal': dossierPrincipal,
      }),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> adminDeleteUser(String token, String id) async {
    final res = await _client.delete(
      Uri.parse(
          '$baseUrl/api/admin/users?id=${Uri.encodeQueryComponent(id)}'),
      headers: _jsonHeaders(token),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> adminPayments(String token) async {
    final res = await _client.get(
      Uri.parse('$baseUrl/api/admin/payments'),
      headers: _jsonHeaders(token),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> adminValidatePaymentPut(
    String token, {
    required String id,
    required bool valide,
    String? userId,
    String? typeConcours,
    String? dossierPrincipal,
  }) async {
    final res = await _client.put(
      Uri.parse('$baseUrl/api/admin/payments'),
      headers: _jsonHeaders(token),
      body: jsonEncode({
        'id': id,
        'valide': valide,
        if (userId != null) 'user_id': userId,
        if (typeConcours != null) 'type_concours': typeConcours,
        if (dossierPrincipal != null) 'dossier_principal': dossierPrincipal,
      }),
    );
    return _decode(res);
  }

  // ==================== ADMIN - CATEGORIES ====================

  Future<Map<String, dynamic>> adminCategories(String token) async {
    final res = await _client.get(
      Uri.parse('$baseUrl/api/admin/categories'),
      headers: _jsonHeaders(token),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> adminCreateCategory(
    String token, {
    required String nom,
    required String type,
    String? description,
  }) async {
    final res = await _client.post(
      Uri.parse('$baseUrl/api/admin/categories'),
      headers: _jsonHeaders(token),
      body: jsonEncode({
        'nom': nom,
        'type': type,
        if (description != null) 'description': description,
      }),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> adminUpdateCategory(
    String token, {
    required String id,
    String? nom,
    String? description,
    bool? isActive,
  }) async {
    final res = await _client.put(
      Uri.parse('$baseUrl/api/admin/categories'),
      headers: _jsonHeaders(token),
      body: jsonEncode({
        'id': id,
        if (nom != null) 'nom': nom,
        if (description != null) 'description': description,
        if (isActive != null) 'is_active': isActive,
      }),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> adminDeleteCategory(
    String token,
    String id, {
    bool force = false,
  }) async {
    final qp = force ? '&force=true' : '';
    final res = await _client.delete(
      Uri.parse(
          '$baseUrl/api/admin/categories?id=${Uri.encodeQueryComponent(id)}$qp'),
      headers: _jsonHeaders(token),
    );
    return _decode(res);
  }

  // ==================== ADMIN - QUESTIONS ====================

  Future<Map<String, dynamic>> adminQuestions(String token,
      {String? categorieId}) async {
    final qp = categorieId != null ? '?categorie_id=$categorieId' : '';
    final res = await _client.get(
      Uri.parse('$baseUrl/api/admin/questions$qp'),
      headers: _jsonHeaders(token),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> adminCreateQuestion(
    String token, {
    required String categoryId,
    required String questionText,
    required String optionA,
    required String optionB,
    required String optionC,
    required String optionD,
    required String bonneReponse,
    String? explication,
  }) async {
    final res = await _client.post(
      Uri.parse('$baseUrl/api/admin/questions'),
      headers: _jsonHeaders(token),
      body: jsonEncode({
        'category_id': categoryId,
        'question_text': questionText,
        'option_a': optionA,
        'option_b': optionB,
        'option_c': optionC,
        'option_d': optionD,
        'bonne_reponse': bonneReponse,
        if (explication != null) 'explication': explication,
      }),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> adminUpdateQuestion(
    String token, {
    required String id,
    String? questionText,
    String? optionA,
    String? optionB,
    String? optionC,
    String? optionD,
    String? bonneReponse,
    String? explication,
  }) async {
    final res = await _client.put(
      Uri.parse('$baseUrl/api/admin/questions'),
      headers: _jsonHeaders(token),
      body: jsonEncode({
        'id': id,
        if (questionText != null) 'question_text': questionText,
        if (optionA != null) 'option_a': optionA,
        if (optionB != null) 'option_b': optionB,
        if (optionC != null) 'option_c': optionC,
        if (optionD != null) 'option_d': optionD,
        if (bonneReponse != null) 'bonne_reponse': bonneReponse,
        if (explication != null) 'explication': explication,
      }),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> adminDeleteQuestion(
      String token, String id) async {
    final res = await _client.delete(
      Uri.parse(
          '$baseUrl/api/admin/questions?id=${Uri.encodeQueryComponent(id)}'),
      headers: _jsonHeaders(token),
    );
    return _decode(res);
  }

  /// Import massif de questions QCM (texte brut parsé côté Flutter).
  /// Le backend détecte les doublons et les ignore automatiquement.
  Future<Map<String, dynamic>> adminBulkImportQuestions(
    String token, {
    required String categoryId,
    required List<Map<String, dynamic>> questions,
  }) async {
    final res = await _client.post(
      Uri.parse('$baseUrl/api/admin/questions'),
      headers: _jsonHeaders(token),
      body: jsonEncode({
        'bulk': true,
        'questions': questions
            .map((q) => {
                  'category_id': categoryId,
                  'question_text': q['question_text'] ?? q['enonce'] ?? '',
                  'option_a': q['option_a'] ?? '',
                  'option_b': q['option_b'] ?? '',
                  'option_c': q['option_c'] ?? '',
                  'option_d': q['option_d'] ?? '',
                  'bonne_reponse': q['bonne_reponse'] ?? 'A',
                  'explication': q['explication'] ?? '',
                  'is_demo': q['is_demo'] == true,
                })
            .toList(),
      }),
    );
    return _decode(res);
  }

  // ==================== ADMIN - DISSERTATIONS ====================

  Future<Map<String, dynamic>> adminDissertations(String token,
      {String? categorieId}) async {
    final qp = categorieId != null ? '?categorie_id=$categorieId' : '';
    final res = await _client.get(
      Uri.parse('$baseUrl/api/admin/dissertations$qp'),
      headers: _jsonHeaders(token),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> adminCreateDissertation(
    String token, {
    required String categoryId,
    required String titre,
    required String contenu,
  }) async {
    final res = await _client.post(
      Uri.parse('$baseUrl/api/admin/dissertations'),
      headers: _jsonHeaders(token),
      body: jsonEncode({
        'category_id': categoryId,
        'titre': titre,
        'contenu': contenu,
      }),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> adminUpdateDissertation(
    String token, {
    required String id,
    String? titre,
    String? contenu,
    String? categoryId,
  }) async {
    final res = await _client.put(
      Uri.parse('$baseUrl/api/admin/dissertations'),
      headers: _jsonHeaders(token),
      body: jsonEncode({
        'id': id,
        if (titre != null) 'titre': titre,
        if (contenu != null) 'contenu': contenu,
        if (categoryId != null) 'category_id': categoryId,
      }),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> adminDeleteDissertation(
      String token, String id) async {
    final res = await _client.delete(
      Uri.parse(
          '$baseUrl/api/admin/dissertations?id=${Uri.encodeQueryComponent(id)}'),
      headers: _jsonHeaders(token),
    );
    return _decode(res);
  }

  // ==================== ADMIN - SCHEDULES ====================

  Future<Map<String, dynamic>> adminSchedules(String token) async {
    final res = await _client.get(
      Uri.parse('$baseUrl/api/admin/schedules'),
      headers: _jsonHeaders(token),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> adminProgramSchedule(
    String token, {
    required List<String> categoryIds,
    String? dateValidite,
    required bool enabled,
  }) async {
    final res = await _client.post(
      Uri.parse('$baseUrl/api/admin/schedules'),
      headers: _jsonHeaders(token),
      body: jsonEncode({
        'category_ids': categoryIds,
        'date_validite': dateValidite,
        'enabled': enabled,
      }),
    );
    return _decode(res);
  }

  // ==================== ADMIN - PRICES ====================

  Future<Map<String, dynamic>> adminPrices(String token) async {
    final res = await _client.get(
      Uri.parse('$baseUrl/api/admin/prices'),
      headers: _jsonHeaders(token),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> adminUpdatePrice(
    String token, {
    required String typeConcours,
    required int prix,
  }) async {
    final res = await _client.put(
      Uri.parse('$baseUrl/api/admin/prices'),
      headers: _jsonHeaders(token),
      body: jsonEncode({
        'type_concours': typeConcours,
        'prix': prix,
      }),
    );
    return _decode(res);
  }

  // ==================== ADMIN - PROMOTIONS ====================

  Future<Map<String, dynamic>> adminPromotions(String token) async {
    final res = await _client.get(
      Uri.parse('$baseUrl/api/admin/promotions'),
      headers: _jsonHeaders(token),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> adminCreatePromotion(
    String token, {
    required String typeConcours,
    required int prixPromo,
    required String dateDebut,
    required String dateFin,
    bool isActive = true,
  }) async {
    final res = await _client.post(
      Uri.parse('$baseUrl/api/admin/promotions'),
      headers: _jsonHeaders(token),
      body: jsonEncode({
        'type_concours': typeConcours,
        'prix_promo': prixPromo,
        'date_debut': dateDebut,
        'date_fin': dateFin,
        'is_active': isActive,
      }),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> adminUpdatePromotion(
    String token, {
    required String id,
    String? typeConcours,
    int? prixPromo,
    String? dateDebut,
    String? dateFin,
    bool? isActive,
  }) async {
    final res = await _client.put(
      Uri.parse('$baseUrl/api/admin/promotions'),
      headers: _jsonHeaders(token),
      body: jsonEncode({
        'id': id,
        if (typeConcours != null) 'type_concours': typeConcours,
        if (prixPromo != null) 'prix_promo': prixPromo,
        if (dateDebut != null) 'date_debut': dateDebut,
        if (dateFin != null) 'date_fin': dateFin,
        if (isActive != null) 'is_active': isActive,
      }),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> adminDeletePromotion(
      String token, String id) async {
    final res = await _client.delete(
      Uri.parse(
          '$baseUrl/api/admin/promotions?id=${Uri.encodeQueryComponent(id)}'),
      headers: _jsonHeaders(token),
    );
    return _decode(res);
  }

  // ==================== Backwards-compat: validate-payment POST ====================

  Future<Map<String, dynamic>> adminValidatePayment(
    String token, {
    required String paymentId,
    required String action, // 'approve' | 'reject'
    String? notes,
    String? subscriptionType,
    String? expiresAt,
  }) async {
    final res = await _client.post(
      Uri.parse('$baseUrl/api/admin/validate-payment'),
      headers: _jsonHeaders(token),
      body: jsonEncode({
        'payment_id': paymentId,
        'action': action,
        if (notes != null) 'notes': notes,
        if (subscriptionType != null) 'subscription_type': subscriptionType,
        if (expiresAt != null) 'expires_at': expiresAt,
      }),
    );
    return _decode(res);
  }
}
