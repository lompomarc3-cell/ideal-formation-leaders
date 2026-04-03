// lib/screens/admin/admin_questions_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../models/question_model.dart';
import '../../services/question_service.dart';

class AdminQuestionsScreen extends StatefulWidget {
  final String categorieId;
  final String categorieNom;
  final Color color;

  const AdminQuestionsScreen({
    super.key,
    required this.categorieId,
    required this.categorieNom,
    required this.color,
  });

  @override
  State<AdminQuestionsScreen> createState() => _AdminQuestionsScreenState();
}

class _AdminQuestionsScreenState extends State<AdminQuestionsScreen> {
  List<QuestionModel> _questions = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final service = context.read<QuestionService>();
    final qs = await service.loadByCategorie(widget.categorieId);
    setState(() {
      _questions = qs;
      _loading = false;
    });
  }

  Future<void> _delete(QuestionModel q) async {
    final ok = await context.read<QuestionService>()
        .deleteQuestion(q.id, widget.categorieId);
    if (ok) {
      setState(() => _questions.removeWhere((x) => x.id == q.id));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Question supprimée'), duration: Duration(seconds: 1)),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: widget.color,
        title: Text(
          widget.categorieNom,
          style: const TextStyle(fontSize: 14),
          overflow: TextOverflow.ellipsis,
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _questions.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.quiz_outlined, size: 48,
                          color: widget.color.withValues(alpha: 0.4)),
                      const SizedBox(height: 12),
                      const Text('Aucune question dans ce dossier'),
                      const SizedBox(height: 8),
                      const Text(
                        'Utilisez "Upload QCM" pour ajouter des questions',
                        style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _questions.length,
                  itemBuilder: (_, i) {
                    final q = _questions[i];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                            color: widget.color.withValues(alpha: 0.15)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: widget.color.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  'Q${i + 1}',
                                  style: TextStyle(
                                    color: widget.color,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 11,
                                  ),
                                ),
                              ),
                              const Spacer(),
                              IconButton(
                                icon: const Icon(Icons.delete_outline_rounded,
                                    color: AppTheme.errorColor, size: 20),
                                onPressed: () => _confirmDelete(q),
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(
                                    minWidth: 28, minHeight: 28),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            q.enonce,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.textPrimary,
                              height: 1.4,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 6),
                          Wrap(
                            spacing: 6,
                            children: ['A', 'B', 'C', 'D'].map((l) {
                              final isCorrect = l == q.reponseCorrecte.toUpperCase();
                              return Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: isCorrect
                                      ? const Color(0xFFECFDF5)
                                      : AppTheme.backgroundColor,
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(
                                    color: isCorrect
                                        ? const Color(0xFF10B981)
                                        : AppTheme.dividerColor,
                                  ),
                                ),
                                child: Text(
                                  '$l: ${q.getOption(l).length > 20 ? q.getOption(l).substring(0, 20) + '...' : q.getOption(l)}',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: isCorrect
                                        ? const Color(0xFF065F46)
                                        : AppTheme.textSecondary,
                                    fontWeight: isCorrect
                                        ? FontWeight.w700
                                        : FontWeight.w400,
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    );
                  },
                ),
    );
  }

  void _confirmDelete(QuestionModel q) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Supprimer la question ?'),
        content: Text(
          q.enonce.length > 80
              ? '${q.enonce.substring(0, 80)}...'
              : q.enonce,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.errorColor),
            onPressed: () {
              Navigator.pop(context);
              _delete(q);
            },
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );
  }
}
