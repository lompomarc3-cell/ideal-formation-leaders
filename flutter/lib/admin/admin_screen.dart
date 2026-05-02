import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/auth_service.dart';
import '../theme/app_theme.dart';

import 'sections/admin_stats_section.dart';
import 'sections/admin_users_section.dart';
import 'sections/admin_payments_section.dart';
import 'sections/admin_questions_section.dart';
import 'sections/admin_dissertations_section.dart';
import 'sections/admin_categories_section.dart';
import 'sections/admin_schedules_section.dart';
import 'sections/admin_prices_section.dart';
import 'sections/admin_promotions_section.dart';
import 'sections/admin_change_password_section.dart';

/// Panneau d'administration complet (équivalent pages/admin/index.js).
/// 10 sections : Stats, Utilisateurs, Paiements, Questions QCM, Dissertations,
/// Catégories, Programmation, Prix, Promotions, Changement mot de passe.
class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  int _tab = 0;

  static const List<_AdminTab> _tabs = [
    _AdminTab('📊 Tableau de bord', Icons.dashboard),
    _AdminTab('💳 Paiements', Icons.payment),
    _AdminTab('👥 Utilisateurs', Icons.people),
    _AdminTab('❓ Questions QCM', Icons.quiz),
    _AdminTab('📝 Dissertations', Icons.edit_note),
    _AdminTab('📚 Catégories', Icons.category),
    _AdminTab('🗓️ Programmation', Icons.schedule),
    _AdminTab('💰 Prix', Icons.price_change),
    _AdminTab('🎁 Promotions', Icons.local_offer),
    _AdminTab('🔐 Mot de passe', Icons.lock),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthService>();
      if (!auth.isAdmin) {
        Navigator.of(context).pushReplacementNamed('/main');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('🛠️ Panneau Admin'),
        backgroundColor: AppColors.darkTerracotta,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          _buildTabBar(),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      color: AppColors.darkTerracotta,
      height: 54,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 8),
        itemCount: _tabs.length,
        itemBuilder: (context, i) {
          final active = _tab == i;
          return InkWell(
            onTap: () => setState(() => _tab = i),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: active
                        ? AppColors.secondary
                        : Colors.transparent,
                    width: 3,
                  ),
                ),
              ),
              child: Text(
                _tabs[i].label,
                style: TextStyle(
                  color: active ? AppColors.secondary : Colors.white70,
                  fontWeight: FontWeight.w800,
                  fontSize: 13,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildBody() {
    switch (_tab) {
      case 0:
        return const AdminStatsSection();
      case 1:
        return const AdminPaymentsSection();
      case 2:
        return const AdminUsersSection();
      case 3:
        return const AdminQuestionsSection();
      case 4:
        return const AdminDissertationsSection();
      case 5:
        return const AdminCategoriesSection();
      case 6:
        return const AdminSchedulesSection();
      case 7:
        return const AdminPricesSection();
      case 8:
        return const AdminPromotionsSection();
      case 9:
        return const AdminChangePasswordSection();
    }
    return const SizedBox.shrink();
  }
}

class _AdminTab {
  final String label;
  final IconData icon;
  const _AdminTab(this.label, this.icon);
}
