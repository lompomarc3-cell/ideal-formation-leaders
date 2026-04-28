import 'package:flutter/material.dart';
import '../models/qcm.dart';
import '../services/supabase_service.dart';
import '../theme/app_theme.dart';

class DemoQuizScreen extends StatefulWidget {
  const DemoQuizScreen({super.key});

  @override
  State<DemoQuizScreen> createState() => _DemoQuizScreenState();
}

class _DemoQuizScreenState extends State<DemoQuizScreen> {
  List<QcmQuestion> _questions = [];
  bool _loading = true;
  int _currentIndex = 0;
  int? _selectedIndex;
  bool _showResult = false;
  int _score = 0;
  bool _finished = false;

  @override
  void initState() {
    super.initState();
    _loadQuestions();
  }

  Future<void> _loadQuestions() async {
    try {
      final res = await SupabaseConfig.client
          .from('questions')
          .select()
          .eq('is_demo', true)
          .limit(10);
      if (res.isNotEmpty) {
        _questions = res
            .map((e) => QcmQuestion.fromSupabase(Map<String, dynamic>.from(e)))
            .toList();
      } else {
        _questions = DemoQuestions.questions;
      }
    } catch (_) {
      _questions = DemoQuestions.questions;
    }
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Démo gratuite')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_finished) {
      return _buildFinishedScreen();
    }

    final q = _questions[_currentIndex];
    final progress = (_currentIndex + 1) / _questions.length;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: AppColors.secondary,
        foregroundColor: Colors.black87,
        title: const Text('Démo gratuite'),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              color: AppColors.secondary.withValues(alpha: 0.15),
              child: Column(
                children: [
                  Row(
                    children: [
                      Text(
                        'Question ${_currentIndex + 1}/${_questions.length}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.success,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'Score : $_score',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: progress,
                      minHeight: 6,
                      backgroundColor: Colors.white,
                      valueColor:
                          const AlwaysStoppedAnimation(AppColors.secondary),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.divider),
                      ),
                      child: Text(
                        q.question,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          height: 1.5,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    ...List.generate(q.options.length, (i) {
                      final selected = _selectedIndex == i;
                      final isCorrect =
                          _showResult && i == q.correctIndex;
                      final isWrong = _showResult &&
                          selected &&
                          i != q.correctIndex;

                      Color bg = Colors.white;
                      Color border = AppColors.divider;
                      if (isCorrect) {
                        bg = AppColors.success.withValues(alpha: 0.12);
                        border = AppColors.success;
                      } else if (isWrong) {
                        bg = AppColors.error.withValues(alpha: 0.12);
                        border = AppColors.error;
                      } else if (selected) {
                        bg = AppColors.secondary.withValues(alpha: 0.15);
                        border = AppColors.secondary;
                      }

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: _showResult
                              ? null
                              : () =>
                                  setState(() => _selectedIndex = i),
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: bg,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: border, width: 1.5),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 28,
                                  height: 28,
                                  decoration: BoxDecoration(
                                    color: selected || isCorrect
                                        ? border
                                        : AppColors.divider,
                                    shape: BoxShape.circle,
                                  ),
                                  child: Center(
                                    child: Text(
                                      String.fromCharCode(65 + i),
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w700,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(q.options[i],
                                      style:
                                          const TextStyle(fontSize: 14)),
                                ),
                                if (isCorrect)
                                  const Icon(Icons.check_circle_rounded,
                                      color: AppColors.success),
                                if (isWrong)
                                  const Icon(Icons.cancel_rounded,
                                      color: AppColors.error),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),
                    if (_showResult && q.explanation != null) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.info.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                              color: AppColors.info.withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.lightbulb_rounded,
                                color: AppColors.info, size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                q.explanation!,
                                style: const TextStyle(
                                    fontSize: 12, height: 1.5),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 18),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _selectedIndex == null
                            ? null
                            : () {
                                if (!_showResult) {
                                  setState(() {
                                    _showResult = true;
                                    if (_selectedIndex == q.correctIndex) {
                                      _score += 1;
                                    }
                                  });
                                } else {
                                  if (_currentIndex <
                                      _questions.length - 1) {
                                    setState(() {
                                      _currentIndex++;
                                      _selectedIndex = null;
                                      _showResult = false;
                                    });
                                  } else {
                                    setState(() => _finished = true);
                                  }
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.secondary,
                          foregroundColor: Colors.black87,
                          padding:
                              const EdgeInsets.symmetric(vertical: 14),
                        ),
                        child: Text(
                          _showResult
                              ? (_currentIndex < _questions.length - 1
                                  ? 'Question suivante'
                                  : 'Voir le résultat')
                              : 'Valider',
                          style: const TextStyle(fontSize: 15),
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

  Widget _buildFinishedScreen() {
    final pct = (_score / _questions.length * 100).round();
    String message;
    if (pct >= 80) {
      message = 'Excellent ! Vous êtes prêt à exceller.';
    } else if (pct >= 50) {
      message = 'Bon score ! Continuez à vous entraîner.';
    } else {
      message = 'Pas de panique, l\'entraînement vous fera progresser.';
    }

    return Scaffold(
      appBar: AppBar(
        backgroundColor: AppColors.secondary,
        foregroundColor: Colors.black87,
        title: const Text('Résultat de la démo'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const SizedBox(height: 24),
              Container(
                width: 140,
                height: 140,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const LinearGradient(
                    colors: [AppColors.secondary, Color(0xFFEAB308)],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.secondary.withValues(alpha: 0.4),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    '$pct%',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 36,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Score : $_score / ${_questions.length}',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                message,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.3)),
                ),
                child: const Column(
                  children: [
                    Icon(Icons.workspace_premium_rounded,
                        color: AppColors.primary, size: 28),
                    SizedBox(height: 8),
                    Text(
                      'Envie d\'aller plus loin ?',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Inscrivez-vous et accédez à des milliers de QCM corrigés sur tous les concours.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                          height: 1.5),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.arrow_forward_rounded),
                  label: const Text('Découvrir les dossiers'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    setState(() {
                      _currentIndex = 0;
                      _selectedIndex = null;
                      _showResult = false;
                      _score = 0;
                      _finished = false;
                    });
                  },
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('Recommencer la démo'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
