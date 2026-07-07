import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';
import 'admin_bulk_import_dialog.dart';

/// Section "Questions QCM" — gestion CRUD avec préservation stricte de l'ordre.
///
/// AMÉLIORATIONS v3.0.6 :
/// - Recherche Full-Text côté serveur (Supabase) avec debounce 400ms
/// - Recherche dans : énoncé, options A/B/C/D, explication
/// - Filtre par catégorie combiné avec la recherche
/// - Retourne TOUS les résultats (pas de limite cachée)
/// - Total affiché en temps réel
class AdminQuestionsSection extends StatefulWidget {
  const AdminQuestionsSection({super.key});

  @override
  State<AdminQuestionsSection> createState() => _AdminQuestionsSectionState();
}

class _AdminQuestionsSectionState extends State<AdminQuestionsSection> {
  bool _loading = true;
  bool _searching = false;
  // Liste ordonnée stable. On NE re-trie JAMAIS après une édition.
  List<Map<String, dynamic>> _questions = [];
  List<Map<String, dynamic>> _categories = [];
  String? _filterCategoryId;
  String _searchQuery = '';
  int _totalCount = 0;
  final TextEditingController _searchCtrl = TextEditingController();
  Timer? _debounceTimer;

  @override
  void dispose() {
    _searchCtrl.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  /// Toutes les questions chargées avec numéro d'ordre stable.
  List<MapEntry<int, Map<String, dynamic>>> get _filteredQuestions {
    return List<MapEntry<int, Map<String, dynamic>>>.generate(
      _questions.length,
      (i) => MapEntry(i + 1, _questions[i]),
    );
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadAll());
  }

  /// Déclenche une recherche avec debounce de 400ms (évite les requêtes trop fréquentes).
  void _onSearchChanged(String value) {
    _debounceTimer?.cancel();
    setState(() => _searchQuery = value);
    _debounceTimer = Timer(const Duration(milliseconds: 400), () {
      _loadAll(isSearch: true);
    });
  }

