import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../theme/app_theme.dart';
import 'tabs/home_tab.dart';
import 'tabs/direct_tab.dart';
import 'tabs/pro_tab.dart';
import 'tabs/profile_tab.dart';
import 'tabs/about_tab.dart';

/// Squelette principal de l'application : 5 onglets de navigation
/// 1. Accueil      → Dashboard
/// 2. Direct       → 12 dossiers directs
/// 3. Pro          → 17 dossiers pros
/// 4. Profil       → Infos utilisateur
/// 5. À propos     → 3 sous-pages
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
      body: IndexedStack(
        index: _index,
        children: pages,
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
            children: const [
              _NavItem(
                index: 0,
                svgPath: 'assets/icons/nav_home.svg',
                fallbackIcon: Icons.home_rounded,
                label: 'Accueil',
              ),
              _NavItem(
                index: 1,
                svgPath: 'assets/icons/nav_direct.svg',
                fallbackIcon: Icons.school_rounded,
                label: 'Direct',
              ),
              _NavItem(
                index: 2,
                svgPath: 'assets/icons/nav_pro.svg',
                fallbackIcon: Icons.work_rounded,
                label: 'Pro',
              ),
              _NavItem(
                index: 3,
                svgPath: 'assets/icons/nav_profil.svg',
                fallbackIcon: Icons.person_rounded,
                label: 'Profil',
              ),
              _NavItem(
                index: 4,
                svgPath: 'assets/icons/nav_apropos.svg',
                fallbackIcon: Icons.info_rounded,
                label: 'À propos',
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final int index;
  final String svgPath;
  final IconData fallbackIcon;
  final String label;

  const _NavItem({
    required this.index,
    required this.svgPath,
    required this.fallbackIcon,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    final shell = MainShell.of(context);
    final active = shell?._index == index;
    final color = active ? AppColors.primary : const Color(0xFF6B7280);

    return Expanded(
      child: InkWell(
        onTap: () => shell?.goTo(index),
        borderRadius: BorderRadius.circular(16),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
          decoration: BoxDecoration(
            color: active
                ? AppColors.primary.withValues(alpha: 0.10)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: 26,
                height: 26,
                child: SvgPicture.asset(
                  svgPath,
                  width: 26,
                  height: 26,
                  colorFilter: ColorFilter.mode(color, BlendMode.srcIn),
                  placeholderBuilder: (_) => Icon(
                    fallbackIcon,
                    size: 24,
                    color: color,
                  ),
                ),
              ),
              const SizedBox(height: 3),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: active ? FontWeight.w800 : FontWeight.w600,
                  color: color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
