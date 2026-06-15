import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../theme/app_theme.dart';
import 'tabs/home_tab.dart';
import 'tabs/direct_tab.dart';
import 'tabs/pro_tab.dart';
import 'tabs/profile_tab.dart';
import 'tabs/about_tab.dart';

/// Squelette principal de l'application : 5 onglets de navigation.
/// 1. Accueil      → Dashboard            (orange)
/// 2. Direct       → 12 dossiers directs  (orange)
/// 3. Pro          → 29 dossiers pros     (bleu ciel)
/// 4. Profil       → Infos utilisateur    (orange)
/// 5. À propos     → 3 sous-pages         (orange)
class MainShell extends StatefulWidget {
  final int initialIndex;
  const MainShell({super.key, this.initialIndex = 0});

  @override
  State<MainShell> createState() => MainShellState();

  /// Permet à n'importe quel descendant de naviguer entre les onglets.
  static MainShellState? of(BuildContext context) =>
      context.findAncestorStateOfType<MainShellState>();
}

class MainShellState extends State<MainShell> {
  late int _index;

  @override
  void initState() {
    super.initState();
    _index = widget.initialIndex;
  }

  void goTo(int index) {
    if (!mounted) return;
    setState(() => _index = index);
  }

  // Couleur active spécifique à chaque onglet
  static const _navColors = <Color>[
    AppColors.primary,        // Accueil  → orange
    AppColors.primary,        // Direct   → orange
    Color(0xFF0EA5E9),         // Pro      → bleu ciel
    AppColors.primary,        // Profil   → orange
    Color(0xFFF5871F),         // À propos → orange clair
  ];

  @override
  Widget build(BuildContext context) {
    final pages = const [
      HomeTab(),
      DirectTab(),
      ProTab(),
      ProfileTab(),
      AboutTab(),
    ];

    return Scaffold(
      backgroundColor: AppColors.lightBg,
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 280),
        switchInCurve: Curves.easeOut,
        switchOutCurve: Curves.easeIn,
        transitionBuilder: (child, anim) {
          return FadeTransition(
            opacity: anim,
            child: SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(0, 0.04),
                end: Offset.zero,
              ).animate(anim),
              child: child,
            ),
          );
        },
        child: KeyedSubtree(
          key: ValueKey<int>(_index),
          child: pages[_index],
        ),
      ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildBottomNav() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.10),
            blurRadius: 18,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _NavItem(
                index: 0,
                svgPath: 'assets/icons/nav_home.svg',
                fallbackIcon: Icons.home_rounded,
                label: 'Accueil',
                activeColor: _navColors[0],
              ),
              _NavItem(
                index: 1,
                svgPath: 'assets/icons/nav_direct.svg',
                fallbackIcon: Icons.school_rounded,
                label: 'Direct',
                activeColor: _navColors[1],
              ),
              _NavItem(
                index: 2,
                svgPath: 'assets/icons/nav_pro.svg',
                fallbackIcon: Icons.work_rounded,
                label: 'Pro',
                activeColor: _navColors[2],
              ),
              _NavItem(
                index: 3,
                svgPath: 'assets/icons/nav_profil.svg',
                fallbackIcon: Icons.person_rounded,
                label: 'Profil',
                activeColor: _navColors[3],
              ),
              _NavItem(
                index: 4,
                svgPath: 'assets/icons/nav_apropos.svg',
                fallbackIcon: Icons.info_rounded,
                label: 'À propos',
                activeColor: _navColors[4],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Item de navigation animé : scale + couleur + indicateur supérieur + ripple
class _NavItem extends StatefulWidget {
  final int index;
  final String svgPath;
  final IconData fallbackIcon;
  final String label;
  final Color activeColor;

  const _NavItem({
    required this.index,
    required this.svgPath,
    required this.fallbackIcon,
    required this.label,
    required this.activeColor,
  });

  @override
  State<_NavItem> createState() => _NavItemState();
}

class _NavItemState extends State<_NavItem>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 280),
    );
    _scaleAnim = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.25), weight: 50),
      TweenSequenceItem(tween: Tween(begin: 1.25, end: 1.0), weight: 50),
    ]).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOut));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _handleTap(MainShellState? shell) {
    if (shell == null) return;
    if (shell._index != widget.index) {
      _ctrl.forward(from: 0);
    }
    shell.goTo(widget.index);
  }

  @override
  Widget build(BuildContext context) {
    final shell = MainShell.of(context);
    final active = shell?._index == widget.index;
    final color = active ? widget.activeColor : const Color(0xFF6B7280);

    return Expanded(
      child: InkWell(
        onTap: () => _handleTap(shell),
        borderRadius: BorderRadius.circular(16),
        splashColor: widget.activeColor.withValues(alpha: 0.20),
        highlightColor: widget.activeColor.withValues(alpha: 0.08),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 260),
          curve: Curves.easeOut,
          padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
          decoration: BoxDecoration(
            color: active
                ? widget.activeColor.withValues(alpha: 0.12)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(16),
            boxShadow: active
                ? [
                    BoxShadow(
                      color: widget.activeColor.withValues(alpha: 0.18),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ]
                : null,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Indicateur supérieur (petit point/barre)
              AnimatedContainer(
                duration: const Duration(milliseconds: 260),
                height: 3,
                width: active ? 22 : 0,
                margin: const EdgeInsets.only(bottom: 4),
                decoration: BoxDecoration(
                  color: widget.activeColor,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              ScaleTransition(
                scale: _scaleAnim,
                child: AnimatedScale(
                  duration: const Duration(milliseconds: 260),
                  scale: active ? 1.08 : 1.0,
                  curve: Curves.easeOut,
                  child: SizedBox(
                    width: 26,
                    height: 26,
                    child: SvgPicture.asset(
                      widget.svgPath,
                      width: 26,
                      height: 26,
                      colorFilter: ColorFilter.mode(color, BlendMode.srcIn),
                      placeholderBuilder: (_) => Icon(
                        widget.fallbackIcon,
                        size: 24,
                        color: color,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 3),
              AnimatedDefaultTextStyle(
                duration: const Duration(milliseconds: 220),
                style: TextStyle(
                  fontSize: active ? 11.5 : 10.5,
                  fontWeight: active ? FontWeight.w900 : FontWeight.w600,
                  color: color,
                  letterSpacing: active ? 0.3 : 0,
                ),
                child: Text(
                  widget.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
