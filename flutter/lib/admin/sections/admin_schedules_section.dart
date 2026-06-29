import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';

/// Programmation par type : GLOBALE, CONCOURS DIRECT (12 dossiers), CONCOURS PRO (30 dossiers).
///
/// Chaque bloc a :
///  - Un état indépendant (date, enabled, expired)
///  - Des boutons raccourcis (+30s, +1min, +5min, +30min, +1h, +1j)
///  - Un compte à rebours en temps réel (rafraîchi chaque seconde)
///  - Picker date + heure + secondes
///
/// L'API utilisée : /api/admin/programmation
///   GET  → { global_end_date, global_enabled, global_expired,
///             direct_end_date,       direct_enabled,       direct_expired,
///             professional_end_date, professional_enabled, professional_expired }
///   POST → { type: 'global'|'direct'|'professionnel', end_date: ISO|null }
class AdminSchedulesSection extends StatefulWidget {
  const AdminSchedulesSection({super.key});

  @override
  State<AdminSchedulesSection> createState() => _AdminSchedulesSectionState();
}

// Helper de parsing de date ISO (défini en dehors du State pour éviter l'avertissement)
DateTime? parseIsoDate(String? s) {
  if (s == null || s.isEmpty) return null;
  try { return DateTime.parse(s); } catch (_) { return null; }
}

class _AdminSchedulesSectionState extends State<AdminSchedulesSection> {
  bool _loading = true;
  String? _error;

  // ── État GLOBAL ─────────────────────────────────────────────────────────────
  DateTime? _globalDate;
  bool _globalEnabled = false;
  bool _savingGlobal = false;

  // ── État DIRECT ──────────────────────────────────────────────────────────────
  DateTime? _directDate;
  bool _directEnabled = false;
  bool _savingDirect = false;

  // ── État PRO ─────────────────────────────────────────────────────────────────
  DateTime? _proDate;
  bool _proEnabled = false;
  bool _savingPro = false;

