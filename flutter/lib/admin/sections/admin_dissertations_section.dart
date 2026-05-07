import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../services/auth_service.dart';

class AdminDissertationsSection extends StatefulWidget {
  const AdminDissertationsSection({super.key});

  @override
  State<AdminDissertationsSection> createState() =>
      _AdminDissertationsSectionState();
}

class _AdminDissertationsSectionState extends State<AdminDissertationsSection> {
  bool _loading = true;
  List<Map<String, dynamic>> _items = [];
  List<Map<String, dynamic>> _categories = [];
  String? _filterCategoryId;
  String _searchQuery = '';
  final TextEditingController _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadAll());
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List<Map<String, dynamic>> get _filteredItems {
    if (_searchQuery.trim().isEmpty) return _items;
    final q = _searchQuery.trim().toLowerCase();
    return _items.where((item) {
      final titre = (item['titre']?.toString() ?? item['sujet']?.toString() ?? '')
          .toLowerCase();
      final contenu =
          (item['contenu']?.toString() ?? item['corrige']?.toString() ?? '')
              .toLowerCase();
      final cat = (item['category_name']?.toString() ?? '').toLowerCase();
      return titre.contains(q) || contenu.contains(q) || cat.contains(q);
    }).toList();
  }

  Future<void> _loadAll() async {
    final auth = context.read<AuthService>();
    setState(() => _loading = true);
    try {
      final cats = await auth.api.adminCategories(auth.token!);
      final d = await auth.api.adminDissertations(auth.token!,
          categorieId: _filterCategoryId);
      if (!mounted) return;
      setState(() {
        _categories = (cats['categories'] as List? ?? [])
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        _items = (d['dissertations'] as List? ?? d['items'] as List? ?? [])
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openEditor({Map<String, dynamic>? item}) async {
    final res = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (ctx) => _DissertationEditorDialog(
          item: item, categories: _categories),
    );
    if (res == null) return;
    final auth = context.read<AuthService>();
    try {
      if (item == null) {
        await auth.api.adminCreateDissertation(
          auth.token!,
          categoryId: res['category_id'],
          titre: res['sujet'],
          contenu: res['corrige'],
        );
      } else {
        await auth.api.adminUpdateDissertation(
          auth.token!,
          id: item['id'].toString(),
          titre: res['sujet'],
          contenu: res['corrige'],
        );
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(item == null ? 'Créée' : 'Mise à jour')),
      );
      _loadAll();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur : $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _delete(Map<String, dynamic> item) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Supprimer la dissertation ?'),
        content: Text(item['sujet']?.toString() ?? ''),
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
    await auth.api.adminDeleteDissertation(auth.token!, item['id'].toString());
    _loadAll();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    final filtered = _filteredItems;
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                SizedBox(
                  width: 280,
                  child: TextField(
                    controller: _searchCtrl,
                    decoration: InputDecoration(
                      hintText: 'Rechercher (titre, contenu...)',
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: _searchQuery.isEmpty
                          ? null
                          : IconButton(
                              icon: const Icon(Icons.clear),
                              onPressed: () {
                                _searchCtrl.clear();
                                setState(() => _searchQuery = '');
                              },
                            ),
                      isDense: true,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    onChanged: (v) => setState(() => _searchQuery = v),
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  width: 240,
                  child: DropdownButtonFormField<String?>(
                    initialValue: _filterCategoryId,
                    isExpanded: true,
                    decoration: InputDecoration(
                      labelText: 'Catégorie',
                      isDense: true,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    items: [
                      const DropdownMenuItem(
                          value: null, child: Text('Toutes')),
                      ..._categories.map((c) => DropdownMenuItem(
                            value: c['id'].toString(),
                            child: Text(c['nom']?.toString() ?? '',
                                overflow: TextOverflow.ellipsis),
                          )),
                    ],
                    onChanged: (v) {
                      setState(() => _filterCategoryId = v);
                      _loadAll();
                    },
                  ),
                ),
                const SizedBox(width: 8),
                OutlinedButton.icon(
                  onPressed: (_filterCategoryId == null && _searchQuery.isEmpty)
                      ? null
                      : () {
                          _searchCtrl.clear();
                          setState(() {
                            _searchQuery = '';
                            _filterCategoryId = null;
                          });
                          _loadAll();
                        },
                  icon: const Icon(Icons.refresh),
                  label: const Text('Réinitialiser'),
                ),
                const SizedBox(width: 8),
                ElevatedButton.icon(
                  onPressed: () => _openEditor(),
                  icon: const Icon(Icons.add),
                  label: const Text('Nouveau'),
                ),
              ],
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text(
              '${filtered.length} dissertation(s) affichée(s) / ${_items.length}',
              style: const TextStyle(
                  fontSize: 12,
                  color: Colors.black54,
                  fontWeight: FontWeight.w600),
            ),
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _loadAll,
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: filtered.length,
              itemBuilder: (ctx, i) {
                final d = filtered[i];
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                            d['titre']?.toString() ??
                                d['sujet']?.toString() ??
                                '',
                            style: const TextStyle(
                                fontWeight: FontWeight.w800)),
                        if (d['category_name'] != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text('📚 ${d['category_name']}',
                                style: const TextStyle(
                                    fontSize: 12, color: Colors.black54)),
                          ),
                        const SizedBox(height: 6),
                        Text(
                          d['contenu']?.toString() ??
                              d['corrige']?.toString() ??
                              '',
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 13),
                        ),
                        Row(
                          children: [
                            TextButton.icon(
                              onPressed: () => _openEditor(item: d),
                              icon: const Icon(Icons.edit, size: 16),
                              label: const Text('Modifier'),
                            ),
                            TextButton.icon(
                              onPressed: () => _delete(d),
                              icon: const Icon(Icons.delete,
                                  size: 16, color: Colors.red),
                              label: const Text('Supprimer',
                                  style: TextStyle(color: Colors.red)),
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

class _DissertationEditorDialog extends StatefulWidget {
  final Map<String, dynamic>? item;
  final List<Map<String, dynamic>> categories;
  const _DissertationEditorDialog({this.item, required this.categories});

  @override
  State<_DissertationEditorDialog> createState() =>
      _DissertationEditorDialogState();
}

class _DissertationEditorDialogState
    extends State<_DissertationEditorDialog> {
  late TextEditingController _sujet;
  late TextEditingController _corrige;
  String? _categoryId;

  @override
  void initState() {
    super.initState();
    _sujet = TextEditingController(
        text: widget.item?['titre']?.toString() ??
            widget.item?['sujet']?.toString() ??
            '');
    _corrige = TextEditingController(
        text: widget.item?['contenu']?.toString() ??
            widget.item?['corrige']?.toString() ??
            '');
    _categoryId = widget.item?['category_id']?.toString();
  }

  @override
  void dispose() {
    _sujet.dispose();
    _corrige.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.item == null
          ? 'Nouvelle dissertation'
          : 'Modifier dissertation'),
      content: SingleChildScrollView(
        child: SizedBox(
          width: 500,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (widget.item == null)
                DropdownButtonFormField<String>(
                  initialValue: _categoryId,
                  decoration: const InputDecoration(labelText: 'Catégorie *'),
                  items: widget.categories
                      .map((c) => DropdownMenuItem(
                            value: c['id'].toString(),
                            child: Text(c['nom']?.toString() ?? ''),
                          ))
                      .toList(),
                  onChanged: (v) => setState(() => _categoryId = v),
                ),
              const SizedBox(height: 8),
              TextField(
                controller: _sujet,
                maxLines: 2,
                decoration: const InputDecoration(labelText: 'Sujet *'),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _corrige,
                maxLines: 10,
                decoration: const InputDecoration(labelText: 'Corrigé *'),
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
            if (_sujet.text.trim().isEmpty) return;
            if (widget.item == null && _categoryId == null) return;
            Navigator.pop(context, {
              'category_id': _categoryId,
              'sujet': _sujet.text.trim(),
              'corrige': _corrige.text.trim(),
            });
          },
          child: const Text('Enregistrer'),
        ),
      ],
    );
  }
}
