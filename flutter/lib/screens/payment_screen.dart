import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/auth_service.dart';
import '../services/price_service.dart';
import '../theme/app_theme.dart';

const String kOrangeMoneyNumber = '76223962';
const String kWhatsAppNumber = '22676223962';
const String kUssdCode = '*144*10*76223962#';
const String kUssdTelUri = 'tel:*144*10*76223962%23';
const String kSupportPhone = '+22676223962';

/// Écran de paiement Orange Money — Guide en 3 étapes.
/// AMÉLIORATIONS UX :
/// - Choix Direct/Pro très visuel avec carte explicative (avantages détaillés)
/// - Pour Pro : sélection du dossier directement intégrée et claire
/// - Récapitulatif clair de ce que l'utilisateur va débloquer
class PaymentScreen extends StatefulWidget {
  const PaymentScreen({super.key});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  String _typeConcours = 'direct'; // direct | professionnel
  String? _dossierPrincipal;
  bool _submitting = false;
  String? _message;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final args = ModalRoute.of(context)?.settings.arguments;
      if (args is Map) {
        if (args['type'] != null) {
          setState(() => _typeConcours = args['type'].toString());
        }
        if (args['dossier'] != null) {
          setState(() => _dossierPrincipal = args['dossier'].toString());
        }
      }
      context.read<PriceService>().load();
    });
  }

  /// Prix effectif (avec promo si active) chargé depuis le PriceService.
  int get _amount {
    final ps = context.read<PriceService>();
    return _typeConcours == 'direct' ? ps.directPrixEffectif : ps.proPrixEffectif;
  }

  String _formatPrice(int p) {
    final s = p.toString();
    final buf = StringBuffer();
    for (int i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write(' ');
      buf.write(s[i]);
    }
    return buf.toString();
  }

  Future<void> _openWhatsApp() async {
    final txt = Uri.encodeComponent(
        'Bonjour, je viens de payer ${_formatPrice(_amount)} FCFA sur Orange Money pour IFL '
        '(${_typeConcours == 'direct' ? "Concours directs" : "Concours professionnels"}'
        '${_dossierPrincipal != null ? " - $_dossierPrincipal" : ""}). '
        'Voici la capture d\'écran de confirmation.');
    final uri = Uri.parse('https://wa.me/$kWhatsAppNumber?text=$txt');
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<void> _openUssd() async {
    try {
      final uri = Uri.parse(kUssdTelUri);
      final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!ok) await _copy(kUssdCode, 'Code USSD');
    } catch (_) {
      await _copy(kUssdCode, 'Code USSD');
    }
  }

  Future<void> _copy(String value, String label) async {
    await Clipboard.setData(ClipboardData(text: value));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label copié : $value'),
        backgroundColor: AppColors.darkTerracotta,
      ),
    );
  }

  Future<void> _pickDossier() async {
    final v = await Navigator.of(context).pushNamed('/select-specialty');
    if (v is String && mounted) setState(() => _dossierPrincipal = v);
  }

  Future<void> _submit() async {
    if (_typeConcours == 'professionnel' &&
        (_dossierPrincipal == null || _dossierPrincipal!.isEmpty)) {
      await _pickDossier();
      if (_dossierPrincipal == null) return;
    }
    final auth = context.read<AuthService>();
    if (!auth.isAuthenticated) {
      Navigator.of(context).pushNamed('/login');
      return;
    }
    setState(() {
      _submitting = true;
      _message = null;
    });
    try {
      final res = await auth.api.createPaymentRequest(
        auth.token!,
        typeConcours: _typeConcours,
        dossierPrincipal: _dossierPrincipal,
        montant: _amount,
        numeroPaiement: kOrangeMoneyNumber,
      );
      if (!mounted) return;
      setState(() => _submitting = false);
      if (res['success'] == true || res['payment_id'] != null) {
        setState(() => _message =
            '✅ Demande envoyée ! Notre équipe va valider votre paiement dans un délai de 24h.');
      } else {
        setState(() => _message =
            '⚠️ ${res['error'] ?? "Erreur lors de l'envoi de la demande."}');
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _message = '⚠️ Erreur réseau : ${e.toString().replaceAll('Exception:', '').trim()}. Vérifiez votre connexion.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightBg,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'S\'abonner à IFL',
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildIntroBanner(),
                const SizedBox(height: 12),
                _buildPlanCards(),
                const SizedBox(height: 12),
                if (_typeConcours == 'professionnel') _buildDossierPicker(),
                if (_typeConcours == 'professionnel') const SizedBox(height: 12),
                _buildAmountCard(),
                const SizedBox(height: 18),
                _buildStepHeader(),
                const SizedBox(height: 12),
                _buildStep1(),
                const SizedBox(height: 12),
                _buildStep2(),
                const SizedBox(height: 12),
                _buildStep3(),
                const SizedBox(height: 18),
                if (_message != null) _buildMessage(),
                ElevatedButton.icon(
                  onPressed: _submitting ? null : _submit,
                  icon: _submitting
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.send_rounded),
                  label: Text(
                    _typeConcours == 'professionnel' &&
                            (_dossierPrincipal == null ||
                                _dossierPrincipal!.isEmpty)
                        ? 'Choisir un dossier puis envoyer'
                        : 'Envoyer ma demande de paiement',
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
                const SizedBox(height: 8),
                Center(
                  child: Text(
                    'Notre équipe valide votre paiement sous 24h',
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 11,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildIntroBanner() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7ED),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFFED7AA)),
      ),
      child: Row(
        children: const [
          Icon(Icons.workspace_premium_rounded,
              color: AppColors.darkTerracotta, size: 24),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'Choisissez votre formule ci-dessous, puis suivez les 3 étapes pour payer.',
              style: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 13,
                color: AppColors.darkTerracotta,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlanCards() {
    return Builder(builder: (context) {
      final ps = context.watch<PriceService>();
      return Column(
        children: [
          _planCard(
            value: 'direct',
            title: '🎓 Concours DIRECT',
            subtitle: 'Une seule formule pour tout débloquer',
            price: ps.directPrixEffectif,
            oldPrice: ps.directHasPromo ? ps.directPrix : null,
            hasPromo: ps.directHasPromo,
            color: const Color(0xFF1E40AF),
            bgColor: const Color(0xFFDBEAFE),
            features: const [
              '✅ 12 dossiers directs débloqués d\'un coup',
              '✅ Toutes les questions accessibles',
              '✅ Paiement unique — pas de dossier à choisir',
            ],
          ),
          const SizedBox(height: 10),
          _planCard(
            value: 'professionnel',
            title: '💼 Concours PROFESSIONNEL',
            subtitle: 'Choisissez UN dossier + 3 bonus offerts',
            price: ps.proPrixEffectif,
            oldPrice: ps.proHasPromo ? ps.proPrix : null,
            hasPromo: ps.proHasPromo,
            color: const Color(0xFF9D174D),
            bgColor: const Color(0xFFFCE7F3),
            features: const [
              '✅ 1 dossier au choix parmi 14 dossiers pro',
              '🎁 Bonus 1 : Entraînement QCM',
              '🎁 Bonus 2 : Actualités',
              '🎁 Bonus 3 : Accompagnement final',
            ],
          ),
        ],
      );
    });
  }

  Widget _planCard({
    required String value,
    required String title,
    required String subtitle,
    required int price,
    int? oldPrice,
    bool hasPromo = false,
    required Color color,
    required Color bgColor,
    required List<String> features,
  }) {
    final selected = _typeConcours == value;
    return InkWell(
      onTap: () => setState(() {
        _typeConcours = value;
        if (value == 'direct') _dossierPrincipal = null;
      }),
      borderRadius: BorderRadius.circular(16),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? bgColor : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: selected ? color : const Color(0xFFE5E7EB),
            width: selected ? 2.5 : 1,
          ),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: color.withValues(alpha: 0.20),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    color: selected ? color : Colors.transparent,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: selected ? color : const Color(0xFF9CA3AF),
                      width: 2,
                    ),
                  ),
                  child: selected
                      ? const Icon(Icons.check,
                          color: Colors.white, size: 14)
                      : null,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    title,
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 15,
                      color: color,
                    ),
                  ),
                ),
                if (hasPromo)
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFBBF24),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      'PROMO',
                      style: TextStyle(
                        color: Color(0xFF7C2D12),
                        fontWeight: FontWeight.w900,
                        fontSize: 10,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 4),
            Padding(
              padding: const EdgeInsets.only(left: 32),
              child: Text(
                subtitle,
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFF6B7280),
                ),
              ),
            ),
            const SizedBox(height: 10),
            Padding(
              padding: const EdgeInsets.only(left: 32),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (hasPromo && oldPrice != null) ...[
                    Text(
                      '${_formatPrice(oldPrice)}',
                      style: const TextStyle(
                        color: Color(0xFF9CA3AF),
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        decoration: TextDecoration.lineThrough,
                      ),
                    ),
                    const SizedBox(width: 6),
                  ],
                  Text(
                    '${_formatPrice(price)}',
                    style: TextStyle(
                      color: color,
                      fontWeight: FontWeight.w900,
                      fontSize: 22,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Padding(
                    padding: EdgeInsets.only(bottom: 4),
                    child: Text(
                      'FCFA',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            Padding(
              padding: const EdgeInsets.only(left: 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: features
                    .map((f) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 1.5),
                          child: Text(
                            f,
                            style: TextStyle(
                              fontSize: 12,
                              color: selected
                                  ? Colors.black87
                                  : const Color(0xFF374151),
                              height: 1.4,
                            ),
                          ),
                        ))
                    .toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDossierPicker() {
    final hasDossier = _dossierPrincipal != null && _dossierPrincipal!.isNotEmpty;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: hasDossier ? const Color(0xFFF0FDF4) : const Color(0xFFFEF3C7),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: hasDossier
              ? const Color(0xFF16A34A)
              : const Color(0xFFF59E0B),
          width: 2,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                hasDossier
                    ? Icons.check_circle_rounded
                    : Icons.warning_amber_rounded,
                color: hasDossier
                    ? const Color(0xFF16A34A)
                    : const Color(0xFFF59E0B),
                size: 22,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  hasDossier
                      ? '✓ Dossier sélectionné'
                      : '⚠️ Choisissez un dossier pro',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 14,
                    color: hasDossier
                        ? const Color(0xFF065F46)
                        : const Color(0xFF92400E),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          if (hasDossier) ...[
            Padding(
              padding: const EdgeInsets.only(left: 30),
              child: Text(
                _dossierPrincipal!,
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 14,
                ),
              ),
            ),
            const SizedBox(height: 8),
          ],
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _pickDossier,
              icon: const Icon(Icons.list_alt_rounded, size: 18),
              label: Text(hasDossier ? 'Changer de dossier' : 'Choisir un dossier'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12),
                foregroundColor: hasDossier
                    ? const Color(0xFF065F46)
                    : const Color(0xFF92400E),
                side: BorderSide(
                  color: hasDossier
                      ? const Color(0xFF16A34A)
                      : const Color(0xFFF59E0B),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAmountCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppColors.buttonGradient,
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.35),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          const Text(
            'Montant à payer',
            style: TextStyle(color: Colors.white, fontSize: 13),
          ),
          const SizedBox(height: 6),
          Text(
            '${_formatPrice(_amount)} FCFA',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.w900,
              letterSpacing: 1,
            ),
          ),
          if (_typeConcours == 'professionnel' &&
              _dossierPrincipal != null) ...[
            const SizedBox(height: 4),
            Text(
              'Pour : $_dossierPrincipal',
              style: const TextStyle(color: Color(0xFFFFE0A0), fontSize: 12),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStepHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7ED),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFFED7AA)),
      ),
      child: const Row(
        children: [
          Icon(Icons.info_outline_rounded,
              color: AppColors.darkTerracotta, size: 20),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              "Suivez ces 3 étapes pour finaliser votre paiement",
              style: TextStyle(
                color: AppColors.darkTerracotta,
                fontSize: 13,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep1() {
    return _StepCard(
      number: 1,
      title: 'Composez le code USSD',
      description:
          'Sur votre téléphone, composez le code ci-dessous puis payez ${_formatPrice(_amount)} FCFA au numéro $kOrangeMoneyNumber.',
      child: Column(
        children: [
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF7ED),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFFED7AA)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: SelectableText(
                    kUssdCode,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: AppColors.darkTerracotta,
                      letterSpacing: 1,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.copy_rounded),
                  color: AppColors.primary,
                  tooltip: 'Copier',
                  onPressed: () => _copy(kUssdCode, 'Code USSD'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _openUssd,
              icon: const Icon(Icons.dialpad_rounded),
              label: const Text('Ouvrir le composeur'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep2() {
    return const _StepCard(
      number: 2,
      title: "Capture d'écran",
      description:
          "Une fois le paiement effectué, prenez une capture d'écran du SMS de confirmation Orange Money.",
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: 4),
        child: Row(
          children: [
            Icon(Icons.screenshot_rounded,
                color: AppColors.primary, size: 22),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                "💡 Astuce : appuyez sur Power + Volume bas pour faire une capture",
                style: TextStyle(
                  fontSize: 12,
                  color: Color(0xFF6B7280),
                  fontStyle: FontStyle.italic,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStep3() {
    return _StepCard(
      number: 3,
      title: 'Envoyer la capture',
      description:
          'Envoyez la capture sur WhatsApp au +226 76 22 39 62 et cliquez sur le bouton ci-dessous pour notifier notre équipe.',
      child: SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          onPressed: _openWhatsApp,
          icon: const Icon(Icons.chat_rounded),
          label: const Text('Ouvrir WhatsApp'),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.whatsapp,
            padding: const EdgeInsets.symmetric(vertical: 12),
          ),
        ),
      ),
    );
  }

  Widget _buildMessage() {
    final isSuccess = _message!.startsWith('✅');
    return Container(
      padding: const EdgeInsets.all(14),
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isSuccess
            ? const Color(0xFFFFF3D9)
            : const Color(0xFFFEE2E2),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isSuccess
              ? const Color(0xFFFBBF24)
              : const Color(0xFFFCA5A5),
        ),
      ),
      child: Text(
        _message!,
        style: TextStyle(
          fontWeight: FontWeight.w800,
          fontSize: 13,
          color: isSuccess
              ? const Color(0xFF92400E)
              : const Color(0xFF991B1B),
          height: 1.4,
        ),
      ),
    );
  }
}

class _StepCard extends StatelessWidget {
  final int number;
  final String title;
  final String description;
  final Widget child;

  const _StepCard({
    required this.number,
    required this.title,
    required this.description,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFFE4CC)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: const BoxDecoration(
                  gradient: AppColors.buttonGradient,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Text(
                  '$number',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                    color: AppColors.darkTerracotta,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            description,
            style: const TextStyle(
              fontSize: 13,
              height: 1.5,
              color: Color(0xFF374151),
            ),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}
