import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';

/// Programmation GLOBALE : une seule date/heure de fin de validité pour TOUTES les catégories.
/// Après cette date :
///  - Les DOSSIERS restent visibles (pour pouvoir s'abonner à nouveau)
///  - Seules les questions d'ordre > 5 deviennent inaccessibles aux non-admins
///  - L'admin voit TOUT, même après expiration
///
/// AMÉLIORATIONS :
/// - DateTime précis jusqu'à la SECONDE (utile pour tester rapidement)
/// - Boutons rapides : +1min, +5min, +30min, +1h
/// - Compte à rebours en temps réel (mise à jour chaque seconde)
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

  // État de la programmation globale
  DateTime? _globalDate;
  bool _globalEnabled = false;

  // Timer pour rafraîchir le compte à rebours toutes les secondes
  Timer? _ticker;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      if (_globalEnabled && _globalDate != null) {
        setState(() {}); // refresh countdown
      }
    });
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
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
                ? '✅ Programmation appliquée à $n catégorie(s) — fin : ${_formatDate(date)}'
                : '✅ Programmation désactivée ($n catégorie(s))'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
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

  /// Pickers : DATE puis HEURE (heure + minute) puis SECONDE via dialog custom.
  Future<DateTime?> _pickDateTime({DateTime? initial}) async {
    final start = initial ?? DateTime.now().add(const Duration(minutes: 5));

    // 1. Date
    final pickedDate = await showDatePicker(
      context: context,
      initialDate: start,
      firstDate: DateTime.now().subtract(const Duration(days: 1)),
      lastDate: DateTime(DateTime.now().year + 5),
      locale: const Locale('fr', 'FR'),
      helpText: 'Date de fin',
      cancelText: 'Annuler',
      confirmText: 'Suivant',
    );
    if (pickedDate == null) return null;

    if (!mounted) return null;
    // 2. Heure + minute
    final pickedTime = await showTimePicker(
      context: context,
      initialTime: TimeOfDay(hour: start.hour, minute: start.minute),
      helpText: 'Heure de fin (heure : minute)',
      cancelText: 'Annuler',
      confirmText: 'Suivant',
      builder: (ctx, child) => Localizations.override(
        context: ctx,
        locale: const Locale('fr', 'FR'),
        child: MediaQuery(
          data: MediaQuery.of(ctx).copyWith(alwaysUse24HourFormat: true),
          child: child!,
        ),
      ),
    );
    if (pickedTime == null) return null;

    if (!mounted) return null;
    // 3. Secondes via dialog custom
    final seconds = await _pickSeconds(initial: start.second);
    if (seconds == null) return null;

    return DateTime(
      pickedDate.year,
      pickedDate.month,
      pickedDate.day,
      pickedTime.hour,
      pickedTime.minute,
      seconds,
    );
  }

  Future<int?> _pickSeconds({int initial = 0}) async {
    int value = initial;
    return showDialog<int>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) => AlertDialog(
          title: const Text('Secondes (0 - 59)'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                value.toString().padLeft(2, '0'),
                style: const TextStyle(
                  fontSize: 48,
                  fontWeight: FontWeight.w900,
                  color: AppColors.primary,
                ),
              ),
              Slider(
                value: value.toDouble(),
                min: 0,
                max: 59,
                divisions: 59,
                label: value.toString(),
                onChanged: (v) => setSt(() => value = v.round()),
              ),
              const Text(
                'Astuce : laissez à 0 si vous n\'avez pas besoin de précision',
                style: TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
              ),
            ],
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Annuler')),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, value),
              child: const Text('Valider'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _quickSet(Duration offset) async {
    final d = DateTime.now().add(offset);
    setState(() {
      _globalDate = d;
      _globalEnabled = true;
    });
    await _applyGlobal(enabled: true, date: d);
  }

  Future<void> _pickGlobalDate() async {
    final picked = await _pickDateTime(initial: _globalDate);
    if (picked == null) return;
    if (!mounted) return;
    setState(() {
      _globalDate = picked;
      _globalEnabled = true;
    });
    await _applyGlobal(enabled: true, date: picked);
  }

  Future<void> _disableGlobal() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Désactiver la programmation ?'),
        content: const Text(
            'Toutes les questions redeviendront accessibles aux abonnés sans limite de date.'),
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
    return '${local.day.toString().padLeft(2, '0')}/${local.month.toString().padLeft(2, '0')}/${local.year} à ${local.hour.toString().padLeft(2, '0')}:${local.minute.toString().padLeft(2, '0')}:${local.second.toString().padLeft(2, '0')}';
  }

  String? _remainingTime() {
    if (_globalDate == null) return null;
    final diff = _globalDate!.difference(DateTime.now());
    if (diff.isNegative) {
      return '⛔ EXPIRÉ — Questions >5 masquées pour les utilisateurs';
    }
    final d = diff.inDays;
    final h = diff.inHours % 24;
    final m = diff.inMinutes % 60;
    final s = diff.inSeconds % 60;
    if (d > 0) return 'Fin dans ${d}j ${h}h ${m}min ${s}s';
    if (h > 0) return 'Fin dans ${h}h ${m}min ${s}s';
    if (m > 0) return 'Fin dans ${m}min ${s}s';
    return 'Fin dans ${s}s';
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
    final expired =
        _globalDate != null && _globalDate!.isBefore(DateTime.now());
    final programmedCount =
        _categories.where((c) => c['is_programmed'] == true).length;

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ============ INFO COMPORTEMENT ============
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFBFDBFE)),
            ),
            child: const Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.info_outline_rounded,
                    color: Color(0xFF1D4ED8), size: 20),
                SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Comportement après la date',
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 13,
                          color: Color(0xFF1D4ED8),
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        '• Les DOSSIERS restent visibles\n'
                        '• Les 5 premières questions restent gratuites\n'
                        '• Les questions d\'ordre > 5 deviennent inaccessibles aux non-admins\n'
                        '• L\'admin voit TOUT, même après expiration',
                        style: TextStyle(fontSize: 12, height: 1.5),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // ============ CARTE PRINCIPALE ============
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
                    'Définir une date/heure de fin précise (jusqu\'à la seconde). Après cette échéance, les questions au-delà de la 5ème seront masquées pour les non-admins.',
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
                                  'Fin : ${_formatDate(_globalDate)}',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 13,
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
                                fontSize: 14,
                                fontWeight: FontWeight.w900,
                                fontFeatures: const [
                                  FontFeature.tabularFigures()
                                ],
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
                            onPressed: _saving ? null : _pickGlobalDate,
                            icon: const Icon(Icons.edit_calendar, size: 18),
                            label: const Text('Modifier'),
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
                        onPressed: _saving ? null : _pickGlobalDate,
                        icon: const Icon(Icons.lock_clock, size: 18),
                        label: const Text(
                            'Programmer une fin précise (date + heure + sec.)'),
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
          const SizedBox(height: 16),

          // ============ RACCOURCIS POUR TESTER ============
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: const [
                      Icon(Icons.flash_on_rounded,
                          color: Color(0xFFEAB308), size: 20),
                      SizedBox(width: 6),
                      Text(
                        'Raccourcis pour tester rapidement',
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 14,
                          color: AppColors.darkTerracotta,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Définit une fin de validité dans X temps depuis maintenant.',
                    style: TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _quickBtn('+ 1 minute', const Duration(minutes: 1)),
                      _quickBtn('+ 5 minutes', const Duration(minutes: 5)),
                      _quickBtn('+ 30 secondes',
                          const Duration(seconds: 30)),
                      _quickBtn('+ 30 minutes',
                          const Duration(minutes: 30)),
                      _quickBtn('+ 1 heure', const Duration(hours: 1)),
                      _quickBtn('+ 1 jour', const Duration(days: 1)),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // ============ LISTE DES CATÉGORIES ============
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
                dateStr = _formatDate(d);
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
                          ? '❌ Expirée le $dateStr (questions >5 masquées)'
                          : '⏳ Se ferme le $dateStr')
                      : '✓ Accessible sans limite',
                  style: TextStyle(
                    fontSize: 11,
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

  Widget _quickBtn(String label, Duration offset) {
    return ElevatedButton.icon(
      onPressed: _saving ? null : () => _quickSet(offset),
      icon: const Icon(Icons.timer_outlined, size: 14),
      label: Text(label, style: const TextStyle(fontSize: 12)),
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFFFEF3C7),
        foregroundColor: const Color(0xFF92400E),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        elevation: 0,
      ),
    );
  }
}
