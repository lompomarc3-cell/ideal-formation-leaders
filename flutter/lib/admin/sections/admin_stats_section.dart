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
  List<Map<String, dynamic>> _recentUsers = [];
  List<Map<String, dynamic>> _questionsByCategory = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final auth = context.read<AuthService>();
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await auth.api.adminStats(auth.token!);
      if (!mounted) return;
      setState(() {
        _stats = Map<String, dynamic>.from(res['stats'] ?? {});
        _recentUsers = (res['recentUsers'] as List? ?? [])
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        _questionsByCategory = (res['questionsByCategory'] as List? ?? [])
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  int _n(String key) {
    final v = _stats[key];
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v?.toString() ?? '') ?? 0;
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 8),
            Text('Erreur: $_error', textAlign: TextAlign.center),
            const SizedBox(height: 8),
            ElevatedButton(onPressed: _load, child: const Text('Réessayer')),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          // Ligne 1 : Utilisateurs
          Row(
            children: [
              Expanded(
                  child: _statCard('👥', 'Utilisateurs',
                      _n('totalUsers').toString(), AppColors.primary)),
              const SizedBox(width: 8),
              Expanded(
                  child: _statCard('✅', 'Abonnés actifs',
                      _n('activeSubscriptions').toString(), Colors.green)),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                  child: _statCard('🎓', 'Abonnés Direct',
                      _n('directSubscribers').toString(), Colors.orange)),
              const SizedBox(width: 8),
              Expanded(
                  child: _statCard('💼', 'Abonnés Pro',
                      _n('proSubscribers').toString(), Colors.blue)),
            ],
          ),
          const SizedBox(height: 8),
          // Paiements
          Row(
            children: [
              Expanded(
                  child: _statCard('⏳', 'Paiements en attente',
                      _n('pendingPayments').toString(), Colors.amber.shade700)),
              const SizedBox(width: 8),
              Expanded(
                  child: _statCard('✔', 'Paiements validés',
                      _n('approvedPayments').toString(), Colors.green.shade700)),
            ],
          ),
          const SizedBox(height: 8),
          // Contenu
          Row(
            children: [
              Expanded(
                  child: _statCard('❓', 'Questions',
                      _n('totalQuestions').toString(), Colors.purple)),
              const SizedBox(width: 8),
              Expanded(
                  child: _statCard('📚', 'Catégories',
                      _n('totalCategories').toString(), Colors.teal)),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                  child: _statCard('🎓', 'Cat. Direct',
                      _n('totalDirect').toString(), Colors.orange)),
              const SizedBox(width: 8),
              Expanded(
                  child: _statCard('💼', 'Cat. Pro',
                      _n('totalPro').toString(), Colors.blue.shade700)),
            ],
          ),
          const SizedBox(height: 16),
          if (_recentUsers.isNotEmpty) ...[
            const Text('👥 10 derniers inscrits',
                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
            const SizedBox(height: 6),
            ..._recentUsers.map((u) => Card(
                  margin: const EdgeInsets.symmetric(vertical: 3),
                  child: ListTile(
                    dense: true,
                    title: Text(u['full_name']?.toString() ?? '—',
                        style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Text(
                        '📞 ${u['phone'] ?? ''}  •  ${u['abonnement_type'] ?? 'aucun'}  •  ${u['subscription_status'] ?? ''}'),
                  ),
                )),
          ],
          const SizedBox(height: 16),
          if (_questionsByCategory.isNotEmpty) ...[
            const Text('📊 Questions par catégorie',
                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
            const SizedBox(height: 6),
            ..._questionsByCategory.take(12).map((c) => Card(
                  margin: const EdgeInsets.symmetric(vertical: 3),
                  child: ListTile(
                    dense: true,
                    leading: Text(
                        c['type'] == 'professionnel' ? '💼' : '🎓',
                        style: const TextStyle(fontSize: 18)),
                    title: Text(c['nom']?.toString() ?? '',
                        style: const TextStyle(fontWeight: FontWeight.w700)),
                    trailing: Text('${c['question_count'] ?? 0} Q',
                        style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            color: AppColors.darkTerracotta)),
                  ),
                )),
          ],
        ],
      ),
    );
  }

  Widget _statCard(String emoji, String label, String value, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(emoji, style: const TextStyle(fontSize: 22)),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(label,
                      style: const TextStyle(
                          fontSize: 11, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(value,
                style: TextStyle(
                    fontSize: 22, fontWeight: FontWeight.w900, color: color)),
          ],
        ),
      ),
    );
  }
}
