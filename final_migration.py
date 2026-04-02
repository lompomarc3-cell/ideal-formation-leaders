#!/usr/bin/env python3
"""
Script complet de migration et initialisation IFL Supabase
Utilise le token superadmin pour insérer les données
"""

import requests
import json
import time

SUPABASE_URL = "https://cyasoaihjjochwhnhwqf.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTkyMDUsImV4cCI6MjA4OTkzNTIwNX0.iZx5CKV4oY80POmPYs6_PMa-2vG5kNTHhOHD5M3HX44"

def print_sep(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)

def login(email, password):
    """Connecter un utilisateur et retourner son token"""
    r = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": ANON_KEY, "Content-Type": "application/json"},
        json={"email": email, "password": password}
    )
    if r.status_code == 200:
        data = r.json()
        return data.get('access_token'), data.get('user', {}).get('id')
    else:
        print(f"  Erreur login: {r.status_code} - {r.text[:100]}")
        return None, None

def signup(email, password, metadata=None):
    """Créer un nouveau compte"""
    payload = {"email": email, "password": password}
    if metadata:
        payload["data"] = metadata
    r = requests.post(
        f"{SUPABASE_URL}/auth/v1/signup",
        headers={"apikey": ANON_KEY, "Content-Type": "application/json"},
        json=payload
    )
    return r.status_code, r.json()

def get_headers(token):
    return {
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

def check_table(token, table):
    """Vérifier si une table est accessible"""
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/{table}?limit=1",
        headers=get_headers(token)
    )
    return r.status_code == 200, r.json()

def upsert(token, table, data, conflict_col=None):
    """Insérer/mettre à jour des données"""
    headers = get_headers(token)
    headers["Prefer"] = "resolution=merge-duplicates,return=representation"
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    r = requests.post(url, headers=headers, json=data)
    return r.status_code, r.json() if r.text else []

# ============================================================
print_sep("ÉTAPE 1 : Connexion Superadmin")
# ============================================================

admin_token, admin_uuid = login("admin@ifl.bf", "IFL@Admin2025!")
if admin_token:
    print(f"✅ Superadmin connecté - UUID: {admin_uuid}")
else:
    print("❌ Échec connexion superadmin")
    exit(1)

# ============================================================
print_sep("ÉTAPE 2 : Vérification tables disponibles")
# ============================================================

tables_status = {}
for table in ['profiles', 'categories', 'sous_categories', 'demo_questions', 'questions']:
    ok, data = check_table(admin_token, table)
    tables_status[table] = ok
    if ok:
        count = len(data) if isinstance(data, list) else '?'
        print(f"✅ {table}: accessible ({count} enregistrements)")
    else:
        msg = data.get('message', 'inaccessible') if isinstance(data, dict) else str(data)[:80]
        print(f"❌ {table}: {msg}")

# ============================================================
print_sep("ÉTAPE 3 : Profil Superadmin dans profiles")
# ============================================================

if tables_status.get('profiles'):
    # Vérifier si le profil existe
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{admin_uuid}",
        headers=get_headers(admin_token)
    )
    profiles = r.json() if r.status_code == 200 else []
    
    if isinstance(profiles, list) and len(profiles) > 0:
        print(f"✅ Profil superadmin existe: {profiles[0]}")
        # Mettre à jour le rôle si nécessaire
        if profiles[0].get('role') != 'superadmin':
            r_update = requests.patch(
                f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{admin_uuid}",
                headers=get_headers(admin_token),
                json={"role": "superadmin"}
            )
            print(f"   Rôle mis à jour: {r_update.status_code}")
    else:
        print(f"  Profil absent, création...")
        code, data = upsert(admin_token, 'profiles', {
            "id": admin_uuid,
            "telephone": "+22600000000",
            "nom": "SUPERADMIN",
            "prenom": "Admin",
            "role": "superadmin"
        })
        print(f"  Status: {code} - {str(data)[:100]}")
else:
    print("⚠️  Table profiles inaccessible (récursion RLS) - SQL migration requise")

# ============================================================
print_sep("ÉTAPE 4 : Insertion des Catégories")
# ============================================================

