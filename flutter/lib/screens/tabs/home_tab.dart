import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';

import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';
import '../main_shell.dart';

const String kAppUrl = 'https://ideal-formation-leaders.pages.dev';
const String kWhatsApp = '22676223962';

/// Onglet 1 : Accueil / Dashboard.
/// - Présente clairement les 2 offres
/// - Démo gratuite (10 questions sans connexion)
/// - Boutons "Voir les dossiers" → onglets concernés
class HomeTab extends StatefulWidget {
  const HomeTab({super.key});

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  Future<void> _share() async {
    const txt =
        '🎓 Préparez vos concours du Burkina Faso avec IFL !\n\n'
        '✅ Des milliers de QCM\n'
        '✅ Concours directs – 12 dossiers (5 000 FCFA)\n'
        '✅ Concours professionnels – 17 dossiers (20 000 FCFA / dossier)\n'
        '✅ 5 questions gratuites par dossier sans inscription\n\n'
        '👉 $kAppUrl';
    try {
      await Share.share(txt, subject: 'IFL – Formation Burkina Faso');
    } catch (_) {
      final uri = Uri.parse('https://wa.me/?text=${Uri.encodeComponent(txt)}');
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _openWhatsApp() async {
    final uri = Uri.parse('https://wa.me/$kWhatsApp');
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();

    return Scaffold(
      backgroundColor: AppColors.lightBg,
      floatingActionButton: FloatingActionButton(
        onPressed: _openWhatsApp,
        backgroundColor: AppColors.whatsapp,
        tooltip: 'WhatsApp',
        child: const Icon(Icons.chat, color: Colors.white),
      ),
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildHeader(auth),
              const SizedBox(height: 8),
              _buildDemoCard(),
              const SizedBox(height: 12),
              _buildOfferDirect(),
              const SizedBox(height: 12),
              _buildOfferPro(),
              const SizedBox(height: 12),
              _buildPaymentInfo(),
              const SizedBox(height: 12),
              _buildShareCard(),
              const SizedBox(height: 80),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(AuthService auth) {
    final user = auth.user;
    final name = user != null
        ? '${user.prenom ?? ''} ${user.nom ?? ''}'.trim()
        : null;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
      decoration: const BoxDecoration(gradient: AppColors.primaryGradient),
      child: Column(
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Image.asset(
                  'assets/logo.png',
                  width: 48,
                  height: 48,
                  fit: BoxFit.cover,
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'IFL',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 22,
                        letterSpacing: 1.2,
                      ),
                    ),
                    Text(
                      'Idéale Formation of Leaders',
                      style: TextStyle(
                        color: Color(0xFFFFE0A0),
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: _share,
                tooltip: 'Partager',
                icon: const Icon(Icons.share_rounded, color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 22),
          Text(
            name != null && name.isNotEmpty
                ? 'Bonjour, $name 👋'
                : 'Réussissez vos concours\ndu Burkina Faso 🎓',
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w900,
              fontSize: 22,
              height: 1.3,
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            'Des milliers de QCM • 5 questions gratuites par dossier',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFFFFE0A0), fontSize: 13),
          ),
          const SizedBox(height: 18),
          if (!auth.isAuthenticated) _buildAuthButtons(),
        ],
      ),
    );
  }

  Widget _buildAuthButtons() {
    return Row(
      children: [
        Expanded(
          child: ElevatedButton(
            onPressed: () => Navigator.of(context).pushNamed('/register'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: AppColors.darkTerracotta,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: const Text(
              "S'inscrire",
              style: TextStyle(fontWeight: FontWeight.w800),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: OutlinedButton(
            onPressed: () => Navigator.of(context).pushNamed('/login'),
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.white,
              side: const BorderSide(color: Colors.white, width: 2),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: const Text(
              'Se connecter',
              style: TextStyle(fontWeight: FontWeight.w800),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDemoCard() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF059669), Color(0xFF10B981)],
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF10B981).withValues(alpha: 0.3),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.25),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(
                    Icons.flash_on_rounded,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '🎁 Démo gratuite',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 17,
                        ),
                      ),
                      Text(
                        '10 questions sans inscription',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => Navigator.of(context).pushNamed('/demo'),
                icon: const Icon(Icons.play_arrow_rounded),
                label: const Text(
                  'Démarrer la démo',
                  style: TextStyle(fontWeight: FontWeight.w900),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: const Color(0xFF059669),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOfferDirect() {
    return _OfferCard(
      title: '📚 Concours directs',
      subtitle: '12 dossiers',
      price: '5 000 FCFA',
      priceHint: 'pour les 12 dossiers',
      bullets: const [
        'Des milliers de QCM',
        '5 premières questions gratuites',
        'Accès complet aux 12 dossiers',
        'Suivi de progression personnalisé',
      ],
      gradient: const LinearGradient(
        colors: [Color(0xFFC4521A), Color(0xFF8B2500)],
      ),
      cta: 'Voir les 12 dossiers',
      onCta: () => MainShell.of(context)?.goTo(1),
    );
  }

  Widget _buildOfferPro() {
    return _OfferCard(
      title: '🎓 Concours professionnels',
      subtitle: '14 dossiers payants + 3 bonus',
      price: '20 000 FCFA',
      priceHint: 'par dossier payant',
      bullets: const [
        'Des milliers de QCM',
        '5 premières questions gratuites',
        '3 bonus : QCM, Actualités, Accompagnement',
        'Bonus débloqués à chaque dossier acheté',
      ],
      gradient: const LinearGradient(
        colors: [Color(0xFFD4A017), Color(0xFFC4521A)],
      ),
      cta: 'Voir les 17 dossiers',
      onCta: () => MainShell.of(context)?.goTo(2),
    );
  }

  Widget _buildPaymentInfo() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFFFE4CC)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.payment_rounded, color: AppColors.primary),
                SizedBox(width: 8),
                Text(
                  '💳 Paiement Orange Money',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Text(
              'Paiement simple en 3 étapes :',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
            ),
            const SizedBox(height: 8),
            _stepRow(1, 'Composez *144*10*76223962# et payez'),
            _stepRow(2, "Prenez une capture d'écran de la confirmation"),
            _stepRow(3, 'Envoyez-la sur WhatsApp +226 76 22 39 62'),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => Navigator.of(context).pushNamed('/payment'),
                icon: const Icon(Icons.flash_on_rounded),
                label: const Text(
                  'Procéder au paiement',
                  style: TextStyle(fontWeight: FontWeight.w800),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _stepRow(int n, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 22,
            height: 22,
            decoration: const BoxDecoration(
              color: AppColors.primary,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(
              '$n',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: 12,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 13, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShareCard() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFFFE4CC)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              '📢 Aidez les autres candidats',
              style: TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 15,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Partagez IFL avec un ami, un collègue, un proche.',
              style: TextStyle(
                color: Color(0xFF6B7280),
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _share,
              icon: const Icon(Icons.share_rounded),
              label: const Text("Partager l'application"),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primary,
                side: const BorderSide(color: AppColors.primary, width: 2),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OfferCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String price;
  final String priceHint;
  final List<String> bullets;
  final LinearGradient gradient;
  final String cta;
  final VoidCallback onCta;

  const _OfferCard({
    required this.title,
    required this.subtitle,
    required this.price,
    required this.priceHint,
    required this.bullets,
    required this.gradient,
    required this.cta,
    required this.onCta,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(22),
          boxShadow: [
            BoxShadow(
              color: gradient.colors.first.withValues(alpha: 0.35),
              blurRadius: 18,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: 18,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.9),
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 14),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  Text(
                    price,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 22,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      priceHint,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.95),
                        fontSize: 11,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            ...bullets.map(
              (b) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 3),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.check_circle_rounded,
                      color: Colors.white,
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        b,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12.5,
                          height: 1.4,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),
            ElevatedButton(
              onPressed: onCta,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: AppColors.darkTerracotta,
                padding: const EdgeInsets.symmetric(vertical: 13),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Text(
                cta,
                style: const TextStyle(fontWeight: FontWeight.w900),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
