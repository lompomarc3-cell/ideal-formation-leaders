import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/auth_service.dart';
import '../theme/app_theme.dart';

/// Écran de démo gratuite (10 questions is_demo=true).
/// - Titre : "Démo gratuite" (sans la mention "sans inscription")
/// - Navigation flèches gauche / droite (sans devoir répondre)
/// - Sauvegarde de progression (localStorage simple)
/// - Écran final adaptatif :
///    • non connecté → invitation à s'inscrire / se connecter
///    • connecté non abonné → invitation à s'abonner
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
  // selected[i] = lettre choisie pour la question i (null si pas répondu)
  final List<String?> _selected = [];
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
              "Aucune question de démo disponible. Inscrivez-vous pour le QCM complet.";
        });
        return;
      }
      setState(() {
        _questions = q;
        _selected
          ..clear()
          ..addAll(List<String?>.filled(q.length, null));
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

  String _correctOf(int i) =>
      (_questions[i]['bonne_reponse'] ?? '').toString().toUpperCase();

  void _select(String letter) {
    if (_selected[_current] != null) return;
    setState(() {
      _selected[_current] = letter;
      if (letter == _correctOf(_current)) _score += 1;
    });
  }

  void _go(int delta) {
    final newIndex = _current + delta;
    if (newIndex < 0 || newIndex >= _questions.length) return;
    setState(() => _current = newIndex);
  }

  void _finish() {
    setState(() => _finished = true);
  }

  void _restart() {
    setState(() {
      _current = 0;
      _selected
        ..clear()
        ..addAll(List<String?>.filled(_questions.length, null));
      _score = 0;
      _finished = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightBg,
      appBar: AppBar(
        title: const Text(
          'Démo gratuite',
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
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
                size: 64, color: AppColors.primary),
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
    final auth = context.read<AuthService>();
    final isAuthed = auth.isAuthenticated;
    final isSubscribed =
        auth.user?.subscriptionStatus == 'active' || auth.user?.isAdmin == true;
    final total = _questions.length;
    final pct = total == 0 ? 0 : ((_score / total) * 100).round();
    String badge;
    String msg;
    if (pct >= 80) {
      badge = '🏆';
      msg = 'Excellent travail !';
    } else if (pct >= 50) {
      badge = '👍';
      msg = 'Bonne base, continuez !';
    } else {
      badge = '📚';
      msg = 'Plus d\'entraînement vous attend !';
    }

    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFFFE4CC)),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.08),
                      blurRadius: 22,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Text(badge, style: const TextStyle(fontSize: 64)),
                    const SizedBox(height: 8),
                    Text(msg,
                        style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: AppColors.darkTerracotta)),
                    const SizedBox(height: 6),
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
                  ],
                ),
              ),
              const SizedBox(height: 18),
              // CTA contextuel
              if (!isAuthed) _buildCtaUnauth() else if (!isSubscribed) _buildCtaUnsubscribed() else _buildCtaSubscribed(),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.refresh),
                  label: const Text('Recommencer la démo'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(color: AppColors.primary, width: 2),
                    padding: const EdgeInsets.symmetric(vertical: 13),
                  ),
                  onPressed: _restart,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCtaUnauth() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFC4521A), Color(0xFF8B2500)],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Row(
            children: [
              Icon(Icons.rocket_launch_rounded,
                  color: Colors.white, size: 26),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Prêt(e) à passer à la suite ?',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          const Text(
            'Créez votre compte pour accéder à des milliers de QCM.',
            style: TextStyle(color: Colors.white, fontSize: 12),
          ),
          const SizedBox(height: 14),
          ElevatedButton.icon(
            onPressed: () =>
                Navigator.of(context).pushReplacementNamed('/register'),
            icon: const Icon(Icons.person_add_alt_1_rounded),
            label: const Text("S'inscrire gratuitement"),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: AppColors.darkTerracotta,
              padding: const EdgeInsets.symmetric(vertical: 13),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: () =>
                Navigator.of(context).pushReplacementNamed('/login'),
            icon: const Icon(Icons.login_rounded, color: Colors.white),
            label: const Text(
              'Se connecter',
              style: TextStyle(color: Colors.white),
            ),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Colors.white, width: 2),
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCtaUnsubscribed() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFD4A017), Color(0xFFC4521A)],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Row(
            children: [
              Icon(Icons.workspace_premium_rounded,
                  color: Colors.white, size: 26),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Débloquez tout le contenu',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          const Text(
            'Concours directs : 5 000 FCFA par an pour les 12 dossiers.\n'
            'Concours pros : 20 000 FCFA par an / dossier (3 bonus offerts).',
            style: TextStyle(color: Colors.white, fontSize: 12, height: 1.45),
          ),
          const SizedBox(height: 14),
          ElevatedButton.icon(
            onPressed: () =>
                Navigator.of(context).pushReplacementNamed('/payment'),
            icon: const Icon(Icons.flash_on_rounded),
            label: const Text("S'abonner maintenant"),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: AppColors.darkTerracotta,
              padding: const EdgeInsets.symmetric(vertical: 13),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCtaSubscribed() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF3D9),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFBBF24)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Row(
            children: [
              Icon(Icons.celebration_rounded,
                  color: Color(0xFF92400E), size: 24),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Vos dossiers sont disponibles',
                  style: TextStyle(
                    color: Color(0xFF92400E),
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ElevatedButton.icon(
            onPressed: () =>
                Navigator.of(context).pushReplacementNamed('/main'),
            icon: const Icon(Icons.dashboard_rounded),
            label: const Text("Aller à l'accueil"),
          ),
        ],
      ),
    );
  }

  Widget _buildQuestion() {
    final q = _questions[_current];
    final total = _questions.length;
    final answered = _selected[_current] != null;
    final correct = _correctOf(_current);
    final enonce = (q['question_text'] ?? '').toString();
    final explication = (q['explication'] ?? '').toString();
    final progress = (_current + 1) / (total == 0 ? 1 : total);

    return Column(
      children: [
        Container(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          color: AppColors.primary,
          child: Column(
            children: [
              Row(
                children: [
                  Text('Question ${_current + 1} / $total',
                      style: const TextStyle(
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          fontSize: 13)),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.18),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text('Score : $_score',
                        style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            fontSize: 13)),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 6,
                  backgroundColor: Colors.white.withValues(alpha: 0.25),
                  valueColor: const AlwaysStoppedAnimation<Color>(
                      Color(0xFFFBBF24)),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 620),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFFFE4CC)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 16,
                          ),
                        ],
                      ),
                      child: Text(
                        enonce,
                        style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            height: 1.45),
                      ),
                    ),
                    const SizedBox(height: 14),
                    ...['A', 'B', 'C', 'D'].map((letter) {
                      final key = 'option_${letter.toLowerCase()}';
                      final text = (q[key] ?? '').toString();
                      return _optionTile(letter, text, correct);
                    }),
                    if (answered && explication.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF8F0),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                              color: const Color(0xFFFFE4CC), width: 1.5),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('💡 Explication',
                                style: TextStyle(
                                    fontWeight: FontWeight.w900,
                                    color: AppColors.darkTerracotta)),
                            const SizedBox(height: 6),
                            Text(explication,
                                style: const TextStyle(
                                    fontSize: 13.5, height: 1.5)),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
        _buildBottomNav(total),
      ],
    );
  }

  Widget _buildBottomNav(int total) {
    final isFirst = _current == 0;
    final isLast = _current == total - 1;

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
          // Flèche précédente
          _arrowButton(
            icon: Icons.arrow_back_rounded,
            label: 'Précédente',
            enabled: !isFirst,
            onTap: () => _go(-1),
          ),
          const SizedBox(width: 8),
          // Pastilles indicateurs
          Expanded(
            child: SizedBox(
              height: 28,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: total,
                separatorBuilder: (_, __) => const SizedBox(width: 4),
                itemBuilder: (_, i) {
                  final answered = _selected[i] != null;
                  final isCurrent = i == _current;
                  final isCorrect = answered && _selected[i] == _correctOf(i);
                  Color color;
                  if (isCurrent) {
                    color = AppColors.primary;
                  } else if (!answered) {
                    color = const Color(0xFFE5E7EB);
                  } else if (isCorrect) {
                    color = const Color(0xFFFBBF24);
                  } else {
                    color = const Color(0xFFEF4444);
                  }
                  return InkWell(
                    onTap: () => setState(() => _current = i),
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      width: 24,
                      height: 24,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: color,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${i + 1}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
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
          // Flèche suivante / Terminer
          _arrowButton(
            icon: isLast ? Icons.flag_rounded : Icons.arrow_forward_rounded,
            label: isLast ? 'Terminer' : 'Suivante',
            enabled: true,
            primary: isLast,
            onTap: () {
              if (isLast) {
                _finish();
              } else {
                _go(1);
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _arrowButton({
    required IconData icon,
    required String label,
    required bool enabled,
    required VoidCallback onTap,
    bool primary = false,
  }) {
    final color = enabled
        ? (primary ? AppColors.primary : Colors.white)
        : const Color(0xFFE5E7EB);
    final fg = enabled
        ? (primary ? Colors.white : AppColors.primary)
        : const Color(0xFF9CA3AF);
    return InkWell(
      onTap: enabled ? onTap : null,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        height: 44,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
              color: enabled
                  ? AppColors.primary
                  : const Color(0xFFE5E7EB),
              width: 2),
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

  Widget _optionTile(String letter, String text, String correct) {
    final selected = _selected[_current];
    final answered = selected != null;
    final isSelected = selected == letter;
    final isCorrect = correct == letter;
    Color bg = Colors.white;
    Color border = const Color(0xFFE5E7EB);
    Color fg = const Color(0xFF1A0A00);
    if (answered) {
      if (isCorrect) {
        bg = const Color(0xFFFFF3D9);
        border = const Color(0xFFFBBF24);
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
      padding: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: answered ? null : () => _select(letter),
        borderRadius: BorderRadius.circular(14),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          padding:
              const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: bg,
            border: Border.all(color: border, width: 2),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: border,
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
                        fontWeight: FontWeight.w600,
                        color: fg,
                        height: 1.4)),
              ),
              if (answered && isCorrect)
                const Icon(Icons.check_circle, color: Color(0xFFD97706)),
              if (answered && isSelected && !isCorrect)
                const Icon(Icons.cancel, color: Color(0xFFDC2626)),
            ],
          ),
        ),
      ),
    );
  }
}
