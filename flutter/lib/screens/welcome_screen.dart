import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class WelcomeScreen extends StatefulWidget {
  final VoidCallback onDone;
  const WelcomeScreen({super.key, required this.onDone});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen>
    with TickerProviderStateMixin {
  bool _visible = false;
  late AnimationController _pulseCtrl;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    Future.delayed(const Duration(milliseconds: 80), () {
      if (mounted) setState(() => _visible = true);
    });
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF8F0),
      body: AnimatedOpacity(
        duration: const Duration(milliseconds: 500),
        opacity: _visible ? 1 : 0,
        child: Container(
          decoration: const BoxDecoration(gradient: AppColors.welcomeGradient),
          child: Stack(
            children: [
              // Cercles décoratifs en arrière-plan
              Positioned(
                top: -80,
                right: -80,
                child: Container(
                  width: 280,
                  height: 280,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFFC4521A).withValues(alpha: 0.06),
                  ),
                ),
              ),
              Positioned(
                bottom: 60,
                left: -60,
                child: Container(
                  width: 220,
                  height: 220,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFFD4A017).withValues(alpha: 0.07),
                  ),
                ),
              ),
              Positioned(
                top: 180,
                left: -40,
                child: Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFFC4521A).withValues(alpha: 0.04),
                  ),
                ),
              ),
              SafeArea(
                child: Center(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(24, 20, 24, 40),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Logo avec pulse animation
                        AnimatedBuilder(
                          animation: _pulseCtrl,
                          builder: (_, child) {
                            final scale = 1.0 + _pulseCtrl.value * 0.04;
                            return Transform.scale(scale: scale, child: child);
                          },
                          child: Container(
                            width: 104,
                            height: 104,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(30),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFFC4521A)
                                      .withValues(alpha: 0.28),
                                  blurRadius: 44,
                                  offset: const Offset(0, 14),
                                ),
                              ],
                              border: Border.all(
                                color: const Color(0xFFD4A017)
                                    .withValues(alpha: 0.4),
                                width: 3,
                              ),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(30),
                              child: Image.asset('assets/logo.png',
                                  fit: BoxFit.cover, width: 104, height: 104),
                            ),
                          ),
                        ),
                        const SizedBox(height: 26),
                        // Titre principal sans ShaderMask - plus propre
                        const Text(
                          'Bienvenue sur IFL',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF8B2500),
                            height: 1.2,
                            letterSpacing: 0.3,
                          ),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Idéale Formation of Leaders',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFFC4521A),
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 14),
                        // Séparateur décoratif
                        Container(
                          width: 64,
                          height: 4,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                                colors: [Color(0xFFC4521A), Color(0xFFD4A017)]),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Carte de présentation - SANS ShaderMask, SANS textes soulignés
                        Container(
                          constraints: const BoxConstraints(maxWidth: 380),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(22),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFFC4521A)
                                    .withValues(alpha: 0.10),
                                blurRadius: 24,
                                offset: const Offset(0, 6),
                              ),
                            ],
                            border: Border.all(
                                color: const Color(0xFFFFE4CC), width: 1.5),
                          ),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 22, vertical: 22),
                          child: Column(
                            children: [
                              const Text(
                                "Votre plateforme d'apprentissage pour réussir les concours de la fonction publique du Burkina Faso.",
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: Color(0xFF374151),
                                  fontSize: 14.5,
                                  height: 1.6,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 16),
                              Container(
                                  height: 1, color: const Color(0xFFFFE4CC)),
                              const SizedBox(height: 16),
                              // Liste des avantages avec icônes
                              _feature('📚',
                                  'Des milliers de QCM pour vos révisions'),
                              const SizedBox(height: 10),
                              _feature('🎓',
                                  'Concours directs & professionnels'),
                              const SizedBox(height: 10),
                              _feature('🆓',
                                  '5 questions gratuites par dossier'),
                            ],
                          ),
                        ),
                        const SizedBox(height: 32),

                        // Bouton commencer
                        SizedBox(
                          width: double.infinity,
                          child: ConstrainedBox(
                            constraints: const BoxConstraints(maxWidth: 340),
                            child: Material(
                              elevation: 10,
                              shadowColor:
                                  const Color(0xFFC4521A).withValues(alpha: 0.5),
                              borderRadius: BorderRadius.circular(18),
                              child: InkWell(
                                onTap: widget.onDone,
                                borderRadius: BorderRadius.circular(18),
                                child: Ink(
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(
                                      colors: [
                                        Color(0xFF8B2500),
                                        Color(0xFFC4521A),
                                        Color(0xFFD4A017),
                                      ],
                                    ),
                                    borderRadius: BorderRadius.circular(18),
                                  ),
                                  child: Container(
                                    padding:
                                        const EdgeInsets.symmetric(vertical: 17),
                                    alignment: Alignment.center,
                                    child: const Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Text('🚀',
                                            style: TextStyle(fontSize: 18)),
                                        SizedBox(width: 10),
                                        Text(
                                          'Commencer',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.w800,
                                            fontSize: 16,
                                            letterSpacing: 0.6,
                                          ),
                                        ),
                                        SizedBox(width: 10),
                                        Icon(Icons.arrow_forward,
                                            color: Colors.white, size: 18),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),
                        const Text(
                          'Essayez la démo gratuite • Sans inscription',
                          style: TextStyle(
                            color: Color(0xFF9CA3AF),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _feature(String emoji, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: const Color(0xFFFFF3E0),
            borderRadius: BorderRadius.circular(10),
          ),
          alignment: Alignment.center,
          child: Text(emoji, style: const TextStyle(fontSize: 18)),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              color: Color(0xFF4B5563),
              fontSize: 13.5,
              height: 1.4,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}
