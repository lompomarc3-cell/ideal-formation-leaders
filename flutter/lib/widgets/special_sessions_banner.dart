import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/auth_service.dart';
import '../theme/app_theme.dart';

/// Bannière des sessions spéciales — v3.0.6
/// Affiche les offres à durée limitée avec compte à rebours
class SpecialSessionsBanner extends StatefulWidget {
  const SpecialSessionsBanner({super.key});

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
            if (s['is_active'] != true) return false;
            final endDate = DateTime.tryParse(s['end_date']?.toString() ?? '');
            if (endDate == null) return false;
            return endDate.isAfter(DateTime.now());
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

  void _onSessionTap(Map<String, dynamic> session) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.bolt_rounded, color: Color(0xFFC4521A)),
            const SizedBox(width: 8),
            Expanded(child: Text(session['label']?.toString() ?? 'Offre spéciale')),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(session['description']?.toString() ?? ''),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF8F0),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFFD0A0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('💰 Prix : ${session['prix']} FCFA',
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                  Text('📅 Durée : ${session['duration_days']} jours',
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                  if (session['dossier_nom'] != null)
                    Text('📂 Dossier : ${session['dossier_nom']}',
                        style: const TextStyle(fontWeight: FontWeight.w700)),
                ],
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Pour souscrire, contactez-nous via WhatsApp.',
              style: TextStyle(color: Color(0xFF6B7280), fontSize: 12),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Fermer'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.whatsapp,
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              Navigator.pop(ctx);
              // Ouvrir WhatsApp
            },
            child: const Text('WhatsApp'),
          ),
        ],
      ),
    );
  }
}
