import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/auth_service.dart';
import '../theme/app_theme.dart';

/// Bannière des sessions spéciales — v3.0.7
/// Affiche les offres à durée limitée avec compte à rebours
/// [filterType] : 'direct', 'professionnel', ou null (affiche tout)
class SpecialSessionsBanner extends StatefulWidget {
  final String? filterType;
  const SpecialSessionsBanner({super.key, this.filterType});

  @override
  State<SpecialSessionsBanner> createState() => _SpecialSessionsBannerState();
}

class _SpecialSessionsBannerState extends State<SpecialSessionsBanner>
    with SingleTickerProviderStateMixin {
  List<Map<String, dynamic>> _sessions = [];
  bool _loading = true;
  Timer? _countdownTimer;
  late AnimationController _pulseCtrl;
  late Animation<double> _pulse;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _pulse = Tween<double>(begin: 1.0, end: 1.06).animate(
      CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut),
    );
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _pulseCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final auth = context.read<AuthService>();
      // Récupérer les sessions actives depuis l'API
      final res = await auth.api.publicSpecialSessions();
      if (!mounted) return;
      final sessions = (res['sessions'] as List? ?? [])
          .map((e) => Map<String, dynamic>.from(e))
          .where((s) {
            // Filtrer sessions actives et non expirées
            final endDate = DateTime.tryParse(s['end_date']?.toString() ?? '');
            if (endDate == null) return false;
            if (!endDate.isAfter(DateTime.now())) return false;
            // Filtre optionnel par type
            final ft = widget.filterType;
            if (ft != null && s['type']?.toString() != ft) return false;
            return true;
          })
          .toList();

      setState(() {
        _sessions = sessions;
        _loading = false;
      });

      // Démarrer le compte à rebours si des sessions actives
      if (sessions.isNotEmpty) {
        _countdownTimer = Timer.periodic(const Duration(seconds: 1), (_) {
          if (mounted) setState(() {});
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _countdown(String? endDateStr) {
    if (endDateStr == null) return '';
    final end = DateTime.tryParse(endDateStr);
    if (end == null) return '';
    final diff = end.difference(DateTime.now());
    if (diff.isNegative) return 'Expiré';
    final d = diff.inDays;
    final h = diff.inHours % 24;
    final m = diff.inMinutes % 60;
    final s = diff.inSeconds % 60;
    if (d > 0) return '${d}j ${h}h ${m}m';
    if (h > 0) return '${h}h ${m}m ${s}s';
    return '${m}m ${s}s';
  }

  @override
  Widget build(BuildContext context) {
    if (_loading || _sessions.isEmpty) return const SizedBox.shrink();

    return Column(
      children: _sessions.map((session) => _buildBanner(session)).toList(),
    );
  }

  Widget _buildBanner(Map<String, dynamic> session) {
    final isDirect = session['type'] == 'direct';
    final label = session['label']?.toString() ?? 'Offre spéciale';
    final description = session['description']?.toString() ?? '';
    final prix = session['prix'] as int? ?? 0;
    final duree = session['duration_days'] as int? ?? 1;
    final endDate = session['end_date']?.toString();
    final countdown = _countdown(endDate);

    final gradient = isDirect
        ? const [Color(0xFFC4521A), Color(0xFFD4A017)]
        : const [Color(0xFF0369A1), Color(0xFF0EA5E9)];

    return ScaleTransition(
      scale: _pulse,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: gradient),
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: (isDirect ? const Color(0xFFC4521A) : const Color(0xFF0369A1))
                  .withValues(alpha: 0.4),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Badge + label
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.25),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.bolt_rounded, color: Colors.white, size: 14),
                        const SizedBox(width: 4),
                        Text(
                          isDirect ? 'SESSION DIRECTE' : 'SESSION PRO',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 10,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  // Compte à rebours
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.25),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.timer_rounded, color: Colors.white70, size: 12),
                        const SizedBox(width: 4),
                        Text(
                          countdown,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              // Titre
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 16,
                ),
              ),
              if (description.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  description,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                    height: 1.4,
                  ),
                ),
              ],
              const SizedBox(height: 12),
              // Prix + durée + CTA
              Row(
                children: [
                  // Prix
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        prix == 0 ? 'GRATUIT' : '${prix.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]} ')} FCFA',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 20,
                        ),
                      ),
                      Text(
                        'pour $duree jour${duree > 1 ? "s" : ""}',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  // Bouton CTA
                  ElevatedButton(
                    onPressed: () => _onSessionTap(session),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: isDirect
                          ? const Color(0xFFC4521A)
                          : const Color(0xFF0369A1),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 10),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      textStyle: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 13,
                      ),
                    ),
                    child: const Text('Profiter'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _onSessionTap(Map<String, dynamic> session) async {
    final auth = context.read<AuthService>();
    if (!auth.isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez vous connecter pour profiter de cette offre')),
      );
      return;
    }

    final isDirect = session['type'] == 'direct';
    final prix = session['prix'] as int? ?? 0;
    final originalPrix = isDirect ? 5000 : 20000;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        contentPadding: EdgeInsets.zero,
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isDirect
                      ? [const Color(0xFFC4521A), const Color(0xFFD4A017)]
                      : [const Color(0xFF0369A1), const Color(0xFF0EA5E9)],
                ),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                children: [
                  const Icon(Icons.bolt_rounded, color: Colors.white, size: 48),
                  const SizedBox(height: 12),
                  Text(
                    session['label']?.toString() ?? 'Offre spéciale',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 18,
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (session['description'] != null) ...[
                    Text(
                      session['description'].toString(),
                      style: const TextStyle(fontSize: 14, color: Color(0xFF4B5563)),
                    ),
                    const SizedBox(height: 16),
                  ],
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF9FAFB),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                    ),
                    child: Column(
                      children: [
                        _infoRow(Icons.timer_outlined, 'Durée', '${session['duration_days']} jours'),
                        if (session['dossier_nom'] != null)
                          _infoRow(Icons.folder_outlined, 'Dossier', session['dossier_nom']),
                        const Divider(height: 24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Prix promo', style: TextStyle(fontWeight: FontWeight.w600)),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '$originalPrix FCFA',
                                  style: const TextStyle(
                                    decoration: TextDecoration.lineThrough,
                                    color: Colors.grey,
                                    fontSize: 12,
                                  ),
                                ),
                                Text(
                                  '$prix FCFA',
                                  style: TextStyle(
                                    color: isDirect ? const Color(0xFFC4521A) : const Color(0xFF0369A1),
                                    fontWeight: FontWeight.w900,
                                    fontSize: 20,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isDirect ? const Color(0xFFC4521A) : const Color(0xFF0369A1),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      onPressed: () async {
                        Navigator.pop(ctx);
                        _processPurchase(session['id'].toString());
                      },
                      child: const Text('PROFITER DE L\'OFFRE', style: TextStyle(fontWeight: FontWeight.w900)),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Center(
                    child: TextButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('Plus tard', style: TextStyle(color: Colors.grey)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.grey),
          const SizedBox(width: 8),
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
          const Spacer(),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
        ],
      ),
    );
  }

  Future<void> _processPurchase(String sessionId) async {
    final auth = context.read<AuthService>();
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final res = await auth.api.purchaseSession(auth.token!, sessionId);
      if (!mounted) return;
      Navigator.pop(context); // Close loading

      if (res['success'] == true) {
        await auth.refreshUser();
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('🎉 Offre activée avec succès ! Profitez bien.'),
            backgroundColor: Colors.green,
          ),
        );
        _load(); // Reload sessions
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res['error'] ?? 'Une erreur est survenue')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Erreur réseau')),
      );
    }
  }
}
