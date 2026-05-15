import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/price_service.dart';

/// 🔥 Bandeau clignotant pour promotions actives.
///
/// - Couleur jaune/orange qui clignote
/// - Compte à rebours en temps réel (HH:MM:SS)
/// - Affichage différencié Direct / Professionnel
/// - Animation pulsée pour attirer l'attention
///
/// Usage :
///   const PromoBanner(type: 'all')          // les deux promos visibles
///   const PromoBanner(type: 'direct')        // promo Direct uniquement
///   const PromoBanner(type: 'professionnel') // promo Pro uniquement
class PromoBanner extends StatefulWidget {
  /// 'direct', 'professionnel' ou 'all'
  final String type;

  /// Marge externe du bandeau
  final EdgeInsetsGeometry margin;

  /// Si true, n'affiche rien quand pas de promo (sinon affiche un placeholder)
  final bool hideIfNoPromo;

  const PromoBanner({
    super.key,
    this.type = 'all',
    this.margin = const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
    this.hideIfNoPromo = true,
  });

  @override
  State<PromoBanner> createState() => _PromoBannerState();
}

class _PromoBannerState extends State<PromoBanner>
    with TickerProviderStateMixin {
  late final AnimationController _blinkController;
  late final AnimationController _shakeController;
  Timer? _countdownTimer;

  @override
  void initState() {
    super.initState();
    // Clignotement : 1 cycle / 800ms
    _blinkController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..repeat(reverse: true);

    // Léger "shake" / pulse toutes les 3 secondes
    _shakeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    Timer.periodic(const Duration(seconds: 3), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      _shakeController.forward(from: 0);
    });

    // Compte à rebours : rafraîchit toutes les secondes
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _blinkController.dispose();
    _shakeController.dispose();
    _countdownTimer?.cancel();
    super.dispose();
  }

  /// Format HH:MM:SS pour le compte à rebours
  String _formatCountdown(String? iso) {
    if (iso == null) return '';
    try {
      final end = DateTime.parse(iso);
      final diff = end.difference(DateTime.now());
      if (diff.isNegative) return '';
      final days = diff.inDays;
      final hours = diff.inHours % 24;
      final minutes = diff.inMinutes % 60;
      final seconds = diff.inSeconds % 60;
      if (days > 0) {
        return '${days}j ${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
      }
      return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
    } catch (_) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final ps = context.watch<PriceService>();

    final showDirect = (widget.type == 'all' || widget.type == 'direct') &&
        ps.directHasPromo;
    final showPro =
        (widget.type == 'all' || widget.type == 'professionnel') &&
            ps.proHasPromo;

    if (!showDirect && !showPro) {
      if (widget.hideIfNoPromo) return const SizedBox.shrink();
      return const SizedBox.shrink();
    }

    return Padding(
      padding: widget.margin,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showDirect)
            _buildSingleBanner(
              label: ps.directLabel?.isNotEmpty == true
                  ? ps.directLabel!
                  : 'PROMO DIRECT',
              priceOld: ps.directPrix,
              priceNew: ps.directPrixPromo!,
              dateFin: ps.directDateFin,
              gradient: const LinearGradient(
                colors: [Color(0xFFFBBF24), Color(0xFFF59E0B), Color(0xFFEF4444)],
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ),
              icon: Icons.flash_on_rounded,
            ),
          if (showDirect && showPro) const SizedBox(height: 8),
          if (showPro)
            _buildSingleBanner(
              label: ps.proLabel?.isNotEmpty == true
                  ? ps.proLabel!
                  : 'PROMO PROFESSIONNEL',
              priceOld: ps.proPrix,
              priceNew: ps.proPrixPromo!,
              dateFin: ps.proDateFin,
              gradient: const LinearGradient(
                colors: [Color(0xFFF59E0B), Color(0xFFDC2626), Color(0xFFB91C1C)],
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ),
              icon: Icons.workspace_premium_rounded,
            ),
        ],
      ),
    );
  }

  Widget _buildSingleBanner({
    required String label,
    required int priceOld,
    required int priceNew,
    required String? dateFin,
    required Gradient gradient,
    required IconData icon,
  }) {
    final countdown = _formatCountdown(dateFin);

    return AnimatedBuilder(
      animation: Listenable.merge([_blinkController, _shakeController]),
      builder: (context, _) {
        // Opacité qui clignote entre 0.85 et 1.0
        final opacity = 0.85 + (_blinkController.value * 0.15);
        // Léger scale "pulse"
        final scale = 1.0 + (_shakeController.value * 0.03);

        return Transform.scale(
          scale: scale,
          child: Opacity(
            opacity: opacity,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                gradient: gradient,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFF59E0B).withValues(
                        alpha: 0.4 + (_blinkController.value * 0.3)),
                    blurRadius: 12 + (_blinkController.value * 8),
                    offset: const Offset(0, 4),
                  ),
                ],
                border: Border.all(
                  color: Colors.white.withValues(
                      alpha: 0.5 + (_blinkController.value * 0.5)),
                  width: 2,
                ),
              ),
              child: Row(
                children: [
                  // Icône éclair animée
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.25),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(icon, color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                '🔥 $label',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 14,
                                  letterSpacing: 0.5,
                                  shadows: [
                                    Shadow(
                                      color: Colors.black26,
                                      offset: Offset(0, 1),
                                      blurRadius: 2,
                                    ),
                                  ],
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Wrap(
                          crossAxisAlignment: WrapCrossAlignment.center,
                          spacing: 6,
                          children: [
                            Text(
                              PriceService.formatFcfa(priceOld),
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.85),
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                decoration: TextDecoration.lineThrough,
                                decorationColor:
                                    Colors.white.withValues(alpha: 0.85),
                                decorationThickness: 2,
                              ),
                            ),
                            Text(
                              PriceService.formatFcfa(priceNew),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ],
                        ),
                        if (countdown.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.25),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.timer_outlined,
                                    size: 12, color: Colors.white),
                                const SizedBox(width: 4),
                                Text(
                                  'Fin : $countdown',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    fontFeatures: [
                                      FontFeature.tabularFigures()
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
