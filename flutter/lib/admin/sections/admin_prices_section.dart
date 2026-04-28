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
  Map<String, dynamic> _prices = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final auth = context.read<AuthService>();
    setState(() => _loading = true);
    try {
      final res = await auth.api.adminPrices(auth.token!);
      if (!mounted) return;
      setState(() {
        _prices = Map<String, dynamic>.from(res);
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _edit(String type, dynamic currentPrice) async {
    final ctrl = TextEditingController(text: currentPrice?.toString() ?? '');
    final res = await showDialog<int?>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Prix ${type == 'direct' ? 'Direct' : 'Professionnel'}'),
        content: TextField(
          controller: ctrl,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
              labelText: 'Prix FCFA', suffixText: 'FCFA'),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Annuler')),
          ElevatedButton(
            onPressed: () =>
                Navigator.pop(ctx, int.tryParse(ctrl.text.trim())),
            child: const Text('Enregistrer'),
          ),
        ],
      ),
    );
    if (res == null) return;
    final auth = context.read<AuthService>();
    try {
      await auth.api.adminUpdatePrice(auth.token!,
          typeConcours: type, prix: res);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Prix mis à jour')),
      );
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
    final direct = _prices['direct'] ?? _prices['prix_direct'] ?? 5000;
    final pro = _prices['professionnel'] ??
        _prices['prix_professionnel'] ??
        20000;
    final promoDirect = _prices['promo_direct'];
    final promoPro = _prices['promo_professionnel'];
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _PriceCard(
            title: '🎓 Concours Direct',
            price: direct,
            promoPrice: promoDirect is Map ? promoDirect['price'] : null,
            onEdit: () => _edit('direct', direct),
          ),
          const SizedBox(height: 12),
          _PriceCard(
            title: '💼 Concours Professionnel',
            price: pro,
            promoPrice: promoPro is Map ? promoPro['price'] : null,
            onEdit: () => _edit('professionnel', pro),
          ),
        ],
      ),
    );
  }
}

class _PriceCard extends StatelessWidget {
  final String title;
  final dynamic price;
  final dynamic promoPrice;
  final VoidCallback onEdit;
  const _PriceCard({
    required this.title,
    required this.price,
    required this.promoPrice,
    required this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style: const TextStyle(
                    fontSize: 17, fontWeight: FontWeight.w900)),
            const SizedBox(height: 8),
            Row(
              children: [
                Text('$price FCFA',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: AppColors.darkTerracotta,
                      decoration: promoPrice != null
                          ? TextDecoration.lineThrough
                          : null,
                    )),
                if (promoPrice != null) ...[
                  const SizedBox(width: 8),
                  Text('$promoPrice FCFA',
                      style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: Colors.green)),
                ],
              ],
            ),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: OutlinedButton.icon(
                onPressed: onEdit,
                icon: const Icon(Icons.edit, size: 16),
                label: const Text('Modifier'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
