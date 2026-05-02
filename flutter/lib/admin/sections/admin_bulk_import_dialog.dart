import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';

/// Dialog d'import massif de questions QCM en TEXTE BRUT.
///
/// Format simple, accessible à un administrateur non-technique :
///
/// ```
/// Q: Quelle est la capitale du Burkina Faso ?
/// A) Bobo-Dioulasso
/// B) Ouagadougou
/// C) Koudougou
/// D) Banfora
/// Réponse: B
/// Explication: Ouagadougou est la capitale depuis 1960.
///
/// Q: Combien de régions ?
/// A) 11
/// B) 12
/// C) 13
/// D) 14
/// Réponse: C
/// ```
///
/// Le parser tolère plusieurs variantes (A. / A) / A: / 1) / etc.).
/// Aperçu avant insertion + détection de 50+ questions.
class AdminBulkImportDialog extends StatefulWidget {
  final List<Map<String, dynamic>> categories;
  final VoidCallback onImported;
  const AdminBulkImportDialog({
    super.key,
    required this.categories,
    required this.onImported,
  });

  @override
  State<AdminBulkImportDialog> createState() => _AdminBulkImportDialogState();
}

class _AdminBulkImportDialogState extends State<AdminBulkImportDialog> {
  final TextEditingController _textCtrl = TextEditingController();
  String? _categoryId;
  List<Map<String, dynamic>> _parsed = [];
  bool _previewMode = false;
  bool _importing = false;
  String? _errorMessage;

  @override
  void dispose() {
    _textCtrl.dispose();
    super.dispose();
  }

  /// Parse le texte brut en liste de questions.
  /// Tolère :
  ///   Q:, Question:, ou ligne commençant par un numéro
  ///   A) / A. / A: / a) / 1)
  ///   Réponse: B / Bonne réponse: B / Correct: B
  ///   Explication: ...
  List<Map<String, dynamic>> _parseRawText(String raw) {
    final List<Map<String, dynamic>> result = [];
    if (raw.trim().isEmpty) return result;

    // Découper en blocs séparés par 1+ ligne(s) vide(s)
    final blocks = raw
        .split(RegExp(r'\n\s*\n'))
        .map((b) => b.trim())
        .where((b) => b.isNotEmpty)
        .toList();

    for (final block in blocks) {
      final lines =
          block.split('\n').map((l) => l.trim()).where((l) => l.isNotEmpty).toList();
      if (lines.length < 5) continue; // au moins question + 4 options

      String enonce = '';
      String optA = '', optB = '', optC = '', optD = '';
      String bonneReponse = '';
      String explication = '';

      for (final line in lines) {
        // Énoncé : "Q:", "Question:", ou première ligne non préfixée
        final qMatch = RegExp(r'^(?:Q|Question|QCM)\s*[:\.\)]\s*(.+)$',
                caseSensitive: false)
            .firstMatch(line);
        if (qMatch != null) {
          enonce = qMatch.group(1)!.trim();
          continue;
        }

        // Options A/B/C/D
        final optMatch =
            RegExp(r'^([A-Da-d])\s*[\)\.\:\-]\s*(.+)$').firstMatch(line);
        if (optMatch != null) {
          final letter = optMatch.group(1)!.toUpperCase();
          final text = optMatch.group(2)!.trim();
          if (letter == 'A') optA = text;
          if (letter == 'B') optB = text;
          if (letter == 'C') optC = text;
          if (letter == 'D') optD = text;
          continue;
        }

        // Réponse correcte
        final repMatch = RegExp(
                r'^(?:R[ée]ponse|Bonne\s*r[ée]ponse|Correct|Solution|Answer)\s*[:\.]?\s*([A-Da-d])',
                caseSensitive: false)
            .firstMatch(line);
        if (repMatch != null) {
          bonneReponse = repMatch.group(1)!.toUpperCase();
          continue;
        }

        // Explication
        final explMatch = RegExp(
                r'^(?:Explication|Justification|Commentaire|Explanation)\s*[:\.]\s*(.+)$',
                caseSensitive: false)
            .firstMatch(line);
        if (explMatch != null) {
          explication = explMatch.group(1)!.trim();
          continue;
        }

        // Si aucune des règles ci-dessus et énoncé vide, considérer comme énoncé
        if (enonce.isEmpty &&
            !line.toLowerCase().startsWith('réponse') &&
            !line.toLowerCase().startsWith('explication')) {
          enonce = line;
        } else if (explication.isNotEmpty) {
          // Explication multilignes
          explication = '$explication\n$line';
        }
      }

      // Validation : il faut un énoncé, 4 options, et une bonne réponse
      if (enonce.isEmpty ||
          optA.isEmpty ||
          optB.isEmpty ||
          optC.isEmpty ||
          optD.isEmpty ||
          bonneReponse.isEmpty) {
        continue;
      }

      result.add({
        'question_text': enonce,
        'option_a': optA,
        'option_b': optB,
        'option_c': optC,
        'option_d': optD,
        'bonne_reponse': bonneReponse,
        'explication': explication,
        'is_demo': false,
      });
    }

    return result;
  }

