import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/auth_service.dart';

/// Bannière des sessions spéciales — v3.0.7 ENHANCED
/// Affiche les offres à durée limitée avec compte à rebours animé
/// [filterType] : 'direct', 'professionnel', ou null (affiche tout)
class SpecialSessionsBanner extends StatefulWidget {
  final String? filterType;
  const SpecialSessionsBanner({super.key, this.filterType});

  @override
  State<SpecialSessionsBanner> createState() => _SpecialSessionsBannerState();
}

class _SpecialSessionsBannerState extends State<SpecialSessionsBanner>
    with TickerProviderStateMixin {
  List<Map<String, dynamic>> _sessions = [];
  bool _loading = true;
  Timer? _countdownTimer;

  // Animation pulse pour le badge OFFRE SPÉCIALE
  late AnimationController _pulseCtrl;
  late Animation<double> _pulse;

  // Animation shake pour l'icône
  late AnimationController _shakeCtrl;
  late Animation<double> _shake;

  // Animation fade-in
  late AnimationController _fadeCtrl;
  late Animation<double> _fade;

  // Animation bounce pour le bouton CTA
  late AnimationController _bounceCtrl;
  late Animation<double> _bounce;

  @override
  void initState() {
    super.initState();

    // Pulse : le badge OFFRE SPÉCIALE grandit/rétrécit
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
    _pulse = Tween<double>(begin: 1.0, end: 1.08).animate(
      CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut),
    );

    // Shake : l'icône tremble pour attirer l'attention
    _shakeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    )..repeat(reverse: false);
    _shake = Tween<double>(begin: -3.0, end: 3.0).animate(
      CurvedAnimation(parent: _shakeCtrl, curve: Curves.elasticIn),
    );

    // Bounce pour le bouton
    _bounceCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    _bounce = Tween<double>(begin: 1.0, end: 1.05).animate(
      CurvedAnimation(parent: _bounceCtrl, curve: Curves.bounceInOut),
    );

    // Fade-in au chargement
    _fadeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOut),
    );

    // Faire trembler l'icône périodiquement (toutes les 3 secondes)
    _startPeriodicShake();

    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  void _startPeriodicShake() {
    Timer.periodic(const Duration(seconds: 3), (_) {
      if (mounted && _sessions.isNotEmpty) {
        _shakeCtrl.forward(from: 0).then((_) {
          if (mounted) _shakeCtrl.reverse();
        });
      }
    });
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _pulseCtrl.dispose();
    _shakeCtrl.dispose();
    _fadeCtrl.dispose();
    _bounceCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final auth = context.read<AuthService>();
      // Récupérer les sessions actives depuis l'API (avec token si connecté)
      final res = await auth.api.publicSpecialSessions(auth.token);
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

      if (sessions.isNotEmpty) {
        _fadeCtrl.forward();
        // Démarrer le compte à rebours
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
    final ss = s.toString().padLeft(2, '0');
    final mm = m.toString().padLeft(2, '0');
    final hh = h.toString().padLeft(2, '0');
    if (d > 0) return '${d}j ${hh}h ${mm}m';
    return '${hh}h ${mm}m ${ss}s';
  }

  String _formatPrice(int prix) {
    if (prix == 0) return 'GRATUIT';
    return '${prix.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]} ')} FCFA';
  }

  @override
  Widget build(BuildContext context) {
    if (_loading || _sessions.isEmpty) return const SizedBox.shrink();

    return FadeTransition(
      opacity: _fade,
      child: Column(
        children: _sessions.map((session) => _buildBanner(session)).toList(),
      ),
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
    final originalPrix = isDirect ? 5000 : 20000;

    final gradientColors = isDirect
        ? [const Color(0xFFB8441A), const Color(0xFFD4A017), const Color(0xFFE8C547)]
        : [const Color(0xFF0369A1), const Color(0xFF0284C7), const Color(0xFF0EA5E9)];

    final accentColor = isDirect ? const Color(0xFFD4A017) : const Color(0xFF38BDF8);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: gradientColors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: (isDirect ? const Color(0xFFC4521A) : const Color(0xFF0369A1))
                .withValues(alpha: 0.45),
            blurRadius: 20,
            offset: const Offset(0, 8),
            spreadRadius: 2,
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Stack(
          children: [
            // Décoration de fond (cercles)
            Positioned(
              right: -20,
              top: -20,
              child: Opacity(
                opacity: 0.12,
                child: Container(
                  width: 120,
                  height: 120,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            Positioned(
              left: -10,
              bottom: -15,
              child: Opacity(
                opacity: 0.08,
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            // Contenu principal
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Ligne 1 : Badge OFFRE SPÉCIALE + icône animée + compte à rebours
                  Row(
                    children: [
                      // Badge OFFRE SPÉCIALE avec animation pulse
                      ScaleTransition(
                        scale: _pulse,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFD700),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFFFFD700).withValues(alpha: 0.5),
                                blurRadius: 8,
                                spreadRadius: 1,
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Text('⭐', style: TextStyle(fontSize: 10)),
                              const SizedBox(width: 3),
                              const Text(
                                'OFFRE SPÉCIALE',
                                style: TextStyle(
                                  color: Color(0xFF78350F),
                                  fontWeight: FontWeight.w900,
                                  fontSize: 9,
                                  letterSpacing: 0.8,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      // Icône type session
                      _AnimatedTypeIcon(isDirect: isDirect, shake: _shake),
                      const Spacer(),
                      // Compte à rebours en temps réel
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.25),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.3),
                            width: 1,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.timer_rounded, color: Colors.white70, size: 11),
                            const SizedBox(width: 3),
                            Text(
                              countdown,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w900,
                                fontSize: 11,
                                fontFamily: 'monospace',
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  // Badge type
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      isDirect ? '📚 CONCOURS DIRECTS' : '🎓 CONCOURS PRO',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 9,
                        letterSpacing: 0.6,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  // Titre
                  Text(
                    label,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 17,
                      height: 1.2,
                    ),
                  ),
                  if (description.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      description,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.85),
                        fontSize: 12,
                        height: 1.4,
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  // Ligne prix + durée + CTA
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      // Prix
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Prix barré
                          Text(
                            '$originalPrix FCFA',
                            style: const TextStyle(
                              decoration: TextDecoration.lineThrough,
                              color: Colors.white54,
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          // Prix promo en gros
                          Text(
                            _formatPrice(prix),
                            style: TextStyle(
                              color: accentColor,
                              fontWeight: FontWeight.w900,
                              fontSize: 22,
                              height: 1.1,
                              shadows: [
                                Shadow(
                                  color: Colors.black.withValues(alpha: 0.3),
                                  blurRadius: 4,
                                  offset: const Offset(1, 1),
                                ),
                              ],
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
                      // Bouton CTA avec animation bounce
                      ScaleTransition(
                        scale: _bounce,
                        child: ElevatedButton(
                          onPressed: () => _onSessionTap(session),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: isDirect
                                ? const Color(0xFFC4521A)
                                : const Color(0xFF0369A1),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                            elevation: 4,
                            textStyle: const TextStyle(
                              fontWeight: FontWeight.w900,
                              fontSize: 13,
                            ),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text('Profiter'),
                              SizedBox(width: 4),
                              Icon(Icons.arrow_forward_rounded, size: 14),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _onSessionTap(Map<String, dynamic> session) async {
    final auth = context.read<AuthService>();
    if (!auth.isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Veuillez vous connecter pour profiter de cette offre'),
          backgroundColor: Color(0xFFC4521A),
        ),
      );
      return;
    }

    final isDirect = session['type'] == 'direct';
    final prix = session['prix'] as int? ?? 0;
    final originalPrix = isDirect ? 5000 : 20000;

    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        insetPadding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // En-tête
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isDirect
                      ? [const Color(0xFFB8441A), const Color(0xFFD4A017)]
                      : [const Color(0xFF0369A1), const Color(0xFF0EA5E9)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                children: [
                  const Text('🎉', style: TextStyle(fontSize: 48)),
                  const SizedBox(height: 8),
                  Text(
                    session['label']?.toString() ?? 'Offre spéciale',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 18,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      isDirect ? '📚 Concours Directs' : '🎓 Concours Pro',
                      style: const TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
            // Corps
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (session['description'] != null) ...[
                    Text(
                      session['description'].toString(),
                      style: const TextStyle(fontSize: 14, color: Color(0xFF4B5563), height: 1.5),
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
                        _infoRow(Icons.timer_outlined, 'Durée', '${session['duration_days']} jour(s)'),
                        if (session['dossier_nom'] != null)
                          _infoRow(Icons.folder_outlined, 'Dossier', session['dossier_nom']),
                        const Divider(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Prix promotionnel',
                                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '$originalPrix FCFA',
                                  style: const TextStyle(
                                    decoration: TextDecoration.lineThrough,
                                    color: Colors.grey,
                                    fontSize: 11,
                                  ),
                                ),
                                Text(
                                  '$prix FCFA',
                                  style: TextStyle(
                                    color: isDirect ? const Color(0xFFC4521A) : const Color(0xFF0369A1),
                                    fontWeight: FontWeight.w900,
                                    fontSize: 22,
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
                        elevation: 4,
                      ),
                      onPressed: () async {
                        Navigator.pop(ctx);
                        _processPurchase(session['id'].toString());
                      },
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text('🎉', style: TextStyle(fontSize: 16)),
                          SizedBox(width: 8),
                          Text(
                            'PROFITER DE L\'OFFRE',
                            style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
                          ),
                        ],
                      ),
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
      builder: (ctx) => const Center(
        child: Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(16))),
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 16),
                Text('Traitement en cours...', style: TextStyle(fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ),
      ),
    );

    try {
      final res = await auth.api.purchaseSession(auth.token!, sessionId);
      if (!mounted) return;
      Navigator.pop(context);

      if (res['success'] == true) {
        await auth.refreshUser();
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                Text('🎉 ', style: TextStyle(fontSize: 20)),
                Text('Offre activée avec succès ! Profitez bien.'),
              ],
            ),
            backgroundColor: Color(0xFF16A34A),
            duration: Duration(seconds: 4),
          ),
        );
        _load();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res['error'] ?? 'Une erreur est survenue'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Erreur réseau. Vérifiez votre connexion.'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}

/// Widget d'icône animée représentant le type de session
class _AnimatedTypeIcon extends StatelessWidget {
  final bool isDirect;
  final Animation<double> shake;

  const _AnimatedTypeIcon({required this.isDirect, required this.shake});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: shake,
      builder: (_, child) {
        return Transform.translate(
          offset: Offset(shake.value, 0),
          child: Transform.rotate(
            angle: shake.value * math.pi / 180 * 5,
            child: child,
          ),
        );
      },
      child: Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.2),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Center(
          child: Text(
            isDirect ? '📚' : '🎓',
            style: const TextStyle(fontSize: 14),
          ),
        ),
      ),
    );
  }
}
