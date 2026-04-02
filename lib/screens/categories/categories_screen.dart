// lib/screens/categories/categories_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../models/sous_categorie_model.dart';
import '../../services/categorie_service.dart';
import '../quiz/quiz_screen.dart';

class CategoriesScreen extends StatelessWidget {
  final String typeConcours; // 'direct' ou 'professionnel'

  const CategoriesScreen({super.key, required this.typeConcours});

  @override
  Widget build(BuildContext context) {
    final catService = context.watch<CategorieService>();
    final sousCategories = catService.getSousCategoriesByType(typeConcours);
    final color = typeConcours == 'direct'
        ? AppTheme.directColor
        : AppTheme.professionnelColor;
    final title = typeConcours == 'direct'
        ? 'Concours Direct'
        : 'Concours Professionnel';

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: color,
        title: Text(title),
        leading: Navigator.of(context).canPop()
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => Navigator.of(context).pop(),
              )
            : null,
      ),
      body: catService.isLoading
          ? const Center(child: CircularProgressIndicator())
          : sousCategories.isEmpty
              ? _buildEmpty(color)
              : _buildList(context, sousCategories, color),
    );
  }

  Widget _buildEmpty(Color color) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.folder_open, size: 64, color: color.withValues(alpha: 0.4)),
          const SizedBox(height: 16),
          const Text(
            'Aucun sous-dossier disponible',
            style: TextStyle(
              fontSize: 16,
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Les contenus seront bientôt disponibles',
            style: TextStyle(
              fontSize: 13,
              color: AppTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildList(BuildContext context, List<SousCategorieModel> items,
      Color color) {
    return RefreshIndicator(
      onRefresh: () => context.read<CategorieService>().loadAll(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: items.length,
        itemBuilder: (context, index) {
          final sc = items[index];
          return _buildSousCategorieCard(context, sc, color, index + 1);
        },
      ),
    );
  }

  Widget _buildSousCategorieCard(
    BuildContext context,
    SousCategorieModel sc,
    Color color,
    int number,
  ) {
    return GestureDetector(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => QuizListScreen(
            sousCategorieId: sc.id,
            sousCategorieNom: sc.nom,
            color: color,
          ),
        ),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Numéro
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Text(
                  '$number',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: color,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 14),
            // Contenu
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    sc.nom,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  if (sc.description != null && sc.description!.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      sc.description!,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
            // Flèche
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(Icons.arrow_forward_ios, color: color, size: 14),
            ),
          ],
        ),
      ),
    );
  }
}
