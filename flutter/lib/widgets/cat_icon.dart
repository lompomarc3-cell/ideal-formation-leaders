import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// Mapping emoji DB → clé d'image SVG (identique à pages/index.js).
const Map<String, String> _emojiToKey = {
  '🌍': 'globe', '🌎': 'globe', '🌐': 'globe',
  '📚': 'book', '📕': 'book', '📗': 'book', '📘': 'book',
  '🎨': 'palette',
  '🗺️': 'map', '🗺': 'map', '📍': 'map', '📌': 'map',
  '🧬': 'leaf', '🌿': 'leaf', '🌱': 'leaf',
  '🧠': 'brain',
  '📐': 'calculator', '🔢': 'calculator', '🧮': 'calculator',
  '⚗️': 'flask', '⚗': 'flask', '🔬': 'flask',
  '⚖️': 'scale', '⚖': 'scale',
  '💹': 'chart', '📊': 'chart', '📈': 'chart',
  '✏️': 'pencil', '✏': 'pencil', '📝': 'pencil',
  '🎯': 'target',
  '🏫': 'school', '🏠': 'school',
  '📰': 'newspaper',
  '🏛️': 'building', '🏛': 'building',
  '🔍': 'search',
  '🔎': 'search2',
  '🎓': 'graduation',
  '📜': 'scroll',
  '📖': 'openbook',
  '🏥': 'hospital', '💉': 'hospital',
  '💊': 'health', '❤️': 'health', '❤': 'health',
  '👨‍⚖️': 'judge', '👩‍⚖️': 'judge',
  '🛡️': 'shield', '🛡': 'shield',
  '👮': 'badge', '👮‍♂️': 'badge',
  '📋': 'clipboard', '📄': 'clipboard',
};

const List<String> _directKeys = [
  'globe','book','palette','map','leaf','brain','calculator','flask',
  'scale','chart','pencil','target',
];

/// Construit le chemin asset SVG selon le type.
String _assetPath(String key, String catType) {
  final isPro = catType == 'professionnel';
  // pencil et target existent dans les deux catégories : préférer direct_ par défaut.
  if (_directKeys.contains(key) && !isPro) {
    return 'assets/icons/direct_$key.svg';
  }
  return 'assets/icons/${isPro ? "pro" : "direct"}_$key.svg';
}

