import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';

/// Section "⚡ Sessions spéciales" du panneau admin.
class AdminSessionsSection extends StatefulWidget {
  const AdminSessionsSection({super.key});

  @override
  State<AdminSessionsSection> createState() => _AdminSessionsSectionState();
}

class _AdminSessionsSectionState extends State<AdminSessionsSection> {
  List<Map<String, dynamic>> _sessions = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final auth = context.read<AuthService>();
      final res = await auth.api.adminSessions(auth.token!);
      if (mounted) {
        setState(() {
          _sessions = List<Map<String, dynamic>>.from(res["sessions"] ?? []);
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _delete(String id) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Supprimer ?"),
        content: const Text("Cette session sera supprimée définitivement."),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text("Annuler")),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text("Supprimer", style: TextStyle(color: Colors.white))),
        ],
      ),
    );
    if (ok != true) return;
    try {
      final auth = context.read<AuthService>();
      await auth.api.adminDeleteSession(auth.token!, id);
      _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Erreur : $e"), backgroundColor: Colors.red));
    }
  }

  void _create() => showDialog(
    context: context,
    builder: (ctx) => _SessionDialog(onSave: (body) async {
      final auth = context.read<AuthService>();
      await auth.api.adminCreateSession(auth.token!, body);
      if (mounted) { _load(); ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Session créée ✅"), backgroundColor: Color(0xFF16A34A))); }
    }),
  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF8F0),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _create,
        backgroundColor: const Color(0xFF7C3AED),
        icon: const Icon(Icons.add),
        label: const Text("Nouvelle session"),
      ),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : _error != null
          ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 12),
              Text(_error!, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: _load, child: const Text("Réessayer")),
            ]))
          : RefreshIndicator(
              onRefresh: _load,
              child: _sessions.isEmpty
                ? ListView(children: const [SizedBox(height: 80), Center(child: Column(children: [
                    Icon(Icons.flash_off, size: 56, color: Color(0xFF9CA3AF)),
                    SizedBox(height: 12),
                    Text("Aucune session spéciale", style: TextStyle(color: Color(0xFF6B7280))),
                    SizedBox(height: 6),
                    Text("Appuyez sur + pour créer une session", style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 13)),
                  ]))])
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                    itemCount: _sessions.length,
                    itemBuilder: (ctx, i) {
                      final s = _sessions[i];
                      final type = s["type"] ?? "";
                      final label = s["label"] ?? s["dossier_nom"] ?? "Session";
                      final prix = s["prix"] ?? 0;
                      final duration = s["duration_days"] ?? 0;
                      final isActive = s["is_active"] == true;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: isActive ? const Color(0xFF7C3AED) : const Color(0xFFE5E7EB)),
                        ),
                        child: Row(
                          children: [
                            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Row(children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: type == "pro" ? const Color(0xFF7C3AED) : const Color(0xFF0891B2),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(type == "pro" ? "⚡ PRO" : "⚡ DIRECT",
                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 10)),
                                ),
                                if (isActive) ...[
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(color: const Color(0xFF16A34A).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
                                    child: const Text("ACTIVE", style: TextStyle(color: Color(0xFF16A34A), fontWeight: FontWeight.w900, fontSize: 9)),
                                  ),
                                ],
                              ]),
                              const SizedBox(height: 8),
                              Text(label.toString(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                              const SizedBox(height: 4),
                              Text("${prix} FCFA · ${duration} jours", style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
                            ])),
                            IconButton(
                              icon: const Icon(Icons.delete_outline, color: Colors.red),
                              onPressed: () => _delete(s["id"].toString()),
                            ),
                          ],
                        ),
                      );
                    }),
            ),
    );
  }
}

class _SessionDialog extends StatefulWidget {
  final Future<void> Function(Map<String, dynamic>) onSave;
  const _SessionDialog({required this.onSave});
  @override
  State<_SessionDialog> createState() => _SessionDialogState();
}

class _SessionDialogState extends State<_SessionDialog> {
  final _formKey = GlobalKey<FormState>();
  String _type = "direct";
  final _labelCtrl = TextEditingController();
  final _dossierCtrl = TextEditingController();
  final _prixCtrl = TextEditingController(text: "5000");
  final _daysCtrl = TextEditingController(text: "30");
  bool _saving = false;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final now = DateTime.now();
      final end = now.add(Duration(days: int.tryParse(_daysCtrl.text) ?? 30));
      await widget.onSave({
        "type": _type,
        "label": _labelCtrl.text.trim(),
        if (_type == "pro") "dossier_nom": _dossierCtrl.text.trim(),
        "prix": int.tryParse(_prixCtrl.text) ?? 5000,
        "duration_days": int.tryParse(_daysCtrl.text) ?? 30,
        "start_date": now.toIso8601String(),
        "end_date": end.toIso8601String(),
        "is_active": true,
      });
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Erreur : $e"), backgroundColor: Colors.red));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Row(children: [Icon(Icons.flash_on, color: Color(0xFF7C3AED)), SizedBox(width: 8), Text("Nouvelle session spéciale")]),
      content: SizedBox(width: 380, child: Form(key: _formKey, child: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, children: [
        DropdownButtonFormField<String>(
          value: _type,
          decoration: const InputDecoration(labelText: "Type"),
          items: const [
            DropdownMenuItem(value: "direct", child: Text("Direct")),
            DropdownMenuItem(value: "pro", child: Text("Professionnel")),
          ],
          onChanged: (v) => setState(() => _type = v ?? "direct"),
        ),
        const SizedBox(height: 10),
        TextFormField(controller: _labelCtrl, decoration: const InputDecoration(labelText: "Titre *"), validator: (v) => v!.trim().isEmpty ? "Requis" : null),
        if (_type == "pro") ...[
          const SizedBox(height: 10),
          TextFormField(controller: _dossierCtrl, decoration: const InputDecoration(labelText: "Nom du dossier Pro *"), validator: (v) => _type == "pro" && v!.trim().isEmpty ? "Requis" : null),
        ],
        const SizedBox(height: 10),
        TextFormField(controller: _prixCtrl, decoration: const InputDecoration(labelText: "Prix (FCFA)", suffixText: "FCFA"), keyboardType: TextInputType.number),
        const SizedBox(height: 10),
        TextFormField(controller: _daysCtrl, decoration: const InputDecoration(labelText: "Durée", suffixText: "jours"), keyboardType: TextInputType.number),
      ])))),
      actions: [
        TextButton(onPressed: _saving ? null : () => Navigator.pop(context), child: const Text("Annuler")),
        ElevatedButton(
          onPressed: _saving ? null : _submit,
          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF7C3AED)),
          child: _saving
            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
            : const Text("Créer", style: TextStyle(color: Colors.white)),
        ),
      ],
    );
  }
}
