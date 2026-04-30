import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';

class AdminPaymentsSection extends StatefulWidget {
  const AdminPaymentsSection({super.key});

  @override
  State<AdminPaymentsSection> createState() => _AdminPaymentsSectionState();
}

class _AdminPaymentsSectionState extends State<AdminPaymentsSection> {
  bool _loading = true;
  List<Map<String, dynamic>> _payments = [];
  String _filter = 'pending'; // pending | approved | rejected | all

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final auth = context.read<AuthService>();
    setState(() => _loading = true);
    try {
      final res = await auth.api.adminPayments(auth.token!);
      if (!mounted) return;
      setState(() {
        _payments = (res['payments'] as List? ?? [])
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _validate(String id, String action) async {
    final auth = context.read<AuthService>();
    final res = await auth.api.adminValidatePayment(
      auth.token!,
      paymentId: id,
      action: action,
    );
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(res['success'] == true
          ? (action == 'approve'
              ? '✅ Paiement approuvé'
              : '✅ Paiement rejeté')
          : '⚠️ ${res['error'] ?? "Erreur"}'),
    ));
    _load();
  }

  List<Map<String, dynamic>> get _filtered {
    if (_filter == 'all') return _payments;
    return _payments.where((p) => (p['status'] ?? 'pending') == _filter).toList();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    return Column(
      children: [
        _buildFilterBar(),
        Expanded(
          child: _filtered.isEmpty
              ? const Center(child: Text('Aucun paiement'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _filtered.length,
                    itemBuilder: (context, i) => _paymentCard(_filtered[i]),
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildFilterBar() {
    return Padding(
      padding: const EdgeInsets.all(8),
      child: Wrap(
        spacing: 6,
        children: [
          _chip('En attente', 'pending'),
          _chip('Approuvés', 'approved'),
          _chip('Rejetés', 'rejected'),
          _chip('Tous', 'all'),
        ],
      ),
    );
  }

  Widget _chip(String label, String value) {
    final active = _filter == value;
    return ChoiceChip(
      label: Text(label),
      selected: active,
      onSelected: (_) => setState(() => _filter = value),
      selectedColor: AppColors.primary,
      labelStyle: TextStyle(
        color: active ? Colors.white : AppColors.darkTerracotta,
        fontWeight: FontWeight.w700,
      ),
    );
  }

  Widget _paymentCard(Map<String, dynamic> p) {
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
                  label: Text(status, style: const TextStyle(fontSize: 10)),
                  backgroundColor: status == 'approved'
                      ? const Color(0xFFD1FAE5)
                      : status == 'rejected'
                          ? const Color(0xFFFEE2E2)
                          : const Color(0xFFFFF3CD),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text('📞 ${p['user_phone'] ?? p['numero_paiement'] ?? ""}',
                style:
                    const TextStyle(color: Color(0xFF6B7280), fontSize: 12)),
            const SizedBox(height: 4),
            Text(
                '${p['type_concours'] ?? ""} • ${p['montant'] ?? ""} FCFA${p['dossier_principal'] != null ? " • ${p['dossier_principal']}" : ""}',
                style:
                    const TextStyle(color: Color(0xFF6B7280), fontSize: 12)),
            if ((p['notes'] ?? '').toString().isNotEmpty) ...[
              const SizedBox(height: 4),
              Text('📝 ${p['notes']}',
                  style: const TextStyle(
                      color: Color(0xFF6B7280),
                      fontSize: 11,
                      fontStyle: FontStyle.italic)),
            ],
            if (status == 'pending') ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () =>
                          _validate(p['id'].toString(), 'reject'),
                      icon: const Icon(Icons.close, size: 16),
                      label: const Text('Rejeter'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFFDC2626),
                        side:
                            const BorderSide(color: Color(0xFFDC2626)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () =>
                          _validate(p['id'].toString(), 'approve'),
                      icon: const Icon(Icons.check, size: 16),
                      label: const Text('Approuver'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFC4521A),
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
  }
}
