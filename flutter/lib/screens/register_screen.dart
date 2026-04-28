import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/auth_service.dart';
import '../theme/app_theme.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nomCtrl = TextEditingController();
  final _prenomCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _showPass = false;
  bool _showConfirm = false;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _nomCtrl.dispose();
    _prenomCtrl.dispose();
    _phoneCtrl.dispose();
    _passCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    if (_passCtrl.text != _confirmCtrl.text) {
      setState(() => _error = 'Les mots de passe ne correspondent pas.');
      return;
    }
    if (_passCtrl.text.length < 6) {
      setState(() => _error = 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setState(() => _loading = true);
    final auth = context.read<AuthService>();
    final err = await auth.register(
      phone: _phoneCtrl.text.trim(),
      nom: _nomCtrl.text.trim(),
      prenom: _prenomCtrl.text.trim(),
      password: _passCtrl.text,
    );
    if (!mounted) return;
    setState(() => _loading = false);
    if (err != null) {
      setState(() => _error = err);
    } else {
      Navigator.of(context).pushReplacementNamed('/dashboard');
    }
  }

  Widget _label(String txt) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text(
          txt,
          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
        ),
      );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.primaryGradient),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                const SizedBox(height: 28),
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.18),
                        blurRadius: 16,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: Image.asset('assets/logo.png',
                        fit: BoxFit.cover, width: 80, height: 80),
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Créer un compte',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 24,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Rejoignez des milliers de candidats',
                  style: TextStyle(color: Color(0xFFFFD9B0), fontSize: 13),
                ),
                const SizedBox(height: 20),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 440),
                  child: Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(28),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.2),
                          blurRadius: 30,
                          offset: const Offset(0, 12),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (_error != null) ...[
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFFDC2626),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Text(
                              '⚠️  $_error',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],
                        _label('👤  Nom de famille'),
                        TextField(
                          controller: _nomCtrl,
                          textCapitalization: TextCapitalization.characters,
                          style: const TextStyle(fontSize: 16),
                          decoration: const InputDecoration(hintText: 'Ex: OUEDRAOGO'),
                        ),
                        const SizedBox(height: 14),
                        _label('📝  Prénom'),
                        TextField(
                          controller: _prenomCtrl,
                          style: const TextStyle(fontSize: 16),
                          decoration: const InputDecoration(hintText: 'Ex: Mariam'),
                        ),
                        const SizedBox(height: 14),
                        _label('📱  Numéro de téléphone'),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF9FAFB),
                                border: Border.all(color: const Color(0xFFE5E7EB), width: 2),
                                borderRadius: const BorderRadius.only(
                                  topLeft: Radius.circular(14),
                                  bottomLeft: Radius.circular(14),
                                ),
                              ),
                              child: const Text(
                                '🇧🇫  +226',
                                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                              ),
                            ),
                            Expanded(
                              child: TextField(
                                controller: _phoneCtrl,
                                keyboardType: TextInputType.phone,
                                style: const TextStyle(fontSize: 16),
                                decoration: const InputDecoration(
                                  hintText: '70 00 00 00',
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.only(
                                      topRight: Radius.circular(14),
                                      bottomRight: Radius.circular(14),
                                    ),
                                    borderSide: BorderSide(color: Color(0xFFE5E7EB), width: 2),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.only(
                                      topRight: Radius.circular(14),
                                      bottomRight: Radius.circular(14),
                                    ),
                                    borderSide: BorderSide(color: Color(0xFFE5E7EB), width: 2),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        _label('🔒  Mot de passe'),
                        TextField(
                          controller: _passCtrl,
                          obscureText: !_showPass,
                          style: const TextStyle(fontSize: 16),
                          decoration: InputDecoration(
                            hintText: 'Minimum 6 caractères',
                            suffixIcon: IconButton(
                              icon: Icon(_showPass ? Icons.visibility_off : Icons.visibility),
                              onPressed: () => setState(() => _showPass = !_showPass),
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),
                        _label('🔐  Confirmer le mot de passe'),
                        TextField(
                          controller: _confirmCtrl,
                          obscureText: !_showConfirm,
                          style: const TextStyle(fontSize: 16),
                          decoration: InputDecoration(
                            hintText: '••••••••',
                            suffixIcon: IconButton(
                              icon: Icon(_showConfirm ? Icons.visibility_off : Icons.visibility),
                              onPressed: () => setState(() => _showConfirm = !_showConfirm),
                            ),
                          ),
                          onSubmitted: (_) => _submit(),
                        ),
                        const SizedBox(height: 20),
                        SizedBox(
                          height: 56,
                          child: ElevatedButton(
                            onPressed: _loading ? null : _submit,
                            style: ElevatedButton.styleFrom(
                              padding: EdgeInsets.zero,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            ),
                            child: Ink(
                              decoration: BoxDecoration(
                                gradient: AppColors.buttonGradient,
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: Container(
                                alignment: Alignment.center,
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                child: _loading
                                    ? const SizedBox(
                                        width: 22,
                                        height: 22,
                                        child: CircularProgressIndicator(
                                          color: Colors.white,
                                          strokeWidth: 3,
                                        ),
                                      )
                                    : const Text(
                                        "🚀  S'inscrire gratuitement",
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w800,
                                          fontSize: 17,
                                        ),
                                      ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Center(
                          child: TextButton(
                            onPressed: () => Navigator.of(context).pushReplacementNamed('/login'),
                            child: const Text.rich(
                              TextSpan(
                                children: [
                                  TextSpan(
                                    text: 'Déjà inscrit ?  ',
                                    style: TextStyle(color: Color(0xFF6B7280)),
                                  ),
                                  TextSpan(
                                    text: 'Se connecter →',
                                    style: TextStyle(
                                      color: AppColors.primary,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        Center(
                          child: TextButton(
                            onPressed: () => Navigator.of(context).pushReplacementNamed('/'),
                            child: const Text(
                              "← Retour à l'accueil",
                              style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 12),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
