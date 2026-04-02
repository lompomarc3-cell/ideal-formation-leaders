// lib/screens/quiz/quiz_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../models/question_model.dart';
import '../../services/question_service.dart';

// =============================================================================
// ÉCRAN LISTE DES QUESTIONS (entrée dans une sous-catégorie)
// =============================================================================
class QuizListScreen extends StatefulWidget {
  final String sousCategorieId;
  final String sousCategorieNom;
  final Color color;

  const QuizListScreen({
    super.key,
    required this.sousCategorieId,
    required this.sousCategorieNom,
    required this.color,
  });

  @override
  State<QuizListScreen> createState() => _QuizListScreenState();
}

class _QuizListScreenState extends State<QuizListScreen> {
  List<QuestionModel> _questions = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadQuestions());
  }

  Future<void> _loadQuestions() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final qs = await context
          .read<QuestionService>()
          .getQuestionsBySousCategorie(widget.sousCategorieId);
      setState(() {
        _questions = qs;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Erreur lors du chargement';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: widget.color,
        title: Text(widget.sousCategorieNom,
            style: const TextStyle(fontSize: 16)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildError()
              : _questions.isEmpty
                  ? _buildEmpty()
                  : _buildContent(),
    );
  }

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error, size: 48, color: AppTheme.errorColor),
          const SizedBox(height: 12),
          Text(_error!, style: const TextStyle(color: AppTheme.textSecondary)),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loadQuestions,
            child: const Text('Réessayer'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.quiz_rounded,
              size: 64, color: widget.color.withValues(alpha: 0.3)),
          const SizedBox(height: 16),
          const Text(
            'Aucune question disponible',
            style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary),
          ),
          const SizedBox(height: 8),
          const Text(
            'L\'administrateur n\'a pas encore\npublié de questions ici',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Info card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: widget.color,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.sousCategorieNom,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '${_questions.length} question${_questions.length > 1 ? 's' : ''} disponible${_questions.length > 1 ? 's' : ''}',
                  style: const TextStyle(
                    fontSize: 14,
                    color: Colors.white70,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Bouton démarrer QCM
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: widget.color,
                foregroundColor: Colors.white,
              ),
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => QuizExamScreen(
                    questions: _questions,
                    sousCategorieNom: widget.sousCategorieNom,
                    color: widget.color,
                  ),
                ),
              ),
              icon: const Icon(Icons.play_arrow_rounded),
              label: const Text('DÉMARRER LE QCM'),
            ),
          ),
          const SizedBox(height: 20),

          // Liste des questions (aperçu)
          const Text(
            'Questions disponibles',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          ...List.generate(_questions.length, (i) {
            final q = _questions[i];
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                    color: AppTheme.dividerColor.withValues(alpha: 0.5)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: widget.color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Center(
                      child: Text(
                        '${i + 1}',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: widget.color,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      q.enonce,
                      style: const TextStyle(
                          fontSize: 14, color: AppTheme.textPrimary),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

// =============================================================================
// ÉCRAN QCM - DÉROULEMENT
// =============================================================================
class QuizExamScreen extends StatefulWidget {
  final List<QuestionModel> questions;
  final String sousCategorieNom;
  final Color color;

  const QuizExamScreen({
    super.key,
    required this.questions,
    required this.sousCategorieNom,
    required this.color,
  });

  @override
  State<QuizExamScreen> createState() => _QuizExamScreenState();
}

class _QuizExamScreenState extends State<QuizExamScreen>
    with SingleTickerProviderStateMixin {
  int _currentIndex = 0;
  String? _selectedOptionId;
  bool _answered = false;
  bool _isCorrect = false;
  int _score = 0;
  bool _showExplication = false; // ignore: unused_field
  late AnimationController _animController;
  late Animation<double> _fadeAnimation;

  QuestionModel get _currentQuestion => widget.questions[_currentIndex];

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _fadeAnimation =
        CurvedAnimation(parent: _animController, curve: Curves.easeIn);
    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  void _selectOption(String optionId, bool isCorrect) {
    if (_answered) return;
    setState(() {
      _selectedOptionId = optionId;
      _answered = true;
      _isCorrect = isCorrect;
      if (isCorrect) _score++;
      _showExplication = true;
    });
  }

  void _nextQuestion() {
    if (_currentIndex < widget.questions.length - 1) {
      setState(() {
        _currentIndex++;
        _selectedOptionId = null;
        _answered = false;
        _isCorrect = false;
        _showExplication = false;
      });
      _animController.reset();
      _animController.forward();
    } else {
      _showResults();
    }
  }

  void _skipQuestion() {
    if (_answered) return;
    _nextQuestion();
  }

  void _showResults() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => QuizResultScreen(
          questions: widget.questions,
          score: _score,
          total: widget.questions.length,
          sousCategorieNom: widget.sousCategorieNom,
          color: widget.color,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final q = _currentQuestion;
    final progress = (_currentIndex + 1) / widget.questions.length;

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: widget.color,
        title: Text(
          'Q.${_currentIndex + 1}/${widget.questions.length}',
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Text(
                'Score: $_score',
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                ),
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Barre de progression
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: LinearProgressIndicator(
                    value: progress,
                    backgroundColor: widget.color.withValues(alpha: 0.15),
                    valueColor: AlwaysStoppedAnimation(widget.color),
                    minHeight: 8,
                  ),
                ),
                const SizedBox(height: 20),

                // Énoncé de la question
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: widget.color.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'Question ${_currentIndex + 1}',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: widget.color,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        q.enonce,
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
                const SizedBox(height: 16),

                // Options de réponse
                const Text(
                  'Choisissez la bonne réponse :',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.textSecondary,
                  ),
                ),
                const SizedBox(height: 10),
                ...q.options.map((option) {
                  final isSelected = _selectedOptionId == option.id;
                  final showResult = _answered && isSelected;
                  Color? bgColor;
                  Color? borderColor;
                  Color? textColor;
                  Widget? trailingIcon;

                  if (showResult) {
                    if (_isCorrect) {
                      bgColor = AppTheme.accentColor.withValues(alpha: 0.12);
                      borderColor = AppTheme.accentColor;
                      textColor = AppTheme.accentColor;
                      trailingIcon = const Icon(Icons.check_circle,
                          color: AppTheme.accentColor);
                    } else {
                      bgColor = AppTheme.errorColor.withValues(alpha: 0.1);
                      borderColor = AppTheme.errorColor;
                      textColor = AppTheme.errorColor;
                      trailingIcon = const Icon(Icons.cancel,
                          color: AppTheme.errorColor);
                    }
                  } else if (_answered && option.isCorrect) {
                    // Montrer la bonne réponse après erreur
                    bgColor = AppTheme.accentColor.withValues(alpha: 0.08);
                    borderColor = AppTheme.accentColor;
                    textColor = AppTheme.accentColor;
                    trailingIcon =
                        const Icon(Icons.check_circle_outline,
                            color: AppTheme.accentColor);
                  }

                  return GestureDetector(
                    onTap: () => _selectOption(option.id, option.isCorrect),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: bgColor ?? Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: borderColor ?? AppTheme.dividerColor,
                          width: borderColor != null ? 2 : 1,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              option.texte,
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w500,
                                color: textColor ?? AppTheme.textPrimary,
                              ),
                            ),
                          ),
                          if (trailingIcon != null) trailingIcon,
                        ],
                      ),
                    ),
                  );
                }),
                const SizedBox(height: 16),

                // Résultat + Explication
                if (_answered) ...[
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: _isCorrect
                          ? AppTheme.accentColor.withValues(alpha: 0.08)
                          : AppTheme.errorColor.withValues(alpha: 0.07),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: _isCorrect
                            ? AppTheme.accentColor
                            : AppTheme.errorColor,
                        width: 1.5,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              _isCorrect
                                  ? Icons.check_circle
                                  : Icons.cancel,
                              color: _isCorrect
                                  ? AppTheme.accentColor
                                  : AppTheme.errorColor,
                              size: 22,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              _isCorrect ? 'Bonne réponse !' : 'Mauvaise réponse',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: _isCorrect
                                    ? AppTheme.accentColor
                                    : AppTheme.errorColor,
                              ),
                            ),
                          ],
                        ),
                        if (q.explication.isNotEmpty) ...[
                          const SizedBox(height: 12),
                          const Text(
                            'Explication :',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            q.explication,
                            style: const TextStyle(
                              fontSize: 14,
                              color: AppTheme.textPrimary,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Boutons action
                Row(
                  children: [
                    if (!_answered)
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _skipQuestion,
                          icon: const Icon(Icons.skip_next),
                          label: const Text('Passer'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppTheme.textSecondary,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                        ),
                      ),
                    if (!_answered) const SizedBox(width: 12),
                    Expanded(
                      flex: _answered ? 1 : 2,
                      child: ElevatedButton.icon(
                        onPressed: _answered ? _nextQuestion : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: widget.color,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        icon: Icon(
                          _currentIndex < widget.questions.length - 1
                              ? Icons.arrow_forward
                              : Icons.flag_rounded,
                        ),
                        label: Text(
                          _currentIndex < widget.questions.length - 1
                              ? 'Question suivante'
                              : 'Voir les résultats',
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// =============================================================================
// ÉCRAN RÉSULTATS
// =============================================================================
class QuizResultScreen extends StatelessWidget {
  final List<QuestionModel> questions;
  final int score;
  final int total;
  final String sousCategorieNom;
  final Color color;

  const QuizResultScreen({
    super.key,
    required this.questions,
    required this.score,
    required this.total,
    required this.sousCategorieNom,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final percentage = total > 0 ? (score / total * 100).round() : 0;
    final isSuccess = percentage >= 50;

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: color,
        title: const Text('Résultats'),
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              const SizedBox(height: 8),
              // Score card principal
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(28),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isSuccess
                        ? [AppTheme.accentColor, const Color(0xFF16A34A)]
                        : [AppTheme.errorColor, const Color(0xFFB91C1C)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Column(
                  children: [
                    Icon(
                      isSuccess
                          ? Icons.emoji_events_rounded
                          : Icons.sentiment_dissatisfied_rounded,
                      size: 64,
                      color: Colors.white,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      isSuccess ? 'Bravo !' : 'Continuez vos efforts !',
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '$percentage%',
                      style: const TextStyle(
                        fontSize: 56,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      '$score / $total bonnes réponses',
                      style: const TextStyle(
                        fontSize: 16,
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Boutons
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: color,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  onPressed: () {
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute(
                        builder: (_) => QuizExamScreen(
                          questions: questions,
                          sousCategorieNom: sousCategorieNom,
                          color: color,
                        ),
                      ),
                    );
                  },
                  icon: const Icon(Icons.refresh),
                  label: const Text('RECOMMENCER'),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: color,
                    side: BorderSide(color: color),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.arrow_back),
                  label: const Text('RETOUR AUX DOSSIERS'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
