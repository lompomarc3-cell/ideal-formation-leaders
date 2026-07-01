import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../services/auth_service.dart';


/// Section "⚡ Sessions spéciales" du panneau admin — v3.0.7
/// CRUD complet : Créer, Modifier, Désactiver, Supprimer
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

  Future<void> _toggleActive(Map<String, dynamic> s) async {
    final newVal = !(s["is_active"] == true);
    final auth = context.read<AuthService>();
    final token = auth.token!;
    try {
      await auth.api.adminUpdateSession(token, {
        "id": s["id"],
        "is_active": newVal,
      });
      _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(newVal ? "Session activée ✅" : "Session désactivée ⏸️"),
          backgroundColor: newVal ? const Color(0xFF16A34A) : const Color(0xFFCA8A04),
        ));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Erreur : $e"), backgroundColor: Colors.red));
      }
    }
  }

  Future<void> _delete(String id) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(children: [
          Icon(Icons.warning_amber_rounded, color: Colors.red),
          SizedBox(width: 8),
          Text("Supprimer ?"),
        ]),
        content: const Text("Cette session sera supprimée définitivement.\nCette action est irréversible."),
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
      final token = auth.token!;
      await auth.api.adminDeleteSession(token, id);
      _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Session supprimée"), backgroundColor: Colors.red));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Erreur : $e"), backgroundColor: Colors.red));
      }
    }
  }

  void _create() => showDialog(
    context: context,
    builder: (ctx) => _SessionDialog(
      onSave: (body) async {
        final auth = context.read<AuthService>();
        await auth.api.adminCreateSession(auth.token!, body);
        if (mounted) {
          _load();
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text("Session créée ✅"),
            backgroundColor: Color(0xFF16A34A),
          ));
        }
      },
    ),
  );

  void _edit(Map<String, dynamic> session) => showDialog(
    context: context,
    builder: (ctx) => _SessionDialog(
      existing: session,
      onSave: (body) async {
        final auth = context.read<AuthService>();
        await auth.api.adminUpdateSession(auth.token!, body);
        if (mounted) {
          _load();
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text("Session modifiée ✅"),
            backgroundColor: Color(0xFF0891B2),
          ));
        }
      },
    ),
  );

  String _formatDate(String? iso) {
    if (iso == null) return '—';
    try {
      final d = DateTime.parse(iso).toLocal();
      return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
    } catch (_) {
      return '—';
    }
  }

  String _countdown(String? endDateStr) {
    if (endDateStr == null) return '';
    final end = DateTime.tryParse(endDateStr);
    if (end == null) return '';
    final diff = end.difference(DateTime.now());
    if (diff.isNegative) return 'Expiré';
    final d = diff.inDays;
    final h = diff.inHours % 24;
    if (d > 0) return '${d}j ${h}h restants';
    if (h > 0) return '${h}h restantes';
    return 'Expire bientôt';
  }

  @override
  Widget build(BuildContext context) {
    final activeCount = _sessions.where((s) => s["is_active"] == true).length;

    return Scaffold(
      backgroundColor: const Color(0xFFFFF8F0),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _create,
        backgroundColor: const Color(0xFF7C3AED),
        icon: const Icon(Icons.add),
        label: const Text("Nouvelle session"),
      ),
      body: Column(
        children: [
          // En-tête stats
          Container(
            margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF7C3AED), Color(0xFF4F46E5)],
              ),
              borderRadius: BorderRadius.circular(18),
            ),
            child: Row(
              children: [
                const Icon(Icons.flash_on, color: Colors.white, size: 28),
                const SizedBox(width: 12),
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text("Sessions spéciales", style: TextStyle(
                    color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
                  Text("$activeCount active${activeCount > 1 ? 's' : ''} · ${_sessions.length} au total",
                    style: const TextStyle(color: Color(0xFFDDD6FE), fontSize: 12)),
                ]),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.refresh, color: Colors.white),
                  onPressed: _load,
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: _loading
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
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                          itemCount: _sessions.length,
                          itemBuilder: (ctx, i) => _buildSessionCard(_sessions[i]),
                        ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildSessionCard(Map<String, dynamic> s) {
    final type = s["type"]?.toString() ?? "";
    final label = s["label"]?.toString() ?? s["dossier_nom"]?.toString() ?? "Session";
    final prix = s["prix"] as int? ?? 0;
    final duration = s["duration_days"] as int? ?? 0;
    final isActive = s["is_active"] == true;
    final endDate = s["end_date"]?.toString();
    final countdown = _countdown(endDate);
    final isExpired = endDate != null &&
        DateTime.tryParse(endDate)?.isBefore(DateTime.now()) == true;

    final Color typeColor = type == "professionnel"
        ? const Color(0xFF7C3AED)
        : const Color(0xFF0891B2);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isExpired
              ? const Color(0xFFE5E7EB)
              : isActive
                  ? typeColor.withValues(alpha: 0.5)
                  : const Color(0xFFE5E7EB),
          width: isActive && !isExpired ? 2 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: typeColor.withValues(alpha: isActive && !isExpired ? 0.12 : 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              // Badge type
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: typeColor,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  type == "professionnel" ? "⚡ PRO" : "⚡ DIRECT",
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 10),
                ),
              ),
              const SizedBox(width: 6),
              // Badge statut
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: isExpired
                      ? Colors.red.withValues(alpha: 0.1)
                      : isActive
                          ? const Color(0xFF16A34A).withValues(alpha: 0.1)
                          : const Color(0xFFCA8A04).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  isExpired ? "EXPIRÉE" : isActive ? "ACTIVE" : "INACTIVE",
                  style: TextStyle(
                    color: isExpired
                        ? Colors.red
                        : isActive
                            ? const Color(0xFF16A34A)
                            : const Color(0xFFCA8A04),
                    fontWeight: FontWeight.w900,
                    fontSize: 9,
                  ),
                ),
              ),
              const Spacer(),
              // Actions
              IconButton(
                icon: Icon(
                  isActive ? Icons.pause_circle_outline : Icons.play_circle_outline,
                  color: isActive ? const Color(0xFFCA8A04) : const Color(0xFF16A34A),
                ),
                tooltip: isActive ? "Désactiver" : "Activer",
                onPressed: isExpired ? null : () => _toggleActive(s),
              ),
              IconButton(
                icon: const Icon(Icons.edit_outlined, color: Color(0xFF0891B2)),
                tooltip: "Modifier",
                onPressed: () => _edit(s),
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline, color: Colors.red),
                tooltip: "Supprimer",
                onPressed: () => _delete(s["id"].toString()),
              ),
            ]),
            const SizedBox(height: 10),
            Text(label, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Color(0xFF1F2937))),
            if (s["description"]?.toString().isNotEmpty == true) ...[
              const SizedBox(height: 4),
              Text(s["description"].toString(), style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
            ],
            const SizedBox(height: 10),
            // Prix + durée + dates
            Row(children: [
              _chip(Icons.attach_money_rounded, "$prix FCFA", const Color(0xFF16A34A)),
              const SizedBox(width: 6),
              _chip(Icons.schedule_rounded, "$duration jour${duration > 1 ? 's' : ''}", const Color(0xFF0891B2)),
              const SizedBox(width: 6),
              if (countdown.isNotEmpty)
                _chip(Icons.timer_rounded, countdown,
                  isExpired ? Colors.red : const Color(0xFF7C3AED)),
            ]),
            const SizedBox(height: 8),
            Text(
              "Du ${_formatDate(s['start_date'])} au ${_formatDate(s['end_date'])}",
              style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF)),
            ),
            if (type == "professionnel" && s["dossier_nom"] != null) ...[
              const SizedBox(height: 4),
              Text("📂 ${s['dossier_nom']}", style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
            ],
          ],
        ),
      ),
    );
  }

  Widget _chip(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 12, color: color),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w700)),
      ]),
    );
  }
}

