import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Écran de motivation : tout premier écran visible.
/// Affiche un message inspirant avec animations fluides (fade in/out + scale)
/// puis transition vers le splash logo.
class MotivationScreen extends StatefulWidget {
  final VoidCallback onDone;
  const MotivationScreen({super.key, required this.onDone});

  @override
  State<MotivationScreen> createState() => _MotivationScreenState();
}

class _MotivationScreenState extends State<MotivationScreen>
    with TickerProviderStateMixin {
  late final AnimationController _fadeInCtrl;
  late final AnimationController _scaleCtrl;
  late final AnimationController _bgCtrl;
  bool _fadeOut = false;

  @override
  void initState() {
    super.initState();
    _fadeInCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..forward();

    _scaleCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..forward();

    _bgCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 6),
    )..repeat(reverse: true);

    // Démarrer fade out après 2.6s
    Future.delayed(const Duration(milliseconds: 2600), () {
      if (mounted) setState(() => _fadeOut = true);
    });
    // Transition vers splash après 3.3s
    Future.delayed(const Duration(milliseconds: 3300), () {
      if (mounted) widget.onDone();
    });
  }

  @override
  void dispose() {
    _fadeInCtrl.dispose();
    _scaleCtrl.dispose();
    _bgCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Scaffold(
      body: AnimatedOpacity(
        duration: const Duration(milliseconds: 700),
        opacity: _fadeOut ? 0 : 1,
        curve: Curves.easeInOut,
        child: AnimatedBuilder(
          animation: _bgCtrl,
          builder: (context, _) {
            return Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment(-1 + _bgCtrl.value * 0.4, -1),
                  end: Alignment(1, 1 - _bgCtrl.value * 0.4),
                  colors: const [
                    Color(0xFFFFF8F0),
                    Color(0xFFFFE9D2),
                    Color(0xFFFFD7B0),
                  ],
                ),
              ),
              child: Stack(
                children: [
                  // Bulles décoratives
                  ..._buildBubbles(size),
                  SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 28),
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            // Icône d'étoile pulsante
                            ScaleTransition(
                              scale: CurvedAnimation(
                                parent: _scaleCtrl,
                                curve: Curves.elasticOut,
                              ),
                              child: Container(
                                width: 110,
                                height: 110,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  gradient: const LinearGradient(
                                    colors: [
                                      Color(0xFFD4A017),
                                      Color(0xFFC4521A),
                                    ],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppColors.primary
                                          .withValues(alpha: 0.45),
                                      blurRadius: 30,
                                      spreadRadius: 4,
                                    ),
                                  ],
                                ),
                                child: const Icon(
                                  Icons.auto_awesome_rounded,
                                  color: Colors.white,
                                  size: 56,
                                ),
                              ),
                            ),
                            const SizedBox(height: 36),
                            FadeTransition(
                              opacity: _fadeInCtrl,
                              child: SlideTransition(
                                position: Tween<Offset>(
                                  begin: const Offset(0, 0.3),
                                  end: Offset.zero,
                                ).animate(CurvedAnimation(
                                  parent: _fadeInCtrl,
                                  curve: Curves.easeOutCubic,
                                )),
                                child: Column(
                                  children: [
                                    const Text(
                                      'La réussite est à\nportée de main.',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                        color: AppColors.darkTerracotta,
                                        fontWeight: FontWeight.w900,
                                        fontSize: 30,
                                        height: 1.3,
                                        letterSpacing: 0.4,
                                      ),
                                    ),
                                    const SizedBox(height: 18),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 18,
                                        vertical: 10,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.white
                                            .withValues(alpha: 0.6),
                                        borderRadius:
                                            BorderRadius.circular(30),
                                        border: Border.all(
                                          color: AppColors.primary
                                              .withValues(alpha: 0.2),
                                        ),
                                      ),
                                      child: const Text(
                                        'Préparez-vous avec IFL',
                                        style: TextStyle(
                                          color: AppColors.primary,
                                          fontWeight: FontWeight.w800,
                                          fontSize: 16,
                                          letterSpacing: 0.6,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 30),
                                    // Citation décorative
                                    AnimatedOpacity(
                                      duration:
                                          const Duration(milliseconds: 800),
                                      opacity: _fadeInCtrl.value,
                                      child: const Padding(
                                        padding: EdgeInsets.symmetric(
                                            horizontal: 14),
                                        child: Text(
                                          '« Le succès appartient à\nceux qui se préparent. »',
                                          textAlign: TextAlign.center,
                                          style: TextStyle(
                                            fontSize: 14,
                                            fontStyle: FontStyle.italic,
                                            fontWeight: FontWeight.w600,
                                            color: Color(0xFF8B2500),
                                            height: 1.5,
                                          ),
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
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  List<Widget> _buildBubbles(Size size) {
    return [
      Positioned(
        top: -60,
        right: -60,
        child: AnimatedBuilder(
          animation: _bgCtrl,
          builder: (_, __) => Transform.translate(
            offset: Offset(0, math.sin(_bgCtrl.value * math.pi) * 10),
            child: Container(
              width: 220,
              height: 220,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.secondary.withValues(alpha: 0.18),
              ),
            ),
          ),
        ),
      ),
      Positioned(
        bottom: -80,
        left: -50,
        child: AnimatedBuilder(
          animation: _bgCtrl,
          builder: (_, __) => Transform.translate(
            offset: Offset(0, math.cos(_bgCtrl.value * math.pi) * 12),
            child: Container(
              width: 260,
              height: 260,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.primary.withValues(alpha: 0.12),
              ),
            ),
          ),
        ),
      ),
      Positioned(
        top: size.height * 0.15,
        left: 30,
        child: AnimatedBuilder(
          animation: _bgCtrl,
          builder: (_, __) => Opacity(
            opacity: 0.4 + _bgCtrl.value * 0.3,
            child: Container(
              width: 14,
              height: 14,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.secondary,
              ),
            ),
          ),
        ),
      ),
      Positioned(
        top: size.height * 0.22,
        right: 40,
        child: AnimatedBuilder(
          animation: _bgCtrl,
          builder: (_, __) => Opacity(
            opacity: 0.5 + _bgCtrl.value * 0.3,
            child: Container(
              width: 10,
              height: 10,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.primary,
              ),
            ),
          ),
        ),
      ),
    ];
  }
}
