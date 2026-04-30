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
      final res = await auth.api.adminPayments(auth.token!);
      if (!mounted) return;
      setState(() {
        _payments = (res['payments'] as List? ?? [])
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

  /// Détermine le status d'un paiement à partir de l'API (valide=true/false/null)
  String _statusOf(Map<String, dynamic> p) {
    if (p['valide'] == true) return 'approved';
    if (p['valide'] == false && (p['admin_notes'] ?? '').toString().toLowerCase().contains('rejet')) {
      return 'rejected';
    }
    if (p['valide'] == false) return 'rejected';
    return 'pending';
  }

  Future<void> _validate(Map<String, dynamic> payment, bool valide) async {
    final auth = context.read<AuthService>();
    try {
      // Utilise PUT /api/admin/payments avec { id, valide, user_id, type_concours, dossier_principal }
      final res = await auth.api.adminValidatePaymentPut(
        auth.token!,
        id: payment['id'].toString(),
        valide: valide,
        userId: payment['user_id']?.toString(),
        typeConcours: payment['type_concours']?.toString(),
        dossierPrincipal: payment['dossier_principal']?.toString(),
      );
      if (!mounted) return;
      if (res['success'] == true || res['message'] != null) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(res['message']?.toString() ??
              (valide ? '✅ Paiement validé' : '❌ Paiement rejeté')),
          backgroundColor: valide ? Colors.green : Colors.orange,
        ));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('⚠️ ${res['error'] ?? "Erreur inconnue"}'),
          backgroundColor: Colors.red,
        ));
      }
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur : $e'), backgroundColor: Colors.red),
      );
    }
  }

  List<Map<String, dynamic>> get _filtered {
    if (_filter == 'all') return _payments;
    return _payments.where((p) => _statusOf(p) == _filter).toList();
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
    return Column(
      children: [
        _buildFilterBar(),
        Expanded(
          child: _filtered.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.inbox_outlined,
                          size: 64, color: Colors.black26),
                      const SizedBox(height: 8),
                      Text('Aucun paiement ${_labelOfFilter()}',
                          style: const TextStyle(color: Colors.black54)),
                    ],
                  ),
                )
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

  String _labelOfFilter() {
    switch (_filter) {
      case 'pending':
        return 'en attente';
      case 'approved':
        return 'approuvé';
      case 'rejected':
        return 'rejeté';
      default:
        return '';
    }
  }

  Widget _buildFilterBar() {
    return Padding(
      padding: const EdgeInsets.all(8),
      child: Wrap(
        spacing: 6,
        children: [
          _chip('En attente (${_payments.where((p) => _statusOf(p) == "pending").length})',
              'pending'),
          _chip('Approuvés (${_payments.where((p) => _statusOf(p) == "approved").length})',
              'approved'),
          _chip('Rejetés (${_payments.where((p) => _statusOf(p) == "rejected").length})',
              'rejected'),
          _chip('Tous (${_payments.length})', 'all'),
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
    final status = _statusOf(p);
    final montant = p['montant'] ?? 0;
    final typeConcours = p['type_concours']?.toString() ?? '';
    final dossier = p['dossier_principal']?.toString();
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
                    (p['full_name']?.toString().isNotEmpty ?? false)
                        ? p['full_name'].toString()
                        : (p['nom']?.toString() ?? p['user_id']?.toString() ?? '—'),
                    style: const TextStyle(
                        fontWeight: FontWeight.w800, fontSize: 14),
                  ),
                ),
                Chip(
                  label: Text(
                    status == 'approved'
                        ? 'Approuvé'
                        : status == 'rejected'
                            ? 'Rejeté'
                            : 'En attente',
                    style: const TextStyle(fontSize: 10),
                  ),
                  backgroundColor: status == 'approved'
                      ? const Color(0xFFD1FAE5)
                      : status == 'rejected'
                          ? const Color(0xFFFEE2E2)
                          : const Color(0xFFFFF3CD),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text('📞 ${p['phone'] ?? p['numero_paiement'] ?? "—"}',
                style: const TextStyle(color: Color(0xFF6B7280), fontSize: 12)),
            const SizedBox(height: 4),
            Text(
                '${typeConcours.isNotEmpty ? (typeConcours == "direct" ? "🎓 Direct" : "💼 Pro") : "—"} • $montant FCFA${dossier != null ? " • 📂 $dossier" : ""}',
                style: const TextStyle(
                    color: Color(0xFF374151),
                    fontSize: 12,
                    fontWeight: FontWeight.w600)),
            if ((p['numero_paiement'] ?? '').toString().isNotEmpty) ...[
              const SizedBox(height: 4),
              Text('📱 Numéro payeur : ${p['numero_paiement']}',
                  style: const TextStyle(fontSize: 12)),
            ],
            if ((p['notes'] ?? '').toString().isNotEmpty) ...[
              const SizedBox(height: 4),
              Text('📝 ${p['notes']}',
                  style: const TextStyle(
                      color: Color(0xFF6B7280),
                      fontSize: 11,
                      fontStyle: FontStyle.italic)),
            ],
            if ((p['date_demande'] ?? '').toString().isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                  '🕒 Demandé le : ${_formatDate(p['date_demande'].toString())}',
                  style:
                      const TextStyle(fontSize: 11, color: Colors.black54)),
            ],
            if (status == 'pending') ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _validate(p, false),
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
                      onPressed: () => _validate(p, true),
                      icon: const Icon(Icons.check, size: 16),
                      label: const Text('Valider'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF16A34A),
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ],
            if (status == 'approved' && (p['admin_notes'] ?? '').toString().isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text('ℹ️ ${p['admin_notes']}',
                    style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFF059669),
                        fontWeight: FontWeight.w600)),
              ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String iso) {
    try {
      final d = DateTime.parse(iso).toLocal();
      return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year} ${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return iso;
    }
  }
}
