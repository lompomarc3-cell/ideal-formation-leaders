import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';

class AdminCategoriesSection extends StatefulWidget {
  const AdminCategoriesSection({super.key});

  @override
  State<AdminCategoriesSection> createState() => _AdminCategoriesSectionState();
}

class _AdminCategoriesSectionState extends State<AdminCategoriesSection> {
  bool _loading = true;
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
      final res = await auth.api.adminCategories(auth.token!);
      if (!mounted) return;
      setState(() {
        _categories = (res['categories'] as List? ?? [])
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openEditor({Map<String, dynamic>? cat}) async {
    final res = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (ctx) => _CategoryEditorDialog(cat: cat),
    );
    if (res == null) return;
    final auth = context.read<AuthService>();
    try {
      if (cat == null) {
        await auth.api.adminCreateCategory(
          auth.token!,
          nom: res['nom'],
          type: res['type'],
          description: res['description'],
        );
      } else {
        await auth.api.adminUpdateCategory(
          auth.token!,
          id: cat['id'].toString(),
          nom: res['nom'],
          description: res['description'],
          isActive: res['is_active'],
        );
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(cat == null ? 'Créée' : 'Mise à jour')),
      );
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur : $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _delete(Map<String, dynamic> cat) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Supprimer la catégorie ?'),
        content: Text(
            'Les questions associées seront désactivées. ${cat['nom'] ?? ''}'),
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
      await auth.api.adminDeleteCategory(
          auth.token!, cat['id'].toString(),
          force: true);
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
          child: Align(
            alignment: Alignment.centerRight,
            child: ElevatedButton.icon(
              onPressed: () => _openEditor(),
              icon: const Icon(Icons.add),
              label: const Text('Nouvelle catégorie'),
            ),
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _load,
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: _categories.length,
              itemBuilder: (ctx, i) {
                final c = _categories[i];
                return Card(
                  child: ListTile(
                    title: Text(c['nom']?.toString() ?? '',
                        style: const TextStyle(fontWeight: FontWeight.w800)),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Type : ${c['type'] ?? '—'}'),
                        if (c['description'] != null)
                          Text('${c['description']}',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis),
                        Text(
                            '❓ ${c['question_count_real'] ?? c['question_count'] ?? 0} questions'),
                      ],
                    ),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.edit,
                              color: AppColors.primary),
                          onPressed: () => _openEditor(cat: c),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete, color: Colors.red),
                          onPressed: () => _delete(c),
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

class _CategoryEditorDialog extends StatefulWidget {
  final Map<String, dynamic>? cat;
  const _CategoryEditorDialog({this.cat});

  @override
  State<_CategoryEditorDialog> createState() => _CategoryEditorDialogState();
}

class _CategoryEditorDialogState extends State<_CategoryEditorDialog> {
  late TextEditingController _nom;
  late TextEditingController _desc;
  String _type = 'direct';
  bool _isActive = true;

  @override
  void initState() {
    super.initState();
    _nom = TextEditingController(text: widget.cat?['nom']?.toString() ?? '');
    _desc =
        TextEditingController(text: widget.cat?['description']?.toString() ?? '');
    _type = widget.cat?['type']?.toString() ?? 'direct';
    _isActive = widget.cat?['is_active'] != false;
  }

  @override
  void dispose() {
    _nom.dispose();
    _desc.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.cat == null ? 'Nouvelle catégorie' : 'Modifier'),
      content: SizedBox(
        width: 400,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _nom,
              decoration: const InputDecoration(labelText: 'Nom *'),
            ),
            const SizedBox(height: 8),
            if (widget.cat == null)
              DropdownButtonFormField<String>(
                initialValue: _type,
                decoration: const InputDecoration(labelText: 'Type *'),
                items: const [
                  DropdownMenuItem(
                      value: 'direct', child: Text('Direct (5000 FCFA par an)')),
                  DropdownMenuItem(
                      value: 'professionnel',
                      child: Text('Professionnel (20000 FCFA par an)')),
                ],
                onChanged: (v) => setState(() => _type = v ?? 'direct'),
              ),
            const SizedBox(height: 8),
            TextField(
              controller: _desc,
              maxLines: 2,
              decoration: const InputDecoration(labelText: 'Description'),
            ),
            if (widget.cat != null)
              SwitchListTile(
                title: const Text('Activée'),
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
            if (_nom.text.trim().isEmpty) return;
            Navigator.pop(context, {
              'nom': _nom.text.trim(),
              'type': _type,
              'description':
                  _desc.text.trim().isEmpty ? null : _desc.text.trim(),
              'is_active': _isActive,
            });
          },
          child: const Text('Enregistrer'),
        ),
      ],
    );
  }
}
