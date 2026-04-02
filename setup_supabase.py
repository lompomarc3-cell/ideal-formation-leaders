#!/usr/bin/env python3
"""
Script de création du compte administrateur NIAMPA Issa
et insertion des données via l'API Supabase
"""
import requests
import json

SUPABASE_URL = "https://cyasoaihjjochwhnhwqf.supabase.co"
SERVICE_ROLE_KEY = "sbp_993dc7fba4d7f9993f8975171a5803af77717306"

headers = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json"
}

def create_admin_user():
    """Créer le compte admin NIAMPA Issa"""
    print("🔧 Création du compte administrateur NIAMPA Issa...")
    
    # Créer l'utilisateur via Supabase Admin API
    url = f"{SUPABASE_URL}/auth/v1/admin/users"
    data = {
        "email": "+22676223962@ifl.app",
        "password": "NIAMPA@IFL2025!",
        "email_confirm": True,
        "user_metadata": {
            "nom": "NIAMPA",
            "prenom": "Issa",
            "telephone": "+22676223962"
        }
    }
    
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code in [200, 201]:
        user_data = response.json()
        user_id = user_data.get('id')
        print(f"✅ Utilisateur créé avec ID: {user_id}")
        return user_id
    elif response.status_code == 422:
        print("⚠️  L'utilisateur existe déjà, récupération de l'ID...")
        return get_existing_user_id("+22676223962@ifl.app")
    else:
        print(f"❌ Erreur création utilisateur: {response.status_code}")
        print(f"   Réponse: {response.text}")
        return None

def get_existing_user_id(email):
    """Récupérer l'ID d'un utilisateur existant"""
    url = f"{SUPABASE_URL}/auth/v1/admin/users"
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        users = response.json().get('users', [])
        for user in users:
            if user.get('email') == email:
                return user.get('id')
    return None

def create_admin_profile(user_id):
    """Créer ou mettre à jour le profil admin dans la table profiles"""
    print(f"🔧 Création du profil admin pour {user_id}...")
    
    # Essayer d'abord d'insérer
    url = f"{SUPABASE_URL}/rest/v1/profiles"
    data = {
        "id": user_id,
        "telephone": "+22676223962",
        "nom": "NIAMPA",
        "prenom": "Issa",
        "role": "admin"
    }
    
    resp_headers = {**headers, "Prefer": "return=minimal,resolution=merge-duplicates"}
    response = requests.post(url, headers=resp_headers, json=data)
    
    if response.status_code in [200, 201, 204]:
        print("✅ Profil admin créé/mis à jour !")
        return True
    else:
        # Essayer avec PATCH
        url_patch = f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}"
        response2 = requests.patch(
            url_patch,
            headers=headers,
            json={"role": "admin", "nom": "NIAMPA", "prenom": "Issa", "telephone": "+22676223962"}
        )
        if response2.status_code in [200, 201, 204]:
            print("✅ Profil admin mis à jour !")
            return True
        else:
            print(f"❌ Erreur profil: {response.status_code} - {response.text}")
            return False

def verify_database():
    """Vérifier que les tables et données existent"""
    print("\n📊 Vérification de la base de données...")
    
    tables = ['categories', 'sous_categories', 'questions', 'profiles']
    for table in tables:
        url = f"{SUPABASE_URL}/rest/v1/{table}?select=count"
        resp_headers = {**headers, "Prefer": "count=exact"}
        response = requests.get(url, headers=resp_headers)
        count = response.headers.get('content-range', 'N/A')
        print(f"   📋 {table}: {count}")

def main():
    print("=" * 60)
    print("  IFL - Idéal Formation Leaders")
    print("  Configuration de la base de données Supabase")
    print("=" * 60)
    
    # Vérifier les données existantes
    verify_database()
    
    # Créer le compte admin
    user_id = create_admin_user()
    if user_id:
        create_admin_profile(user_id)
    
    print("\n✅ Configuration terminée !")
    print("\n📋 Informations de connexion Admin:")
    print("   Téléphone: +22676223962")
    print("   Mot de passe: NIAMPA@IFL2025!")
    print("   Rôle: Administrateur")
    print("\n💡 Connectez-vous à l'application avec ces identifiants")

if __name__ == "__main__":
    main()
