// lib/screens/demo/demo_quiz_screen.dart
// Écran de démonstration avec QCM défilants
// Question → options → validation → résultat + explication → question suivante

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../models/demo_question_model.dart';
import '../../services/question_service.dart';

class DemoQuizScreen extends StatefulWidget {
  final bool isStandalone; // true si accessible sans connexion

  const DemoQuizScreen({super.key, this.isStandalone = false});

  @override
  State<DemoQuizScreen> createState() => _DemoQuizScreenState();
}

class _DemoQuizScreenState extends State<DemoQuizScreen>
    with SingleTickerProviderStateMixin {
  List<DemoQuestionModel> _questions = [];
  int _currentIndex = 0;
  String? _selectedOption;
  bool _answered = false;
  bool _isLoading = true;
  int _score = 0;
  bool _finished = false;

  late AnimationController _animCtrl;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );
    _fadeAnim = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _animCtrl, curve: Curves.easeIn),
    );
    _loadQuestions();
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadQuestions() async {
    final service = context.read<QuestionService>();
    final qs = await service.loadDemoQuestions();
    setState(() {
      _questions = qs;
      _isLoading = false;
    });
    _animCtrl.forward();
  }

  void _selectOption(String option) {
    if (_answered) return;
    setState(() {
      _selectedOption = option;
    });
  }

  void _validateAnswer() {
    if (_selectedOption == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Veuillez choisir une réponse'),
          duration: Duration(seconds: 1),
        ),
      );
      return;
    }
    final correct = _questions[_currentIndex].isCorrect(_selectedOption!);
    setState(() {
      _answered = true;
      if (correct) _score++;
    });
  }

  void _nextQuestion() {
    if (_currentIndex >= _questions.length - 1) {
      setState(() => _finished = true);
      return;
    }
    _animCtrl.reset();
    setState(() {
      _currentIndex++;
      _selectedOption = null;
      _answered = false;
    });
    _animCtrl.forward();
  }

  void _restart() {
    _animCtrl.reset();
    setState(() {
      _currentIndex = 0;
      _selectedOption = null;
      _answered = false;
      _score = 0;
      _finished = false;
    });
    _animCtrl.forward();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: AppTheme.backgroundColor,
        appBar: AppBar(
          backgroundColor: const Color(0xFFFF8C00),
          title: const Text('Démo Gratuite'),
          leading: widget.isStandalone
              ? IconButton(
                  icon: const Icon(Icons.arrow_back),
                  onPressed: () => Navigator.pop(context),
                )
              : null,
        ),
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: Color(0xFFFF8C00)),
              SizedBox(height: 16),
              Text('Chargement des questions...', style: TextStyle(color: AppTheme.textSecondary)),
            ],
          ),
        ),
      );
    }

    if (_questions.isEmpty) {
      return _buildEmpty();
    }

    if (_finished) {
      return _buildResult();
    }

    final question = _questions[_currentIndex];

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: const Color(0xFFFF8C00),
        title: const Text('Démo Gratuite IFL'),
        leading: widget.isStandalone
            ? IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              )
            : null,
        actions: [
          Center(
            child: Container(
              margin: const EdgeInsets.only(right: 16),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.25),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '$_score / ${_currentIndex + (_answered ? 1 : 0)}',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                ),
              ),
            ),
          ),
        ],
      ),
      body: FadeTransition(
        opacity: _fadeAnim,
        child: Column(
          children: [
            // Barre de progression
            _buildProgressBar(),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Numéro de question
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFF8C00).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            'Question ${_currentIndex + 1} / ${_questions.length}',
                            style: const TextStyle(
                              color: Color(0xFFFF8C00),
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Énoncé
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.06),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Text(
                        question.enonce,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary,
                          height: 1.5,
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Options de réponse
                    ...['A', 'B', 'C', 'D'].map(
                      (letter) => _buildOptionCard(
                        letter: letter,
                        text: question.getOption(letter),
                        correcte: question.reponseCorrecte,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Explication (après réponse)
                    if (_answered && question.explication.isNotEmpty)
                      _buildExplication(question.explication),

                    const SizedBox(height: 20),

                    // Boutons
                    if (!_answered)
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFFF8C00),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          onPressed: _validateAnswer,
                          child: const Text(
                            'VALIDER MA RÉPONSE',
                            style: TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ),
                      )
                    else
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryColor,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          onPressed: _nextQuestion,
                          child: Text(
                            _currentIndex >= _questions.length - 1
                                ? 'VOIR MES RÉSULTATS'
                                : 'QUESTION SUIVANTE →',
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ),
                      ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressBar() {
    final progress = (_currentIndex + 1) / _questions.length;
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Progression',
                style: TextStyle(
                  fontSize: 12,
                  color: AppTheme.textSecondary.withValues(alpha: 0.8),
                ),
              ),
              Text(
                '${(_currentIndex + 1)} / ${_questions.length}',
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFFFF8C00),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 8,
              backgroundColor: AppTheme.dividerColor,
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFFF8C00)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOptionCard({
    required String letter,
    required String text,
    required String correcte,
  }) {
    Color cardColor = Colors.white;
    Color borderColor = AppTheme.dividerColor;
    Color textColor = AppTheme.textPrimary;
    Widget? trailingIcon;

    if (_answered) {
      final isCorrect = letter == correcte.toUpperCase();
      final isSelected = letter == _selectedOption?.toUpperCase();

      if (isCorrect) {
        cardColor = const Color(0xFFECFDF5);
        borderColor = const Color(0xFF10B981);
        textColor = const Color(0xFF065F46);
        trailingIcon = const Icon(Icons.check_circle_rounded,
            color: Color(0xFF10B981), size: 22);
      } else if (isSelected && !isCorrect) {
        cardColor = const Color(0xFFFEF2F2);
        borderColor = AppTheme.errorColor;
        textColor = AppTheme.errorColor;
        trailingIcon = const Icon(Icons.cancel_rounded,
            color: AppTheme.errorColor, size: 22);
      }
    } else {
      final isSelected = letter == _selectedOption;
      if (isSelected) {
        cardColor = AppTheme.primaryColor.withValues(alpha: 0.06);
        borderColor = AppTheme.primaryColor;
        textColor = AppTheme.primaryColor;
      }
    }

    return GestureDetector(
      onTap: () => _selectOption(letter),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor, width: 1.5),
        ),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: borderColor.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  letter,
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    color: borderColor == AppTheme.dividerColor
                        ? AppTheme.textSecondary
                        : borderColor,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                text,
                style: TextStyle(
                  fontSize: 14,
                  color: textColor,
                  fontWeight: FontWeight.w500,
                  height: 1.4,
                ),
              ),
            ),
            if (trailingIcon != null) ...[
              const SizedBox(width: 8),
              trailingIcon,
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildExplication(String explication) {
    final isCorrect = _selectedOption == _questions[_currentIndex].reponseCorrecte;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isCorrect
            ? const Color(0xFFECFDF5)
            : const Color(0xFFFFF7ED),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isCorrect
              ? const Color(0xFF10B981)
              : const Color(0xFFFF8C00),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isCorrect ? Icons.check_circle_rounded : Icons.lightbulb_rounded,
                color: isCorrect
                    ? const Color(0xFF10B981)
                    : const Color(0xFFFF8C00),
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                isCorrect ? 'Bonne réponse !' : 'Explication',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: isCorrect
                      ? const Color(0xFF065F46)
                      : const Color(0xFF92400E),
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            explication,
            style: TextStyle(
              color: isCorrect
                  ? const Color(0xFF065F46)
                  : const Color(0xFF92400E),
              fontSize: 13,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResult() {
    final total = _questions.length;
    final pct = total > 0 ? (_score / total * 100).round() : 0;
    Color resultColor;
    String resultEmoji;
    String resultMsg;

    if (pct >= 80) {
      resultColor = const Color(0xFF10B981);
      resultEmoji = '🏆';
      resultMsg = 'Excellent ! Vous êtes prêt !';
    } else if (pct >= 60) {
      resultColor = const Color(0xFF3B82F6);
      resultEmoji = '👍';
      resultMsg = 'Bien ! Continuez vos révisions';
    } else if (pct >= 40) {
      resultColor = const Color(0xFFFF8C00);
      resultEmoji = '📚';
      resultMsg = 'Courage ! La pratique fait la perfection';
    } else {
      resultColor = AppTheme.errorColor;
      resultEmoji = '💪';
      resultMsg = 'Ne baissez pas les bras, pratiquez davantage !';
    }

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: const Color(0xFFFF8C00),
        title: const Text('Résultats de la Démo'),
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const SizedBox(height: 20),
            // Score
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: resultColor.withValues(alpha: 0.15),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Text(resultEmoji, style: const TextStyle(fontSize: 56)),
                  const SizedBox(height: 12),
                  Text(
                    '$_score / $total',
                    style: TextStyle(
                      fontSize: 48,
                      fontWeight: FontWeight.w900,
                      color: resultColor,
                    ),
                  ),
                  Text(
                    '$pct% de réussite',
                    style: TextStyle(
                      fontSize: 16,
                      color: resultColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    resultMsg,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Call to action - S'inscrire
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primaryColor, Color(0xFF2563EB)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  const Text(
                    '🚀 Prêt à aller plus loin ?',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Inscrivez-vous pour accéder à des centaines de QCM par concours',
                    style: TextStyle(color: Colors.white70, fontSize: 13),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppTheme.primaryColor,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text(
                        'S\'INSCRIRE MAINTENANT',
                        style: TextStyle(fontWeight: FontWeight.w800),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Recommencer
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFFFF8C00),
                  side: const BorderSide(color: Color(0xFFFF8C00)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                onPressed: _restart,
                icon: const Icon(Icons.replay_rounded),
                label: const Text('Recommencer la démo'),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: const Color(0xFFFF8C00),
        title: const Text('Démo Gratuite'),
        leading: widget.isStandalone
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => Navigator.pop(context),
              )
            : null,
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.quiz_outlined, size: 64, color: AppTheme.textSecondary),
            SizedBox(height: 16),
            Text(
              'Questions en cours de chargement...',
              style: TextStyle(color: AppTheme.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}
