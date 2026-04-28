import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/category.dart';
import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/cat_icon.dart';

/// Onglet 3 : Concours professionnel.
/// - 17 dossiers : 14 payants + 3 bonus (Entraînement QCM, Actualités, Accompagnement)
/// - 20 000 FCFA par dossier payant
/// - Les 3 bonus restent verrouillés (5 gratuites uniquement)
///   tant qu'aucun dossier payant n'a été acheté
/// - Dès qu'un dossier payant est acheté, les 3 bonus deviennent débloqués
class ProTab extends StatefulWidget {
  const ProTab({super.key});

  @override
  State<ProTab> createState() => _ProTabState();
}

class _ProTabState extends State<ProTab> {
  bool _loading = true;
  String? _error;
  List<Category> _categories = [];

  // Mots-clés pour reconnaître les 3 dossiers bonus
  static const List<String> _bonusKeywords = [
    'entraînement', 'entrainement', 'actualité', 'actualite',
    'culture', 'accompagnement', 'bonus', 'qcm général', 'qcm general'
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final auth = context.read<AuthService>();
    try {
      final res = auth.isAuthenticated
          ? await auth.api.categories(auth.token!, type: 'professionnel')
          : await auth.api.publicCategories(type: 'professionnel');
      final list = (res['categories'] as List? ?? [])
          .map((e) => Category.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      if (!mounted) return;
      setState(() {
        _categories = list;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Impossible de charger les dossiers. Vérifiez votre connexion.';
      });
    }
  }

  bool _isBonus(Category cat) {
    final n = cat.nom.toLowerCase();
    return _bonusKeywords.any((k) => n.contains(k));
  }

  /// Liste des dossiers payants débloqués pour cet utilisateur
  List<String> _paidDossiers() {
    final user = context.read<AuthService>().user;
    if (user == null) return [];
    if (user.isAdmin) return ['__ALL__'];
    if (user.subscriptionStatus != 'active') return [];
    final type = (user.abonnementType ?? '').split(':').first;
    if (type == 'all') return ['__ALL__'];
    if (type == 'professionnel') {
      // dossiers_debloques: ['Magistrature', 'Justice', ...]
      if (user.dossiersDebloques.isNotEmpty) {
        return user.dossiersDebloques;
      }
      // ancien format : abonnement direct sans liste
      return ['__ALL__'];
    }
    return [];
  }

  /// Un dossier est débloqué si :
  ///  - Admin OU abonnement 'all'
  ///  - C'est un dossier payant ET il fait partie de dossiersDebloques
  ///  - C'est un bonus ET au moins un dossier payant a été acheté
  bool _isUnlocked(Category cat) {
    final paid = _paidDossiers();
    if (paid.isEmpty) return false;
    if (paid.contains('__ALL__')) return true;
    if (_isBonus(cat)) {
      // bonus : débloqué si au moins un dossier payant a été acheté
      return paid.isNotEmpty;
    }
    return paid.contains(cat.nom);
  }

  @override
  Widget build(BuildContext context) {
    final paid = _paidDossiers();
    final hasAnyPaid = paid.isNotEmpty;

    // Tri : payants en premier, bonus à la fin
    final sorted = List<Category>.from(_categories);
    sorted.sort((a, b) {
      final aIsBonus = _isBonus(a);
      final bIsBonus = _isBonus(b);
      if (aIsBonus == bIsBonus) return a.ordre.compareTo(b.ordre);
      return aIsBonus ? 1 : -1;
    });

    final paidList = sorted.where((c) => !_isBonus(c)).toList();
    final bonusList = sorted.where(_isBonus).toList();

    return Scaffold(
      backgroundColor: AppColors.lightBg,
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: _load,
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(child: _buildHeader(hasAnyPaid)),
              if (_loading)
                const SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                    child: CircularProgressIndicator(color: AppColors.primary),
                  ),
                )
              else if (_error != null)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: _buildError(),
                )
              else ...[
                if (paidList.isNotEmpty)
                  SliverToBoxAdapter(
                    child: _sectionHeader(
                      '💼 Dossiers payants',
                      '${paidList.length} dossiers • 20 000 FCFA / dossier',
                    ),
                  ),
                if (paidList.isNotEmpty)
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                    sliver: SliverGrid(
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        childAspectRatio: 0.82,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (_, i) =>
                            _categoryCard(paidList[i], _isUnlocked(paidList[i])),
                        childCount: paidList.length,
                      ),
                    ),
                  ),
                if (bonusList.isNotEmpty)
                  SliverToBoxAdapter(
                    child: _sectionHeader(
                      '🎁 Dossiers bonus',
                      hasAnyPaid
                          ? '${bonusList.length} dossiers • Débloqués ✓'
                          : '${bonusList.length} dossiers • Débloqués avec un dossier payant',
                    ),
                  ),
                if (bonusList.isNotEmpty)
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(12, 0, 12, 90),
                    sliver: SliverGrid(
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        childAspectRatio: 0.82,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (_, i) => _categoryCard(
                            bonusList[i], _isUnlocked(bonusList[i]),
                            isBonus: true),
                        childCount: bonusList.length,
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

  Widget _buildHeader(bool hasAnyPaid) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 22),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFD4A017), Color(0xFFC4521A), Color(0xFF8B2500)],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.asset(
                  'assets/logo.png',
                  width: 40,
                  height: 40,
                  fit: BoxFit.cover,
                ),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  '🎓 Concours professionnels',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 18,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.25),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.workspace_premium_rounded,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(width: 10),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '20 000 FCFA',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 18,
                        ),
                      ),
                      Text(
                        'par dossier payant',
                        style: TextStyle(
                          color: Color(0xFFFFE0A0),
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF3C7),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.card_giftcard_rounded,
                    size: 18, color: Color(0xFF92400E)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    hasAnyPaid
                        ? 'Vos 3 dossiers bonus sont débloqués gratuitement.'
                        : 'Achetez 1 dossier payant → les 3 bonus sont offerts.',
                    style: const TextStyle(
                      color: Color(0xFF92400E),
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      height: 1.4,
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

  Widget _sectionHeader(String title, String subtitle) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontWeight: FontWeight.w900,
              fontSize: 16,
              color: AppColors.darkTerracotta,
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
    );
  }

  Widget _categoryCard(Category cat, bool unlocked, {bool isBonus = false}) {
    final style = iconStyleFor(cat.icone, 'professionnel');
    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: () {
        Navigator.of(context).pushNamed('/quiz', arguments: {
          'categoryId': cat.id,
          'categoryName': cat.nom,
          'isPublic': false,
          'unlocked': unlocked,
          'isPro': true,
          'dossierName': cat.nom,
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
        child: Stack(
          children: [
            Column(
              children: [
                const SizedBox(height: 14),
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: style.border, width: 1.5),
                  ),
                  child: Center(
                    child: CatIcon(
                      name: cat.icone,
                      catType: 'professionnel',
                      size: 38,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: Text(
                    cat.nom,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                ),
                const Spacer(),
                if (!unlocked)
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 6),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 6, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEE2E2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.lock_outline_rounded,
                            size: 11, color: Color(0xFF991B1B)),
                        SizedBox(width: 3),
                        Text(
                          'Verrouillé',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF991B1B),
                          ),
                        ),
                      ],
                    ),
                  )
                else
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 8),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      '✓ Débloqué',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF166534),
                      ),
                    ),
                  ),
                const SizedBox(height: 4),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  child: Text(
                    unlocked ? 'Accès complet' : '🆓 5 gratuites',
                    style: const TextStyle(
                      fontSize: 9.5,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  height: 6,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: style.bgGradient),
                    borderRadius: const BorderRadius.vertical(
                      bottom: Radius.circular(18),
                    ),
                  ),
                ),
              ],
            ),
            if (isBonus)
              Positioned(
                top: 6,
                right: 6,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.secondary,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'BONUS',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 8.5,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildError() {
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.cloud_off_rounded,
              size: 64, color: Color(0xFF9CA3AF)),
          const SizedBox(height: 16),
          Text(
            _error!,
            textAlign: TextAlign.center,
            style: const TextStyle(
                fontSize: 14, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _load,
            icon: const Icon(Icons.refresh),
            label: const Text('Réessayer'),
          ),
        ],
      ),
    );
  }
}
