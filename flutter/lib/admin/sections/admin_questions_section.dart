import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';
import 'admin_bulk_import_dialog.dart';

class AdminQuestionsSection extends StatefulWidget {
  const AdminQuestionsSection({super.key});

  @override
  State<AdminQuestionsSection> createState() => _AdminQuestionsSectionState();
}

class _AdminQuestionsSectionState extends State<AdminQuestionsSection> {
  bool _loading = true;
  List<Map<String, dynamic>> _questions = [];
  List<Map<String, dynamic>> _categories = [];
  String? _filterCategoryId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadAll());
  }

  Future<void> _loadAll() async {
    final auth = context.read<AuthService>();
    setState(() => _loading = true);
    try {
      final cats = await auth.api.adminCategories(auth.token!);
      final qs = await auth.api.adminQuestions(auth.token!,
          categorieId: _filterCategoryId);
      if (!mounted) return;
      setState(() {
        _categories = (cats['categories'] as List? ?? [])
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        _questions = (qs['questions'] as List? ?? [])
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openEditor({Map<String, dynamic>? question}) async {
    final res = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (ctx) =>
          _QuestionEditorDialog(question: question, categories: _categories),
    );
    if (res == null) return;
    final auth = context.read<AuthService>();
    try {
      final opts = List<String>.from(res['options']);
      while (opts.length < 4) {
        opts.add('');
      }
      if (question == null) {
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
      } else {
        await auth.api.adminUpdateQuestion(
          auth.token!,
          id: question['id'].toString(),
          questionText: res['enonce'],
          optionA: opts[0],
          optionB: opts[1],
          optionC: opts[2],
          optionD: opts[3],
          bonneReponse: res['reponse_correcte'],
          explication: res['explication'],
        );
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(question == null
                ? 'Question créée'
                : 'Question mise à jour')),
      );
      _loadAll();
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
        content: Text(q['enonce']?.toString() ?? ''),
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
    await auth.api.adminDeleteQuestion(auth.token!, q['id'].toString());
    _loadAll();
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
          child: Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String?>(
                  initialValue: _filterCategoryId,
                  decoration: const InputDecoration(labelText: 'Catégorie'),
                  items: [
                    const DropdownMenuItem(
                        value: null, child: Text('Toutes les catégories')),
                    ..._categories.map((c) => DropdownMenuItem(
                          value: c['id'].toString(),
                          child: Text(c['nom']?.toString() ?? ''),
                        )),
                  ],
                  onChanged: (v) {
                    setState(() => _filterCategoryId = v);
                    _loadAll();
                  },
                ),
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
        Expanded(
          child: RefreshIndicator(
            onRefresh: _loadAll,
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: _questions.length,
              itemBuilder: (ctx, i) {
                final q = _questions[i];
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
        final text =
            q['enonce']?.toString() ?? q['question_text']?.toString() ?? '';
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
                                text,
                                style: const TextStyle(
                                    fontWeight: FontWeight.w700),
                              ),
                            ),
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
                        if (q['category_name'] != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text('📚 ${q['category_name']}',
                                style: const TextStyle(
                                    fontSize: 11, color: Colors.black54)),
                          ),
                        Row(
                          children: [
                            TextButton.icon(
                              onPressed: () => _openEditor(question: q),
                              icon: const Icon(Icons.edit, size: 16),
                              label: const Text('Modifier'),
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
  const _QuestionEditorDialog({this.question, required this.categories});

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
    return AlertDialog(
      title: Text(widget.question == null
          ? 'Nouvelle question'
          : 'Modifier question'),
      content: SingleChildScrollView(
        child: SizedBox(
          width: 500,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (widget.question == null)
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
            if (widget.question == null && _categoryId == null) return;
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
