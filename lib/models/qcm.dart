/// Modèle QCM aligné sur le schéma Supabase réel :
/// id, category_id, enonce, option_a/b/c/d, reponse_correcte (A/B/C/D), explication, is_demo
class QcmQuestion {
  final String id;
  final String question;
  final List<String> options;
  final int correctIndex; // 0..3
  final String? explanation;
  final String dossierId;
  final bool isDemo;

  QcmQuestion({
    required this.id,
    required this.question,
    required this.options,
    required this.correctIndex,
    this.explanation,
    required this.dossierId,
    this.isDemo = false,
  });

  factory QcmQuestion.fromSupabase(Map<String, dynamic> json) {
    final options = <String>[
      (json['option_a'] ?? '').toString(),
      (json['option_b'] ?? '').toString(),
      (json['option_c'] ?? '').toString(),
      (json['option_d'] ?? '').toString(),
    ];
    final letter = (json['reponse_correcte'] ?? 'A').toString().toUpperCase();
    int correctIdx;
    switch (letter) {
      case 'A':
        correctIdx = 0;
        break;
      case 'B':
        correctIdx = 1;
        break;
      case 'C':
        correctIdx = 2;
        break;
      case 'D':
        correctIdx = 3;
        break;
      default:
        correctIdx = 0;
    }
    return QcmQuestion(
      id: (json['id'] ?? '').toString(),
      question: (json['enonce'] ?? '').toString(),
      options: options,
      correctIndex: correctIdx,
      explanation: json['explication']?.toString(),
      dossierId: (json['category_id'] ?? '').toString(),
      isDemo: json['is_demo'] == true,
    );
  }
}

/// Banque locale de 10 questions de démo (utilisée si aucune n'est trouvée en BD)
class DemoQuestions {
  static List<QcmQuestion> get questions => [
        QcmQuestion(
          id: 'demo_1',
          question: 'Quelle est la capitale du Burkina Faso ?',
          options: ['Bobo-Dioulasso', 'Ouagadougou', 'Koudougou', 'Banfora'],
          correctIndex: 1,
          explanation: 'Ouagadougou est la capitale et plus grande ville du Burkina Faso.',
          dossierId: 'demo',
          isDemo: true,
        ),
        QcmQuestion(
          id: 'demo_2',
          question: 'Combien de régions compte le Burkina Faso ?',
          options: ['11', '12', '13', '14'],
          correctIndex: 2,
          explanation: 'Le Burkina Faso compte 13 régions administratives.',
          dossierId: 'demo',
          isDemo: true,
        ),
        QcmQuestion(
          id: 'demo_3',
          question: 'Qui a dirigé la révolution burkinabè de 1983 ?',
          options: ['Maurice Yaméogo', 'Sangoulé Lamizana', 'Thomas Sankara', 'Blaise Compaoré'],
          correctIndex: 2,
          explanation: 'Thomas Sankara a dirigé la révolution démocratique et populaire à partir du 4 août 1983.',
          dossierId: 'demo',
          isDemo: true,
        ),
        QcmQuestion(
          id: 'demo_4',
          question: 'Quel est le résultat de 15 × 12 ?',
          options: ['170', '180', '190', '200'],
          correctIndex: 1,
          explanation: '15 × 12 = 180.',
          dossierId: 'demo',
          isDemo: true,
        ),
        QcmQuestion(
          id: 'demo_5',
          question: 'Quel mot est correctement orthographié ?',
          options: ['Acceuil', 'Accueil', 'Aceuil', 'Acceil'],
          correctIndex: 1,
          explanation: 'Le mot correct est « accueil ».',
          dossierId: 'demo',
          isDemo: true,
        ),
        QcmQuestion(
          id: 'demo_6',
          question: 'Quel fleuve traverse le Burkina Faso ?',
          options: ['Le Niger', 'Le Sénégal', 'La Volta Noire (Mouhoun)', 'Le Congo'],
          correctIndex: 2,
          explanation: 'Le Mouhoun (anciennement Volta Noire) est l\'un des principaux fleuves du Burkina Faso.',
          dossierId: 'demo',
          isDemo: true,
        ),
        QcmQuestion(
          id: 'demo_7',
          question: 'Quelle est la monnaie du Burkina Faso ?',
          options: ['Cedi', 'Naira', 'Franc CFA', 'Dirham'],
          correctIndex: 2,
          explanation: 'Le Burkina Faso utilise le Franc CFA (XOF).',
          dossierId: 'demo',
          isDemo: true,
        ),
        QcmQuestion(
          id: 'demo_8',
          question: 'En quelle année le Burkina Faso a-t-il accédé à l\'indépendance ?',
          options: ['1958', '1960', '1962', '1964'],
          correctIndex: 1,
          explanation: 'Le Burkina Faso (alors Haute-Volta) a accédé à l\'indépendance le 5 août 1960.',
          dossierId: 'demo',
          isDemo: true,
        ),
        QcmQuestion(
          id: 'demo_9',
          question: 'Quel est le synonyme de « Vaste » ?',
          options: ['Petit', 'Étroit', 'Grand', 'Faible'],
          correctIndex: 2,
          explanation: '« Vaste » signifie « très grand, étendu ».',
          dossierId: 'demo',
          isDemo: true,
        ),
        QcmQuestion(
          id: 'demo_10',
          question: 'Quel organe assure la justice constitutionnelle au Burkina Faso ?',
          options: [
            'La Cour suprême',
            'Le Conseil constitutionnel',
            'La Cour de cassation',
            'Le Conseil d\'État',
          ],
          correctIndex: 1,
          explanation: 'Le Conseil constitutionnel est chargé du contrôle de la constitutionnalité des lois.',
          dossierId: 'demo',
          isDemo: true,
        ),
      ];
}
