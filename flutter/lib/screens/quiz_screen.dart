import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/category.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';

/// Écran QCM principal :
///  - Flèches gauche / droite TOUJOURS cliquables (on peut sauter une question
///    sans répondre).
///  - Sauvegarde de progression : SharedPreferences (locale) + Supabase
///    (côté connecté). Quitter et revenir reprend exactement à la dernière
///    question visitée.
///  - Design aéré, cohérent avec orange / bleu ciel (zéro vert).
///  - Si non abonné : 5 premières questions visibles puis invitation à
///    s'abonner.
class QuizScreen extends StatefulWidget {
  const QuizScreen({super.key});

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  // ── 🆕 MISSION : Score & progression après 50 questions ───────────────
  // Ce comportement s'applique UNIQUEMENT au dossier "Entraînement QCM"
  // (présent en concours DIRECT et en concours PROFESSIONNEL).
  // IDs Supabase connus (sécurité supplémentaire en plus du nom) :
  static const Set<String> _entrainementQcmIds = {
    'cf24b3f1-3961-4fea-9702-0bf9fba50fdf', // Entraînement QCM (direct)
    '593a1774-e87c-414e-9a2d-c6d7dd44a51a', // Entraînement QCM (professionnel)
  };
  static const int _milestoneStep = 50;

  // Empêche d'afficher plusieurs fois le dialogue pour le même palier.
  int _lastMilestoneShown = 0;
  bool _milestoneSaving = false;

  bool _loading = true;
  String? _error;
  String? _categoryId;
  String _categoryName = '';
  bool _isPublic = false;
  bool _hasFullAccess = false;
  bool _requiresSubscription = false;
  bool _isPro = false;
  bool _initDone = false;
  // ✅ Programmation expirée : dossier visible mais limité aux 5 questions gratuites.
  // Permet d'afficher un message différencié ("Renouvelez votre abonnement").
  bool _scheduleExpired = false;
  // v2.3.0 : programmation explicitement désactivée par l'admin.
  // → Tous les utilisateurs perdent l'accès complet, même les anciens abonnés.
  bool _scheduleDisabledByAdmin = false;
  String? _lockedMessage;

