// lib/screens/quiz/quiz_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../models/question_model.dart';
import '../../services/question_service.dart';

class QuizListScreen extends StatefulWidget {
  final String categorieId;
  final String categorieNom;
  final Color color;

  const QuizListScreen({
    super.key,
    required this.categorieId,
    required this.categorieNom,
    required this.color,
  });

  @override
  State<QuizListScreen> createState() => _QuizListScreenState();
}

class _QuizListScreenState extends State<QuizListScreen> {
  List<QuestionModel> _questions = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadQuestions();
  }

  Future<void> _loadQuestions() async {
    final service = context.read<QuestionService>();
    final qs = await service.loadByCategorie(widget.categorieId);
    setState(() {
      _questions = qs;
      _loading = false;
      _error = service.error;
    });
  }

  void _startQuiz() {
    if (_questions.isEmpty) return;
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => QuizPlayScreen(
          questions: _questions,
          categorieNom: widget.categorieNom,
          color: widget.color,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: widget.color,
        title: Text(
          widget.categorieNom,
          style: const TextStyle(fontSize: 15),
          overflow: TextOverflow.ellipsis,
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _questions.isEmpty
              ? _buildEmpty()
              : _buildContent(),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.quiz_outlined, size: 64,
                color: widget.color.withValues(alpha: 0.4)),
            const SizedBox(height: 16),
            const Text(
              'Aucune question disponible',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Les questions seront bientôt ajoutées par l\'administrateur',
              style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Info dossier
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [widget.color, widget.color.withValues(alpha: 0.7)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.categorieNom,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '${_questions.length} questions disponibles',
                  style: const TextStyle(color: Colors.white70, fontSize: 14),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          const Text(
            'Prêt à vous entraîner ?',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Toutes les questions sont accompagnées d\'explications détaillées.',
            style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
          ),
          const SizedBox(height: 24),

          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: widget.color,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              onPressed: _startQuiz,
              icon: const Icon(Icons.play_arrow_rounded),
              label: const Text(
                'COMMENCER LE QUIZ',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Écran de quiz interactif
class QuizPlayScreen extends StatefulWidget {
  final List<QuestionModel> questions;
  final String categorieNom;
  final Color color;

  const QuizPlayScreen({
    super.key,
    required this.questions,
    required this.categorieNom,
    required this.color,
  });

  @override
  State<QuizPlayScreen> createState() => _QuizPlayScreenState();
}

class _QuizPlayScreenState extends State<QuizPlayScreen>
    with SingleTickerProviderStateMixin {
  int _current = 0;
  String? _selected;
  bool _answered = false;
  int _score = 0;
  bool _finished = false;

  late AnimationController _animCtrl;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
        duration: const Duration(milliseconds: 300), vsync: this);
    _fadeAnim = Tween<double>(begin: 0, end: 1).animate(_animCtrl);
    _animCtrl.forward();
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  void _validate() {
    if (_selected == null) return;
    final correct = widget.questions[_current].isCorrect(_selected!);
    setState(() {
      _answered = true;
      if (correct) _score++;
    });
  }

  void _next() {
    if (_current >= widget.questions.length - 1) {
      setState(() => _finished = true);
      return;
    }
    _animCtrl.reset();
    setState(() {
      _current++;
      _selected = null;
      _answered = false;
    });
    _animCtrl.forward();
  }

  void _restart() {
    _animCtrl.reset();
    setState(() {
      _current = 0;
      _selected = null;
      _answered = false;
      _score = 0;
      _finished = false;
    });
    _animCtrl.forward();
  }

  @override
  Widget build(BuildContext context) {
    if (_finished) return _buildResult();

    final q = widget.questions[_current];

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: widget.color,
        title: Text(
          widget.categorieNom,
          style: const TextStyle(fontSize: 14),
          overflow: TextOverflow.ellipsis,
        ),
        actions: [
          Center(
            child: Container(
              margin: const EdgeInsets.only(right: 12),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                '$_score pts',
                style: const TextStyle(
                    color: Colors.white, fontWeight: FontWeight.w700),
              ),
            ),
          ),
        ],
      ),
      body: FadeTransition(
        opacity: _fadeAnim,
        child: Column(
          children: [
            // Progress
            LinearProgressIndicator(
              value: (_current + 1) / widget.questions.length,
              minHeight: 6,
              backgroundColor: widget.color.withValues(alpha: 0.2),
              valueColor: AlwaysStoppedAnimation<Color>(widget.color),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Question ${_current + 1}/${widget.questions.length}',
                      style: TextStyle(
                        color: widget.color,
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 10,
                          ),
                        ],
                      ),
                      child: Text(
                        q.enonce,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          height: 1.5,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    ...['A', 'B', 'C', 'D'].map((l) => _buildOption(l, q)),
                    if (_answered && q.explication.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      _buildExplication(q.explication, q),
                    ],
                    const SizedBox(height: 20),
                    if (!_answered)
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: widget.color,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          onPressed: _selected != null ? _validate : null,
                          child: const Text('VALIDER'),
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
                          onPressed: _next,
                          child: Text(
                            _current >= widget.questions.length - 1
                                ? 'VOIR RÉSULTATS'
                                : 'SUIVANT →',
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOption(String letter, QuestionModel q) {
    final isSelected = letter == _selected;
    final isCorrect = letter == q.reponseCorrecte.toUpperCase();
    final isWrong = _answered && isSelected && !isCorrect;

    Color borderColor = AppTheme.dividerColor;
    Color bgColor = Colors.white;
    if (_answered) {
      if (isCorrect) {
        borderColor = const Color(0xFF10B981);
        bgColor = const Color(0xFFECFDF5);
      } else if (isWrong) {
        borderColor = AppTheme.errorColor;
        bgColor = const Color(0xFFFEF2F2);
      }
    } else if (isSelected) {
      borderColor = widget.color;
      bgColor = widget.color.withValues(alpha: 0.06);
    }

    return GestureDetector(
      onTap: _answered ? null : () => setState(() => _selected = letter),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor, width: 1.5),
        ),
        child: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: borderColor.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  letter,
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    color: _answered
                        ? (isCorrect
                            ? const Color(0xFF065F46)
                            : isWrong
                                ? AppTheme.errorColor
                                : AppTheme.textSecondary)
                        : (isSelected ? widget.color : AppTheme.textSecondary),
                    fontSize: 13,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                q.getOption(letter),
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: _answered && isCorrect
                      ? const Color(0xFF065F46)
                      : AppTheme.textPrimary,
                ),
              ),
            ),
            if (_answered)
              Icon(
                isCorrect
                    ? Icons.check_circle_rounded
                    : isWrong
                        ? Icons.cancel_rounded
                        : null,
                color: isCorrect
                    ? const Color(0xFF10B981)
                    : AppTheme.errorColor,
                size: 20,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildExplication(String explication, QuestionModel q) {
    final correct = q.isCorrect(_selected!);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: correct
            ? const Color(0xFFECFDF5)
            : const Color(0xFFFFF7ED),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: correct
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
                correct ? Icons.check_circle_rounded : Icons.lightbulb_rounded,
                color: correct
                    ? const Color(0xFF10B981)
                    : const Color(0xFFFF8C00),
                size: 18,
              ),
              const SizedBox(width: 8),
              Text(
                correct ? 'Correct !' : 'Réponse correcte : ${q.reponseCorrecte}',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: correct ? const Color(0xFF065F46) : const Color(0xFF92400E),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            explication,
            style: TextStyle(
              fontSize: 13,
              color: correct ? const Color(0xFF065F46) : const Color(0xFF92400E),
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResult() {
    final total = widget.questions.length;
    final pct = total > 0 ? (_score / total * 100).round() : 0;
    Color color = pct >= 70 ? const Color(0xFF10B981) : pct >= 50 ? const Color(0xFFFF8C00) : AppTheme.errorColor;

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: widget.color,
        title: const Text('Résultats'),
        automaticallyImplyLeading: false,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(pct >= 70 ? '🎉' : pct >= 50 ? '👍' : '📚',
                  style: const TextStyle(fontSize: 64)),
              const SizedBox(height: 16),
              Text(
                '$_score / $total',
                style: TextStyle(
                  fontSize: 48,
                  fontWeight: FontWeight.w900,
                  color: color,
                ),
              ),
              Text('$pct% de réussite',
                  style: TextStyle(fontSize: 16, color: color, fontWeight: FontWeight.w600)),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: widget.color,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  onPressed: _restart,
                  child: const Text('RECOMMENCER'),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('RETOUR'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