/// Mapping nom catégorie (lower-case) → clé d'icône (override emoji).
/// Utile quand l'emoji DB renvoie vers une clé qui n'a pas de SVG côté pro
/// (ex: ⚖️ → 'scale' alors qu'on a 'pro_justice.svg' ; 🌍 → 'globe' alors qu'on a 'pro_newspaper.svg').
String? _keyFromCategoryName(String nom, String catType) {
  final n = nom.toLowerCase();
  final isPro = catType == 'professionnel';
  if (isPro) {
    if (n.contains('greffier') || n.contains('parquet')) return 'justice'; // GREFFIER, SECRÉTAIRE DE GREFFIER ET PARQUET
    if (n.contains('justice') || (n.contains('droit') && !n.contains('impôt') && !n.contains('impot') && !n.contains('travail'))) return 'justice';
    if (n.contains('actualit') || n.contains('culture')) return 'newspaper';
    if (n.contains('magistr')) return 'judge';
    if (n.contains('police')) return 'badge';
    if (n.contains('gsp')) return 'shield';
    if (n.contains('vie scolaire') || n.contains('casu')) return 'school';
    if (n.contains('enaref') && (n.contains('cycle c') || n.contains('cycle_c'))) return 'enaref_c'; // ENAREF CYCLE C
    if (n.contains('cisu') || n.contains('aisu') || n.contains('enaref')) return 'enaref'; // CISU/AISU/ENAREF
    if (n.contains('iepenf') || n.contains('iepe')) return 'search2';
    // 🆕 7 nouveaux dossiers professionnels v3.0.6
    if (n.contains('agent') && n.contains('grh')) return 'grh_agent';
    if (n.contains('assistant') && n.contains('grh')) return 'grh_assistant';
    if (n.contains('conseiller') && n.contains('grh')) return 'target'; // conseiller → target (objectif)
    if (n.contains('géomètre') || n.contains('geometre')) return 'geometre';
    if (n.contains('génie rural') || n.contains('genie rural')) return 'genie_rural';
    if (n.contains('hydraulique')) return 'hydraulique';
    // 🆕 Nouveaux dossiers – priorité AVANT les règles génériques
    if (n.contains('capé') || n.contains('cape')) return 'cape';
    if (n.contains('impôt') || n.contains('impot')) {
      if (n.contains('inspect')) return 'impots_inspecteur';
      return 'impots_controleur';
    }
    if (n.contains('travail')) {
      if (n.contains('inspect')) return 'travail_inspecteur';
      return 'travail_controleur';
    }
    if (n.contains('élevage') || n.contains('elevage') || n.contains('santé animale') || n.contains('sante animale')) {
      if (n.contains('ingénieur') || n.contains('ingenieur')) return 'elevage_ingenieur';
      return 'elevage_technicien';
    }
    if (n.contains('agriculture')) {
      if (n.contains('ingénieur') || n.contains('ingenieur')) return 'agriculture_ingenieur';
      return 'agriculture_technicien';
    }
    if (n.contains('affaires étrangères') || n.contains('affaires etrangeres') || n.contains('étrangère') || n.contains('etrangere') || n.contains('diplomatique')) return 'affaires_etrangeres';
    if (n.contains('douane')) return 'douane';
    // Règles génériques existantes
    if (n.contains('inspect') || n.contains('ies')) return 'search';
    if (n.contains('csap')) return 'graduation';
    if (n.contains('agrég') || n.contains('agreg')) return 'scroll';
    if (n.contains('capes')) return 'openbook';
    if (n.contains('hôpital') || n.contains('hopital') || n.contains('pital')) return 'hospital';
    if (n.contains('santé') || n.contains('sant')) return 'health';
    if (n.contains('civil') || n.contains('admin')) return 'clipboard';
    if (n.contains('qcm') || n.contains('entraîn') || n.contains('entrain')) return 'pencil';
    if (n.contains('accompagn') || n.contains('final')) return 'target';
  } else {
    if (n.contains('actualit') || n.contains('culture')) return 'globe';
    if (n.contains('français') || n.contains('franc')) return 'book';
    if (n.contains('littérature') || n.contains('art')) return 'palette';
    if (n.contains('histoire') || n.contains('géographie') || n.contains('h-g')) return 'map';
    if (n.contains('svt') || n.contains('science')) return 'leaf';
    if (n.contains('psycho')) return 'brain';
    if (n.contains('math')) return 'calculator';
    if (n.contains('physique') || n.contains('chimie')) return 'flask';
    if (n.contains('droit') || n.contains('justice')) return 'scale';
    if (n.contains('conomie')) return 'chart';
    if (n.contains('qcm') || n.contains('entraîn')) return 'pencil';
    if (n.contains('accompagn') || n.contains('final')) return 'target';
  }
  return null;
}

/// Affiche l'icône SVG correspondant à une catégorie (compatible avec emoji, nom ou clé directe).
class CatIcon extends StatelessWidget {
  final String? name;
  final String? categoryName; // nouveau : passer le nom de catégorie pour un mapping fiable
  final String catType;
  final double size;

  const CatIcon({
    super.key,
    this.name,
    this.categoryName,
    this.catType = 'direct',
    this.size = 36,
  });

  String _resolveKey() {
    // 1) Si un nom de catégorie est fourni, on tente le mapping par nom (le plus fiable)
    final catName = (categoryName ?? '').trim();
    if (catName.isNotEmpty) {
      final byName = _keyFromCategoryName(catName, catType);
      if (byName != null) return byName;
    }
    // 2) Fallback : mapping par emoji ou clé directe
    final raw = (name ?? '').trim();
    return _emojiToKey[raw] ?? (raw.isEmpty ? 'book' : raw);
  }

  @override
  Widget build(BuildContext context) {
    final key = _resolveKey();
    final path = _assetPath(key, catType);
    return SvgPicture.asset(
      path,
      width: size,
      height: size,
      placeholderBuilder: (_) => Icon(
        Icons.menu_book_rounded,
        size: size,
        color: catType == 'professionnel'
            ? const Color(0xFF0369A1)
            : const Color(0xFFC4521A),
      ),
    );
  }
}

/// Couleurs par icône (extrait de pages/index.js)
class IconStyle {
  final Color border;
  final Color tag;
  final Color tagText;
  final List<Color> bgGradient;
  const IconStyle({
    required this.border,
    required this.tag,
    required this.tagText,
    required this.bgGradient,
  });
}

