import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';

/// Programmation des dates d'ouverture / fermeture par catégorie.
class AdminSchedulesSection extends StatefulWidget {
  const AdminSchedulesSection({super.key});

  @override
  State<AdminSchedulesSection> createState() => _AdminSchedulesSectionState();
}

class _AdminSchedulesSectionState extends State<AdminSchedulesSection> {
  bool _loading = true;
  List<Map<String, dynamic>> _schedules = [];
  List<Map<String, dynamic>> _categories = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final auth = context.read<AuthService>();
    setState(() => _loading = true);
    try {
      final s = await auth.api.adminSchedules(auth.token!);
      final c = await auth.api.adminCategories(auth.token!);
      if (!mounted) return;
      setState(() {
        _schedules = (s['schedules'] as List? ?? s['categories'] as List? ?? [])
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        _categories = (c['categories'] as List? ?? [])
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _program(Map<String, dynamic> cat) async {
    final res = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (ctx) => _ScheduleDialog(cat: cat),
    );
    if (res == null) return;
    final auth = context.read<AuthService>();
    try {
      await auth.api.adminProgramSchedule(
        auth.token!,
        categoryIds: [cat['id'].toString()],
        dateValidite: res['ends_at'] ?? res['starts_at'],
        enabled: true,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Programmation enregistrée')),
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
    final list = _categories.isNotEmpty ? _categories : _schedules;
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: list.length,
        itemBuilder: (ctx, i) {
          final c = list[i];
          return Card(
            child: ListTile(
              title: Text(c['nom']?.toString() ?? '',
                  style: const TextStyle(fontWeight: FontWeight.w800)),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (c['starts_at'] != null)
                    Text('🟢 Ouvre : ${c['starts_at']}'),
                  if (c['ends_at'] != null)
                    Text('🔴 Ferme : ${c['ends_at']}'),
                  if (c['starts_at'] == null && c['ends_at'] == null)
                    const Text('Pas de programmation',
                        style: TextStyle(color: Colors.black54)),
                ],
              ),
              trailing: IconButton(
                icon:
                    const Icon(Icons.schedule, color: AppColors.primary),
                onPressed: () => _program(c),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _ScheduleDialog extends StatefulWidget {
  final Map<String, dynamic> cat;
  const _ScheduleDialog({required this.cat});

  @override
  State<_ScheduleDialog> createState() => _ScheduleDialogState();
}

class _ScheduleDialogState extends State<_ScheduleDialog> {
  late TextEditingController _starts;
  late TextEditingController _ends;

  @override
  void initState() {
    super.initState();
    _starts = TextEditingController(
        text: widget.cat['starts_at']?.toString() ?? '');
    _ends = TextEditingController(
        text: widget.cat['ends_at']?.toString() ?? '');
  }

  @override
  void dispose() {
    _starts.dispose();
    _ends.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Programmer : ${widget.cat['nom']}'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _starts,
            decoration: const InputDecoration(
                labelText: 'Ouverture (AAAA-MM-JJ HH:MM)',
                hintText: '2026-05-01 08:00'),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _ends,
            decoration: const InputDecoration(
                labelText: 'Fermeture (AAAA-MM-JJ HH:MM)',
                hintText: '2026-06-30 23:59'),
          ),
        ],
      ),
      actions: [
        TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler')),
        ElevatedButton(
          onPressed: () => Navigator.pop(context, {
            'starts_at':
                _starts.text.trim().isEmpty ? null : _starts.text.trim(),
            'ends_at': _ends.text.trim().isEmpty ? null : _ends.text.trim(),
          }),
          child: const Text('Enregistrer'),
        ),
      ],
    );
  }
}
