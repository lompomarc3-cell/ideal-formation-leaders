// lib/screens/admin/admin_upload_qcm_screen.dart
// Upload de QCM en masse pour l'administrateur

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../models/categorie_model.dart';
import '../../services/categorie_service.dart';
import '../../services/question_service.dart';

class AdminUploadQcmScreen extends StatefulWidget {
  const AdminUploadQcmScreen({super.key});

  @override
  State<AdminUploadQcmScreen> createState() => _AdminUploadQcmScreenState();
}

class _AdminUploadQcmScreenState extends State<AdminUploadQcmScreen> {
  CategorieModel? _selectedCategorie;
  final _textCtrl = TextEditingController();
  bool _isUploading = false;
  String? _resultMessage;
  bool _resultSuccess = false;

  // Format attendu:
  // ENONCE: La question ici ?
  // A: Option A
  // B: Option B
  // C: Option C
  // D: Option D
  // REP: A
  // EXP: Explication ici
  // ---

  List<Map<String, dynamic>> _parseQuestions(String raw) {
    final questions = <Map<String, dynamic>>[];
    final blocs = raw.split('---');

    for (final bloc in blocs) {
      if (bloc.trim().isEmpty) continue;
      final lines = bloc.trim().split('\n');
      final Map<String, String> data = {};

      for (final line in lines) {
        final trimmed = line.trim();
        if (trimmed.isEmpty) continue;

        if (trimmed.startsWith('ENONCE:')) {
          data['enonce'] = trimmed.substring(7).trim();
        } else if (trimmed.startsWith('A:')) {
          data['option_a'] = trimmed.substring(2).trim();
        } else if (trimmed.startsWith('B:')) {
          data['option_b'] = trimmed.substring(2).trim();
        } else if (trimmed.startsWith('C:')) {
          data['option_c'] = trimmed.substring(2).trim();
        } else if (trimmed.startsWith('D:')) {
          data['option_d'] = trimmed.substring(2).trim();
        } else if (trimmed.startsWith('REP:')) {
          data['reponse_correcte'] = trimmed.substring(4).trim().toUpperCase();
        } else if (trimmed.startsWith('EXP:')) {
          data['explication'] = trimmed.substring(4).trim();
        }
      }

      if (data.containsKey('enonce') &&
          data.containsKey('option_a') &&
          data.containsKey('option_b') &&
          data.containsKey('option_c') &&
          data.containsKey('option_d') &&
          data.containsKey('reponse_correcte')) {
        questions.add({
          'enonce': data['enonce'] ?? '',
          'option_a': data['option_a'] ?? '',
          'option_b': data['option_b'] ?? '',
          'option_c': data['option_c'] ?? '',
          'option_d': data['option_d'] ?? '',
          'reponse_correcte': data['reponse_correcte'] ?? 'A',
          'explication': data['explication'] ?? '',
        });
      }
    }
    return questions;
  }

  Future<void> _upload() async {
    if (_selectedCategorie == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sélectionnez d\'abord un dossier')),
      );
      return;
    }

    final raw = _textCtrl.text.trim();
    if (raw.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Collez vos questions dans le champ texte')),
      );
      return;
    }

    final questions = _parseQuestions(raw);
    if (questions.isEmpty) {
      setState(() {
        _resultMessage = 'Aucune question valide trouvée. Vérifiez le format.';
        _resultSuccess = false;
      });
      return;
    }

    setState(() => _isUploading = true);

    final service = context.read<QuestionService>();
    final result = await service.uploadQuestionsEnMasse(
      categorieId: _selectedCategorie!.id,
      questions: questions,
    );

    setState(() {
      _isUploading = false;
      final success = result['success'] as int;
      final errors = result['errors'] as int;
      _resultSuccess = success > 0;
      _resultMessage = errors == 0
          ? '✅ $success questions ajoutées avec succès !'
          : '⚠️ $success réussites, $errors erreurs. Vérifiez le format.';
    });

    if (_resultSuccess) {
      _textCtrl.clear();
      context.read<CategorieService>().loadAll();
    }
  }

  @override
  void dispose() {
    _textCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final catService = context.watch<CategorieService>();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Titre
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.directColor.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.directColor.withValues(alpha: 0.2)),
            ),
            child: const Row(
              children: [
                Icon(Icons.upload_file_rounded, color: AppTheme.directColor, size: 24),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Upload QCM en masse',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.directColor,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Sélection du dossier
          const Text(
            'Choisir le dossier cible',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.dividerColor),
            ),
            child: DropdownButton<CategorieModel>(
              value: _selectedCategorie,
              isExpanded: true,
              underline: const SizedBox(),
              hint: const Text('Sélectionner un sous-dossier'),
              items: [
                ...catService.directCategories.map((c) => DropdownMenuItem(
                      value: c,
                      child: Row(
                        children: [
                          Container(
                            width: 10,
                            height: 10,
                            decoration: const BoxDecoration(
                              color: AppTheme.directColor,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(child: Text(c.nom, style: const TextStyle(fontSize: 13))),
                        ],
                      ),
                    )),
                ...catService.professionnelCategories.map((c) => DropdownMenuItem(
                      value: c,
                      child: Row(
                        children: [
                          Container(
                            width: 10,
                            height: 10,
                            decoration: const BoxDecoration(
                              color: AppTheme.professionnelColor,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(child: Text(c.nom, style: const TextStyle(fontSize: 13))),
                        ],
                      ),
                    )),
              ],
              onChanged: (val) => setState(() => _selectedCategorie = val),
            ),
          ),
          const SizedBox(height: 16),

          // Format guide
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '📋 Format requis :',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF065F46),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.2)),
                  ),
                  child: const Text(
                    'ENONCE: Votre question ici ?\nA: Option A\nB: Option B\nC: Option C\nD: Option D\nREP: A\nEXP: Explication détaillée\n---\nENONCE: Deuxième question ?\n...',
                    style: TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 11,
                      color: Color(0xFF065F46),
                      height: 1.6,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  '• Séparez chaque question par "---"\n• REP doit être A, B, C ou D\n• EXP est optionnel mais recommandé',
                  style: TextStyle(fontSize: 11, color: Color(0xFF065F46), height: 1.5),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Champ de saisie
          const Text(
            'Collez vos questions ici',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.dividerColor),
            ),
            child: TextField(
              controller: _textCtrl,
              maxLines: 12,
              style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
              decoration: const InputDecoration(
                hintText: 'ENONCE: Votre question ?\nA: Option A\nB: Option B\nC: Option C\nD: Option D\nREP: A\nEXP: Explication\n---',
                border: InputBorder.none,
                contentPadding: EdgeInsets.all(14),
                hintStyle: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Résultat
          if (_resultMessage != null) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: _resultSuccess
                    ? const Color(0xFFECFDF5)
                    : const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: _resultSuccess
                      ? const Color(0xFF10B981)
                      : AppTheme.errorColor,
                ),
              ),
              child: Text(
                _resultMessage!,
                style: TextStyle(
                  fontSize: 13,
                  color: _resultSuccess
                      ? const Color(0xFF065F46)
                      : AppTheme.errorColor,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],

          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.directColor,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              onPressed: _isUploading ? null : _upload,
              icon: _isUploading
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.cloud_upload_rounded),
              label: Text(
                _isUploading ? 'Upload en cours...' : 'UPLOADER LES QUESTIONS',
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}