if tables_status.get('categories'):
    # Vérifier si les catégories existent
    r = requests.get(f"{SUPABASE_URL}/rest/v1/categories", headers=get_headers(admin_token))
    existing = r.json() if r.status_code == 200 else []
    print(f"  Catégories existantes: {len(existing) if isinstance(existing, list) else 0}")
    
    categories = [
        {
            "id": "11111111-1111-1111-1111-111111111111",
            "nom": "Concours Direct",
            "type_concours": "direct",
            "ordre": 1,
            "description": "Concours ouverts aux candidats diplômés sans expérience requise"
        },
        {
            "id": "22222222-2222-2222-2222-222222222222",
            "nom": "Concours Professionnel",
            "type_concours": "professionnel",
            "ordre": 2,
            "description": "Concours réservés aux agents de la Fonction Publique"
        }
    ]
    
    headers_upsert = get_headers(admin_token)
    headers_upsert["Prefer"] = "resolution=merge-duplicates,return=representation"
    r = requests.post(f"{SUPABASE_URL}/rest/v1/categories", headers=headers_upsert, json=categories)
    print(f"  Insertion catégories: {r.status_code}")
    if r.status_code in [200, 201]:
        print(f"✅ {len(r.json())} catégories insérées/mises à jour")
    else:
        print(f"⚠️  {r.text[:200]}")
else:
    print("⚠️  Table categories inaccessible")

# ============================================================
print_sep("ÉTAPE 5 : Insertion Sous-Catégories")
# ============================================================

if tables_status.get('sous_categories'):
    # Vérifier si les sous-catégories existent
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/sous_categories?select=count",
        headers={**get_headers(admin_token), "Prefer": "count=exact"}
    )
    
    sous_cats = [
        # Direct (10)
        {"nom": "Culture Générale", "categorie_id": "11111111-1111-1111-1111-111111111111", "type_concours": "direct", "ordre": 1, "description": "Histoire, géographie, actualité du Burkina Faso et du monde"},
        {"nom": "Français - Expression Écrite", "categorie_id": "11111111-1111-1111-1111-111111111111", "type_concours": "direct", "ordre": 2, "description": "Grammaire, orthographe, conjugaison et rédaction"},
        {"nom": "Mathématiques Générales", "categorie_id": "11111111-1111-1111-1111-111111111111", "type_concours": "direct", "ordre": 3, "description": "Arithmétique, algèbre, géométrie et logique"},
        {"nom": "Connaissance de l'Administration", "categorie_id": "11111111-1111-1111-1111-111111111111", "type_concours": "direct", "ordre": 4, "description": "Organisation de l'État burkinabè et institutions"},
        {"nom": "Droit Constitutionnel", "categorie_id": "11111111-1111-1111-1111-111111111111", "type_concours": "direct", "ordre": 5, "description": "Constitution du Burkina Faso, droits et libertés"},
        {"nom": "Droit Administratif", "categorie_id": "11111111-1111-1111-1111-111111111111", "type_concours": "direct", "ordre": 6, "description": "Actes administratifs, contentieux et procédures"},
        {"nom": "Finances Publiques", "categorie_id": "11111111-1111-1111-1111-111111111111", "type_concours": "direct", "ordre": 7, "description": "Budget de l'État, loi de finances, comptabilité publique"},
        {"nom": "Informatique et Numérique", "categorie_id": "11111111-1111-1111-1111-111111111111", "type_concours": "direct", "ordre": 8, "description": "Outils bureautiques, internet et nouvelles technologies"},
        {"nom": "Développement Durable et Environnement", "categorie_id": "11111111-1111-1111-1111-111111111111", "type_concours": "direct", "ordre": 9, "description": "Écologie, changement climatique, développement durable"},
        {"nom": "Logique et Raisonnement", "categorie_id": "11111111-1111-1111-1111-111111111111", "type_concours": "direct", "ordre": 10, "description": "Tests psychotechniques, raisonnement logique et aptitudes"},
        # Professionnel (12)
        {"nom": "Statut Général de la Fonction Publique", "categorie_id": "22222222-2222-2222-2222-222222222222", "type_concours": "professionnel", "ordre": 1, "description": "Droits et obligations des fonctionnaires, carrière"},
        {"nom": "Droit du Travail et Social", "categorie_id": "22222222-2222-2222-2222-222222222222", "type_concours": "professionnel", "ordre": 2, "description": "Code du travail, protection sociale, retraite"},
        {"nom": "Management et Administration Publique", "categorie_id": "22222222-2222-2222-2222-222222222222", "type_concours": "professionnel", "ordre": 3, "description": "Gestion des ressources humaines, organisation administrative"},
        {"nom": "Comptabilité et Gestion Budgétaire", "categorie_id": "22222222-2222-2222-2222-222222222222", "type_concours": "professionnel", "ordre": 4, "description": "Comptabilité générale, gestion budgétaire et financière"},
        {"nom": "Marchés Publics et Délégation", "categorie_id": "22222222-2222-2222-2222-222222222222", "type_concours": "professionnel", "ordre": 5, "description": "Code des marchés publics, procédures de passation"},
        {"nom": "Droit Pénal et Éthique", "categorie_id": "22222222-2222-2222-2222-222222222222", "type_concours": "professionnel", "ordre": 6, "description": "Déontologie, éthique professionnelle, infractions pénales"},
        {"nom": "Relations Internationales et Diplomatie", "categorie_id": "22222222-2222-2222-2222-222222222222", "type_concours": "professionnel", "ordre": 7, "description": "Organisations internationales, diplomatie africaine"},
        {"nom": "Économie Générale et Développement", "categorie_id": "22222222-2222-2222-2222-222222222222", "type_concours": "professionnel", "ordre": 8, "description": "Macro et microéconomie, politiques économiques du Burkina"},
        {"nom": "Planification et Décentralisation", "categorie_id": "22222222-2222-2222-2222-222222222222", "type_concours": "professionnel", "ordre": 9, "description": "Plans nationaux de développement, collectivités locales"},
        {"nom": "Rédaction Administrative", "categorie_id": "22222222-2222-2222-2222-222222222222", "type_concours": "professionnel", "ordre": 10, "description": "Note de service, rapport, compte-rendu, correspondance"},
        {"nom": "Fiscalité et Douanes", "categorie_id": "22222222-2222-2222-2222-222222222222", "type_concours": "professionnel", "ordre": 11, "description": "Impôts et taxes, code général des impôts, douanes"},
        {"nom": "Numérique et Transformation Digitale", "categorie_id": "22222222-2222-2222-2222-222222222222", "type_concours": "professionnel", "ordre": 12, "description": "E-gouvernement, services numériques, cybersécurité"},
    ]
    
    headers_insert = get_headers(admin_token)
    headers_insert["Prefer"] = "return=representation"
    r = requests.post(f"{SUPABASE_URL}/rest/v1/sous_categories", headers=headers_insert, json=sous_cats)
    print(f"  Insertion sous-catégories: {r.status_code}")
    if r.status_code in [200, 201]:
        print(f"✅ {len(r.json())} sous-catégories insérées")
    else:
        print(f"⚠️  {r.text[:200]}")
