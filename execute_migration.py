#!/usr/bin/env python3
"""
Script pour exécuter la migration SQL IFL sur Supabase
et créer tous les comptes administrateurs
"""

import requests
import json
import time

# ============================================================
# CONFIGURATION SUPABASE
# ============================================================
SUPABASE_URL = "https://cyasoaihjjochwhnhwqf.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTkyMDUsImV4cCI6MjA4OTkzNTIwNX0.iZx5CKV4oY80POmPYs6_PMa-2vG5kNTHhOHD5M3HX44"
SUPABASE_SERVICE_KEY = "sbp_993dc7fba4d7f9993f8975171a5803af77717306"

headers_admin = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

headers_anon = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}


def print_separator(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)


def check_table_exists(table_name):
    """Vérifie si une table existe"""
    url = f"{SUPABASE_URL}/rest/v1/{table_name}?limit=1"
    r = requests.get(url, headers=headers_admin)
    return r.status_code == 200


def run_sql_via_rpc(sql_query):
    """Exécute du SQL via la fonction RPC Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    payload = {"query": sql_query}
    r = requests.post(url, headers=headers_admin, json=payload)
    return r


def insert_record(table, data, on_conflict=None):
    """Insère un enregistrement dans une table"""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = dict(headers_admin)
    if on_conflict:
        headers["Prefer"] = f"resolution=merge-duplicates,return=representation"
        url += f"?on_conflict={on_conflict}"
    
    r = requests.post(url, headers=headers, json=data)
    return r


def upsert_records(table, data, on_conflict):
    """Upsert des enregistrements"""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = dict(headers_admin)
    headers["Prefer"] = f"resolution=merge-duplicates,return=representation"
    
    r = requests.post(url, headers=headers, json=data)
    return r


def get_records(table, filters=None):
    """Récupère des enregistrements"""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    if filters:
        url += f"?{filters}"
    r = requests.get(url, headers=headers_admin)
    return r


# ============================================================
# ÉTAPE 1: Créer le compte SUPERADMIN (admin@ifl.bf)
# ============================================================
print_separator("ÉTAPE 1: Création du compte SUPERADMIN")

superadmin_payload = {
    "email": "admin@ifl.bf",
    "password": "IFL@Admin2025!",
    "email_confirm": True,
    "user_metadata": {
        "nom": "SUPERADMIN",
        "prenom": "Admin",
        "telephone": "+22600000000"
    }
}

url_admin_users = f"{SUPABASE_URL}/auth/v1/admin/users"
r = requests.post(url_admin_users, headers=headers_admin, json=superadmin_payload)
print(f"Status: {r.status_code}")

if r.status_code in [200, 201]:
    superadmin_data = r.json()
    superadmin_uuid = superadmin_data.get('id')
    print(f"✅ Superadmin créé: UUID = {superadmin_uuid}")
elif r.status_code == 422:
    print("ℹ️  Superadmin existe déjà, récupération de l'UUID...")
    # Lister les utilisateurs pour trouver l'UUID
    r_list = requests.get(f"{SUPABASE_URL}/auth/v1/admin/users", headers=headers_admin)
    if r_list.status_code == 200:
        users = r_list.json().get('users', [])
        superadmin_uuid = None
        for u in users:
            if u.get('email') == 'admin@ifl.bf':
                superadmin_uuid = u.get('id')
                break
        if superadmin_uuid:
            print(f"✅ UUID trouvé: {superadmin_uuid}")
        else:
            print("⚠️  UUID non trouvé, utilisation de l'UUID connu")
            superadmin_uuid = "8e349658-3883-45a2-bede-4f008f0685cc"
    else:
        print(f"⚠️  Erreur liste users: {r_list.status_code}")
        superadmin_uuid = "8e349658-3883-45a2-bede-4f008f0685cc"
else:
    print(f"⚠️  Réponse: {r.text[:200]}")
    superadmin_uuid = "8e349658-3883-45a2-bede-4f008f0685cc"

print(f"UUID Superadmin: {superadmin_uuid}")


# ============================================================
# ÉTAPE 2: Créer le profil superadmin dans la table profiles
# ============================================================
print_separator("ÉTAPE 2: Création du profil SUPERADMIN dans la base")

# D'abord vérifier si la table profiles existe
if check_table_exists('profiles'):
    print("✅ Table profiles existe")
    
    profile_data = {
        "id": superadmin_uuid,
        "telephone": "+22600000000",
        "nom": "SUPERADMIN",
        "prenom": "Admin",
        "role": "superadmin"
    }
    
    # Upsert du profil
    url_profiles = f"{SUPABASE_URL}/rest/v1/profiles"
    headers_upsert = dict(headers_admin)
    headers_upsert["Prefer"] = "resolution=merge-duplicates,return=representation"
    
    r_profile = requests.post(url_profiles, headers=headers_upsert, json=profile_data)
    print(f"Status profil: {r_profile.status_code}")
    if r_profile.status_code in [200, 201]:
        print("✅ Profil superadmin créé/mis à jour")
    else:
        print(f"⚠️  Réponse profil: {r_profile.text[:300]}")
else:
    print("⚠️  Table profiles n'existe pas encore - sera créée lors de la migration")


# ============================================================
# ÉTAPE 3: Créer le compte NIAMPA
# ============================================================
print_separator("ÉTAPE 3: Création du compte NIAMPA")

niampa_phone = "+22676223962"
niampa_fake_email = f"{niampa_phone}@ifl.app"

niampa_payload = {
    "email": niampa_fake_email,
    "password": "NIAMPA@IFL2025!",
    "email_confirm": True,
    "user_metadata": {
        "nom": "NIAMPA",
        "prenom": "Issa",
        "telephone": niampa_phone
    }
}

r_niampa = requests.post(url_admin_users, headers=headers_admin, json=niampa_payload)
print(f"Status NIAMPA: {r_niampa.status_code}")

if r_niampa.status_code in [200, 201]:
    niampa_data = r_niampa.json()
    niampa_uuid = niampa_data.get('id')
    print(f"✅ Compte NIAMPA créé: UUID = {niampa_uuid}")
elif r_niampa.status_code == 422:
    print("ℹ️  Compte NIAMPA existe déjà, récupération de l'UUID...")
    r_list = requests.get(f"{SUPABASE_URL}/auth/v1/admin/users", headers=headers_admin)
    if r_list.status_code == 200:
        users = r_list.json().get('users', [])
        niampa_uuid = None
        for u in users:
            if u.get('email') == niampa_fake_email:
                niampa_uuid = u.get('id')
                break
        if niampa_uuid:
            print(f"✅ UUID NIAMPA trouvé: {niampa_uuid}")
        else:
            niampa_uuid = None
            print("⚠️  UUID NIAMPA non trouvé")
    else:
        niampa_uuid = None
else:
    print(f"⚠️  Réponse NIAMPA: {r_niampa.text[:200]}")
    niampa_uuid = None


# ============================================================
# ÉTAPE 4: Créer le profil NIAMPA dans la table profiles
# ============================================================
print_separator("ÉTAPE 4: Création du profil NIAMPA")

if niampa_uuid and check_table_exists('profiles'):
    niampa_profile = {
        "id": niampa_uuid,
        "telephone": niampa_phone,
        "nom": "NIAMPA",
        "prenom": "Issa",
        "role": "admin"
    }
    
    url_profiles = f"{SUPABASE_URL}/rest/v1/profiles"
    headers_upsert = dict(headers_admin)
    headers_upsert["Prefer"] = "resolution=merge-duplicates,return=representation"
    
    r_np = requests.post(url_profiles, headers=headers_upsert, json=niampa_profile)
    print(f"Status profil NIAMPA: {r_np.status_code}")
    if r_np.status_code in [200, 201]:
        print("✅ Profil NIAMPA créé/mis à jour en tant qu'admin")
    else:
        print(f"⚠️  Réponse: {r_np.text[:300]}")
else:
    print("⚠️  UUID NIAMPA non disponible ou table profiles inexistante")


# ============================================================
# ÉTAPE 5: Insérer les catégories
# ============================================================
print_separator("ÉTAPE 5: Insertion des catégories")

if check_table_exists('categories'):
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
    
    url_cat = f"{SUPABASE_URL}/rest/v1/categories"
    headers_upsert = dict(headers_admin)
    headers_upsert["Prefer"] = "resolution=merge-duplicates,return=representation"
    
    r_cat = requests.post(url_cat, headers=headers_upsert, json=categories)
    print(f"Status catégories: {r_cat.status_code}")
    if r_cat.status_code in [200, 201]:
        print(f"✅ {len(categories)} catégories insérées/mises à jour")
    else:
        print(f"⚠️  Réponse: {r_cat.text[:300]}")
else:
    print("⚠️  Table categories n'existe pas encore")


# ============================================================
# ÉTAPE 6: Insérer les sous-catégories
# ============================================================
print_separator("ÉTAPE 6: Insertion des sous-catégories")

if check_table_exists('sous_categories'):
    # Vérifier si elles existent déjà
    r_check = requests.get(f"{SUPABASE_URL}/rest/v1/sous_categories?select=count", headers=headers_admin)
    existing = r_check.json() if r_check.status_code == 200 else []
    
    if len(existing) > 0:
        print(f"ℹ️  Des sous-catégories existent déjà: {existing}")
    
    sous_categories_direct = [
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
    ]
    
    sous_categories_pro = [
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
    
    all_sc = sous_categories_direct + sous_categories_pro
    url_sc = f"{SUPABASE_URL}/rest/v1/sous_categories"
    headers_insert = dict(headers_admin)
    headers_insert["Prefer"] = "return=representation"
    
    r_sc = requests.post(url_sc, headers=headers_insert, json=all_sc)
    print(f"Status sous-catégories: {r_sc.status_code}")
    if r_sc.status_code in [200, 201]:
        result = r_sc.json()
        print(f"✅ {len(result) if isinstance(result, list) else '?'} sous-catégories créées")
    else:
        print(f"Réponse: {r_sc.text[:400]}")
        # Si conflit, elles existent déjà
        if '409' in str(r_sc.status_code) or 'duplicate' in r_sc.text.lower():
            print("ℹ️  Sous-catégories existent déjà")
else:
    print("⚠️  Table sous_categories n'existe pas encore")


# ============================================================
# ÉTAPE 7: Insérer les 20 QCM démo
# ============================================================
print_separator("ÉTAPE 7: Insertion des 20 QCM démo")

if check_table_exists('demo_questions'):
    demo_questions = [
        {"numero": 1, "enonce": "Quel arrêté porte création de clubs écologiques au sein des établissements d'enseignement ?", "option_a": "Arrêté N°2025-010 MEEA/ MESFPT/ MESRI", "option_b": "Arrêté N°2025-24/ MEBAPLN/SG/DRH", "option_c": "Arrêté N°2024-0304/ MENAPLN/ SG/ DGEC", "option_d": "Arrêté N°2025-176/ MESRI/ CAB", "reponse_correcte": "A", "explication": "Cet arrêté interministériel vise à instaurer des clubs écologiques dans les lycées, collèges et centres de formation.", "categorie": "legislation", "is_active": True},
        {"numero": 2, "enonce": "Quel arrêté proroge la validité des attestations de succès au BEPC, BEP et CAP session 2023 ?", "option_a": "Arrêté N°2023-177/ MEFP/ MENAPLN", "option_b": "Arrêté N°2024-0304/ MENAPLN/ SG / DGEC", "option_c": "Arrêté N°2025-0063/ MESFPT/CB", "option_d": "Arrêté N°2021-0214/ PRESE/PM/MATD/MINEFID/MENAPLN", "reponse_correcte": "B", "explication": "Cet arrêté de 2024 prolonge la validité des attestations de succès de la session 2023.", "categorie": "legislation", "is_active": True},
        {"numero": 3, "enonce": "Quel arrêté fixe les taux de prise en charge et indemnités diverses pour l'organisation des examens et concours scolaires ?", "option_a": "Arrêté N°2025-24/ MEBAPLN/SG/DRH", "option_b": "Arrêté conjoint N°2023-177/ MEFP/ MENAPLN", "option_c": "Arrêté N°2025-176/ MESRI/ CAB", "option_d": "Arrêté N°2019-094/ MENAPLN/ SG/DGEFG", "reponse_correcte": "B", "explication": "Cet arrêté conjoint de 2023 fixe les taux et indemnités liés aux examens et concours scolaires.", "categorie": "legislation", "is_active": True},
        {"numero": 4, "enonce": "Quel décret fixe les âges d'entrée aux différents niveaux d'enseignement au Burkina Faso ?", "option_a": "Décret N°2021-1123/ PRES/ PM/ MINEFID/ MENAPLN/ MESRI", "option_b": "Décret N°2019-0157/ PRES/PM/ MENA", "option_c": "Décret N°2009-228/ PRES/PM MASSN/MEBA/MESSRS", "option_d": "Arrêté N°2019-094/ MENAPLN/ SG/DGEFG", "reponse_correcte": "C", "explication": "Ce décret de 2009 fixe les âges d'entrée du préscolaire au supérieur.", "categorie": "legislation", "is_active": True},
        {"numero": 5, "enonce": "Quel arrêté porte modalité de rachat dans les enseignements post-primaire et secondaire ?", "option_a": "Arrêté N°2019-094/ MENAPLN/ SG /DGEFG", "option_b": "Arrêté N°2025-0063/ MESFPT/CB", "option_c": "Arrêté N°2025-010 MEEA/ MESFPT/ MESRI", "option_d": "Arrêté N°2022-062 MENAPLN/SG/DGD-LSCPA", "reponse_correcte": "A", "explication": "Cet arrêté de 2019 définit les modalités de rachat au post-primaire et au secondaire.", "categorie": "legislation", "is_active": True},
        {"numero": 6, "enonce": "Quelle est la loi qui régit les marchés publics au Burkina Faso ?", "option_a": "Loi n°003-2010/AN", "option_b": "Loi n°039-2016/AN", "option_c": "Loi n°12-2005/AN", "option_d": "Loi n°21-2012/AN", "reponse_correcte": "B", "explication": "La loi n°039-2016/AN portant réglementation générale des marchés publics et des délégations de service public encadre la commande publique au Burkina Faso.", "categorie": "marches_publics", "is_active": True},
        {"numero": 7, "enonce": "Quelle institution est chargée du contrôle a priori des marchés publics ?", "option_a": "Cour des Comptes", "option_b": "ARMP", "option_c": "DGCMEF", "option_d": "Direction de la commande publique", "reponse_correcte": "C", "explication": "La Direction Générale du Contrôle des Marchés Publics et des Engagements Financiers (DGCMEF) exerce le contrôle a priori sur les marchés.", "categorie": "marches_publics", "is_active": True},
        {"numero": 8, "enonce": "Quel est l'organe de recours en matière de marchés publics ?", "option_a": "Ministère de l'Économie", "option_b": "ARMP", "option_c": "DGCMEF", "option_d": "Cour des Comptes", "reponse_correcte": "B", "explication": "L'Autorité de Régulation de la Commande Publique (ARMP) reçoit et traite les recours des candidats ou soumissionnaires.", "categorie": "marches_publics", "is_active": True},
        {"numero": 9, "enonce": "Quel est le seuil de passation en appel d'offres ouvert pour les marchés de travaux ?", "option_a": "50 millions FCFA", "option_b": "100 millions FCFA", "option_c": "200 millions FCFA", "option_d": "300 millions FCFA", "reponse_correcte": "C", "explication": "Pour les marchés de travaux, le seuil à partir duquel un appel d'offres ouvert est obligatoire est de 200 millions FCFA.", "categorie": "marches_publics", "is_active": True},
        {"numero": 10, "enonce": "Quelle procédure est utilisée pour les marchés de faible montant ?", "option_a": "Appel d'offres restreint", "option_b": "Demande de prix", "option_c": "Appel d'offres ouvert", "option_d": "Gré à gré", "reponse_correcte": "B", "explication": "La demande de prix est la procédure simplifiée utilisée pour les petits montants en dessous des seuils fixés.", "categorie": "marches_publics", "is_active": True},
        {"numero": 11, "enonce": "Quel principe impose la justification des décisions d'attribution ?", "option_a": "Transparence", "option_b": "Confidentialité", "option_c": "Sélectivité", "option_d": "Moralité", "reponse_correcte": "A", "explication": "Les décisions doivent pouvoir être expliquées et contrôlées selon le principe de transparence.", "categorie": "principes", "is_active": True},
        {"numero": 12, "enonce": "La lutte contre la corruption est directement liée au principe de :", "option_a": "Libre concurrence", "option_b": "Moralité", "option_c": "Efficacité", "option_d": "Publicité", "reponse_correcte": "B", "explication": "Le principe de moralité exige l'intégrité dans toutes les procédures.", "categorie": "principes", "is_active": True},
        {"numero": 13, "enonce": "Quel principe garantit l'accès équitable à l'information sur les marchés ?", "option_a": "Égalité de traitement", "option_b": "Transparence", "option_c": "Efficacité", "option_d": "Performance", "reponse_correcte": "B", "explication": "L'information doit être diffusée de façon claire et ouverte selon le principe de transparence.", "categorie": "principes", "is_active": True},
        {"numero": 14, "enonce": "Le principe de libre concurrence suppose :", "option_a": "Des critères flous", "option_b": "Une publicité suffisante", "option_c": "Une sélection directe", "option_d": "Une négociation secrète", "reponse_correcte": "B", "explication": "Sans information, il ne peut y avoir de concurrence réelle. La publicité suffisante est donc indispensable.", "categorie": "principes", "is_active": True},
        {"numero": 15, "enonce": "L'application simultanée des principes des marchés publics vise surtout à :", "option_a": "Complexifier les procédures", "option_b": "Sécuriser la commande publique", "option_c": "Favoriser l'administration", "option_d": "Retarder les projets", "reponse_correcte": "B", "explication": "Ces principes garantissent légalité, équité et efficacité pour sécuriser la commande publique.", "categorie": "principes", "is_active": True},
        {"numero": 16, "enonce": "Quelle institution nationale vérifie la gestion des fonds issus des marchés publics ?", "option_a": "ARCOP", "option_b": "Cour des comptes", "option_c": "DG-CMP", "option_d": "Ministère du Commerce", "reponse_correcte": "B", "explication": "La Cour des comptes assure le contrôle juridictionnel des finances publiques.", "categorie": "controle", "is_active": True},
        {"numero": 17, "enonce": "Quel seuil approximatif est souvent utilisé pour les marchés de fournitures avant l'appel d'offres ?", "option_a": "10 millions FCFA", "option_b": "25 millions FCFA", "option_c": "75 millions FCFA", "option_d": "300 millions FCFA", "reponse_correcte": "B", "explication": "Ce seuil de 25 millions FCFA sert généralement de limite pour certaines procédures simplifiées.", "categorie": "seuils", "is_active": True},
        {"numero": 18, "enonce": "Quel seuil déclenche généralement l'appel d'offres international ?", "option_a": "10 millions FCFA", "option_b": "50 millions FCFA", "option_c": "500 millions FCFA", "option_d": "5 milliards FCFA", "reponse_correcte": "C", "explication": "Les montants très élevés (500 millions FCFA et plus) nécessitent souvent une concurrence internationale.", "categorie": "seuils", "is_active": True},
        {"numero": 19, "enonce": "Pour les prestations intellectuelles, quel seuil peut conduire à la sélection basée sur la qualité et le coût ?", "option_a": "5 millions FCFA", "option_b": "10 millions FCFA", "option_c": "25 millions FCFA", "option_d": "200 millions FCFA", "reponse_correcte": "C", "explication": "Ce seuil de 25 millions FCFA peut déclencher des procédures spécifiques pour les consultants.", "categorie": "seuils", "is_active": True},
        {"numero": 20, "enonce": "Quelle entité administrative est chargée du contrôle a priori de la commande publique au Burkina Faso ?", "option_a": "ARMP", "option_b": "Autorité contractante", "option_c": "Direction générale du contrôle des marchés publics (DGCMP)", "option_d": "Cour des comptes", "reponse_correcte": "C", "explication": "La DGCMP exerce le contrôle administratif préalable sur les procédures de passation des marchés publics.", "categorie": "controle", "is_active": True},
    ]
    
    url_demo = f"{SUPABASE_URL}/rest/v1/demo_questions"
    headers_upsert_demo = dict(headers_admin)
    headers_upsert_demo["Prefer"] = "resolution=merge-duplicates,return=representation"
    
    r_demo = requests.post(url_demo, headers=headers_upsert_demo, json=demo_questions)
    print(f"Status QCM démo: {r_demo.status_code}")
    if r_demo.status_code in [200, 201]:
        result = r_demo.json()
        print(f"✅ {len(result) if isinstance(result, list) else '?'} QCM démo insérés")
    else:
        print(f"Réponse: {r_demo.text[:400]}")
else:
    print("⚠️  Table demo_questions n'existe pas encore")


# ============================================================
# VÉRIFICATION FINALE
# ============================================================
print_separator("VÉRIFICATION FINALE")

tables = ['profiles', 'categories', 'sous_categories', 'demo_questions', 'questions']
for table in tables:
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?select=count", headers=headers_admin)
    if r.status_code == 200:
        data = r.json()
        count = len(data) if isinstance(data, list) else data
        print(f"✅ Table {table}: {count} enregistrements")
    else:
        print(f"❌ Table {table}: {r.status_code} - {r.text[:100]}")

print("\n")
print("="*60)
print("  RÉSUMÉ DES COMPTES CRÉÉS")
print("="*60)
print(f"""
🔐 SUPERADMIN:
   Email:    admin@ifl.bf
   Tél:      +22600000000
   MDP:      IFL@Admin2025!
   Rôle:     superadmin
   UUID:     {superadmin_uuid}
   
👤 ADMIN NIAMPA:
   Tél:      +22676223962
   MDP:      NIAMPA@IFL2025!
   Email:    +22676223962@ifl.app
   Rôle:     admin
   UUID:     {niampa_uuid if niampa_uuid else 'Voir Supabase'}
   
🌐 URL App:  https://ideal-formation-leaders.pages.dev
🔧 Admin:   https://ideal-formation-leaders.pages.dev (Onglet Profil)
""")
