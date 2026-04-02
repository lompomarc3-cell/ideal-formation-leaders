#!/usr/bin/env python3
"""
Migration SQL via l'API REST Supabase avec la clé anon
Les tables sont créées via l'API Management ou via SQL Editor
"""
import requests
import json

SUPABASE_URL = "https://cyasoaihjjochwhnhwqf.supabase.co"
# Utilisons l'anon key pour les opérations REST
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTkyMDUsImV4cCI6MjA4OTkzNTIwNX0.iZx5CKV4oY80POmPYs6_PMa-2vG5kNTHhOHD5M3HX44"

# Essayons d'accéder aux tables via l'API REST
headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json"
}

def test_connection():
    """Tester la connexion à Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/"
    response = requests.get(url, headers=headers)
    print(f"Test connexion: {response.status_code}")
    return response.status_code == 200

def check_tables():
    """Vérifier quelles tables existent"""
    tables = ['profiles', 'categories', 'sous_categories', 'questions']
    for table in tables:
        url = f"{SUPABASE_URL}/rest/v1/{table}?select=count"
        resp_headers = {**headers, "Prefer": "count=exact"}
        response = requests.get(url, headers=resp_headers)
        if response.status_code == 200:
            count = response.headers.get('content-range', 'vide')
            print(f"✅ Table '{table}' existe: {count}")
        else:
            print(f"❌ Table '{table}': {response.status_code} - La table n'existe pas encore")

def insert_categories():
    """Insérer les catégories si elles n'existent pas"""
    url = f"{SUPABASE_URL}/rest/v1/categories"
    resp_headers = {**headers, "Prefer": "resolution=merge-duplicates,return=minimal"}
    
    categories = [
        {
            "id": "11111111-1111-1111-1111-111111111111",
            "nom": "Concours Direct",
            "type_concours": "direct",
            "ordre": 1,
            "description": "Concours ouverts aux candidats diplômés"
        },
        {
            "id": "22222222-2222-2222-2222-222222222222",
            "nom": "Concours Professionnel",
            "type_concours": "professionnel",
            "ordre": 2,
            "description": "Concours réservés aux fonctionnaires"
        }
    ]
    
    response = requests.post(url, headers=resp_headers, json=categories)
    if response.status_code in [200, 201, 204]:
        print("✅ Catégories insérées/mises à jour !")
    else:
        print(f"❌ Erreur catégories: {response.status_code} - {response.text[:200]}")

