// Composant pour l'ajout massif de QCM
import { useState, useEffect } from 'react'

export default function BulkQCMAdd({ token, onSuccess }) {
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [bulkMode, setBulkMode] = useState('json') // 'json' ou 'form'
  const [jsonData, setJsonData] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  // Questions pour le mode formulaire
  const [formQuestions, setFormQuestions] = useState([{
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    bonne_reponse: 'A',
    explication: ''
  }])

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/quiz/categories', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.categories) {
        setCategories(data.categories)
      }
    } catch (err) {
      console.error('Erreur chargement catégories:', err)
    }
  }

  const addFormQuestion = () => {
    setFormQuestions([...formQuestions, {
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      bonne_reponse: 'A',
      explication: ''
    }])
  }

  const removeFormQuestion = (index) => {
    const newQuestions = formQuestions.filter((_, i) => i !== index)
    setFormQuestions(newQuestions.length > 0 ? newQuestions : [{
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      bonne_reponse: 'A',
      explication: ''
    }])
  }

  const updateFormQuestion = (index, field, value) => {
    const newQuestions = [...formQuestions]
    newQuestions[index][field] = value
    setFormQuestions(newQuestions)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    
    if (!selectedCategory) {
      setError('Veuillez sélectionner une catégorie')
      return
    }

    setLoading(true)

    try {
      let questionsToAdd = []

      if (bulkMode === 'json') {
        try {
          const parsed = JSON.parse(jsonData)
          questionsToAdd = Array.isArray(parsed) ? parsed : [parsed]
        } catch (err) {
          setError('Format JSON invalide')
          setLoading(false)
          return
        }
      } else {
        // Mode formulaire
        questionsToAdd = formQuestions.filter(q => 
          q.question_text.trim() && 
          q.option_a.trim() && 
          q.option_b.trim()
        )
      }

      if (questionsToAdd.length === 0) {
        setError('Aucune question valide à ajouter')
        setLoading(false)
        return
      }

      // Ajouter chaque question
      let addedCount = 0
      let failedCount = 0

      for (const question of questionsToAdd) {
        const payload = {
          categorie_id: selectedCategory,
          question_text: question.question_text,
          option_a: question.option_a,
          option_b: question.option_b,
          option_c: question.option_c || '',
          option_d: question.option_d || '',
          bonne_reponse: question.bonne_reponse || 'A',
          explication: question.explication || ''
        }

        const res = await fetch('/api/admin/questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })

        if (res.ok) {
          addedCount++
        } else {
          failedCount++
        }
      }

      setSuccessMessage(`✅ ${addedCount} question(s) ajoutée(s) avec succès${failedCount > 0 ? ` (${failedCount} échec(s))` : ''}`)
      
      // Réinitialiser les formulaires
      if (bulkMode === 'json') {
        setJsonData('')
      } else {
        setFormQuestions([{
          question_text: '',
          option_a: '',
          option_b: '',
          option_c: '',
          option_d: '',
          bonne_reponse: 'A',
          explication: ''
        }])
      }

      if (onSuccess) onSuccess()
      
    } catch (err) {
      setError('Erreur lors de l\'ajout des questions')
    }

    setLoading(false)
  }

  const exampleJSON = `[
  {
    "question_text": "Quelle est la capitale du Burkina Faso ?",
    "option_a": "Ouagadougou",
    "option_b": "Bobo-Dioulasso",
    "option_c": "Koudougou",
    "option_d": "Banfora",
    "bonne_reponse": "A",
    "explication": "Ouagadougou est la capitale du Burkina Faso"
  },
  {
    "question_text": "En quelle année le Burkina Faso a-t-il obtenu son indépendance ?",
    "option_a": "1958",
    "option_b": "1960",
    "option_c": "1962",
    "option_d": "1964",
    "bonne_reponse": "B",
    "explication": "Le Burkina Faso a obtenu son indépendance le 5 août 1960"
  }
]`

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
        <h2 className="text-2xl font-extrabold mb-4" style={{ color: '#8B2500' }}>
          ➕ Ajout Massif de QCM
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border-2 border-red-200">
            <p className="text-red-700 font-semibold">❌ {error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-green-50 border-2 border-green-200">
            <p className="text-green-700 font-semibold">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Sélection de la catégorie */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              📂 Catégorie cible *
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
              required
            >
              <option value="">-- Sélectionnez une catégorie --</option>
              <optgroup label="Concours Directs">
                {categories.filter(c => c.type === 'direct').map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nom}</option>
                ))}
              </optgroup>
              <optgroup label="Concours Professionnels">
                {categories.filter(c => c.type === 'professionnel').map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nom}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Toggle mode */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              📝 Mode d'ajout
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBulkMode('form')}
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                  bulkMode === 'form'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📝 Formulaire
              </button>
              <button
                type="button"
                onClick={() => setBulkMode('json')}
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                  bulkMode === 'json'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📦 JSON/CSV
              </button>
            </div>
          </div>

          {/* Mode JSON */}
          {bulkMode === 'json' && (
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                📦 Données JSON (format tableau)
              </label>
              <textarea
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                placeholder={exampleJSON}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none font-mono text-sm"
                rows={15}
                required={bulkMode === 'json'}
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 Format: tableau JSON avec les champs: question_text, option_a, option_b, option_c, option_d, bonne_reponse, explication
              </p>
            </div>
          )}

          {/* Mode Formulaire */}
          {bulkMode === 'form' && (
            <div className="space-y-4 mb-4">
              {formQuestions.map((q, index) => (
                <div key={index} className="p-4 bg-amber-50 rounded-xl border-2 border-amber-200">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-800">Question {index + 1}</h3>
                    {formQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFormQuestion(index)}
                        className="text-red-600 hover:text-red-800 font-bold"
                      >
                        ❌ Supprimer
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Texte de la question *"
                      value={q.question_text}
                      onChange={(e) => updateFormQuestion(index, 'question_text', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Option A *"
                      value={q.option_a}
                      onChange={(e) => updateFormQuestion(index, 'option_a', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Option B *"
                      value={q.option_b}
                      onChange={(e) => updateFormQuestion(index, 'option_b', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Option C"
                      value={q.option_c}
                      onChange={(e) => updateFormQuestion(index, 'option_c', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Option D"
                      value={q.option_d}
                      onChange={(e) => updateFormQuestion(index, 'option_d', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg"
                    />
                    <select
                      value={q.bonne_reponse}
                      onChange={(e) => updateFormQuestion(index, 'bonne_reponse', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                    <textarea
                      placeholder="Explication (optionnel)"
                      value={q.explication}
                      onChange={(e) => updateFormQuestion(index, 'explication', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg"
                      rows={2}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addFormQuestion}
                className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all"
              >
                ➕ Ajouter une autre question
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 text-white font-extrabold rounded-xl transition-all disabled:opacity-50"
            style={{ background: loading ? '#999' : '#C4521A' }}
          >
            {loading ? '⏳ Ajout en cours...' : '✅ Ajouter les questions'}
          </button>
        </form>
      </div>
    </div>
  )
}
