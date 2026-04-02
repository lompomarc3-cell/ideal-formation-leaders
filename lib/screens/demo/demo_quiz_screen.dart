// lib/screens/demo/demo_quiz_screen.dart
import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/demo_question_model.dart';
import 'demo_result_screen.dart';

class DemoQuizScreen extends StatefulWidget {
  const DemoQuizScreen({super.key});

  @override
  State<DemoQuizScreen> createState() => _DemoQuizScreenState();
}

class _DemoQuizScreenState extends State<DemoQuizScreen>
    with TickerProviderStateMixin {
  final List<DemoQuestion> _questions = demoQuestionsLocales;
  int _currentIndex = 0;
  String? _selectedAnswer;
  bool _isAnswered = false;
  bool _isCorrect = false;
  int _score = 0;
  final List<Map<String, dynamic>> _answers = [];

  late AnimationController _progressController;
  late AnimationController _cardController;
  late Animation<double> _cardAnimation;

  @override
  void initState() {
    super.initState();
    _progressController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _cardController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _cardAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _cardController, curve: Curves.easeInOut),
    );
    _cardController.forward();
    _updateProgress();
  }

  @override
  void dispose() {
    _progressController.dispose();
    _cardController.dispose();
    super.dispose();
  }

  void _updateProgress() {
    final progress = (_currentIndex) / _questions.length;
    _progressController.animateTo(progress);
  }

  DemoQuestion get _currentQuestion => _questions[_currentIndex];

  void _selectAnswer(String answer) {
    if (_isAnswered) return;

    final isCorrect = answer == _currentQuestion.reponseCorrecte;

    setState(() {
      _selectedAnswer = answer;
      _isAnswered = true;
      _isCorrect = isCorrect;
      if (isCorrect) _score++;
    });

    _answers.add({
      'question': _currentQuestion,
      'selected': answer,
      'correct': isCorrect,
    });
  }

  void _nextQuestion() {
    if (_currentIndex < _questions.length - 1) {
      _cardController.reverse().then((_) {
        setState(() {
          _currentIndex++;
          _selectedAnswer = null;
          _isAnswered = false;
          _isCorrect = false;
        });
        _updateProgress();
        _cardController.forward();
      });
    } else {
      // Fin du quiz - aller aux résultats
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => DemoResultScreen(
            score: _score,
            total: _questions.length,
            answers: _answers,
          ),
        ),
      );
    }
  }

  Color _getOptionColor(String option) {
    if (!_isAnswered) {
      return _selectedAnswer == option
          ? AppTheme.primaryColor.withValues(alpha: 0.08)
          : Colors.white;
    }
    if (option == _currentQuestion.reponseCorrecte) {
      return AppTheme.accentColor.withValues(alpha: 0.12);
    }
    if (option == _selectedAnswer && !_isCorrect) {
      return AppTheme.errorColor.withValues(alpha: 0.1);
    }
    return Colors.white;
  }

  Color _getOptionBorderColor(String option) {
    if (!_isAnswered) {
      return _selectedAnswer == option
          ? AppTheme.primaryColor
          : AppTheme.dividerColor;
    }
    if (option == _currentQuestion.reponseCorrecte) {
      return AppTheme.accentColor;
    }
    if (option == _selectedAnswer && !_isCorrect) {
      return AppTheme.errorColor;
    }
    return AppTheme.dividerColor;
  }

  Widget? _getOptionTrailing(String option) {
    if (!_isAnswered) return null;
    if (option == _currentQuestion.reponseCorrecte) {
      return const Icon(Icons.check_circle, color: AppTheme.accentColor, size: 22);
    }
    if (option == _selectedAnswer && !_isCorrect) {
      return const Icon(Icons.cancel, color: AppTheme.errorColor, size: 22);
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: Text(
          'Question ${_currentIndex + 1}/${_questions.length}',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => _showExitDialog(),
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              'Score: $_score',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Barre de progression
          AnimatedBuilder(
            animation: _progressController,
            builder: (context, _) {
              return LinearProgressIndicator(
                value: (_currentIndex + (_isAnswered ? 1 : 0)) / _questions.length,
                backgroundColor: AppTheme.dividerColor,
                valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.secondaryColor),
                minHeight: 4,
              );
            },
          ),

          Expanded(
            child: FadeTransition(
              opacity: _cardAnimation,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 8),

                    // Badge catégorie
                    _buildCategoryBadge(_currentQuestion.categorie),
                    const SizedBox(height: 14),

                    // Question
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
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryColor.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              'Q${_currentIndex + 1}',
                              style: const TextStyle(
                                color: AppTheme.primaryColor,
                                fontWeight: FontWeight.w700,
                                fontSize: 13,
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            _currentQuestion.enonce,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.textPrimary,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Titre options
                    const Text(
                      'Choisissez votre réponse :',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 10),

                    // Options A, B, C, D
                    ...['A', 'B', 'C', 'D'].map((letter) {
                      final text = _currentQuestion.getOptionText(letter);
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _buildOptionCard(letter, text),
                      );
                    }),

                    // Explication (après réponse)
                    if (_isAnswered) ...[
                      const SizedBox(height: 8),
                      _buildExplicationCard(),
                    ],

                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ),

          // Bouton suivant (visible après réponse)
          if (_isAnswered)
            Container(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.08),
                    blurRadius: 12,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _nextQuestion,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _currentIndex < _questions.length - 1
                        ? AppTheme.primaryColor
                        : AppTheme.secondaryColor,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        _currentIndex < _questions.length - 1
                            ? 'QUESTION SUIVANTE'
                            : 'VOIR MES RÉSULTATS',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Icon(
                        _currentIndex < _questions.length - 1
                            ? Icons.arrow_forward_rounded
                            : Icons.emoji_events_rounded,
                        size: 20,
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildOptionCard(String letter, String text) {
    return GestureDetector(
      onTap: () => _selectAnswer(letter),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: _getOptionColor(letter),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: _getOptionBorderColor(letter),
            width: _isAnswered && (letter == _currentQuestion.reponseCorrecte ||
                    (letter == _selectedAnswer && !_isCorrect))
                ? 2
                : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 4,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: _isAnswered
                    ? (letter == _currentQuestion.reponseCorrecte
                        ? AppTheme.accentColor
                        : (letter == _selectedAnswer && !_isCorrect
                            ? AppTheme.errorColor
                            : AppTheme.dividerColor))
                    : (_selectedAnswer == letter
                        ? AppTheme.primaryColor
                        : AppTheme.dividerColor),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Center(
                child: Text(
                  letter,
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                    color: _isAnswered
                        ? (letter == _currentQuestion.reponseCorrecte ||
                                (letter == _selectedAnswer && !_isCorrect)
                            ? Colors.white
                            : AppTheme.textSecondary)
                        : (_selectedAnswer == letter
                            ? Colors.white
                            : AppTheme.textSecondary),
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
                  fontWeight: FontWeight.w500,
                  color: _isAnswered && letter == _currentQuestion.reponseCorrecte
                      ? AppTheme.accentColor
                      : AppTheme.textPrimary,
                  height: 1.3,
                ),
              ),
            ),
            if (_getOptionTrailing(letter) != null) ...[
              const SizedBox(width: 8),
              _getOptionTrailing(letter)!,
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildExplicationCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _isCorrect
            ? AppTheme.accentColor.withValues(alpha: 0.08)
            : AppTheme.errorColor.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: _isCorrect
              ? AppTheme.accentColor.withValues(alpha: 0.3)
              : AppTheme.errorColor.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                _isCorrect ? Icons.check_circle : Icons.info_rounded,
                color: _isCorrect ? AppTheme.accentColor : AppTheme.errorColor,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                _isCorrect ? 'Bonne réponse !' : 'Réponse incorrecte',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: _isCorrect ? AppTheme.accentColor : AppTheme.errorColor,
                ),
              ),
            ],
          ),
          if (!_isCorrect) ...[
            const SizedBox(height: 8),
            Text(
              'Bonne réponse : ${_currentQuestion.reponseCorrecte} - ${_currentQuestion.getOptionText(_currentQuestion.reponseCorrecte)}',
              style: const TextStyle(
                fontSize: 13,
                color: AppTheme.accentColor,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
          const SizedBox(height: 8),
          const Divider(height: 1),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(
                Icons.lightbulb_outline,
                color: AppTheme.secondaryColor,
                size: 18,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  _currentQuestion.explication,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppTheme.textSecondary,
                    height: 1.5,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryBadge(String categorie) {
    final Map<String, Map<String, dynamic>> categories = {
      'legislation': {
        'label': 'Législation',
        'color': AppTheme.directColor,
        'icon': Icons.gavel_rounded,
      },
      'marches_publics': {
        'label': 'Marchés Publics',
        'color': AppTheme.professionnelColor,
        'icon': Icons.shopping_cart_rounded,
      },
      'principes': {
        'label': 'Principes',
        'color': AppTheme.accentColor,
        'icon': Icons.balance_rounded,
      },
      'controle': {
        'label': 'Contrôle',
        'color': AppTheme.secondaryColor,
        'icon': Icons.verified_rounded,
      },
      'seuils': {
        'label': 'Seuils',
        'color': const Color(0xFFEF4444),
        'icon': Icons.bar_chart_rounded,
      },
    };

    final cat = categories[categorie] ?? {
      'label': categorie,
      'color': AppTheme.primaryColor,
      'icon': Icons.category_rounded,
    };

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: (cat['color'] as Color).withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: (cat['color'] as Color).withValues(alpha: 0.3),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                cat['icon'] as IconData,
                size: 14,
                color: cat['color'] as Color,
              ),
              const SizedBox(width: 5),
              Text(
                cat['label'] as String,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: cat['color'] as Color,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _showExitDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Quitter la démo ?'),
        content: const Text(
          'Votre progression sera perdue. Voulez-vous vraiment quitter ?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Continuer'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              Navigator.of(context).pop();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.errorColor,
            ),
            child: const Text('Quitter'),
          ),
        ],
      ),
    );
  }
}
