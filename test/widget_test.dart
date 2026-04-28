import 'package:flutter_test/flutter_test.dart';
import 'package:ifl_app/main.dart';

void main() {
  testWidgets('App loads', (WidgetTester tester) async {
    await tester.pumpWidget(const IFLApp());
    await tester.pump();
    expect(find.text('IFL'), findsWidgets);
  });
}
