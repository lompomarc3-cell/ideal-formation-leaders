// lib/screens/categories/categories_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../models/categorie_model.dart';
import '../../services/auth_service.dart';
import '../../services/categorie_service.dart';
import '../quiz/quiz_screen.dart';
import '../demo/payment_screen.dart';

class CategoriesScreen extends StatelessWidget {
  final String type; // 'direct' ou 'professionnel'

  const CategoriesScreen({super.key, required this.type});

  @override
  Widget build(BuildContext context) {
    final catService = context.watch<CategorieService>();
    final categories = type == 'direct'
        ? catService.directCategories
        : catService.professionnelCategories;

    final color = type == 'direct'
        ? AppTheme.directColor
        : AppTheme.professionnelColor;

    final title = type == 'direct' ? 'Concours Direct' : 'Concours Professionnel';
    final prix = type == 'direct' ? '5 000 FCFA' : '20 000 FCFA';

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
      body: Column(
        children: [
          // En-tête info prix
          Container(
            width: double.infinity,
            color: color.withValues(alpha: 0.08),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            child: Row(
              children: [
                Icon(Icons.info_outline, color: color, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Accès complet au $title : $prix (paiement Orange Money)',
                    style: TextStyle(
                      fontSize: 12,
                      color: color,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: catService.isLoading
                ? const Center(child: CircularProgressIndicator())
                : categories.isEmpty
                    ? _buildEmpty(color)
                    : _buildList(context, categories, color),
          ),
        ],
      ),
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
            'Chargement des dossiers...',
            style: TextStyle(fontSize: 16, color: AppTheme.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _buildList(
      BuildContext context, List<CategorieModel> items, Color color) {
    return RefreshIndicator(
      onRefresh: () => context.read<CategorieService>().loadAll(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: items.length,
        itemBuilder: (context, index) {
          return _buildCategorieCard(context, items[index], color, index + 1);
        },
      ),
    );
  }

  Widget _buildCategorieCard(
    BuildContext context,
    CategorieModel cat,
    Color color,
    int number,
  ) {
    final authService = context.read<AuthService>();
    final user = authService.currentUser;
    final hasAccess = user?.hasCategorieAccess(cat.id) ?? false;
    // Le prix affiché est celui du concours entier (pas par dossier)
    final concoursPrix = type == 'direct' ? '5 000 FCFA' : '20 000 FCFA';

    return GestureDetector(
      onTap: () {
        if (hasAccess) {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => QuizListScreen(
                categorieId: cat.id,
                categorieNom: cat.nom,
                color: color,
              ),
            ),
          );
        } else {
          // Proposer le paiement pour le concours entier
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => PaymentScreen(categorie: cat, concoursPrix: concoursPrix),
            ),
          );
        }
      },
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
          border: hasAccess
              ? Border.all(color: color.withValues(alpha: 0.3))
              : null,
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
                    cat.nom,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      if (!hasAccess)
                        Text(
                          concoursPrix,
                          style: TextStyle(
                            fontSize: 12,
                            color: color,
                            fontWeight: FontWeight.w600,
                          ),
                        )
                      else
                        Text(
                          'Accès débloqué',
                          style: TextStyle(
                            fontSize: 12,
                            color: color,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      if (cat.questionCount > 0) ...[
                        const SizedBox(width: 8),
                        Text(
                          '• ${cat.questionCount} QCM',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            // Icône accès
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: hasAccess
                    ? color.withValues(alpha: 0.12)
                    : Colors.grey.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                hasAccess ? Icons.lock_open_rounded : Icons.lock_rounded,
                color: hasAccess ? color : AppTheme.textSecondary,
                size: 18,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
