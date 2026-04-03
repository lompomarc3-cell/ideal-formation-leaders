// lib/screens/admin/admin_create_question_screen.dart
// Adapté au vrai schéma: questions(category_id, option_a/b/c/d, reponse_correcte, ...)
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../models/question_model.dart';
import '../../services/categorie_service.dart';
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
  final _matiereController = TextEditingController();
  final _anneeController = TextEditingController();

  // Controllers pour les 4 options
  final _optAController = TextEditingController();
  final _optBController = TextEditingController();
  final _optCController = TextEditingController();
  final _optDController = TextEditingController();

  String? _selectedCategoryId;
  String _reponseCorrecte = 'A'; // A, B, C, ou D
  bool _isDemo = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _selectedCategoryId = widget.preselectedSousCategorieId;
  }

  @override
  void dispose() {
    _enonceController.dispose();
    _explicationController.dispose();
    _matiereController.dispose();
    _anneeController.dispose();
    _optAController.dispose();
    _optBController.dispose();
    _optCController.dispose();
    _optDController.dispose();
    super.dispose();
  }

  Future<void> _submitQuestion() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedCategoryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Veuillez sélectionner un dossier'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    final questionService = context.read<QuestionService>();

    final question = QuestionModel(
      id: '',
      categoryId: _selectedCategoryId!,
      enonce: _enonceController.text.trim(),
      optionA: _optAController.text.trim(),
      optionB: _optBController.text.trim(),
      optionC: _optCController.text.trim(),
      optionD: _optDController.text.trim(),
      reponseCorrecte: _reponseCorrecte,
      explication: _explicationController.text.trim(),
      matiere: _matiereController.text.trim().isNotEmpty
          ? _matiereController.text.trim()
          : null,
      annee: _anneeController.text.trim().isNotEmpty
          ? _anneeController.text.trim()
          : null,
      isDemo: _isDemo,
      isActive: true,
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
    final allCats = catService.categories;

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
                _buildSectionTitle('Dossier de publication *'),
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
                      value: _selectedCategoryId,
                      isExpanded: true,
                      hint: const Text('Sélectionner un dossier'),
                      items: allCats.map((cat) {
                        final type = cat.typeConcours == 'direct'
                            ? '🔵 Direct'
                            : '🟣 Prof.';
                        return DropdownMenuItem<String>(
                          value: cat.id,
                          child: Text(
                            '$type - ${cat.nom}',
                            style: const TextStyle(fontSize: 13),
                            overflow: TextOverflow.ellipsis,
                          ),
                        );
                      }).toList(),
                      onChanged: (v) =>
                          setState(() => _selectedCategoryId = v),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Matière et année (optionnels)
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildSectionTitle('Matière'),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _matiereController,
                            decoration: const InputDecoration(
                              hintText: 'Ex: Droit constitutionnel',
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    SizedBox(
                      width: 90,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildSectionTitle('Année'),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _anneeController,
                            decoration: const InputDecoration(
                              hintText: '2024',
                            ),
                            keyboardType: TextInputType.number,
                          ),
                        ],
                      ),
                    ),
                  ],
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

                // Les 4 options
                _buildSectionTitle('Options de réponse (A, B, C, D) *'),
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
                _buildSectionTitle('Bonne réponse *'),
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
                                : AppTheme.dividerColor.withValues(alpha: 0.3),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isSelected
                                  ? AppTheme.accentColor
                                  : Colors.transparent,
                              width: 2,
                            ),
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
                _buildSectionTitle('Explication / Correction *'),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _explicationController,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    hintText:
                        'Expliquez la bonne réponse pour aider les candidats...',
                  ),
                  validator: (v) =>
                      v == null || v.isEmpty ? 'L\'explication est obligatoire' : null,
                ),
                const SizedBox(height: 16),

                // Option démo
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: SwitchListTile(
                    title: const Text('Question Démo (gratuite)'),
                    subtitle: Text(
                      _isDemo
                          ? 'Accessible sans inscription'
                          : 'Accès payant uniquement',
                      style: const TextStyle(fontSize: 12),
                    ),
                    value: _isDemo,
                    activeThumbColor: AppTheme.secondaryColor,
                    onChanged: (v) => setState(() => _isDemo = v),
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
                    label: const Text('PUBLIER LA QUESTION'),
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
