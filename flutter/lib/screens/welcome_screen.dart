import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class WelcomeScreen extends StatefulWidget {
  final VoidCallback onDone;
  const WelcomeScreen({super.key, required this.onDone});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  bool _visible = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(milliseconds: 80), () {
      if (mounted) setState(() => _visible = true);
    });
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedOpacity(
      duration: const Duration(milliseconds: 500),
      opacity: _visible ? 1 : 0,
      child: Container(
        decoration: const BoxDecoration(gradient: AppColors.welcomeGradient),
        child: Stack(
          children: [
            Positioned(
              top: -80,
              right: -80,
              child: Container(
                width: 280,
                height: 280,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFFC4521A).withValues(alpha: 0.05),
                ),
              ),
            ),
            Positioned(
              bottom: 60,
              left: -60,
              child: Container(
                width: 200,
                height: 200,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFFD4A017).withValues(alpha: 0.06),
                ),
              ),
            ),
            SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(24, 24, 24, 40),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 96,
                        height: 96,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(28),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFC4521A)
                                  .withValues(alpha: 0.25),
                              blurRadius: 40,
                              offset: const Offset(0, 12),
                            ),
                          ],
                          border: Border.all(
                            color: const Color(0xFFD4A017)
                                .withValues(alpha: 0.3),
                            width: 3,
                          ),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(28),
                          child: Image.asset('assets/logo.png',
                              fit: BoxFit.cover, width: 96, height: 96),
                        ),
                      ),
                      const SizedBox(height: 28),
                      ShaderMask(
                        shaderCallback: (b) => const LinearGradient(
                          colors: [Color(0xFF8B2500), Color(0xFFC4521A)],
                        ).createShader(b),
                        child: const Text(
                          "Bienvenue sur notre plateforme d'apprentissage",
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            height: 1.2,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        width: 48,
                        height: 3,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                              colors: [Color(0xFFC4521A), Color(0xFFD4A017)]),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(height: 20),
                      Container(
                        constraints: const BoxConstraints(maxWidth: 360),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFC4521A)
                                  .withValues(alpha: 0.1),
                              blurRadius: 20,
                              offset: const Offset(0, 4),
                            ),
                          ],
                          border: Border.all(color: const Color(0xFFFFE4CC), width: 1.5),
                        ),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 22, vertical: 20),
                        child: Column(
                          children: [
                            RichText(
                              textAlign: TextAlign.center,
                              text: const TextSpan(
                                style: TextStyle(
                                  color: Color(0xFF374151),
                                  fontSize: 14,
                                  height: 1.75,
                                  fontWeight: FontWeight.w400,
                                ),
                                children: [
                                  TextSpan(text: 'Vous êtes sur '),
                                  TextSpan(
                                    text: 'Idéale Formation of Leaders',
                                    style: TextStyle(
                                      color: Color(0xFF8B2500),
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  TextSpan(
                                    text:
                                        " — une communauté d'instructeurs engagés pour une même cause : la réussite des candidats aux concours directs et professionnels de la ",
                                  ),
                                  TextSpan(
                                    text: 'fonction publique du Burkina Faso',
                                    style: TextStyle(
                                      color: Color(0xFFC4521A),
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  TextSpan(text: '.'),
                                ],
                              ),
                            ),
                            const SizedBox(height: 14),
                            Container(height: 1, color: const Color(0xFFFFE4CC)),
                            const SizedBox(height: 14),
                            const Text(
                              "Chaque année, nous accompagnons des milliers de candidats — des premières révisions jusqu'à l'épreuve finale.",
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Color(0xFF6B7280),
                                fontSize: 13,
                                height: 1.65,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 36),
                      SizedBox(
                        width: double.infinity,
                        child: ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 320),
                          child: ElevatedButton(
                            onPressed: widget.onDone,
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(18),
                              ),
                              elevation: 8,
                              backgroundColor: AppColors.primary,
                            ),
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
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                alignment: Alignment.center,
                                child: const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text('🎓', style: TextStyle(fontSize: 18)),
                                    SizedBox(width: 10),
                                    Text(
                                      'Commencer',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w800,
                                        fontSize: 16,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                    SizedBox(width: 10),
                                    Icon(Icons.arrow_forward, color: Colors.white, size: 18),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        '5 questions gratuites par dossier — sans inscription',
                        style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
