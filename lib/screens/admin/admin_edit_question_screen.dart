// lib/screens/admin/admin_edit_question_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../models/question_model.dart';
import '../../services/question_service.dart';

class AdminEditQuestionScreen extends StatefulWidget {
  final QuestionModel question;

  const AdminEditQuestionScreen({super.key, required this.question});

  @override
  State<AdminEditQuestionScreen> createState() =>
      _AdminEditQuestionScreenState();
}

class _AdminEditQuestionScreenState
    extends State<AdminEditQuestionScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _enonceController;
  late TextEditingController _explicationController;
  late List<Map<String, dynamic>> _options;
  late bool _isPublished;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _enonceController =
        TextEditingController(text: widget.question.enonce);
    _explicationController =
        TextEditingController(text: widget.question.explication);
    _isPublished = widget.question.isPublished;

    _options = widget.question.options
        .map((o) => {
              'id': o.id,
              'texte': o.texte,
              'is_correct': o.isCorrect,
              'controller': TextEditingController(text: o.texte),
            })
        .toList();
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

  Future<void> _saveChanges() async {
    if (!_formKey.currentState!.validate()) return;

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

    final updatedData = {
      'enonce': _enonceController.text.trim(),
      'explication': _explicationController.text.trim(),
      'is_published': _isPublished,
      'options': _options
          .map((o) => {
                'id': o['id'],
                'texte':
                    (o['controller'] as TextEditingController).text.trim(),
                'is_correct': o['is_correct'],
              })
          .toList(),
    };

    final success = await context
        .read<QuestionService>()
        .updateQuestion(widget.question.id, updatedData);

    setState(() => _isLoading = false);

    if (!mounted) return;
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Question mise à jour !'),
          backgroundColor: AppTheme.accentColor,
        ),
      );
      Navigator.of(context).pop();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Erreur lors de la mise à jour'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: AppTheme.directColor,
        title: const Text('Modifier la Question'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Énoncé
                const Text(
                  'Énoncé',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _enonceController,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    hintText: 'Énoncé de la question...',
                  ),
                  validator: (v) =>
                      v == null || v.isEmpty ? 'Obligatoire' : null,
                ),
                const SizedBox(height: 16),

                // Options
                const Text(
                  'Options de réponse',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
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
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: opt['is_correct'] == true
                                ? AppTheme.accentColor
                                : AppTheme.dividerColor
                                    .withValues(alpha: 0.5),
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
                        Expanded(
                          child: TextFormField(
                            controller:
                                opt['controller'] as TextEditingController,
                            decoration: const InputDecoration(
                              border: InputBorder.none,
                              contentPadding: EdgeInsets.zero,
                            ),
                          ),
                        ),
                        Checkbox(
                          value: opt['is_correct'] as bool,
                          activeColor: AppTheme.accentColor,
                          onChanged: (v) => setState(
                              () => opt['is_correct'] = v ?? false),
                        ),
                      ],
                    ),
                  );
                }),
                const SizedBox(height: 16),

                // Explication
                const Text(
                  'Explication',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _explicationController,
                  maxLines: 5,
                  decoration: const InputDecoration(
                    hintText: 'Explication détaillée...',
                  ),
                  validator: (v) =>
                      v == null || v.isEmpty ? 'Obligatoire' : null,
                ),
                const SizedBox(height: 16),

                // Statut
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: SwitchListTile(
                    title: const Text('Question publiée'),
                    value: _isPublished,
                    activeColor: AppTheme.accentColor,
                    onChanged: (v) => setState(() => _isPublished = v),
                  ),
                ),
                const SizedBox(height: 24),

                // Bouton sauvegarder
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.directColor,
                    ),
                    onPressed: _isLoading ? null : _saveChanges,
                    icon: _isLoading
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2),
                          )
                        : const Icon(Icons.save),
                    label: const Text('ENREGISTRER LES MODIFICATIONS'),
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
}
