import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/dossier.dart';
import '../models/qcm.dart';
import '../services/auth_service.dart';
import '../services/supabase_service.dart';
import '../theme/app_theme.dart';
import 'payment_screen.dart';

class QcmScreen extends StatefulWidget {
  final Dossier dossier;
  final bool isUnlocked;

  const QcmScreen({
    super.key,
    required this.dossier,
    required this.isUnlocked,
  });

  @override
  State<QcmScreen> createState() => _QcmScreenState();
}

class _QcmScreenState extends State<QcmScreen> {
  List<QcmQuestion> _questions = [];
  bool _loading = true;
  int _currentIndex = 0;
  int? _selectedIndex;
  bool _showResult = false;
  int _score = 0;

  static const int _freeQuestionsCount = 5;

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
          .eq('category_id', widget.dossier.id)
          .eq('is_active', true);
      if (res.isNotEmpty) {
        _questions = res
            .map((e) => QcmQuestion.fromSupabase(Map<String, dynamic>.from(e)))
            .toList();
      } else {
        _questions = _generateFallbackQuestions();
      }
    } catch (_) {
      _questions = _generateFallbackQuestions();
    }
    setState(() => _loading = false);
  }

  /// Questions fallback si la table est vide
  List<QcmQuestion> _generateFallbackQuestions() {
    return List.generate(20, (i) {
      return QcmQuestion(
        id: 'fb_${widget.dossier.id}_$i',
        question:
            'Question ${i + 1} : Quelle est la bonne réponse pour ${widget.dossier.name} ?',
        options: const [
          'Option A',
          'Option B',
          'Option C (correcte)',
          'Option D',
        ],
        correctIndex: 2,
        explanation:
            'Cette question est un exemple. Les vraies questions seront chargées depuis la base.',
        dossierId: widget.dossier.id,
      );
    });
  }

  bool get _isCurrentLocked {
    if (widget.isUnlocked) return false;
    return _currentIndex >= _freeQuestionsCount;
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.dossier.name)),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_questions.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.dossier.name)),
        body: const Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Text(
              'Aucune question disponible pour ce dossier pour le moment.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ),
        ),
      );
    }

    final q = _questions[_currentIndex];

    return Scaffold(
      appBar: AppBar(
        backgroundColor: widget.dossier.color,
        title: Text(widget.dossier.name, style: const TextStyle(fontSize: 16)),
      ),
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            if (_isCurrentLocked) _buildLockedView() else _buildQuestion(q),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    final total = _questions.length;
    final progress = (_currentIndex + 1) / total;
    return Container(
      padding: const EdgeInsets.all(14),
      color: widget.dossier.color.withValues(alpha: 0.08),
      child: Column(
        children: [
          Row(
            children: [
              Text(
                'Question ${_currentIndex + 1}/$total',
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
              const Spacer(),
              if (!widget.isUnlocked)
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.success,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _currentIndex < _freeQuestionsCount
                        ? 'Gratuit (${_freeQuestionsCount - _currentIndex} restantes)'
                        : 'Verrouillé',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              const SizedBox(width: 6),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Score : $_score',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
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
              valueColor: AlwaysStoppedAnimation(widget.dossier.color),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLockedView() {
    return Expanded(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const SizedBox(height: 30),
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: widget.dossier.color.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.lock_rounded,
                size: 50,
                color: widget.dossier.color,
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Contenu verrouillé',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 24),
              child: Text(
                'Vous avez terminé les 5 premières questions gratuites. Débloquez la suite pour accéder à tout le dossier.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textSecondary),
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  final amount =
                      widget.dossier.type == 'direct' ? 5000 : 20000;
                  final pkg = widget.dossier.type == 'direct'
                      ? 'direct_all'
                      : widget.dossier.id;
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => PaymentScreen(
                        offerName: widget.dossier.type == 'direct'
                            ? 'Concours directs (12 dossiers)'
                            : widget.dossier.name,
                        amount: amount,
                        packageId: pkg,
                      ),
                    ),
                  );
                },
                icon: const Icon(Icons.payment_rounded),
                label: Text(widget.dossier.type == 'direct'
                    ? 'Débloquer (5 000 FCFA)'
                    : 'Débloquer (20 000 FCFA)'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: widget.dossier.color,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Retour aux dossiers'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuestion(QcmQuestion q) {
    return Expanded(
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
              final isCorrect = _showResult && i == q.correctIndex;
              final isWrong =
                  _showResult && selected && i != q.correctIndex;

              Color bg = Colors.white;
              Color border = AppColors.divider;
              if (isCorrect) {
                bg = AppColors.success.withValues(alpha: 0.12);
                border = AppColors.success;
              } else if (isWrong) {
                bg = AppColors.error.withValues(alpha: 0.12);
                border = AppColors.error;
              } else if (selected) {
                bg = widget.dossier.color.withValues(alpha: 0.1);
                border = widget.dossier.color;
              }

              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: _showResult
                      ? null
                      : () => setState(() => _selectedIndex = i),
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
                          child: Text(
                            q.options[i],
                            style: const TextStyle(fontSize: 14),
                          ),
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
                  border:
                      Border.all(color: AppColors.info.withValues(alpha: 0.3)),
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
                        style: const TextStyle(fontSize: 12, height: 1.5),
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
                          if (_currentIndex < _questions.length - 1) {
                            setState(() {
                              _currentIndex++;
                              _selectedIndex = null;
                              _showResult = false;
                            });
                          } else {
                            _finishQuiz();
                          }
                        }
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: widget.dossier.color,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: Text(
                  _showResult
                      ? (_currentIndex < _questions.length - 1
                          ? 'Question suivante'
                          : 'Terminer')
                      : 'Valider',
                  style: const TextStyle(fontSize: 15),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _finishQuiz() {
    // Mettre à jour la progression localement
    final auth = context.read<AuthService>();
    final user = auth.currentUser;
    if (user != null) {
      final pct = _score / _questions.length * 100;
      // Update progress (best-effort)
      try {
        final newProgress = Map<String, double>.from(user.progress);
        newProgress[widget.dossier.id] = pct;
        SupabaseConfig.client.from('profiles').update({
          'progress': newProgress,
          'total_score': user.totalScore + _score,
        }).eq('id', user.id);
      } catch (_) {}
    }

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.celebration_rounded, color: AppColors.secondary),
            SizedBox(width: 8),
            Text('Bravo !'),
          ],
        ),
        content: Text(
          'Votre score : $_score / ${_questions.length}\n\nContinuez à vous entraîner pour progresser !',
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pop(context);
            },
            child: const Text('Terminer'),
          ),
        ],
      ),
    );
  }
}
