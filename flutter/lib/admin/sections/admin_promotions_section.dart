import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';

class AdminPromotionsSection extends StatefulWidget {
  const AdminPromotionsSection({super.key});

  @override
  State<AdminPromotionsSection> createState() => _AdminPromotionsSectionState();
}

class _AdminPromotionsSectionState extends State<AdminPromotionsSection> {
  bool _loading = true;
  List<Map<String, dynamic>> _promos = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final auth = context.read<AuthService>();
    setState(() => _loading = true);
    try {
      final res = await auth.api.adminPromotions(auth.token!);
      if (!mounted) return;
      setState(() {
        _promos = (res['promotions'] as List? ?? [])
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openEditor({Map<String, dynamic>? promo}) async {
    final res = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (ctx) => _PromoEditorDialog(promo: promo),
    );
    if (res == null) return;
    final auth = context.read<AuthService>();
    try {
      if (promo == null) {
        await auth.api.adminCreatePromotion(
          auth.token!,
          typeConcours: res['type'],
          prixPromo: res['prix'],
          dateDebut: res['starts_at'] ?? '',
          dateFin: res['ends_at'] ?? '',
          isActive: res['is_active'] ?? true,
        );
      } else {
        await auth.api.adminUpdatePromotion(
          auth.token!,
          id: promo['id'].toString(),
          prixPromo: res['prix'],
          dateDebut: res['starts_at'],
          dateFin: res['ends_at'],
          isActive: res['is_active'],
        );
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(promo == null ? 'Créée' : 'Mise à jour')),
      );
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur : $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _delete(Map<String, dynamic> promo) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Supprimer la promotion ?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Annuler')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    final auth = context.read<AuthService>();
    await auth.api.adminDeletePromotion(auth.token!, promo['id'].toString());
    _load();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: Align(
            alignment: Alignment.centerRight,
            child: ElevatedButton.icon(
              onPressed: () => _openEditor(),
              icon: const Icon(Icons.add),
              label: const Text('Nouvelle promotion'),
            ),
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _load,
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: _promos.length,
              itemBuilder: (ctx, i) {
                final p = _promos[i];
                final active = p['is_active'] == true;
                return Card(
                  child: ListTile(
                    title: Text(
                      '${(p['type_concours'] ?? p['type']) == 'direct' ? '🎓 Direct' : '💼 Pro'} — ${p['prix_promo'] ?? p['prix']} FCFA',
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if ((p['date_debut'] ?? p['starts_at']) != null)
                          Text('🟢 Début : ${p['date_debut'] ?? p['starts_at']}'),
                        if ((p['date_fin'] ?? p['ends_at']) != null)
                          Text('🔴 Fin : ${p['date_fin'] ?? p['ends_at']}'),
                        Text(active ? 'Active' : 'Inactive',
                            style: TextStyle(
                                color:
                                    active ? const Color(0xFFC4521A) : Colors.grey,
                                fontWeight: FontWeight.w700)),
                      ],
                    ),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.edit,
                              color: AppColors.primary),
                          onPressed: () => _openEditor(promo: p),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete, color: Colors.red),
                          onPressed: () => _delete(p),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}

class _PromoEditorDialog extends StatefulWidget {
  final Map<String, dynamic>? promo;
  const _PromoEditorDialog({this.promo});

  @override
  State<_PromoEditorDialog> createState() => _PromoEditorDialogState();
}

class _PromoEditorDialogState extends State<_PromoEditorDialog> {
  late TextEditingController _prix;
  late TextEditingController _start;
  late TextEditingController _end;
  String _type = 'direct';
  bool _isActive = true;

  @override
  void initState() {
    super.initState();
    _prix = TextEditingController(
        text: widget.promo?['prix_promo']?.toString() ??
            widget.promo?['prix']?.toString() ??
            '');
    _start = TextEditingController(
        text: widget.promo?['date_debut']?.toString() ??
            widget.promo?['starts_at']?.toString() ??
            '');
    _end = TextEditingController(
        text: widget.promo?['date_fin']?.toString() ??
            widget.promo?['ends_at']?.toString() ??
            '');
    _type = widget.promo?['type_concours']?.toString() ??
        widget.promo?['type']?.toString() ??
        'direct';
    _isActive = widget.promo?['is_active'] != false;
  }

  @override
  void dispose() {
    _prix.dispose();
    _start.dispose();
    _end.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.promo == null ? 'Nouvelle promotion' : 'Modifier'),
      content: SizedBox(
        width: 400,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (widget.promo == null)
              DropdownButtonFormField<String>(
                initialValue: _type,
                decoration: const InputDecoration(labelText: 'Type *'),
                items: const [
                  DropdownMenuItem(value: 'direct', child: Text('Direct')),
                  DropdownMenuItem(
                      value: 'professionnel', child: Text('Professionnel')),
                ],
                onChanged: (v) => setState(() => _type = v ?? 'direct'),
              ),
            const SizedBox(height: 8),
            TextField(
              controller: _prix,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                  labelText: 'Prix promo *', suffixText: 'FCFA'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _start,
              decoration: const InputDecoration(
                  labelText: 'Début (AAAA-MM-JJ)',
                  hintText: '2026-05-01'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _end,
              decoration: const InputDecoration(
                  labelText: 'Fin (AAAA-MM-JJ)', hintText: '2026-06-30'),
            ),
            SwitchListTile(
              title: const Text('Active'),
              value: _isActive,
              activeColor: AppColors.primary,
              onChanged: (v) => setState(() => _isActive = v),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler')),
        ElevatedButton(
          onPressed: () {
            final prix = int.tryParse(_prix.text.trim());
            if (prix == null) return;
            Navigator.pop(context, {
              'type': _type,
              'prix': prix,
              'starts_at':
                  _start.text.trim().isEmpty ? null : _start.text.trim(),
              'ends_at':
                  _end.text.trim().isEmpty ? null : _end.text.trim(),
              'is_active': _isActive,
            });
          },
          child: const Text('Enregistrer'),
        ),
      ],
    );
  }
}
