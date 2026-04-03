// lib/services/categorie_service.dart
// Adapté au vrai schéma: la table 'categories' contient 'type' (direct/professionnel)
// Les 'sous_categories' sont simulées depuis les 'categories'
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/categorie_model.dart';
import '../models/sous_categorie_model.dart';

class CategorieService extends ChangeNotifier {
  final SupabaseClient _client = Supabase.instance.client;

  List<CategorieModel> _categories = [];
  bool _isLoading = false;

  List<CategorieModel> get categories => _categories;
  bool get isLoading => _isLoading;

  // Mapper les catégories en "sous-catégories" pour la compatibilité avec l'UI
  List<SousCategorieModel> get sousCategories {
    return _categories.asMap().entries.map((entry) {
      return SousCategorieModel.fromCategorie(entry.value, entry.key + 1);
    }).toList();
  }

  List<CategorieModel> getCategoriesByType(String type) =>
      _categories.where((c) => c.typeConcours == type).toList();

  // Cette méthode est appelée par CategoriesScreen avec typeConcours
  List<SousCategorieModel> getSousCategoriesByType(String type) {
    final filtered = _categories
        .where((c) => c.typeConcours == type)
        .toList();
    return filtered.asMap().entries.map((entry) {
      return SousCategorieModel.fromCategorie(entry.value, entry.key + 1);
    }).toList();
  }

  List<SousCategorieModel> getSousCategoriesByCategorie(String categorieId) {
    // Dans notre schéma, categorieId == id de la catégorie
    final filtered = _categories.where((c) => c.id == categorieId).toList();
    return filtered.asMap().entries.map((entry) {
      return SousCategorieModel.fromCategorie(entry.value, entry.key + 1);
    }).toList();
  }

  Future<void> loadCategories() async {
    try {
      _isLoading = true;
      notifyListeners();

      final response = await _client
          .from('categories')
          .select()
          .eq('is_active', true)
          .order('nom', ascending: true);

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

  // Compatibilité: loadSousCategories ne fait rien car on n'a pas de table sous_categories
  Future<void> loadSousCategories() async {
    // Les sous-catégories sont dérivées des catégories
    // Pas de table séparée dans le schéma réel
  }

  Future<void> loadAll() async {
    await loadCategories();
  }
}
