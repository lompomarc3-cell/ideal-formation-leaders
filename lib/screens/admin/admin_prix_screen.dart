// lib/screens/admin/admin_prix_screen.dart
// Gestion des prix par l'administrateur

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../services/categorie_service.dart';

class AdminPrixScreen extends StatefulWidget {
  const AdminPrixScreen({super.key});

  @override
  State<AdminPrixScreen> createState() => _AdminPrixScreenState();
}

class _AdminPrixScreenState extends State<AdminPrixScreen> {
  final _directCtrl = TextEditingController(text: '5000');
  final _profCtrl = TextEditingController(text: '20000');
  bool _isLoading = false;
  String? _message;
  bool _success = false;

  @override
  void initState() {
    super.initState();
    _loadCurrentPrices();
  }

  void _loadCurrentPrices() {
    final catService = context.read<CategorieService>();
    final directCats = catService.directCategories;
    final profCats = catService.professionnelCategories;

    if (directCats.isNotEmpty) {
      _directCtrl.text = directCats.first.prix.toString();
    }
    if (profCats.isNotEmpty) {
      _profCtrl.text = profCats.first.prix.toString();
    }
  }

  Future<void> _savePrices() async {
    final directPrice = int.tryParse(_directCtrl.text.trim());
    final profPrice = int.tryParse(_profCtrl.text.trim());

    if (directPrice == null || profPrice == null || directPrice <= 0 || profPrice <= 0) {
      setState(() {
        _message = 'Veuillez entrer des prix valides (nombres positifs)';
        _success = false;
      });
      return;
    }

    setState(() => _isLoading = true);

    try {
      final catService = context.read<CategorieService>();
      await catService.updateAllPrixByType('direct', directPrice);
      await catService.updateAllPrixByType('professionnel', profPrice);

      setState(() {
        _isLoading = false;
        _message = '✅ Prix mis à jour avec succès !\n• Concours Direct : $directPrice FCFA\n• Concours Professionnel : $profPrice FCFA';
        _success = true;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _message = '❌ Erreur : ${e.toString()}';
        _success = false;
      });
    }
  }

  @override
  void dispose() {
    _directCtrl.dispose();
    _profCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final catService = context.watch<CategorieService>();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Titre
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.secondaryColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.secondaryColor.withValues(alpha: 0.3)),
            ),
            child: const Row(
              children: [
                Icon(Icons.attach_money_rounded, color: AppTheme.secondaryColor, size: 24),
                SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Gestion des Prix',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.secondaryColor,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Modifiez les prix d\'accès aux concours',
                        style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Prix actuels
          const Text(
            'Prix actuels',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _buildCurrentPriceCard(
                  'Concours Direct',
                  catService.directCategories.isNotEmpty
                      ? '${catService.directCategories.first.prix} FCFA'
                      : '5 000 FCFA',
                  AppTheme.directColor,
                  Icons.assignment_rounded,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildCurrentPriceCard(
                  'Concours Pro.',
                  catService.professionnelCategories.isNotEmpty
                      ? '${catService.professionnelCategories.first.prix} FCFA'
                      : '20 000 FCFA',
                  AppTheme.professionnelColor,
                  Icons.workspace_premium_rounded,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Formulaire modification
          const Text(
            'Modifier les prix',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
          ),
          const SizedBox(height: 12),

          // Prix Concours Direct
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppTheme.directColor.withValues(alpha: 0.3)),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.directColor.withValues(alpha: 0.06),
                  blurRadius: 8,
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: AppTheme.directColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.assignment_rounded,
                          color: AppTheme.directColor, size: 18),
                    ),
                    const SizedBox(width: 10),
                    const Text(
                      'Prix Concours Direct',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _directCtrl,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    hintText: '5000',
                    suffixText: 'FCFA',
                    prefixIcon: const Icon(Icons.attach_money,
                        color: AppTheme.directColor, size: 20),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide(
                          color: AppTheme.directColor.withValues(alpha: 0.3)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: AppTheme.directColor),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'S\'applique à tous les 10 sous-dossiers du concours direct',
                  style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Prix Concours Professionnel
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppTheme.professionnelColor.withValues(alpha: 0.3)),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.professionnelColor.withValues(alpha: 0.06),
                  blurRadius: 8,
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: AppTheme.professionnelColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.workspace_premium_rounded,
                          color: AppTheme.professionnelColor, size: 18),
                    ),
                    const SizedBox(width: 10),
                    const Text(
                      'Prix Concours Professionnel',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _profCtrl,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    hintText: '20000',
                    suffixText: 'FCFA',
                    prefixIcon: const Icon(Icons.attach_money,
                        color: AppTheme.professionnelColor, size: 20),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide(
                          color: AppTheme.professionnelColor.withValues(alpha: 0.3)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide:
                          const BorderSide(color: AppTheme.professionnelColor),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'S\'applique à tous les 12 sous-dossiers du concours professionnel',
                  style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Message résultat
          if (_message != null) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: _success
                    ? const Color(0xFFECFDF5)
                    : const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: _success ? const Color(0xFF10B981) : AppTheme.errorColor,
                ),
              ),
              child: Text(
                _message!,
                style: TextStyle(
                  fontSize: 13,
                  color: _success ? const Color(0xFF065F46) : AppTheme.errorColor,
                  fontWeight: FontWeight.w600,
                  height: 1.5,
                ),
              ),
            ),
            const SizedBox(height: 14),
          ],

          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.secondaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              onPressed: _isLoading ? null : _savePrices,
              icon: _isLoading
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.save_rounded),
              label: Text(
                _isLoading ? 'Enregistrement...' : 'ENREGISTRER LES PRIX',
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildCurrentPriceCard(
      String label, String price, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 8),
          Text(
            price,
            style: TextStyle(
              fontSize: 18,
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
}
