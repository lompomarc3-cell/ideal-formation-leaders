import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';

class AdminChangePasswordSection extends StatefulWidget {
  const AdminChangePasswordSection({super.key});

  @override
  State<AdminChangePasswordSection> createState() =>
      _AdminChangePasswordSectionState();
}

class _AdminChangePasswordSectionState
    extends State<AdminChangePasswordSection> {
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _confirm = TextEditingController();
  bool _busy = false;
  bool _obs1 = true;
  bool _obs2 = true;
  bool _obs3 = true;

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_next.text.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Le mot de passe doit avoir au moins 6 caractères')));
      return;
    }
    if (_next.text != _confirm.text) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Les mots de passe ne correspondent pas')));
      return;
    }
    setState(() => _busy = true);
    final auth = context.read<AuthService>();
    try {
      await auth.api.changePassword(
        auth.token!,
        _current.text,
        _next.text,
      );
      if (!mounted) return;
      _current.clear();
      _next.clear();
      _confirm.clear();
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('✅ Mot de passe changé avec succès'),
          backgroundColor: Colors.green));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur : $e'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('🔐 Changer mon mot de passe',
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: AppColors.darkTerracotta)),
              const SizedBox(height: 16),
              TextField(
                controller: _current,
                obscureText: _obs1,
                decoration: InputDecoration(
                  labelText: 'Mot de passe actuel',
                  suffixIcon: IconButton(
                    icon: Icon(
                        _obs1 ? Icons.visibility : Icons.visibility_off),
                    onPressed: () => setState(() => _obs1 = !_obs1),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _next,
                obscureText: _obs2,
                decoration: InputDecoration(
                  labelText: 'Nouveau mot de passe',
                  suffixIcon: IconButton(
                    icon: Icon(
                        _obs2 ? Icons.visibility : Icons.visibility_off),
                    onPressed: () => setState(() => _obs2 = !_obs2),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _confirm,
                obscureText: _obs3,
                decoration: InputDecoration(
                  labelText: 'Confirmer le nouveau mot de passe',
                  suffixIcon: IconButton(
                    icon: Icon(
                        _obs3 ? Icons.visibility : Icons.visibility_off),
                    onPressed: () => setState(() => _obs3 = !_obs3),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _busy ? null : _submit,
                  icon: _busy
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.save),
                  label: Text(_busy ? 'Enregistrement…' : 'Enregistrer'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