def insert_sous_categories():
    """Insérer les 22 sous-catégories"""
    url = f"{SUPABASE_URL}/rest/v1/sous_categories"
    resp_headers = {**headers, "Prefer": "resolution=merge-duplicates,return=minimal"}
    
    direct = [
        {"nom": "Culture Générale", "categorie_id": "11111111-1111-1111-1111-111111111111", "type_concours": "direct", "ordre": 1, "description": "Histoire, géographie, actualité"},
        {"nom": "Français - Expression Écrite", "categorie_id": "11111111-1111-1111-1111-111111111111", "type_concours": "direct", "ordre": 2, "description": "Grammaire, orthographe, rédaction"},
        {"nom": "Mathématiques Générales", "categorie_id": "11111111-1111-1111-1111-111111111111", "type_concours": "direct", "ordre": 3, "description": "Arithmétique, algèbre, logique"},
        {"nom": "Connaissance de l'Administration", "categorie_id": "11111111-1111-1111-1111-111111111111", "type_concours": "direct", "ordre": 4, "description": "Organisation de l'État burkinabè"},
        {"nom": "Droit Constitutionnel", "categorie_id": "11111111-1111-1111-1111-111111111111", "type_concours": "direct", "ordre": 5, "description": "Constitution du Burkina Faso"},
        {"nom": "Droit Administratif", "categorie_id": "11111111-1111-1111-1111-111111111111", "type_concours": "direct", "ordre": 6, "description": "Actes administratifs, procédures"},
        {"nom": "Finances Publiques", "categorie_id": "11111111-1111-1111-1111-111111111111", "type_concours": "direct", "ordre": 7, "description": "Budget de l'État, comptabilité"},
        {"nom": "Informatique et Numérique", "categorie_id": "11111111-1111-1111-1111-111111111111", "type_concours": "direct", "ordre": 8, "description": "Outils bureautiques, internet"},
        {"nom": "Développement Durable", "categorie_id": "11111111-1111-1111-1111-111111111111", "type_concours": "direct", "ordre": 9, "description": "Écologie, développement durable"},
        {"nom": "Logique et Raisonnement", "categorie_id": "11111111-1111-1111-1111-111111111111", "type_concours": "direct", "ordre": 10, "description": "Tests psychotechniques, aptitudes"},
    ]
    
    professionnel = [
        {"nom": "Statut de la Fonction Publique", "categorie_id": "22222222-2222-2222-2222-222222222222", "type_concours": "professionnel", "ordre": 1, "description": "Droits et obligations des fonctionnaires"},
        {"nom": "Droit du Travail et Social", "categorie_id": "22222222-2222-2222-2222-222222222222", "type_concours": "professionnel", "ordre": 2, "description": "Code du travail, protection sociale"},
        {"nom": "Management et Administration", "categorie_id": "22222222-2222-2222-2222-222222222222", "type_concours": "professionnel", "ordre": 3, "description": "Gestion des ressources humaines"},
        {"nom": "Comptabilité et Budget", "categorie_id": "22222222-2222-2222-2222-222222222222", "type_concours": "professionnel", "ordre": 4, "description": "Comptabilité, gestion budgétaire"},
        {"nom": "Marchés Publics", "categorie_id": "22222222-2222-2222-2222-222222222222", "type_concours": "professionnel", "ordre": 5, "description": "Code des marchés publics"},
        {"nom": "Droit Pénal et Éthique", "categorie_id": "22222222-2222-2222-2222-222222222222", "type_concours": "professionnel", "ordre": 6, "description": "Déontologie, éthique professionnelle"},
        {"nom": "Relations Internationales", "categorie_id": "22222222-2222-2222-2222-222222222222", "type_concours": "professionnel", "ordre": 7, "description": "Diplomatie, organisations internationales"},
        {"nom": "Économie et Développement", "categorie_id": "22222222-2222-2222-2222-222222222222", "type_concours": "professionnel", "ordre": 8, "description": "Macro-économie, politiques économiques"},
        {"nom": "Planification et Décentralisation", "categorie_id": "22222222-2222-2222-2222-222222222222", "type_concours": "professionnel", "ordre": 9, "description": "Plans de développement, collectivités"},
        {"nom": "Rédaction Administrative", "categorie_id": "22222222-2222-2222-2222-222222222222", "type_concours": "professionnel", "ordre": 10, "description": "Note de service, rapport, correspondance"},
        {"nom": "Fiscalité et Douanes", "categorie_id": "22222222-2222-2222-2222-222222222222", "type_concours": "professionnel", "ordre": 11, "description": "Impôts, taxes, code douanier"},
        {"nom": "Numérique et Transformation Digitale", "categorie_id": "22222222-2222-2222-2222-222222222222", "type_concours": "professionnel", "ordre": 12, "description": "E-gouvernement, cybersécurité"},
    ]
    
    all_sc = direct + professionnel
    response = requests.post(url, headers=resp_headers, json=all_sc)
    if response.status_code in [200, 201, 204]:
        print(f"✅ {len(all_sc)} sous-catégories insérées ({len(direct)} direct + {len(professionnel)} professionnel) !")
    else:
        print(f"❌ Erreur sous-catégories: {response.status_code} - {response.text[:300]}")

if __name__ == "__main__":
    print("=== IFL - Vérification Supabase ===\n")
    test_connection()
    check_tables()
    print("\n=== Tentative d'insertion des données ===\n")
    insert_categories()
    insert_sous_categories()
    print("\n✅ Terminé!")
    print("\n⚠️  IMPORTANT: Si les tables n'existent pas,")
    print("   exécutez 'supabase_migration_ifl.sql' dans")
    print("   Supabase Dashboard > SQL Editor")
