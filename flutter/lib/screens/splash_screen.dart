import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Écran de démarrage IFL :
/// - Affiche le logo IFL existant (assets/logo.png) avec animation float + scale.
/// - Durée 2.5s puis redirection.
class SplashScreen extends StatefulWidget {
  final VoidCallback onDone;
  const SplashScreen({super.key, required this.onDone});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late final AnimationController _floatCtrl;
  late final AnimationController _scaleCtrl;
  int _phase = 0;

  @override
  void initState() {
    super.initState();
    _floatCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat(reverse: true);
    _scaleCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..forward();

    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) setState(() => _phase = 1);
    });
    Future.delayed(const Duration(milliseconds: 2200), () {
      if (mounted) setState(() => _phase = 2);
    });
    Future.delayed(const Duration(milliseconds: 2700), () {
      if (mounted) widget.onDone();
    });
  }

  @override
  void dispose() {
    _floatCtrl.dispose();
    _scaleCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedOpacity(
      duration: const Duration(milliseconds: 500),
      opacity: _phase == 2 ? 0 : 1,
      child: Scaffold(
        body: Container(
          decoration: const BoxDecoration(gradient: AppColors.splashGradient),
          child: Stack(
            children: [
              // Cercles décoratifs
              Positioned(
                top: -60,
                right: -80,
                child: Container(
                  width: 300,
                  height: 300,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withValues(alpha: 0.05),
                  ),
                ),
              ),
              Positioned(
                bottom: 40,
                left: -60,
                child: Container(
                  width: 200,
                  height: 200,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withValues(alpha: 0.05),
                  ),
                ),
              ),
              SafeArea(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Logo IFL existant + animation float
                      ScaleTransition(
                        scale: CurvedAnimation(
                          parent: _scaleCtrl,
                          curve: Curves.elasticOut,
                        ),
                        child: AnimatedBuilder(
                          animation: _floatCtrl,
                          builder: (context, child) {
                            final dy = -8 * _floatCtrl.value;
                            return Transform.translate(
                              offset: Offset(0, dy),
                              child: child,
                            );
                          },
                          child: Container(
                            width: 140,
                            height: 140,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(36),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.4),
                                  blurRadius: 60,
                                  offset: const Offset(0, 20),
                                ),
                              ],
                              border: Border.all(
                                color: const Color(0xFFD4A017)
                                    .withValues(alpha: 0.6),
                                width: 3,
                              ),
                              color: Colors.white,
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(33),
                              child: Image.asset(
                                'assets/logo.png',
                                fit: BoxFit.cover,
                                width: 140,
                                height: 140,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 28),
                      AnimatedOpacity(
                        duration: const Duration(milliseconds: 600),
                        opacity: _phase >= 1 ? 1 : 0,
                        child: const Column(
                          children: [
                            Text(
                              'IFL',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w900,
                                fontSize: 36,
                                letterSpacing: 2,
                              ),
                            ),
                            SizedBox(height: 6),
                            Text(
                              'Idéale Formation of Leaders',
                              style: TextStyle(
                                color: Color(0xFFFFE0A0),
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                                letterSpacing: 0.8,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      AnimatedOpacity(
                        duration: const Duration(milliseconds: 600),
                        opacity: _phase >= 1 ? 1 : 0,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 20, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            '🎓 Réussissez vos concours du Burkina Faso',
                            style: TextStyle(
                              color: Color(0xFFFFE0A0),
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 50),
                      AnimatedOpacity(
                        duration: const Duration(milliseconds: 400),
                        opacity: _phase >= 1 ? 1 : 0,
                        child: const _LoadingDots(),
                      ),
                    ],
                  ),
                ),
              ),
              Positioned(
                bottom: 30,
                left: 0,
                right: 0,
                child: AnimatedOpacity(
                  duration: const Duration(milliseconds: 600),
                  opacity: _phase >= 1 ? 0.5 : 0,
                  child: const Center(
                    child: Text(
                      'Burkina Faso',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 11,
                        letterSpacing: 1.2,
                      ),
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
}

class _LoadingDots extends StatefulWidget {
  const _LoadingDots();
  @override
  State<_LoadingDots> createState() => _LoadingDotsState();
}

class _LoadingDotsState extends State<_LoadingDots>
    with TickerProviderStateMixin {
  late List<AnimationController> _ctrls;

  @override
  void initState() {
    super.initState();
    _ctrls = List.generate(3, (i) {
      final c = AnimationController(
        vsync: this,
        duration: const Duration(milliseconds: 1400),
      );
      Future.delayed(Duration(milliseconds: 100 + i * 200), () {
        if (mounted) c.repeat();
      });
      return c;
    });
  }

  @override
  void dispose() {
    for (final c in _ctrls) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (i) {
        return AnimatedBuilder(
          animation: _ctrls[i],
          builder: (_, __) {
            final v = _ctrls[i].value;
            final scale = v < 0.4 ? 0.6 + v * 1.75 : 1.3 - (v - 0.4) * 1.166;
            final opacity = v < 0.4 ? 0.4 + v * 1.5 : 1.0 - (v - 0.4) * 1.0;
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 5),
              child: Transform.scale(
                scale: scale.clamp(0.6, 1.3),
                child: Container(
                  width: 9,
                  height: 9,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFE0A0)
                        .withValues(alpha: opacity.clamp(0.4, 1.0)),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            );
          },
        );
      }),
    );
  }
}