  Future<void> _loadAll({bool isSearch = false}) async {
    final auth = context.read<AuthService>();
    if (isSearch) {
      setState(() => _searching = true);
    } else {
      setState(() => _loading = true);
    }
    try {
      // Charger les catégories seulement au premier chargement
      if (!isSearch && _categories.isEmpty) {
        final cats = await auth.api.adminCategories(auth.token!);
        if (mounted) {
          _categories = (cats['categories'] as List? ?? [])
              .map((e) => Map<String, dynamic>.from(e))
              .toList();
        }
      }
      // Recherche Full-Text côté serveur (retourne TOUS les résultats)
      final qs = await auth.api.adminQuestions(
        auth.token!,
        categorieId: _filterCategoryId,
        search: _searchQuery.trim().isEmpty ? null : _searchQuery.trim(),
      );
      if (!mounted) return;
      final list = (qs['questions'] as List? ?? [])
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
      setState(() {
        _questions = list;
        _totalCount = (qs['total'] as int?) ?? list.length;
        _loading = false;
        _searching = false;
      });
    } catch (_) {
      if (mounted) setState(() { _loading = false; _searching = false; });
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

  /// 🆕 v3.0.11 : Déplace une question vers le haut (direction=-1) ou bas (direction=+1)
  /// et sauvegarde le nouvel ordre via l'API reorder.
  Future<void> _moveQuestion(int index, int direction) async {
    if (_filterCategoryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('⚠️ Sélectionnez une catégorie pour réorganiser les questions.'),
          backgroundColor: Color(0xFFF59E0B),
        ),
      );
      return;
    }
    final newIndex = index + direction;
    if (newIndex < 0 || newIndex >= _questions.length) return;

    final auth = context.read<AuthService>();
    setState(() {
      final item = _questions.removeAt(index);
      _questions.insert(newIndex, item);
    });

    try {
      final orderedIds = _questions.map((q) => q['id'].toString()).toList();
      await auth.api.adminReorderQuestions(
        auth.token!,
        categorieId: _filterCategoryId!,
        orderedIds: orderedIds,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✅ Ordre sauvegardé'),
          backgroundColor: Color(0xFF16A34A),
          duration: Duration(seconds: 1),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      // Annuler le déplacement en cas d'erreur
      setState(() {
        final item = _questions.removeAt(newIndex);
        _questions.insert(index, item);
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur réorganisation : $e'), backgroundColor: Colors.red),
      );
    }
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
                  'Modifiez une question sans changer son ordre. Filtrez par catégorie puis utilisez ↑↓ pour réorganiser.',
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
        // 🚀 Barre d'actions principale TOUJOURS visible (Import massif + Nouveau)
        Container(
          width: double.infinity,
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 4),
          child: Row(
            children: [
              Expanded(
                flex: 3,
                child: ElevatedButton.icon(
                  onPressed: _openBulkImport,
                  icon: const Icon(Icons.upload_file_rounded),
                  label: const Text(
                    'Import massif (50+ questions)',
                    overflow: TextOverflow.ellipsis,
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF16A34A),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    textStyle: const TextStyle(
                        fontWeight: FontWeight.w900, fontSize: 13),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                flex: 2,
                child: ElevatedButton.icon(
                  onPressed: () => _openEditor(),
                  icon: const Icon(Icons.add_circle_rounded),
                  label: const Text(
                    'Nouvelle question',
                    overflow: TextOverflow.ellipsis,
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    textStyle: const TextStyle(
                        fontWeight: FontWeight.w900, fontSize: 13),
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
                      hintText: 'Recherche serveur (mot-clé, catégorie...)',
                      prefixIcon: _searching
                          ? const SizedBox(
                              width: 20, height: 20,
                              child: Padding(
                                padding: EdgeInsets.all(10),
                                child: CircularProgressIndicator(strokeWidth: 2),
                              ),
                            )
                          : const Icon(Icons.search),
                      suffixIcon: _searchQuery.isEmpty
                          ? null
                          : IconButton(
                              icon: const Icon(Icons.clear),
                              onPressed: () {
                                _searchCtrl.clear();
                                _debounceTimer?.cancel();
                                setState(() => _searchQuery = '');
                                _loadAll();
                              },
                            ),
                      isDense: true,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    onChanged: _onSearchChanged,
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
                          _debounceTimer?.cancel();
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
              ],
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text(
              _searchQuery.isEmpty && _filterCategoryId == null
                  ? '${_questions.length} question(s) — Total base : $_totalCount'
                  : '${_questions.length} résultat(s) trouvé(s) sur $_totalCount questions',
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
                            // 🆕 v3.0.11 : Boutons de réorganisation (↑↓)
                            if (_filterCategoryId != null) ...[
                              const Spacer(),
                              IconButton(
                                tooltip: 'Monter',
                                icon: const Icon(Icons.arrow_upward, size: 18, color: Color(0xFF0369A1)),
                                onPressed: i > 0 ? () => _moveQuestion(i, -1) : null,
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                              ),
                              IconButton(
                                tooltip: 'Descendre',
                                icon: const Icon(Icons.arrow_downward, size: 18, color: Color(0xFF0369A1)),
                                onPressed: i < filtered.length - 1 ? () => _moveQuestion(i, 1) : null,
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                              ),
                            ],
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

  Widget _sectionTitle(String emoji, String title, {String? subtitle}) {
    return Padding(
      padding: const EdgeInsets.only(top: 6, bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 16)),
          const SizedBox(width: 6),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 13.5,
                    color: AppColors.darkTerracotta,
                  ),
                ),
                if (subtitle != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.question != null;
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 620),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // En-tête coloré
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(18, 16, 14, 16),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.darkTerracotta, AppColors.primary],
                ),
                borderRadius:
                    BorderRadius.vertical(top: Radius.circular(16)),
              ),
              child: Row(
                children: [
                  Icon(
                    isEdit ? Icons.edit_rounded : Icons.add_circle_rounded,
                    color: Colors.white,
                    size: 26,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isEdit
                              ? 'Modifier la question'
                              : 'Nouvelle question',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 16,
                          ),
                        ),
                        if (isEdit && widget.orderIndex != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 2),
                            child: Text(
                              'Position #${widget.orderIndex} — préservée après modification',
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    tooltip: 'Annuler',
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(18, 4, 18, 12),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Catégorie (création seulement)
                    if (!isEdit) ...[
                      _sectionTitle('📚', 'Catégorie',
                          subtitle: 'Dossier dans lequel ranger la question.'),
                      DropdownButtonFormField<String>(
                        initialValue: _categoryId,
                        isExpanded: true,
                        decoration: InputDecoration(
                          labelText: 'Choisir une catégorie *',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        items: widget.categories
                            .map((c) => DropdownMenuItem(
                                  value: c['id'].toString(),
                                  child: Text(
                                    c['nom']?.toString() ?? '',
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ))
                            .toList(),
                        onChanged: (v) => setState(() => _categoryId = v),
                      ),
                    ],
                    // Énoncé
                    _sectionTitle('❓', 'Énoncé de la question',
                        subtitle:
                            'Tapez la question telle qu\'elle apparaîtra à l\'utilisateur.'),
                    TextField(
                      controller: _enonce,
                      maxLines: 4,
                      decoration: InputDecoration(
                        hintText: 'Ex: Quelle est la capitale du Burkina Faso ?',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                    // Options A/B/C/D + radio de bonne réponse
                    _sectionTitle('🅰️', 'Options de réponse',
                        subtitle:
                            'Cochez le rond vert à côté de la BONNE réponse.'),
                    for (int i = 0; i < 4; i++)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Container(
                          decoration: BoxDecoration(
                            color: _correct == String.fromCharCode(65 + i)
                                ? const Color(0xFFD1FAE5)
                                : const Color(0xFFF9FAFB),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: _correct == String.fromCharCode(65 + i)
                                  ? const Color(0xFF16A34A)
                                  : const Color(0xFFE5E7EB),
                              width:
                                  _correct == String.fromCharCode(65 + i)
                                      ? 2
                                      : 1,
                            ),
                          ),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          child: Row(
                            children: [
                              Radio<String>(
                                value: String.fromCharCode(65 + i),
                                groupValue: _correct,
                                activeColor: const Color(0xFF16A34A),
                                onChanged: (v) =>
                                    setState(() => _correct = v ?? 'A'),
                              ),
                              Container(
                                width: 28,
                                height: 28,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: _correct ==
                                          String.fromCharCode(65 + i)
                                      ? const Color(0xFF16A34A)
                                      : AppColors.primary,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  String.fromCharCode(65 + i),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: TextField(
                                  controller: _opts[i],
                                  decoration: InputDecoration(
                                    hintText:
                                        'Texte de l\'option ${String.fromCharCode(65 + i)}',
                                    border: InputBorder.none,
                                    isDense: true,
                                  ),
                                ),
                              ),
                              if (_correct ==
                                  String.fromCharCode(65 + i))
                                const Padding(
                                  padding:
                                      EdgeInsets.symmetric(horizontal: 6),
                                  child: Icon(Icons.check_circle,
                                      color: Color(0xFF16A34A), size: 20),
                                ),
                            ],
                          ),
                        ),
                      ),
                    // Explication
                    _sectionTitle('💡', 'Explication (facultatif)',
                        subtitle:
                            'Affichée après la réponse pour expliquer le bon choix.'),
                    TextField(
                      controller: _expl,
                      maxLines: 3,
                      decoration: InputDecoration(
                        hintText:
                            'Ex: Ouagadougou est la capitale du Burkina Faso depuis 1960.',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                    // Démo
                    const SizedBox(height: 6),
                    Container(
                      decoration: BoxDecoration(
                        color: _isDemo
                            ? const Color(0xFFFFF7ED)
                            : const Color(0xFFF9FAFB),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: _isDemo
                              ? const Color(0xFFFBBF24)
                              : const Color(0xFFE5E7EB),
                        ),
                      ),
                      child: SwitchListTile(
                        dense: true,
                        title: const Text(
                          'Question démo (visible sans abonnement)',
                          style: TextStyle(
                              fontWeight: FontWeight.w800, fontSize: 13),
                        ),
                        subtitle: const Text(
                          'À activer pour les 5 premières questions gratuites.',
                          style: TextStyle(fontSize: 11),
                        ),
                        value: _isDemo,
                        activeColor: AppColors.primary,
                        onChanged: (v) => setState(() => _isDemo = v),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Barre d'actions
            Container(
              padding: const EdgeInsets.fromLTRB(14, 8, 14, 12),
              decoration: const BoxDecoration(
                color: Color(0xFFF9FAFB),
                borderRadius:
                    BorderRadius.vertical(bottom: Radius.circular(16)),
                border: Border(
                    top: BorderSide(color: Color(0xFFE5E7EB))),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close_rounded),
                      label: const Text('Annuler'),
                      style: OutlinedButton.styleFrom(
                        padding:
                            const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding:
                            const EdgeInsets.symmetric(vertical: 12),
                      ),
                      onPressed: () {
                        if (_enonce.text.trim().isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content:
                                  Text('L\'énoncé est obligatoire'),
                              backgroundColor: Colors.red,
                            ),
                          );
                          return;
                        }
                        if (!isEdit && _categoryId == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                  'Choisissez une catégorie pour la question'),
                              backgroundColor: Colors.red,
                            ),
                          );
                          return;
                        }
                        Navigator.pop(context, {
                          'category_id': _categoryId,
                          'enonce': _enonce.text.trim(),
                          'options':
                              _opts.map((c) => c.text.trim()).toList(),
                          'reponse_correcte': _correct,
                          'explication': _expl.text.trim(),
                          'is_demo': _isDemo,
                        });
                      },
                      icon: Icon(isEdit
                          ? Icons.save_rounded
                          : Icons.add_circle_rounded),
                      label: Text(isEdit
                          ? 'Enregistrer les modifications'
                          : 'Créer la question'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
