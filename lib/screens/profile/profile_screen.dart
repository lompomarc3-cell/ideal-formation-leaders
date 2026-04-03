// lib/screens/profile/profile_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../services/auth_service.dart';
import '../auth/login_screen.dart';
import '../admin/admin_dashboard_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = context.watch<AuthService>();
    final user = authService.currentUser;

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Mon Profil'),
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              // Avatar
              Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primaryColor.withValues(alpha: 0.3),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    user?.prenom.isNotEmpty == true
                        ? user!.prenom[0].toUpperCase()
                        : user?.fullName.isNotEmpty == true
                            ? user!.fullName[0].toUpperCase()
                            : 'C',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 36,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                user?.fullName.isNotEmpty == true ? user!.fullName : 'Candidat',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: user?.isAdmin == true
                      ? AppTheme.secondaryColor.withValues(alpha: 0.15)
                      : AppTheme.primaryColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  user?.isSuperAdmin == true
                      ? 'Super Administrateur'
                      : user?.isAdmin == true
                          ? 'Administrateur'
                          : 'Candidat',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: user?.isAdmin == true
                        ? AppTheme.secondaryColor
                        : AppTheme.primaryColor,
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Infos
              _buildInfoCard(user?.telephone ?? '-'),
              const SizedBox(height: 16),

              // Mes abonnements
              if (user != null && !user.isAdmin) ...[
                _buildAbonnementsCard(user.abonnements),
                const SizedBox(height: 16),
              ],

              // Bouton Admin CMS (si admin)
              if (user?.isAdmin == true) ...[
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.secondaryColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute(
                          builder: (_) => const AdminDashboardScreen()),
                    ),
                    icon: const Icon(Icons.admin_panel_settings),
                    label: const Text(
                      'ESPACE ADMINISTRATEUR IFL',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Menu principal
              _buildMenuCard(context, user?.isAdmin == true),
              const SizedBox(height: 16),

              // Section Partager l'app
              _buildShareCard(context),
              const SizedBox(height: 20),

              // Déconnexion
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.errorColor,
                    side: const BorderSide(color: AppTheme.errorColor),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  onPressed: () => _confirmLogout(context, authService),
                  icon: const Icon(Icons.logout),
                  label: const Text('SE DÉCONNECTER'),
                ),
              ),
              const SizedBox(height: 20),

              // Version
              const Text(
                'IFL v1.0.0\nDéterminer • Travailler • Réussir',
                style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoCard(String phone) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.phone_rounded,
                color: AppTheme.primaryColor, size: 20),
          ),
          const SizedBox(width: 14),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Numéro de téléphone',
                style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
              ),
              Text(
                phone,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textPrimary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAbonnementsCard(List<String> abonnements) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.verified_rounded, color: AppTheme.accentColor, size: 20),
              SizedBox(width: 8),
              Text(
                'Mes dossiers débloqués',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                  color: AppTheme.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (abonnements.isEmpty)
            const Text(
              'Aucun dossier débloqué pour le moment',
              style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
            )
          else
            Text(
              '${abonnements.length} dossier(s) débloqué(s)',
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppTheme.accentColor,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildMenuCard(BuildContext context, bool isAdmin) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
          ),
        ],
      ),
      child: Column(
        children: [
          _buildMenuItem(
            Icons.help_outline_rounded,
            'Aide & Support',
            () => _showSupport(context),
          ),
          const Divider(height: 1, indent: 60),
          if (isAdmin) ...[
            _buildMenuItem(
              Icons.lock_reset_rounded,
              'Modifier mon mot de passe',
              () => _showChangePassword(context),
              color: AppTheme.secondaryColor,
            ),
            const Divider(height: 1, indent: 60),
          ],
          _buildMenuItem(
            Icons.info_outline_rounded,
            'À propos de IFL',
            () => _showAbout(context),
          ),
        ],
      ),
    );
  }

  Widget _buildShareCard(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
          ),
        ],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.share_rounded,
                      color: AppTheme.primaryColor, size: 18),
                ),
                const SizedBox(width: 12),
                const Text(
                  'Partager & évaluer',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, indent: 16),
          _buildMenuItem(
            Icons.share_rounded,
            'Partager l\'application',
            () => _shareApp(context),
            color: AppTheme.primaryColor,
          ),
          const Divider(height: 1, indent: 60),
          _buildMenuItem(
            Icons.star_rounded,
            'Noter sur Play Store',
            () => _rateApp(context),
            color: const Color(0xFFFFBB00),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem(IconData icon, String label, VoidCallback onTap,
      {Color? color}) {
    final iconColor = color ?? AppTheme.primaryColor;
    return ListTile(
      leading: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: iconColor.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: iconColor, size: 18),
      ),
      title: Text(
        label,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: AppTheme.textPrimary,
        ),
      ),
      trailing: const Icon(Icons.arrow_forward_ios,
          size: 12, color: AppTheme.textSecondary),
      onTap: onTap,
    );
  }

  void _shareApp(BuildContext context) {
    const message =
        '🎓 Préparez vos concours administratifs avec IFL !\n\n'
        '📚 Idéal Formation Leaders vous propose des QCM de qualité '
        'pour réussir les concours directs et professionnels au Burkina Faso.\n\n'
        '✅ Concours Direct : 5 000 FCFA\n'
        '✅ Concours Professionnel : 20 000 FCFA\n\n'
        '💡 Déterminer • Travailler • Réussir\n\n'
        '📲 https://ideal-formation-leaders.pages.dev';

    Clipboard.setData(const ClipboardData(text: message));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            Icon(Icons.check_circle, color: Colors.white),
            SizedBox(width: 8),
            Expanded(
              child: Text('Lien copié ! Partagez sur WhatsApp, SMS ou réseaux sociaux.'),
            ),
          ],
        ),
        backgroundColor: AppTheme.accentColor,
        duration: Duration(seconds: 3),
      ),
    );
  }

  void _rateApp(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.star_rounded, color: Color(0xFFFFBB00), size: 28),
            SizedBox(width: 10),
            Text('Notez IFL'),
          ],
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Votre avis nous aide à améliorer l\'application IFL.\n\n'
              'Une fois disponible sur le Play Store, vous pourrez laisser '
              'votre évaluation directement.',
              style: TextStyle(fontSize: 13, height: 1.6),
            ),
            SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.star, color: Color(0xFFFFBB00), size: 32),
                Icon(Icons.star, color: Color(0xFFFFBB00), size: 32),
                Icon(Icons.star, color: Color(0xFFFFBB00), size: 32),
                Icon(Icons.star, color: Color(0xFFFFBB00), size: 32),
                Icon(Icons.star, color: Color(0xFFFFBB00), size: 32),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Plus tard'),
          ),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFFBB00),
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              Navigator.pop(context);
              // Copier le lien Play Store (à mettre à jour quand disponible)
              Clipboard.setData(
                  const ClipboardData(text: 'https://play.google.com/store'));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('L\'app sera bientôt disponible sur Play Store !'),
                ),
              );
            },
            icon: const Icon(Icons.open_in_new, size: 16),
            label: const Text('Voir sur Play Store'),
          ),
        ],
      ),
    );
  }

  void _showSupport(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.support_agent_rounded, color: AppTheme.primaryColor),
            SizedBox(width: 10),
            Text('Aide & Support'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Pour toute question ou assistance, contactez l\'équipe IFL :',
              style: TextStyle(fontSize: 13),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFE7F5EE),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Row(
                children: [
                  Icon(Icons.chat_rounded, color: Color(0xFF25D366), size: 24),
                  SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('WhatsApp IFL',
                          style: TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                      Text(
                        '+22676223962',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF25D366),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Fermer'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Clipboard.setData(const ClipboardData(text: '+22676223962'));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Numéro copié !')),
              );
            },
            child: const Text('Copier le numéro'),
          ),
        ],
      ),
    );
  }

  void _showChangePassword(BuildContext context) {
    final formKey = GlobalKey<FormState>();
    final newPassCtrl = TextEditingController();
    final confirmCtrl = TextEditingController();
    bool obscure1 = true;
    bool obscure2 = true;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setStateDlg) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(
            children: [
              Icon(Icons.lock_reset_rounded, color: AppTheme.secondaryColor),
              SizedBox(width: 10),
              Text('Changer le mot de passe'),
            ],
          ),
          content: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: newPassCtrl,
                  obscureText: obscure1,
                  decoration: InputDecoration(
                    labelText: 'Nouveau mot de passe',
                    prefixIcon: const Icon(Icons.lock_rounded),
                    suffixIcon: IconButton(
                      icon: Icon(obscure1 ? Icons.visibility : Icons.visibility_off),
                      onPressed: () => setStateDlg(() => obscure1 = !obscure1),
                    ),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Requis';
                    if (v.length < 6) return 'Minimum 6 caractères';
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: confirmCtrl,
                  obscureText: obscure2,
                  decoration: InputDecoration(
                    labelText: 'Confirmer le mot de passe',
                    prefixIcon: const Icon(Icons.lock_outline_rounded),
                    suffixIcon: IconButton(
                      icon: Icon(obscure2 ? Icons.visibility : Icons.visibility_off),
                      onPressed: () => setStateDlg(() => obscure2 = !obscure2),
                    ),
                  ),
                  validator: (v) {
                    if (v != newPassCtrl.text) return 'Les mots de passe ne correspondent pas';
                    return null;
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Annuler'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.secondaryColor,
                foregroundColor: Colors.white,
              ),
              onPressed: () async {
                if (!formKey.currentState!.validate()) return;
                Navigator.pop(ctx);
                final authService = context.read<AuthService>();
                final ok = await authService.changePassword(newPassCtrl.text);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(ok
                          ? '✅ Mot de passe modifié avec succès !'
                          : '❌ Erreur: ${authService.error}'),
                      backgroundColor: ok ? AppTheme.accentColor : AppTheme.errorColor,
                    ),
                  );
                }
              },
              child: const Text('Confirmer'),
            ),
          ],
        ),
      ),
    );
  }

  void _showAbout(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.asset(
                'assets/images/logo_ifl.png',
                width: 36,
                height: 36,
                errorBuilder: (_, __, ___) => const Icon(
                  Icons.school,
                  color: AppTheme.primaryColor,
                  size: 36,
                ),
              ),
            ),
            const SizedBox(width: 10),
            const Text('À propos de IFL'),
          ],
        ),
        content: const Text(
          'IFL – Idéal Formation Leaders\n\n'
          'Application de préparation aux concours administratifs du Burkina Faso.\n\n'
          'Administrateur : NIAMPA Issa\n'
          'Contact : +22676223962\n\n'
          'Motto : Déterminer • Travailler • Réussir\n\n'
          'Version 1.0.0',
          style: TextStyle(fontSize: 13, height: 1.6),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Fermer'),
          ),
        ],
      ),
    );
  }

  void _confirmLogout(BuildContext context, AuthService authService) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Déconnexion'),
        content: const Text('Voulez-vous vraiment vous déconnecter ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.errorColor),
            onPressed: () async {
              Navigator.pop(context);
              await authService.signOut();
              if (context.mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (_) => false,
                );
              }
            },
            child: const Text('Déconnecter'),
          ),
        ],
      ),
    );
  }
}
