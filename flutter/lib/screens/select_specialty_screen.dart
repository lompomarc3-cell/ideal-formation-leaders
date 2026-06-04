import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/category.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import '../widgets/cat_icon.dart';

/// Sélection du dossier payant (concours pro) avant paiement.
/// Les 3 dossiers bonus (Entraînement, Actualités, Accompagnement)
/// ne sont PAS achetables — ils sont offerts avec un dossier payant.
class SelectSpecialtyScreen extends StatefulWidget {
  const SelectSpecialtyScreen({super.key});

  @override
  State<SelectSpecialtyScreen> createState() => _SelectSpecialtyScreenState();
}

class _SelectSpecialtyScreenState extends State<SelectSpecialtyScreen> {
  bool _loading = true;
  List<Category> _pro = [];
  String? _selected;

  static const List<String> _bonusKeywords = [
    'entraînement', 'entrainement', 'actualité', 'actualite',
    'culture', 'accompagnement', 'bonus', 'qcm général', 'qcm general'
  ];

  bool _isBonus(Category c) {
    final n = c.nom.toLowerCase();
    return _bonusKeywords.any((k) => n.contains(k));
  }

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
          .where((c) => true)
          .toList();
      // Ne garder que les dossiers payants
      final paid = list.where((c) => !_isBonus(c)).toList();
      if (!mounted) return;
      setState(() {
        _pro = paid;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _confirm() {
    if (_selected == null) return;
    Navigator.of(context).pop(_selected);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightBg,
      appBar: AppBar(
        title: const Text(
          'Choisir un dossier',
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          : Column(
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  color: const Color(0xFFFFF7ED),
                  child: const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '💰 20 000 FCFA par an / dossier payant',
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          color: AppColors.darkTerracotta,
                          fontSize: 14,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Les 3 dossiers bonus seront automatiquement débloqués avec votre achat.',
                        style: TextStyle(
                          color: Color(0xFF6B7280),
                          fontSize: 12,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.all(12),
                    itemCount: _pro.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
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
                              Container(
                                width: 48,
                                height: 48,
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFFF7ED),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: CatIcon(
                                  name: c.icone,
                                  catType: 'professionnel',
                                  size: 32,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  c.nom,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                              if (selected)
                                const Icon(Icons.check_circle_rounded,
                                    color: AppColors.primary),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
                SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: ElevatedButton.icon(
                      onPressed: _selected == null ? null : _confirm,
                      icon: const Icon(Icons.arrow_forward_rounded),
                      label: const Text('Confirmer ce dossier'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        minimumSize: const Size.fromHeight(48),
                      ),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
