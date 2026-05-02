import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';

/// Gestion complète des utilisateurs : liste, édition d'abonnement, suppression.
class AdminUsersSection extends StatefulWidget {
  const AdminUsersSection({super.key});

  @override
  State<AdminUsersSection> createState() => _AdminUsersSectionState();
}

class _AdminUsersSectionState extends State<AdminUsersSection> {
  bool _loading = true;
  List<Map<String, dynamic>> _users = [];
  String _search = '';
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
      final res = await auth.api.adminUsers(auth.token!);
      if (!mounted) return;
      setState(() {
        _users = (res['users'] as List? ?? [])
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

  List<Map<String, dynamic>> get _filtered {
    if (_search.isEmpty) return _users;
    final q = _search.toLowerCase();
    return _users.where((u) {
      return (u['phone']?.toString() ?? '').toLowerCase().contains(q) ||
          (u['full_name']?.toString() ?? '').toLowerCase().contains(q) ||
          (u['nom']?.toString() ?? '').toLowerCase().contains(q) ||
          (u['prenom']?.toString() ?? '').toLowerCase().contains(q);
    }).toList();
  }

  bool _isActive(Map<String, dynamic> u) {
    return u['subscription_status'] == 'active';
  }

  Future<void> _editSubscription(Map<String, dynamic> user) async {
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (ctx) => _EditSubscriptionDialog(user: user),
    );
    if (result == null) return;
    final auth = context.read<AuthService>();
    try {
      final r = await auth.api.adminUpdateUser(
        auth.token!,
        id: user['id'].toString(),
        subscriptionStatus:
            (result['is_active'] as bool?) == true ? 'active' : 'inactive',
        subscriptionType: result['subscription_type'] as String?,
        dossierPrincipal: result['dossier_principal'] as String?,
        subscriptionExpiresAt: result['subscription_expires_at'] as String?,
      );
      if (!mounted) return;
      if (r['success'] == true || r['user'] != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Abonnement mis à jour'),
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

  Future<void> _deleteUser(Map<String, dynamic> user) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Supprimer l\'utilisateur ?'),
        content: Text(
            'Voulez-vous vraiment supprimer ${user['full_name'] ?? user['phone']} ? Cette action est irréversible.\n\nToutes les données associées (paiements, progression) seront aussi supprimées.'),
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
      final r = await auth.api.adminDeleteUser(auth.token!, user['id'].toString());
      if (!mounted) return;
      if (r['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('✅ Utilisateur supprimé'),
              backgroundColor: Colors.green),
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

  String _formatDate(String? iso) {
    if (iso == null || iso.isEmpty) return '—';
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
                child: TextField(
                  decoration: const InputDecoration(
                    hintText: 'Rechercher par nom, téléphone…',
                    prefixIcon: Icon(Icons.search),
                    isDense: true,
                    border: OutlineInputBorder(),
                  ),
                  onChanged: (v) => setState(() => _search = v),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '${_filtered.length}/${_users.length}',
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  color: AppColors.darkTerracotta,
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: _filtered.isEmpty
              ? const Center(
                  child: Text('Aucun utilisateur',
                      style: TextStyle(color: Colors.black54)),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    itemCount: _filtered.length,
                    itemBuilder: (ctx, i) {
                      final u = _filtered[i];
                      final active = _isActive(u);
                      final abtType = u['abonnement_type']?.toString() ?? 'aucun';
                      final dossiers =
                          (u['dossiers_principaux'] as List?)?.cast<dynamic>() ?? [];
                      return Card(
                        margin: const EdgeInsets.symmetric(vertical: 4),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      (u['full_name']?.toString().isNotEmpty ??
                                              false)
                                          ? u['full_name'].toString()
                                          : '(Sans nom)',
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 15),
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: active
                                          ? const Color(0xFFD1FAE5)
                                          : Colors.grey.shade200,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      active ? '✓ Actif' : 'Inactif',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w800,
                                        color: active
                                            ? Colors.green.shade900
                                            : Colors.grey.shade700,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text('📞 ${u['phone'] ?? '—'}',
                                  style: const TextStyle(fontSize: 13)),
                              const SizedBox(height: 3),
                              Row(
                                children: [
                                  Icon(
                                    abtType == 'professionnel'
                                        ? Icons.work
                                        : abtType == 'direct'
                                            ? Icons.school
                                            : Icons.person,
                                    size: 14,
                                    color: Colors.black54,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    abtType == 'professionnel'
                                        ? 'Professionnel'
                                        : abtType == 'direct'
                                            ? 'Direct'
                                            : 'Aucun abonnement',
                                    style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600),
                                  ),
                                ],
                              ),
                              if (dossiers.isNotEmpty) ...[
                                const SizedBox(height: 3),
                                Wrap(
                                  spacing: 4,
                                  runSpacing: 4,
                                  children: dossiers
                                      .map((d) => Container(
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: Colors.blue.shade50,
                                              borderRadius:
                                                  BorderRadius.circular(4),
                                              border: Border.all(
                                                  color: Colors.blue.shade200),
                                            ),
                                            child: Text(
                                              '📂 ${d.toString()}',
                                              style: const TextStyle(
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.w700),
                                            ),
                                          ))
                                      .toList(),
                                ),
                              ],
                              if (u['subscription_expires_at'] != null) ...[
                                const SizedBox(height: 3),
                                Text(
                                  '⏰ Expire : ${_formatDate(u['subscription_expires_at']?.toString())}',
                                  style: const TextStyle(
                                      fontSize: 11, color: Colors.black54),
                                ),
                              ],
                              if (u['created_at'] != null) ...[
                                const SizedBox(height: 2),
                                Text(
                                    '📅 Inscrit le : ${_formatDate(u['created_at']?.toString())}',
                                    style: const TextStyle(
                                        fontSize: 11, color: Colors.black54)),
                              ],
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Expanded(
                                    child: OutlinedButton.icon(
                                      onPressed: () => _editSubscription(u),
                                      icon: const Icon(Icons.edit, size: 16),
                                      label: const Text('Abonnement'),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: OutlinedButton.icon(
                                      onPressed: () => _deleteUser(u),
                                      icon: const Icon(Icons.delete,
                                          size: 16, color: Colors.red),
                                      label: const Text('Supprimer',
                                          style: TextStyle(color: Colors.red)),
                                      style: OutlinedButton.styleFrom(
                                        side:
                                            const BorderSide(color: Colors.red),
                                      ),
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

class _EditSubscriptionDialog extends StatefulWidget {
  final Map<String, dynamic> user;
  const _EditSubscriptionDialog({required this.user});

  @override
  State<_EditSubscriptionDialog> createState() =>
      _EditSubscriptionDialogState();
}

class _EditSubscriptionDialogState extends State<_EditSubscriptionDialog> {
  late bool _isActive;
  String? _subscriptionType;
  late TextEditingController _dossier;
  late TextEditingController _expires;

  @override
  void initState() {
    super.initState();
    _isActive = widget.user['subscription_status'] == 'active';
    _subscriptionType = widget.user['abonnement_type']?.toString();
    if (_subscriptionType == 'aucun' || _subscriptionType == 'null') {
      _subscriptionType = null;
    }
    final dossiers = (widget.user['dossiers_principaux'] as List?) ?? [];
    _dossier = TextEditingController(
        text: dossiers.isNotEmpty
            ? dossiers.first.toString()
            : (widget.user['dossier_principal']?.toString() ?? ''));
    // Format date for input
    String initExpires = '';
    final iso = widget.user['subscription_expires_at']?.toString();
    if (iso != null && iso.isNotEmpty) {
      try {
        final d = DateTime.parse(iso).toLocal();
        initExpires =
            '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
      } catch (_) {
        initExpires = iso;
      }
    }
    _expires = TextEditingController(text: initExpires);
  }

  Future<void> _pickDate() async {
    final initial = DateTime.tryParse(_expires.text) ??
        DateTime.now().add(const Duration(days: 365));
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime.now(),
      lastDate: DateTime(DateTime.now().year + 5),
      locale: const Locale('fr', 'FR'),
      helpText: 'Sélectionner une date',
      cancelText: 'Annuler',
      confirmText: 'Valider',
      fieldLabelText: 'Saisir une date',
      fieldHintText: 'jj/mm/aaaa',
      errorFormatText: 'Format de date invalide',
      errorInvalidText: 'Date hors limites',
    );
    if (picked != null) {
      _expires.text =
          '${picked.year.toString().padLeft(4, '0')}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
      setState(() {});
    }
  }

  @override
  void dispose() {
    _dossier.dispose();
    _expires.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Abonnement — ${widget.user['full_name'] ?? widget.user['phone']}'),
      content: SingleChildScrollView(
        child: SizedBox(
          width: 400,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SwitchListTile(
                title: const Text('Abonnement actif'),
                value: _isActive,
                activeColor: AppColors.primary,
                onChanged: (v) => setState(() => _isActive = v),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String?>(
                initialValue: _subscriptionType,
                decoration: const InputDecoration(
                    labelText: 'Type concours',
                    border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(value: null, child: Text('Aucun')),
                  DropdownMenuItem(
                      value: 'direct', child: Text('🎓 Direct')),
                  DropdownMenuItem(
                      value: 'professionnel', child: Text('💼 Professionnel')),
                ],
                onChanged: (v) => setState(() => _subscriptionType = v),
              ),
              if (_subscriptionType == 'professionnel') ...[
                const SizedBox(height: 12),
                TextField(
                  controller: _dossier,
                  decoration: const InputDecoration(
                    labelText: 'Dossier principal',
                    hintText: 'Ex: Magistrature',
                    border: OutlineInputBorder(),
                  ),
                ),
              ],
              const SizedBox(height: 12),
              TextField(
                controller: _expires,
                readOnly: true,
                onTap: _pickDate,
                decoration: const InputDecoration(
                    labelText: 'Expire le',
                    hintText: 'AAAA-MM-JJ',
                    suffixIcon: Icon(Icons.calendar_today),
                    border: OutlineInputBorder()),
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
            String? expiresIso;
            if (_expires.text.trim().isNotEmpty) {
              try {
                final d = DateTime.parse('${_expires.text.trim()}T23:59:59');
                expiresIso = d.toIso8601String();
              } catch (_) {}
            }
            Navigator.pop(context, {
              'is_active': _isActive,
              'subscription_type': _subscriptionType,
              'dossier_principal':
                  _dossier.text.trim().isEmpty ? null : _dossier.text.trim(),
              'subscription_expires_at': expiresIso,
            });
          },
          child: const Text('Enregistrer'),
        ),
      ],
    );
  }
}
