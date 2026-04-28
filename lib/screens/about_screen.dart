import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme/app_theme.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
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
                        colors: [AppColors.info, Color(0xFF2563EB)],
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.info_rounded,
                        color: Colors.white, size: 24),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'À propos',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          'Tout savoir sur IFL',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 22),
              _buildMenuTile(
                context,
                icon: Icons.phone_android_rounded,
                color: AppColors.primary,
                title: 'L\'application',
                subtitle: 'Description, confidentialité, partage',
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const _AboutAppPage()),
                ),
              ),
              const SizedBox(height: 12),
              _buildMenuTile(
                context,
                icon: Icons.groups_rounded,
                color: AppColors.accent,
                title: 'L\'équipe',
                subtitle: 'Idéale Formation of Leaders',
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const _AboutTeamPage()),
                ),
              ),
              const SizedBox(height: 12),
              _buildMenuTile(
                context,
                icon: Icons.code_rounded,
                color: AppColors.info,
                title: 'Le développeur',
                subtitle: 'Marc LOMPO • YOUGA Digital Service',
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const _AboutDevPage()),
                ),
              ),
              const SizedBox(height: 24),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.divider),
                ),
                child: Column(
                  children: [
                    Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [
                            AppColors.primary,
                            AppColors.primaryLight
                          ],
                        ),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Center(
                        child: Text(
                          'IFL',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'IFL — Idéale Formation of Leaders',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                    const Text(
                      'Version 1.0.0',
                      style: TextStyle(
                          fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMenuTile(
    BuildContext context, {
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.divider),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: const TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 14)),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios_rounded,
                  size: 16, color: AppColors.textSecondary),
            ],
          ),
        ),
      ),
    );
  }
}

// ============================================================
// 7.1 — L'application
// ============================================================
class _AboutAppPage extends StatelessWidget {
  const _AboutAppPage();

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('L\'application')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _block(
                title: 'Description',
                child: const Text(
                  'IFL est une application burkinabè dédiée aux candidats aux concours directs et professionnels de la fonction publique. Elle propose des dossiers de cours, des milliers de QCM corrigés, un suivi de progression et un accompagnement personnalisé pour maximiser vos chances de réussite.',
                  style: TextStyle(fontSize: 13, height: 1.6),
                ),
              ),
              const SizedBox(height: 14),
              _block(
                title: 'Politique de confidentialité',
                child: const Text(
                  'Nous nous engageons à protéger les données personnelles de nos utilisateurs. Les informations collectées (nom, prénom, téléphone) sont utilisées uniquement pour le bon fonctionnement de l\'application : authentification, gestion des abonnements, suivi de progression. Aucune donnée n\'est revendue à des tiers. Les informations sont stockées de manière sécurisée et l\'utilisateur peut demander la suppression de son compte à tout moment.',
                  style: TextStyle(fontSize: 13, height: 1.6),
                ),
              ),
              const SizedBox(height: 14),
              _block(
                title: 'Règles de confidentialité',
                child: const Text(
                  '• Les contenus pédagogiques sont protégés par le droit d\'auteur.\n'
                  '• L\'utilisateur s\'engage à ne pas redistribuer les contenus.\n'
                  '• Les comptes sont strictement personnels et non transférables.\n'
                  '• Tout abus ou tentative de fraude entraînera la suspension du compte.\n'
                  '• L\'équipe IFL se réserve le droit de mettre à jour les contenus.',
                  style: TextStyle(fontSize: 13, height: 1.7),
                ),
              ),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.share_rounded),
                  label: const Text('Partager l\'application'),
                  onPressed: () => _openUrl(
                    'whatsapp://send?text=Découvrez IFL, l\'application qui prépare aux concours du Burkina Faso : https://ideal-formation-leaders.pages.dev',
                  ),
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.star_rounded),
                  label: const Text('Évaluer sur Play Store'),
                  onPressed: () => _openUrl(
                    'https://play.google.com/store/apps/details?id=com.idealeformation.ifl_app',
                  ),
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.send_rounded),
                  label: const Text('Envoyer à un ami'),
                  onPressed: () => _openUrl(
                    'sms:?body=Découvre IFL, l\'application IFL pour réussir les concours : https://ideal-formation-leaders.pages.dev',
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _block({required String title, required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(
                  fontWeight: FontWeight.w700, fontSize: 14)),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }
}

// ============================================================
// 7.2 — L'équipe
// ============================================================
class _AboutTeamPage extends StatelessWidget {
  const _AboutTeamPage();

  Future<void> _openWhatsApp() async {
    final uri = Uri.parse('https://wa.me/22676223962');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('L\'équipe')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.primary, AppColors.primaryDark],
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Column(
                  children: [
                    Icon(Icons.groups_rounded, color: Colors.white, size: 48),
                    SizedBox(height: 8),
                    Text(
                      'Idéale Formation of Leaders',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.divider),
                ),
                child: const Text(
                  'Idéale Formation of Leaders est une équipe d\'enseignants et d\'instructeurs expérimentés au Burkina Faso. Nous accompagnons les candidats vers la réussite de leurs concours directs de la fonction publique. Notre équipe est également auteure de plusieurs livres et guides destinés à la préparation des examens et concours.',
                  style: TextStyle(fontSize: 14, height: 1.7),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Nos atouts',
                style: TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 15),
              ),
              const SizedBox(height: 10),
              ...[
                ('Enseignants expérimentés', Icons.school_rounded),
                ('Auteurs de livres et guides', Icons.menu_book_rounded),
                ('Suivi personnalisé', Icons.support_agent_rounded),
                ('Contenu vérifié et actualisé', Icons.verified_rounded),
              ].map((e) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.divider),
                      ),
                      child: Row(
                        children: [
                          Icon(e.$2, color: AppColors.primary, size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(e.$1,
                                style: const TextStyle(fontSize: 13)),
                          ),
                        ],
                      ),
                    ),
                  )),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _openWhatsApp,
                  icon: const Icon(Icons.chat_rounded),
                  label: const Text('Contact WhatsApp : +226 76 22 39 62'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF25D366),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ============================================================
// 7.3 — Le développeur
// ============================================================
class _AboutDevPage extends StatelessWidget {
  const _AboutDevPage();

  Future<void> _openWhatsApp() async {
    final uri = Uri.parse('https://wa.me/22672662161');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Le développeur')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.info, Color(0xFF1E40AF)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Column(
                  children: [
                    CircleAvatar(
                      radius: 36,
                      backgroundColor: Colors.white,
                      child: Icon(
                        Icons.person_rounded,
                        size: 44,
                        color: AppColors.info,
                      ),
                    ),
                    SizedBox(height: 12),
                    Text(
                      'Marc LOMPO',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(
                      'Ingénieur en transformation digitale',
                      style: TextStyle(color: Colors.white70, fontSize: 13),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.divider),
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Profil',
                        style: TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 14)),
                    SizedBox(height: 8),
                    Text(
                      'Ingénieur en transformation digitale, Marc LOMPO conçoit et développe des solutions technologiques au service de l\'éducation et de la formation au Burkina Faso.',
                      style: TextStyle(fontSize: 13, height: 1.6),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _openWhatsApp,
                  icon: const Icon(Icons.chat_rounded),
                  label: const Text('WhatsApp : +226 72 66 21 61'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF25D366),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
              const SizedBox(height: 22),
              Center(
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.divider,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        '© YOUGA DIGITAL SERVICE',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Tous droits réservés',
                      style: TextStyle(
                          fontSize: 11, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
