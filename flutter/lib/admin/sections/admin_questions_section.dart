import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';
import 'admin_bulk_import_dialog.dart';

/// Section "Questions QCM" — gestion CRUD avec préservation stricte de l'ordre.
///
/// PRÉSERVATION DE L'ORDRE :
/// - Les questions sont triées une seule fois (par created_at ASC, fallback id)
/// - Lors d'une modification, on met à jour la question EN PLACE dans la liste
///   locale (pas de rechargement complet) → l'ordre visuel reste identique.
/// - Un numéro d'ordre (#1, #2, ...) est affiché sur chaque carte pour que
///   l'admin voie clairement la position et constate qu'elle ne change pas.
class AdminQuestionsSection extends StatefulWidget {
  const AdminQuestionsSection({super.key});

  @override
  State<AdminQuestionsSection> createState() => _AdminQuestionsSectionState();
}

class _AdminQuestionsSectionState extends State<AdminQuestionsSection> {
  bool _loading = true;
  // Liste ordonnée stable. On NE re-trie JAMAIS après une édition.
  List<Map<String, dynamic>> _questions = [];
  List<Map<String, dynamic>> _categories = [];
  String? _filterCategoryId;
  String _searchQuery = '';
  final TextEditingController _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  /// Filtre par recherche + ajoute le numéro d'ordre stable (basé sur la
  /// position absolue dans la liste source `_questions`).
  List<MapEntry<int, Map<String, dynamic>>> get _filteredQuestions {
    final all = List<MapEntry<int, Map<String, dynamic>>>.generate(
      _questions.length,
      (i) => MapEntry(i + 1, _questions[i]),
    );
    if (_searchQuery.trim().isEmpty) return all;
    final q = _searchQuery.trim().toLowerCase();
    return all.where((entry) {
      final item = entry.value;
      final text = (item['enonce']?.toString() ??
              item['question_text']?.toString() ??
              '')
          .toLowerCase();
      final expl = (item['explication']?.toString() ?? '').toLowerCase();
      final cat = (item['categorie_nom']?.toString() ??
              item['category_name']?.toString() ??
              '')
          .toLowerCase();
      final opts = [
        item['option_a'],
        item['option_b'],
        item['option_c'],
        item['option_d'],
      ].whereType<String>().join(' ').toLowerCase();
      return text.contains(q) ||
          expl.contains(q) ||
          cat.contains(q) ||
          opts.contains(q);
    }).toList();
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadAll());
  }

  /// Tri stable : created_at ASC (avec fallback sur id) — l'API renvoie déjà
  /// les questions dans cet ordre, mais on s'assure côté client pour être sûr.
  void _stableSort(List<Map<String, dynamic>> list) {
    list.sort((a, b) {
      final aCreated = a['created_at']?.toString() ?? '';
      final bCreated = b['created_at']?.toString() ?? '';
      if (aCreated.isNotEmpty && bCreated.isNotEmpty) {
        final cmp = aCreated.compareTo(bCreated);
        if (cmp != 0) return cmp;
      }
      // Fallback : id (souvent une UUID, donc ordre alpha stable)
      return (a['id']?.toString() ?? '')
          .compareTo(b['id']?.toString() ?? '');
    });
  }

  Future<void> _loadAll() async {
    final auth = context.read<AuthService>();
    setState(() => _loading = true);
    try {
      final cats = await auth.api.adminCategories(auth.token!);
      final qs = await auth.api.adminQuestions(auth.token!,
          categorieId: _filterCategoryId);
      if (!mounted) return;
      final list = (qs['questions'] as List? ?? [])
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
      _stableSort(list);
      setState(() {
        _categories = (cats['categories'] as List? ?? [])
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        _questions = list;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openEditor({Map<String, dynamic>? question, int? orderIndex}) async {
    final res = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (ctx) => _QuestionEditorDialog(
        question: question,
        categories: _categories,
        orderIndex: orderIndex,
      ),
    );
    if (res == null) return;
    final auth = context.read<AuthService>();
    try {
      final opts = List<String>.from(res['options']);
      while (opts.length < 4) {
        opts.add('');
      }
      if (question == null) {
        // Nouvelle question : on recharge tout (la nouvelle ira en fin de liste)
        await auth.api.adminCreateQuestion(
          auth.token!,
          categoryId: res['category_id'],
          questionText: res['enonce'],
          optionA: opts[0],
          optionB: opts[1],
          optionC: opts[2],
          optionD: opts[3],
          bonneReponse: res['reponse_correcte'],
          explication: res['explication'],
        );
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('✅ Question créée')),
        );
        _loadAll();
      } else {
        // ✏️ MODIFICATION — on met à jour EN PLACE pour préserver l'ordre.
        final qid = question['id'].toString();
        await auth.api.adminUpdateQuestion(
          auth.token!,
          id: qid,
          questionText: res['enonce'],
          optionA: opts[0],
          optionB: opts[1],
          optionC: opts[2],
          optionD: opts[3],
          bonneReponse: res['reponse_correcte'],
          explication: res['explication'],
        );
        if (!mounted) return;
        // Mettre à jour la question dans la liste locale SANS la déplacer
        final idx = _questions.indexWhere((q) => q['id'].toString() == qid);
        if (idx != -1) {
          setState(() {
            _questions[idx] = {
              ..._questions[idx],
              'enonce': res['enonce'],
              'question_text': res['enonce'],
              'option_a': opts[0],
              'option_b': opts[1],
              'option_c': opts[2],
              'option_d': opts[3],
              'reponse_correcte': res['reponse_correcte'],
              'bonne_reponse': res['reponse_correcte'],
              'explication': res['explication'],
              if (res['is_demo'] != null) 'is_demo': res['is_demo'],
            };
          });
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                '✅ Question mise à jour — position #${orderIndex ?? "?"} préservée'),
            backgroundColor: const Color(0xFF16A34A),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur : $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _openBulkImport() async {
    await showDialog(
      context: context,
      builder: (ctx) => AdminBulkImportDialog(
        categories: _categories,
        onImported: _loadAll,
      ),
    );
  }

  Future<void> _delete(Map<String, dynamic> q) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Supprimer la question ?'),
        content: Text(
            (q['enonce']?.toString() ?? q['question_text']?.toString() ?? '')),
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
      await auth.api.adminDeleteQuestion(auth.token!, q['id'].toString());
      if (!mounted) return;
      // Suppression EN PLACE pour ne pas perturber l'ordre des autres
      setState(() {
        _questions.removeWhere((x) => x['id'].toString() == q['id'].toString());
      });
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
    final filtered = _filteredQuestions;
    return Column(
      children: [
        // Note explicative pour rassurer l'admin
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          color: const Color(0xFFEFF6FF),
          child: const Row(
            children: [
              Icon(Icons.lock_outline, size: 16, color: Color(0xFF1D4ED8)),
              SizedBox(width: 6),
              Expanded(
                child: Text(
                  'L\'ordre des questions ne change JAMAIS lorsque vous modifiez une question. Le numéro #N reste fixe.',
                  style: TextStyle(
                    fontSize: 11,
                    color: Color(0xFF1D4ED8),
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
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
                      hintText: 'Rechercher (énoncé, option, explication...)',
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
                          value: null, child: Text('Toutes les catégories')),
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
                const SizedBox(width: 8),
                ElevatedButton.icon(
                  onPressed: _openBulkImport,
                  icon: const Icon(Icons.upload_file_rounded),
                  label: const Text('Import massif'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF16A34A),
                    foregroundColor: Colors.white,
                  ),
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
              '${filtered.length} question(s) affichée(s) / ${_questions.length}',
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
                final entry = filtered[i];
                final order = entry.key; // numéro d'ordre stable
                final q = entry.value;
                final opts = (q['options'] as List?) ??
                    [
                      q['option_a'],
                      q['option_b'],
                      q['option_c'],
                      q['option_d'],
                    ].where((e) => e != null).toList();
                final correct = q['reponse_correcte']?.toString() ??
                    q['bonne_reponse']?.toString() ??
                    'A';
                final text = q['enonce']?.toString() ??
                    q['question_text']?.toString() ??
                    '';
                final isProtected =
                    order <= 5; // 5 premières questions = gratuit
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            // Numéro d'ordre stable (badge fixe)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: isProtected
                                    ? const Color(0xFFD1FAE5)
                                    : const Color(0xFFFEE2E2),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                '#$order',
                                style: TextStyle(
                                  fontWeight: FontWeight.w900,
                                  fontSize: 12,
                                  color: isProtected
                                      ? const Color(0xFF065F46)
                                      : const Color(0xFF991B1B),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            if (isProtected)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF16A34A),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text('GRATUIT',
                                    style: TextStyle(
                                        fontSize: 9,
                                        fontWeight: FontWeight.w900,
                                        color: Colors.white)),
                              ),
                            const Spacer(),
                            if (q['is_demo'] == true)
                              Container(
                                margin: const EdgeInsets.only(left: 4),
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.secondary,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text('DEMO',
                                    style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w900,
                                        color: Colors.white)),
                              ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          text,
                          style: const TextStyle(
                              fontWeight: FontWeight.w700, fontSize: 13),
                        ),
                        const SizedBox(height: 6),
                        for (int k = 0; k < opts.length; k++)
                          Text(
                            '${String.fromCharCode(65 + k)}. ${opts[k]}',
                            style: TextStyle(
                              fontSize: 12,
                              color: correct == String.fromCharCode(65 + k)
                                  ? const Color(0xFFC4521A)
                                  : Colors.black87,
                              fontWeight:
                                  correct == String.fromCharCode(65 + k)
                                      ? FontWeight.w800
                                      : FontWeight.normal,
                            ),
                          ),
                        if ((q['categorie_nom'] ?? q['category_name']) !=
                            null)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                                '📚 ${q['categorie_nom'] ?? q['category_name']}',
                                style: const TextStyle(
                                    fontSize: 11, color: Colors.black54)),
                          ),
                        Row(
                          children: [
                            TextButton.icon(
                              onPressed: () =>
                                  _openEditor(question: q, orderIndex: order),
                              icon: const Icon(Icons.edit, size: 16),
                              label: Text('Modifier (#$order)'),
                            ),
                            TextButton.icon(
                              onPressed: () => _delete(q),
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

class _QuestionEditorDialog extends StatefulWidget {
  final Map<String, dynamic>? question;
  final List<Map<String, dynamic>> categories;
  final int? orderIndex;
  const _QuestionEditorDialog({
    this.question,
    required this.categories,
    this.orderIndex,
  });

  @override
  State<_QuestionEditorDialog> createState() => _QuestionEditorDialogState();
}

class _QuestionEditorDialogState extends State<_QuestionEditorDialog> {
  late TextEditingController _enonce;
  late List<TextEditingController> _opts;
  late TextEditingController _expl;
  String? _categoryId;
  String _correct = 'A';
  bool _isDemo = false;

  @override
  void initState() {
    super.initState();
    final q = widget.question;
    _enonce = TextEditingController(
        text: q?['enonce']?.toString() ??
            q?['question_text']?.toString() ??
            '');
    final options = (q?['options'] as List?) ??
        [
          q?['option_a'] ?? '',
          q?['option_b'] ?? '',
          q?['option_c'] ?? '',
          q?['option_d'] ?? '',
        ];
    _opts = List.generate(
        4,
        (i) => TextEditingController(
            text: i < options.length ? options[i].toString() : ''));
    _expl = TextEditingController(text: q?['explication']?.toString() ?? '');
    _categoryId = q?['category_id']?.toString();
    _correct = q?['reponse_correcte']?.toString() ??
        q?['bonne_reponse']?.toString() ??
        'A';
    _isDemo = q?['is_demo'] == true;
  }

  @override
  void dispose() {
    _enonce.dispose();
    for (final c in _opts) {
      c.dispose();
    }
    _expl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.question != null;
    return AlertDialog(
      title: Text(
          isEdit ? 'Modifier la question' : 'Nouvelle question'),
      content: SingleChildScrollView(
        child: SizedBox(
          width: 500,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (isEdit && widget.orderIndex != null)
                Container(
                  width: double.infinity,
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFBFDBFE)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.lock_rounded,
                          size: 16, color: Color(0xFF1D4ED8)),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'Question #${widget.orderIndex} — l\'ordre ne sera PAS modifié',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF1D4ED8),
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              if (!isEdit)
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
                controller: _enonce,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'Énoncé *'),
              ),
              const SizedBox(height: 8),
              for (int i = 0; i < 4; i++)
                Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: TextField(
                    controller: _opts[i],
                    decoration: InputDecoration(
                        labelText: 'Option ${String.fromCharCode(65 + i)}'),
                  ),
                ),
              DropdownButtonFormField<String>(
                initialValue: _correct,
                decoration:
                    const InputDecoration(labelText: 'Réponse correcte'),
                items: const [
                  DropdownMenuItem(value: 'A', child: Text('A')),
                  DropdownMenuItem(value: 'B', child: Text('B')),
                  DropdownMenuItem(value: 'C', child: Text('C')),
                  DropdownMenuItem(value: 'D', child: Text('D')),
                ],
                onChanged: (v) => setState(() => _correct = v ?? 'A'),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _expl,
                maxLines: 2,
                decoration: const InputDecoration(labelText: 'Explication'),
              ),
              SwitchListTile(
                title: const Text('Question démo (gratuit)'),
                value: _isDemo,
                activeColor: AppColors.primary,
                onChanged: (v) => setState(() => _isDemo = v),
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
            if (_enonce.text.trim().isEmpty) return;
            if (!isEdit && _categoryId == null) return;
            Navigator.pop(context, {
              'category_id': _categoryId,
              'enonce': _enonce.text.trim(),
              'options': _opts.map((c) => c.text.trim()).toList(),
              'reponse_correcte': _correct,
              'explication': _expl.text.trim(),
              'is_demo': _isDemo,
            });
          },
          child: const Text('Enregistrer'),
        ),
      ],
    );
  }
}
