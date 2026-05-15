import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';

/// Section "Paiements" — validation Direct / Pro avec UX améliorée :
/// - Type de demande (Direct / Pro) clairement affiché en bandeau coloré
/// - Boutons Valider / Rejeter bien visibles avec confirmation
/// - Conséquence de la validation expliquée explicitement
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
  // Loader par paiement (évite les doubles clics)
  final Set<String> _processing = {};
  // 🔧 FIX #4 : Polling automatique des nouvelles demandes
  Timer? _autoRefreshTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _load();
      // Auto-refresh toutes les 10 secondes (admin)
      _autoRefreshTimer = Timer.periodic(const Duration(seconds: 10), (_) {
        if (mounted && !_loading && _processing.isEmpty) _load(silent: true);
      });
    });
  }

  @override
  void dispose() {
    _autoRefreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    final auth = context.read<AuthService>();
    if (!silent) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
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
      if (!silent) {
        setState(() {
          _loading = false;
          _error = e.toString();
        });
      }
    }
  }

  /// Détermine le status d'un paiement.
  String _statusOf(Map<String, dynamic> p) {
    final s = (p['status'] ?? '').toString().toLowerCase();
    if (s == 'pending' || s == 'approved' || s == 'rejected') return s;
    if (p['valide'] == true) return 'approved';
    final notes =
        (p['admin_notes'] ?? p['admin_response'] ?? '').toString().toLowerCase();
    if (p['valide'] == false && notes.contains('rejet')) return 'rejected';
    if (p['valide'] == false && notes.contains('valid')) return 'approved';
    return 'pending';
  }

  bool _isDirect(Map<String, dynamic> p) =>
      (p['type_concours'] ?? '').toString().toLowerCase() == 'direct';

  Future<void> _confirmAndValidate(
      Map<String, dynamic> payment, bool valide) async {
    final isDirect = _isDirect(payment);
    final dossier = payment['dossier_principal']?.toString();
    final user = (payment['full_name']?.toString().isNotEmpty ?? false)
        ? payment['full_name'].toString()
        : (payment['nom']?.toString() ?? payment['user_id']?.toString() ?? '—');

    final consequence = valide
        ? (isDirect
            ? '✅ L\'utilisateur va débloquer les 12 DOSSIERS DIRECTS.'
            : '✅ L\'utilisateur va débloquer le dossier "${dossier ?? "—"}" + les 3 BONUS (Entraînement, Actualités, Accompagnement).')
        : '❌ L\'utilisateur restera en mode gratuit (5 premières questions par dossier).';

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            Icon(
              valide ? Icons.check_circle : Icons.cancel,
              color: valide ? Colors.green : Colors.red,
            ),
            const SizedBox(width: 8),
            Text(valide ? 'Valider la demande ?' : 'Rejeter la demande ?'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Utilisateur : $user',
                style: const TextStyle(fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            Text(
              isDirect
                  ? '🎓 Type : DIRECT (5 000 FCFA)'
                  : '💼 Type : PROFESSIONNEL (20 000 FCFA)',
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            if (!isDirect && dossier != null) ...[
              const SizedBox(height: 4),
              Text('📂 Dossier : $dossier',
                  style: const TextStyle(fontSize: 13)),
            ],
            const Divider(height: 18),
            Text(
              consequence,
              style: TextStyle(
                color: valide ? Colors.green.shade800 : Colors.red.shade800,
                fontWeight: FontWeight.w700,
                fontSize: 13,
                height: 1.4,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Annuler')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: valide
                  ? const Color(0xFF16A34A)
                  : const Color(0xFFDC2626),
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(valide ? 'Oui, valider' : 'Oui, rejeter'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    await _validate(payment, valide);
  }

  Future<void> _validate(Map<String, dynamic> payment, bool valide) async {
    final auth = context.read<AuthService>();
    final pid = payment['id'].toString();
    setState(() => _processing.add(pid));
    try {
      final res = await auth.api.adminValidatePaymentPut(
        auth.token!,
        id: pid,
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
          behavior: SnackBarBehavior.floating,
        ));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('⚠️ ${res['error'] ?? "Erreur inconnue"}'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ));
      }
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur : $e'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _processing.remove(pid));
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
    final pendingCount =
        _payments.where((p) => _statusOf(p) == 'pending').length;
    return Container(
      padding: const EdgeInsets.all(8),
      color: Colors.white,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _chip('🟡 En attente ($pendingCount)', 'pending'),
            const SizedBox(width: 6),
            _chip(
                '✅ Approuvés (${_payments.where((p) => _statusOf(p) == "approved").length})',
                'approved'),
            const SizedBox(width: 6),
            _chip(
                '❌ Rejetés (${_payments.where((p) => _statusOf(p) == "rejected").length})',
                'rejected'),
            const SizedBox(width: 6),
            _chip('Tous (${_payments.length})', 'all'),
          ],
        ),
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
    final isDirect = _isDirect(p);
    final dossier = p['dossier_principal']?.toString();
    final pid = p['id'].toString();
    final processing = _processing.contains(pid);

    // Couleur du bandeau type
    final typeBg = isDirect ? const Color(0xFFDBEAFE) : const Color(0xFFFCE7F3);
    final typeFg = isDirect ? const Color(0xFF1E40AF) : const Color(0xFF9D174D);
    final typeLabel = isDirect
        ? '🎓 DIRECT — débloquera les 12 dossiers directs'
        : '💼 PRO — débloquera ${dossier ?? "le dossier choisi"} + 3 bonus';

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      elevation: status == 'pending' ? 3 : 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: status == 'pending'
            ? const BorderSide(color: Color(0xFFF59E0B), width: 2)
            : BorderSide.none,
      ),
      child: Column(
        children: [
          // Bandeau type Direct/Pro très visible
          Container(
            width: double.infinity,
            padding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: typeBg,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: Text(
              typeLabel,
              style: TextStyle(
                color: typeFg,
                fontWeight: FontWeight.w900,
                fontSize: 12,
              ),
            ),
          ),
          Padding(
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
                            : (p['nom']?.toString() ??
                                p['user_id']?.toString() ??
                                '—'),
                        style: const TextStyle(
                            fontWeight: FontWeight.w800, fontSize: 14),
                      ),
                    ),
                    _statusBadge(status),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.phone, size: 14, color: Color(0xFF6B7280)),
                    const SizedBox(width: 4),
                    Text(
                      '${p['phone'] ?? p['numero_paiement'] ?? "—"}',
                      style: const TextStyle(
                          color: Color(0xFF6B7280), fontSize: 12),
                    ),
                    const SizedBox(width: 10),
                    const Icon(Icons.payments_rounded,
                        size: 14, color: Color(0xFF374151)),
                    const SizedBox(width: 4),
                    Text(
                      '$montant FCFA',
                      style: const TextStyle(
                          color: Color(0xFF374151),
                          fontSize: 12,
                          fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
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
                      style: const TextStyle(
                          fontSize: 11, color: Colors.black54)),
                ],
                if (status == 'pending') ...[
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: processing
                              ? null
                              : () => _confirmAndValidate(p, false),
                          icon: const Icon(Icons.close, size: 18),
                          label: const Text('REJETER'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFFDC2626),
                            side: const BorderSide(
                                color: Color(0xFFDC2626), width: 2),
                            padding:
                                const EdgeInsets.symmetric(vertical: 12),
                            textStyle: const TextStyle(
                                fontWeight: FontWeight.w900, fontSize: 13),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        flex: 2,
                        child: ElevatedButton.icon(
                          onPressed: processing
                              ? null
                              : () => _confirmAndValidate(p, true),
                          icon: processing
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2, color: Colors.white),
                                )
                              : const Icon(Icons.check, size: 18),
                          label: Text(
                              processing ? 'En cours...' : '✓ VALIDER'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF16A34A),
                            foregroundColor: Colors.white,
                            padding:
                                const EdgeInsets.symmetric(vertical: 12),
                            textStyle: const TextStyle(
                                fontWeight: FontWeight.w900, fontSize: 14),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
                if (status == 'approved' &&
                    (p['admin_notes'] ?? '').toString().isNotEmpty)
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
        ],
      ),
    );
  }

  Widget _statusBadge(String status) {
    Color bg;
    Color fg;
    String label;
    switch (status) {
      case 'approved':
        bg = const Color(0xFFD1FAE5);
        fg = const Color(0xFF065F46);
        label = '✓ Approuvé';
        break;
      case 'rejected':
        bg = const Color(0xFFFEE2E2);
        fg = const Color(0xFF991B1B);
        label = '✗ Rejeté';
        break;
      default:
        bg = const Color(0xFFFEF3C7);
        fg = const Color(0xFF92400E);
        label = '⏳ En attente';
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: fg,
          fontSize: 11,
          fontWeight: FontWeight.w900,
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
