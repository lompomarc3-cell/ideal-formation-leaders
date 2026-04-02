// lib/screens/demo/payment_choice_screen.dart
import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../auth/register_screen.dart';

class PaymentChoiceScreen extends StatelessWidget {
  const PaymentChoiceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Choisir votre offre'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),

              // Titre
              const Text(
                'Accès complet aux modules',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Choisissez votre type de concours pour accéder à toutes les questions',
                style: TextStyle(
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 24),

              // Offre Concours Direct
              _buildOfferCard(
                context,
                type: 'direct',
                title: 'Concours Direct',
                subtitle: 'Pour les candidats sans expérience',
                icon: Icons.assignment_rounded,
                color: AppTheme.directColor,
                features: [
                  '10 modules spécialisés',
                  'Culture Générale & Français',
                  'Droit & Administration',
                  'Logique & Mathématiques',
                  'Questions illimitées',
                  'Corrections détaillées',
                ],
                price: '5 000 FCFA/mois',
              ),
              const SizedBox(height: 16),

              // Offre Concours Professionnel
              _buildOfferCard(
                context,
                type: 'professionnel',
                title: 'Concours Professionnel',
                subtitle: 'Pour les agents de la Fonction Publique',
                icon: Icons.workspace_premium_rounded,
                color: AppTheme.professionnelColor,
                features: [
                  '12 modules spécialisés',
                  'Statut Fonction Publique',
                  'Marchés Publics avancés',
                  'Management & Budget',
                  'Questions illimitées',
                  'Corrections détaillées',
                ],
                price: '7 500 FCFA/mois',
                isPopular: true,
              ),
              const SizedBox(height: 16),

              // Offre Tout inclus
              _buildOfferCard(
                context,
                type: 'all',
                title: 'Accès Complet',
                subtitle: 'Tous les concours inclus',
                icon: Icons.star_rounded,
                color: AppTheme.secondaryColor,
                features: [
                  'Tous les 22 modules',
                  'Concours Direct & Professionnel',
                  'Questions illimitées',
                  'Corrections détaillées',
                  'Mises à jour incluses',
                  'Support prioritaire',
                ],
                price: '10 000 FCFA/mois',
              ),
              const SizedBox(height: 24),

              // Note inscription
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: AppTheme.primaryColor.withValues(alpha: 0.15),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.info_outline, color: AppTheme.primaryColor, size: 18),
                        SizedBox(width: 8),
                        Text(
                          'Comment procéder ?',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.primaryColor,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      '1. Créez votre compte gratuitement\n'
                      '2. Choisissez votre offre\n'
                      '3. Effectuez le paiement\n'
                      '4. Accédez immédiatement à tous les modules',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppTheme.textSecondary,
                        height: 1.6,
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => const RegisterScreen(),
                            ),
                          );
                        },
                        icon: const Icon(Icons.person_add_rounded, size: 18),
                        label: const Text('Créer mon compte'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryColor,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOfferCard(
    BuildContext context, {
    required String type,
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required List<String> features,
    required String price,
    bool isPopular = false,
  }) {
    return Stack(
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isPopular ? color : color.withValues(alpha: 0.3),
              width: isPopular ? 2 : 1,
            ),
            boxShadow: [
              BoxShadow(
                color: color.withValues(alpha: 0.12),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(icon, color: color, size: 26),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        Text(
                          subtitle,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Prix
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  price,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: color,
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Features
              ...features.map(
                (f) => Padding(
                  padding: const EdgeInsets.only(bottom: 7),
                  child: Row(
                    children: [
                      Icon(
                        Icons.check_circle_rounded,
                        color: color,
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          f,
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Bouton
              SizedBox(
                width: double.infinity,
                height: 46,
                child: ElevatedButton(
                  onPressed: () => _showPaymentInfo(context, title, price, color),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: color,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: Text(
                    'CHOISIR CETTE OFFRE',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),

        // Badge POPULAIRE
        if (isPopular)
          Positioned(
            top: 12,
            right: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'POPULAIRE',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1,
                ),
              ),
            ),
          ),
      ],
    );
  }

  void _showPaymentInfo(
    BuildContext context,
    String title,
    String price,
    Color color,
  ) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppTheme.dividerColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Souscrire : $title',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              price,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: color,
              ),
            ),
            const SizedBox(height: 20),

            // Modes de paiement
            const Text(
              'Modes de paiement acceptés :',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            _buildPaymentMethod(Icons.phone_android_rounded, 'Orange Money', 'Paiement mobile rapide'),
            const SizedBox(height: 8),
            _buildPaymentMethod(Icons.phone_android_rounded, 'Moov Money', 'Paiement mobile Moov'),
            const SizedBox(height: 8),
            _buildPaymentMethod(Icons.account_balance_rounded, 'Virement bancaire', 'Banque locale'),
            const SizedBox(height: 20),

            // Bouton créer compte
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.of(ctx).pop();
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => const RegisterScreen(),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: color,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: const Text(
                  'CRÉER MON COMPTE & PAYER',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentMethod(IconData icon, String name, String desc) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.backgroundColor,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.dividerColor),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppTheme.primaryColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
                Text(
                  desc,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const Icon(Icons.check_rounded, color: AppTheme.accentColor, size: 18),
        ],
      ),
    );
  }
}
