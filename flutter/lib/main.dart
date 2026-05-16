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
import 'screens/police_exam_screen.dart';
import 'screens/payment_screen.dart';
import 'screens/select_specialty_screen.dart';
import 'screens/demo_screen.dart';
import 'admin/admin_screen.dart';
import 'theme/app_theme.dart';

void main() {
  runApp(const IFLApp());
}

class IFLApp extends StatefulWidget {
  const IFLApp({super.key});

  @override
  State<IFLApp> createState() => _IFLAppState();
}

class _IFLAppState extends State<IFLApp> with WidgetsBindingObserver {
  late final AuthService _authService;
  late final PriceService _priceService;

  @override
  void initState() {
    super.initState();
    _authService = AuthService()..bootstrap();
    _priceService = PriceService(ApiService())..load();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  /// 🔧 FIX #1 : Quand l'app revient au premier plan, on rafraîchit immédiatement
  /// l'utilisateur (cas typique : retour de l'app après validation paiement par l'admin).
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _authService.refreshUser();
      _priceService.load();
    }
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthService>.value(value: _authService),
        ChangeNotifierProvider<PriceService>.value(value: _priceService),
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
          '/police-exam': (_) => const PoliceExamScreen(),
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
