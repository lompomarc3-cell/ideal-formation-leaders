// lib/screens/admin/admin_dashboard_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../services/categorie_service.dart';
import '../../services/paiement_service.dart';
import 'admin_upload_qcm_screen.dart';
import 'admin_prix_screen.dart';
import 'admin_paiements_screen.dart';
import 'admin_questions_screen.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  int _tab = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CategorieService>().loadAll();
      context.read<PaiementService>().loadPaiementsEnAttente();
    });
  }

  @override
  Widget build(BuildContext context) {
    final catService = context.watch<CategorieService>();
    final paiService = context.watch<PaiementService>();

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: AppTheme.secondaryColor,
        foregroundColor: Colors.white,
        title: const Text('Espace Administrateur IFL'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            color: AppTheme.secondaryColor,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildTab(0, 'Tableau', Icons.dashboard_rounded),
                  _buildTab(1, 'QCM', Icons.upload_file_rounded),
                  _buildTab(2, 'Paiements',
                      Icons.payment_rounded,
                      badge: paiService.paiementsEnAttente.length),
                  _buildTab(3, 'Prix', Icons.attach_money_rounded),
                ],
              ),
            ),
          ),
        ),
      ),
      body: IndexedStack(
        index: _tab,
        children: [
          _buildOverview(catService, paiService),
          const AdminUploadQcmScreen(),
          const AdminPaiementsScreen(),
          const AdminPrixScreen(),
        ],
      ),
    );
  }

  Widget _buildTab(int index, String label, IconData icon, {int badge = 0}) {
    final isSelected = _tab == index;
    return GestureDetector(
      onTap: () => setState(() => _tab = index),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: isSelected ? Colors.white : Colors.transparent,
              width: 3,
            ),
          ),
        ),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Row(
              children: [
                Icon(icon,
                    size: 16,
                    color: isSelected
                        ? Colors.white
                        : Colors.white.withValues(alpha: 0.6)),
                const SizedBox(width: 6),
                Text(
                  label,
                  style: TextStyle(
                    color: isSelected
                        ? Colors.white
                        : Colors.white.withValues(alpha: 0.6),
                    fontWeight: isSelected
                        ? FontWeight.w700
                        : FontWeight.w500,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
            if (badge > 0)
              Positioned(
                right: -8,
                top: -6,
                child: Container(
                  width: 18,
                  height: 18,
                  decoration: const BoxDecoration(
                    color: AppTheme.errorColor,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      '$badge',
                      style: const TextStyle(
                          color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildOverview(CategorieService catService, PaiementService paiService) {
    final directCats = catService.directCategories;
    final profCats = catService.professionnelCategories;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Bannière admin
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppTheme.secondaryColor, Color(0xFFD4A017)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Row(
              children: [
                Icon(Icons.admin_panel_settings, color: Colors.white, size: 32),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Tableau de bord IFL',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Gérez les QCM, prix et validations',
                        style: TextStyle(color: Colors.white70, fontSize: 13),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Stats
          Row(
            children: [
              Expanded(child: _buildStatCard('${directCats.length}', 'Direct', AppTheme.directColor)),
              const SizedBox(width: 10),
              Expanded(child: _buildStatCard('${profCats.length}', 'Prof.', AppTheme.professionnelColor)),
              const SizedBox(width: 10),
              Expanded(child: _buildStatCard(
                '${paiService.paiementsEnAttente.length}',
                'En attente',
                AppTheme.errorColor,
              )),
            ],
          ),
          const SizedBox(height: 20),

          // Actions rapides
          const Text(
            'Actions rapides',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: _buildActionCard(
                  icon: Icons.upload_file_rounded,
                  label: 'Upload QCM en masse',
                  color: AppTheme.directColor,
                  onTap: () => setState(() => _tab = 1),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildActionCard(
                  icon: Icons.payment_rounded,
                  label: 'Valider paiements',
                  color: AppTheme.errorColor,
                  onTap: () => setState(() => _tab = 2),
                  badge: paiService.paiementsEnAttente.length,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _buildActionCard(
                  icon: Icons.attach_money_rounded,
                  label: 'Modifier les prix',
                  color: AppTheme.secondaryColor,
                  onTap: () => setState(() => _tab = 3),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildActionCard(
                  icon: Icons.quiz_rounded,
                  label: 'Voir questions',
                  color: AppTheme.professionnelColor,
                  onTap: () => _showSelectDossier(context, catService),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Liste concours direct
          _buildSectionHeader('Concours Direct (10 dossiers)', AppTheme.directColor),
          const SizedBox(height: 8),
          ...directCats.map((c) => _buildDossierTile(context, c.id, c.nom,
              AppTheme.directColor, c.questionCount)),
          const SizedBox(height: 16),

          // Liste concours professionnel
          _buildSectionHeader('Concours Professionnel (12 dossiers)', AppTheme.professionnelColor),
          const SizedBox(height: 8),
          ...profCats.map((c) => _buildDossierTile(context, c.id, c.nom,
              AppTheme.professionnelColor, c.questionCount)),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildStatCard(String value, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 6,
          ),
        ],
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
          Text(
            label,
            style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildActionCard({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
    int badge = 0,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: color.withValues(alpha: 0.2)),
            ),
            child: Column(
              children: [
                Icon(icon, color: color, size: 28),
                const SizedBox(height: 8),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: color,
                    fontWeight: FontWeight.w600,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
          if (badge > 0)
            Positioned(
              right: -4,
              top: -4,
              child: Container(
                width: 22,
                height: 22,
                decoration: const BoxDecoration(
                  color: AppTheme.errorColor,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    '$badge',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, Color color) {
    return Row(
      children: [
        Container(width: 4, height: 18, color: color,
            margin: const EdgeInsets.only(right: 8)),
        Text(
          title,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildDossierTile(
      BuildContext context, String id, String nom, Color color, int qCount) {
    return GestureDetector(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => AdminQuestionsScreen(
            categorieId: id,
            categorieNom: nom,
            color: color,
          ),
        ),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 6),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.15)),
        ),
        child: Row(
          children: [
            Icon(Icons.folder_rounded, color: color, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                nom,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textPrimary,
                ),
              ),
            ),
            Text(
              '$qCount QCM',
              style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w600),
            ),
            const SizedBox(width: 8),
            Icon(Icons.arrow_forward_ios, size: 12, color: color),
          ],
        ),
      ),
    );
  }

  void _showSelectDossier(BuildContext ctx, CategorieService catService) {
    showModalBottomSheet(
      context: ctx,
      isScrollControlled: true,
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        expand: false,
        builder: (_, scrollCtrl) => Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              child: const Text(
                'Choisir un dossier',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
              ),
            ),
            Expanded(
              child: ListView(
                controller: scrollCtrl,
                children: [
                  ...catService.directCategories.map((c) => ListTile(
                    leading: const Icon(Icons.folder, color: AppTheme.directColor),
                    title: Text(c.nom),
                    subtitle: const Text('Concours Direct'),
                    onTap: () {
                      Navigator.pop(ctx);
                      Navigator.push(
                        ctx,
                        MaterialPageRoute(
                          builder: (_) => AdminQuestionsScreen(
                            categorieId: c.id,
                            categorieNom: c.nom,
                            color: AppTheme.directColor,
                          ),
                        ),
                      );
                    },
                  )),
                  ...catService.professionnelCategories.map((c) => ListTile(
                    leading: const Icon(Icons.folder, color: AppTheme.professionnelColor),
                    title: Text(c.nom),
                    subtitle: const Text('Concours Professionnel'),
                    onTap: () {
                      Navigator.pop(ctx);
                      Navigator.push(
                        ctx,
                        MaterialPageRoute(
                          builder: (_) => AdminQuestionsScreen(
                            categorieId: c.id,
                            categorieNom: c.nom,
                            color: AppTheme.professionnelColor,
                          ),
                        ),
                      );
                    },
                  )),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
