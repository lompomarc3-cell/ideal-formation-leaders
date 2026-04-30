import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';

/// Programmation GLOBALE : une seule date de fin de validité pour TOUTES les catégories.
/// Après cette date, tous les utilisateurs (sauf admin) ne voient que la démo.
class AdminSchedulesSection extends StatefulWidget {
  const AdminSchedulesSection({super.key});

  @override
  State<AdminSchedulesSection> createState() => _AdminSchedulesSectionState();
}

class _AdminSchedulesSectionState extends State<AdminSchedulesSection> {
  bool _loading = true;
  bool _saving = false;
  List<Map<String, dynamic>> _categories = [];
  String? _error;

  // État de la programmation globale (date la plus fréquente parmi les catégories)
  DateTime? _globalDate;
  bool _globalEnabled = false;

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
      final res = await auth.api.adminSchedules(auth.token!);
      if (!mounted) return;
      final cats = (res['categories'] as List? ?? [])
          .map((e) => Map<String, dynamic>.from(e))
          .toList();

      // Déterminer l'état global : si au moins 1 catégorie est programmée, on prend sa date
      DateTime? globalDate;
      bool enabled = false;
      for (final c in cats) {
        if (c['is_programmed'] == true && c['date_validite'] != null) {
          try {
            final d = DateTime.parse(c['date_validite'].toString());
            globalDate = d;
            enabled = true;
            break;
          } catch (_) {}
        }
      }