  // Timer pour rafraîchir les comptes à rebours chaque seconde
  Timer? _ticker;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      // Rafraîchir uniquement si une programmation est active
      if (_globalEnabled || _directEnabled || _proEnabled) {
        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CHARGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  Future<void> _load() async {
    final auth = context.read<AuthService>();
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await auth.api.adminProgrammation(auth.token!);
      if (!mounted) return;

      setState(() {
        // GLOBAL
        _globalDate    = parseIsoDate(res['global_end_date']?.toString());
        _globalEnabled = res['global_enabled'] == true;

        // DIRECT
        _directDate    = parseIsoDate(res['direct_end_date']?.toString());
        _directEnabled = res['direct_enabled'] == true;

        // PRO
        _proDate    = parseIsoDate(res['professional_end_date']?.toString());
        _proEnabled = res['professional_enabled'] == true;

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

  // ─────────────────────────────────────────────────────────────────────────────
  // SAUVEGARDER
  // ─────────────────────────────────────────────────────────────────────────────

  Future<void> _saveType(String type, {required bool enabled, DateTime? date}) async {
    final auth = context.read<AuthService>();
    final labels = {
      'global': 'Globale',
      'direct': 'Concours DIRECT',
      'professionnel': 'Concours PRO',
    };

    // Marquer en cours de sauvegarde
    setState(() {
      if (type == 'global')       _savingGlobal = true;
      if (type == 'direct')       _savingDirect = true;
      if (type == 'professionnel') _savingPro   = true;
    });

    try {
      final r = await auth.api.adminSetProgrammation(
        auth.token!,
        type: type,
        endDate: (enabled && date != null) ? date.toIso8601String() : null,
      );
      if (!mounted) return;

      if (r['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(enabled
                ? '✅ Programmation ${labels[type]} appliquée — fin : ${_formatDate(date)}'
                : '✅ Programmation ${labels[type]} désactivée'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur ${labels[type]} : ${r['error'] ?? "Inconnue"}'),
            backgroundColor: Colors.red,
          ),
        );
      }
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur : $e'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) {
        setState(() {
          if (type == 'global')       _savingGlobal = false;
          if (type == 'direct')       _savingDirect = false;
          if (type == 'professionnel') _savingPro   = false;
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PICKERS DATE / HEURE / SECONDES
  // ─────────────────────────────────────────────────────────────────────────────

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
    if (pickedDate == null || !mounted) return null;

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
    if (pickedTime == null || !mounted) return null;

    // 3. Secondes via dialog custom
    final seconds = await _pickSeconds(initial: start.second);
    if (seconds == null) return null;

    return DateTime(
      pickedDate.year, pickedDate.month, pickedDate.day,
      pickedTime.hour, pickedTime.minute, seconds,
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
                min: 0, max: 59, divisions: 59,
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
              child: const Text('Annuler'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, value),
              child: const Text('Valider'),
            ),
          ],
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RACCOURCIS RAPIDES
  // ─────────────────────────────────────────────────────────────────────────────

  Future<void> _quickSet(String type, Duration offset) async {
    final d = DateTime.now().add(offset);
    await _saveType(type, enabled: true, date: d);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DÉSACTIVER (avec confirmation)
  // ─────────────────────────────────────────────────────────────────────────────

  Future<void> _disable(String type, String label) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Désactiver $label ?'),
        content: const Text(
          'Les contenus concernés redeviendront accessibles aux abonnés sans limite de date.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Désactiver'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    await _saveType(type, enabled: false);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS DE FORMATAGE
  // ─────────────────────────────────────────────────────────────────────────────

  String _formatDate(DateTime? d) {
    if (d == null) return '—';
    final l = d.toLocal();
    return '${l.day.toString().padLeft(2, '0')}/${l.month.toString().padLeft(2, '0')}/${l.year}'
        ' à ${l.hour.toString().padLeft(2, '0')}:${l.minute.toString().padLeft(2, '0')}:${l.second.toString().padLeft(2, '0')}';
  }

  String? _remaining(DateTime? date, bool enabled) {
    if (!enabled || date == null) return null;
    final diff = date.difference(DateTime.now());
    if (diff.isNegative) return '⛔ EXPIRÉ — Questions >5 masquées';
    final d = diff.inDays;
    final h = diff.inHours % 24;
    final m = diff.inMinutes % 60;
    final s = diff.inSeconds % 60;
    if (d > 0) return 'Fin dans ${d}j ${h}h ${m}min ${s}s';
    if (h > 0) return 'Fin dans ${h}h ${m}min ${s}s';
    if (m > 0) return 'Fin dans ${m}min ${s}s';
    return 'Fin dans ${s}s';
  }

  bool _isExpired(DateTime? date, bool enabled) =>
      enabled && date != null && date.isBefore(DateTime.now());

  // ─────────────────────────────────────────────────────────────────────────────
  // BUILD
  // ─────────────────────────────────────────────────────────────────────────────

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

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ─── Bandeau d'info ────────────────────────────────────────────────
          _buildInfoBanner(),
          const SizedBox(height: 16),

          // ─── BLOC GLOBAL ───────────────────────────────────────────────────
          _buildTypeCard(
            type: 'global',
            label: '🌐 Programmation GLOBALE',
            subtitle: 'S\'applique à TOUS les dossiers (Direct + Pro)',
            badgeColor: const Color(0xFF7C3AED),
            date: _globalDate,
            enabled: _globalEnabled,
            saving: _savingGlobal,
            onPickDate: () async {
              final d = await _pickDateTime(initial: _globalDate);
              if (d == null || !mounted) return;
              setState(() { _globalDate = d; _globalEnabled = true; });
              await _saveType('global', enabled: true, date: d);
            },
            onDisable: () => _disable('global', 'la programmation Globale'),
            onQuickSet: (dur) => _quickSet('global', dur),
          ),
          const SizedBox(height: 16),

          // ─── BLOC DIRECT ───────────────────────────────────────────────────
          _buildTypeCard(
            type: 'direct',
            label: '🎓 Programmation CONCOURS DIRECT',
            subtitle: '12 dossiers directs uniquement',
            badgeColor: const Color(0xFF2563EB),
            date: _directDate,
            enabled: _directEnabled,
            saving: _savingDirect,
            onPickDate: () async {
              final d = await _pickDateTime(initial: _directDate);
              if (d == null || !mounted) return;
              setState(() { _directDate = d; _directEnabled = true; });
              await _saveType('direct', enabled: true, date: d);
            },
            onDisable: () => _disable('direct', 'la programmation Concours DIRECT'),
            onQuickSet: (dur) => _quickSet('direct', dur),
          ),
          const SizedBox(height: 16),

          // ─── BLOC PRO ──────────────────────────────────────────────────────
          _buildTypeCard(
            type: 'professionnel',
            label: '💼 Programmation CONCOURS PRO',
            subtitle: '36 dossiers professionnels uniquement',
            badgeColor: const Color(0xFF059669),
            date: _proDate,
            enabled: _proEnabled,
            saving: _savingPro,
            onPickDate: () async {
              final d = await _pickDateTime(initial: _proDate);
              if (d == null || !mounted) return;
              setState(() { _proDate = d; _proEnabled = true; });
              await _saveType('professionnel', enabled: true, date: d);
            },
            onDisable: () => _disable('professionnel', 'la programmation Concours PRO'),
            onQuickSet: (dur) => _quickSet('professionnel', dur),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // WIDGETS RÉUTILISABLES
  // ─────────────────────────────────────────────────────────────────────────────

  Widget _buildInfoBanner() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFBFDBFE)),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline_rounded, color: Color(0xFF1D4ED8), size: 20),
          SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Comportement après la date d\'expiration',
                  style: TextStyle(
                    fontWeight: FontWeight.w900, fontSize: 13,
                    color: Color(0xFF1D4ED8),
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  '• Les DOSSIERS restent visibles\n'
                  '• Les 5 premières questions restent gratuites\n'
                  '• Les questions d\'ordre > 5 sont masquées pour les non-admins\n'
                  '• L\'admin voit TOUT, même après expiration\n'
                  '• GLOBALE s\'applique à tous les types ; DIRECT/PRO s\'appliquent séparément',
                  style: TextStyle(fontSize: 12, height: 1.5),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypeCard({
    required String type,
    required String label,
    required String subtitle,
    required Color badgeColor,
    required DateTime? date,
    required bool enabled,
    required bool saving,
    required VoidCallback onPickDate,
    required VoidCallback onDisable,
    required void Function(Duration) onQuickSet,
  }) {
    final expired = _isExpired(date, enabled);
    final remaining = _remaining(date, enabled);

    Color cardBg;
    if (!enabled) {
      cardBg = Colors.white;
    } else if (expired) {
      cardBg = Colors.red.shade50;
    } else {
      cardBg = Colors.green.shade50;
    }

    return Card(
      elevation: 3,
      color: cardBg,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(
          color: enabled
              ? (expired ? Colors.red.shade300 : Colors.green.shade300)
              : Colors.grey.shade200,
          width: enabled ? 1.5 : 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ─ En-tête ──────────────────────────────────────────────────────
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: badgeColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    enabled
                        ? (expired ? Icons.block : Icons.lock_clock)
                        : Icons.lock_open,
                    color: enabled ? (expired ? Colors.red : badgeColor) : Colors.grey,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        label,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w900,
                          color: badgeColor,
                        ),
                      ),
                      Text(
                        subtitle,
                        style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
                      ),
                    ],
                  ),
                ),
                // Badge état
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: enabled
                        ? (expired ? Colors.red : Colors.green)
                        : Colors.grey.shade400,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    enabled ? (expired ? 'EXPIRÉ' : 'ACTIF') : 'INACTIF',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 10,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // ─ Date / compte à rebours ──────────────────────────────────────
            if (enabled && date != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: expired ? Colors.red.shade100 : Colors.amber.shade100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          expired ? Icons.block : Icons.timer,
                          size: 18,
                          color: expired ? Colors.red.shade900 : Colors.amber.shade900,
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            'Fin : ${_formatDate(date)}',
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
                          color: expired
                              ? Colors.red.shade900
                              : Colors.amber.shade900,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: saving ? null : onPickDate,
                      icon: const Icon(Icons.edit_calendar, size: 16),
                      label: const Text('Modifier'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: badgeColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: saving ? null : onDisable,
                      icon: const Icon(Icons.lock_open, size: 16),
                      label: const Text('Désactiver'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red,
                        side: const BorderSide(color: Colors.red),
                        padding: const EdgeInsets.symmetric(vertical: 10),
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
                    Icon(Icons.check_circle_outline, color: Colors.green),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Aucune programmation active. Les contenus concernés sont accessibles.',
                        style: TextStyle(fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: saving ? null : onPickDate,
                  icon: const Icon(Icons.lock_clock, size: 16),
                  label: const Text('Programmer une fin précise (date + heure + sec.)'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: badgeColor,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 13),
                  ),
                ),
              ),
            ],

            if (saving) ...[
              const SizedBox(height: 8),
              const LinearProgressIndicator(),
            ],

            // ─ Raccourcis rapides ────────────────────────────────────────────
            const SizedBox(height: 12),
            const Divider(height: 1),
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(Icons.flash_on_rounded, color: Colors.amber.shade700, size: 16),
                const SizedBox(width: 4),
                Text(
                  'Raccourcis rapides',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 12,
                    color: Colors.amber.shade800,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                _quickBtn('+ 30s',   const Duration(seconds: 30), onQuickSet, saving),
                _quickBtn('+ 1min',  const Duration(minutes: 1),  onQuickSet, saving),
                _quickBtn('+ 5min',  const Duration(minutes: 5),  onQuickSet, saving),
                _quickBtn('+ 30min', const Duration(minutes: 30), onQuickSet, saving),
                _quickBtn('+ 1h',    const Duration(hours: 1),    onQuickSet, saving),
                _quickBtn('+ 1j',    const Duration(days: 1),     onQuickSet, saving),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _quickBtn(String label, Duration offset,
      void Function(Duration) onQuickSet, bool saving) {
    return ElevatedButton.icon(
      onPressed: saving ? null : () => onQuickSet(offset),
      icon: const Icon(Icons.timer_outlined, size: 12),
      label: Text(label, style: const TextStyle(fontSize: 11)),
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFFFEF3C7),
        foregroundColor: const Color(0xFF92400E),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        elevation: 0,
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
    );
  }
}
