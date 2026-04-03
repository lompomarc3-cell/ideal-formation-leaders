// lib/screens/demo/payment_screen.dart
// Écran de paiement Orange Money pour débloquer un sous-dossier

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../models/categorie_model.dart';
import '../../services/auth_service.dart';
import '../../services/paiement_service.dart';

class PaymentScreen extends StatefulWidget {
  final CategorieModel categorie;

  const PaymentScreen({super.key, required this.categorie});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final _formKey = GlobalKey<FormState>();
  final _numeroOmCtrl = TextEditingController();
  bool _submitted = false;

  // Numéro Orange Money de l'administrateur IFL
  static const String adminOmNumber = '+226 XX XX XX XX';

  @override
  void dispose() {
    _numeroOmCtrl.dispose();
    super.dispose();
  }

  Future<void> _soumettreDemande() async {
    if (!_formKey.currentState!.validate()) return;

    final auth = context.read<AuthService>();
    final paiementService = context.read<PaiementService>();
    final user = auth.currentUser;

    if (user == null) return;

    final ok = await paiementService.soumettreDemande(
      userId: user.id,
      categorieId: widget.categorie.id,
      categorieNom: widget.categorie.nom,
      montant: widget.categorie.prix,
      numeroOm: _numeroOmCtrl.text.trim(),
    );

    if (!mounted) return;

    if (ok) {
      setState(() => _submitted = true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(paiementService.error ?? 'Erreur lors de la demande'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  void _copyToClipboard(String text) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Numéro copié !'),
        duration: Duration(seconds: 1),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final paiementService = context.watch<PaiementService>();
    final isOrange = widget.categorie.type == 'direct';
    final color = isOrange ? AppTheme.directColor : AppTheme.professionnelColor;

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: color,
        title: const Text('Débloquer le dossier'),
      ),
      body: _submitted
          ? _buildConfirmation()
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Info dossier
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: color.withValues(alpha: 0.3)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: color.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Icon(Icons.folder_rounded, color: color, size: 24),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      widget.categorie.nom,
                                      style: const TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w700,
                                        color: AppTheme.textPrimary,
                                      ),
                                    ),
                                    Text(
                                      widget.categorie.type == 'direct'
                                          ? 'Concours Direct'
                                          : 'Concours Professionnel',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppTheme.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: color,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  widget.categorie.prixFormate,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Étapes de paiement
                    const Text(
                      'Comment payer ?',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),

                    _buildStep(
                      number: '1',
                      icon: Icons.send_to_mobile_rounded,
                      color: const Color(0xFFFF8C00),
                      title: 'Envoyez le paiement Orange Money',
                      description: 'Envoyez ${widget.categorie.prixFormate} au numéro de l\'administrateur IFL ci-dessous',
                      extra: _buildOmNumber(),
                    ),
                    const SizedBox(height: 12),

                    _buildStep(
                      number: '2',
                      icon: Icons.camera_alt_rounded,
                      color: const Color(0xFF25D366),
                      title: 'Envoyez la capture WhatsApp',
                      description: 'Prenez une capture d\'écran de la confirmation et envoyez-la sur WhatsApp au même numéro',
                    ),
                    const SizedBox(height: 12),

                    _buildStep(
                      number: '3',
                      icon: Icons.how_to_reg_rounded,
                      color: AppTheme.primaryColor,
                      title: 'Remplissez ce formulaire',
                      description: 'Soumettez votre demande ici pour que l\'administrateur valide votre accès',
                    ),
                    const SizedBox(height: 24),

                    // Formulaire
                    const Text(
                      'Votre numéro Orange Money utilisé',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _numeroOmCtrl,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        hintText: '+22670000000',
                        prefixIcon: Icon(Icons.phone_rounded, color: Color(0xFFFF8C00)),
                      ),
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'Numéro requis';
                        if (v.length < 8) return 'Numéro invalide';
                        return null;
                      },
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF7ED),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFFF8C00).withValues(alpha: 0.3)),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.info_outline, color: Color(0xFFFF8C00), size: 16),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Après la soumission, l\'administrateur validera votre accès dans les 24h.',
                              style: TextStyle(fontSize: 12, color: Color(0xFF92400E)),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: color,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        onPressed: paiementService.isLoading ? null : _soumettreDemande,
                        icon: paiementService.isLoading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: Colors.white))
                            : const Icon(Icons.send_rounded),
                        label: const Text(
                          'SOUMETTRE MA DEMANDE',
                          style: TextStyle(fontWeight: FontWeight.w700),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildOmNumber() {
    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7ED),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFFF8C00).withValues(alpha: 0.4)),
      ),
      child: Row(
        children: [
          const Icon(Icons.phone_rounded, color: Color(0xFFFF8C00), size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Numéro Orange Money IFL',
                  style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                ),
                Text(
                  adminOmNumber,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFFFF8C00),
                    letterSpacing: 1,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.copy_rounded,
                color: Color(0xFFFF8C00), size: 20),
            onPressed: () => _copyToClipboard(adminOmNumber),
          ),
        ],
      ),
    );
  }

  Widget _buildStep({
    required String number,
    required IconData icon,
    required Color color,
    required String title,
    required String description,
    Widget? extra,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    number,
                    style: TextStyle(
                      color: color,
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(icon, color: color, size: 18),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            title,
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      description,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (extra != null) extra,
        ],
      ),
    );
  }

  Widget _buildConfirmation() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: AppTheme.accentColor.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.check_circle_rounded,
                color: AppTheme.accentColor,
                size: 56,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Demande envoyée !',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w800,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Votre demande d\'accès à\n"${widget.categorie.nom}"\na été soumise à l\'administrateur IFL.',
              style: const TextStyle(
                fontSize: 14,
                color: AppTheme.textSecondary,
                height: 1.6,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.accentColor.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                '✅ N\'oubliez pas d\'envoyer votre capture d\'écran de paiement sur WhatsApp.\n\nVotre accès sera activé dans les 24h après validation.',
                style: TextStyle(
                  fontSize: 13,
                  color: AppTheme.textPrimary,
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('RETOUR'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
