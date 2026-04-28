import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';

class AdminStatsSection extends StatefulWidget {
  const AdminStatsSection({super.key});

  @override
  State<AdminStatsSection> createState() => _AdminStatsSectionState();
}

class _AdminStatsSectionState extends State<AdminStatsSection> {
  bool _loading = true;
  Map<String, dynamic> _stats = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final auth = context.read<AuthService>();
    setState(() => _loading = true);
    try {
      final res = await auth.api.adminStats(auth.token!);
      if (!mounted) return;
      setState(() {
        _stats = Map<String, dynamic>.from(res['stats'] ?? res);
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    final s = _stats;
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _card('👥', 'Utilisateurs', s['total_users']?.toString() ?? '—'),
          _card('✅', 'Abonnés actifs',
              s['active_subscribers']?.toString() ?? '—'),
          _card('⏳', 'Paiements en attente',
              s['pending_payments']?.toString() ?? '—'),
          _card('📚', 'Catégories', s['total_categories']?.toString() ?? '—'),
          _card('❓', 'Questions', s['total_questions']?.toString() ?? '—'),
          _card('📝', 'Dissertations',
              s['total_dissertations']?.toString() ?? '—'),
        ],
      ),
    );
  }

  Widget _card(String emoji, String label, String value) {
    return Card(
      child: ListTile(
        leading: Text(emoji, style: const TextStyle(fontSize: 28)),
        title: Text(label,
            style:
                const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
        trailing: Text(value,
            style: const TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 22,
                color: AppColors.darkTerracotta)),
      ),
    );
  }
}
