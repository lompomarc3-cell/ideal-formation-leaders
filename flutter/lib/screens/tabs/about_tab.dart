import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';

import '../../theme/app_theme.dart';

const String kAppUrl = 'https://ideal-formation-leaders.pages.dev';
const String kTeamWhatsApp = '22676223962';
const String kDevWhatsApp = '22672662161';
const String kPlayStoreUrl =
    'https://play.google.com/store/apps/details?id=com.myapp.mobile';

/// Onglet 5 : À propos.
/// 3 sous-pages :
/// 5.1 À propos de l'application
/// 5.2 À propos de l'équipe
/// 5.3 À propos du développeur
class AboutTab extends StatelessWidget {
  const AboutTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightBg,
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          child: Column(
            children: [
              _buildHeader(),
              const SizedBox(height: 16),
              _buildMenu(context),
              const SizedBox(height: 90),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 26),
      decoration: const BoxDecoration(gradient: AppColors.primaryGradient),
      child: Column(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: Image.asset(
              'assets/logo.png',
              width: 80,
              height: 80,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'À propos',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w900,
              fontSize: 22,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Idéale Formation of Leaders',
            style: TextStyle(color: Color(0xFFFFE0A0), fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildMenu(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          _menuTile(
            context,
            icon: Icons.apps_rounded,
            title: "L'application",
            subtitle: "Description, partage, évaluation",
            color: const Color(0xFFC4521A),
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const AboutAppPage()),
            ),
          ),
          _menuTile(
            context,
            icon: Icons.groups_2_rounded,
            title: "L'équipe",
            subtitle: "Idéale Formation of Leaders",
            color: const Color(0xFFF5871F),
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const AboutTeamPage()),
            ),
          ),
          _menuTile(
            context,
            icon: Icons.terminal_rounded,
            title: "Le développeur",
            subtitle: "Marc LOMPO",
            color: const Color(0xFF8B2500),
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const AboutDevPage()),
            ),
          ),
        ],
      ),
    );
  }

  Widget _menuTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFFFE4CC)),
            boxShadow: [
              BoxShadow(
                color: color.withValues(alpha: 0.08),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 15,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        color: Color(0xFF6B7280),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded,
                  color: Color(0xFF9CA3AF)),
            ],
          ),
        ),
      ),
    );
  }
}

// ============================================================
// 5.1 — À propos de l'application
// ============================================================

class AboutAppPage extends StatelessWidget {
  const AboutAppPage({super.key});

  Future<void> _share() async {
    const txt =
        '🎓 Préparez vos concours du Burkina Faso avec IFL !\n\n'
        '✅ Des milliers de QCM\n'
        '✅ Concours directs – 12 dossiers (5 000 FCFA)\n'
        '✅ Concours professionnels – 17 dossiers (20 000 FCFA / dossier)\n'
        '✅ 5 questions gratuites par dossier\n\n'
        '👉 $kAppUrl';
    try {
      await Share.share(txt, subject: 'IFL – Formation Burkina Faso');
    } catch (_) {
      final uri =
          Uri.parse('https://wa.me/?text=${Uri.encodeComponent(txt)}');
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _open(String url) async {
    final uri = Uri.parse(url);
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightBg,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          "L'application",
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Center(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(22),
              child: Image.asset(
                'assets/logo.png',
                width: 100,
                height: 100,
                fit: BoxFit.cover,
              ),
            ),
          ),
          const SizedBox(height: 14),
          const Center(
            child: Text(
              'IFL — Idéale Formation of Leaders',
              style: TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 17,
                color: AppColors.darkTerracotta,
              ),
            ),
          ),
          const SizedBox(height: 4),
          const Center(
            child: Text(
              'Version 2.1.0',
              style: TextStyle(color: Color(0xFF6B7280), fontSize: 12),
            ),
          ),
          const SizedBox(height: 18),
          _card(
            icon: Icons.menu_book_rounded,
            title: 'Description',
            child: const Text(
              'Application burkinabè pour les candidats aux concours directs et '
              'professionnels de la fonction publique. Elle propose des '
              'milliers de QCM organisés par dossier, avec 5 questions '
              'gratuites par dossier pour découvrir le contenu, et des '
              'abonnements pour débloquer l\'accès complet.',
              style: TextStyle(fontSize: 13.5, height: 1.5),
            ),
          ),
          const SizedBox(height: 12),
          _card(
            icon: Icons.shield_rounded,
            title: 'Politique de confidentialité',
            child: const Text(
              'Vos données personnelles (téléphone, nom, prénom) sont utilisées '
              'uniquement pour gérer votre compte, votre abonnement et votre '
              'progression. Elles ne sont jamais revendues à des tiers. Les '
              'mots de passe sont stockés sous forme chiffrée. Vous pouvez à '
              'tout moment demander la suppression de votre compte en nous '
              'contactant via WhatsApp.',
              style: TextStyle(fontSize: 13, height: 1.5),
            ),
          ),
          const SizedBox(height: 12),
          _card(
            icon: Icons.gavel_rounded,
            title: 'Règles d\'utilisation',
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '• L\'application est destinée à un usage personnel.',
                  style: TextStyle(fontSize: 13, height: 1.5),
                ),
                Text(
                  '• Les paiements sont validés manuellement par notre équipe '
                  'dans un délai de 24h ouvrées.',
                  style: TextStyle(fontSize: 13, height: 1.5),
                ),
                Text(
                  '• Aucun remboursement après validation du paiement.',
                  style: TextStyle(fontSize: 13, height: 1.5),
                ),
                Text(
                  '• Le contenu (QCM, explications) est protégé par le droit '
                  'd\'auteur.',
                  style: TextStyle(fontSize: 13, height: 1.5),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          _actionButton(
            icon: Icons.share_rounded,
            label: "Partager l'application",
            color: AppColors.primary,
            onTap: _share,
          ),
          const SizedBox(height: 10),
          _actionButton(
            icon: Icons.star_rate_rounded,
            label: 'Évaluer sur Play Store',
            color: AppColors.secondary,
            onTap: () => _open(kPlayStoreUrl),
          ),
          const SizedBox(height: 10),
          _actionButton(
            icon: Icons.send_rounded,
            label: 'Envoyer à un ami (WhatsApp)',
            color: AppColors.whatsapp,
            onTap: () {
              final txt = Uri.encodeComponent(
                  'Salut 👋 Découvre IFL pour préparer tes concours du Burkina : $kAppUrl');
              _open('https://wa.me/?text=$txt');
            },
          ),
          const SizedBox(height: 30),
          const Center(
            child: Text(
              '© YOUGA DIGITAL SERVICE',
              style: TextStyle(
                color: Color(0xFF9CA3AF),
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(height: 10),
        ],
      ),
    );
  }

  Widget _card({
    required String title,
    required Widget child,
    IconData icon = Icons.info_outline_rounded,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFFE4CC)),
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
                  color: AppColors.primary.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon,
                    color: AppColors.primary, size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                    color: AppColors.darkTerracotta,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }

