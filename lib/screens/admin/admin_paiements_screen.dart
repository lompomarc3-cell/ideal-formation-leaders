// lib/screens/admin/admin_paiements_screen.dart
// Validation des paiements Orange Money

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../models/paiement_model.dart';
import '../../services/paiement_service.dart';

class AdminPaiementsScreen extends StatefulWidget {
  const AdminPaiementsScreen({super.key});

  @override
  State<AdminPaiementsScreen> createState() => _AdminPaiementsScreenState();
}

class _AdminPaiementsScreenState extends State<AdminPaiementsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PaiementService>().loadPaiementsEnAttente();
    });
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final paiService = context.watch<PaiementService>();

    return Column(
      children: [
        Container(
          color: Colors.white,
          child: TabBar(
            controller: _tabCtrl,
            labelColor: AppTheme.primaryColor,
            unselectedLabelColor: AppTheme.textSecondary,
            indicatorColor: AppTheme.primaryColor,
            tabs: [
              Tab(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('En attente'),
                    if (paiService.paiementsEnAttente.isNotEmpty) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: AppTheme.errorColor,
                          shape: BoxShape.circle,
                        ),
                        child: Text(
                          '${paiService.paiementsEnAttente.length}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const Tab(text: 'Historique'),
            ],
          ),
        ),
        Expanded(
          child: TabBarView(
            controller: _tabCtrl,
            children: [
              _buildEnAttente(paiService),
              _buildHistorique(paiService),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildEnAttente(PaiementService paiService) {
    if (paiService.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    final pending = paiService.paiementsEnAttente;

    if (pending.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.check_circle_rounded, size: 64,
                color: AppTheme.accentColor.withValues(alpha: 0.5)),
            const SizedBox(height: 16),
            const Text(
              'Aucune demande en attente',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Toutes les demandes ont été traitées',
              style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => paiService.loadPaiementsEnAttente(),
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Actualiser'),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => paiService.loadPaiementsEnAttente(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: pending.length,
        itemBuilder: (_, i) => _buildPaiementCard(pending[i], paiService),
      ),
    );
  }

  Widget _buildHistorique(PaiementService paiService) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.history_rounded, size: 48, color: AppTheme.textSecondary),
          SizedBox(height: 12),
          Text(
            'Historique disponible prochainement',
            style: TextStyle(color: AppTheme.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _buildPaiementCard(PaiementModel paiement, PaiementService service) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
        border: Border.all(color: const Color(0xFFFF8C00).withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF7ED),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
              ),
            ),
            child: Row(
              children: [
                const Icon(Icons.pending_rounded, color: Color(0xFFFF8C00), size: 18),
                const SizedBox(width: 8),
                const Text(
                  'Demande en attente',
                  style: TextStyle(
                    color: Color(0xFF92400E),
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
                const Spacer(),
                Text(
                  _formatDate(paiement.createdAt),
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),

          // Contenu
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Dossier
                Row(
                  children: [
                    const Icon(Icons.folder_rounded,
                        color: AppTheme.primaryColor, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        paiement.categorieNom,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFF8C00),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '${paiement.montant} FCFA',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Numéro OM
                if (paiement.numeroOm != null) ...[
                  Row(
                    children: [
                      const Icon(Icons.phone_rounded,
                          color: Color(0xFFFF8C00), size: 16),
                      const SizedBox(width: 8),
                      Text(
                        'OM : ${paiement.numeroOm}',
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                ],

                // ID utilisateur
                Row(
                  children: [
                    const Icon(Icons.person_rounded,
                        color: AppTheme.textSecondary, size: 16),
                    const SizedBox(width: 8),
                    Text(
                      'User ID : ${paiement.userId.substring(0, 8)}...',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // Boutons
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppTheme.errorColor,
                          side: const BorderSide(color: AppTheme.errorColor),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                        ),
                        onPressed: () => _refuser(paiement.id, service),
                        icon: const Icon(Icons.close_rounded, size: 16),
                        label: const Text('Refuser', style: TextStyle(fontSize: 13)),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 2,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.accentColor,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 10),
                        ),
                        onPressed: () => _valider(
                            paiement.id, paiement.userId, paiement.categorieId, service),
                        icon: const Icon(Icons.check_rounded, size: 16),
                        label: const Text(
                          'VALIDER ACCÈS',
                          style: TextStyle(
                              fontWeight: FontWeight.w700, fontSize: 13),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _valider(
      String paiId, String userId, String catId, PaiementService service) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Valider le paiement ?'),
        content: const Text(
          'Cette action débloquera l\'accès au dossier pour cet utilisateur.\n\nConfirmez-vous avoir reçu le paiement ?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.accentColor,
            ),
            onPressed: () async {
              Navigator.pop(context);
              final ok = await service.validerPaiement(paiId, userId, catId);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(ok
                        ? '✅ Accès activé avec succès !'
                        : '❌ Erreur lors de la validation'),
                    backgroundColor: ok ? AppTheme.accentColor : AppTheme.errorColor,
                  ),
                );
              }
            },
            child: const Text('Confirmer'),
          ),
        ],
      ),
    );
  }

  void _refuser(String paiId, PaiementService service) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Refuser la demande ?'),
        content: const Text('Cette action marquera la demande comme refusée.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.errorColor,
            ),
            onPressed: () async {
              Navigator.pop(context);
              await service.refuserPaiement(paiId);
            },
            child: const Text('Refuser'),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime? dt) {
    if (dt == null) return 'Date inconnue';
    return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year} ${dt.hour}h${dt.minute.toString().padLeft(2, '0')}';
  }
}
