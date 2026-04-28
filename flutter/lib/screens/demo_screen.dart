import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/auth_service.dart';
import '../theme/app_theme.dart';

/// Écran de démo gratuit (équivalent pages/demo.js).
/// Récupère 10 vraies questions is_demo=true depuis Supabase et les fait
/// défiler une par une avec scoring, feedback et écran final.
class DemoScreen extends StatefulWidget {
  const DemoScreen({super.key});

  @override
  State<DemoScreen> createState() => _DemoScreenState();
}

class _DemoScreenState extends State<DemoScreen> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _questions = [];
  int _current = 0;
  String? _selected; // 'A' 'B' 'C' 'D'
  bool _answered = false;
  int _score = 0;
  bool _finished = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final auth = context.read<AuthService>();
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final q = await auth.api.fetchDemoQuestions(limit: 10);
      if (!mounted) return;
      if (q.isEmpty) {
        setState(() {
          _loading = false;
          _error =
              "Aucune question de démo disponible pour le moment. Revenez plus tard ou inscrivez-vous pour le QCM complet.";
        });
        return;
      }
      setState(() {
        _questions = q;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Erreur de chargement : $e';
      });
    }
  }

  void _select(String letter) {
    if (_answered) return;
    final q = _questions[_current];
    final correct = (q['bonne_reponse'] ?? '').toString().toUpperCase();
    setState(() {
      _selected = letter;
      _answered = true;
      if (letter == correct) _score += 1;
    });
  }

  void _next() {
    if (_current + 1 >= _questions.length) {
      setState(() => _finished = true);
      return;
    }
    setState(() {
      _current += 1;
      _selected = null;
      _answered = false;
    });
  }

  void _restart() {
    setState(() {
      _current = 0;
      _selected = null;
      _answered = false;
      _score = 0;
      _finished = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('QCM de démonstration'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildError()
              : _finished
                  ? _buildFinished()
                  : _buildQuestion(),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline,
                size: 64, color: Color(0xFFC4521A)),
            const SizedBox(height: 16),
            Text(_error ?? '',
                textAlign: TextAlign.center,
                style: const TextStyle(
                    fontSize: 15, fontWeight: FontWeight.w600)),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _load, child: const Text('Réessayer')),
          ],
        ),
      ),
    );
  }

  Widget _buildFinished() {
    final total = _questions.length;
    final pct = total == 0 ? 0 : ((_score / total) * 100).round();
    String badge;
    if (pct >= 80) {
      badge = '🏆';
    } else if (pct >= 50) {
      badge = '👍';
    } else {
      badge = '📚';
    }
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Text(badge, style: const TextStyle(fontSize: 64)),
                  const SizedBox(height: 12),
                  const Text('Bravo, démo terminée !',
                      style: TextStyle(
                          fontSize: 20, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 8),
                  Text('Score : $_score / $total ($pct %)',
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 16),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: LinearProgressIndicator(
                      value: total == 0 ? 0 : _score / total,
                      minHeight: 10,
                      backgroundColor: const Color(0xFFFFE4CC),
                      valueColor: const AlwaysStoppedAnimation<Color>(
                          AppColors.primary),
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.login),
                      label: const Text(
                          "S'inscrire pour le QCM complet (938+ questions)"),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding:
                            const EdgeInsets.symmetric(vertical: 14),
                      ),
                      onPressed: () =>
                          Navigator.of(context).pushNamed('/register'),
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.refresh),
                      label: const Text('Recommencer la démo'),
                      onPressed: _restart,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildQuestion() {
    final q = _questions[_current];
    final total = _questions.length;
    final progress =
        (_current + (_answered ? 1 : 0)) / (total == 0 ? 1 : total);
    final correct = (q['bonne_reponse'] ?? '').toString().toUpperCase();
    final enonce = (q['question_text'] ?? '').toString();
    final explication = (q['explication'] ?? '').toString();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 620),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Text('Question ${_current + 1} / $total',
                      style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          color: AppColors.darkTerracotta)),
                  const Spacer(),
                  Text('Score : $_score',
                      style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          color: AppColors.darkTerracotta)),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 8,
                  backgroundColor: const Color(0xFFFFE4CC),
                  valueColor: const AlwaysStoppedAnimation<Color>(
                      AppColors.primary),
                ),
              ),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    enonce,
                    style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        height: 1.4),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              ...['A', 'B', 'C', 'D'].map((letter) {
                final key = 'option_${letter.toLowerCase()}';
                final text = (q[key] ?? '').toString();
                return _optionTile(letter, text, correct);
              }),
              if (_answered && explication.isNotEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF8F0),
                    borderRadius: BorderRadius.circular(12),
                    border:
                        Border.all(color: const Color(0xFFFFE4CC), width: 1.5),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('💡 Explication',
                          style: TextStyle(
                              fontWeight: FontWeight.w900,
                              color: AppColors.darkTerracotta)),
                      const SizedBox(height: 4),
                      Text(explication,
                          style: const TextStyle(fontSize: 13, height: 1.4)),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 16),
              if (_answered)
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    icon: Icon(_current + 1 >= total
                        ? Icons.bar_chart
                        : Icons.arrow_forward),
                    label: Text(_current + 1 >= total
                        ? 'Voir mes résultats'
                        : 'Question suivante'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    onPressed: _next,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _optionTile(String letter, String text, String correct) {
    final bool isSelected = _selected == letter;
    final bool isCorrect = correct == letter;
    Color bg = Colors.white;
    Color border = const Color(0xFFE5E7EB);
    Color fg = const Color(0xFF1A0A00);
    if (_answered) {
      if (isCorrect) {
        bg = const Color(0xFFE8F7EC);
        border = const Color(0xFF16A34A);
      } else if (isSelected && !isCorrect) {
        bg = const Color(0xFFFDECEC);
        border = const Color(0xFFDC2626);
      } else {
        bg = const Color(0xFFF9FAFB);
        fg = const Color(0xFF6B7280);
      }
    } else if (isSelected) {
      bg = const Color(0xFFFFF8F0);
      border = AppColors.primary;
    }
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: _answered ? null : () => _select(letter),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding:
              const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: bg,
            border: Border.all(color: border, width: 2),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundColor: AppColors.primary.withValues(alpha: 0.12),
                child: Text(letter,
                    style: const TextStyle(
                        color: AppColors.darkTerracotta,
                        fontWeight: FontWeight.w900)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(text,
                    style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: fg)),
              ),
              if (_answered && isCorrect)
                const Icon(Icons.check_circle, color: Color(0xFF16A34A)),
              if (_answered && isSelected && !isCorrect)
                const Icon(Icons.cancel, color: Color(0xFFDC2626)),
            ],
          ),
        ),
      ),
    );
  }
}