else:
    print("⚠️  Table sous_categories inaccessible (n'existe pas encore)")
    print("   → Exécutez MIGRATION_COMPLETE_IFL.sql dans Supabase SQL Editor")

# ============================================================
print_sep("ÉTAPE 6 : Insertion 20 QCM Démo")
# ============================================================

if tables_status.get('demo_questions'):
    demo_questions = [
        {"numero": 1, "enonce": "Quel arrêté porte création de clubs écologiques au sein des établissements d'enseignement ?", "option_a": "Arrêté N°2025-010 MEEA/ MESFPT/ MESRI", "option_b": "Arrêté N°2025-24/ MEBAPLN/SG/DRH", "option_c": "Arrêté N°2024-0304/ MENAPLN/ SG/ DGEC", "option_d": "Arrêté N°2025-176/ MESRI/ CAB", "reponse_correcte": "A", "explication": "Cet arrêté interministériel vise à instaurer des clubs écologiques dans les établissements.", "categorie": "legislation", "is_active": True},
        {"numero": 2, "enonce": "Quel arrêté proroge la validité des attestations de succès au BEPC, BEP et CAP session 2023 ?", "option_a": "Arrêté N°2023-177/ MEFP/ MENAPLN", "option_b": "Arrêté N°2024-0304/ MENAPLN/ SG / DGEC", "option_c": "Arrêté N°2025-0063/ MESFPT/CB", "option_d": "Arrêté N°2021-0214/ PRESE/PM/MATD/MINEFID/MENAPLN", "reponse_correcte": "B", "explication": "Cet arrêté de 2024 prolonge la validité des attestations de succès de la session 2023.", "categorie": "legislation", "is_active": True},
        {"numero": 3, "enonce": "Quel arrêté fixe les taux de prise en charge et indemnités pour l'organisation des examens et concours scolaires ?", "option_a": "Arrêté N°2025-24/ MEBAPLN/SG/DRH", "option_b": "Arrêté conjoint N°2023-177/ MEFP/ MENAPLN", "option_c": "Arrêté N°2025-176/ MESRI/ CAB", "option_d": "Arrêté N°2019-094/ MENAPLN/ SG/DGEFG", "reponse_correcte": "B", "explication": "Cet arrêté conjoint de 2023 fixe les taux et indemnités liés aux examens.", "categorie": "legislation", "is_active": True},
        {"numero": 4, "enonce": "Quel décret fixe les âges d'entrée aux différents niveaux d'enseignement au Burkina Faso ?", "option_a": "Décret N°2021-1123/ PRES/ PM/ MINEFID/ MENAPLN/ MESRI", "option_b": "Décret N°2019-0157/ PRES/PM/ MENA", "option_c": "Décret N°2009-228/ PRES/PM MASSN/MEBA/MESSRS", "option_d": "Arrêté N°2019-094/ MENAPLN/ SG/DGEFG", "reponse_correcte": "C", "explication": "Ce décret de 2009 fixe les âges d'entrée du préscolaire au supérieur.", "categorie": "legislation", "is_active": True},
        {"numero": 5, "enonce": "Quel arrêté porte modalité de rachat dans les enseignements post-primaire et secondaire ?", "option_a": "Arrêté N°2019-094/ MENAPLN/ SG /DGEFG", "option_b": "Arrêté N°2025-0063/ MESFPT/CB", "option_c": "Arrêté N°2025-010 MEEA/ MESFPT/ MESRI", "option_d": "Arrêté N°2022-062 MENAPLN/SG/DGD-LSCPA", "reponse_correcte": "A", "explication": "Cet arrêté de 2019 définit les modalités de rachat au post-primaire et secondaire.", "categorie": "legislation", "is_active": True},
        {"numero": 6, "enonce": "Quelle est la loi qui régit les marchés publics au Burkina Faso ?", "option_a": "Loi n°003-2010/AN", "option_b": "Loi n°039-2016/AN", "option_c": "Loi n°12-2005/AN", "option_d": "Loi n°21-2012/AN", "reponse_correcte": "B", "explication": "La loi n°039-2016/AN portant réglementation générale des marchés publics.", "categorie": "marches_publics", "is_active": True},
        {"numero": 7, "enonce": "Quelle institution est chargée du contrôle a priori des marchés publics ?", "option_a": "Cour des Comptes", "option_b": "ARMP", "option_c": "DGCMEF", "option_d": "Direction de la commande publique", "reponse_correcte": "C", "explication": "La DGCMEF exerce le contrôle a priori sur les marchés.", "categorie": "marches_publics", "is_active": True},
        {"numero": 8, "enonce": "Quel est l'organe de recours en matière de marchés publics ?", "option_a": "Ministère de l'Économie", "option_b": "ARMP", "option_c": "DGCMEF", "option_d": "Cour des Comptes", "reponse_correcte": "B", "explication": "L'ARMP reçoit et traite les recours des candidats ou soumissionnaires.", "categorie": "marches_publics", "is_active": True},
        {"numero": 9, "enonce": "Quel est le seuil de passation en appel d'offres ouvert pour les marchés de travaux ?", "option_a": "50 millions FCFA", "option_b": "100 millions FCFA", "option_c": "200 millions FCFA", "option_d": "300 millions FCFA", "reponse_correcte": "C", "explication": "Pour les marchés de travaux, le seuil est de 200 millions FCFA.", "categorie": "marches_publics", "is_active": True},
        {"numero": 10, "enonce": "Quelle procédure est utilisée pour les marchés de faible montant ?", "option_a": "Appel d'offres restreint", "option_b": "Demande de prix", "option_c": "Appel d'offres ouvert", "option_d": "Gré à gré", "reponse_correcte": "B", "explication": "La demande de prix est la procédure simplifiée pour les petits montants.", "categorie": "marches_publics", "is_active": True},
        {"numero": 11, "enonce": "Quel principe impose la justification des décisions d'attribution ?", "option_a": "Transparence", "option_b": "Confidentialité", "option_c": "Sélectivité", "option_d": "Moralité", "reponse_correcte": "A", "explication": "Les décisions doivent être expliquées selon le principe de transparence.", "categorie": "principes", "is_active": True},
        {"numero": 12, "enonce": "La lutte contre la corruption est directement liée au principe de :", "option_a": "Libre concurrence", "option_b": "Moralité", "option_c": "Efficacité", "option_d": "Publicité", "reponse_correcte": "B", "explication": "Le principe de moralité exige l'intégrité dans toutes les procédures.", "categorie": "principes", "is_active": True},
        {"numero": 13, "enonce": "Quel principe garantit l'accès équitable à l'information sur les marchés ?", "option_a": "Égalité de traitement", "option_b": "Transparence", "option_c": "Efficacité", "option_d": "Performance", "reponse_correcte": "B", "explication": "L'information doit être diffusée de façon claire selon la transparence.", "categorie": "principes", "is_active": True},
        {"numero": 14, "enonce": "Le principe de libre concurrence suppose :", "option_a": "Des critères flous", "option_b": "Une publicité suffisante", "option_c": "Une sélection directe", "option_d": "Une négociation secrète", "reponse_correcte": "B", "explication": "La publicité suffisante est indispensable à la concurrence réelle.", "categorie": "principes", "is_active": True},
        {"numero": 15, "enonce": "L'application simultanée des principes des marchés publics vise surtout à :", "option_a": "Complexifier les procédures", "option_b": "Sécuriser la commande publique", "option_c": "Favoriser l'administration", "option_d": "Retarder les projets", "reponse_correcte": "B", "explication": "Ces principes garantissent légalité, équité et efficacité.", "categorie": "principes", "is_active": True},
        {"numero": 16, "enonce": "Quelle institution nationale vérifie la gestion des fonds issus des marchés publics ?", "option_a": "ARCOP", "option_b": "Cour des comptes", "option_c": "DG-CMP", "option_d": "Ministère du Commerce", "reponse_correcte": "B", "explication": "La Cour des comptes assure le contrôle juridictionnel.", "categorie": "controle", "is_active": True},
        {"numero": 17, "enonce": "Quel seuil approximatif est souvent utilisé pour les marchés de fournitures avant l'appel d'offres ?", "option_a": "10 millions FCFA", "option_b": "25 millions FCFA", "option_c": "75 millions FCFA", "option_d": "300 millions FCFA", "reponse_correcte": "B", "explication": "Ce seuil de 25 millions sert de limite pour les procédures simplifiées.", "categorie": "seuils", "is_active": True},
        {"numero": 18, "enonce": "Quel seuil déclenche généralement l'appel d'offres international ?", "option_a": "10 millions FCFA", "option_b": "50 millions FCFA", "option_c": "500 millions FCFA", "option_d": "5 milliards FCFA", "reponse_correcte": "C", "explication": "Les montants à 500 millions FCFA et plus nécessitent une concurrence internationale.", "categorie": "seuils", "is_active": True},
        {"numero": 19, "enonce": "Pour les prestations intellectuelles, quel seuil peut conduire à la sélection basée sur la qualité et le coût ?", "option_a": "5 millions FCFA", "option_b": "10 millions FCFA", "option_c": "25 millions FCFA", "option_d": "200 millions FCFA", "reponse_correcte": "C", "explication": "Le seuil de 25 millions peut déclencher des procédures spécifiques.", "categorie": "seuils", "is_active": True},
        {"numero": 20, "enonce": "Quelle entité est chargée du contrôle a priori de la commande publique au Burkina Faso ?", "option_a": "ARMP", "option_b": "Autorité contractante", "option_c": "Direction générale du contrôle des marchés publics (DGCMP)", "option_d": "Cour des comptes", "reponse_correcte": "C", "explication": "La DGCMP exerce le contrôle administratif préalable.", "categorie": "controle", "is_active": True},
    ]
    
    headers_upsert = get_headers(admin_token)
    headers_upsert["Prefer"] = "resolution=merge-duplicates,return=representation"
    r = requests.post(f"{SUPABASE_URL}/rest/v1/demo_questions", headers=headers_upsert, json=demo_questions)
    print(f"  Insertion QCM démo: {r.status_code}")
    if r.status_code in [200, 201]:
        print(f"✅ {len(r.json())} QCM démo insérés/mis à jour")
    else:
        print(f"⚠️  {r.text[:200]}")
