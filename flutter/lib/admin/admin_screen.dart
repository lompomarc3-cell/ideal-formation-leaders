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
/// 10 sections : Stats, Paiements, Utilisateurs, Questions QCM, Dissertations,
/// Catégories, Programmation, Prix, Promotions, Changement mot de passe.
///
/// AMÉLIORATIONS UX :
/// - Tuiles d'accueil cliquables (au lieu de petites tabs serrées)
/// - Aide contextuelle pour chaque section
/// - Bouton "Retour menu admin" pour revenir à la grille principale
/// - Compteur de demandes en attente bien visible
class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  // -1 = écran d'accueil (grille de tuiles), >=0 = section active
  int _tab = -1;

  // Compteur de paiements en attente (rafraîchi automatiquement)
  int _pendingPayments = 0;
  bool _loadingStats = false;

  static const List<_AdminTab> _tabs = [
    _AdminTab(
      '📊 Tableau de bord',
      Icons.dashboard,
      'Vue d\'ensemble : statistiques, utilisateurs et revenus.',
      Color(0xFF3B82F6),
    ),
    _AdminTab(
      '💳 Paiements',
      Icons.payment,
      'Valider ou rejeter les demandes Direct (5 000 FCFA par an) et Pro (20 000 FCFA par an).',
      Color(0xFF16A34A),
    ),
    _AdminTab(
      '👥 Utilisateurs',
      Icons.people,
      'Gérer les comptes : abonnements, dossiers, suppression.',
      Color(0xFF8B5CF6),
    ),
    _AdminTab(
      '❓ Questions QCM',
      Icons.quiz,
      'Créer / modifier les questions. L\'ordre n\'est jamais modifié.',
      Color(0xFFEA580C),
    ),
    _AdminTab(
      '📝 Dissertations',
      Icons.edit_note,
      'Gérer les dissertations et leurs corrigés.',
      Color(0xFFC026D3),
    ),
    _AdminTab(
      '📚 Catégories',
      Icons.category,
      'Les 34 dossiers pro payants + 3 bonus + 12 dossiers directs.',
      Color(0xFF0891B2),
    ),
    _AdminTab(
      '🗓️ Programmation',
      Icons.schedule,
      'Programmer la fin de validité (jusqu\'à la minute/seconde).',
      Color(0xFFCA8A04),
    ),
    _AdminTab(
      '💰 Prix',
      Icons.price_change,
      'Modifier les prix Direct et Pro.',
      Color(0xFFDC2626),
    ),
    _AdminTab(
      '🎁 Promotions',
      Icons.local_offer,
      'Créer des promotions à durée limitée.',
      Color(0xFFDB2777),
    ),
    _AdminTab(
      '🔐 Mot de passe',
      Icons.lock,
      'Changer votre mot de passe administrateur.',
      Color(0xFF475569),
    ),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthService>();
      if (!auth.isAdmin) {
        Navigator.of(context).pushReplacementNamed('/main');
        return;
      }
      _loadPendingCount();
    });
  }

  Future<void> _loadPendingCount() async {
    if (_loadingStats) return;
    setState(() => _loadingStats = true);
    try {
      final auth = context.read<AuthService>();
      final res = await auth.api.adminPayments(auth.token!);
      final list = (res['payments'] as List? ?? []);
      int pending = 0;
      for (final p in list) {
        final m = Map<String, dynamic>.from(p);
        final s = (m['status'] ?? '').toString().toLowerCase();
        if (s == 'pending') {
          pending++;
        } else if (s.isEmpty && m['valide'] != true) {
          // ancien format : valide=false sans notes admin = pending
          final notes = (m['admin_notes'] ?? m['admin_response'] ?? '')
              .toString()
              .toLowerCase();
          if (!notes.contains('rejet') && !notes.contains('valid')) {
            pending++;
          }
        }
      }
      if (!mounted) return;
      setState(() {
        _pendingPayments = pending;
        _loadingStats = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loadingStats = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isHome = _tab == -1;
    return Scaffold(
      backgroundColor: const Color(0xFFFFF8F0),
      appBar: AppBar(
        backgroundColor: AppColors.darkTerracotta,
        foregroundColor: Colors.white,
        title: Row(
          children: [
            const Text('🛠️ Panneau Admin'),
            if (!isHome) ...[
              const SizedBox(width: 8),
              const Text('›', style: TextStyle(color: Colors.white70)),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  _tabs[_tab].label,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 14),
                ),
              ),
            ],
          ],
        ),
        leading: isHome
            ? IconButton(
                icon: const Icon(Icons.home_rounded),
                tooltip: 'Retour à l\'app',
                onPressed: () =>
                    Navigator.of(context).pushReplacementNamed('/main'),
              )
            : IconButton(
                icon: const Icon(Icons.arrow_back_rounded),
                tooltip: 'Retour menu admin',
                onPressed: () => setState(() => _tab = -1),
              ),
        actions: [
          if (!isHome)
            IconButton(
              icon: const Icon(Icons.dashboard_rounded),
              tooltip: 'Menu admin',
              onPressed: () => setState(() => _tab = -1),
            ),
          IconButton(
            icon: const Icon(Icons.help_outline_rounded),
            tooltip: 'Aide',
            onPressed: _showHelp,
          ),
        ],
      ),
      body: isHome ? _buildHome() : _buildSection(),
    );
  }

  Widget _buildHome() {
    return RefreshIndicator(
      onRefresh: _loadPendingCount,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildWelcomeCard(),
          const SizedBox(height: 16),
          if (_pendingPayments > 0) _buildPendingAlert(),
          if (_pendingPayments > 0) const SizedBox(height: 16),
          const Text(
            'Que souhaitez-vous faire ?',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w900,
              color: AppColors.darkTerracotta,
            ),
          ),
          const SizedBox(height: 12),
          _buildTilesGrid(),
          const SizedBox(height: 24),
          _buildQuickGuide(),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildWelcomeCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.darkTerracotta, AppColors.primary],
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.3),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: const Row(
        children: [
          Icon(Icons.admin_panel_settings_rounded,
              color: Colors.white, size: 38),
          SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Bienvenue dans l\'espace administrateur',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Choisissez une section ci-dessous pour commencer.',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPendingAlert() {
    return InkWell(
      onTap: () => setState(() => _tab = 1),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFFFEF3C7),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFFBBF24), width: 2),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: const BoxDecoration(
                color: Color(0xFFF59E0B),
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: Text(
                '$_pendingPayments',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 18,
                ),
              ),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Demandes de paiement en attente',
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 14,
                      color: Color(0xFF92400E),
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Tapez ici pour valider ou rejeter →',
                    style: TextStyle(
                      fontSize: 12,
                      color: Color(0xFF92400E),
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded,
                color: Color(0xFF92400E), size: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildTilesGrid() {
    return LayoutBuilder(builder: (context, constraints) {
      final width = constraints.maxWidth;
      // Grille responsive : 2 colonnes sur mobile, 3 sur tablette, 4 sur desktop
      int cols = 2;
      if (width >= 700) cols = 3;
      if (width >= 1000) cols = 4;
      return GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: _tabs.length,
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: cols,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.05,
        ),
        itemBuilder: (context, i) {
          final t = _tabs[i];
          final showBadge = i == 1 && _pendingPayments > 0;
          return InkWell(
            onTap: () => setState(() => _tab = i),
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFFFE4CC)),
                boxShadow: [
                  BoxShadow(
                    color: t.color.withValues(alpha: 0.10),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Stack(
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 42,
                        height: 42,
                        decoration: BoxDecoration(
                          color: t.color.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(t.icon, color: t.color, size: 24),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        t.label,
                        style: const TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Expanded(
                        child: Text(
                          t.help,
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 11,
                            color: Color(0xFF6B7280),
                            height: 1.3,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (showBadge)
                    Positioned(
                      top: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDC2626),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          '$_pendingPayments',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 11,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          );
        },
      );
    });
  }

  Widget _buildQuickGuide() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFBFDBFE)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.lightbulb_outline_rounded,
                  color: Color(0xFF1D4ED8), size: 20),
              SizedBox(width: 8),
              Text(
                'Guide rapide',
                style: TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 14,
                  color: Color(0xFF1D4ED8),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          _guideItem('💳',
              'Pour valider un paiement : ouvrez "Paiements" → bouton "Valider" (vert) ou "Rejeter" (rouge).'),
          _guideItem('🎓',
              'Direct (5 000 FCFA par an) → débloque les 12 dossiers directs.'),
          _guideItem('💼',
              'Pro (20 000 FCFA par an) → débloque le dossier choisi + 3 bonus (parmi 34 dossiers).'),
          _guideItem('🗓️',
              'Programmation : choisissez date + heure + minute pour tester.'),
          _guideItem('❓',
              'Modifier une question ne change PAS son ordre dans la liste.'),
        ],
      ),
    );
  }

  Widget _guideItem(String emoji, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 14)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 12, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSection() {
    return Column(
      children: [
        // Aide contextuelle pour la section active
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          color: const Color(0xFFFFF7ED),
          child: Row(
            children: [
              Icon(_tabs[_tab].icon, color: _tabs[_tab].color, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  _tabs[_tab].help,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF7C2D12),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
        Expanded(child: _buildBody()),
      ],
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

  void _showHelp() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.help_outline_rounded, color: AppColors.primary),
            SizedBox(width: 8),
            Text('Aide administrateur'),
          ],
        ),
        content: SizedBox(
          width: 400,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  '📌 Principes de l\'application',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14),
                ),
                const SizedBox(height: 6),
                const Text('• 5 premières questions gratuites par dossier',
                    style: TextStyle(fontSize: 12)),
                const Text('• 27 dossiers professionnels payants + 3 bonus (20 000 FCFA par an chacun)',
                    style: TextStyle(fontSize: 12)),
                const Text(
                    '• Total : 37 dossiers professionnels (34 payants + 3 bonus offerts)',
                    style: TextStyle(fontSize: 12)),
                const Text(
                    '• 3 bonus offerts (Entraînement QCM, Actualités, Accompagnement)',
                    style: TextStyle(fontSize: 12)),
                const Text(
                    '• 12 dossiers directs (5 000 FCFA par an pour tout débloquer)',
                    style: TextStyle(fontSize: 12)),
                const Divider(height: 18),
                const Text(
                  '💳 Valider une demande de paiement',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14),
                ),
                const SizedBox(height: 6),
                const Text(
                    '1. Ouvrez la section "Paiements"\n'
                    '2. Lisez le type (Direct ou Pro) sur la carte\n'
                    '3. Cliquez sur "Valider" (vert) ou "Rejeter" (rouge)\n'
                    '4. Une notification confirme l\'action',
                    style: TextStyle(fontSize: 12, height: 1.5)),
                const Divider(height: 18),
                const Text(
                  '🗓️ Programmer une fin de validité',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14),
                ),
                const SizedBox(height: 6),
                const Text(
                    'Vous pouvez choisir une date, heure, minute et seconde précises. Pratique pour tester rapidement (ex : dans 2 minutes).',
                    style: TextStyle(fontSize: 12, height: 1.5)),
                const Divider(height: 18),
                const Text(
                  '❓ Modifier une question',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14),
                ),
                const SizedBox(height: 6),
                const Text(
                    'L\'ordre des questions n\'est jamais modifié lorsque vous éditez une question. Elle reste à la même place.',
                    style: TextStyle(fontSize: 12, height: 1.5)),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Compris')),
        ],
      ),
    );
  }
}

class _AdminTab {
  final String label;
  final IconData icon;
  final String help;
  final Color color;
  const _AdminTab(this.label, this.icon, this.help, this.color);
}
