import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/price_service.dart';

/// Widget réutilisable qui affiche le prix d'un type de concours
/// avec gestion automatique des promotions :
///   - Prix barré (ancien prix) si une promo est active
///   - Prix promotionnel mis en valeur
///   - Badge "PROMO" + compte à rebours
///
/// S'auto-rafraîchit toutes les 60 secondes pour mettre à jour le countdown.
class PriceDisplay extends StatefulWidget {
  /// 'direct' ou 'professionnel'
  final String type;

  /// Style d'affichage : compact (badge horizontal) ou full (carte complète)
  final PriceDisplayStyle style;

  /// Couleur principale (ex: blanc sur fond coloré, ou couleur primaire sur fond blanc)
  final Color foreground;
  final Color? promoBadgeBg;
  final Color? promoBadgeText;
  final TextStyle? priceStyle;
  final TextStyle? oldPriceStyle;

  /// Texte additionnel (ex: "/ dossier", "pour les 12 dossiers")
  final String? hint;

  const PriceDisplay({
    super.key,
    required this.type,
    this.style = PriceDisplayStyle.compact,
    this.foreground = Colors.white,
    this.promoBadgeBg,
    this.promoBadgeText,
    this.priceStyle,
    this.oldPriceStyle,
    this.hint,
  });

  @override
  State<PriceDisplay> createState() => _PriceDisplayState();
}

enum PriceDisplayStyle { compact, banner, inline }

class _PriceDisplayState extends State<PriceDisplay> {
  Timer? _ticker;

  @override
  void initState() {
    super.initState();
    _ticker = Timer.periodic(const Duration(seconds: 60), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ps = context.watch<PriceService>();
    final isDirect = widget.type == 'direct';
    final prix = isDirect ? ps.directPrix : ps.proPrix;
    final prixPromo = isDirect ? ps.directPrixPromo : ps.proPrixPromo;
    final hasPromo = isDirect ? ps.directHasPromo : ps.proHasPromo;
    final dateFin = isDirect ? ps.directDateFin : ps.proDateFin;
    final label = isDirect ? ps.directLabel : ps.proLabel;
    final countdown = PriceService.countdown(dateFin);

    final priceText = hasPromo && prixPromo != null
        ? PriceService.formatFcfa(prixPromo)
        : PriceService.formatFcfa(prix);
    final oldPriceText =
        hasPromo && prixPromo != null ? PriceService.formatFcfa(prix) : null;

    final priceStyle = widget.priceStyle ??
        TextStyle(
          color: widget.foreground,
          fontWeight: FontWeight.w900,
          fontSize: widget.style == PriceDisplayStyle.banner ? 22 : 16,
        );
    final oldStyle = widget.oldPriceStyle ??
        TextStyle(
          color: widget.foreground.withValues(alpha: 0.75),
          fontWeight: FontWeight.w700,
          fontSize: widget.style == PriceDisplayStyle.banner ? 14 : 12,
          decoration: TextDecoration.lineThrough,
          decorationColor: widget.foreground.withValues(alpha: 0.85),
          decorationThickness: 2,
        );

    final children = <Widget>[];

    children.add(
      Wrap(
        crossAxisAlignment: WrapCrossAlignment.end,
        spacing: 8,
        runSpacing: 4,
        children: [
          if (oldPriceText != null) Text(oldPriceText, style: oldStyle),
          Text(priceText, style: priceStyle),
          if (widget.hint != null && widget.hint!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 2),
              child: Text(
                widget.hint!,
                style: TextStyle(
                  color: widget.foreground.withValues(alpha: 0.85),
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
    );

    if (hasPromo) {
      final promoBg = widget.promoBadgeBg ?? const Color(0xFFFBBF24);
      final promoTxt = widget.promoBadgeText ?? const Color(0xFF7C2D12);
      children.add(const SizedBox(height: 6));
      children.add(
        Wrap(
          spacing: 6,
          runSpacing: 4,
          children: [
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: promoBg,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.local_offer_rounded, size: 12, color: promoTxt),
                  const SizedBox(width: 4),
                  Text(
                    label?.isNotEmpty == true ? label! : 'PROMO',
                    style: TextStyle(
                      color: promoTxt,
                      fontSize: 10.5,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.4,
                    ),
                  ),
                ],
              ),
            ),
            if (countdown != null)
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: widget.foreground.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: widget.foreground.withValues(alpha: 0.35),
                    width: 1,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.timer_outlined,
                        size: 12, color: widget.foreground),
                    const SizedBox(width: 4),
                    Text(
                      countdown,
                      style: TextStyle(
                        color: widget.foreground,
                        fontSize: 10.5,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: children,
    );
  }
}