      setState(() {
        _categories = cats;
        _globalDate = globalDate;
        _globalEnabled = enabled;
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

  Future<void> _applyGlobal({required bool enabled, DateTime? date}) async {
    if (_categories.isEmpty) return;
    final auth = context.read<AuthService>();
    setState(() => _saving = true);
    try {
      final ids = _categories.map((c) => c['id'].toString()).toList();
      final r = await auth.api.adminProgramSchedule(
        auth.token!,
        categoryIds: ids,
        dateValidite: date?.toIso8601String(),
        enabled: enabled,
      );
      if (!mounted) return;
      if (r['success'] == true) {
        final n = r['updated'] ?? ids.length;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(enabled
                ? '✅ Programmation globale appliquée à $n catégorie(s)'
                : '✅ Programmation globale désactivée ($n catégorie(s))'),
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
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _pickGlobalDate() async {
    final initial = _globalDate ??
        DateTime.now().add(const Duration(days: 30));
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime.now(),
      lastDate: DateTime(DateTime.now().year + 5),
    );
    if (picked == null) return;
    // Ajouter 23:59:59 à la date de fin
    final dateFin = DateTime(picked.year, picked.month, picked.day, 23, 59, 59);
    if (!mounted) return;
    setState(() {
      _globalDate = dateFin;
      _globalEnabled = true;
    });
  }

  Future<void> _disableGlobal() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Désactiver la programmation ?'),
        content: const Text(
            'Toutes les catégories redeviendront visibles sans limite de date.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Annuler')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Désactiver'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    setState(() {
      _globalEnabled = false;
      _globalDate = null;
    });
    await _applyGlobal(enabled: false, date: null);
  }

  String _formatDate(DateTime? d) {
    if (d == null) return '—';
    final local = d.toLocal();
    return '${local.day.toString().padLeft(2, '0')}/${local.month.toString().padLeft(2, '0')}/${local.year} ${local.hour.toString().padLeft(2, '0')}:${local.minute.toString().padLeft(2, '0')}';
  }

  String? _remainingTime() {
    if (_globalDate == null) return null;
    final diff = _globalDate!.difference(DateTime.now());
    if (diff.isNegative) return 'EXPIRÉ — Contenu masqué pour les utilisateurs';
    if (diff.inDays > 0) return 'Fin dans ${diff.inDays}j ${diff.inHours % 24}h';
    if (diff.inHours > 0) {
      return 'Fin dans ${diff.inHours}h ${diff.inMinutes % 60}min';
    }
    return 'Fin dans ${diff.inMinutes}min';
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

    final remaining = _remainingTime();
    final expired = _globalDate != null &&
        _globalDate!.isBefore(DateTime.now());
    final programmedCount =
        _categories.where((c) => c['is_programmed'] == true).length;

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ============ CARTE PRINCIPALE : PROGRAMMATION GLOBALE ============
          Card(
            elevation: 3,
            color: _globalEnabled
                ? (expired ? Colors.red.shade50 : Colors.green.shade50)
                : Colors.white,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        _globalEnabled
                            ? (expired ? Icons.block : Icons.lock_clock)
                            : Icons.lock_open,
                        size: 28,
                        color: _globalEnabled
                            ? (expired ? Colors.red : Colors.green)
                            : Colors.grey,
                      ),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Text(
                          'Programmation globale',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: AppColors.darkTerracotta,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Définir une date de fin après laquelle TOUS les QCM et dissertations seront masqués pour les utilisateurs (sauf admin). Seule la démo reste visible.',
                    style: TextStyle(fontSize: 12, color: Colors.black87),
                  ),
                  const SizedBox(height: 16),
                  if (_globalEnabled && _globalDate != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: expired
                            ? Colors.red.shade100
                            : Colors.amber.shade100,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                expired ? Icons.block : Icons.timer,
                                size: 20,
                                color: expired
                                    ? Colors.red.shade900
                                    : Colors.amber.shade900,
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  'Date de fin : ${_formatDate(_globalDate)}',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 14,
                                    color: expired
                                        ? Colors.red.shade900
                                        : Colors.amber.shade900,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          if (remaining != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              remaining,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: expired
                                    ? Colors.red.shade900
                                    : Colors.amber.shade900,
                              ),
                            ),
                          ],
                          const SizedBox(height: 4),
                          Text(
                            'Appliquée à $programmedCount catégorie(s) sur ${_categories.length}',
                            style: const TextStyle(fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _saving
                                ? null
                                : () async {
                                    await _pickGlobalDate();
                                    if (_globalDate != null) {
                                      await _applyGlobal(
                                          enabled: true, date: _globalDate);
                                    }
                                  },
                            icon: const Icon(Icons.edit_calendar, size: 18),
                            label: const Text('Modifier la date'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _saving ? null : _disableGlobal,
                            icon: const Icon(Icons.lock_open, size: 18),
                            label: const Text('Désactiver'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.red,
                              side: const BorderSide(color: Colors.red),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ] else ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.check_circle_outline,
                              color: Colors.green),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Aucune programmation active. Tous les contenus sont accessibles aux utilisateurs abonnés.',
                              style: TextStyle(fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _saving
                            ? null
                            : () async {
                                await _pickGlobalDate();
                                if (_globalDate != null) {
                                  await _applyGlobal(
                                      enabled: true, date: _globalDate);
                                }
                              },
                        icon: const Icon(Icons.lock_clock, size: 18),
                        label: const Text('Programmer une date de fin globale'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                      ),
                    ),
                  ],
                  if (_saving) ...[
                    const SizedBox(height: 8),
                    const LinearProgressIndicator(),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          // ============ LISTE DES CATÉGORIES (état actuel) ============
          Text(
            '📚 État des ${_categories.length} catégories',
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w900,
              color: AppColors.darkTerracotta,
            ),
          ),
          const SizedBox(height: 6),
          ..._categories.map((c) {
            final programmed = c['is_programmed'] == true;
            final expired = c['expired'] == true;
            final dateV = c['date_validite']?.toString();
            String? dateStr;
            if (dateV != null) {
              try {
                final d = DateTime.parse(dateV).toLocal();
                dateStr =
                    '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
              } catch (_) {
                dateStr = dateV;
              }
            }
            return Card(
              margin: const EdgeInsets.symmetric(vertical: 3),
              child: ListTile(
                dense: true,
                leading: Text(
                  c['type'] == 'professionnel' ? '💼' : '🎓',
                  style: const TextStyle(fontSize: 18),
                ),
                title: Text(
                  c['nom']?.toString() ?? '',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                subtitle: Text(
                  programmed
                      ? (expired
                          ? '❌ Expirée le $dateStr (masquée)'
                          : '⏳ Se ferme le $dateStr')
                      : '✓ Accessible sans limite',
                  style: TextStyle(
                    fontSize: 12,
                    color: programmed
                        ? (expired ? Colors.red : Colors.orange.shade700)
                        : Colors.green,
                  ),
                ),
                trailing: Text(
                  '${c['question_count'] ?? 0} Q',
                  style: const TextStyle(
                      fontWeight: FontWeight.w900, color: Colors.black54),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}
