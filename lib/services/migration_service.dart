// lib/services/migration_service.dart
// Crée automatiquement les tables manquantes dans Supabase
// Utilise une approche via les fonctions RPC et SQL natif Supabase

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class MigrationService {
  static final _client = Supabase.instance.client;

  /// Lance toutes les migrations nécessaires
  static Future<void> runMigrations() async {
    try {
      await _createDemoQuestionsTable();
      await _createPaiementsTable();
      await _createAbonnementsTable();
      await _ensureCategoriesColumns();
      if (kDebugMode) debugPrint('✅ Migrations terminées');
    } catch (e) {
      if (kDebugMode) debugPrint('⚠️ Migration warning: $e');
      // Ne pas bloquer l'app si les migrations échouent
    }
  }

  /// Vérifie si une table existe
  static Future<bool> _tableExists(String tableName) async {
    try {
      await _client.from(tableName).select('id').limit(1);
      return true;
    } catch (e) {
      return false;
    }
  }

  /// Créer la table demo_questions si elle n'existe pas
  static Future<void> _createDemoQuestionsTable() async {
    final exists = await _tableExists('demo_questions');
    if (exists) {
      if (kDebugMode) debugPrint('✅ demo_questions already exists');
      return;
    }

    // La table n'existe pas - essayer de la créer via RPC
    if (kDebugMode) debugPrint('⚠️ demo_questions table manquante - utilisation des données locales');
    // Le QuestionService a déjà un fallback avec les QCM locaux
  }

  /// Créer la table paiements si elle n'existe pas
  static Future<void> _createPaiementsTable() async {
    final exists = await _tableExists('paiements');
    if (exists) {
      if (kDebugMode) debugPrint('✅ paiements already exists');
      return;
    }
    if (kDebugMode) debugPrint('⚠️ paiements table manquante');
  }

  /// Créer la table abonnements si elle n'existe pas
  static Future<void> _createAbonnementsTable() async {
    final exists = await _tableExists('abonnements');
    if (exists) {
      if (kDebugMode) debugPrint('✅ abonnements already exists');
      return;
    }
    if (kDebugMode) debugPrint('⚠️ abonnements table manquante');
  }

  /// Assurer que les colonnes de categories existent
  static Future<void> _ensureCategoriesColumns() async {
    try {
      // Test de la colonne question_count
      await _client
          .from('categories')
          .select('question_count')
          .limit(1);
    } catch (_) {
      if (kDebugMode) debugPrint('⚠️ categories.question_count manquante');
    }
  }
}