// ============================================================
// Dialogue de création / modification
// ============================================================

class _SessionDialog extends StatefulWidget {
  final Map<String, dynamic>? existing;
  final Future<void> Function(Map<String, dynamic>) onSave;
  const _SessionDialog({this.existing, required this.onSave});

  @override
  State<_SessionDialog> createState() => _SessionDialogState();
}

class _SessionDialogState extends State<_SessionDialog> {
  final _formKey = GlobalKey<FormState>();
  late String _type;
  late TextEditingController _labelCtrl;
  late TextEditingController _descCtrl;
  late TextEditingController _dossierCtrl;
  late TextEditingController _prixCtrl;
  late TextEditingController _daysCtrl;
  late TextEditingController _startCtrl;
  late TextEditingController _endCtrl;
  bool _saving = false;
  bool _isActive = false; // v3.0.9 : inactif par défaut → l'admin active manuellement

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _type = e?["type"]?.toString() ?? "direct";
    // v3.0.9 : Nouvelle session = inactive (false) par défaut
    // Si on modifie une session existante, conserver son statut actuel
    _isActive = e != null ? (e["is_active"] == true) : false;
    _labelCtrl = TextEditingController(text: e?["label"]?.toString() ?? '');
    _descCtrl = TextEditingController(text: e?["description"]?.toString() ?? '');
    _dossierCtrl = TextEditingController(text: e?["dossier_nom"]?.toString() ?? '');
    _prixCtrl = TextEditingController(text: (e?["prix"] ?? 5000).toString());
    _daysCtrl = TextEditingController(text: (e?["duration_days"] ?? 7).toString());

