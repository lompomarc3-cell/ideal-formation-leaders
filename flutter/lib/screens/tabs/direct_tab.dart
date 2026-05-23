import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/category.dart';
import '../../services/auth_service.dart';
import '../../services/price_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/cat_icon.dart';
import '../../widgets/price_display.dart';
import '../../widgets/promo_banner.dart';

/// Onglet 2 : Concours direct.
/// - 12 dossiers
/// - Prix unique : 5 000 FCFA pour l'ensemble
/// - 5 premières questions gratuites par dossier
class DirectTab extends StatefulWidget {
  const DirectTab({super.key});

  @override
  State<DirectTab> createState() => _DirectTabState();
}

class _DirectTabState extends State<DirectTab> {
  bool _loading = true;
  String? _error;
  List<Category> _categories = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _load();
      // S'assure que les prix/promos sont à jour à chaque ouverture de l'onglet
      context.read<PriceService>().load();
    });
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final auth = context.read<AuthService>();
    try {
      final res = auth.isAuthenticated
          ? await auth.api.categories(auth.token!, type: 'direct')
          : await auth.api.publicCategories(type: 'direct');
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

  bool _isUnlocked(Category cat) {
    final auth = context.read<AuthService>();
    final user = auth.user;
    if (user == null) return false;
    if (user.isAdmin) return true;
    // Si la programmation est expirée ou désactivée → toujours verrouillé (même avec abonnement actif)
    if (cat.limitedToDemo) return false;
    if (user.subscriptionStatus != 'active') return false;
    final type = (user.abonnementType ?? '').split(':').first;
    return type == 'direct' || type == 'all';
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final hasAccess = auth.user?.isAdmin == true ||
        (auth.user?.subscriptionStatus == 'active' &&
            ((auth.user?.abonnementType ?? '').startsWith('direct') ||
                (auth.user?.abonnementType ?? '').startsWith('all')));

    return Scaffold(
      backgroundColor: AppColors.lightBg,
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () async {
            await _load();
            // ignore: use_build_context_synchronously
            await context.read<PriceService>().refresh();
          },
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(child: _buildHeader(hasAccess)),
              // 🔥 Bandeau clignotant : promo Direct uniquement
              const SliverToBoxAdapter(child: PromoBanner(type: 'direct')),
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
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(12, 8, 12, 90),
                  sliver: SliverGrid(
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 0.85,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (_, i) =>
                          _categoryCard(_categories[i], _isUnlocked(_categories[i])),
                      childCount: _categories.length,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(bool hasAccess) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 22),
      decoration: const BoxDecoration(gradient: AppColors.primaryGradient),
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
                  '📚 Concours directs',
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
              color: Colors.white.withValues(alpha: 0.18),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.25),
                width: 1.2,
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 50,
                  height: 50,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.15),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.library_books_rounded,
                    color: AppColors.primary,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    '12 dossiers',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 16,
                    ),
                  ),
                ),
                if (hasAccess)
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFBBF24),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.2),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.lock_open_rounded,
                            color: Colors.white, size: 14),
                        SizedBox(width: 4),
                        Text(
                          'Débloqué',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
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
          // Bloc prix dynamique + promotion (visible PARTOUT)
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.30),
                width: 1,
              ),
            ),
            child: const PriceDisplay(
              type: 'direct',
              style: PriceDisplayStyle.banner,
              foreground: Colors.white,
              hint: 'pour les 12 dossiers',
            ),
          ),
          const SizedBox(height: 10),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF3C7),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Row(
              children: [
                Icon(Icons.lock_open_rounded,
                    size: 16, color: Color(0xFF92400E)),
                SizedBox(width: 6),
                Expanded(
                  child: Text(
                    '5 premières questions gratuites par dossier',
                    style: TextStyle(
                      color: Color(0xFF92400E),
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
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

  Widget _categoryCard(Category cat, bool unlocked) {
    final style = iconStyleFor(cat.icone, 'direct', categoryName: cat.nom);
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
                  categoryName: cat.nom,
                  catType: 'direct',
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
            // (Badge prix supprimé : prix géré globalement, pas par dossier)
            // 🔒 Bannière verrouillage si session expirée
            if (cat.isLocked)
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 6),
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 5),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFEF4444), width: 1),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.lock_rounded, size: 12, color: Color(0xFF991B1B)),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        cat.lockMessage ?? 'Session expirée – renouvelez votre abonnement',
                        textAlign: TextAlign.center,
                        maxLines: 2,
                        style: const TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF991B1B),
                        ),
                      ),
                    ),
                  ],
                ),
              )
            else
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 8),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: unlocked
                      ? const Color(0xFFFFF3D9) // jaune doré clair
                      : style.tag,
                  borderRadius: BorderRadius.circular(20),
                  border: unlocked
                      ? Border.all(color: const Color(0xFFFBBF24), width: 1)
                      : null,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      unlocked
                          ? Icons.check_circle_rounded
                          : Icons.lock_open_rounded,
                      size: 11,
                      color: unlocked
                          ? const Color(0xFF92400E)
                          : style.tagText,
                    ),
                    const SizedBox(width: 3),
                    Text(
                      unlocked ? 'Débloqué' : '5 gratuites',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        color: unlocked
                            ? const Color(0xFF92400E)
                            : style.tagText,
                      ),
                    ),
                  ],
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
