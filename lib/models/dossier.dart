import 'package:flutter/material.dart';

/// Représente un dossier (catégorie) chargé depuis Supabase
class Dossier {
  final String id; // UUID Supabase
  final String name; // nom de la catégorie
  final String description;
  final String type; // 'direct', 'pro_paid', 'pro_bonus'
  final int prix; // prix en FCFA
  final int questionCount;
  final IconData icon;
  final Color color;
  final bool isBonus;

  const Dossier({
    required this.id,
    required this.name,
    required this.description,
    required this.type,
    required this.prix,
    required this.questionCount,
    required this.icon,
    required this.color,
    this.isBonus = false,
  });

  factory Dossier.fromCategory(Map<String, dynamic> json) {
    final nom = (json['nom'] ?? '').toString();
    final typeRaw = (json['type'] ?? 'direct').toString();
    final prix = (json['prix'] as num?)?.toInt() ?? 0;
    final qc = (json['question_count'] as num?)?.toInt() ?? 0;
    final desc = (json['description'] ?? '').toString();

    // Pro avec prix=0 = bonus
    final isBonus = typeRaw == 'professionnel' && prix == 0;
    String type;
    if (typeRaw == 'direct') {
      type = 'direct';
    } else if (isBonus) {
      type = 'pro_bonus';
    } else {
      type = 'pro_paid';
    }

    return Dossier(
      id: (json['id'] ?? '').toString(),
      name: nom,
      description: desc,
      type: type,
      prix: prix,
      questionCount: qc,
      icon: _iconFor(nom),
      color: _colorFor(nom),
      isBonus: isBonus,
    );
  }

  static IconData _iconFor(String name) {
    final n = name.toLowerCase();
    if (n.contains('actualit') || n.contains('culture')) return Icons.public;
    if (n.contains('français')) return Icons.menu_book;
    if (n.contains('math')) return Icons.calculate;
    if (n.contains('histoire') || n.contains('géo') || n.contains('h-g')) {
      return Icons.history_edu;
    }
    if (n.contains('svt') || n.contains('vie')) return Icons.eco;
    if (n.contains('pc') || n.contains('physique') || n.contains('chimie')) {
      return Icons.science;
    }
    if (n.contains('anglais')) return Icons.language;
    if (n.contains('philo')) return Icons.psychology;
    if (n.contains('écono') || n.contains('econo')) return Icons.trending_up;
    if (n.contains('civique') || n.contains('droit')) return Icons.balance;
    if (n.contains('logique') || n.contains('psycho')) return Icons.extension;
    if (n.contains('littérature') || n.contains('art')) {
      return Icons.auto_stories;
    }
    if (n.contains('magistr')) return Icons.gavel;
    if (n.contains('justice')) return Icons.account_balance;
    if (n.contains('inspect')) return Icons.verified_user;
    if (n.contains('gsp')) return Icons.shield;
    if (n.contains('police')) return Icons.local_police;
    if (n.contains('douane')) return Icons.security;
    if (n.contains('trésor')) return Icons.account_balance_wallet;
    if (n.contains('impôt')) return Icons.receipt_long;
    if (n.contains('admin')) return Icons.business_center;
    if (n.contains('santé') || n.contains('hôpit')) return Icons.local_hospital;
    if (n.contains('capes') || n.contains('csapé') || n.contains('agrég')) {
      return Icons.school;
    }
    if (n.contains('enaref') || n.contains('cisu') || n.contains('aisu')) {
      return Icons.corporate_fare;
    }
    if (n.contains('vie scolaire') || n.contains('casu')) {
      return Icons.cast_for_education;
    }
    if (n.contains('entraînement') || n.contains('qcm')) return Icons.quiz;
    if (n.contains('accompagnement')) return Icons.support_agent;
    return Icons.folder_special;
  }

  static const _palette = [
    Color(0xFF009E60),
    Color(0xFF3B82F6),
    Color(0xFFEF4444),
    Color(0xFFF59E0B),
    Color(0xFF8B5CF6),
    Color(0xFFEC4899),
    Color(0xFF14B8A6),
    Color(0xFF6366F1),
    Color(0xFFF97316),
    Color(0xFF06B6D4),
    Color(0xFF84CC16),
    Color(0xFFD946EF),
    Color(0xFF7C3AED),
    Color(0xFF0EA5E9),
    Color(0xFF475569),
    Color(0xFF1E40AF),
    Color(0xFF0F766E),
    Color(0xFFCA8A04),
    Color(0xFFB45309),
    Color(0xFFE11D48),
    Color(0xFF0891B2),
    Color(0xFF059669),
    Color(0xFFFBBF24),
    Color(0xFFD97706),
  ];

  static Color _colorFor(String name) {
    final hash = name.hashCode.abs();
    return _palette[hash % _palette.length];
  }
}
