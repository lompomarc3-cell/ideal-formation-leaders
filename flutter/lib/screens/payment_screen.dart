import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/category.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';

const String kOrangeMoneyNumber = '76223962';
const String kWhatsAppNumber = '22676223962';
const String kUssdCode = '*144*10*76223962#';

/// Écran de paiement (équivalent pages/payment.js).
/// Reproduit les méthodes Orange Money / WhatsApp / USSD avec les contacts
/// fournis dans le brief utilisateur.
class PaymentScreen extends StatefulWidget {
  const PaymentScreen({super.key});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  String _typeConcours = 'direct'; // direct | professionnel
  String? _dossierPrincipal;
  bool _loading = true;
  bool _submitting = false;
  String? _message;
  PriceInfo? _priceDirect;
  PriceInfo? _pricePro;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final args = ModalRoute.of(context)?.settings.arguments;
      if (args is Map) {
        if (args['type'] != null) _typeConcours = args['type'].toString();
        if (args['dossier'] != null) {
          _dossierPrincipal = args['dossier'].toString();
        }
      }
      _load();
    });
  }

  Future<void> _load() async {
    final auth = context.read<AuthService>();
    try {
      final res = await auth.api.publicPrices();
      final pricesMap = Map<String, dynamic>.from(res['prices'] ?? {});
      if (!mounted) return;
      setState(() {
        if (pricesMap['direct'] != null) {
          _priceDirect = PriceInfo.fromMap(
              'direct', Map<String, dynamic>.from(pricesMap['direct']));
        }
        if (pricesMap['professionnel'] != null) {
          _pricePro = PriceInfo.fromMap('professionnel',
              Map<String, dynamic>.from(pricesMap['professionnel']));
        }
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  int get _amount {
    final p = _typeConcours == 'direct' ? _priceDirect : _pricePro;
    return p?.prixEffectif ?? (_typeConcours == 'direct' ? 5000 : 20000);
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

  Future<void> _submit() async {
    if (_typeConcours == 'professionnel' &&
        (_dossierPrincipal == null || _dossierPrincipal!.isEmpty)) {
      Navigator.of(context).pushNamed('/select-specialty');
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
          '✅ Demande envoyée ! Notre équipe va valider votre paiement.');
    } else {
      setState(() => _message =
          '⚠️ ${res['error'] ?? 'Erreur lors de la demande.'}');
    }
  }

  Future<void> _openWhatsApp() async {
    final txt = Uri.encodeComponent(
        'Bonjour, je souhaite m\'abonner à IFL ($_typeConcours${_dossierPrincipal != null ? " - $_dossierPrincipal" : ""}) pour ${_formatPrice(_amount)} FCFA.');
    final uri = Uri.parse('https://wa.me/$kWhatsAppNumber?text=$txt');
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<void> _copy(String value, String label) async {
    await Clipboard.setData(ClipboardData(text: value));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$label copié : $value')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Paiement'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 560),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _buildTypeSelector(),
                    const SizedBox(height: 12),
                    if (_typeConcours == 'professionnel') _buildDossierPicker(),
                    const SizedBox(height: 12),
                    _buildAmountCard(),
                    const SizedBox(height: 16),
                    _buildOrangeMoneyCard(),
                    const SizedBox(height: 12),
                    _buildWhatsAppCard(),
                    const SizedBox(height: 12),
                    _buildUssdCard(),
                    const SizedBox(height: 24),
                    if (_message != null)
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF8F0),
                          border: Border.all(color: const Color(0xFFFFE4CC)),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(_message!,
                            style: const TextStyle(
                                fontWeight: FontWeight.w600, fontSize: 13)),
                      ),
                    ElevatedButton.icon(
                      onPressed: _submitting ? null : _submit,
                      icon: _submitting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white),
                            )
                          : const Icon(Icons.send),
                      label: const Text("Envoyer ma demande de paiement"),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildTypeSelector() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Type de concours',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: _typeChip(
                      label: 'Direct (12 dossiers)',
                      value: 'direct',
                      price: _priceDirect?.prixEffectif ?? 5000),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _typeChip(
                      label: 'Professionnel (17)',
                      value: 'professionnel',
                      price: _pricePro?.prixEffectif ?? 20000),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _typeChip({
    required String label,
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
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : const Color(0xFFFFF8F0),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
              color: selected ? AppColors.primary : const Color(0xFFFFE4CC),
              width: 2),
        ),
        child: Column(
          children: [
            Text(label,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: selected ? Colors.white : AppColors.darkTerracotta,
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                )),
            const SizedBox(height: 4),
            Text('${_formatPrice(price)} FCFA',
                style: TextStyle(
                  color: selected ? Colors.white : Color(0xFFC4521A),
                  fontWeight: FontWeight.w900,
                  fontSize: 13,
                )),
          ],
        ),
      ),
    );
  }

  Widget _buildDossierPicker() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            const Expanded(
              child: Text('Dossier principal',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pushNamed('/select-specialty'),
              child: Text(_dossierPrincipal ?? 'Choisir →'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAmountCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: AppColors.buttonGradient,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          const Text('Montant à payer',
              style: TextStyle(color: Colors.white, fontSize: 13)),
          const SizedBox(height: 6),
          Text('${_formatPrice(_amount)} FCFA',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 28,
                fontWeight: FontWeight.w900,
              )),
        ],
      ),
    );
  }

  Widget _buildOrangeMoneyCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('🟧 Orange Money',
                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
            const SizedBox(height: 6),
            Row(
              children: [
                Expanded(
                  child: SelectableText(
                    kOrangeMoneyNumber,
                    style: const TextStyle(
                        fontSize: 22, fontWeight: FontWeight.w900),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.copy),
                  onPressed: () =>
                      _copy(kOrangeMoneyNumber, 'Numéro Orange Money'),
                ),
              ],
            ),
            const Text(
                'Envoyez le montant exact, puis cliquez sur « Envoyer ma demande de paiement ».',
                style: TextStyle(color: Color(0xFF6B7280), fontSize: 12)),
          ],
        ),
      ),
    );
  }

  Widget _buildWhatsAppCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('💬 WhatsApp',
                      style: TextStyle(
                          fontWeight: FontWeight.w900, fontSize: 15)),
                  SizedBox(height: 4),
                  Text('Contactez-nous directement : +226 76 22 39 62',
                      style:
                          TextStyle(color: Color(0xFF6B7280), fontSize: 12)),
                ],
              ),
            ),
            ElevatedButton(
              onPressed: _openWhatsApp,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF25D366),
              ),
              child: const Text('Ouvrir'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUssdCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('📱 Code USSD',
                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
            const SizedBox(height: 6),
            Row(
              children: [
                Expanded(
                  child: SelectableText(
                    kUssdCode,
                    style: const TextStyle(
                        fontSize: 18, fontWeight: FontWeight.w800),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.copy),
                  onPressed: () => _copy(kUssdCode, 'Code USSD'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