  Widget _actionButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: onTap,
        icon: Icon(icon),
        label: Text(label),
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 14),
        ),
      ),
    );
  }
}

// ============================================================
// 5.2 — À propos de l'équipe
// ============================================================

class AboutTeamPage extends StatelessWidget {
  const AboutTeamPage({super.key});

  Future<void> _whatsApp() async {
    final uri = Uri.parse('https://wa.me/$kTeamWhatsApp');
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightBg,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          "L'équipe",
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFD4A017), Color(0xFFC4521A)],
              ),
              borderRadius: BorderRadius.circular(22),
            ),
            child: const Column(
              children: [
                Icon(Icons.groups_rounded, color: Colors.white, size: 56),
                SizedBox(height: 8),
                Text(
                  'Idéale Formation of Leaders',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 18,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Burkina Faso 🇧🇫',
                  style: TextStyle(
                    color: Color(0xFFFFE0A0),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFFFE4CC)),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '👨‍🏫 Notre mission',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                    color: AppColors.darkTerracotta,
                  ),
                ),
                SizedBox(height: 10),
                Text(
                  'Idéale Formation of Leaders — Une équipe d\'enseignants et '
                  'd\'instructeurs expérimentés au Burkina Faso. Nous '
                  'accompagnons les candidats vers la réussite de leurs '
                  'concours directs et professionnels de la fonction publique.',
                  style: TextStyle(fontSize: 13.5, height: 1.6),
                ),
                SizedBox(height: 12),
                Text(
                  '📚 Notre expertise',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                    color: AppColors.darkTerracotta,
                  ),
                ),
                SizedBox(height: 10),
                Text(
                  'Notre équipe est également auteure de plusieurs livres et '
                  'guides sur les concours directs. Nous mettons toute cette '
                  'expérience pédagogique à votre service à travers des '
                  'milliers de QCM rigoureusement conçus.',
                  style: TextStyle(fontSize: 13.5, height: 1.6),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFFFE4CC)),
            ),
            child: Column(
              children: [
                const Text(
                  '📞 Contacter l\'équipe',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                    color: AppColors.darkTerracotta,
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _whatsApp,
                    icon: const Icon(Icons.chat_rounded),
                    label: const Text('WhatsApp +226 76 22 39 62'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.whatsapp,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

// ============================================================
// 5.3 — À propos du développeur
// ============================================================

class AboutDevPage extends StatelessWidget {
  const AboutDevPage({super.key});

  Future<void> _whatsApp() async {
    final uri = Uri.parse('https://wa.me/$kDevWhatsApp');
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<void> _call() async {
    final uri = Uri.parse('tel:+$kDevWhatsApp');
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightBg,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Le développeur',
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF8B2500), Color(0xFFC4521A)],
              ),
              borderRadius: BorderRadius.circular(22),
            ),
            child: Column(
              children: [
                Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 3),
                  ),
                  child: const Center(
                    child: Text(
                      'ML',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 32,
                        letterSpacing: 2,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                const Text(
                  'Marc LOMPO',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 22,
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 12, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    '💼 Ingénieur en transformation digitale',
                    style: TextStyle(
                      color: Color(0xFFFFE0A0),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Container(
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
                  '📞 Contact',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                    color: AppColors.darkTerracotta,
                  ),
                ),
                const SizedBox(height: 12),
                ElevatedButton.icon(
                  onPressed: _whatsApp,
                  icon: const Icon(Icons.chat_rounded),
                  label: const Text('WhatsApp +226 72 66 21 61'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.whatsapp,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
                const SizedBox(height: 10),
                OutlinedButton.icon(
                  onPressed: _call,
                  icon: const Icon(Icons.call_rounded),
                  label: const Text('Appeler +226 72 66 21 61'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(
                        color: AppColors.primary, width: 2),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 30),
          Container(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Column(
              children: [
                const Icon(
                  Icons.copyright_rounded,
                  color: Color(0xFF9CA3AF),
                  size: 22,
                ),
                const SizedBox(height: 6),
                const Text(
                  'YOUGA DIGITAL SERVICE',
                  style: TextStyle(
                    color: Color(0xFF6B7280),
                    fontWeight: FontWeight.w900,
                    fontSize: 14,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Tous droits réservés © ${DateTime.now().year}',
                  style: const TextStyle(
                    color: Color(0xFF9CA3AF),
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
