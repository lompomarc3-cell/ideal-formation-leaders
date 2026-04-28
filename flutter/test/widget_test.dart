// Smoke test pour l'application IFL Flutter.
import 'package:flutter_test/flutter_test.dart';

import 'package:ifl/main.dart';

void main() {
  testWidgets('IFLApp builds without error', (WidgetTester tester) async {
    await tester.pumpWidget(const IFLApp());
    // Le splash screen est affiché au démarrage.
    expect(find.byType(IFLApp), findsOneWidget);
  });
}
