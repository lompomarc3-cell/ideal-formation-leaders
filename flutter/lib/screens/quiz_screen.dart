import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/category.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';

class QuizScreen extends StatefulWidget {
  const QuizScreen({super.key});

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  bool _loading = true;
  String? _error;
  String? _categoryId;
  String _categoryName = '';
  bool _isPublic = false;
  bool _hasFullAccess = false;
  bool _requiresSubscription = false;
  bool _initDone = false;

  List<Question> _questions = [];
  int _currentIndex = 0;
  String? _selectedAnswer;
  bool _answered = false;
  int _correctCount = 0;
  final PageController _pageCtrl = PageController();

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initDone) return;
    _initDone = true;
    final args = ModalRoute.of(context)?.settings.arguments
        as Map<String, dynamic>?;
    _categoryId = args?['categoryId']?.toString();
    _categoryName = args?['categoryName']?.toString() ?? 'QCM';
    _isPublic = args?['isPublic'] == true;
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

      if (data['error'] != null && (data['questions'] == null || (data['questions'] as List).isEmpty)) {
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

      // Restaurer la progression locale
      int restoredIndex = 0;
      if (auth.isAuthenticated) {
        restoredIndex = await auth.getLocalProgressIndex(_categoryId!);
        if (restoredIndex >= list.length) restoredIndex = 0;
      }

      if (!mounted) return;
      setState(() {
        _questions = list;
        _hasFullAccess = data['hasFullAccess'] == true;
        _currentIndex = restoredIndex;
        _loading = false;
      });
      if (restoredIndex > 0) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _pageCtrl.jumpToPage(restoredIndex);
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

  Future<void> _selectAnswer(String letter) async {
    if (_answered) return;
    final q = _questions[_currentIndex];
    final correct = q.bonneReponse.toUpperCase() == letter.toUpperCase();
    setState(() {
      _selectedAnswer = letter;
      _answered = true;
      if (correct) _correctCount++;
    });

    final auth = context.read<AuthService>();
    if (auth.isAuthenticated) {
      // Sauvegarder en DB
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
  }

  void _nextQuestion() async {
    if (_currentIndex >= _questions.length - 1) {
      _showResults();
      return;
    }
    final newIndex = _currentIndex + 1;
    setState(() {
      _currentIndex = newIndex;
      _selectedAnswer = null;
      _answered = false;
    });
    _pageCtrl.animateToPage(newIndex,
        duration: const Duration(milliseconds: 250), curve: Curves.easeOut);

    // Sauvegarder la progression locale
    final auth = context.read<AuthService>();
    if (auth.isAuthenticated && _categoryId != null) {
      auth.saveLocalProgressIndex(_categoryId!, newIndex);
    }
  }

  void _previousQuestion() {
    if (_currentIndex <= 0) return;
    final newIndex = _currentIndex - 1;
    setState(() {
      _currentIndex = newIndex;
      _selectedAnswer = null;
      _answered = false;
    });
    _pageCtrl.animateToPage(newIndex,
        duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
  }

  void _showResults() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('🎉 Bravo !', style: TextStyle(fontWeight: FontWeight.w900)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Score final : $_correctCount / ${_questions.length}',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(
              '${((_correctCount / _questions.length) * 100).round()} %',
              style: const TextStyle(fontSize: 28, color: AppColors.primary, fontWeight: FontWeight.w900),
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
              Navigator.of(context).pop(); // sortir du quiz
            },
            child: const Text('Retour'),
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
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        title: Text(_categoryName,
            maxLines: 1, overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
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
          const Icon(Icons.lock, size: 60, color: AppColors.primary),
          const SizedBox(height: 16),
          Text(_error ?? 'Erreur',
              textAlign: TextAlign.center,
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
          const SizedBox(height: 24),
          if (_requiresSubscription)
            ElevatedButton.icon(
              onPressed: () => Navigator.of(context).pushReplacementNamed('/payment'),
              icon: const Icon(Icons.payment),
              label: const Text("S'abonner maintenant"),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
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
            itemBuilder: (_, i) => _buildQuestionCard(_questions[i]),
          ),
        ),
        _buildNavigationBar(),
      ],
    );
  }

  Widget _buildProgressBar() {
    final progress = (_currentIndex + 1) / _questions.length;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Question ${_currentIndex + 1} / ${_questions.length}',
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
              ),
              Text(
                'Score : $_correctCount',
                style: const TextStyle(
                    color: AppColors.primary, fontWeight: FontWeight.w800, fontSize: 13),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: const Color(0xFFFFE4CC),
              color: AppColors.primary,
              minHeight: 8,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDemoBanner() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline, size: 18, color: Color(0xFFB45309)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Mode aperçu — ${_questions.length} questions gratuites. Abonnez-vous pour tout débloquer.',
              style: const TextStyle(
                  fontSize: 12, color: Color(0xFFB45309), fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuestionCard(Question q) {
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
                if (q.matiere != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF7ED),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      q.matiere!,
                      style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: AppColors.darkTerracotta),
                    ),
                  ),
                const SizedBox(height: 12),
                Text(
                  q.questionText,
                  style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w700, height: 1.5),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          ...['A', 'B', 'C', 'D'].map((l) => _buildOption(l, q.getOption(l), q)),
          if (_answered && q.explication != null && q.explication!.isNotEmpty) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFBFDBFE)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('💡  Explication',
                      style: TextStyle(
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF1E40AF))),
                  const SizedBox(height: 6),
                  Text(q.explication ?? '', style: const TextStyle(height: 1.5)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildOption(String letter, String text, Question q) {
    final isSelected = _selectedAnswer == letter;
    final isCorrect = q.bonneReponse.toUpperCase() == letter;
    Color borderColor = const Color(0xFFE5E7EB);
    Color bgColor = Colors.white;
    Color textColor = const Color(0xFF374151);
    if (_answered) {
      if (isCorrect) {
        borderColor = const Color(0xFFF59E0B);
        bgColor = const Color(0xFFFEF3C7);
        textColor = const Color(0xFF78350F);
      } else if (isSelected && !isCorrect) {
        borderColor = const Color(0xFFEF4444);
        bgColor = const Color(0xFFFEE2E2);
        textColor = const Color(0xFF7F1D1D);
      }
    } else if (isSelected) {
      borderColor = const Color(0xFFF59E0B);
      bgColor = const Color(0xFFFFFBEB);
    }
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: _answered ? null : () => _selectAnswer(letter),
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: borderColor, width: 2),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: borderColor,
                  borderRadius: BorderRadius.circular(10),
                ),
                alignment: Alignment.center,
                child: Text(
                  letter,
                  style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 14),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  text,
                  style: TextStyle(
                    fontSize: 14,
                    color: textColor,
                    fontWeight: FontWeight.w600,
                    height: 1.5,
                  ),
                ),
              ),
              if (_answered && isCorrect)
                const Icon(Icons.check_circle, color: Color(0xFFF59E0B)),
              if (_answered && isSelected && !isCorrect)
                const Icon(Icons.cancel, color: Color(0xFFEF4444)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavigationBar() {
    final isLast = _currentIndex >= _questions.length - 1;
    return Container(
      padding: EdgeInsets.fromLTRB(
          16, 12, 16, MediaQuery.of(context).padding.bottom + 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: _currentIndex > 0 ? _previousQuestion : null,
              icon: const Icon(Icons.arrow_back),
              label: const Text('Précédente'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: ElevatedButton.icon(
              onPressed: _answered ? _nextQuestion : null,
              icon: Icon(isLast ? Icons.flag : Icons.arrow_forward),
              label: Text(isLast ? 'Terminer' : 'Suivante'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
