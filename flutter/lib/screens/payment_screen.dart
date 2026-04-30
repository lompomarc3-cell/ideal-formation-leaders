import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/auth_service.dart';
import '../theme/app_theme.dart';

const String kOrangeMoneyNumber = '76223962';
const String kWhatsAppNumber = '22676223962';
const String kUssdCode = '*144*10*76223962#';
const String kUssdTelUri = 'tel:*144*10*76223962%23';
const String kSupportPhone = '+22676223962';

/// Écran de paiement Orange Money — Guide en 3 étapes
/// Étape 1 : USSD *144*10*76223962# (5 000 ou 20 000 FCFA)
/// Étape 2 : Capture d'écran de confirmation
/// Étape 3 : Envoyer la capture sur WhatsApp + valider la demande
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
    });
  }

  int get _amount => _typeConcours == 'direct' ? 5000 : 20000;

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

  Future<void> _submit() async {
    if (_typeConcours == 'professionnel' &&
        (_dossierPrincipal == null || _dossierPrincipal!.isEmpty)) {
      Navigator.of(context).pushNamed('/select-specialty').then((value) {
        if (value is String) setState(() => _dossierPrincipal = value);
      });
      return;
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
        _message = '⚠️ Erreur réseau. Vérifiez votre connexion.';
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
          'Paiement Orange Money',
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
                _buildTypeSelector(),
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
                  label: const Text('Envoyer ma demande de paiement'),
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

  Widget _buildTypeSelector() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFFE4CC)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Type de concours',
            style: TextStyle(
              fontWeight: FontWeight.w900,
              fontSize: 14,
              color: AppColors.darkTerracotta,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _typeChip(
                  label: 'Direct',
                  hint: '12 dossiers',
                  value: 'direct',
                  price: 5000,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _typeChip(
                  label: 'Professionnel',
                  hint: 'par dossier',
                  value: 'professionnel',
                  price: 20000,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _typeChip({
    required String label,
    required String hint,
    required String value,
    required int price,
  }) {
    final selected = _typeConcours == value;
    return InkWell(
      onTap: () => setState(() {
        _typeConcours = value;
        if (value == 'direct') _dossierPrincipal = null;
      }),
      borderRadius: BorderRadius.circular(14),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          gradient: selected ? AppColors.buttonGradient : null,
          color: selected ? null : const Color(0xFFFFF8F0),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color:
                selected ? AppColors.primary : const Color(0xFFFFE4CC),
            width: 2,
          ),
        ),
        child: Column(
          children: [
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: selected ? Colors.white : AppColors.darkTerracotta,
                fontWeight: FontWeight.w900,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '${_formatPrice(price)} FCFA',
              style: TextStyle(
                color: selected ? Colors.white : AppColors.primary,
                fontWeight: FontWeight.w900,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              hint,
              style: TextStyle(
                color: selected
                    ? Colors.white.withValues(alpha: 0.85)
                    : const Color(0xFF6B7280),
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDossierPicker() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFFE4CC)),
      ),
      child: Row(
        children: [
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Dossier à acheter',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 14,
                    color: AppColors.darkTerracotta,
                  ),
                ),
                Text(
                  'Choisissez le dossier que vous souhaitez débloquer',
                  style: TextStyle(color: Color(0xFF6B7280), fontSize: 11),
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pushNamed('/select-specialty').then((v) {
                if (v is String) setState(() => _dossierPrincipal = v);
              });
            },
            style: ElevatedButton.styleFrom(
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            ),
            child: Text(_dossierPrincipal ?? 'Choisir →'),
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
