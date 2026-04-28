import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';

import '../models/category.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import '../widgets/cat_icon.dart';

const String kAppUrl = 'https://ideal-formation-leaders.pages.dev';
const String kWhatsApp = '22676223962';
const String kAdminPhone = '+22676223962';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Category> _direct = [];
  List<Category> _pro = [];
  bool _loading = true;
  PriceInfo? _priceDirect;
  PriceInfo? _pricePro;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkAuthRedirect();
      _load();
    });
  }

  void _checkAuthRedirect() {
    final auth = context.read<AuthService>();
    if (auth.isAuthenticated) {
      Navigator.of(context).pushReplacementNamed('/dashboard');
    }
  }

  Future<void> _load() async {
    final auth = context.read<AuthService>();
    try {
      final results = await Future.wait([
        auth.api.publicCategories(type: 'direct'),
        auth.api.publicCategories(type: 'professionnel'),
        auth.api.publicPrices(),
      ]);
      final dDirect = (results[0]['categories'] as List? ?? [])
          .map((e) => Category.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      final dPro = (results[1]['categories'] as List? ?? [])
          .map((e) => Category.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      final pricesMap = Map<String, dynamic>.from(results[2]['prices'] ?? {});
      if (!mounted) return;
      setState(() {
        _direct = dDirect;
        _pro = dPro;
        if (pricesMap['direct'] != null) {
          _priceDirect = PriceInfo.fromMap('direct', Map<String, dynamic>.from(pricesMap['direct']));
        }
        if (pricesMap['professionnel'] != null) {
          _pricePro = PriceInfo.fromMap('professionnel', Map<String, dynamic>.from(pricesMap['professionnel']));
        }
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _share() async {
    const txt =
        '🎓 Préparez vos concours du Burkina Faso avec IFL !\n\n✅ Des milliers de QCM\n✅ Concours directs – 12 dossiers (5 000 FCFA)\n✅ Concours professionnels – 17 dossiers (20 000 FCFA)\n✅ 5 questions gratuites par dossier sans inscription\n\n👉 $kAppUrl';
    try {
      await Share.share(txt, subject: 'IFL – Formation Burkina Faso');
    } catch (_) {
      final uri = Uri.parse('https://wa.me/?text=${Uri.encodeComponent(txt)}');
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _openWhatsApp() async {
    final uri = Uri.parse('https://wa.me/$kWhatsApp');
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  String _formatPrice(int p) {
    final s = p.toString();
    final buf = StringBuffer();
    for (int i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write(' ');
      buf.write(s[i]);
    }
    return buf.toString();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightBg,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: Column(
              children: [
                _buildHeader(),
                if (_loading)
                  const Padding(
                    padding: EdgeInsets.all(40),
                    child: CircularProgressIndicator(color: AppColors.primary),
                  )
                else ...[
                  _buildSection(
                    title: '📚  Concours directs',
                    subtitle: '12 dossiers • 5 000 FCFA',
                    price: _priceDirect,
                    cats: _direct,
                    catType: 'direct',
                  ),
                  _buildSection(
                    title: '🎓  Concours professionnels',
                    subtitle: '17 dossiers • 20 000 FCFA',
                    price: _pricePro,
                    cats: _pro,
                    catType: 'professionnel',
                  ),
                  _buildCTA(),
                  _buildPaymentInfo(),
                  const SizedBox(height: 40),
                ],
              ],
            ),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _openWhatsApp,
        backgroundColor: const Color(0xFF25D366),
        child: const Icon(Icons.chat, color: Colors.white),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
      decoration: const BoxDecoration(gradient: AppColors.primaryGradient),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: Image.asset('assets/logo.png', width: 48, height: 48, fit: BoxFit.cover),
                  ),
                  const SizedBox(width: 12),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('IFL',
                          style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              fontSize: 20)),
                      Text('Idéale Formation of Leaders',
                          style: TextStyle(
                              color: Color(0xFFFFE0A0), fontSize: 11)),
                    ],
                  ),
                ],
              ),
              IconButton(
                onPressed: _share,
                icon: const Icon(Icons.share, color: Colors.white),
                tooltip: 'Partager',
              ),
            ],
          ),
          const SizedBox(height: 24),
          const Text(
            'Réussissez vos concours\ndu Burkina Faso 🎓',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w900,
              fontSize: 24,
              height: 1.3,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            '5 questions gratuites par dossier\nsans inscription',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFFFFE0A0), fontSize: 13),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: () => Navigator.of(context).pushNamed('/register'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: AppColors.darkTerracotta,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text("S'inscrire",
                      style: TextStyle(fontWeight: FontWeight.w800)),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.of(context).pushNamed('/login'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white, width: 2),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Se connecter',
                      style: TextStyle(fontWeight: FontWeight.w800)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSection({
    required String title,
    required String subtitle,
    required PriceInfo? price,
    required List<Category> cats,
    required String catType,
  }) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: const TextStyle(
                            fontWeight: FontWeight.w900, fontSize: 18, color: AppColors.darkTerracotta)),
                    const SizedBox(height: 2),
                    Text(subtitle,
                        style: const TextStyle(color: Color(0xFF6B7280), fontSize: 12)),
                  ],
                ),
              ),
              if (price != null) _priceTag(price),
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            height: 180,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: cats.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (_, i) => _publicCategoryCard(cats[i], catType),
            ),
          ),
        ],
      ),
    );
  }

  Widget _priceTag(PriceInfo p) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: p.hasPromo ? const Color(0xFFFEE2E2) : const Color(0xFFFFF7ED),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: p.hasPromo ? const Color(0xFFEF4444) : const Color(0xFFFED7AA),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (p.hasPromo) ...[
            Text(
              '${_formatPrice(p.prixNormal)} F',
              style: const TextStyle(
                fontSize: 11,
                color: Color(0xFF6B7280),
                decoration: TextDecoration.lineThrough,
              ),
            ),
            Text(
              '${_formatPrice(p.prixEffectif)} F',
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w900,
                color: Color(0xFFDC2626),
              ),
            ),
          ] else
            Text(
              '${_formatPrice(p.prixNormal)} F',
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w900,
                color: AppColors.primary,
              ),
            ),
        ],
      ),
    );
  }

  Widget _publicCategoryCard(Category cat, String catType) {
    final iconName = cat.icone ?? 'book';
    final style = iconStyleFor(iconName, catType);
    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: () {
        Navigator.of(context).pushNamed('/quiz', arguments: {
          'categoryId': cat.id,
          'categoryName': cat.nom,
          'isPublic': true,
        });
      },
      child: Container(
        width: 150,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: style.border, width: 2),
          boxShadow: [
            BoxShadow(
              color: style.border.withValues(alpha: 0.5),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            const SizedBox(height: 14),
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: style.border, width: 1.5),
              ),
              child: Center(
                child: CatIcon(name: iconName, catType: catType, size: 36),
              ),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Text(
                cat.nom,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF374151),
                ),
              ),
            ),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: style.tag,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '🆓 5 gratuites',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: style.tagText,
                ),
              ),
            ),
            const Spacer(),
            Container(
              height: 6,
              width: double.infinity,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: style.bgGradient),
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(18)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCTA() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        children: [
          const Text(
            '🚀 Prêt à commencer ?',
            style: TextStyle(
                color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20),
          ),
          const SizedBox(height: 8),
          const Text(
            'Créez votre compte gratuit et accédez aux QCM',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFFFFE0A0), fontSize: 13),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.of(context).pushNamed('/register'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: AppColors.darkTerracotta,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Text("Créer mon compte gratuit",
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentInfo() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFFE4CC)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.payment, color: AppColors.primary),
              SizedBox(width: 8),
              Text('💳 Paiement Orange Money',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
            ],
          ),
          const SizedBox(height: 12),
          _infoRow(Icons.phone_android, 'Numéro Orange Money', kAdminPhone, () async {
            await launchUrl(Uri.parse('tel:$kAdminPhone'));
          }),
          const SizedBox(height: 8),
          _infoRow(Icons.dialpad, 'Code USSD', '*144*10*76223962#', () async {
            final encoded = Uri.encodeComponent('*144*10*76223962#');
            await launchUrl(Uri.parse('tel:$encoded'));
          }),
          const SizedBox(height: 8),
          _infoRow(Icons.message, 'WhatsApp Support', '76 22 39 62', _openWhatsApp),
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
        child: Row(
          children: [
            Icon(icon, size: 18, color: AppColors.primary),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280))),
                  Text(value,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                ],
              ),
            ),
            const Icon(Icons.touch_app, size: 16, color: Color(0xFF9CA3AF)),
          ],
        ),
      ),
    );
  }
}