    final now = DateTime.now();
    final defaultEnd = now.add(const Duration(days: 7));

    String _isoToInput(String? iso) {
      if (iso == null) return '';
      try {
        final d = DateTime.parse(iso).toLocal();
        return '${d.year}-${d.month.toString().padLeft(2,'0')}-${d.day.toString().padLeft(2,'0')}';
      } catch (_) {
        return '';
      }
    }

    _startCtrl = TextEditingController(
      text: e != null ? _isoToInput(e["start_date"]?.toString()) : '${now.year}-${now.month.toString().padLeft(2,'0')}-${now.day.toString().padLeft(2,'0')}',
    );
    _endCtrl = TextEditingController(
      text: e != null ? _isoToInput(e["end_date"]?.toString()) : '${defaultEnd.year}-${defaultEnd.month.toString().padLeft(2,'0')}-${defaultEnd.day.toString().padLeft(2,'0')}',
    );
  }

  @override
  void dispose() {
    _labelCtrl.dispose();
    _descCtrl.dispose();
    _dossierCtrl.dispose();
    _prixCtrl.dispose();
    _daysCtrl.dispose();
    _startCtrl.dispose();
    _endCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate(TextEditingController ctrl) async {
    DateTime initial;
    try { initial = DateTime.parse(ctrl.text); } catch (_) { initial = DateTime.now(); }
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2024),
      lastDate: DateTime(2030),
    );
    if (picked != null) {
      ctrl.text = '${picked.year}-${picked.month.toString().padLeft(2,'0')}-${picked.day.toString().padLeft(2,'0')}';
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      DateTime startDate, endDate;
      try {
        startDate = DateTime.parse(_startCtrl.text);
        endDate = DateTime.parse(_endCtrl.text);
      } catch (_) {
        startDate = DateTime.now();
        endDate = startDate.add(Duration(days: int.tryParse(_daysCtrl.text) ?? 7));
      }

      final body = <String, dynamic>{
        if (widget.existing != null) "id": widget.existing!["id"],
        "type": _type,
        "label": _labelCtrl.text.trim(),
        "description": _descCtrl.text.trim(),
        if (_type == "professionnel") "dossier_nom": _dossierCtrl.text.trim(),
        "prix": int.tryParse(_prixCtrl.text) ?? 5000,
        "duration_days": int.tryParse(_daysCtrl.text) ?? 7,
        "start_date": startDate.toUtc().toIso8601String(),
        "end_date": endDate.toUtc().toIso8601String(),
        "is_active": _isActive,
      };

      await widget.onSave(body);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Erreur : $e"), backgroundColor: Colors.red));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.existing != null;
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
      title: Row(children: [
        const Icon(Icons.flash_on, color: Color(0xFF7C3AED)),
        const SizedBox(width: 8),
        Text(isEdit ? "Modifier la session" : "Nouvelle session spéciale"),
      ]),
      content: SizedBox(
        width: 380,
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              // Type
              DropdownButtonFormField<String>(
                value: _type,
                decoration: const InputDecoration(labelText: "Type", border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(value: "direct", child: Text("⚡ Direct")),
                  DropdownMenuItem(value: "professionnel", child: Text("⚡ Professionnel")),
                ],
                onChanged: (v) => setState(() => _type = v ?? "direct"),
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _labelCtrl,
                decoration: const InputDecoration(labelText: "Titre de l'offre *", border: OutlineInputBorder()),
                validator: (v) => v!.trim().isEmpty ? "Requis" : null,
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _descCtrl,
                decoration: const InputDecoration(labelText: "Description", border: OutlineInputBorder()),
                maxLines: 2,
              ),
              if (_type == "professionnel") ...[
                const SizedBox(height: 10),
                TextFormField(
                  controller: _dossierCtrl,
                  decoration: const InputDecoration(labelText: "Nom du dossier Pro *", border: OutlineInputBorder()),
                  validator: (v) => _type == "professionnel" && v!.trim().isEmpty ? "Requis" : null,
                ),
              ],
              const SizedBox(height: 10),
              Row(children: [
                Expanded(
                  child: TextFormField(
                    controller: _prixCtrl,
                    decoration: const InputDecoration(labelText: "Prix (FCFA)", suffixText: "FCFA", border: OutlineInputBorder()),
                    keyboardType: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextFormField(
                    controller: _daysCtrl,
                    decoration: const InputDecoration(labelText: "Durée", suffixText: "jours", border: OutlineInputBorder()),
                    keyboardType: TextInputType.number,
                  ),
                ),
              ]),
              const SizedBox(height: 10),
              // Dates
              Row(children: [
                Expanded(
                  child: TextFormField(
                    controller: _startCtrl,
                    decoration: InputDecoration(
                      labelText: "Début",
                      border: const OutlineInputBorder(),
                      suffixIcon: IconButton(icon: const Icon(Icons.calendar_today), onPressed: () => _pickDate(_startCtrl)),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextFormField(
                    controller: _endCtrl,
                    decoration: InputDecoration(
                      labelText: "Fin",
                      border: const OutlineInputBorder(),
                      suffixIcon: IconButton(icon: const Icon(Icons.calendar_today), onPressed: () => _pickDate(_endCtrl)),
                    ),
                  ),
                ),
              ]),
              const SizedBox(height: 10),
              // Statut actif
              SwitchListTile(
                title: const Text("Session active"),
                subtitle: Text(
                  _isActive
                    ? "✅ Visible par les utilisateurs"
                    : "🔴 Masquée — activez pour la rendre visible",
                  style: TextStyle(
                    color: _isActive ? const Color(0xFF16A34A) : Colors.red[700],
                    fontWeight: FontWeight.w600,
                  ),
                ),
                value: _isActive,
                activeThumbColor: const Color(0xFF7C3AED),
                onChanged: (v) => setState(() => _isActive = v),
              ),
            ]),
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: _saving ? null : () => Navigator.pop(context),
          child: const Text("Annuler"),
        ),
        ElevatedButton(
          onPressed: _saving ? null : _submit,
          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF7C3AED)),
          child: _saving
            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
            : Text(isEdit ? "Modifier" : "Créer", style: const TextStyle(color: Colors.white)),
        ),
      ],
    );
  }
}
