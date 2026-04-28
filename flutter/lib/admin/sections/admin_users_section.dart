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

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final auth = context.read<AuthService>();
    setState(() => _loading = true);
    try {
      final res = await auth.api.adminUsers(auth.token!);
      if (!mounted) return;
      setState(() {
        _users = (res['users'] as List? ?? [])
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<Map<String, dynamic>> get _filtered {
    if (_search.isEmpty) return _users;
    final q = _search.toLowerCase();
    return _users.where((u) {
      return (u['telephone']?.toString() ?? '').toLowerCase().contains(q) ||
          (u['nom_complet']?.toString() ?? '').toLowerCase().contains(q) ||
          (u['email']?.toString() ?? '').toLowerCase().contains(q);
    }).toList();
  }

  Future<void> _editSubscription(Map<String, dynamic> user) async {
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (ctx) => _EditSubscriptionDialog(user: user),
    );
    if (result == null) return;
    final auth = context.read<AuthService>();
    try {
      await auth.api.adminUpdateUser(
        auth.token!,
        id: user['id'].toString(),
        subscriptionStatus:
            (result['is_active'] as bool?) == true ? 'active' : 'inactive',
        subscriptionType: result['type_concours'] as String?,
        dossierPrincipal: result['dossier_principal'] as String?,
        subscriptionExpiresAt: result['expires_at'] as String?,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Abonnement mis à jour')),
      );
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
            'Voulez-vous vraiment supprimer ${user['nom_complet'] ?? user['telephone']} ? Cette action est irréversible.'),
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
    try {
      await auth.api.adminDeleteUser(auth.token!, user['id'].toString());
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Utilisateur supprimé')),
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
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: TextField(
            decoration: const InputDecoration(
              hintText: 'Rechercher par nom, téléphone ou email…',
              prefixIcon: Icon(Icons.search),
            ),
            onChanged: (v) => setState(() => _search = v),
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _load,
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: _filtered.length,
              itemBuilder: (ctx, i) {
                final u = _filtered[i];
                final active = u['is_active'] == true;
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                u['nom_complet']?.toString() ?? '(Sans nom)',
                                style: const TextStyle(
                                    fontWeight: FontWeight.w800, fontSize: 15),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: active
                                    ? Colors.green.shade100
                                    : Colors.grey.shade200,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                active ? 'Actif' : 'Inactif',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: active
                                      ? Colors.green.shade800
                                      : Colors.grey.shade700,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text('📞 ${u['telephone'] ?? '—'}',
                            style: const TextStyle(fontSize: 13)),
                        if (u['email'] != null)
                          Text('✉️ ${u['email']}',
                              style: const TextStyle(fontSize: 13)),
                        if (u['type_concours'] != null)
                          Text('🎓 ${u['type_concours']}',
                              style: const TextStyle(fontSize: 13)),
                        if (u['dossier_principal'] != null)
                          Text('📂 ${u['dossier_principal']}',
                              style: const TextStyle(fontSize: 13)),
                        if (u['expires_at'] != null)
                          Text('⏰ Expire : ${u['expires_at']}',
                              style: const TextStyle(fontSize: 12)),
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
  String? _typeConcours;
  late TextEditingController _dossier;
  late TextEditingController _expires;

  @override
  void initState() {
    super.initState();
    _isActive = widget.user['is_active'] == true;
    _typeConcours = widget.user['type_concours']?.toString();
    _dossier = TextEditingController(
        text: widget.user['dossier_principal']?.toString() ?? '');
    _expires = TextEditingController(
        text: widget.user['expires_at']?.toString() ?? '');
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
      title: const Text('Modifier abonnement'),
      content: SingleChildScrollView(
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
            DropdownButtonFormField<String>(
              initialValue: _typeConcours,
              decoration: const InputDecoration(labelText: 'Type concours'),
              items: const [
                DropdownMenuItem(value: null, child: Text('—')),
                DropdownMenuItem(value: 'direct', child: Text('Direct')),
                DropdownMenuItem(
                    value: 'professionnel', child: Text('Professionnel')),
              ],
              onChanged: (v) => setState(() => _typeConcours = v),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _dossier,
              decoration:
                  const InputDecoration(labelText: 'Dossier principal'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _expires,
              decoration: const InputDecoration(
                  labelText: 'Expire le (AAAA-MM-JJ)',
                  hintText: '2026-12-31'),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
            onPressed: () => Navigator.pop(context), child: const Text('Annuler')),
        ElevatedButton(
          onPressed: () => Navigator.pop(context, {
            'is_active': _isActive,
            'type_concours': _typeConcours,
            'dossier_principal':
                _dossier.text.trim().isEmpty ? null : _dossier.text.trim(),
            'expires_at':
                _expires.text.trim().isEmpty ? null : _expires.text.trim(),
          }),
          child: const Text('Enregistrer'),
        ),
      ],
    );
  }
}
