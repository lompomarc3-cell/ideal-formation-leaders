import 'package:flutter_test/flutter_test.dart';
import 'package:ideal_formation_leaders/main.dart';

void main() {
  testWidgets('IFL App smoke test', (WidgetTester tester) async {
    // Build IFL App
    await tester.pumpWidget(const IFLApp());
  });
}
