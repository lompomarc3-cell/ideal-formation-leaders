// lib/screens/admin/admin_upload_qcm_screen.dart
// Upload de QCM en masse pour l'administrateur - VERSION AMÉLIORÉE

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
  List<String> _errorDetails = [];
  int _parsedCount = 0; // count utilisé dans previewQuestions

  // Format attendu:
  // ENONCE: La question ici ?
  // A: Option A
  // B: Option B
  // C: Option C
  // D: Option D
  // REP: A
  // EXP: Explication ici (optionnel)
  // ---

  List<Map<String, dynamic>> _parseQuestions(String raw) {
    final questions = <Map<String, dynamic>>[];
    // Supporter --- et == comme séparateurs
    final blocs = raw.split(RegExp(r'---+|===+'));

    for (final bloc in blocs) {
      if (bloc.trim().isEmpty) continue;
      final lines = bloc.trim().split('\n');
      final Map<String, String> data = {};

      for (final line in lines) {
        final trimmed = line.trim();
        if (trimmed.isEmpty) continue;

        if (trimmed.toUpperCase().startsWith('ENONCE:')) {
          data['enonce'] = trimmed.substring(7).trim();
        } else if (trimmed.toUpperCase().startsWith('QUESTION:')) {
          data['enonce'] = trimmed.substring(9).trim();
        } else if (trimmed.startsWith('A:') || trimmed.startsWith('a)') || trimmed.startsWith('A)')) {
          data['option_a'] = trimmed.replaceFirst(RegExp(r'^[Aa][:\)]'), '').trim();
        } else if (trimmed.startsWith('B:') || trimmed.startsWith('b)') || trimmed.startsWith('B)')) {
          data['option_b'] = trimmed.replaceFirst(RegExp(r'^[Bb][:\)]'), '').trim();
        } else if (trimmed.startsWith('C:') || trimmed.startsWith('c)') || trimmed.startsWith('C)')) {
          data['option_c'] = trimmed.replaceFirst(RegExp(r'^[Cc][:\)]'), '').trim();
        } else if (trimmed.startsWith('D:') || trimmed.startsWith('d)') || trimmed.startsWith('D)')) {
          data['option_d'] = trimmed.replaceFirst(RegExp(r'^[Dd][:\)]'), '').trim();
        } else if (trimmed.toUpperCase().startsWith('REP:') || trimmed.toUpperCase().startsWith('REPONSE:') || trimmed.toUpperCase().startsWith('RÉPONSE:')) {
          final rep = trimmed.split(':').last.trim().toUpperCase();
          data['reponse_correcte'] = rep.isNotEmpty ? rep[0] : 'A';
        } else if (trimmed.toUpperCase().startsWith('EXP:') || trimmed.toUpperCase().startsWith('EXPLICATION:')) {
          final expIdx = trimmed.indexOf(':');
          data['explication'] = trimmed.substring(expIdx + 1).trim();
        }
      }

      // Valider les champs obligatoires
      if (data.containsKey('enonce') &&
          data['enonce']!.isNotEmpty &&
          data.containsKey('option_a') &&
          data.containsKey('option_b') &&
          data.containsKey('option_c') &&
          data.containsKey('option_d') &&
          data.containsKey('reponse_correcte')) {
        // Valider que REP est bien A, B, C ou D
        final rep = data['reponse_correcte']!;
        if (['A', 'B', 'C', 'D'].contains(rep)) {
          questions.add({
            'enonce': data['enonce'] ?? '',
            'option_a': data['option_a'] ?? '',
            'option_b': data['option_b'] ?? '',
            'option_c': data['option_c'] ?? '',
            'option_d': data['option_d'] ?? '',
            'reponse_correcte': rep,
            'explication': data['explication'] ?? '',
          });
        }
      }
    }
    return questions;
  }

  void _previewQuestions() {
    final raw = _textCtrl.text.trim();
    if (raw.isEmpty) return;
    final questions = _parseQuestions(raw);
    setState(() => _parsedCount = questions.length);

    if (questions.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Aucune question valide trouvée. Vérifiez le format.'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }

    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            const Icon(Icons.preview_rounded, color: AppTheme.directColor),
            const SizedBox(width: 8),
            Text('${questions.length} questions détectées'),
          ],
        ),
        content: SizedBox(
          width: double.maxFinite,
          height: 300,
          child: ListView.builder(
            itemCount: questions.length > 5 ? 5 : questions.length,
            itemBuilder: (_, i) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${i + 1}. ${questions[i]['enonce']}',
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Réponse: ${questions[i]['reponse_correcte']}',
                      style: const TextStyle(color: AppTheme.accentColor, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Fermer'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.directColor),
            onPressed: () {
              Navigator.pop(context);
              _upload();
            },
            child: const Text('Uploader maintenant'),
          ),
        ],
      ),
    );
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
        _errorDetails = [];
      });
      return;
    }

    setState(() {
      _isUploading = true;
      _resultMessage = null;
      _errorDetails = [];
    });

    final service = context.read<QuestionService>();
    final result = await service.uploadQuestionsEnMasse(
      categorieId: _selectedCategorie!.id,
      questions: questions,
    );

    if (!mounted) return;

    setState(() {
      _isUploading = false;
      final success = result['success'] as int;
      final errors = result['errors'] as int;
      _errorDetails = (result['errorMessages'] as List<String>).take(3).toList();
      _resultSuccess = success > 0;

      if (errors == 0) {
        _resultMessage = '✅ $success question(s) ajoutée(s) avec succès dans "${_selectedCategorie!.nom}" !';
      } else if (success > 0) {
        _resultMessage = '⚠️ $success réussites, $errors erreur(s). Vérifiez le format.';
      } else {
        _resultMessage = '❌ Échec de l\'upload. Vérifiez que le dossier est bien sélectionné et le format correct.';
      }
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
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Upload QCM en masse',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.directColor,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Importez plusieurs questions d\'un coup',
                        style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                      ),
                    ],
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
              border: Border.all(
                color: _selectedCategorie != null
                    ? AppTheme.accentColor
                    : AppTheme.dividerColor,
                width: _selectedCategorie != null ? 2 : 1,
              ),
            ),
            child: DropdownButton<CategorieModel>(
              value: _selectedCategorie,
              isExpanded: true,
              underline: const SizedBox(),
              hint: const Text('Sélectionner un sous-dossier'),
              items: [
                const DropdownMenuItem<CategorieModel>(
                  enabled: false,
                  child: Text('── Concours Direct ──',
                      style: TextStyle(color: AppTheme.directColor, fontWeight: FontWeight.w700, fontSize: 12)),
                ),
                ...catService.directCategories.map((c) => DropdownMenuItem(
                      value: c,
                      child: Row(
                        children: [
                          Container(
                            width: 10, height: 10,
                            decoration: const BoxDecoration(
                              color: AppTheme.directColor,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(child: Text(c.nom, style: const TextStyle(fontSize: 13))),
                          Text('${c.questionCount} QCM',
                              style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                        ],
                      ),
                    )),
                const DropdownMenuItem<CategorieModel>(
                  enabled: false,
                  child: Text('── Concours Professionnel ──',
                      style: TextStyle(color: AppTheme.professionnelColor, fontWeight: FontWeight.w700, fontSize: 12)),
                ),
                ...catService.professionnelCategories.map((c) => DropdownMenuItem(
                      value: c,
                      child: Row(
                        children: [
                          Container(
                            width: 10, height: 10,
                            decoration: const BoxDecoration(
                              color: AppTheme.professionnelColor,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(child: Text(c.nom, style: const TextStyle(fontSize: 13))),
                          Text('${c.questionCount} QCM',
                              style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
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
                  '📋 Format requis (un bloc par question, séparés par "---") :',
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
                  '• Séparez chaque question par "---"\n• REP doit être A, B, C ou D\n• EXP est optionnel mais recommandé\n• Vous pouvez utiliser "QUESTION:" au lieu de "ENONCE:"',
                  style: TextStyle(fontSize: 11, color: Color(0xFF065F46), height: 1.5),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Champ de saisie avec compteur
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Collez vos questions ici',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
              ),
              if (_textCtrl.text.isNotEmpty)
                TextButton.icon(
                  onPressed: _previewQuestions,
                  icon: const Icon(Icons.preview_rounded, size: 16),
                  label: const Text('Prévisualiser', style: TextStyle(fontSize: 12)),
                  style: TextButton.styleFrom(foregroundColor: AppTheme.directColor),
                ),
            ],
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
              maxLines: 14,
              style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(
                hintText: 'ENONCE: Votre question ?\nA: Option A\nB: Option B\nC: Option C\nD: Option D\nREP: A\nEXP: Explication\n---',
                border: InputBorder.none,
                contentPadding: EdgeInsets.all(14),
                hintStyle: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
              ),
            ),
          ),
          const SizedBox(height: 6),
          if (_textCtrl.text.isNotEmpty)
            Align(
              alignment: Alignment.centerRight,
              child: Text(
                '${_textCtrl.text.split('---').where((b) => b.trim().isNotEmpty).length} bloc(s) détecté(s)',
                style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _resultMessage!,
                    style: TextStyle(
                      fontSize: 13,
                      color: _resultSuccess
                          ? const Color(0xFF065F46)
                          : AppTheme.errorColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (_errorDetails.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      'Détails erreurs :\n${_errorDetails.map((e) => '• $e').join('\n')}',
                      style: const TextStyle(fontSize: 11, color: AppTheme.errorColor),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],

          // Boutons
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.directColor,
                    side: const BorderSide(color: AppTheme.directColor),
                    padding: const EdgeInsets.symmetric(vertical: 13),
                  ),
                  onPressed: _textCtrl.text.isEmpty ? null : _previewQuestions,
                  icon: const Icon(Icons.preview_rounded, size: 18),
                  label: const Text('PRÉVISUALISER'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                flex: 2,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.directColor,
                    padding: const EdgeInsets.symmetric(vertical: 13),
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
            ],
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}