  void _doParse() {
    setState(() {
      _errorMessage = null;
      _parsed = _parseRawText(_textCtrl.text);
      if (_parsed.isEmpty) {
        _errorMessage =
            'Aucune question détectée. Vérifiez le format (Q:, A), B), C), D), Réponse:).';
        _previewMode = false;
      } else {
        _previewMode = true;
      }
    });
  }

  Future<void> _doImport() async {
    if (_categoryId == null) {
      setState(() => _errorMessage = 'Veuillez choisir un dossier cible.');
      return;
    }
    if (_parsed.isEmpty) {
      setState(() => _errorMessage = 'Aucune question à importer.');
      return;
    }
    setState(() {
      _importing = true;
      _errorMessage = null;
    });
    final auth = context.read<AuthService>();
    try {
      final res = await auth.api.adminBulkImportQuestions(
        auth.token!,
        categoryId: _categoryId!,
        questions: _parsed,
      );
      if (!mounted) return;
      setState(() => _importing = false);
      if (res['success'] == true) {
        final inserted = res['inserted'] ?? 0;
        final skipped = res['skipped'] ?? 0;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                '✅ Import réussi : $inserted question(s) ajoutée(s)${skipped > 0 ? " — $skipped doublon(s) ignoré(s)" : ""}'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 4),
          ),
        );
        widget.onImported();
        Navigator.of(context).pop();
      } else {
        setState(() => _errorMessage =
            res['error']?.toString() ?? "Erreur lors de l'import.");
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _importing = false;
        _errorMessage = 'Erreur réseau : $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.all(16),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 700, maxHeight: 700),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // ===== En-tête =====
            Row(
              children: [
                const Icon(Icons.upload_file_rounded,
                    color: AppColors.primary, size: 26),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Import massif de questions',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: AppColors.darkTerracotta,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
            const SizedBox(height: 6),
            const Text(
              'Collez votre texte brut ci-dessous. Le parser détecte automatiquement les questions, options A/B/C/D, réponse et explication.',
              style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
            ),
            const SizedBox(height: 12),

            // ===== Choix du dossier cible =====
            DropdownButtonFormField<String>(
              initialValue: _categoryId,
              decoration: const InputDecoration(
                labelText: 'Dossier cible *',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.folder_special_rounded),
              ),
              items: widget.categories
                  .map((c) => DropdownMenuItem<String>(
                        value: c['id'].toString(),
                        child: Text(
                          '${c['type'] == 'professionnel' ? '💼' : '🎓'} '
                          '${c['nom']?.toString() ?? ''}',
                          overflow: TextOverflow.ellipsis,
                        ),
                      ))
                  .toList(),
              onChanged: (v) => setState(() => _categoryId = v),
            ),
            const SizedBox(height: 12),

            // ===== Format attendu (aide) =====
            ExpansionTile(
              tilePadding: EdgeInsets.zero,
              title: const Text(
                '📖 Format attendu (cliquer pour voir un exemple)',
                style: TextStyle(
                    fontSize: 12, fontWeight: FontWeight.w700),
              ),
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF7ED),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFFED7AA)),
                  ),
                  child: const Text(
                    '''Q: Quelle est la capitale du Burkina Faso ?
A) Bobo-Dioulasso
B) Ouagadougou
C) Koudougou
D) Banfora
Réponse: B
Explication: Ouagadougou est la capitale depuis 1960.

Q: Combien de régions a le Burkina Faso ?
A) 11
B) 12
C) 13
D) 14
Réponse: C
Explication: Le pays compte 13 régions.''',
                    style: TextStyle(
                      fontSize: 11,
                      fontFamily: 'monospace',
                      color: Color(0xFF7C2D12),
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  '• Séparez chaque question par une ligne vide\n'
                  '• Variantes acceptées : Q:, Question:, A), A., A:, Réponse:, Bonne réponse:\n'
                  '• L\'explication est optionnelle\n'
                  '• Les doublons sont automatiquement ignorés',
                  style: TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // ===== Zone de texte ou aperçu =====
            Expanded(
              child: _previewMode
                  ? _buildPreview()
                  : TextField(
                      controller: _textCtrl,
                      maxLines: null,
                      expands: true,
                      textAlignVertical: TextAlignVertical.top,
                      style: const TextStyle(
                          fontFamily: 'monospace', fontSize: 12),
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(),
                        hintText:
                            'Collez ici vos questions (50+ minimum recommandé)...',
                        alignLabelWithHint: true,
                      ),
                    ),
            ),

            if (_errorMessage != null) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFFCA5A5)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline,
                        color: Color(0xFF991B1B), size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(
                            color: Color(0xFF991B1B), fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 12),

            // ===== Boutons d'action =====
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (_previewMode)
                  TextButton.icon(
                    onPressed: _importing
                        ? null
                        : () => setState(() {
                              _previewMode = false;
                              _errorMessage = null;
                            }),
                    icon: const Icon(Icons.edit, size: 16),
                    label: const Text('Modifier le texte'),
                  ),
                const SizedBox(width: 8),
                if (!_previewMode)
                  ElevatedButton.icon(
                    onPressed: _doParse,
                    icon: const Icon(Icons.preview_rounded, size: 18),
                    label: const Text('Aperçu'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.darkTerracotta,
                      foregroundColor: Colors.white,
                    ),
                  )
                else
                  ElevatedButton.icon(
                    onPressed: _importing ? null : _doImport,
                    icon: _importing
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.cloud_upload_rounded, size: 18),
                    label: Text(_importing
                        ? 'Import en cours...'
                        : 'Importer ${_parsed.length} question(s)'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF16A34A),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 12),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPreview() {
    final count = _parsed.length;
    final isMin50 = count >= 50;
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFFE5E7EB)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Bandeau récap
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isMin50
                  ? const Color(0xFFD1FAE5)
                  : const Color(0xFFFFF7ED),
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(8)),
              border: Border(
                bottom: BorderSide(color: const Color(0xFFE5E7EB)),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  isMin50
                      ? Icons.check_circle_rounded
                      : Icons.info_outline_rounded,
                  color: isMin50
                      ? const Color(0xFF065F46)
                      : const Color(0xFFB45309),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    isMin50
                        ? '$count question(s) détectée(s) — ✓ Plus de 50, parfait !'
                        : '$count question(s) détectée(s) (50+ recommandé pour un import massif)',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      color: isMin50
                          ? const Color(0xFF065F46)
                          : const Color(0xFFB45309),
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Liste scrollable
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(10),
              itemCount: _parsed.length,
              separatorBuilder: (_, __) => const Divider(height: 16),
              itemBuilder: (ctx, i) {
                final q = _parsed[i];
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${i + 1}. ${q['question_text']}',
                      style: const TextStyle(
                          fontWeight: FontWeight.w700, fontSize: 12.5),
                    ),
                    const SizedBox(height: 4),
                    for (final letter in ['A', 'B', 'C', 'D'])
                      Text(
                        '$letter) ${q['option_${letter.toLowerCase()}']}',
                        style: TextStyle(
                          fontSize: 11,
                          color: q['bonne_reponse'] == letter
                              ? const Color(0xFFC4521A)
                              : Colors.black87,
                          fontWeight: q['bonne_reponse'] == letter
                              ? FontWeight.w800
                              : FontWeight.normal,
                        ),
                      ),
                    if ((q['explication'] ?? '').toString().isNotEmpty) ...[
                      const SizedBox(height: 3),
                      Text(
                        '💡 ${q['explication']}',
                        style: const TextStyle(
                          fontSize: 10.5,
                          color: Color(0xFF6B7280),
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ],
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
