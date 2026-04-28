import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'services/auth_service.dart';
import 'screens/splash_screen.dart';
import 'screens/welcome_screen.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/dashboard_screen.dart';
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
        // Démarre par un Bootstrap qui choisit splash → welcome → home/dashboard
        home: const _Bootstrap(),
        routes: {
          '/home': (_) => const HomeScreen(),
          '/login': (_) => const LoginScreen(),
          '/register': (_) => const RegisterScreen(),
          '/dashboard': (_) => const DashboardScreen(),
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

/// Gère l'enchaînement Splash → (Welcome 1ère fois) → Home/Dashboard
/// (équivalent au _app.js + AuthProvider Next.js).
class _Bootstrap extends StatefulWidget {
  const _Bootstrap();

  @override
  State<_Bootstrap> createState() => _BootstrapState();
}

class _BootstrapState extends State<_Bootstrap> {
  bool _splashDone = false;
  bool _welcomeChecked = false;
  bool _showWelcome = false;

  Future<void> _afterSplash() async {
    final auth = context.read<AuthService>();
    final seen = await auth.isWelcomeSeen();
    if (!mounted) return;
    setState(() {
      _splashDone = true;
      _showWelcome = !seen && !auth.isAuthenticated;
      _welcomeChecked = true;
    });
  }

  Future<void> _afterWelcome() async {
    final auth = context.read<AuthService>();
    await auth.markWelcomeSeen();
    if (!mounted) return;
    setState(() => _showWelcome = false);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();

    if (!_splashDone) {
      return SplashScreen(onDone: _afterSplash);
    }
    if (!_welcomeChecked || auth.loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }
    if (_showWelcome) {
      return WelcomeScreen(onDone: _afterWelcome);
    }
    if (auth.isAuthenticated) {
      return const DashboardScreen();
    }
    return const HomeScreen();
  }
}
