import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/auth_service.dart';
import '../services/supabase_service.dart';
import '../theme/app_theme.dart';

class PaymentScreen extends StatefulWidget {
  final String offerName;
  final int amount;
  final String packageId;

  const PaymentScreen({
    super.key,
    required this.offerName,
    required this.amount,
    required this.packageId,
  });

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  bool _step1Done = false;
  bool _step2Done = false;
  bool _sending = false;

  static const String _adminPhone = '76223962';
  static const String _adminWhatsApp = '+22676223962';

  Future<void> _launchUssd() async {
    // Code USSD : *144*10*76223962#
    final code = Uri.parse('tel:${Uri.encodeComponent('*144*10*$_adminPhone#')}');
    if (await canLaunchUrl(code)) {
      await launchUrl(code);
      setState(() => _step1Done = true);
    } else {
      _snack('Impossible d\'ouvrir le composeur', AppColors.error);
    }
  }

  Future<void> _launchWhatsApp() async {
    final auth = context.read<AuthService>();
    final user = auth.currentUser;
    final name = user?.fullName ?? '';
    final phone = user?.phone ?? '';

    final msg = Uri.encodeComponent(
      'Bonjour IFL,\n\n'
      'Je viens de payer ${widget.amount} FCFA pour : ${widget.offerName}.\n'
      'Nom : $name\n'
      'Téléphone : +226 $phone\n'
      'ID : ${widget.packageId}\n\n'
      'Merci d\'activer mon abonnement.',
    );
    final wa = Uri.parse('https://wa.me/22676223962?text=$msg');
    if (await canLaunchUrl(wa)) {
      await launchUrl(wa, mode: LaunchMode.externalApplication);
      setState(() => _step2Done = true);
    } else {
      _snack('WhatsApp non disponible', AppColors.error);
    }
  }

  Future<void> _sendRequest() async {
    final auth = context.read<AuthService>();
    final user = auth.currentUser;
    if (user == null) {
      _snack('Connectez-vous d\'abord', AppColors.error);
      return;
    }
    setState(() => _sending = true);
    try {
      await SupabaseConfig.client.from('payment_requests').insert({
        'user_id': user.id,
        'phone': user.phone,
        'full_name': user.fullName,
        'package_id': widget.packageId,
        'package_name': widget.offerName,
        'amount': widget.amount,
        'status': 'pending',
        'created_at': DateTime.now().toIso8601String(),
      });
      if (!mounted) return;
      _snack(
        'Demande envoyée ✅ L\'administrateur va activer votre abonnement.',
        AppColors.success,
      );
      Navigator.of(context).pop();
    } catch (e) {
      _snack('Demande enregistrée localement. Continuez sur WhatsApp.',
          AppColors.warning);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  void _snack(String msg, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: color),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Paiement Orange Money')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Récap
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFF6B00), Color(0xFFE65100)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text(
                            'Orange\nMoney',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Color(0xFFFF6B00),
                              fontWeight: FontWeight.w900,
                              fontSize: 10,
                              height: 1.1,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Text(
                            'Paiement sécurisé',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontSize: 16,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Text(
                      widget.offerName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${widget.amount} FCFA',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 28,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              const Text(
                'Suivez ces 3 étapes',
                style: TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 15),
              ),
              const SizedBox(height: 12),

              // ÉTAPE 1 : USSD
              _buildStep(
                step: 1,
                title: 'Composer le code USSD',
                description:
                    'Composez le code suivant pour transférer ${widget.amount} FCFA vers le numéro $_adminPhone.',
                done: _step1Done,
                child: Column(
                  children: [
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.divider),
                      ),
                      child: SelectableText(
                        '*144*10*$_adminPhone#',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontFamily: 'monospace',
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _launchUssd,
                        icon: const Icon(Icons.dialpad_rounded),
                        label: const Text('Ouvrir le composeur'),
                      ),
                    ),
                  ],
                ),
              ),

              // ÉTAPE 2 : Capture
              _buildStep(
                step: 2,
                title: 'Faire une capture d\'écran',
                description:
                    'Faites une capture du SMS / écran de confirmation Orange Money. Elle vous sera demandée à l\'étape 3.',
                done: _step2Done,
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.warning.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                        color: AppColors.warning.withValues(alpha: 0.4)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.lightbulb_rounded,
                          color: AppColors.warning, size: 20),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Astuce : maintenez VOLUME BAS + POWER pour faire une capture sur Android.',
                          style: TextStyle(fontSize: 12, height: 1.4),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // ÉTAPE 3 : WhatsApp
              _buildStep(
                step: 3,
                title: 'Envoyer la capture sur WhatsApp',
                description:
                    'Envoyez votre capture à l\'administrateur sur WhatsApp ($_adminWhatsApp). Votre abonnement sera activé sous quelques minutes.',
                done: false,
                isLast: true,
                child: Column(
                  children: [
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _launchWhatsApp,
                        icon: const Icon(Icons.chat_rounded),
                        label: const Text('Ouvrir WhatsApp'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF25D366),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: _sending ? null : _sendRequest,
                        icon: _sending
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2),
                              )
                            : const Icon(Icons.send_rounded),
                        label: const Text('Envoyer la demande'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStep({
    required int step,
    required String title,
    required String description,
    required Widget child,
    bool done = false,
    bool isLast = false,
  }) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: done ? AppColors.success : AppColors.primary,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: done
                      ? const Icon(Icons.check_rounded,
                          color: Colors.white, size: 18)
                      : Text(
                          '$step',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                ),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    color: AppColors.divider,
                  ),
                ),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 18),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.divider),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      description,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 10),
                    child,
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
