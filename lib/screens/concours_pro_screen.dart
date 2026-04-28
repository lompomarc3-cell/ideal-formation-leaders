import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/dossier.dart';
import '../services/auth_service.dart';
import '../services/dossiers_service.dart';
import '../theme/app_theme.dart';
import '../widgets/dossier_card.dart';
import 'auth/login_screen.dart';
import 'payment_screen.dart';
import 'qcm_screen.dart';

class ConcoursProScreen extends StatefulWidget {
  const ConcoursProScreen({super.key});

  @override
  State<ConcoursProScreen> createState() => _ConcoursProScreenState();
}

class _ConcoursProScreenState extends State<ConcoursProScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DossiersService>().loadDossiers();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final dossiersSrv = context.watch<DossiersService>();
    final paid = dossiersSrv.proPaid;
    final bonus = dossiersSrv.proBonus;
    final hasAnyPro = auth.currentUser?.hasAnyProSubscription ?? false;

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () =>
              context.read<DossiersService>().loadDossiers(force: true),
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [AppColors.accent, Color(0xFFE0405E)],
                              ),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(
                              Icons.work_rounded,
                              color: Colors.white,
                              size: 24,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Concours professionnels',
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                                Text(
                                  '${paid.length} payants + ${bonus.length} bonus',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      _buildInfoBanner(hasAnyPro),
                      const SizedBox(height: 18),
                      Row(
                        children: [
                          const Icon(Icons.workspace_premium_rounded,
                              size: 18, color: AppColors.accent),
                          const SizedBox(width: 6),
                          Text(
                            'Dossiers payants (${paid.length})',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.accent,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text(
                              '20 000 FCFA / dossier',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                    ],
                  ),
                ),
              ),
              if (dossiersSrv.loading && paid.isEmpty && bonus.isEmpty)
                const SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(child: CircularProgressIndicator()),
                )
              else ...[
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  sliver: SliverGrid(
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 0.82,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, i) {
                        final d = paid[i];
                        final unlocked = auth.isDossierUnlocked(d.id, d.type);
                        return DossierCard(
                          dossier: d,
                          isUnlocked: unlocked,
                          onTap: () => _onDossierTap(context, d, unlocked),
                        );
                      },
                      childCount: paid.length,
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                    child: Row(
                      children: [
                        const Icon(Icons.card_giftcard_rounded,
                            size: 18, color: AppColors.secondary),
                        const SizedBox(width: 6),
                        Text(
                          'Bonus offerts (${bonus.length})',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.secondary,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text(
                            'Inclus avec tout achat pro',
                            style: TextStyle(
                              color: Colors.black87,
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                  sliver: SliverGrid(
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 0.82,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, i) {
                        final d = bonus[i];
                        final unlocked = auth.isDossierUnlocked(d.id, d.type);
                        return DossierCard(
                          dossier: d,
                          isUnlocked: unlocked,
                          onTap: () => _onDossierTap(context, d, unlocked),
                        );
                      },
                      childCount: bonus.length,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoBanner(bool hasAnyPro) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: hasAnyPro
              ? [AppColors.success, const Color(0xFF059669)]
              : [AppColors.accent, const Color(0xFFB91C1C)],
        ),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                hasAnyPro
                    ? Icons.verified_rounded
                    : Icons.info_outline_rounded,
                color: Colors.white,
                size: 22,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  hasAnyPro
                      ? 'Abonnement(s) pro activé(s)'
                      : 'Comment ça marche ?',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            '• Payez 20 000 FCFA pour un dossier payant\n'
            '• Vous débloquez ce dossier + les 3 bonus offerts\n'
            '• Vous pouvez acheter plusieurs dossiers payants',
            style: TextStyle(
              color: Colors.white,
              fontSize: 12,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  void _onDossierTap(BuildContext context, Dossier d, bool unlocked) {
    final auth = context.read<AuthService>();
    if (auth.currentUser == null) {
      _showLoginDialog(context);
      return;
    }

    if (!unlocked && d.type == 'pro_paid') {
      _showPaymentDialog(context, d);
      return;
    }

    if (!unlocked && d.type == 'pro_bonus') {
      _showBonusLockedDialog(context);
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => QcmScreen(
          dossier: d,
          isUnlocked: unlocked,
        ),
      ),
    );
  }

  void _showLoginDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Connexion requise'),
        content: const Text('Connectez-vous pour accéder aux dossiers.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Plus tard'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const LoginScreen()),
              );
            },
            child: const Text('Se connecter'),
          ),
        ],
      ),
    );
  }

  void _showPaymentDialog(BuildContext context, Dossier d) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(d.icon, color: d.color),
            const SizedBox(width: 8),
            const Expanded(child: Text('Dossier verrouillé')),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(d.name,
                style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            const Text(
              'Payez 20 000 FCFA pour débloquer ce dossier et profiter des 3 bonus offerts.',
              style: TextStyle(fontSize: 13),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Annuler'),
          ),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => PaymentScreen(
                    offerName: d.name,
                    amount: 20000,
                    packageId: d.id,
                  ),
                ),
              );
            },
            icon: const Icon(Icons.payment_rounded, size: 18),
            label: const Text('Payer'),
          ),
        ],
      ),
    );
  }

  void _showBonusLockedDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Bonus verrouillé'),
        content: const Text(
            'Achetez n\'importe quel dossier payant (20 000 FCFA) pour débloquer automatiquement les 3 dossiers bonus.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
}
