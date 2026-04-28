import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'tabs/home_tab.dart';
import 'tabs/direct_tab.dart';
import 'tabs/pro_tab.dart';
import 'tabs/profile_tab.dart';
import 'tabs/about_tab.dart';

/// Squelette principal de l'application : 5 onglets de navigation
/// 1. Accueil
/// 2. Concours direct
/// 3. Concours professionnel
/// 4. Profil
/// 5. À propos
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
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _navItem(0, Icons.home_rounded, 'Accueil'),
              _navItem(1, Icons.school_rounded, 'Direct'),
              _navItem(2, Icons.workspace_premium_rounded, 'Pro'),
              _navItem(3, Icons.person_rounded, 'Profil'),
              _navItem(4, Icons.info_rounded, 'À propos'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _navItem(int index, IconData icon, String label) {
    final active = _index == index;
    return Expanded(
      child: InkWell(
        onTap: () => goTo(index),
        borderRadius: BorderRadius.circular(16),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
          decoration: BoxDecoration(
            color: active
                ? AppColors.primary.withValues(alpha: 0.10)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 24,
                color: active
                    ? AppColors.primary
                    : const Color(0xFF6B7280),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: active ? FontWeight.w800 : FontWeight.w600,
                  color: active
                      ? AppColors.primary
                      : const Color(0xFF6B7280),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
