// lib/screens/profile/profile_screen.dart
import 'package:flutter/material.dart';
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
                        : 'U',
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
                user?.fullName ?? 'Utilisateur',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: user?.isAdmin == true
                      ? AppTheme.secondaryColor.withValues(alpha: 0.15)
                      : AppTheme.primaryColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  user?.isAdmin == true ? 'Administrateur' : 'Candidat',
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
              _buildInfoCard(context, user?.telephone ?? '-', Icons.phone),
              const SizedBox(height: 24),

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
                    label: const Text('ESPACE ADMINISTRATEUR CMS'),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Menu profil
              _buildMenuCard(context),
              const SizedBox(height: 20),

              // Bouton déconnexion
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
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoCard(BuildContext context, String phone, IconData icon) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
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
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: AppTheme.primaryColor, size: 22),
          ),
          const SizedBox(width: 14),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Numéro de téléphone',
                style: TextStyle(
                  fontSize: 12,
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 2),
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

  Widget _buildMenuCard(BuildContext context) {
    return Container(
      width: double.infinity,
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
      ),
      child: Column(
        children: [
          _buildMenuItem(
            Icons.help_outline,
            'Aide & Support',
            () {},
          ),
          const Divider(height: 1, indent: 60),
          _buildMenuItem(
            Icons.info_outline,
            'À propos de IFL',
            () => _showAbout(context),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem(IconData icon, String label, VoidCallback onTap) {
    return ListTile(
      leading: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: AppTheme.primaryColor.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: AppTheme.primaryColor, size: 20),
      ),
      title: Text(
        label,
        style: const TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w500,
          color: AppTheme.textPrimary,
        ),
      ),
      trailing:
          const Icon(Icons.arrow_forward_ios, size: 14, color: AppTheme.textSecondary),
      onTap: onTap,
    );
  }

  void _showAbout(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('À propos de IFL'),
        content: const Text(
          'IFL - Idéal Formation Leaders\n\nApplication de préparation aux concours administratifs du Burkina Faso.\n\nVersion 1.0.0',
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
        title: const Text('Déconnexion'),
        content: const Text('Voulez-vous vraiment vous déconnecter ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.errorColor,
            ),
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
