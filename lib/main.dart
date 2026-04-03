// lib/main.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'config/app_theme.dart';
import 'config/supabase_config.dart';
import 'services/auth_service.dart';
import 'services/categorie_service.dart';
import 'services/question_service.dart';
import 'services/paiement_service.dart';
import 'services/migration_service.dart';
import 'screens/auth/login_screen.dart';
import 'screens/home/home_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: SupabaseConfig.url,
    anonKey: SupabaseConfig.anonKey,
  );

  // Lancer les migrations en arrière-plan (sans bloquer l'app)
  MigrationService.runMigrations();

  runApp(const IFLApp());
}

class IFLApp extends StatelessWidget {
  const IFLApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        ChangeNotifierProvider(create: (_) => CategorieService()),
        ChangeNotifierProvider(create: (_) => QuestionService()),
        ChangeNotifierProvider(create: (_) => PaiementService()),
      ],
      child: MaterialApp(
        title: 'IFL - Idéal Formation Leaders',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: const AppRouter(),
      ),
    );
  }
}

class AppRouter extends StatelessWidget {
  const AppRouter({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthService>(
      builder: (context, authService, _) {
        final session = Supabase.instance.client.auth.currentSession;
        if (session != null && authService.currentUser != null) {
          return const HomeScreen();
        }
        return const LoginScreen();
      },
    );
  }
}
