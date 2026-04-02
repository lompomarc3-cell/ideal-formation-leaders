-- ============================================================
-- SCRIPT: Création du compte Administrateur NIAMPA Issa
-- MÉTHODE: Via l'API Supabase (à exécuter APRÈS la migration principale)
-- ============================================================

-- Étape 1: Créer l'utilisateur auth via Supabase Admin API
-- URL: POST https://cyasoaihjjochwhnhwqf.supabase.co/auth/v1/admin/users
-- Headers: Authorization: Bearer sbp_993dc7fba4d7f9993f8975171a5803af77717306
-- Body:
-- {
--   "email": "+22676223962@ifl.app",
--   "password": "NIAMPA@IFL2025!",
--   "email_confirm": true,
--   "user_metadata": {
--     "nom": "NIAMPA",
--     "prenom": "Issa",
--     "telephone": "+22676223962"
--   }
-- }

-- Étape 2: Après création, mettre à jour le profil en admin
-- (ce script sera exécuté automatiquement via l'app)
UPDATE public.profiles 
SET role = 'admin', 
    nom = 'NIAMPA', 
    prenom = 'Issa'
WHERE telephone = '+22676223962';

-- Si le profil n'existe pas encore, l'insérer avec l'ID de l'utilisateur créé
-- Remplacez 'UUID_ICI' par l'UUID retourné par l'API Admin
-- INSERT INTO public.profiles (id, telephone, nom, prenom, role)
-- VALUES ('UUID_ICI', '+22676223962', 'NIAMPA', 'Issa', 'admin')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';