const Map<String, IconStyle> _directIconColors = {
  'globe':      IconStyle(bgGradient: [Color(0xFF0EA5E9), Color(0xFF0369A1)], border: Color(0xFFBAE6FD), tag: Color(0xFFF0F9FF), tagText: Color(0xFF0369A1)),
  'book':       IconStyle(bgGradient: [Color(0xFF7C3AED), Color(0xFFA855F7)], border: Color(0xFFDDD6FE), tag: Color(0xFFF3E8FF), tagText: Color(0xFF7C3AED)),
  'palette':    IconStyle(bgGradient: [Color(0xFFEC4899), Color(0xFFF472B6)], border: Color(0xFFFBCFE8), tag: Color(0xFFFDF2F8), tagText: Color(0xFFEC4899)),
  'map':        IconStyle(bgGradient: [Color(0xFFF5871F), Color(0xFFF59E0B)], border: Color(0xFFFED7AA), tag: Color(0xFFFFF7ED), tagText: Color(0xFFB45309)),
  'leaf':       IconStyle(bgGradient: [Color(0xFFD97706), Color(0xFFF59E0B)], border: Color(0xFFFED7AA), tag: Color(0xFFFFFBEB), tagText: Color(0xFFB45309)),
  'brain':      IconStyle(bgGradient: [Color(0xFFDC2626), Color(0xFFEF4444)], border: Color(0xFFFECACA), tag: Color(0xFFFEF2F2), tagText: Color(0xFFDC2626)),
  'calculator': IconStyle(bgGradient: [Color(0xFFD97706), Color(0xFFF59E0B)], border: Color(0xFFFDE68A), tag: Color(0xFFFFFBEB), tagText: Color(0xFFD97706)),
  'flask':      IconStyle(bgGradient: [Color(0xFF2563EB), Color(0xFF3B82F6)], border: Color(0xFFBFDBFE), tag: Color(0xFFEFF6FF), tagText: Color(0xFF2563EB)),
  'scale':      IconStyle(bgGradient: [Color(0xFF0EA5E9), Color(0xFF0369A1)], border: Color(0xFFBAE6FD), tag: Color(0xFFF0F9FF), tagText: Color(0xFF0369A1)),
  'chart':      IconStyle(bgGradient: [Color(0xFF0F766E), Color(0xFF14B8A6)], border: Color(0xFF99F6E4), tag: Color(0xFFF0FDFA), tagText: Color(0xFF0F766E)),
  'pencil':     IconStyle(bgGradient: [Color(0xFF9333EA), Color(0xFFC084FC)], border: Color(0xFFE9D5FF), tag: Color(0xFFFAF5FF), tagText: Color(0xFF9333EA)),
  'target':     IconStyle(bgGradient: [Color(0xFFC4521A), Color(0xFFD4A017)], border: Color(0xFFFED7AA), tag: Color(0xFFFFF7ED), tagText: Color(0xFFC4521A)),
};

