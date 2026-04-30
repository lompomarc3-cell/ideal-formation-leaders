import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';

class AdminPricesSection extends StatefulWidget {
  const AdminPricesSection({super.key});

  @override
  State<AdminPricesSection> createState() => _AdminPricesSectionState();
}

class _AdminPricesSectionState extends State<AdminPricesSection> {
  bool _loading = true;
  List<Map<String, dynamic>> _prices = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final auth = context.read<AuthService>();
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await auth.api.adminPrices(auth.token!);
      if (!mounted) return;
      setState(() {
        _prices = (res['prices'] as List? ?? [])
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  Map<String, dynamic>? _priceOf(String type) {
    for (final p in _prices) {
      if (p['type_concours'] == type) return p;
    }
    return null;
  }

  Future<void> _edit(String type, int currentPrice) async {
    final ctrl = TextEditingController(text: currentPrice.toString());
    final res = await showDialog<int?>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
            'Prix ${type == 'direct' ? '🎓 Direct' : '💼 Professionnel'}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Prix actuel : $currentPrice FCFA',
                style: const TextStyle(
                    fontSize: 13, color: Colors.black54)),
            const SizedBox(height: 12),
            TextField(
              controller: ctrl,
              keyboardType: TextInputType.number,
              autofocus: true,
              decoration: const InputDecoration(
                labelText: 'Nouveau prix',
                suffixText: 'FCFA',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
                'Le nouveau prix sera immédiatement visible sur l\'app.',
                style: TextStyle(fontSize: 11, color: Colors.black54)),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Annuler')),
          ElevatedButton(
            onPressed: () {
              final v = int.tryParse(ctrl.text.trim());
              if (v == null || v <= 0) {
                ScaffoldMessenger.of(ctx).showSnackBar(
                  const SnackBar(content: Text('Prix invalide')),
                );
                return;
              }
              Navigator.pop(ctx, v);
            },
            child: const Text('Enregistrer'),
          ),
        ],
      ),
    );
    if (res == null) return;
    final auth = context.read<AuthService>();
    try {
      final r = await auth.api.adminUpdatePrice(auth.token!,
          typeConcours: type, prix: res);
      if (!mounted) return;
      if (r['success'] == true || r['message'] != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(r['message']?.toString() ??
                '✅ Prix ${type == "direct" ? "Direct" : "Pro"} mis à jour : $res FCFA'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Erreur : ${r['error'] ?? "Inconnue"}'),
              backgroundColor: Colors.red),
        );
      }
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur : $e'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 8),
            Text('Erreur: $_error', textAlign: TextAlign.center),
            const SizedBox(height: 8),
            ElevatedButton(onPressed: _load, child: const Text('Réessayer')),
          ],
        ),
      );
    }
    final direct = _priceOf('direct');
    final pro = _priceOf('professionnel');
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Padding(
            padding: EdgeInsets.only(bottom: 12),
            child: Text(
              'Prix des abonnements',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: AppColors.darkTerracotta,
              ),
            ),
          ),
          _PriceCard(
            title: '🎓 Concours Direct',
            price: (direct?['prix'] as num?)?.toInt() ?? 5000,
            promoPrice: (direct?['prix_promo'] as num?)?.toInt(),
            promoDateFin: direct?['promo_date_fin']?.toString(),
            promoLabel: direct?['promo_label']?.toString(),
            onEdit: () =>
                _edit('direct', (direct?['prix'] as num?)?.toInt() ?? 5000),
          ),
          const SizedBox(height: 12),
          _PriceCard(
            title: '💼 Concours Professionnel',
            price: (pro?['prix'] as num?)?.toInt() ?? 20000,
            promoPrice: (pro?['prix_promo'] as num?)?.toInt(),
            promoDateFin: pro?['promo_date_fin']?.toString(),
            promoLabel: pro?['promo_label']?.toString(),
            onEdit: () => _edit(
                'professionnel', (pro?['prix'] as num?)?.toInt() ?? 20000),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.blue.shade200),
            ),
            child: const Text(
              'ℹ️ Note : Les modifications de prix s\'appliquent instantanément sur toutes les pages de l\'app (accueil, paiement, profil).\n\nPour créer une promotion (prix barré + compte à rebours), utilise l\'onglet "🎁 Promotions".',
              style: TextStyle(fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }
}

class _PriceCard extends StatelessWidget {
  final String title;
  final int price;
  final int? promoPrice;
  final String? promoDateFin;
  final String? promoLabel;
  final VoidCallback onEdit;
  const _PriceCard({
    required this.title,
    required this.price,
    required this.promoPrice,
    required this.promoDateFin,
    required this.promoLabel,
    required this.onEdit,
  });

  String? _remainingTime() {
    if (promoDateFin == null) return null;
    try {
      final end = DateTime.parse(promoDateFin!);
      final diff = end.difference(DateTime.now());
      if (diff.isNegative) return null;
      if (diff.inDays > 0) return 'Fin dans ${diff.inDays}j ${diff.inHours % 24}h';
      if (diff.inHours > 0) return 'Fin dans ${diff.inHours}h ${diff.inMinutes % 60}min';
      return 'Fin dans ${diff.inMinutes}min';
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasPromo = promoPrice != null;
    final remaining = _remainingTime();
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style: const TextStyle(
                    fontSize: 17, fontWeight: FontWeight.w900)),
            const SizedBox(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Text('$price FCFA',
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      color: hasPromo
                          ? Colors.grey.shade500
                          : AppColors.darkTerracotta,
                      decoration:
                          hasPromo ? TextDecoration.lineThrough : null,
                    )),
                if (hasPromo) ...[
                  const SizedBox(width: 12),
                  Text('$promoPrice FCFA',
                      style: const TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFFDC2626))),
                ],
              ],
            ),
            if (hasPromo) ...[
              const SizedBox(height: 8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.local_fire_department,
                        size: 16, color: Color(0xFFDC2626)),
                    const SizedBox(width: 4),
                    Text(
                      promoLabel ?? 'PROMO ACTIVE',
                      style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFFDC2626)),
                    ),
                    if (remaining != null) ...[
                      const SizedBox(width: 8),
                      const Icon(Icons.timer,
                          size: 14, color: Color(0xFFDC2626)),
                      const SizedBox(width: 4),
                      Text(remaining,
                          style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFFDC2626))),
                    ],
                  ],
                ),
              ),
            ],
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton.icon(
                onPressed: onEdit,
                icon: const Icon(Icons.edit, size: 16),
                label: const Text('Modifier le prix'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