  List<Question> _questions = [];
  int _currentIndex = 0;
  // Réponse choisie pour chaque question (null si pas répondu)
  List<String?> _answers = [];
  int _correctCount = 0;
  final PageController _pageCtrl = PageController();

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initDone) return;
    _initDone = true;
    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    _categoryId = args?['categoryId']?.toString();
    _categoryName = args?['categoryName']?.toString() ?? 'QCM';
    _isPublic = args?['isPublic'] == true;
    _isPro = args?['isPro'] == true;
    if (_categoryId == null) {
      setState(() {
        _loading = false;
        _error = 'Catégorie inconnue';
      });
      return;
    }
    _loadQuestions();
  }

  Future<void> _loadQuestions() async {
    final auth = context.read<AuthService>();
    try {
      final data = _isPublic || !auth.isAuthenticated
          ? await auth.api.publicQuestions(_categoryId!)
          : await auth.api.questions(auth.token!, _categoryId!);

      if (data['error'] != null &&
          (data['questions'] == null ||
              (data['questions'] as List).isEmpty)) {
        setState(() {
          _loading = false;
          _error = data['error'].toString();
          _requiresSubscription = data['requiresSubscription'] == true;
        });
        return;
      }

      final list = (data['questions'] as List? ?? [])
          .map((e) => Question.fromJson(Map<String, dynamic>.from(e)))
          .toList();

      // Restaurer la progression
      int restoredIndex = await auth.getLocalProgressIndex(_categoryId!);
      if (restoredIndex >= list.length) restoredIndex = 0;

      if (!mounted) return;
      setState(() {
        _questions = list;
        _answers = List<String?>.filled(list.length, null);
        _hasFullAccess = data['hasFullAccess'] == true;
        // ✅ Capter l'info "programmation expirée" pour l'affichage UI
        _scheduleExpired = data['scheduleExpired'] == true;
        // v2.3.0 : info "programmation désactivée par l'admin"
        _scheduleDisabledByAdmin = data['scheduleDisabledByAdmin'] == true;
        _lockedMessage = data['lockedMessage']?.toString();
        _currentIndex = restoredIndex;
        _loading = false;
      });
      if (restoredIndex > 0) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (_pageCtrl.hasClients) _pageCtrl.jumpToPage(restoredIndex);
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = 'Erreur réseau : $e';
        });
      }
    }
  }

  /// 🆕 Détecte si le dossier en cours est bien "Entraînement QCM".
  /// On teste à la fois l'ID Supabase (le plus fiable) et le nom normalisé
  /// (sans accent ni casse) pour rester robuste.
  bool get _isEntrainementQcm {
    if (_categoryId != null && _entrainementQcmIds.contains(_categoryId)) {
      return true;
    }
    final normalized = _categoryName
        .toLowerCase()
        .replaceAll('î', 'i')
        .replaceAll('ï', 'i')
        .trim();
    return normalized == 'entrainement qcm';
  }

  Future<void> _selectAnswer(String letter) async {
    if (_answers[_currentIndex] != null) return;
    final q = _questions[_currentIndex];
    final correct = q.bonneReponse.toUpperCase() == letter.toUpperCase();
    // Numéro de la question répondue (1-based) : c'est la valeur qui sert
    // de référence pour les paliers 50/100/150… (= "fin de la question 50").
    final answeredQuestionNumber = _currentIndex + 1;
    setState(() {
      _answers[_currentIndex] = letter;
      if (correct) _correctCount++;
    });

    final auth = context.read<AuthService>();
    if (auth.isAuthenticated) {
      try {
        await auth.api.saveProgress(
          auth.token!,
          categorieId: _categoryId!,
          questionId: q.id,
          isCorrect: correct,
          score: _correctCount,
        );
      } catch (_) {}
    }

    // 🆕 MISSION : à la fin de la question 50 (puis 100, 150…), uniquement
    // dans le dossier "Entraînement QCM", afficher le score + la progression
    // puis laisser continuer. On se base sur le NUMÉRO de la question répondue
    // (position absolue dans le quiz), exactement comme demandé par le client :
    // "quand l'utilisateur atteint la question 50, avant de passer à 51".
    _maybeShowMilestone(answeredQuestionNumber);
  }

  /// 🆕 Affiche le récapitulatif de progression quand l'utilisateur atteint
  /// un palier de 50 questions, uniquement dans le dossier "Entraînement QCM".
  ///
  /// [reached] = numéro de question atteint (position 1-based dans le quiz).
  /// Le dialogue s'affiche exactement à 50, 100, 150, etc.
  void _maybeShowMilestone(int reached) {
    if (!_isEntrainementQcm) return;
    if (reached <= 0) return;
    if (reached % _milestoneStep != 0) return;
    // Empêche d'afficher deux fois le même palier (réponse + navigation).
    if (reached <= _lastMilestoneShown) return;

    _lastMilestoneShown = reached;
    final milestone = reached;
    // Score affiché = nombre de bonnes réponses cumulées sur ce palier.
    final scoreAtMilestone = _correctCount;
    // Sauvegarde optionnelle du milestone (score à 50 / 100 / ...).
    _saveMilestone(milestone, scoreAtMilestone);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _showMilestoneDialog(milestone, scoreAtMilestone);
    });
  }

  /// 🆕 Dialogue de progression affiché tous les 50 questions.
  void _showMilestoneDialog(int milestone, int score) {
    final color = _isPro ? const Color(0xFF0EA5E9) : AppColors.primary;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Icon(Icons.insights_rounded, color: color, size: 28),
            const SizedBox(width: 8),
            const Expanded(
              child: Text('Votre progression',
                  style: TextStyle(fontWeight: FontWeight.w900)),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                children: [
                  const Text('✅ Score',
                      style: TextStyle(
                          fontWeight: FontWeight.w700, fontSize: 13)),
                  const SizedBox(height: 4),
                  Text(
                    '$score / $milestone',
                    style: TextStyle(
                        fontSize: 30,
                        color: color,
                        fontWeight: FontWeight.w900),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            Text(
              '📈 Progression : vous avez complété $milestone questions.',
              style: const TextStyle(
                  fontSize: 13.5, height: 1.5, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            const Text(
              '👉 Vous pouvez continuer avec les questions suivantes.',
              style: TextStyle(
                  fontSize: 13.5,
                  height: 1.5,
                  color: Color(0xFF374151)),
            ),
          ],
        ),
        actions: [
          ElevatedButton.icon(
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(Icons.arrow_forward_rounded),
            label: const Text('Continuer'),
            style: ElevatedButton.styleFrom(
              backgroundColor: color,
              padding:
                  const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
            ),
          ),
        ],
      ),
    );
  }

  /// 🆕 Sauvegarde optionnelle du milestone dans Supabase (table
  /// `quiz_milestones`). Échoue silencieusement : ne doit jamais bloquer
  /// l'expérience utilisateur.
  Future<void> _saveMilestone(int questionCount, int score) async {
    final auth = context.read<AuthService>();
    if (!auth.isAuthenticated || _categoryId == null) return;
    if (_milestoneSaving) return;
    _milestoneSaving = true;
    try {
      await auth.api.saveQuizMilestone(
        auth.token!,
        categorieId: _categoryId!,
        questionCount: questionCount,
        scoreAt50: score,
      );
    } catch (_) {
      // silencieux : la sauvegarde du milestone est optionnelle
    } finally {
      _milestoneSaving = false;
    }
  }

  Future<void> _saveProgressIndex(int index) async {
    final auth = context.read<AuthService>();
    if (_categoryId != null) {
      // toujours sauvegarder en local pour invité comme connecté
      await auth.saveLocalProgressIndex(_categoryId!, index);
    }
  }

  void _go(int delta) {
    final newIndex = _currentIndex + delta;
    if (newIndex < 0 || newIndex >= _questions.length) return;
    _jumpTo(newIndex);
  }

  void _jumpTo(int index) {
    setState(() => _currentIndex = index);
    _pageCtrl.animateToPage(
      index,
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeOutCubic,
    );
    _saveProgressIndex(index);
  }

  void _showResults() {
    final pct = (_correctCount / _questions.length * 100).round();
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.emoji_events_rounded,
                color: Color(0xFFFBBF24), size: 30),
            const SizedBox(width: 8),
            const Text('Bravo !',
                style: TextStyle(fontWeight: FontWeight.w900)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Score : $_correctCount / ${_questions.length}',
              style:
                  const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(
              '$pct %',
              style: const TextStyle(
                  fontSize: 32,
                  color: AppColors.primary,
                  fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: _correctCount / _questions.length,
                minHeight: 8,
                backgroundColor: const Color(0xFFFFE4CC),
                valueColor: const AlwaysStoppedAnimation<Color>(
                    AppColors.primary),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Fermer'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.of(context).pop();
            },
            child: const Text('Retour'),
          ),
        ],
      ),
    );
  }

  /// Affiche une invitation à s'abonner après la 5e question gratuite
  void _maybeShowSubscribeInvite() {
    if (_hasFullAccess) return;
    if (_currentIndex == 4) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (_) => _buildSubscribeSheet(),
        );
      });
    }
  }

  Widget _buildSubscribeSheet() {
    final isPro = _isPro;
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 50,
              height: 5,
              decoration: BoxDecoration(
                color: const Color(0xFFE5E7EB),
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: (isPro
                          ? const Color(0xFF0EA5E9)
                          : AppColors.primary)
                      .withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.lock_open_rounded,
                  color: isPro
                      ? const Color(0xFF0EA5E9)
                      : AppColors.primary,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  // ✅ Différencier entre "non abonné", "abonnement expiré (programmation)"
                  //   et "programmation désactivée par l'administrateur" (v2.3.0)
                  _scheduleDisabledByAdmin
                      ? 'Programmation désactivée\npar l\'administrateur.'
                      : _scheduleExpired
                          ? 'Vous avez vu les\n5 questions disponibles.'
                          : 'Bravo, vous avez fini\nles 5 questions gratuites !',
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                    height: 1.3,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            _scheduleDisabledByAdmin
                ? 'L\'accès complet à ce dossier a été réinitialisé par l\'administrateur. Renouvelez votre abonnement pour récupérer l\'accès complet aux questions.'
                : _scheduleExpired
                    ? 'Votre accès à ce dossier est arrivé à terme. Renouvelez votre abonnement pour récupérer l\'accès complet aux questions.'
                    : isPro
                        ? 'Débloquez ce dossier et profitez en plus des 3 dossiers bonus offerts (Entraînement QCM, Actualités, Accompagnement).'
                        : 'Avec 5 000 FCFA par an, accédez aux 12 dossiers de concours directs.',
            style: const TextStyle(
              fontSize: 13.5,
              height: 1.5,
              color: Color(0xFF374151),
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.of(context).pushNamed('/payment');
            },
            icon: const Icon(Icons.flash_on_rounded),
            label: const Text("S'abonner maintenant"),
            style: ElevatedButton.styleFrom(
              backgroundColor: isPro
                  ? const Color(0xFF0EA5E9)
                  : AppColors.primary,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(Icons.close_rounded),
            label: const Text('Continuer la démo'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF6B7280),
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _pageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightBg,
      appBar: AppBar(
        backgroundColor:
            _isPro ? const Color(0xFF0369A1) : AppColors.primary,
        foregroundColor: Colors.white,
        title: Text(_categoryName,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style:
                const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: _loading
          ? Center(
              child: CircularProgressIndicator(
                color: _isPro
                    ? const Color(0xFF0EA5E9)
                    : AppColors.primary,
              ),
            )
          : _error != null
              ? _buildError()
              : _questions.isEmpty
                  ? const Center(child: Text('Aucune question disponible'))
                  : _buildQuiz(),
    );
  }

  Widget _buildError() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.lock_rounded, size: 60, color: AppColors.primary),
          const SizedBox(height: 16),
          Text(_error ?? 'Erreur',
              textAlign: TextAlign.center,
              style: const TextStyle(
                  fontWeight: FontWeight.w700, fontSize: 16)),
          const SizedBox(height: 24),
          if (_requiresSubscription)
            ElevatedButton.icon(
              onPressed: () =>
                  Navigator.of(context).pushReplacementNamed('/payment'),
              icon: const Icon(Icons.payment),
              label: const Text("S'abonner maintenant"),
              style: ElevatedButton.styleFrom(
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('← Retour'),
          ),
        ],
      ),
    );
  }

  Widget _buildQuiz() {
    return Column(
      children: [
        _buildProgressBar(),
        if (!_hasFullAccess) _buildDemoBanner(),
        Expanded(
          child: PageView.builder(
            controller: _pageCtrl,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _questions.length,
            onPageChanged: (i) {
              setState(() => _currentIndex = i);
              _saveProgressIndex(i);
              _maybeShowSubscribeInvite();
              // 🆕 Filet de sécurité : si l'utilisateur arrive sur la 51e
              // question (index 50), la 101e (index 100), etc., on déclenche
              // aussi le palier au cas où il aurait sauté des réponses.
              // `i` est l'index 0-based ⇒ `i` = nombre de questions franchies.
              _maybeShowMilestone(i);
            },
            itemBuilder: (_, i) => _buildQuestionCard(_questions[i], i),
          ),
        ),
        _buildNavigationBar(),
      ],
    );
  }

  Widget _buildProgressBar() {
    final progress = (_currentIndex + 1) / _questions.length;
    final color =
        _isPro ? const Color(0xFF0EA5E9) : AppColors.primary;
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      color: Colors.white,
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Question ${_currentIndex + 1} sur ${_questions.length}',
                style: const TextStyle(
                    fontWeight: FontWeight.w800, fontSize: 13),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'Score : $_correctCount',
                  style: TextStyle(
                      color: color,
                      fontWeight: FontWeight.w900,
                      fontSize: 13),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: color.withValues(alpha: 0.15),
              color: color,
              minHeight: 8,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDemoBanner() {
    // ✅ Message adapté selon le contexte :
    // - Programmation désactivée par l'admin (v2.3.0) → message spécifique
    // - Programmation expirée                       → "Renouvelez votre abonnement"
    // - Pas d'abonnement                            → "5 premières questions gratuites — abonnez-vous"
    final bool isDisabled = _scheduleDisabledByAdmin;
    final bool isExpired = _scheduleExpired || isDisabled;
    final Color bgColor =
        isExpired ? const Color(0xFFFEE2E2) : const Color(0xFFFFF3D9);
    final Color borderColor =
        isExpired ? const Color(0xFFEF4444) : const Color(0xFFFBBF24);
    final Color textColor =
        isExpired ? const Color(0xFF991B1B) : const Color(0xFF92400E);
    final IconData icon = isExpired
        ? Icons.lock_clock_rounded
        : Icons.info_outline_rounded;
    final String message = isDisabled
        ? 'Programmation désactivée par l\'administrateur — renouvelez votre abonnement pour récupérer l\'accès complet.'
        : isExpired
            ? (_lockedMessage != null && _lockedMessage!.isNotEmpty
                ? '$_lockedMessage — Renouvelez votre abonnement pour accéder à toutes les questions.'
                : 'Votre abonnement est expiré. Renouvelez-le pour accéder à toutes les questions.')
            : '5 premières questions gratuites — abonnez-vous pour tout débloquer.';

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: textColor),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                  fontSize: 12,
                  color: textColor,
                  fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuestionCard(Question q, int index) {
    final color =
        _isPro ? const Color(0xFF0EA5E9) : AppColors.primary;
    final answered = _answers[index] != null;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFFFE4CC)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 16,
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Badge numéro de question (#N sur N) + éventuelle matière
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: color,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        'Question ${index + 1} / ${_questions.length}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    if (q.matiere != null)
                      Flexible(
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: color.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            q.matiere!,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: color),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  q.questionText,
                  style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      height: 1.5),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          ...['A', 'B', 'C', 'D']
              .map((l) => _buildOption(l, q.getOption(l), q, index)),
          if (answered &&
              q.explication != null &&
              q.explication!.isNotEmpty) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF8F0),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFFFE4CC), width: 1.5),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('💡  Explication',
                      style: TextStyle(
                          fontWeight: FontWeight.w900,
                          color: AppColors.darkTerracotta)),
                  const SizedBox(height: 6),
                  Text(q.explication ?? '',
                      style:
                          const TextStyle(height: 1.5, fontSize: 13.5)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildOption(String letter, String text, Question q, int index) {
    final selected = _answers[index];
    final answered = selected != null;
    final isSelected = selected == letter;
    final isCorrect = q.bonneReponse.toUpperCase() == letter;
    Color borderColor = const Color(0xFFE5E7EB);
    Color bgColor = Colors.white;
    Color textColor = const Color(0xFF374151);
    if (answered) {
      if (isCorrect) {
        borderColor = const Color(0xFFFBBF24);
        bgColor = const Color(0xFFFFF3D9);
        textColor = const Color(0xFF78350F);
      } else if (isSelected && !isCorrect) {
        borderColor = const Color(0xFFEF4444);
        bgColor = const Color(0xFFFEE2E2);
        textColor = const Color(0xFF7F1D1D);
      }
    } else if (isSelected) {
      borderColor = AppColors.primary;
      bgColor = const Color(0xFFFFF8F0);
    }
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: answered ? null : () => _selectAnswer(letter),
        borderRadius: BorderRadius.circular(14),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: borderColor, width: 2),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: borderColor,
                  borderRadius: BorderRadius.circular(10),
                ),
                alignment: Alignment.center,
                child: Text(letter,
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 14)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(text,
                    style: TextStyle(
                      fontSize: 14,
                      color: textColor,
                      fontWeight: FontWeight.w600,
                      height: 1.5,
                    )),
              ),
              if (answered && isCorrect)
                const Icon(Icons.check_circle, color: Color(0xFFD97706)),
              if (answered && isSelected && !isCorrect)
                const Icon(Icons.cancel, color: Color(0xFFEF4444)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavigationBar() {
    final isFirst = _currentIndex == 0;
    final isLast = _currentIndex >= _questions.length - 1;
    final color =
        _isPro ? const Color(0xFF0EA5E9) : AppColors.primary;

    return Container(
      padding: EdgeInsets.fromLTRB(
          12, 10, 12, MediaQuery.of(context).padding.bottom + 10),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: Row(
        children: [
          // FLECHE PRECEDENTE - toujours cliquable si on n'est pas à la 1ère
          _navArrow(
            icon: Icons.arrow_back_rounded,
            label: 'Préc.',
            enabled: !isFirst,
            color: color,
            onTap: () => _go(-1),
          ),
          const SizedBox(width: 8),
          // Pastilles indicateurs cliquables (jump direct)
          Expanded(
            child: SizedBox(
              height: 30,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _questions.length,
                separatorBuilder: (_, __) => const SizedBox(width: 4),
                itemBuilder: (_, i) {
                  final answered = _answers[i] != null;
                  final isCurrent = i == _currentIndex;
                  final isCorrect = answered &&
                      _answers[i] ==
                          _questions[i].bonneReponse.toUpperCase();
                  Color bg;
                  Color fg;
                  if (isCurrent) {
                    bg = color;
                    fg = Colors.white;
                  } else if (!answered) {
                    bg = const Color(0xFFF3F4F6);
                    fg = const Color(0xFF6B7280);
                  } else if (isCorrect) {
                    bg = const Color(0xFFFBBF24);
                    fg = Colors.white;
                  } else {
                    bg = const Color(0xFFEF4444);
                    fg = Colors.white;
                  }
                  return InkWell(
                    onTap: () => _jumpTo(i),
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      width: 26,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: bg,
                        borderRadius: BorderRadius.circular(8),
                        border: isCurrent
                            ? Border.all(color: color, width: 2)
                            : null,
                      ),
                      child: Text(
                        '${i + 1}',
                        style: TextStyle(
                          color: fg,
                          fontWeight: FontWeight.w900,
                          fontSize: 11,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          const SizedBox(width: 8),
          // FLECHE SUIVANTE / TERMINER
          _navArrow(
            icon: isLast
                ? Icons.flag_rounded
                : Icons.arrow_forward_rounded,
            label: isLast ? 'Terminer' : 'Suiv.',
            enabled: true,
            color: color,
            primary: true,
            onTap: () {
              if (isLast) {
                _showResults();
              } else {
                _go(1);
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _navArrow({
    required IconData icon,
    required String label,
    required bool enabled,
    required Color color,
    required VoidCallback onTap,
    bool primary = false,
  }) {
    final bg = enabled
        ? (primary ? color : Colors.white)
        : const Color(0xFFF3F4F6);
    final fg = enabled
        ? (primary ? Colors.white : color)
        : const Color(0xFF9CA3AF);
    final borderColor =
        enabled ? color : const Color(0xFFE5E7EB);
    return InkWell(
      onTap: enabled ? onTap : null,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        height: 46,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor, width: 2),
          boxShadow: enabled && primary
              ? [
                  BoxShadow(
                    color: color.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: fg, size: 18),
            const SizedBox(width: 4),
            Text(label,
                style: TextStyle(
                    color: fg,
                    fontWeight: FontWeight.w900,
                    fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
