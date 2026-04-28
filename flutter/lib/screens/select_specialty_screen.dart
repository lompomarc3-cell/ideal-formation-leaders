import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/category.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import '../widgets/cat_icon.dart';

/// Sélection du dossier principal pour un abonnement professionnel
/// (équivalent pages/select-specialty.js).
class SelectSpecialtyScreen extends StatefulWidget {
  const SelectSpecialtyScreen({super.key});

  @override
  State<SelectSpecialtyScreen> createState() => _SelectSpecialtyScreenState();
}

class _SelectSpecialtyScreenState extends State<SelectSpecialtyScreen> {
  bool _loading = true;
  List<Category> _pro = [];
  String? _selected;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final auth = context.read<AuthService>();
    try {
      final res = await auth.api.publicCategories(type: 'professionnel');
      final list = (res['categories'] as List? ?? [])
          .map((e) => Category.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      if (!mounted) return;
      setState(() {
        _pro = list;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _confirm() {
    if (_selected == null) return;
    Navigator.of(context).pushReplacementNamed(
      '/payment',
      arguments: {'type': 'professionnel', 'dossier': _selected},
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Choisir un dossier principal'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                const Padding(
                  padding: EdgeInsets.all(16),
                  child: Text(
                    'Sélectionnez votre dossier principal. Les dossiers d\'accompagnement seront automatiquement débloqués.',
                    style: TextStyle(color: Color(0xFF6B7280), fontSize: 13),
                    textAlign: TextAlign.center,
                  ),
                ),
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _pro.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, i) {
                      final c = _pro[i];
                      final selected = _selected == c.nom;
                      return InkWell(
                        onTap: () => setState(() => _selected = c.nom),
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: selected
                                ? const Color(0xFFFFF8F0)
                                : Colors.white,
                            border: Border.all(
                              color: selected
                                  ? AppColors.primary
                                  : const Color(0xFFFFE4CC),
                              width: selected ? 2 : 1,
                            ),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Row(
                            children: [
                              CatIcon(name: c.icone, catType: c.type, size: 32),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  c.nom,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 14),
                                ),
                              ),
                              if (selected)
                                const Icon(Icons.check_circle,
                                    color: AppColors.primary),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: ElevatedButton(
                    onPressed: _selected == null ? null : _confirm,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      minimumSize: const Size.fromHeight(48),
                    ),
                    child: const Text('Continuer →'),
                  ),
                ),
              ],
            ),
    );
  }
}
