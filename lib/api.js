import { supabase, supabaseAdmin } from './supabase'

// Auth functions
export async function registerUser({ phone, nom, prenom, password }) {
  const bcrypt = require('bcryptjs')
  const passwordHash = await bcrypt.hash(password, 10)
  
  // First create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: `${phone.replace(/\+/g, '')}@ifl.bf`,
    password: password,
    email_confirm: true,
    user_metadata: { phone, nom, prenom }
  })
  
  if (authError) throw authError
  
  // Create profile
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: authData.user.id,
      full_name: `${prenom} ${nom}`,
      phone: phone,
      role: 'user',
      subscription_status: 'free'
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function loginUser({ phone, password }) {
  const email = `${phone.replace(/\+/g, '')}@ifl.bf`
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  return data
}

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

export async function getCategories(type) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('type', type)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data
}

export async function getQuestions(categoryId) {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data
}

export async function saveProgress(userId, categoryId, lastQuestionIndex, score) {
  const { data, error } = await supabaseAdmin
    .from('user_progress')
    .upsert({
      user_id: userId,
      categorie_id: categoryId,
      score: score,
      questions_vues: lastQuestionIndex,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,categorie_id' })
    .select()
  
  if (error) throw error
  return data
}

export async function getProgress(userId, categoryId) {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('categorie_id', categoryId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function createPaymentRequest({ userId, montant, typeAbonnement }) {
  const { data, error } = await supabaseAdmin
    .from('correction_requests')
    .insert({
      user_id: userId,
      message: `PAIEMENT_${typeAbonnement}_${montant}FCFA`,
      status: 'pending'
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}
