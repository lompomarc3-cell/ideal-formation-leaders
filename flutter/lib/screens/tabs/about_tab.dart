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
/// 5.3 Politique de confidentialité
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
            icon: Icons.privacy_tip_rounded,
            title: "Politique de confidentialité",
            subtitle: "Données, droits, contact",
            color: const Color(0xFF8B2500),
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const AboutPrivacyPage()),
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
        '✅ Concours directs – 12 dossiers (5 000 FCFA par an)\n'
        '✅ Concours professionnels – 37 dossiers (20 000 FCFA par an / dossier)\n'
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
              'Version 3.0.7',
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
                  'guides sur les concours directs et professionnels. Nous mettons '
                  'toute cette expérience pédagogique à votre service à travers '
                  'des milliers de QCM rigoureusement conçus.',
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
// 5.3 — Politique de confidentialité
// ============================================================

class AboutPrivacyPage extends StatelessWidget {
  const AboutPrivacyPage({super.key});

  Future<void> _whatsApp() async {
    final uri = Uri.parse('https://wa.me/$kDevWhatsApp');
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Widget _section(String title, String content) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFFE4CC)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontWeight: FontWeight.w900,
              fontSize: 14,
              color: AppColors.darkTerracotta,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            content,
            style: const TextStyle(fontSize: 13, height: 1.55),
          ),
        ],
      ),
    );
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
          'Politique de confidentialité',
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // En-tête
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF8B2500), Color(0xFFC4521A)],
              ),
              borderRadius: BorderRadius.circular(22),
            ),
            child: const Column(
              children: [
                Icon(Icons.privacy_tip_rounded, color: Colors.white, size: 48),
                SizedBox(height: 10),
                Text(
                  'Politique de confidentialité',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'IFL – Idéale Formation of Leaders',
                  style: TextStyle(color: Color(0xFFFFE0A0), fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          // Section 1 : Données collectées
          _section(
            '1. Données collectées',
            'Nous collectons uniquement les informations nécessaires à '
            'votre inscription : numéro de téléphone, nom, prénom. '
            'Aucune donnée bancaire n\'est stockée sur nos serveurs. '
            'Les justificatifs de paiement sont traités manuellement '
            'et conservés de manière sécurisée.',
          ),

          // Section 2 : Utilisation des données
          _section(
            '2. Utilisation des données',
            'Vos données sont utilisées exclusivement pour : gérer votre '
            'compte et votre abonnement, suivre votre progression dans '
            'les QCM, vous contacter en cas de besoin lié à votre abonnement. '
            'Elles ne sont jamais utilisées à des fins commerciales ou publicitaires.',
          ),

          // Section 3 : Protection des données
          _section(
            '3. Protection des données',
            'Vos mots de passe sont stockés sous forme chiffrée '
            '(hachage sécurisé). L\'accès à vos données est strictement '
            'limité à l\'équipe administrative d\'IFL. Nous utilisons '
            'des connexions sécurisées (HTTPS/TLS) pour toutes les '
            'communications entre l\'application et nos serveurs.',
          ),

          // Section 4 : Partage des données
          _section(
            '4. Partage des données',
            'Vos données personnelles ne sont jamais vendues, louées '
            'ou cédées à des tiers. Elles ne sont partagées avec aucun '
            'partenaire commercial. Seule l\'équipe IFL a accès à vos '
            'informations, dans le strict cadre de la gestion de votre compte.',
          ),

          // Section 5 : Vos droits (contexte burkinabé)
          _section(
            '5. Vos droits (contexte burkinabè)',
            'Conformément aux principes de protection des données en vigueur '
            'au Burkina Faso, vous disposez des droits suivants :\n'
            '• Droit d\'accès à vos données personnelles\n'
            '• Droit de rectification de vos informations\n'
            '• Droit à la suppression de votre compte\n'
            '• Droit d\'opposition au traitement de vos données\n'
            'Pour exercer ces droits, contactez-nous via WhatsApp.',
          ),

          // Section 6 : Contact
          Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFFFE4CC)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '6. Notre équipe développeur',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 14,
                    color: AppColors.darkTerracotta,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Notre équipe développeur est à votre disposition pour tout besoin :',
                  style: TextStyle(fontSize: 13, height: 1.55, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Que ce soit pour une question, une demande d\'application similaire, '
                  'ou un service de développement logiciel, n\'hésitez pas à nous contacter.',
                  style: TextStyle(fontSize: 12, height: 1.5, color: Color(0xFF6B7280)),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF8F0),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFFD0A0)),
                  ),
                  child: const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.groups_rounded,
                              color: AppColors.primary, size: 18),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'YOUGA DIGITAL SERVICE',
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 13.5,
                                color: AppColors.darkTerracotta,
                              ),
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(Icons.phone_rounded,
                              color: Color(0xFF25D366), size: 18),
                          SizedBox(width: 8),
                          Text(
                            'WhatsApp : +226 72 66 21 61',
                            style: TextStyle(fontSize: 13, height: 1.5),
                          ),
                        ],
                      ),
                      SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(Icons.location_on_rounded,
                              color: AppColors.primary, size: 18),
                          SizedBox(width: 8),
                          Text(
                            'Ouagadougou, Burkina Faso 🇧🇫',
                            style: TextStyle(fontSize: 13, height: 1.5),
                          ),
                        ],
                      ),
                      SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(Icons.schedule_rounded,
                              color: AppColors.secondary, size: 18),
                          SizedBox(width: 8),
                          Text(
                            'Réponse sous 48h ouvrées',
                            style: TextStyle(fontSize: 13, height: 1.5),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Mention conception d'applications
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFF86EFAC)),
            ),
            child: const Row(
              children: [
                Icon(Icons.code_rounded, color: Color(0xFF16A34A), size: 18),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Pour tout besoin de conception d\'application ou développement logiciel, contactez-nous.',
                    style: TextStyle(fontSize: 12.5, fontStyle: FontStyle.italic, color: Color(0xFF15803D)),
                  ),
                ),
              ],
            ),
          ),

          // Bouton WhatsApp
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _whatsApp,
              icon: const Icon(Icons.chat_rounded),
              label: const Text('Contacter via WhatsApp +226 72 66 21 61'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.whatsapp,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),

          // Copyright
          const SizedBox(height: 28),
          Container(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: const Column(
              children: [
                Icon(Icons.copyright_rounded, color: Color(0xFF9CA3AF), size: 22),
                SizedBox(height: 6),
                Text(
                  'YOUGA DIGITAL SERVICE',
                  style: TextStyle(
                    color: Color(0xFF6B7280),
                    fontWeight: FontWeight.w900,
                    fontSize: 14,
                    letterSpacing: 1.2,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Tous droits réservés © 2026',
                  style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 11),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
