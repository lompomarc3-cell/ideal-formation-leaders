// lib/screens/demo/demo_result_screen.dart
import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/demo_question_model.dart';
import 'payment_choice_screen.dart';

class DemoResultScreen extends StatelessWidget {
  final int score;
  final int total;
  final List<Map<String, dynamic>> answers;

  const DemoResultScreen({
    super.key,
    required this.score,
    required this.total,
    required this.answers,
  });

  double get _percentage => (score / total) * 100;

  String get _mention {
    if (_percentage >= 80) return 'Excellent !';
    if (_percentage >= 60) return 'Bien !';
    if (_percentage >= 40) return 'Peut mieux faire';
    return 'À améliorer';
  }

  Color get _mentionColor {
    if (_percentage >= 80) return AppTheme.accentColor;
    if (_percentage >= 60) return AppTheme.directColor;
    if (_percentage >= 40) return AppTheme.secondaryColor;
    return AppTheme.errorColor;
  }

  IconData get _mentionIcon {
    if (_percentage >= 80) return Icons.emoji_events_rounded;
    if (_percentage >= 60) return Icons.thumb_up_rounded;
    if (_percentage >= 40) return Icons.sentiment_neutral_rounded;
    return Icons.sentiment_dissatisfied_rounded;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              // Header résultat
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 36),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      _mentionColor,
                      _mentionColor.withValues(alpha: 0.7),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Column(
                  children: [
                    const Text(
                      'Démo Terminée !',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Score circulaire
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        SizedBox(
                          width: 140,
                          height: 140,
                          child: CircularProgressIndicator(
                            value: score / total,
                            strokeWidth: 12,
                            backgroundColor: Colors.white.withValues(alpha: 0.3),
                            valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        ),
                        Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(_mentionIcon, color: Colors.white, size: 32),
                            const SizedBox(height: 4),
                            Text(
                              '$score/$total',
                              style: const TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                              ),
                            ),
                            Text(
                              '${_percentage.toStringAsFixed(0)}%',
                              style: const TextStyle(
                                fontSize: 16,
                                color: Colors.white70,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      _mention,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Vous avez répondu correctement à $score questions sur $total',
                      style: const TextStyle(
                        fontSize: 13,
                        color: Colors.white70,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),

              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Stats
                    Row(
                      children: [
                        Expanded(
                          child: _buildStatCard(
                            score.toString(),
                            'Bonnes\nréponses',
                            AppTheme.accentColor,
                            Icons.check_circle_rounded,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildStatCard(
                            (total - score).toString(),
                            'Mauvaises\nréponses',
                            AppTheme.errorColor,
                            Icons.cancel_rounded,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildStatCard(
                            '${_percentage.toStringAsFixed(0)}%',
                            'Score\nglobal',
                            _mentionColor,
                            Icons.bar_chart_rounded,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // CTA Paiement
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppTheme.primaryColor, Color(0xFF2563EB)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.primaryColor.withValues(alpha: 0.3),
                            blurRadius: 16,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(
                            Icons.lock_open_rounded,
                            color: AppTheme.secondaryColor,
                            size: 32,
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'Continuez votre préparation !',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Accédez à plus de 1000 questions réparties sur 22 modules pour votre concours.',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.white70,
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              Expanded(
                                child: ElevatedButton(
                                  onPressed: () {
                                    Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (_) =>
                                            const PaymentChoiceScreen(),
                                      ),
                                    );
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppTheme.secondaryColor,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    elevation: 0,
                                  ),
                                  child: const Text(
                                    'S\'ABONNER MAINTENANT',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Revue des réponses
                    const Text(
                      'Revue de vos réponses',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Liste des réponses
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: answers.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final answer = answers[index];
                        final question = answer['question'] as DemoQuestion;
                        final selected = answer['selected'] as String;
                        final correct = answer['correct'] as bool;

                        return _buildAnswerReview(
                          index + 1,
                          question,
                          selected,
                          correct,
                        );
                      },
                    ),
                    const SizedBox(height: 24),

                    // Bouton rejouer
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Navigator.of(context).popUntil(
                            (route) => route.isFirst,
                          );
                        },
                        icon: const Icon(Icons.home_rounded),
                        label: const Text('Retour à l\'accueil'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppTheme.primaryColor,
                          side: const BorderSide(color: AppTheme.primaryColor),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(
      String value, String label, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: color,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              color: AppTheme.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildAnswerReview(
    int numero,
    DemoQuestion question,
    String selected,
    bool correct,
  ) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: correct
              ? AppTheme.accentColor.withValues(alpha: 0.3)
              : AppTheme.errorColor.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: correct
                      ? AppTheme.accentColor.withValues(alpha: 0.1)
                      : AppTheme.errorColor.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    '$numero',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color:
                          correct ? AppTheme.accentColor : AppTheme.errorColor,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  question.enonce,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                    height: 1.3,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Icon(
                correct ? Icons.check_circle : Icons.cancel,
                color: correct ? AppTheme.accentColor : AppTheme.errorColor,
                size: 18,
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (!correct) ...[
            Row(
              children: [
                const SizedBox(width: 38),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Votre réponse: $selected - ${question.getOptionText(selected)}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.errorColor,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        'Bonne réponse: ${question.reponseCorrecte} - ${question.getOptionText(question.reponseCorrecte)}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.accentColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ] else ...[
            Padding(
              padding: const EdgeInsets.only(left: 38),
              child: Text(
                'Réponse: $selected - ${question.getOptionText(selected)}',
                style: const TextStyle(
                  fontSize: 12,
                  color: AppTheme.accentColor,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