// Palette Pro = bleu ciel / bleu marin harmonisée (pas de vert / pas de violet)
const Map<String, IconStyle> _proIconColors = {
  'school':                 IconStyle(bgGradient: [Color(0xFF0369A1), Color(0xFF0EA5E9)], border: Color(0xFFBAE6FD), tag: Color(0xFFF0F9FF), tagText: Color(0xFF0369A1)),
  'newspaper':              IconStyle(bgGradient: [Color(0xFF0284C7), Color(0xFF38BDF8)], border: Color(0xFFBAE6FD), tag: Color(0xFFF0F9FF), tagText: Color(0xFF0284C7)),
  'building':               IconStyle(bgGradient: [Color(0xFF075985), Color(0xFF0EA5E9)], border: Color(0xFFBAE6FD), tag: Color(0xFFF0F9FF), tagText: Color(0xFF075985)),
  'search':                 IconStyle(bgGradient: [Color(0xFF1E40AF), Color(0xFF3B82F6)], border: Color(0xFFBFDBFE), tag: Color(0xFFEFF6FF), tagText: Color(0xFF1E40AF)),
  'search2':                IconStyle(bgGradient: [Color(0xFF2563EB), Color(0xFF60A5FA)], border: Color(0xFFBFDBFE), tag: Color(0xFFEFF6FF), tagText: Color(0xFF2563EB)),
  'graduation':             IconStyle(bgGradient: [Color(0xFF0369A1), Color(0xFF0EA5E9)], border: Color(0xFFBAE6FD), tag: Color(0xFFF0F9FF), tagText: Color(0xFF0369A1)),
  'scroll':                 IconStyle(bgGradient: [Color(0xFF0E7490), Color(0xFF22D3EE)], border: Color(0xFFA5F3FC), tag: Color(0xFFECFEFF), tagText: Color(0xFF0E7490)),
  'openbook':               IconStyle(bgGradient: [Color(0xFF0369A1), Color(0xFF0EA5E9)], border: Color(0xFFBAE6FD), tag: Color(0xFFF0F9FF), tagText: Color(0xFF0369A1)),
  'hospital':               IconStyle(bgGradient: [Color(0xFF0284C7), Color(0xFF38BDF8)], border: Color(0xFFBAE6FD), tag: Color(0xFFF0F9FF), tagText: Color(0xFF0284C7)),
  'health':                 IconStyle(bgGradient: [Color(0xFF155E75), Color(0xFF06B6D4)], border: Color(0xFFA5F3FC), tag: Color(0xFFECFEFF), tagText: Color(0xFF155E75)),
  'justice':                IconStyle(bgGradient: [Color(0xFF0369A1), Color(0xFF0EA5E9)], border: Color(0xFFBAE6FD), tag: Color(0xFFF0F9FF), tagText: Color(0xFF0369A1)),
  'judge':                  IconStyle(bgGradient: [Color(0xFF1E40AF), Color(0xFF3B82F6)], border: Color(0xFFBFDBFE), tag: Color(0xFFEFF6FF), tagText: Color(0xFF1E40AF)),
  'shield':                 IconStyle(bgGradient: [Color(0xFF075985), Color(0xFF0EA5E9)], border: Color(0xFFBAE6FD), tag: Color(0xFFF0F9FF), tagText: Color(0xFF075985)),
  'badge':                  IconStyle(bgGradient: [Color(0xFF1E3A8A), Color(0xFF2563EB)], border: Color(0xFFBFDBFE), tag: Color(0xFFEFF6FF), tagText: Color(0xFF1E3A8A)),
  'clipboard':              IconStyle(bgGradient: [Color(0xFF0E7490), Color(0xFF06B6D4)], border: Color(0xFFA5F3FC), tag: Color(0xFFECFEFF), tagText: Color(0xFF0E7490)),
  'pencil':                 IconStyle(bgGradient: [Color(0xFF0369A1), Color(0xFF38BDF8)], border: Color(0xFFBAE6FD), tag: Color(0xFFF0F9FF), tagText: Color(0xFF0369A1)),
  'target':                 IconStyle(bgGradient: [Color(0xFF0284C7), Color(0xFF0EA5E9)], border: Color(0xFFBAE6FD), tag: Color(0xFFF0F9FF), tagText: Color(0xFF0284C7)),
  // 🆕 Nouveaux dossiers professionnels
  'cape':                   IconStyle(bgGradient: [Color(0xFF1E40AF), Color(0xFF3B82F6)], border: Color(0xFFBFDBFE), tag: Color(0xFFEFF6FF), tagText: Color(0xFF1E40AF)),
  'impots_inspecteur':      IconStyle(bgGradient: [Color(0xFF0369A1), Color(0xFF0EA5E9)], border: Color(0xFFBAE6FD), tag: Color(0xFFF0F9FF), tagText: Color(0xFF0369A1)),
  'impots_controleur':      IconStyle(bgGradient: [Color(0xFF075985), Color(0xFF0284C7)], border: Color(0xFFBAE6FD), tag: Color(0xFFF0F9FF), tagText: Color(0xFF075985)),
  'enaref':                 IconStyle(bgGradient: [Color(0xFF1E3A8A), Color(0xFF2563EB)], border: Color(0xFFBFDBFE), tag: Color(0xFFEFF6FF), tagText: Color(0xFF1E3A8A)),
  'travail_inspecteur':     IconStyle(bgGradient: [Color(0xFF0E7490), Color(0xFF22D3EE)], border: Color(0xFFA5F3FC), tag: Color(0xFFECFEFF), tagText: Color(0xFF0E7490)),
  'travail_controleur':     IconStyle(bgGradient: [Color(0xFF0369A1), Color(0xFF38BDF8)], border: Color(0xFFBAE6FD), tag: Color(0xFFF0F9FF), tagText: Color(0xFF0369A1)),
  'elevage_technicien':     IconStyle(bgGradient: [Color(0xFF155E75), Color(0xFF06B6D4)], border: Color(0xFFA5F3FC), tag: Color(0xFFECFEFF), tagText: Color(0xFF155E75)),
  'elevage_ingenieur':      IconStyle(bgGradient: [Color(0xFF0284C7), Color(0xFF38BDF8)], border: Color(0xFFBAE6FD), tag: Color(0xFFF0F9FF), tagText: Color(0xFF0284C7)),
  'agriculture_technicien': IconStyle(bgGradient: [Color(0xFF0369A1), Color(0xFF0EA5E9)], border: Color(0xFFBAE6FD), tag: Color(0xFFF0F9FF), tagText: Color(0xFF0369A1)),
  'agriculture_ingenieur':  IconStyle(bgGradient: [Color(0xFF075985), Color(0xFF0EA5E9)], border: Color(0xFFBAE6FD), tag: Color(0xFFF0F9FF), tagText: Color(0xFF075985)),
  'affaires_etrangeres':    IconStyle(bgGradient: [Color(0xFF1E40AF), Color(0xFF3B82F6)], border: Color(0xFFBFDBFE), tag: Color(0xFFEFF6FF), tagText: Color(0xFF1E40AF)),
  'douane':                 IconStyle(bgGradient: [Color(0xFF075985), Color(0xFF0369A1)], border: Color(0xFFBAE6FD), tag: Color(0xFFF0F9FF), tagText: Color(0xFF075985)),
  // 🆕 7 nouveaux dossiers v3.0.6
  'grh_agent':              IconStyle(bgGradient: [Color(0xFF0369A1), Color(0xFF0EA5E9)], border: Color(0xFFBAE6FD), tag: Color(0xFFF0F9FF), tagText: Color(0xFF0369A1)),
  'grh_assistant':          IconStyle(bgGradient: [Color(0xFF0E7490), Color(0xFF06B6D4)], border: Color(0xFFA5F3FC), tag: Color(0xFFECFEFF), tagText: Color(0xFF0E7490)),
  'geometre':               IconStyle(bgGradient: [Color(0xFF1E40AF), Color(0xFF3B82F6)], border: Color(0xFFBFDBFE), tag: Color(0xFFEFF6FF), tagText: Color(0xFF1E40AF)),
  'genie_rural':            IconStyle(bgGradient: [Color(0xFF0369A1), Color(0xFF0EA5E9)], border: Color(0xFFBAE6FD), tag: Color(0xFFF0F9FF), tagText: Color(0xFF0369A1)),
  'hydraulique':            IconStyle(bgGradient: [Color(0xFF0284C7), Color(0xFF38BDF8)], border: Color(0xFFBAE6FD), tag: Color(0xFFF0F9FF), tagText: Color(0xFF0284C7)),
  'enaref_c':               IconStyle(bgGradient: [Color(0xFF1E3A8A), Color(0xFF2563EB)], border: Color(0xFFBFDBFE), tag: Color(0xFFEFF6FF), tagText: Color(0xFF1E3A8A)),
};

IconStyle iconStyleFor(String? icone, String catType, {String? categoryName}) {
  // 1) Tente le mapping par nom de catégorie (le plus fiable)
  final catName = (categoryName ?? '').trim();
  String? key;
  if (catName.isNotEmpty) {
    key = _keyFromCategoryName(catName, catType);
  }
  // 2) Fallback : mapping par emoji ou clé directe
  if (key == null) {
    final raw = (icone ?? '').trim();
    key = _emojiToKey[raw] ?? (raw.isEmpty ? 'book' : raw);
  }
  final pal = catType == 'professionnel' ? _proIconColors : _directIconColors;
  return pal[key] ??
      (catType == 'professionnel'
          ? const IconStyle(bgGradient: [Color(0xFF0EA5E9), Color(0xFF0369A1)], border: Color(0xFFBAE6FD), tag: Color(0xFFF0F9FF), tagText: Color(0xFF0369A1))
          : const IconStyle(bgGradient: [Color(0xFFC4521A), Color(0xFFD4A017)], border: Color(0xFFFED7AA), tag: Color(0xFFFFF7ED), tagText: Color(0xFFC4521A)));
}
