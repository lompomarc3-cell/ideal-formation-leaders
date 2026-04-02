// lib/services/categorie_service.dart
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/categorie_model.dart';
import '../models/sous_categorie_model.dart';

class CategorieService extends ChangeNotifier {
  final SupabaseClient _client = Supabase.instance.client;

  List<CategorieModel> _categories = [];
  List<SousCategorieModel> _sousCategories = [];
  bool _isLoading = false;

  List<CategorieModel> get categories => _categories;
  List<SousCategorieModel> get sousCategories => _sousCategories;
  bool get isLoading => _isLoading;

  List<CategorieModel> getCategoriesByType(String type) =>
      _categories.where((c) => c.typeConcours == type).toList()
        ..sort((a, b) => a.ordre.compareTo(b.ordre));

  List<SousCategorieModel> getSousCategoriesByCategorie(String categorieId) =>
      _sousCategories.where((sc) => sc.categorieId == categorieId).toList()
        ..sort((a, b) => a.ordre.compareTo(b.ordre));

  List<SousCategorieModel> getSousCategoriesByType(String type) =>
      _sousCategories.where((sc) => sc.typeConcours == type).toList()
        ..sort((a, b) => a.ordre.compareTo(b.ordre));

  Future<void> loadCategories() async {
    try {
      _isLoading = true;
      notifyListeners();

      final response = await _client
          .from('categories')
          .select()
          .order('ordre', ascending: true);

      _categories = (response as List)
          .map((e) => CategorieModel.fromMap(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      if (kDebugMode) debugPrint('Erreur chargement catégories: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadSousCategories() async {
    try {
      _isLoading = true;
      notifyListeners();

      final response = await _client
          .from('sous_categories')
          .select()
          .order('ordre', ascending: true);

      _sousCategories = (response as List)
          .map((e) => SousCategorieModel.fromMap(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      if (kDebugMode) debugPrint('Erreur chargement sous-catégories: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadAll() async {
    await Future.wait([loadCategories(), loadSousCategories()]);
  }
}
