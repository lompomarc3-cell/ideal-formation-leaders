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

  // ==================== ADMIN ====================

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

  Future<Map<String, dynamic>> adminPayments(String token) async {
    final res = await _client.get(
      Uri.parse('$baseUrl/api/admin/payments'),
      headers: _jsonHeaders(token),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> adminCategories(String token) async {
    final res = await _client.get(
      Uri.parse('$baseUrl/api/admin/categories'),
      headers: _jsonHeaders(token),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> adminQuestions(String token, {String? categorieId}) async {
    final qp = categorieId != null ? '?categorie_id=$categorieId' : '';
    final res = await _client.get(
      Uri.parse('$baseUrl/api/admin/questions$qp'),
      headers: _jsonHeaders(token),
    );
    return _decode(res);
  }

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
