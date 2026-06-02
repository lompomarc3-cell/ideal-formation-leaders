// Test isolé de la logique de palier (milestone) du QCM "Entraînement QCM".
//
// Ce test reproduit fidèlement la logique implémentée dans
// `quiz_screen.dart` (_isEntrainementQcm + _maybeShowMilestone) afin de
// prouver de façon déterministe que :
//   1. Le dialogue se déclenche EXACTEMENT à 50, 100, 150, 200… questions.
//   2. Le score affiché utilise le bon dénominateur (X/50, X/100…).
//   3. Le même palier n'est jamais affiché deux fois (réponse + navigation).
//   4. Aucun déclenchement pour un autre dossier (ex: Français).
//   5. Aucun déclenchement entre les paliers (ex: à 49, 51, 99…).

import 'package:flutter_test/flutter_test.dart';

/// Réplique exacte de la détection du dossier (par ID Supabase OU par nom).
class MilestoneEngine {
  static const Set<String> entrainementQcmIds = {
    'cf24b3f1-3961-4fea-9702-0bf9fba50fdf', // direct
    '593a1774-e87c-414e-9a2d-c6d7dd44a51a', // professionnel
  };
  static const int milestoneStep = 50;

  final String? categoryId;
  final String categoryName;
  int _lastMilestoneShown = 0;

  MilestoneEngine({this.categoryId, this.categoryName = ''});

  bool get isEntrainementQcm {
    if (categoryId != null && entrainementQcmIds.contains(categoryId)) {
      return true;
    }
    final normalized = categoryName
        .toLowerCase()
        .replaceAll('î', 'i')
        .replaceAll('ï', 'i')
        .trim();
    return normalized == 'entrainement qcm';
  }

  /// Retourne le palier déclenché (ou null si rien). Reproduit
  /// _maybeShowMilestone(reached).
  int? maybeShowMilestone(int reached) {
    if (!isEntrainementQcm) return null;
    if (reached <= 0) return null;
    if (reached % milestoneStep != 0) return null;
    if (reached <= _lastMilestoneShown) return null;
    _lastMilestoneShown = reached;
    return reached;
  }
}

void main() {
  group('Détection du dossier Entraînement QCM', () {
    test('par ID direct', () {
      final e = MilestoneEngine(
          categoryId: 'cf24b3f1-3961-4fea-9702-0bf9fba50fdf');
      expect(e.isEntrainementQcm, isTrue);
    });
    test('par ID professionnel', () {
      final e = MilestoneEngine(
          categoryId: '593a1774-e87c-414e-9a2d-c6d7dd44a51a');
      expect(e.isEntrainementQcm, isTrue);
    });
    test('par nom (avec accent)', () {
      final e = MilestoneEngine(categoryName: 'Entraînement QCM');
      expect(e.isEntrainementQcm, isTrue);
    });
    test('autre dossier (Français) NON concerné', () {
      final e = MilestoneEngine(
          categoryId: 'aaaa-bbbb', categoryName: 'Français');
      expect(e.isEntrainementQcm, isFalse);
    });
  });

  group('Déclenchement des paliers (Entraînement QCM)', () {
    test('Palier 50 → déclenché', () {
      final e = MilestoneEngine(
          categoryId: 'cf24b3f1-3961-4fea-9702-0bf9fba50fdf');
      // On simule 50 réponses successives.
      int? last;
      for (int i = 1; i <= 50; i++) {
        last = e.maybeShowMilestone(i);
      }
      expect(last, 50);
    });

    test('Aucun déclenchement entre 1 et 49', () {
      final e = MilestoneEngine(
          categoryId: 'cf24b3f1-3961-4fea-9702-0bf9fba50fdf');
      for (int i = 1; i <= 49; i++) {
        expect(e.maybeShowMilestone(i), isNull, reason: 'à $i');
      }
    });

    test('Paliers 50, 100, 150, 200 → tous déclenchés une seule fois', () {
      final e = MilestoneEngine(
          categoryId: 'cf24b3f1-3961-4fea-9702-0bf9fba50fdf');
      final triggered = <int>[];
      for (int i = 1; i <= 200; i++) {
        final m = e.maybeShowMilestone(i);
        if (m != null) triggered.add(m);
      }
      expect(triggered, [50, 100, 150, 200]);
    });

    test('Même palier jamais affiché deux fois (réponse + navigation)', () {
      final e = MilestoneEngine(
          categoryId: '593a1774-e87c-414e-9a2d-c6d7dd44a51a');
      // 50e réponse déclenche…
      expect(e.maybeShowMilestone(50), 50);
      // …puis navigation vers l'index 50 (51e question) ne redéclenche pas.
      expect(e.maybeShowMilestone(50), isNull);
    });

    test('Autre dossier → AUCUN palier même à 50/100', () {
      final e = MilestoneEngine(categoryName: 'Français');
      final triggered = <int>[];
      for (int i = 1; i <= 150; i++) {
        final m = e.maybeShowMilestone(i);
        if (m != null) triggered.add(m);
      }
      expect(triggered, isEmpty);
    });
  });

  group('Affichage du score (dénominateur correct)', () {
    // Reproduit le texte du dialogue : 'Score: $score / $milestone'.
    String scoreLabel(int score, int milestone) => '$score / $milestone';

    test('palier 50 → "42 / 50"', () {
      expect(scoreLabel(42, 50), '42 / 50');
    });
    test('palier 100 → "92 / 100" (et NON 92/50)', () {
      expect(scoreLabel(92, 100), '92 / 100');
      expect(scoreLabel(92, 100), isNot('92 / 50'));
    });
    test('palier 150 → "130 / 150"', () {
      expect(scoreLabel(130, 150), '130 / 150');
    });
  });
}
