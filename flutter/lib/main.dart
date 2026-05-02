import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';

import 'services/auth_service.dart';
import 'services/price_service.dart';
import 'services/api_service.dart';
import 'screens/motivation_screen.dart';
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
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthService>(
          create: (_) => AuthService()..bootstrap(),
        ),
        ChangeNotifierProvider<PriceService>(
          create: (_) => PriceService(ApiService())..load(),
        ),
      ],
      child: MaterialApp(
        title: 'IFL — Idéale Formation of Leaders',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(),
        // Localisation française pour DatePicker, TimePicker, etc.
        locale: const Locale('fr', 'FR'),
        supportedLocales: const [
          Locale('fr', 'FR'),
          Locale('fr'),
          Locale('en'),
        ],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
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
  // 0 = motivation, 1 = splash logo, 2 = main shell
  int _phase = 0;

  void _next() {
    if (!mounted) return;
    setState(() => _phase += 1);
  }

  @override
  Widget build(BuildContext context) {
    if (_phase == 0) {
      return MotivationScreen(onDone: _next);
    }
    if (_phase == 1) {
      return SplashScreen(onDone: _next);
    }
    return const MainShell();
  }
}
