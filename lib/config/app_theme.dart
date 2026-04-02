// lib/config/app_theme.dart
import 'package:flutter/material.dart';

class AppTheme {
  // Couleurs IFL
  static const Color primaryColor = Color(0xFF1A3A6B); // Bleu marine
  static const Color secondaryColor = Color(0xFFE8B84B); // Or/Jaune
  static const Color accentColor = Color(0xFF2ECC71); // Vert succès
  static const Color errorColor = Color(0xFFE74C3C); // Rouge erreur
  static const Color backgroundColor = Color(0xFFF5F7FA);
  static const Color cardColor = Colors.white;
  static const Color textPrimary = Color(0xFF1A1A2E);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color dividerColor = Color(0xFFE5E7EB);

  // Couleurs concours
  static const Color directColor = Color(0xFF2563EB); // Bleu concours direct
  static const Color professionnelColor =
      Color(0xFF7C3AED); // Violet concours professionnel

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryColor,
        primary: primaryColor,
        secondary: secondaryColor,
        error: errorColor,
        surface: backgroundColor,
      ),
      
      scaffoldBackgroundColor: backgroundColor,
      appBarTheme: const AppBarTheme(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      cardTheme: CardThemeData(
        color: cardColor,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        shadowColor: Colors.black.withValues(alpha: 0.08),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: dividerColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: dividerColor.withValues(alpha: 0.5)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryColor, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: errorColor),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        labelStyle: const TextStyle(
          
          color: textSecondary,
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: primaryColor,
        unselectedItemColor: textSecondary,
        showUnselectedLabels: true,
        type: BottomNavigationBarType.fixed,
      ),
    );
  }
}
