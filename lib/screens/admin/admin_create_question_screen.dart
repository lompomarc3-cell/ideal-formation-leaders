// lib/screens/admin/admin_create_question_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../models/question_model.dart';
import '../../services/categorie_service.dart';
import '../../services/auth_service.dart';
import '../../services/question_service.dart';

class AdminCreateQuestionScreen extends StatefulWidget {
  final String? preselectedSousCategorieId;

  const AdminCreateQuestionScreen({
    super.key,
    this.preselectedSousCategorieId,
  });

  @override
  State<AdminCreateQuestionScreen> createState() =>
      _AdminCreateQuestionScreenState();
}

class _AdminCreateQuestionScreenState
    extends State<AdminCreateQuestionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _enonceController = TextEditingController();
  final _explicationController = TextEditingController();

  String? _selectedSousCategorieId;
  bool _isPublished = true;
  bool _isLoading = false;

  // Options de réponse (max 6)
  final List<Map<String, dynamic>> _options = [
    {'id': 'A', 'texte': '', 'is_correct': false, 'controller': TextEditingController()},
    {'id': 'B', 'texte': '', 'is_correct': false, 'controller': TextEditingController()},
    {'id': 'C', 'texte': '', 'is_correct': false, 'controller': TextEditingController()},
    {'id': 'D', 'texte': '', 'is_correct': false, 'controller': TextEditingController()},
  ];

  @override
  void initState() {
    super.initState();
    _selectedSousCategorieId = widget.preselectedSousCategorieId;
  }

  @override
  void dispose() {
    _enonceController.dispose();
    _explicationController.dispose();
    for (var opt in _options) {
      (opt['controller'] as TextEditingController).dispose();
    }
    super.dispose();
  }

  void _addOption() {
    if (_options.length >= 6) return;
    setState(() {
      final ids = ['A', 'B', 'C', 'D', 'E', 'F'];
      _options.add({
        'id': ids[_options.length],
        'texte': '',
        'is_correct': false,
        'controller': TextEditingController(),
      });
    });
  }

  void _removeOption(int index) {
    if (_options.length <= 2) return;
    setState(() {
      (_options[index]['controller'] as TextEditingController).dispose();
      _options.removeAt(index);
    });
  }

  Future<void> _submitQuestion() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedSousCategorieId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Veuillez sélectionner un dossier'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }

    // Vérifier qu'au moins une option est correcte
    final hasCorrect = _options.any((o) => o['is_correct'] == true);
    if (!hasCorrect) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Cochez au moins une bonne réponse'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    final authService = context.read<AuthService>();
    final questionService = context.read<QuestionService>();

    final question = QuestionModel(
      id: '',
      sousCategorieId: _selectedSousCategorieId!,
      enonce: _enonceController.text.trim(),
      options: _options
          .where((o) => (o['controller'] as TextEditingController).text.isNotEmpty)
          .map((o) => OptionModel(
                id: o['id'] as String,
                texte: (o['controller'] as TextEditingController).text.trim(),
                isCorrect: o['is_correct'] as bool,
              ))
          .toList(),
      explication: _explicationController.text.trim(),
      auteurId: authService.currentUser?.id,
      isPublished: _isPublished,
    );

    final success = await questionService.createQuestion(question);
    setState(() => _isLoading = false);

    if (!mounted) return;
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Question publiée avec succès !'),
          backgroundColor: AppTheme.accentColor,
        ),
      );
      Navigator.of(context).pop();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Erreur lors de la publication'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final catService = context.watch<CategorieService>();
    final allSC = catService.sousCategories;

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: AppTheme.primaryColor,
        title: const Text('Publier une Question QCM'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Sélection dossier
                _buildSectionTitle('Dossier de publication'),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.dividerColor),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedSousCategorieId,
                      isExpanded: true,
                      hint: const Text('Sélectionner un sous-dossier'),
                      items: allSC.map((sc) {
                        final type = sc.typeConcours == 'direct'
                            ? '🔵 Direct'
                            : '🟣 Prof.';
                        return DropdownMenuItem<String>(
                          value: sc.id,
                          child: Text(
                            '$type - ${sc.nom}',
                            style: const TextStyle(fontSize: 13),
                            overflow: TextOverflow.ellipsis,
                          ),
                        );
                      }).toList(),
                      onChanged: (v) =>
                          setState(() => _selectedSousCategorieId = v),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Énoncé
                _buildSectionTitle('Énoncé de la question *'),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _enonceController,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    hintText: 'Saisissez l\'énoncé de la question...',
                  ),
                  validator: (v) =>
                      v == null || v.isEmpty ? 'L\'énoncé est obligatoire' : null,
                ),
                const SizedBox(height: 16),

                // Options de réponse
                _buildSectionTitle('Options de réponse *'),
                const SizedBox(height: 4),
                const Text(
                  'Cochez la ou les bonnes réponses',
                  style: TextStyle(
                      fontSize: 12, color: AppTheme.textSecondary),
                ),
                const SizedBox(height: 8),
                ...List.generate(_options.length, (i) {
                  final opt = _options[i];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: opt['is_correct'] == true
                            ? AppTheme.accentColor
                            : AppTheme.dividerColor,
                        width: opt['is_correct'] == true ? 1.5 : 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        // Label (A, B, C...)
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: opt['is_correct'] == true
                                ? AppTheme.accentColor
                                : AppTheme.dividerColor.withValues(alpha: 0.5),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Center(
                            child: Text(
                              opt['id'] as String,
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                color: opt['is_correct'] == true
                                    ? Colors.white
                                    : AppTheme.textSecondary,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        // Texte option
                        Expanded(
                          child: TextFormField(
                            controller:
                                opt['controller'] as TextEditingController,
                            decoration: InputDecoration(
                              hintText: 'Option ${opt['id']}...',
                              border: InputBorder.none,
                              contentPadding: EdgeInsets.zero,
                            ),
                            onChanged: (v) =>
                                setState(() => opt['texte'] = v),
                          ),
                        ),
                        // Checkbox bonne réponse
                        Checkbox(
                          value: opt['is_correct'] as bool,
                          activeColor: AppTheme.accentColor,
                          onChanged: (v) =>
                              setState(() => opt['is_correct'] = v ?? false),
                        ),
                        // Supprimer option
                        if (_options.length > 2)
                          IconButton(
                            icon: const Icon(Icons.close,
                                size: 18, color: AppTheme.errorColor),
                            onPressed: () => _removeOption(i),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                          ),
                      ],
                    ),
                  );
                }),

                // Ajouter option
                if (_options.length < 6)
                  TextButton.icon(
                    onPressed: _addOption,
                    icon: const Icon(Icons.add),
                    label: const Text('Ajouter une option'),
                  ),
                const SizedBox(height: 16),

                // Explication
                _buildSectionTitle('Explication / Correction *'),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _explicationController,
                  maxLines: 5,
                  decoration: const InputDecoration(
                    hintText:
                        'Expliquez la bonne réponse en détail pour aider les candidats...',
                  ),
                  validator: (v) =>
                      v == null || v.isEmpty ? 'L\'explication est obligatoire' : null,
                ),
                const SizedBox(height: 16),

                // Statut publication
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: SwitchListTile(
                    title: const Text('Publier immédiatement'),
                    subtitle: Text(
                      _isPublished
                          ? 'Visible par tous les candidats'
                          : 'Brouillon - non visible',
                      style: const TextStyle(fontSize: 12),
                    ),
                    value: _isPublished,
                    activeColor: AppTheme.accentColor,
                    onChanged: (v) => setState(() => _isPublished = v),
                  ),
                ),
                const SizedBox(height: 24),

                // Bouton publier
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                    ),
                    onPressed: _isLoading ? null : _submitQuestion,
                    icon: _isLoading
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2),
                          )
                        : const Icon(Icons.publish),
                    label: Text(
                      _isPublished ? 'PUBLIER LA QUESTION' : 'ENREGISTRER BROUILLON',
                    ),
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        color: AppTheme.textPrimary,
      ),
    );
  }
}
