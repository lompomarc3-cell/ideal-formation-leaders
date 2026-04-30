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
      final res = await auth.api.adminPromotions(auth.token!);
      if (!mounted) return;
      setState(() {
        _promos = (res['promotions'] as List? ?? [])
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

  Future<void> _openEditor({Map<String, dynamic>? promo}) async {
    final res = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (ctx) => _PromoEditorDialog(promo: promo),
    );
    if (res == null) return;
    final auth = context.read<AuthService>();
    try {
      Map<String, dynamic> r;
      if (promo == null) {
        r = await auth.api.adminCreatePromotion(
          auth.token!,
          typeConcours: res['type_concours'],
          prixPromo: res['prix_promo'],
          dateDebut: res['date_debut'],
          dateFin: res['date_fin'],
          isActive: res['is_active'] ?? true,
        );
      } else {
        r = await auth.api.adminUpdatePromotion(
          auth.token!,
          id: promo['id'].toString(),
          typeConcours: res['type_concours'],
          prixPromo: res['prix_promo'],
          dateDebut: res['date_debut'],
          dateFin: res['date_fin'],
          isActive: res['is_active'],
        );
      }
      if (!mounted) return;
      if (r['success'] == true || r['promotion'] != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(promo == null
                ? '✅ Promotion créée'
                : '✅ Promotion mise à jour'),
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

  Future<void> _delete(Map<String, dynamic> promo) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Supprimer la promotion ?'),
        content: Text(
            'Cette promotion ne sera plus affichée sur l\'app.\n\n${promo['type_concours']} • ${promo['prix_promo']} FCFA'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Annuler')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Supprimer',
                style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (ok != true) return;
    final auth = context.read<AuthService>();
    try {
      await auth.api.adminDeletePromotion(auth.token!, promo['id'].toString());
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('✅ Promotion supprimée')),
      );
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur : $e'), backgroundColor: Colors.red),
      );
    }
  }

  String? _remainingTime(String? dateFin) {
    if (dateFin == null) return null;
    try {
      final end = DateTime.parse(dateFin);
      final diff = end.difference(DateTime.now());
      if (diff.isNegative) return 'Expirée';
      if (diff.inDays > 0) return 'Fin dans ${diff.inDays}j ${diff.inHours % 24}h';
      if (diff.inHours > 0) return 'Fin dans ${diff.inHours}h ${diff.inMinutes % 60}min';
      return 'Fin dans ${diff.inMinutes}min';
    } catch (_) {
      return null;
    }
  }

  String _formatDate(String? iso) {
    if (iso == null) return '—';
    try {
      final d = DateTime.parse(iso).toLocal();
      return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
    } catch (_) {
      return iso;
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
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  'Promotions (${_promos.length})',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: AppColors.darkTerracotta,
                  ),
                ),
              ),
              ElevatedButton.icon(
                onPressed: () => _openEditor(),
                icon: const Icon(Icons.add),
                label: const Text('Nouvelle promo'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: _promos.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.local_offer_outlined,
                          size: 64, color: Colors.black26),
                      const SizedBox(height: 8),
                      const Text('Aucune promotion',
                          style: TextStyle(color: Colors.black54)),
                      const SizedBox(height: 8),
                      ElevatedButton.icon(
                        onPressed: () => _openEditor(),
                        icon: const Icon(Icons.add),
                        label: const Text('Créer une promotion'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    itemCount: _promos.length,
                    itemBuilder: (ctx, i) {
                      final p = _promos[i];
                      final active = p['is_active'] == true;
                      final currentlyActive = p['is_currently_active'] == true;
                      final remaining = _remainingTime(p['date_fin']?.toString());
                      final isExpired = remaining == 'Expirée';
                      return Card(
                        margin: const EdgeInsets.symmetric(vertical: 6),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    p['type_concours'] == 'direct'
                                        ? '🎓 Direct'
                                        : '💼 Professionnel',
                                    style: const TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w900),
                                  ),
                                  const Spacer(),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: currentlyActive
                                          ? Colors.green.shade100
                                          : isExpired
                                              ? Colors.grey.shade300
                                              : active
                                                  ? Colors.amber.shade100
                                                  : Colors.grey.shade200,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      currentlyActive
                                          ? '🟢 Active'
                                          : isExpired
                                              ? '⏰ Expirée'
                                              : active
                                                  ? '⏳ Programmée'
                                                  : '⭕ Inactive',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w900,
                                        color: currentlyActive
                                            ? Colors.green.shade900
                                            : isExpired
                                                ? Colors.grey.shade700
                                                : active
                                                    ? Colors.orange.shade900
                                                    : Colors.grey.shade700,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                '${p['prix_promo'] ?? '—'} FCFA',
                                style: const TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFFDC2626),
                                ),
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  const Icon(Icons.play_arrow,
                                      size: 14, color: Colors.green),
                                  const SizedBox(width: 4),
                                  Text(
                                      'Début : ${_formatDate(p['date_debut']?.toString())}',
                                      style: const TextStyle(fontSize: 12)),
                                ],
                              ),
                              Row(
                                children: [
                                  const Icon(Icons.stop,
                                      size: 14, color: Colors.red),
                                  const SizedBox(width: 4),
                                  Text(
                                      'Fin : ${_formatDate(p['date_fin']?.toString())}',
                                      style: const TextStyle(fontSize: 12)),
                                ],
                              ),
                              if (remaining != null && !isExpired) ...[
                                const SizedBox(height: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFEF3C7),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.timer,
                                          size: 14, color: Color(0xFFB45309)),
                                      const SizedBox(width: 4),
                                      Text(remaining,
                                          style: const TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w800,
                                              color: Color(0xFFB45309))),
                                    ],
                                  ),
                                ),
                              ],
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  OutlinedButton.icon(
                                    onPressed: () => _openEditor(promo: p),
                                    icon: const Icon(Icons.edit, size: 14),
                                    label: const Text('Modifier'),
                                  ),
                                  const SizedBox(width: 8),
                                  OutlinedButton.icon(
                                    onPressed: () => _delete(p),
                                    icon: const Icon(Icons.delete,
                                        size: 14, color: Colors.red),
                                    label: const Text('Supprimer',
                                        style: TextStyle(color: Colors.red)),
                                    style: OutlinedButton.styleFrom(
                                      side: const BorderSide(color: Colors.red),
                                    ),
                                  ),
                                ],
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
        text: widget.promo?['prix_promo']?.toString() ?? '');
    _start = TextEditingController(
        text: _isoToLocalDate(widget.promo?['date_debut']?.toString()));
    _end = TextEditingController(
        text: _isoToLocalDate(widget.promo?['date_fin']?.toString()));
    _type = widget.promo?['type_concours']?.toString() ?? 'direct';
    _isActive = widget.promo?['is_active'] != false;
  }

  String _isoToLocalDate(String? iso) {
    if (iso == null || iso.isEmpty) return '';
    try {
      final d = DateTime.parse(iso).toLocal();
      return '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
    } catch (_) {
      return iso;
    }
  }

  Future<void> _pickDate(TextEditingController ctrl) async {
    final initial = DateTime.tryParse(ctrl.text) ?? DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(DateTime.now().year - 1),
      lastDate: DateTime(DateTime.now().year + 5),
    );
    if (picked != null) {
      ctrl.text =
          '${picked.year.toString().padLeft(4, '0')}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
      setState(() {});
    }
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
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (widget.promo == null)
                DropdownButtonFormField<String>(
                  initialValue: _type,
                  decoration: const InputDecoration(labelText: 'Type *'),
                  items: const [
                    DropdownMenuItem(
                        value: 'direct', child: Text('🎓 Direct')),
                    DropdownMenuItem(
                        value: 'professionnel', child: Text('💼 Professionnel')),
                  ],
                  onChanged: (v) => setState(() => _type = v ?? 'direct'),
                ),
              const SizedBox(height: 8),
              TextField(
                controller: _prix,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Prix promo *',
                  suffixText: 'FCFA',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _start,
                readOnly: true,
                onTap: () => _pickDate(_start),
                decoration: const InputDecoration(
                  labelText: 'Date début *',
                  hintText: 'Cliquer pour sélectionner',
                  suffixIcon: Icon(Icons.calendar_today),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _end,
                readOnly: true,
                onTap: () => _pickDate(_end),
                decoration: const InputDecoration(
                  labelText: 'Date fin *',
                  hintText: 'Cliquer pour sélectionner',
                  suffixIcon: Icon(Icons.calendar_today),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 8),
              SwitchListTile(
                title: const Text('Activer la promotion'),
                value: _isActive,
                activeColor: AppColors.primary,
                onChanged: (v) => setState(() => _isActive = v),
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler')),
        ElevatedButton(
          onPressed: () {
            final prix = int.tryParse(_prix.text.trim());
            if (prix == null || prix <= 0) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Prix invalide')),
              );
              return;
            }
            if (_start.text.trim().isEmpty || _end.text.trim().isEmpty) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Les dates sont requises')),
              );
              return;
            }
            // Convertir date locale en ISO
            DateTime? debut;
            DateTime? fin;
            try {
              debut = DateTime.parse(_start.text.trim());
              fin = DateTime.parse('${_end.text.trim()}T23:59:59');
            } catch (_) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Format de date invalide')),
              );
              return;
            }
            if (fin.isBefore(debut) || fin.isAtSameMomentAs(debut)) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                    content: Text('La date de fin doit être après le début')),
              );
              return;
            }
            Navigator.pop(context, {
              'type_concours': _type,
              'prix_promo': prix,
              'date_debut': debut.toIso8601String(),
              'date_fin': fin.toIso8601String(),
              'is_active': _isActive,
            });
          },
          child: const Text('Enregistrer'),
        ),
      ],
    );
  }
}
