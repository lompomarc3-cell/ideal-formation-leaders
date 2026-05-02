import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/category.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';

/// Écran dédié au dossier "Spécialités police" : affichage de sujets d'examen
/// (titre + énoncé long + corrigé détaillé), navigation par flèches ←→ entre
/// les 13 sujets, sans aucun élément de QCM (ni A/B/C/D, ni badge "5 gratuites",
/// ni boutons "Précédente / Suivante" classiques).
class PoliceExamScreen extends StatefulWidget {
  const PoliceExamScreen({super.key});

  @override
  State<PoliceExamScreen> createState() => _PoliceExamScreenState();
}

class _PoliceExamScreenState extends State<PoliceExamScreen> {
  bool _loading = true;
  String? _error;
  String? _categoryId;
  String _categoryName = 'Spécialités police';
  bool _isPublic = false;
  bool _requiresSubscription = false;
  bool _initDone = false;

  List<Question> _sujets = [];
  int _currentIndex = 0;
  final PageController _pageCtrl = PageController();

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initDone) return;
    _initDone = true;
    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    _categoryId = args?['categoryId']?.toString();
    _categoryName = args?['categoryName']?.toString() ?? 'Spécialités police';
    _isPublic = args?['isPublic'] == true;
    if (_categoryId == null) {
      setState(() {
        _loading = false;
        _error = 'Catégorie inconnue';
      });
      return;
    }
    _loadSujets();
  }

  Future<void> _loadSujets() async {
    final auth = context.read<AuthService>();
    try {
      final data = _isPublic || !auth.isAuthenticated
          ? await auth.api.publicQuestions(_categoryId!)
          : await auth.api.questions(auth.token!, _categoryId!);

      if (data['error'] != null &&
          (data['questions'] == null ||
              (data['questions'] as List).isEmpty)) {
        setState(() {
          _loading = false;
          _error = data['error'].toString();
          _requiresSubscription = data['requiresSubscription'] == true;
        });
        return;
      }

      final list = (data['questions'] as List? ?? [])
          .map((e) => Question.fromJson(Map<String, dynamic>.from(e)))
          .toList();

      int restoredIndex = await auth.getLocalProgressIndex(_categoryId!);
      if (restoredIndex >= list.length) restoredIndex = 0;

      if (!mounted) return;
      setState(() {
        _sujets = list;
        _currentIndex = restoredIndex;
        _loading = false;
      });
      if (restoredIndex > 0) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (_pageCtrl.hasClients) _pageCtrl.jumpToPage(restoredIndex);
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = 'Erreur réseau : $e';
        });
      }
    }
  }

  void _goPrev() {
    if (_currentIndex > 0) {
      _pageCtrl.previousPage(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    }
  }

  void _goNext() {
    if (_currentIndex < _sujets.length - 1) {
      _pageCtrl.nextPage(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    }
  }

  Future<void> _saveProgress(int idx) async {
    if (_categoryId == null) return;
    final auth = context.read<AuthService>();
    await auth.saveLocalProgressIndex(_categoryId!, idx);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightBg,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        title: Text(
          _categoryName,
          style: const TextStyle(fontWeight: FontWeight.w900),
        ),
        elevation: 0,
      ),
      body: SafeArea(
        child: _loading
            ? const Center(
                child: CircularProgressIndicator(color: AppColors.primary),
              )
            : _error != null
                ? _buildError()
                : _sujets.isEmpty
                    ? _buildEmpty()
                    : _buildContent(),
      ),
    );
  }

  Widget _buildContent() {
    return Column(
      children: [
        _buildTopBar(),
        Expanded(
          child: PageView.builder(
            controller: _pageCtrl,
            itemCount: _sujets.length,
            onPageChanged: (i) {
              setState(() => _currentIndex = i);
              _saveProgress(i);
            },
            itemBuilder: (_, i) => _buildSujetCard(_sujets[i]),
          ),
        ),
        _buildBottomNav(),
      ],
    );
  }

  Widget _buildTopBar() {
    final total = _sujets.length;
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              gradient: AppColors.buttonGradient,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              'Sujet ${_currentIndex + 1} / $total',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: 13,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: total == 0 ? 0 : (_currentIndex + 1) / total,
                minHeight: 8,
                backgroundColor: const Color(0xFFFFE6CC),
                valueColor: const AlwaysStoppedAnimation<Color>(
                  AppColors.primary,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSujetCard(Question s) {
    // s.questionText contient déjà : "SUJET N — ... \n\n questions ..."
    // s.explication contient le corrigé complet.
    final lines = s.questionText.split('\n');
    final titleLine = lines.isNotEmpty ? lines.first.trim() : 'Sujet';
    final restEnonce = lines.length > 1
        ? lines.sublist(1).join('\n').trim()
        : '';

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // En-tête sujet
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF0EA5E9), Color(0xFF0369A1)],
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF0EA5E9).withValues(alpha: 0.30),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.shield_rounded,
                    color: Colors.white,
                    size: 26,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    titleLine,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 15,
                      height: 1.3,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Bloc Énoncé (questions)
          if (restEnonce.isNotEmpty)
            _section(
              icon: Icons.help_outline_rounded,
              title: 'Énoncé',
              color: AppColors.primary,
              child: SelectableText(
                restEnonce,
                style: const TextStyle(
                  fontSize: 14.5,
                  height: 1.55,
                  color: AppColors.textDark,
                ),
              ),
            ),

          if (restEnonce.isNotEmpty) const SizedBox(height: 14),

          // Bloc Corrigé
          _section(
            icon: Icons.menu_book_rounded,
            title: 'Corrigé détaillé',
            color: AppColors.darkTerracotta,
            child: SelectableText(
              s.explication?.trim().isNotEmpty == true
                  ? s.explication!.trim()
                  : 'Corrigé non disponible.',
              style: const TextStyle(
                fontSize: 14.5,
                height: 1.6,
                color: AppColors.textDark,
              ),
            ),
          ),

          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _section({
    required IconData icon,
    required String title,
    required Color color,
    required Widget child,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.25), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 8),
              Text(
                title,
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.w900,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          child,
        ],
      ),
    );
  }

  Widget _buildBottomNav() {
    final canPrev = _currentIndex > 0;
    final canNext = _currentIndex < _sujets.length - 1;
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 14),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 6,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: _navButton(
              icon: Icons.arrow_back_rounded,
              label: 'Précédent',
              enabled: canPrev,
              onTap: canPrev ? _goPrev : null,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _navButton(
              icon: Icons.arrow_forward_rounded,
              label: 'Suivant',
              enabled: canNext,
              onTap: canNext ? _goNext : null,
              primary: true,
            ),
          ),
        ],
      ),
    );
  }

  Widget _navButton({
    required IconData icon,
    required String label,
    required bool enabled,
    required VoidCallback? onTap,
    bool primary = false,
  }) {
    final base = primary ? AppColors.primary : Colors.white;
    final fg = primary ? Colors.white : AppColors.primary;
    final disabledBg = const Color(0xFFE5E7EB);
    final disabledFg = const Color(0xFF9CA3AF);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        height: 48,
        decoration: BoxDecoration(
          color: enabled ? base : disabledBg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: enabled ? AppColors.primary : disabledBg,
            width: 1.5,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (!primary)
              Icon(icon, color: enabled ? fg : disabledFg, size: 20),
            if (!primary) const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: enabled ? fg : disabledFg,
                fontWeight: FontWeight.w900,
                fontSize: 14,
              ),
            ),
            if (primary) const SizedBox(width: 6),
            if (primary)
              Icon(icon, color: enabled ? fg : disabledFg, size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildError() {
    return Padding(
      padding: const EdgeInsets.all(28),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.lock_outline_rounded,
              size: 64, color: Color(0xFF9CA3AF)),
          const SizedBox(height: 16),
          Text(
            _error ?? 'Erreur',
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.textDark,
            ),
          ),
          const SizedBox(height: 16),
          if (_requiresSubscription)
            ElevatedButton.icon(
              onPressed: () =>
                  Navigator.of(context).pushNamed('/payment', arguments: {
                'type': 'professionnel',
                'dossier': _categoryName,
              }),
              icon: const Icon(Icons.workspace_premium_rounded),
              label: const Text("S'abonner"),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
              ),
            )
          else
            ElevatedButton.icon(
              onPressed: _loadSujets,
              icon: const Icon(Icons.refresh),
              label: const Text('Réessayer'),
            ),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(28),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.shield_outlined, size: 64, color: Color(0xFF9CA3AF)),
            SizedBox(height: 16),
            Text(
              'Aucun sujet disponible pour le moment.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}
