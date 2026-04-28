import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'services/auth_service.dart';
import 'screens/splash_screen.dart';
import 'screens/main_shell.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/quiz_screen.dart';
import 'screens/payment_screen.dart';
import 'screens/select_specialty_screen.dart';
import 'screens/demo_screen.dart';
import 'admin/admin_screen.dart';
import 'theme/app_theme.dart';

void main() {
  runApp(const IFLApp());
}

class IFLApp extends StatelessWidget {
  const IFLApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<AuthService>(
      create: (_) => AuthService()..bootstrap(),
      child: MaterialApp(
        title: 'IFL — Idéale Formation of Leaders',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(),
        home: const _Bootstrap(),
        routes: {
          '/main': (_) => const MainShell(),
          '/login': (_) => const LoginScreen(),
          '/register': (_) => const RegisterScreen(),
          '/quiz': (_) => const QuizScreen(),
          '/payment': (_) => const PaymentScreen(),
          '/select-specialty': (_) => const SelectSpecialtyScreen(),
          '/demo': (_) => const DemoScreen(),
          '/admin': (_) => const AdminScreen(),
        },
      ),
    );
  }
}

/// Splash → MainShell (avec ses 5 onglets).
class _Bootstrap extends StatefulWidget {
  const _Bootstrap();

  @override
  State<_Bootstrap> createState() => _BootstrapState();
}

class _BootstrapState extends State<_Bootstrap> {
  bool _splashDone = false;

  Future<void> _afterSplash() async {
    if (!mounted) return;
    setState(() => _splashDone = true);
  }

  @override
  Widget build(BuildContext context) {
    if (!_splashDone) {
      return SplashScreen(onDone: _afterSplash);
    }
    return const MainShell();
  }
}
