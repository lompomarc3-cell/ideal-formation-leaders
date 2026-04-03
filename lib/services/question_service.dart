// lib/services/question_service.dart
// Adapté au vrai schéma: questions(id, category_id, enonce, option_a/b/c/d, reponse_correcte, ...)
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/question_model.dart';

class QuestionService extends ChangeNotifier {
  final SupabaseClient _client = Supabase.instance.client;

  List<QuestionModel> _questions = [];
  bool _isLoading = false;
  String? _error;

  List<QuestionModel> get questions => _questions;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Récupérer questions par catégorie (remplace l'ancienne méthode par sous_categorie)
  Future<List<QuestionModel>> getQuestionsBySousCategorie(
      String categoryId) async {
    return getQuestionsByCategory(categoryId);
  }

  Future<List<QuestionModel>> getQuestionsByCategory(String categoryId) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final response = await _client
          .from('questions')
          .select()
          .eq('category_id', categoryId)
          .eq('is_active', true)
          .order('created_at', ascending: true);

      _questions = (response as List)
          .map((e) => QuestionModel.fromMap(e as Map<String, dynamic>))
          .toList();

      notifyListeners();
      return _questions;
    } catch (e) {
      _error = 'Erreur lors du chargement des questions: $e';
      if (kDebugMode) debugPrint(_error);
      notifyListeners();
      return [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Récupérer les questions démo
  Future<List<QuestionModel>> getDemoQuestions() async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final response = await _client
          .from('questions')
          .select()
          .eq('is_demo', true)
          .eq('is_active', true)
          .order('created_at', ascending: true);

      _questions = (response as List)
          .map((e) => QuestionModel.fromMap(e as Map<String, dynamic>))
          .toList();

      notifyListeners();
      return _questions;
    } catch (e) {
      _error = 'Erreur lors du chargement des questions démo: $e';
      if (kDebugMode) debugPrint(_error);
      notifyListeners();
      return [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Créer une question (admin uniquement)
  Future<bool> createQuestion(QuestionModel question) async {
    try {
      await _client.from('questions').insert(question.toMap());
      return true;
    } catch (e) {
      if (kDebugMode) debugPrint('Erreur création question: $e');
      return false;
    }
  }

  /// Modifier une question (admin uniquement)
  Future<bool> updateQuestion(String id, Map<String, dynamic> data) async {
    try {
      await _client.from('questions').update(data).eq('id', id);
      return true;
    } catch (e) {
      if (kDebugMode) debugPrint('Erreur mise à jour question: $e');
      return false;
    }
  }

  /// Supprimer une question (admin uniquement)
  Future<bool> deleteQuestion(String id) async {
    try {
      await _client.from('questions').delete().eq('id', id);
      return true;
    } catch (e) {
      if (kDebugMode) debugPrint('Erreur suppression question: $e');
      return false;
    }
  }

  /// Activer / désactiver une question (admin)
  Future<bool> togglePublish(String id, bool isActive) async {
    try {
      await _client
          .from('questions')
          .update({'is_active': isActive}).eq('id', id);
      return true;
    } catch (e) {
      if (kDebugMode) debugPrint('Erreur toggle publish: $e');
      return false;
    }
  }

  /// Récupérer toutes les questions pour l'admin
  Future<List<QuestionModel>> getAllQuestions({String? categoryId}) async {
    try {
      dynamic query = _client.from('questions').select();
      if (categoryId != null) {
        query = query.eq('category_id', categoryId);
      }
      final response = await query.order('created_at', ascending: false);
      return (response as List)
          .map((e) => QuestionModel.fromMap(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      if (kDebugMode) debugPrint('Erreur chargement toutes questions: $e');
      return [];
    }
  }
}