else:
    print("⚠️  Table demo_questions inaccessible (n'existe pas encore)")
    print("   → Exécutez MIGRATION_COMPLETE_IFL.sql dans Supabase SQL Editor")

# ============================================================
print_sep("ÉTAPE 7 : Création compte NIAMPA")
# ============================================================

niampa_email = "+22676223962@ifl.app"
niampa_password = "NIAMPA@IFL2025!"

# Essayer de se connecter d'abord (cas où le compte existe déjà)
niampa_token, niampa_uuid = login(niampa_email, niampa_password)

if niampa_token:
    print(f"✅ Compte NIAMPA existe déjà - UUID: {niampa_uuid}")
else:
    print("  Création du compte NIAMPA...")
    status, data = signup(niampa_email, niampa_password, {
        "nom": "NIAMPA", "prenom": "Issa", "telephone": "+22676223962"
    })
    print(f"  Status signup: {status}")
    if status in [200, 201]:
        niampa_uuid = data.get('user', {}).get('id') or data.get('id')
        print(f"✅ Compte NIAMPA créé - UUID: {niampa_uuid}")
        # Se reconnecter pour obtenir le token
        time.sleep(1)
        niampa_token, niampa_uuid = login(niampa_email, niampa_password)
    else:
        msg = data.get('msg') or data.get('message') or str(data)[:100]
        print(f"⚠️  {msg}")

