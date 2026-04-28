import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/auth_service.dart';
import '../theme/app_theme.dart';

/// Panneau d'administration simplifié (équivalent pages/admin/index.js)
/// — affiche les statistiques, la liste des utilisateurs et les paiements en attente.
/// La validation des paiements appelle /api/admin/validate-payment.
class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  bool _loading = true;
  Map<String, dynamic>? _stats;
  List<Map<String, dynamic>> _users = [];
  List<Map<String, dynamic>> _payments = [];
  int _tab = 0; // 0=Stats, 1=Users, 2=Payments

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthService>();
      if (!auth.isAdmin) {
        Navigator.of(context).pushReplacementNamed('/dashboard');
        return;
      }
      _load();
    });
  }

  Future<void> _load() async {
    final auth = context.read<AuthService>();
    final token = auth.token!;
    try {
      final results = await Future.wait([
        auth.api.adminStats(token),
        auth.api.adminUsers(token),
        auth.api.adminPayments(token),
      ]);
      if (!mounted) return;
      setState(() {
        _stats = Map<String, dynamic>.from(results[0]['stats'] ?? results[0]);
        _users = (results[1]['users'] as List? ?? [])
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        _payments = (results[2]['payments'] as List? ?? [])
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _validatePayment(String paymentId, String action) async {
    final auth = context.read<AuthService>();
    final res = await auth.api.adminValidatePayment(
      auth.token!,
      paymentId: paymentId,
      action: action,
    );
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(res['success'] == true
            ? '✅ Paiement ${action == "approve" ? "approuvé" : "rejeté"}'
            : '⚠️ ${res['error'] ?? "Erreur"}'),
      ),
    );
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('🛠️ Panneau Admin'),
        backgroundColor: AppColors.darkTerracotta,
        foregroundColor: Colors.white,
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Container(
                  color: AppColors.darkTerracotta,
                  child: Row(
                    children: [
                      _tabBtn('📊 Stats', 0),
                      _tabBtn('👥 Utilisateurs', 1),
                      _tabBtn('💳 Paiements', 2),
                    ],
                  ),
                ),
                Expanded(child: _buildBody()),
              ],
            ),
    );
  }

  Widget _tabBtn(String label, int idx) {
    final active = _tab == idx;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _tab = idx),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: active ? AppColors.secondary : Colors.transparent,
                width: 3,
              ),
            ),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: active ? AppColors.secondary : Colors.white70,
              fontWeight: FontWeight.w700,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_tab == 0) return _buildStats();
    if (_tab == 1) return _buildUsers();
    return _buildPayments();
  }

  Widget _buildStats() {
    final s = _stats ?? {};
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _statCard('Utilisateurs', s['total_users']?.toString() ?? '—', '👥'),
        _statCard('Abonnés actifs',
            s['active_subscribers']?.toString() ?? '—', '✅'),
        _statCard(
            'Paiements en attente', s['pending_payments']?.toString() ?? '—', '⏳'),
        _statCard('Catégories', s['total_categories']?.toString() ?? '—', '📚'),
        _statCard('Questions', s['total_questions']?.toString() ?? '—', '❓'),
      ],
    );
  }

  Widget _statCard(String label, String value, String emoji) {
    return Card(
      child: ListTile(
        leading: Text(emoji, style: const TextStyle(fontSize: 28)),
        title: Text(label,
            style: const TextStyle(
                fontWeight: FontWeight.w700, fontSize: 14)),
        trailing: Text(value,
            style: const TextStyle(
              fontWeight: FontWeight.w900,
              fontSize: 22,
              color: AppColors.darkTerracotta,
            )),
      ),
    );
  }

  Widget _buildUsers() {
    if (_users.isEmpty) {
      return const Center(child: Text('Aucun utilisateur'));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: _users.length,
      itemBuilder: (context, i) {
        final u = _users[i];
        final isAdmin = u['is_admin'] == true || u['role'] == 'superadmin';
        return Card(
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor:
                  isAdmin ? AppColors.darkTerracotta : AppColors.primary,
              child: Text(
                (u['full_name'] ?? '?').toString().substring(0, 1).toUpperCase(),
                style: const TextStyle(color: Colors.white),
              ),
            ),
            title: Text(u['full_name']?.toString() ?? '—'),
            subtitle: Text('${u['phone'] ?? ''}\n${u['subscription_type'] ?? "free"} • ${u['subscription_status'] ?? "free"}'),
            isThreeLine: true,
            trailing: isAdmin
                ? const Chip(
                    label: Text('ADMIN', style: TextStyle(fontSize: 10)),
                    backgroundColor: Color(0xFFFFE4CC))
                : null,
          ),
        );
      },
    );
  }

  Widget _buildPayments() {
    if (_payments.isEmpty) {
      return const Center(child: Text('Aucun paiement'));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: _payments.length,
      itemBuilder: (context, i) {
        final p = _payments[i];
        final status = (p['status'] ?? 'pending').toString();
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        p['user_name']?.toString() ??
                            p['user_id']?.toString() ??
                            '—',
                        style: const TextStyle(
                            fontWeight: FontWeight.w800, fontSize: 14),
                      ),
                    ),
                    Chip(
                      label: Text(status,
                          style: const TextStyle(fontSize: 10)),
                      backgroundColor: status == 'approved'
                          ? const Color(0xFFD1FAE5)
                          : status == 'rejected'
                              ? const Color(0xFFFEE2E2)
                              : const Color(0xFFFFF3CD),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                    '${p['type_concours'] ?? ""} • ${p['montant'] ?? ""} FCFA${p['dossier_principal'] != null ? " • ${p['dossier_principal']}" : ""}',
                    style: const TextStyle(
                        color: Color(0xFF6B7280), fontSize: 12)),
                if (status == 'pending') ...[
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _validatePayment(
                              p['id'].toString(), 'reject'),
                          icon: const Icon(Icons.close, size: 16),
                          label: const Text('Rejeter'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFFDC2626),
                            side: const BorderSide(color: Color(0xFFDC2626)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () => _validatePayment(
                              p['id'].toString(), 'approve'),
                          icon: const Icon(Icons.check, size: 16),
                          label: const Text('Approuver'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF16A34A),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}
