// lib/screens/admin/admin_edit_question_screen.dart
// Adapté au vrai schéma: questions(option_a/b/c/d, reponse_correcte, is_active, ...)
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

class _AdminEditQuestionScreenState extends State<AdminEditQuestionScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _enonceController;
  late TextEditingController _explicationController;
  late TextEditingController _optAController;
  late TextEditingController _optBController;
  late TextEditingController _optCController;
  late TextEditingController _optDController;
  late String _reponseCorrecte;
  late bool _isActive;
  late bool _isDemo;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _enonceController =
        TextEditingController(text: widget.question.enonce);
    _explicationController =
        TextEditingController(text: widget.question.explication);
    _optAController =
        TextEditingController(text: widget.question.optionA);
    _optBController =
        TextEditingController(text: widget.question.optionB);
    _optCController =
        TextEditingController(text: widget.question.optionC);
    _optDController =
        TextEditingController(text: widget.question.optionD);
    _reponseCorrecte = widget.question.reponseCorrecte;
    _isActive = widget.question.isActive;
    _isDemo = widget.question.isDemo;
  }

  @override
  void dispose() {
    _enonceController.dispose();
    _explicationController.dispose();
    _optAController.dispose();
    _optBController.dispose();
    _optCController.dispose();
    _optDController.dispose();
    super.dispose();
  }

  Future<void> _saveChanges() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final updatedData = {
      'enonce': _enonceController.text.trim(),
      'explication': _explicationController.text.trim(),
      'option_a': _optAController.text.trim(),
      'option_b': _optBController.text.trim(),
      'option_c': _optCController.text.trim(),
      'option_d': _optDController.text.trim(),
      'reponse_correcte': _reponseCorrecte,
      'is_active': _isActive,
      'is_demo': _isDemo,
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
                _buildSectionTitle('Énoncé'),
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

                // Options A, B, C, D
                _buildSectionTitle('Options de réponse'),
                const SizedBox(height: 8),
                _buildOptionField('A', _optAController),
                const SizedBox(height: 8),
                _buildOptionField('B', _optBController),
                const SizedBox(height: 8),
                _buildOptionField('C', _optCController),
                const SizedBox(height: 8),
                _buildOptionField('D', _optDController),
                const SizedBox(height: 16),

                // Bonne réponse
                _buildSectionTitle('Bonne réponse'),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.dividerColor),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: ['A', 'B', 'C', 'D'].map((letter) {
                      final isSelected = _reponseCorrecte == letter;
                      return GestureDetector(
                        onTap: () =>
                            setState(() => _reponseCorrecte = letter),
                        child: Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            color: isSelected
                                ? AppTheme.accentColor
                                : AppTheme.dividerColor
                                    .withValues(alpha: 0.3),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Center(
                            child: Text(
                              letter,
                              style: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                                color: isSelected
                                    ? Colors.white
                                    : AppTheme.textSecondary,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(height: 16),

                // Explication
                _buildSectionTitle('Explication'),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _explicationController,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    hintText: 'Explication détaillée...',
                  ),
                  validator: (v) =>
                      v == null || v.isEmpty ? 'Obligatoire' : null,
                ),
                const SizedBox(height: 16),

                // Statut active / démo
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    children: [
                      SwitchListTile(
                        title: const Text('Question active'),
                        subtitle: Text(
                          _isActive
                              ? 'Visible par les candidats'
                              : 'Masquée',
                          style: const TextStyle(fontSize: 12),
                        ),
                        value: _isActive,
                        activeThumbColor: AppTheme.accentColor,
                        onChanged: (v) => setState(() => _isActive = v),
                      ),
                      const Divider(height: 1),
                      SwitchListTile(
                        title: const Text('Question démo (gratuite)'),
                        subtitle: Text(
                          _isDemo
                              ? 'Accessible sans inscription'
                              : 'Accès payant',
                          style: const TextStyle(fontSize: 12),
                        ),
                        value: _isDemo,
                        activeThumbColor: AppTheme.secondaryColor,
                        onChanged: (v) => setState(() => _isDemo = v),
                      ),
                    ],
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

  Widget _buildOptionField(String label, TextEditingController controller) {
    final isSelected = _reponseCorrecte == label;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isSelected ? AppTheme.accentColor : AppTheme.dividerColor,
          width: isSelected ? 1.5 : 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: isSelected
                  ? AppTheme.accentColor
                  : AppTheme.dividerColor.withValues(alpha: 0.4),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                label,
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: isSelected ? Colors.white : AppTheme.textSecondary,
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: TextFormField(
              controller: controller,
              decoration: InputDecoration(
                hintText: 'Option $label...',
                border: InputBorder.none,
                contentPadding: EdgeInsets.zero,
              ),
              validator: (v) =>
                  v == null || v.isEmpty ? 'Option $label requise' : null,
            ),
          ),
        ],
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