# Créer/mettre à jour le profil NIAMPA comme admin
if niampa_uuid and tables_status.get('profiles'):
    print(f"  Création profil NIAMPA (admin)...")
    headers_upsert = get_headers(admin_token)
    headers_upsert["Prefer"] = "resolution=merge-duplicates,return=representation"
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/profiles",
        headers=headers_upsert,
        json={
            "id": niampa_uuid,
            "telephone": "+22676223962",
            "nom": "NIAMPA",
            "prenom": "Issa",
            "role": "admin"
        }
    )
    print(f"  Status profil NIAMPA: {r.status_code}")
    if r.status_code in [200, 201]:
        print(f"✅ Profil NIAMPA créé/mis à jour en tant qu'admin")
    else:
        print(f"⚠️  {r.text[:200]}")
elif not tables_status.get('profiles'):
    print("⚠️  Table profiles inaccessible - profil NIAMPA sera créé après migration SQL")

# ============================================================
print_sep("RÉSUMÉ FINAL")
# ============================================================

print(f"""
🔐 COMPTES CRÉÉS :

┌─────────────────────────────────────────────┐
│  SUPERADMIN                                 │
│  Email:    admin@ifl.bf                     │
│  MDP:      IFL@Admin2025!                   │
│  Rôle:     superadmin                       │
│  UUID:     {admin_uuid}  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  ADMIN NIAMPA                               │
│  Tél:      +22676223962                     │
│  MDP:      NIAMPA@IFL2025!                  │
│  Email:    +22676223962@ifl.app             │
│  Rôle:     admin                            │
│  UUID:     {niampa_uuid or 'Voir Supabase Dashboard'}                      │
└─────────────────────────────────────────────┘

🌐 URL Live: https://ideal-formation-leaders.pages.dev
""")

print("\n" + "="*60)
print("  ⚠️  ACTION REQUISE POUR COMPLÉTER LA MIGRATION")
print("="*60)
print("""
Les tables sous_categories, demo_questions et la correction
du bug RLS nécessitent l'exécution du fichier SQL :

1. Allez sur: https://app.supabase.com/project/cyasoaihjjochwhnhwqf/editor
2. Copiez le contenu de: MIGRATION_COMPLETE_IFL.sql
3. Collez et exécutez dans le SQL Editor
4. Après exécution, relancez ce script pour peupler les données

Ce fichier se trouve dans le repo GitHub:
https://github.com/lompomarc3-cell/ideal-formation-leaders
""")
