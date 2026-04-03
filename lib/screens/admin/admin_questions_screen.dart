// lib/screens/admin/admin_questions_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../models/question_model.dart';
import '../../services/question_service.dart';
import 'admin_create_question_screen.dart';
import 'admin_edit_question_screen.dart';

class AdminQuestionsScreen extends StatefulWidget {
  final String sousCategorieId;
  final String sousCategorieNom;
  final Color color;

  const AdminQuestionsScreen({
    super.key,
    required this.sousCategorieId,
    required this.sousCategorieNom,
    required this.color,
  });

  @override
  State<AdminQuestionsScreen> createState() => _AdminQuestionsScreenState();
}

class _AdminQuestionsScreenState extends State<AdminQuestionsScreen> {
  List<QuestionModel> _questions = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance
        .addPostFrameCallback((_) => _loadQuestions());
  }

  Future<void> _loadQuestions() async {
    setState(() => _isLoading = true);
    final qs = await context
        .read<QuestionService>()
        .getAllQuestions(categoryId: widget.sousCategorieId);
    setState(() {
      _questions = qs;
      _isLoading = false;
    });
  }

  Future<void> _deleteQuestion(String id) async {
    if (!mounted) return;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Supprimer la question ?'),
        content:
            const Text('Cette action est irréversible.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Annuler')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.errorColor),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );
    if (confirm == true && mounted) {
      await context.read<QuestionService>().deleteQuestion(id);
      _loadQuestions();
    }
  }

  Future<void> _togglePublish(QuestionModel q) async {
    await context
        .read<QuestionService>()
        .togglePublish(q.id, !q.isPublished);
    _loadQuestions();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: widget.color,
        title: Text(widget.sousCategorieNom,
            style: const TextStyle(fontSize: 15)),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline),
            tooltip: 'Ajouter une question',
            onPressed: () async {
              await Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => AdminCreateQuestionScreen(
                    preselectedSousCategorieId: widget.sousCategorieId,
                  ),
                ),
              );
              _loadQuestions();
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: widget.color,
        onPressed: () async {
          await Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => AdminCreateQuestionScreen(
                preselectedSousCategorieId: widget.sousCategorieId,
              ),
            ),
          );
          _loadQuestions();
        },
        icon: const Icon(Icons.add),
        label: const Text('Ajouter'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _questions.isEmpty
              ? _buildEmpty()
              : _buildList(),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.quiz_outlined,
              size: 64,
              color: widget.color.withValues(alpha: 0.3)),
          const SizedBox(height: 12),
          const Text(
            'Aucune question dans ce dossier',
            style: TextStyle(
                fontSize: 16, color: AppTheme.textSecondary),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
                backgroundColor: widget.color),
            onPressed: () async {
              await Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => AdminCreateQuestionScreen(
                    preselectedSousCategorieId: widget.sousCategorieId,
                  ),
                ),
              );
              _loadQuestions();
            },
            icon: const Icon(Icons.add),
            label: const Text('Ajouter une question'),
          ),
        ],
      ),
    );
  }

  Widget _buildList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _questions.length,
      itemBuilder: (context, index) {
        final q = _questions[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: q.isPublished
                  ? AppTheme.accentColor.withValues(alpha: 0.3)
                  : AppTheme.dividerColor,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header question
              Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            q.enonce,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.textPrimary,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        // Badge publié/non publié
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: q.isPublished
                                ? AppTheme.accentColor.withValues(alpha: 0.12)
                                : Colors.grey.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            q.isPublished ? 'Publié' : 'Masqué',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: q.isPublished
                                  ? AppTheme.accentColor
                                  : Colors.grey,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '4 options • Réponse correcte: ${q.reponseCorrecte}${q.matiere != null ? ' • ${q.matiere}' : ''}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              // Actions
              Container(
                decoration: BoxDecoration(
                  color: AppTheme.backgroundColor,
                  borderRadius: const BorderRadius.vertical(
                      bottom: Radius.circular(14)),
                ),
                child: Row(
                  children: [
                    // Publier/Masquer
                    Expanded(
                      child: TextButton.icon(
                        onPressed: () => _togglePublish(q),
                        icon: Icon(
                          q.isPublished
                              ? Icons.visibility_off
                              : Icons.visibility,
                          size: 16,
                          color: q.isPublished
                              ? Colors.grey
                              : AppTheme.accentColor,
                        ),
                        label: Text(
                          q.isPublished ? 'Masquer' : 'Publier',
                          style: TextStyle(
                            fontSize: 12,
                            color: q.isPublished
                                ? Colors.grey
                                : AppTheme.accentColor,
                          ),
                        ),
                      ),
                    ),
                    // Modifier
                    Expanded(
                      child: TextButton.icon(
                        onPressed: () async {
                          await Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) =>
                                  AdminEditQuestionScreen(question: q),
                            ),
                          );
                          _loadQuestions();
                        },
                        icon: const Icon(Icons.edit, size: 16,
                            color: AppTheme.directColor),
                        label: const Text(
                          'Modifier',
                          style: TextStyle(
                              fontSize: 12, color: AppTheme.directColor),
                        ),
                      ),
                    ),
                    // Supprimer
                    Expanded(
                      child: TextButton.icon(
                        onPressed: () => _deleteQuestion(q.id),
                        icon: const Icon(Icons.delete_outline,
                            size: 16, color: AppTheme.errorColor),
                        label: const Text(
                          'Supprimer',
                          style: TextStyle(
                              fontSize: 12, color: AppTheme.errorColor),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
