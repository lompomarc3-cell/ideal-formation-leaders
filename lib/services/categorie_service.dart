// lib/services/categorie_service.dart
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/categorie_model.dart';

class CategorieService extends ChangeNotifier {
  final _client = Supabase.instance.client;

  List<CategorieModel> _categories = [];
  bool _isLoading = false;
  String? _error;

  List<CategorieModel> get categories => _categories;
  bool get isLoading => _isLoading;
  String? get error => _error;

  List<CategorieModel> getByType(String type) =>
      _categories.where((c) => c.type == type && c.isActive).toList()
        ..sort((a, b) => a.nom.compareTo(b.nom));

  List<CategorieModel> get directCategories => getByType('direct');
  List<CategorieModel> get professionnelCategories => getByType('professionnel');

  Future<void> loadAll() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _client
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('nom');

      _categories = (data as List)
          .map((e) => CategorieModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _error = e.toString();
      if (kDebugMode) debugPrint('CategorieService error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updatePrix(String categorieId, int nouveauPrix) async {
    try {
      await _client
          .from('categories')
          .update({'prix': nouveauPrix})
          .eq('id', categorieId);
      await loadAll();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> updateAllPrixByType(String type, int nouveauPrix) async {
    try {
      await _client
          .from('categories')
          .update({'prix': nouveauPrix})
          .eq('type', type);
      await loadAll();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  // Pour l'admin: incrémenter le compteur de questions
  Future<void> incrementQuestionCount(String categorieId) async {
    try {
      final data = await _client
          .from('categories')
          .select('question_count')
          .eq('id', categorieId)
          .single();
      final current = (data['question_count'] as num?)?.toInt() ?? 0;
      await _client
          .from('categories')
          .update({'question_count': current + 1})
          .eq('id', categorieId);
    } catch (e) {
      if (kDebugMode) debugPrint('incrementQuestionCount error: $e');
    }
  }
}
