import 'package:flutter/material.dart';
import 'package:flutter_math_fork/flutter_math.dart';

/// Widget qui affiche du texte avec support des symboles mathématiques LaTeX.
///
/// Supporte les formats :
///   - Inline LaTeX  : `$...$`      → formule inline
///   - Block LaTeX   : `$$...$$`    → formule en bloc (centrée)
///   - Texte brut    : le reste est affiché normalement
///
/// Exemples :
///   - "Calculer $\frac{1}{2}$ + $\sqrt{3}$"
///   - "Résoudre $$x^2 + y^2 = z^2$$"
///   - "La surface est 25 km²" (caractères Unicode directs)
class MathText extends StatelessWidget {
  final String text;
  final TextStyle? style;
  final TextAlign textAlign;

  const MathText(
    this.text, {
    super.key,
    this.style,
    this.textAlign = TextAlign.left,
  });

  /// Vérifie si le texte contient des formules LaTeX ($...$ ou $$...$$)
  static bool hasLatex(String text) {
    return text.contains(r'$') ||
        text.contains(r'\frac') ||
        text.contains(r'\sqrt') ||
        text.contains(r'\sum') ||
        text.contains(r'\int') ||
        text.contains(r'\pi') ||
        text.contains(r'\alpha') ||
        text.contains(r'\beta') ||
        text.contains(r'\theta') ||
        text.contains(r'\infty');
  }

  @override
  Widget build(BuildContext context) {
    final effectiveStyle = style ??
        DefaultTextStyle.of(context).style.copyWith(
              fontSize: 15,
              height: 1.5,
            );

    if (!hasLatex(text)) {
      // Pas de LaTeX → affichage texte simple (Unicode déjà géré nativement)
      return Text(
        text,
        style: effectiveStyle,
        textAlign: textAlign,
      );
    }

    // Parser le texte en segments : texte normal | LaTeX inline | LaTeX bloc
    final segments = _parseSegments(text);

    if (segments.every((s) => s.type == _SegType.text)) {
      return Text(text, style: effectiveStyle, textAlign: textAlign);
    }

    // Construire un Column ou Wrap selon le contenu
    final hasBlock = segments.any((s) => s.type == _SegType.block);

    if (hasBlock) {
      // Blocs : on utilise une colonne
      return Column(
        crossAxisAlignment: textAlign == TextAlign.center
            ? CrossAxisAlignment.center
            : CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: segments.map((s) => _buildSegment(s, effectiveStyle)).toList(),
      );
    }

    // Inline uniquement : utiliser RichText avec WidgetSpan pour les formules
    return Wrap(
      alignment: textAlign == TextAlign.center
          ? WrapAlignment.center
          : WrapAlignment.start,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: segments.map((s) => _buildInlineSegment(s, effectiveStyle)).toList(),
    );
  }

  Widget _buildSegment(_Segment s, TextStyle style) {
    if (s.type == _SegType.text) {
      return Text(s.content, style: style, textAlign: textAlign);
    }
    if (s.type == _SegType.block) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Center(
          child: _buildMathWidget(s.content, style, displayStyle: true),
        ),
      );
    }
    return _buildMathWidget(s.content, style);
  }

  Widget _buildInlineSegment(_Segment s, TextStyle style) {
    if (s.type == _SegType.text) {
      return Text(s.content, style: style);
    }
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 1),
      child: _buildMathWidget(s.content, style,
          displayStyle: s.type == _SegType.block),
    );
  }

  Widget _buildMathWidget(String latex, TextStyle style,
      {bool displayStyle = false}) {
    try {
      return Math.tex(
        latex,
        mathStyle: displayStyle ? MathStyle.display : MathStyle.text,
        textStyle: style,
        onErrorFallback: (err) {
          // En cas d'erreur de parsing LaTeX, on affiche le texte brut
          return Text(
            latex,
            style: style.copyWith(
              color: Colors.orange.shade700,
              fontFamily: 'monospace',
            ),
          );
        },
      );
    } catch (_) {
      return Text(latex, style: style);
    }
  }

  /// Découpe le texte en segments : texte normal, LaTeX inline ($...$),
  /// LaTeX bloc ($$...$$).
  List<_Segment> _parseSegments(String input) {
    final segments = <_Segment>[];
    int i = 0;
    final buf = StringBuffer();

    while (i < input.length) {
      // Détecter $$...$$  (bloc)
      if (i + 1 < input.length && input[i] == '\$' && input[i + 1] == '\$') {
        final end = input.indexOf('\$\$', i + 2);
        if (end != -1) {
          if (buf.isNotEmpty) {
            segments.add(_Segment(_SegType.text, buf.toString()));
            buf.clear();
          }
          segments.add(_Segment(_SegType.block, input.substring(i + 2, end)));
          i = end + 2;
          continue;
        }
      }

      // Détecter $...$ (inline)
      if (input[i] == '\$') {
        final end = input.indexOf('\$', i + 1);
        if (end != -1 && end > i + 1) {
          final formula = input.substring(i + 1, end);
          // Éviter de traiter les faux-positifs (ex: prix en FCFA)
          if (_isValidLatex(formula)) {
            if (buf.isNotEmpty) {
              segments.add(_Segment(_SegType.text, buf.toString()));
              buf.clear();
            }
            segments.add(_Segment(_SegType.inline, formula));
            i = end + 1;
            continue;
          }
        }
      }

      buf.write(input[i]);
      i++;
    }

    if (buf.isNotEmpty) {
      segments.add(_Segment(_SegType.text, buf.toString()));
    }

    return segments;
  }

  /// Vérifie si la chaîne entre $ ressemble à du LaTeX valide
  bool _isValidLatex(String s) {
    if (s.isEmpty || s.length > 200) return false;
    // Contient des commandes LaTeX ou des opérateurs mathématiques
    return s.contains('\\') ||
        s.contains('^') ||
        s.contains('_') ||
        RegExp(r'[+\-*/=<>]').hasMatch(s) ||
        RegExp(r'\d').hasMatch(s);
  }
}

enum _SegType { text, inline, block }

class _Segment {
  final _SegType type;
  final String content;
  const _Segment(this.type, this.content);
}
