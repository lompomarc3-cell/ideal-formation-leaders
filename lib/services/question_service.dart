// lib/services/question_service.dart
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/question_model.dart';
import '../models/demo_question_model.dart';

class QuestionService extends ChangeNotifier {
  final _client = Supabase.instance.client;

  List<QuestionModel> _questions = [];
  List<DemoQuestionModel> _demoQuestions = [];
  bool _isLoading = false;
  String? _error;

  List<QuestionModel> get questions => _questions;
  List<DemoQuestionModel> get demoQuestions => _demoQuestions;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<List<QuestionModel>> loadByCategorie(String categorieId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _client
          .from('questions')
          .select('*')
          .eq('categorie_id', categorieId)
          .eq('is_published', true)
          .order('ordre');

      _questions = (data as List)
          .map((e) => QuestionModel.fromJson(e as Map<String, dynamic>))
          .toList();
      _isLoading = false;
      notifyListeners();
      return _questions;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return [];
    }
  }

  Future<List<DemoQuestionModel>> loadDemoQuestions() async {
    try {
      final data = await _client
          .from('demo_questions')
          .select('*')
          .eq('is_active', true)
          .order('numero');

      _demoQuestions = (data as List)
          .map((e) => DemoQuestionModel.fromJson(e as Map<String, dynamic>))
          .toList();
      notifyListeners();
      return _demoQuestions;
    } catch (e) {
      if (kDebugMode) debugPrint('loadDemoQuestions error: $e');
      return _getDefaultDemoQuestions();
    }
  }

  // QCM de démonstration par défaut si la table n'existe pas encore
  List<DemoQuestionModel> _getDefaultDemoQuestions() {
    return [
      DemoQuestionModel(
        id: '1', numero: 1,
        enonce: 'Quelle est la capitale du Burkina Faso ?',
        optionA: 'Bobo-Dioulasso', optionB: 'Ouagadougou',
        optionC: 'Koudougou', optionD: 'Banfora',
        reponseCorrecte: 'B',
        explication: 'Ouagadougou est la capitale politique et économique du Burkina Faso depuis 1919.',
        categorie: 'culture_generale',
      ),
      DemoQuestionModel(
        id: '2', numero: 2,
        enonce: 'En quelle année le Burkina Faso a-t-il obtenu son indépendance ?',
        optionA: '1958', optionB: '1962',
        optionC: '1960', optionD: '1965',
        reponseCorrecte: 'C',
        explication: 'La Haute-Volta (actuel Burkina Faso) a obtenu son indépendance de la France le 5 août 1960.',
        categorie: 'histoire',
      ),
      DemoQuestionModel(
        id: '3', numero: 3,
        enonce: 'Quel est le fleuve principal du Burkina Faso ?',
        optionA: 'Le Niger', optionB: 'La Comoé',
        optionC: 'Le Mouhoun (Volta Noire)', optionD: 'Le Nakambé',
        reponseCorrecte: 'C',
        explication: 'Le Mouhoun, autrefois appelé Volta Noire, est le plus long fleuve du Burkina Faso.',
        categorie: 'geographie',
      ),
      DemoQuestionModel(
        id: '4', numero: 4,
        enonce: 'Quelle est la loi qui régit les marchés publics au Burkina Faso ?',
        optionA: 'Loi n°003-2010/AN', optionB: 'Loi n°039-2016/AN',
        optionC: 'Loi n°12-2005/AN', optionD: 'Loi n°21-2012/AN',
        reponseCorrecte: 'B',
        explication: 'La loi n°039-2016/AN portant réglementation générale des marchés publics encadre la commande publique au Burkina.',
        categorie: 'droit',
      ),
      DemoQuestionModel(
        id: '5', numero: 5,
        enonce: 'Quelle institution est chargée du contrôle a priori des marchés publics ?',
        optionA: 'Cour des Comptes', optionB: 'ARMP',
        optionC: 'DGCMEF', optionD: 'Direction de la commande publique',
        reponseCorrecte: 'C',
        explication: 'La DGCMEF exerce le contrôle a priori des marchés publics.',
        categorie: 'marches_publics',
      ),
      DemoQuestionModel(
        id: '6', numero: 6,
        enonce: 'Le principe de transparence dans les marchés publics implique :',
        optionA: 'Des décisions secrètes', optionB: 'La justification des décisions d\'attribution',
        optionC: 'Une sélection directe', optionD: 'Une négociation privée',
        reponseCorrecte: 'B',
        explication: 'La transparence exige que toutes les décisions soient justifiées, documentées et contrôlables.',
        categorie: 'marches_publics',
      ),
      DemoQuestionModel(
        id: '7', numero: 7,
        enonce: 'Quel arrêté porte sur les modalités de rachat dans les enseignements post-primaire et secondaire ?',
        optionA: 'Arrêté N°2019-094/ MENAPLN/ SG/DGEFG', optionB: 'Arrêté N°2025-0063/ MESFPT/CB',
        optionC: 'Arrêté N°2025-010 MEEA/MESFPT/MESRI', optionD: 'Arrêté N°2022-062 MENAPLN',
        reponseCorrecte: 'A',
        explication: 'L\'arrêté N°2019-094/MENAPLN/SG/DGEFG définit les modalités de rachat au post-primaire et secondaire.',
        categorie: 'legislation',
      ),
      DemoQuestionModel(
        id: '8', numero: 8,
        enonce: 'Quel est l\'organe de recours en matière de marchés publics au Burkina Faso ?',
        optionA: 'Ministère de l\'Économie', optionB: 'ARMP',
        optionC: 'DGCMEF', optionD: 'Cour des Comptes',
        reponseCorrecte: 'B',
        explication: 'L\'ARMP reçoit et traite les recours des candidats soumissionnaires.',
        categorie: 'marches_publics',
      ),
      DemoQuestionModel(
        id: '9', numero: 9,
        enonce: 'La lutte contre la corruption est directement liée au principe de :',
        optionA: 'Libre concurrence', optionB: 'Moralité',
        optionC: 'Efficacité', optionD: 'Publicité',
        reponseCorrecte: 'B',
        explication: 'Le principe de moralité exige l\'intégrité dans toutes les procédures administratives.',
        categorie: 'principes',
      ),
      DemoQuestionModel(
        id: '10', numero: 10,
        enonce: 'Quel décret fixe les âges d\'entrée aux différents niveaux d\'enseignement au Burkina Faso ?',
        optionA: 'Décret N°2021-1123', optionB: 'Décret N°2019-0157',
        optionC: 'Décret N°2009-228/PRES/PM/MASSN/MEBA/MESSRS', optionD: 'Arrêté N°2019-094',
        reponseCorrecte: 'C',
        explication: 'Le décret N°2009-228 fixe les âges d\'entrée dans les différents niveaux d\'enseignement au Burkina Faso.',
        categorie: 'education',
      ),
    ];
  }

  // Upload de questions en masse (pour l'admin) - VERSION AMÉLIORÉE avec batch insert
  Future<Map<String, dynamic>> uploadQuestionsEnMasse({
    required String categorieId,
    required List<Map<String, dynamic>> questions,
  }) async {
    int success = 0;
    int errors = 0;
    List<String> errorMessages = [];

    // Préparer toutes les questions avec les bons champs
    final batchData = questions.asMap().entries.map((entry) {
      final idx = entry.key;
      final q = entry.value;
      return {
        'categorie_id': categorieId,
        'enonce': (q['enonce'] ?? '').toString().trim(),
        'option_a': (q['option_a'] ?? '').toString().trim(),
        'option_b': (q['option_b'] ?? '').toString().trim(),
        'option_c': (q['option_c'] ?? '').toString().trim(),
        'option_d': (q['option_d'] ?? '').toString().trim(),
        'reponse_correcte': (q['reponse_correcte'] ?? 'A').toString().trim().toUpperCase(),
        'explication': (q['explication'] ?? '').toString().trim(),
        'is_published': true,
        'ordre': idx + 1,
      };
    }).toList();

    // Essayer le batch insert d'abord (plus rapide)
    try {
      await _client.from('questions').insert(batchData);
      success = batchData.length;
    } catch (batchError) {
      if (kDebugMode) debugPrint('Batch insert failed: $batchError, trying one by one...');
      // Si le batch échoue, insérer un par un pour identifier les erreurs
      for (final q in batchData) {
        try {
          await _client.from('questions').insert(q);
          success++;
        } catch (e) {
          errors++;
          final errMsg = e.toString();
          errorMessages.add(errMsg);
          if (kDebugMode) debugPrint('Insert error for "${q['enonce']}": $errMsg');
        }
      }
    }

    // Mettre à jour le compteur de questions
    if (success > 0) {
      try {
        await _updateQuestionCount(categorieId, success);
      } catch (e) {
        if (kDebugMode) debugPrint('updateQuestionCount error: $e');
      }
    }

    return {
      'success': success,
      'errors': errors,
      'errorMessages': errorMessages,
    };
  }

  // Mettre à jour le compteur de questions d'une catégorie
  Future<void> _updateQuestionCount(String categorieId, int delta) async {
    try {
      final catData = await _client
          .from('categories')
          .select('question_count')
          .eq('id', categorieId)
          .single();
      final current = (catData['question_count'] as num?)?.toInt() ?? 0;
      await _client
          .from('categories')
          .update({'question_count': current + delta})
          .eq('id', categorieId);
    } catch (e) {
      if (kDebugMode) debugPrint('_updateQuestionCount error: $e');
    }
  }

  // Compter les questions d'une catégorie
  Future<int> countByCategorie(String categorieId) async {
    try {
      final data = await _client
          .from('questions')
          .select('id')
          .eq('categorie_id', categorieId)
          .eq('is_published', true);
      return (data as List).length;
    } catch (_) {
      return 0;
    }
  }

  // Supprimer une question
  Future<bool> deleteQuestion(String questionId, String categorieId) async {
    try {
      await _client.from('questions').delete().eq('id', questionId);
      // Décrémenter compteur
      try {
        final catData = await _client
            .from('categories')
            .select('question_count')
            .eq('id', categorieId)
            .single();
        final current = (catData['question_count'] as num?)?.toInt() ?? 0;
        if (current > 0) {
          await _client
              .from('categories')
              .update({'question_count': current - 1})
              .eq('id', categorieId);
        }
      } catch (_) {}
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }
}
