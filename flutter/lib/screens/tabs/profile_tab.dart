import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';
import '../main_shell.dart';

/// Onglet 4 : Profil utilisateur.
/// Affiche : logo IFL, nom + prénom, abonnement précis, progression, score, déconnexion.
class ProfileTab extends StatefulWidget {
  const ProfileTab({super.key});

  @override
  State<ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends State<ProfileTab> {
  Map<String, dynamic>? _stats;
  bool _loadingStats = false;

  static const List<String> _bonusKeywords = [
    'entraînement', 'entrainement', 'actualité', 'actualite',
    'culture', 'accompagnement', 'bonus', 'qcm général', 'qcm general'
  ];

  bool _isBonus(String name) {
    final n = name.toLowerCase();
    return _bonusKeywords.any((k) => n.contains(k));
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadStats());
  }

  Future<void> _loadStats() async {
    final auth = context.read<AuthService>();
    if (!auth.isAuthenticated) return;
    setState(() => _loadingStats = true);
    try {
      final res = await auth.api.userStats(auth.token!);
      if (!mounted) return;
      setState(() {
        _stats = Map<String, dynamic>.from(res['stats'] ?? {});
        _loadingStats = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loadingStats = false);
    }
  }

  Future<void> _logout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Déconnexion'),
        content: const Text('Voulez-vous vraiment vous déconnecter ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            child: const Text('Se déconnecter'),
          ),
        ],
      ),
    );
    if (confirm == true) {
      final auth = context.read<AuthService>();
      await auth.logout();
      if (!mounted) return;
      MainShell.of(context)?.goTo(0);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final user = auth.user;

    return Scaffold(
      backgroundColor: AppColors.lightBg,
      body: SafeArea(
        bottom: false,
        child: user == null
            ? _buildNotConnected()
            : SingleChildScrollView(
                child: Column(
                  children: [
                    _buildHeader(user),
                    const SizedBox(height: 12),
                    _buildIdentityCard(user),
                    const SizedBox(height: 12),
                    _buildSubscriptionCard(user),
                    const SizedBox(height: 12),
                    _buildStatsCard(),
                    const SizedBox(height: 12),
                    _buildActions(user),
                    const SizedBox(height: 90),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildNotConnected() {
    return SingleChildScrollView(
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(20, 28, 20, 32),
            decoration:
                const BoxDecoration(gradient: AppColors.primaryGradient),
            child: Column(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: Image.asset(
                    'assets/logo.png',
                    width: 90,
                    height: 90,
                    fit: BoxFit.cover,
                  ),
                ),
                const SizedBox(height: 14),
                const Text(
                  'Bienvenue sur IFL',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 22,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Connectez-vous pour accéder à votre profil',
                  style: TextStyle(color: Color(0xFFFFE0A0), fontSize: 13),
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              children: [
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () =>
                        Navigator.of(context).pushNamed('/register'),
                    icon: const Icon(Icons.person_add_alt_1_rounded),
                    label: const Text("Créer un compte"),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () => Navigator.of(context).pushNamed('/login'),
                    icon: const Icon(Icons.login_rounded),
                    label: const Text("Se connecter"),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      side: const BorderSide(
                          color: AppColors.primary, width: 2),
                      foregroundColor: AppColors.primary,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(user) {
    final fullName = '${user.prenom ?? ''} ${user.nom ?? ''}'.trim();
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
      decoration: const BoxDecoration(gradient: AppColors.primaryGradient),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 3),
            ),
            child: ClipOval(
              child: Image.asset(
                'assets/logo.png',
                width: 80,
                height: 80,
                fit: BoxFit.cover,
              ),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            fullName.isNotEmpty ? fullName : 'Utilisateur IFL',
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w900,
              fontSize: 20,
            ),
          ),
          const SizedBox(height: 4),
          if (user.phone != null)
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '📞 ${user.phone}',
                style: const TextStyle(color: Colors.white, fontSize: 12),
              ),
            ),
          if (user.isAdmin) ...[
            const SizedBox(height: 8),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.secondary,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text(
                '⭐ Administrateur',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildIdentityCard(user) {
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
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.badge_rounded, color: AppColors.primary, size: 20),
                SizedBox(width: 8),
                Text(
                  'Mon identité',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                    color: AppColors.darkTerracotta,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            _infoRow('Nom', user.nom ?? '—'),
            _infoRow('Prénom', user.prenom ?? '—'),
            _infoRow('Téléphone', user.phone ?? '—'),
            _infoRow('Statut',
                user.isAdmin ? 'Administrateur' : 'Utilisateur'),
          ],
        ),
      ),
    );
  }

  Widget _buildSubscriptionCard(user) {
    final isActive = user.subscriptionStatus == 'active';
    final type = (user.abonnementType ?? '').split(':').first;
    final dossiers = user.dossiersDebloques ?? <String>[];

    String label;
    Color bg;
    Color fg;

    if (user.isAdmin) {
      label = 'Administrateur • Accès total';
      bg = const Color(0xFFFEF3C7);
      fg = const Color(0xFF92400E);
    } else if (!isActive) {
      label = 'Aucun abonnement';
      bg = const Color(0xFFFEE2E2);
      fg = const Color(0xFF991B1B);
    } else if (type == 'all') {
      label = 'Accès total — Tous les dossiers';
      bg = const Color(0xFFFFF3D9);
      fg = const Color(0xFF92400E);
    } else if (type == 'direct') {
      label = 'Concours directs (12 dossiers)';
      bg = const Color(0xFFFFEDD5);
      fg = const Color(0xFF9A3412);
    } else if (type == 'professionnel') {
      label = 'Concours professionnels';
      bg = const Color(0xFFE0F2FE);
      fg = const Color(0xFF075985);
    } else {
      label = 'Aucun abonnement';
      bg = const Color(0xFFFEE2E2);
      fg = const Color(0xFF991B1B);
    }

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
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.workspace_premium_rounded,
                    color: AppColors.primary, size: 20),
                SizedBox(width: 8),
                Text(
                  'Mon abonnement',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                    color: AppColors.darkTerracotta,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(
                  horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: bg,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Text(
                label,
                style: TextStyle(
                  color: fg,
                  fontWeight: FontWeight.w900,
                  fontSize: 13.5,
                ),
              ),
            ),
            if (isActive &&
                type == 'professionnel' &&
                dossiers.isNotEmpty) ...[
              const SizedBox(height: 12),
              const Text(
                'Dossiers payés :',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 12,
                  color: Color(0xFF374151),
                ),
              ),
              const SizedBox(height: 6),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: dossiers
                    .where((d) => !_isBonus(d.toString()))
                    .map<Widget>((d) {
                  return Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF7ED),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFFED7AA)),
                    ),
                    child: Text(
                      d.toString(),
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: AppColors.darkTerracotta,
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 8),
              const Text(
                '+ 3 bonus offerts (Entraînement, Actualités, Accompagnement)',
                style: TextStyle(
                  fontSize: 11,
                  color: Color(0xFF6B7280),
                ),
              ),
            ],
            if (!isActive && !user.isAdmin) ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () =>
                      Navigator.of(context).pushNamed('/payment'),
                  icon: const Icon(Icons.flash_on_rounded),
                  label: const Text("S'abonner maintenant"),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatsCard() {
    final stats = _stats;
    final scoreGlobal = stats?['scoreGlobal'] ?? stats?['score_national'] ?? 0;
    final totalAnswered = stats?['totalAnswered'] ?? 0;
    final totalCorrect = stats?['totalCorrect'] ?? 0;
    final progress = totalAnswered > 0 ? (totalCorrect / totalAnswered) : 0.0;

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
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.bar_chart_rounded,
                    color: AppColors.primary, size: 20),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Ma progression',
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 15,
                      color: AppColors.darkTerracotta,
                    ),
                  ),
                ),
                if (_loadingStats)
                  const SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.primary,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _miniStat('$scoreGlobal%', 'Score'),
                const SizedBox(width: 8),
                _miniStat('$totalAnswered', 'Réponses'),
                const SizedBox(width: 8),
                _miniStat('$totalCorrect', 'Correctes'),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'Réussite : ${(progress * 100).round()} %',
              style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF374151)),
            ),
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: LinearProgressIndicator(
                value: progress.clamp(0.0, 1.0),
                backgroundColor: const Color(0xFFFFE4CC),
                color: AppColors.primary,
                minHeight: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _miniStat(String value, String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF7ED),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFFED7AA)),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: const TextStyle(
                color: AppColors.darkTerracotta,
                fontWeight: FontWeight.w900,
                fontSize: 17,
              ),
            ),
            Text(
              label,
              style: const TextStyle(
                color: Color(0xFF6B7280),
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActions(user) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (user.isAdmin)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: ElevatedButton.icon(
                onPressed: () => Navigator.of(context).pushNamed('/admin'),
                icon: const Icon(Icons.admin_panel_settings_rounded),
                label: const Text("Panneau d'administration"),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.darkTerracotta,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
          OutlinedButton.icon(
            onPressed: () async {
              final uri = Uri.parse('https://wa.me/22676223962');
              await launchUrl(uri, mode: LaunchMode.externalApplication);
            },
            icon: const Icon(Icons.chat_rounded),
            label: const Text('WhatsApp Support'),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              side: const BorderSide(color: AppColors.whatsapp, width: 2),
              foregroundColor: AppColors.whatsapp,
            ),
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: _logout,
            icon: const Icon(Icons.logout_rounded),
            label: const Text('Se déconnecter'),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              side: const BorderSide(color: AppColors.danger, width: 2),
              foregroundColor: AppColors.danger,
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label,
              style: const TextStyle(
                color: Color(0xFF6B7280),
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 13.5,
                color: Color(0xFF1F2937),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
