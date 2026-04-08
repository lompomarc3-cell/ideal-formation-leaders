export const runtime = 'edge'
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const { secret } = await req.json()
  if (secret !== 'IFL_ADD_CATEGORIES_2025') {
    return new Response(JSON.stringify({ error: 'Non autorisé' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const newCategories = [
    {
      nom: 'Actualités et Culture Générale',
      type: 'professionnel',
      description: 'Actualités internationales, culture générale approfondie et enjeux contemporains',
      prix: 20000,
      is_active: true,
      question_count: 0
    },
    {
      nom: 'Justice',
      type: 'professionnel',
      description: 'Droit judiciaire, procédures juridiques et système judiciaire burkinabè',
      prix: 20000,
      is_active: true,
      question_count: 0
    },
    {
      nom: 'Magistrature',
      type: 'professionnel',
      description: 'Formation spécialisée pour les concours de la magistrature',
      prix: 20000,
      is_active: true,
      question_count: 0
    }
  ]

  const results = []

  for (const category of newCategories) {
    // Vérifier si la catégorie existe déjà
    const { data: existing } = await supabaseAdmin
      .from('categories')
      .select('id, nom')
      .eq('nom', category.nom)
      .eq('type', 'professionnel')
      .maybeSingle()

    if (existing) {
      results.push({
        nom: category.nom,
        status: 'exists',
        message: `Catégorie "${category.nom}" existe déjà`,
        id: existing.id
      })
      continue
    }

    // Insérer la nouvelle catégorie
    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert([category])
      .select()

    if (error) {
      results.push({
        nom: category.nom,
        status: 'error',
        message: error.message
      })
    } else {
      results.push({
        nom: category.nom,
        status: 'success',
        message: `Catégorie "${category.nom}" ajoutée avec succès`,
        id: data[0].id
      })
    }
  }

  // Récupérer la liste finale des catégories professionnelles
  const { data: allCategories } = await supabaseAdmin
    .from('categories')
    .select('id, nom, type, prix')
    .eq('type', 'professionnel')
    .order('created_at', { ascending: true })

  return new Response(JSON.stringify({
    success: true,
    results,
    total_professional_categories: allCategories?.length || 0,
    categories: allCategories
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
