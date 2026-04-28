import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/category.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import '../widgets/cat_icon.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _loading = true;
  List<Category> _direct = [];
  List<Category> _pro = [];
  String _activeTab = 'direct'; // direct | pro | profil
  Map<String, dynamic>? _stats;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthService>();
      if (!auth.isAuthenticated) {
        Navigator.of(context).pushReplacementNamed('/');
        return;
      }
      _load();
    });
  }

  Future<void> _load() async {
    final auth = context.read<AuthService>();
    final token = auth.token!;
    try {
      final results = await Future.wait([
        auth.api.categories(token, type: 'direct'),
        auth.api.categories(token, type: 'professionnel'),
        auth.api.userStats(token),
      ]);
      final dDirect = (results[0]['categories'] as List? ?? [])
          .map((e) => Category.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      final dPro = (results[1]['categories'] as List? ?? [])
          .map((e) => Category.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      if (!mounted) return;
      setState(() {
        _direct = dDirect;
        _pro = dPro;
        _stats = Map<String, dynamic>.from(results[2]['stats'] ?? {});
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  bool _isCategoryUnlocked(Category cat, [String? subType]) {
    final auth = context.read<AuthService>();
    final user = auth.user;
    if (user == null) return false;
    if (user.isAdmin) return true;
    if (user.subscriptionStatus != 'active') return false;
    final type = (user.abonnementType ?? '').split(':').first;
    if (type == 'all') return true;
    if (type == 'direct' && cat.type == 'direct') return true;
    if (type == 'professionnel' && cat.type == 'professionnel') {
      if (user.dossiersDebloques.isEmpty) return true; // ancien format
      return user.dossiersDebloques.contains(cat.nom);
    }
    return false;
  }

  Future<void> _logout() async {
    final auth = context.read<AuthService>();
    await auth.logout();
    if (mounted) Navigator.of(context).pushReplacementNamed('/');
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final user = auth.user;
    if (user == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }
    return Scaffold(
      backgroundColor: AppColors.lightBg,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: Column(
              children: [
                _buildHeader(user.fullName ?? '${user.nom ?? ''} ${user.prenom ?? ''}',
                    isAdmin: user.isAdmin),
                _buildTabBar(),
                if (_loading)
                  const Padding(
                    padding: EdgeInsets.all(40),
                    child: CircularProgressIndicator(color: AppColors.primary),
                  )
                else if (_activeTab == 'profil')
                  _buildProfile(user)
                else
                  _buildCategoryList(_activeTab == 'direct' ? _direct : _pro,
                      _activeTab == 'direct' ? 'direct' : 'professionnel'),
                const SizedBox(height: 80),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(String name, {required bool isAdmin}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      decoration: const BoxDecoration(gradient: AppColors.primaryGradient),
      child: Column(
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Image.asset('assets/logo.png', width: 44, height: 44, fit: BoxFit.cover),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Bienvenue,',
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 12),
                    ),
                    Text(
                      name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 16),
                    ),
                  ],
                ),
              ),
              if (isAdmin)
                IconButton(
                  onPressed: () => Navigator.of(context).pushNamed('/admin'),
                  icon: const Icon(Icons.settings, color: Colors.white),
                  tooltip: 'Admin',
                ),
              IconButton(
                onPressed: _logout,
                icon: const Icon(Icons.logout, color: Colors.white),
                tooltip: 'Déconnexion',
              ),
            ],
          ),
          if (_stats != null) ...[
            const SizedBox(height: 16),
            Row(
              children: [
                _statCard('Score global', '${_stats!['scoreGlobal'] ?? 0}%'),
                const SizedBox(width: 10),
                _statCard('Réponses', '${_stats!['totalAnswered'] ?? 0}'),
                const SizedBox(width: 10),
                _statCard('Correctes', '${_stats!['totalCorrect'] ?? 0}'),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _statCard(String label, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.18),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          children: [
            Text(value,
                style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 18)),
            Text(label,
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.85),
                    fontSize: 10)),
          ],
        ),
      ),
    );
  }

  Widget _buildTabBar() {
    Widget tab(String key, String label) {
      final active = _activeTab == key;
      return Expanded(
        child: GestureDetector(
          onTap: () => setState(() => _activeTab = key),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 14),
            decoration: BoxDecoration(
              color: active ? AppColors.primary : Colors.transparent,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Center(
              child: Text(
                label,
                style: TextStyle(
                  color: active ? Colors.white : const Color(0xFF8B2500),
                  fontWeight: FontWeight.w800,
                  fontSize: 13,
                ),
              ),
            ),
          ),
        ),
      );
    }

    return Container(
      margin: const EdgeInsets.all(12),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFFE4CC)),
      ),
      child: Row(
        children: [
          tab('direct', 'Directs'),
          tab('pro', 'Professionnels'),
          tab('profil', 'Profil'),
        ],
      ),
    );
  }

  Widget _buildCategoryList(List<Category> cats, String catType) {
    if (cats.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(40),
        child: Text('Aucun dossier disponible.'),
      );
    }
    return GridView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        childAspectRatio: 0.95,
      ),
      itemCount: cats.length,
      itemBuilder: (_, i) => _categoryCard(cats[i], catType),
    );
  }

  Widget _categoryCard(Category cat, String catType) {
    final unlocked = _isCategoryUnlocked(cat);
    final style = iconStyleFor(cat.icone, catType);
    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: () {
        Navigator.of(context).pushNamed('/quiz', arguments: {
          'categoryId': cat.id,
          'categoryName': cat.nom,
          'isPublic': false,
          'unlocked': unlocked,
        });
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: style.border, width: 2),
          boxShadow: [
            BoxShadow(
              color: style.border.withValues(alpha: 0.4),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            const SizedBox(height: 12),
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: style.border, width: 1.5),
              ),
              child: Center(
                child: CatIcon(name: cat.icone, catType: catType, size: 36),
              ),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Text(
                cat.nom,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF374151)),
              ),
            ),
            const Spacer(),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Text(
                '${cat.questionCount} questions',
                style: const TextStyle(fontSize: 10, color: Color(0xFF6B7280)),
              ),
            ),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: unlocked ? const Color(0xFFDCFCE7) : style.tag,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                unlocked ? '✓ Débloqué' : '🆓 5 gratuites',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  color: unlocked ? const Color(0xFF166534) : style.tagText,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Container(
              height: 5,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: style.bgGradient),
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(18)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfile(user) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFFFE4CC)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('👤  Mon profil',
                    style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                const SizedBox(height: 12),
                _infoRow('Nom complet', user.fullName ?? '—'),
                _infoRow('Téléphone', user.phone ?? '—'),
                _infoRow('Rôle', user.isAdmin ? 'Administrateur' : 'Utilisateur'),
                _infoRow('Statut',
                    user.subscriptionStatus == 'active' ? 'Abonné ✓' : 'Gratuit'),
                if (user.abonnementType != null)
                  _infoRow('Abonnement', user.abonnementType ?? '—'),
                if (user.dossiersDebloques.isNotEmpty)
                  _infoRow(
                      'Dossiers débloqués', user.dossiersDebloques.join(', ')),
              ],
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: () => Navigator.of(context).pushNamed('/payment'),
            icon: const Icon(Icons.payment),
            label: const Text("S'abonner / Acheter un dossier"),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              backgroundColor: AppColors.primary,
            ),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: () async {
              final uri = Uri.parse('https://wa.me/22676223962');
              await launchUrl(uri, mode: LaunchMode.externalApplication);
            },
            icon: const Icon(Icons.chat),
            label: const Text('WhatsApp Support'),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              side: const BorderSide(color: Color(0xFF25D366), width: 2),
              foregroundColor: const Color(0xFF25D366),
            ),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: _logout,
            icon: const Icon(Icons.logout),
            label: const Text('Se déconnecter'),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              side: const BorderSide(color: Color(0xFFDC2626), width: 2),
              foregroundColor: const Color(0xFFDC2626),
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 130,
              child: Text(label,
                  style: const TextStyle(
                      color: Color(0xFF6B7280), fontSize: 12)),
            ),
            Expanded(
              child: Text(value,
                  style: const TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 13)),
            ),
          ],
        ),
      );
}
