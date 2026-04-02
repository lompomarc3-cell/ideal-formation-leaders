// lib/screens/admin/admin_dashboard_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../services/categorie_service.dart';
import 'admin_questions_screen.dart';
import 'admin_create_question_screen.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CategorieService>().loadAll();
    });
  }

  @override
  Widget build(BuildContext context) {
    final catService = context.watch<CategorieService>();
    final directSC = catService.getSousCategoriesByType('direct');
    final profSC = catService.getSousCategoriesByType('professionnel');

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: AppTheme.secondaryColor,
        title: const Text('Espace Administrateur CMS',
            style: TextStyle(fontSize: 16)),
        foregroundColor: Colors.white,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
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
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.admin_panel_settings,
                            color: Colors.white, size: 28),
                        SizedBox(width: 10),
                        Text(
                          'Tableau de bord',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Gérez les questions QCM.\nPubliez, modifiez ou supprimez du contenu.',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.white.withValues(alpha: 0.85),
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Stats
              Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      '${directSC.length}',
                      'Dossiers Direct',
                      AppTheme.directColor,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildStatCard(
                      '${profSC.length}',
                      'Dossiers Prof.',
                      AppTheme.professionnelColor,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Bouton ajouter question rapide
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute(
                        builder: (_) => const AdminCreateQuestionScreen()),
                  ),
                  icon: const Icon(Icons.add_circle_outline),
                  label: const Text('PUBLIER UNE NOUVELLE QUESTION'),
                ),
              ),
              const SizedBox(height: 20),

              // Concours Direct
              _buildSectionHeader(
                  'Concours Direct', AppTheme.directColor, directSC.length),
              const SizedBox(height: 10),
              ...directSC.map((sc) => _buildFolderTile(context, sc.id, sc.nom,
                  AppTheme.directColor, sc.description ?? '')),
              const SizedBox(height: 16),

              // Concours Professionnel
              _buildSectionHeader('Concours Professionnel',
                  AppTheme.professionnelColor, profSC.length),
              const SizedBox(height: 10),
              ...profSC.map((sc) => _buildFolderTile(context, sc.id, sc.nom,
                  AppTheme.professionnelColor, sc.description ?? '')),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String value, String label, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
                fontSize: 12, color: AppTheme.textSecondary),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, Color color, int count) {
    return Row(
      children: [
        Container(
          width: 4,
          height: 20,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            title,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            '$count dossiers',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFolderTile(
    BuildContext context,
    String id,
    String nom,
    Color color,
    String description,
  ) {
    return GestureDetector(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => AdminQuestionsScreen(
            sousCategorieId: id,
            sousCategorieNom: nom,
            color: color,
          ),
        ),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border:
              Border.all(color: color.withValues(alpha: 0.2), width: 1),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(Icons.folder_rounded, color: color, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    nom,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  if (description.isNotEmpty)
                    Text(
                      description,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios, size: 14, color: color),
          ],
        ),
      ),
    );
  }
}
