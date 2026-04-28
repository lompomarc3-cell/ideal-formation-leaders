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

/// Affiche l'icône SVG correspondant à une catégorie (compatible avec emoji ou clé directe).
class CatIcon extends StatelessWidget {
  final String? name;
  final String catType;
  final double size;

  const CatIcon({
    super.key,
    this.name,
    this.catType = 'direct',
    this.size = 36,
  });

  @override
  Widget build(BuildContext context) {
    final raw = (name ?? '').trim();
    final key = _emojiToKey[raw] ?? (raw.isEmpty ? 'book' : raw);
    final path = _assetPath(key, catType);
    return SvgPicture.asset(
      path,
      width: size,
      height: size,
      placeholderBuilder: (_) => Icon(Icons.book, size: size, color: const Color(0xFFC4521A)),
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
  'globe':      IconStyle(bgGradient: [Color(0xFF0891B2), Color(0xFF06B6D4)], border: Color(0xFFA5F3FC), tag: Color(0xFFE0F7FF), tagText: Color(0xFF0891B2)),
  'book':       IconStyle(bgGradient: [Color(0xFF7C3AED), Color(0xFFA855F7)], border: Color(0xFFDDD6FE), tag: Color(0xFFF3E8FF), tagText: Color(0xFF7C3AED)),
  'palette':    IconStyle(bgGradient: [Color(0xFFEC4899), Color(0xFFF472B6)], border: Color(0xFFFBCFE8), tag: Color(0xFFFDF2F8), tagText: Color(0xFFEC4899)),
  'map':        IconStyle(bgGradient: [Color(0xFF059669), Color(0xFF10B981)], border: Color(0xFFA7F3D0), tag: Color(0xFFECFDF5), tagText: Color(0xFF059669)),
  'leaf':       IconStyle(bgGradient: [Color(0xFF16A34A), Color(0xFF22C55E)], border: Color(0xFFBBF7D0), tag: Color(0xFFF0FDF4), tagText: Color(0xFF16A34A)),
  'brain':      IconStyle(bgGradient: [Color(0xFFDC2626), Color(0xFFEF4444)], border: Color(0xFFFECACA), tag: Color(0xFFFEF2F2), tagText: Color(0xFFDC2626)),
  'calculator': IconStyle(bgGradient: [Color(0xFFD97706), Color(0xFFF59E0B)], border: Color(0xFFFDE68A), tag: Color(0xFFFFFBEB), tagText: Color(0xFFD97706)),
  'flask':      IconStyle(bgGradient: [Color(0xFF2563EB), Color(0xFF3B82F6)], border: Color(0xFFBFDBFE), tag: Color(0xFFEFF6FF), tagText: Color(0xFF2563EB)),
  'scale':      IconStyle(bgGradient: [Color(0xFFB45309), Color(0xFFD97706)], border: Color(0xFFFDE68A), tag: Color(0xFFFFFBEB), tagText: Color(0xFFB45309)),
  'chart':      IconStyle(bgGradient: [Color(0xFF0F766E), Color(0xFF14B8A6)], border: Color(0xFF99F6E4), tag: Color(0xFFF0FDFA), tagText: Color(0xFF0F766E)),
  'pencil':     IconStyle(bgGradient: [Color(0xFF9333EA), Color(0xFFC084FC)], border: Color(0xFFE9D5FF), tag: Color(0xFFFAF5FF), tagText: Color(0xFF9333EA)),
  'target':     IconStyle(bgGradient: [Color(0xFFC4521A), Color(0xFFD4A017)], border: Color(0xFFFED7AA), tag: Color(0xFFFFF7ED), tagText: Color(0xFFC4521A)),
};

const Map<String, IconStyle> _proIconColors = {
  'school':     IconStyle(bgGradient: [Color(0xFF1E40AF), Color(0xFF3B82F6)], border: Color(0xFFBFDBFE), tag: Color(0xFFEFF6FF), tagText: Color(0xFF1E40AF)),
  'newspaper':  IconStyle(bgGradient: [Color(0xFF047857), Color(0xFF10B981)], border: Color(0xFFA7F3D0), tag: Color(0xFFECFDF5), tagText: Color(0xFF047857)),
  'building':   IconStyle(bgGradient: [Color(0xFF1D4ED8), Color(0xFF2563EB)], border: Color(0xFFBFDBFE), tag: Color(0xFFEFF6FF), tagText: Color(0xFF1D4ED8)),
  'search':     IconStyle(bgGradient: [Color(0xFF6D28D9), Color(0xFF8B5CF6)], border: Color(0xFFDDD6FE), tag: Color(0xFFF5F3FF), tagText: Color(0xFF6D28D9)),
  'search2':    IconStyle(bgGradient: [Color(0xFF7C3AED), Color(0xFFA78BFA)], border: Color(0xFFEDE9FE), tag: Color(0xFFF5F3FF), tagText: Color(0xFF7C3AED)),
  'graduation': IconStyle(bgGradient: [Color(0xFFB45309), Color(0xFFF59E0B)], border: Color(0xFFFDE68A), tag: Color(0xFFFFFBEB), tagText: Color(0xFFB45309)),
  'scroll':     IconStyle(bgGradient: [Color(0xFF92400E), Color(0xFFD97706)], border: Color(0xFFFDE68A), tag: Color(0xFFFFFBEB), tagText: Color(0xFF92400E)),
  'openbook':   IconStyle(bgGradient: [Color(0xFF0369A1), Color(0xFF0EA5E9)], border: Color(0xFFBAE6FD), tag: Color(0xFFF0F9FF), tagText: Color(0xFF0369A1)),
  'hospital':   IconStyle(bgGradient: [Color(0xFFDC2626), Color(0xFFF87171)], border: Color(0xFFFECACA), tag: Color(0xFFFEF2F2), tagText: Color(0xFFDC2626)),
  'health':     IconStyle(bgGradient: [Color(0xFFBE185D), Color(0xFFEC4899)], border: Color(0xFFFBCFE8), tag: Color(0xFFFDF2F8), tagText: Color(0xFFBE185D)),
  'justice':    IconStyle(bgGradient: [Color(0xFF1E3A5F), Color(0xFF1D5AB4)], border: Color(0xFFC7D2FE), tag: Color(0xFFEEF2FF), tagText: Color(0xFF1E3A5F)),
  'judge':      IconStyle(bgGradient: [Color(0xFF374151), Color(0xFF6B7280)], border: Color(0xFFD1D5DB), tag: Color(0xFFF9FAFB), tagText: Color(0xFF374151)),
  'shield':     IconStyle(bgGradient: [Color(0xFF1F2937), Color(0xFF374151)], border: Color(0xFFD1D5DB), tag: Color(0xFFF9FAFB), tagText: Color(0xFF1F2937)),
  'badge':      IconStyle(bgGradient: [Color(0xFF1E3A8A), Color(0xFF1D4ED8)], border: Color(0xFFBFDBFE), tag: Color(0xFFEFF6FF), tagText: Color(0xFF1E3A8A)),
  'clipboard':  IconStyle(bgGradient: [Color(0xFF065F46), Color(0xFF059669)], border: Color(0xFFA7F3D0), tag: Color(0xFFECFDF5), tagText: Color(0xFF065F46)),
  'pencil':     IconStyle(bgGradient: [Color(0xFF9333EA), Color(0xFFC084FC)], border: Color(0xFFE9D5FF), tag: Color(0xFFFAF5FF), tagText: Color(0xFF9333EA)),
  'target':     IconStyle(bgGradient: [Color(0xFFB45309), Color(0xFFD97706)], border: Color(0xFFFDE68A), tag: Color(0xFFFFFBEB), tagText: Color(0xFFB45309)),
};

IconStyle iconStyleFor(String? icone, String catType) {
  final raw = (icone ?? '').trim();
  final key = _emojiToKey[raw] ?? (raw.isEmpty ? 'book' : raw);
  final pal = catType == 'professionnel' ? _proIconColors : _directIconColors;
  return pal[key] ??
      (catType == 'professionnel'
          ? const IconStyle(bgGradient: [Color(0xFF1D5AB4), Color(0xFF2E7DD6)], border: Color(0xFFA8C4F0), tag: Color(0xFFEEF3FF), tagText: Color(0xFF1D5AB4))
          : const IconStyle(bgGradient: [Color(0xFF059669), Color(0xFF10B981)], border: Color(0xFFA7F3D0), tag: Color(0xFFECFDF5), tagText: Color(0xFF059669)));
}
