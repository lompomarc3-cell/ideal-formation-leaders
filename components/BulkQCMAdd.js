// Composant Import Massif QCM – Version améliorée
// Supporte: texte brut (format DOCX), JSON, formulaire simple
import { useState, useEffect, useRef } from 'react'

const EXEMPLE_TEXTE = `1. Quelle est la capitale du Burkina Faso ?
A) Ouagadougou  B) Bobo-Dioulasso
C) Koudougou  D) Banfora
Réponse : A) Ouagadougou
Explication : Ouagadougou est la capitale politique et administrative.

2. En quelle année le Burkina Faso a-t-il obtenu son indépendance ?
A) 1958  B) 1960
C) 1962  D) 1964
Réponse : B) 1960
Explication : Le Burkina Faso a accédé à l'indépendance le 5 août 1960.`

// Helper : extrait toutes les options "X) ..." présentes sur une même ligne
// en utilisant les positions des marqueurs (gère correctement les options
// multi-mots du type : "A) L'étude des lois  B) L'étude de la gestion ...")
function extractOptionsFromLine(line) {
  const result = {}
  const markers = []
  const regex = /(^|\s)([A-D])\)\s/g
  let m
  while ((m = regex.exec(line)) !== null) {
    markers.push({
      letter: m[2],
      start: m.index + m[1].length,
      contentStart: m.index + m[0].length,
    })
  }
  for (let k = 0; k < markers.length; k++) {
    const cur = markers[k]
    const next = markers[k + 1]
    const text = line.substring(cur.contentStart, next ? next.start : line.length).trim()
    if (text) result[cur.letter] = text
  }
  return result
}

function parseTexte(raw) {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
  const questions = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    // Détection début de question: "1. ..." ou "1) ..."
    const qMatch = line.match(/^(\d+)[.)]\s+(.+)/)
    if (qMatch) {
      const enonce = qMatch[2]
      i++
      let opts = {}
      let repLine = null
      let explLine = null

      while (i < lines.length) {
        const l = lines[i]
        // Ligne contenant 1 ou plusieurs options "A) ..."  "B) ..." etc.
        const hasOption = /(^|\s)[A-D]\)\s/.test(l) &&
                          !/^[Rr]é?ponse/.test(l) &&
                          !/^[Ee]xplication/.test(l)
        if (hasOption) {
          const extracted = extractOptionsFromLine(l)
          for (const k of Object.keys(extracted)) {
            if (extracted[k]) opts[k] = extracted[k]
          }
          i++
          continue
        }
        if (/^[Rr]é?ponse\s*:/.test(l)) { repLine = l; i++; continue }
        if (/^[Ee]xplication\s*:/.test(l)) { explLine = l; i++; break }
        // Nouvelle question → stop
        if (/^\d+[.)]\s/.test(l)) break
        i++
      }

      // Extraire lettre correcte
      let correct = null
      if (repLine) {
        const rm = repLine.match(/[Rr]é?ponse\s*:\s*([A-D])/)
        if (rm) correct = rm[1]
      }

      // Explication
      let expl = ''
      if (explLine) {
        const em = explLine.match(/[Ee]xplication\s*:\s*(.+)/)
        if (em) expl = em[1].trim()
      }

      if (enonce && correct && Object.keys(opts).length >= 2) {
        questions.push({
          enonce: enonce.trim(),
          option_a: opts['A'] || '',
          option_b: opts['B'] || '',
          option_c: opts['C'] || '',
          option_d: opts['D'] || '',
          reponse_correcte: correct,
          explication: expl,
        })
      }
    } else {
      i++
    }
  }
  return questions
}

export default function BulkQCMAdd({ token, onSuccess }) {
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [mode, setMode] = useState('texte') // 'texte' | 'json' | 'form'
  const [rawText, setRawText] = useState('')
  const [jsonData, setJsonData] = useState('')
  const [preview, setPreview] = useState([])
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isDemo, setIsDemo] = useState(false)
  const fileRef = useRef()

  // Mode formulaire
  const emptyQ = () => ({ enonce: '', option_a: '', option_b: '', option_c: '', option_d: '', reponse_correcte: 'A', explication: '' })
  const [formQs, setFormQs] = useState([emptyQ()])

  useEffect(() => { fetchCategories() }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/quiz/categories', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.categories) setCategories(data.categories)
    } catch {}
  }

  // Aperçu depuis texte brut
  const handlePreviewTexte = () => {
    setError('')
    const qs = parseTexte(rawText)
    if (qs.length === 0) { setError('Aucune question détectée. Vérifiez le format.'); return }
    setPreview(qs)
    setShowPreview(true)
  }

  // Aperçu depuis JSON
  const handlePreviewJSON = () => {
    setError('')
    try {
      const parsed = JSON.parse(jsonData)
      const qs = Array.isArray(parsed) ? parsed : [parsed]
      setPreview(qs)
      setShowPreview(true)
    } catch { setError('JSON invalide. Vérifiez la syntaxe.') }
  }

  // Aperçu depuis formulaire
  const handlePreviewForm = () => {
    setError('')
    const qs = formQs.filter(q => q.enonce.trim() && q.option_a.trim() && q.option_b.trim())
    if (qs.length === 0) { setError('Remplissez au moins l\'énoncé et les options A et B.'); return }
    setPreview(qs)
    setShowPreview(true)
  }

  // Import depuis fichier
  const handleFileImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target.result
      if (file.name.endsWith('.json')) {
        setMode('json')
        setJsonData(content)
      } else {
        setMode('texte')
        setRawText(content)
      }
    }
    reader.readAsText(file, 'utf-8')
  }

  // Insertion finale
  const handleInsert = async () => {
    if (!selectedCategory) { setError('Sélectionnez un dossier cible.'); return }
    if (preview.length === 0) { setError('Aucune question à insérer.'); return }
    setLoading(true); setError(''); setSuccess('')

    const SUPABASE_URL = 'https://cyasoaihjjochwhnhwqf.supabase.co'
    const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YXNvYWloampvY2h3aG5od3FmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM1OTIwNSwiZXhwIjoyMDg5OTM1MjA1fQ.Oz2_Mj-TOPCPLNBBum-th3X8ncM9tvr70hZSEVq9JuA'

    const payload = preview.map((q, idx) => ({
      category_id: selectedCategory,
      enonce: q.enonce || q.question_text || '',
      option_a: q.option_a || '',
      option_b: q.option_b || '',
      option_c: q.option_c || '',
      option_d: q.option_d || '',
      reponse_correcte: q.reponse_correcte || q.bonne_reponse || 'A',
      explication: q.explication || '',
      matiere: categories.find(c => c.id === selectedCategory)?.nom || '',
      difficulte: 'moyen',
      is_demo: isDemo,
      is_active: true,
    }))

    try {
      // 1) Détection préalable des doublons (même énoncé déjà actif dans la catégorie)
      const enoncesNew = payload.map(p => (p.enonce || '').trim().toLowerCase()).filter(Boolean)
      let existingEnonces = new Set()
      try {
        const dupRes = await fetch(
          `${SUPABASE_URL}/rest/v1/questions?category_id=eq.${selectedCategory}&is_active=eq.true&select=enonce`,
          { headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` } }
        )
        if (dupRes.ok) {
          const rows = await dupRes.json()
          existingEnonces = new Set(rows.map(r => (r.enonce || '').trim().toLowerCase()))
        }
      } catch {}

      const filtered = payload.filter(p => !existingEnonces.has((p.enonce || '').trim().toLowerCase()))
      const skipped = payload.length - filtered.length

      if (filtered.length === 0) {
        setError(`Aucune nouvelle question : ${skipped} doublon(s) détecté(s).`)
        setLoading(false)
        return
      }

      const res = await fetch(`${SUPABASE_URL}/rest/v1/questions`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(filtered)
      })

      if (res.ok || res.status === 204) {
        // Recalculer le question_count à partir du nombre RÉEL de questions actives
        try {
          const countRes = await fetch(
            `${SUPABASE_URL}/rest/v1/questions?category_id=eq.${selectedCategory}&is_active=eq.true&select=id`,
            { headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Prefer': 'count=exact' } }
          )
          let realCount = 0
          if (countRes.ok) {
            const rows = await countRes.json()
            realCount = rows.length
          }
          await fetch(`${SUPABASE_URL}/rest/v1/categories?id=eq.${selectedCategory}`, {
            method: 'PATCH',
            headers: {
              'apikey': SERVICE_KEY,
              'Authorization': `Bearer ${SERVICE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ question_count: realCount })
          })
        } catch {}

        const msg = skipped > 0
          ? `✅ ${filtered.length} question(s) importée(s) (${skipped} doublon(s) ignoré(s)) !`
          : `✅ ${filtered.length} question(s) importée(s) avec succès !`
        setSuccess(msg)
        setShowPreview(false); setPreview([])
        setRawText(''); setJsonData(''); setFormQs([emptyQ()])
        fetchCategories()
        if (onSuccess) onSuccess()
      } else {
        const err = await res.json()
        setError(`Erreur Supabase: ${err.message || res.status}`)
      }
    } catch (e) { setError(`Erreur réseau: ${e.message}`) }
    setLoading(false)
  }

  const modeTabs = [
    { id: 'texte', label: '📝 Texte brut', desc: 'Copier/coller depuis Word' },
    { id: 'json', label: '📦 JSON', desc: 'Format structuré' },
    { id: 'form', label: '✏️ Formulaire', desc: 'Saisie manuelle' },
  ]

  return (
    <div className="space-y-4">
      {/* Titre */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100">
        <h2 className="font-extrabold text-lg mb-1" style={{ color: '#8B2500' }}>📥 Import massif de questions</h2>
        <p className="text-gray-500 text-sm">Ajoutez des dizaines de questions en 2-3 clics</p>
      </div>

      {/* Étape 1 : Mode */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100">
        <p className="font-bold text-gray-700 mb-3">① Choisir le mode d'import</p>
        <div className="grid grid-cols-3 gap-2">
          {modeTabs.map(t => (
            <button key={t.id} type="button" onClick={() => { setMode(t.id); setShowPreview(false); setError('') }}
              className={`p-3 rounded-xl border-2 text-center transition-all ${mode === t.id ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
              <p className="font-bold text-xs" style={{ color: mode === t.id ? '#8B2500' : '#555' }}>{t.label}</p>
              <p className="text-gray-400 text-xs mt-0.5 hidden sm:block">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Étape 2 : Dossier cible */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100">
        <p className="font-bold text-gray-700 mb-3">② Dossier cible</p>
        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none text-sm">
          <option value="">-- Sélectionnez un dossier --</option>
          <optgroup label="📚 Concours Directs">
            {categories.filter(c => c.type === 'direct').map(c => (
              <option key={c.id} value={c.id}>{c.nom} ({c.question_count || 0} q.)</option>
            ))}
          </optgroup>
          <optgroup label="🎓 Concours Professionnels">
            {categories.filter(c => c.type === 'professionnel').map(c => (
              <option key={c.id} value={c.id}>{c.nom} ({c.question_count || 0} q.)</option>
            ))}
          </optgroup>
        </select>
        <label className="flex items-center gap-2 mt-2 cursor-pointer">
          <input type="checkbox" checked={isDemo} onChange={e => setIsDemo(e.target.checked)} className="w-4 h-4" />
          <span className="text-sm text-gray-600">Marquer comme questions gratuites (démo)</span>
        </label>
      </div>

      {/* Étape 3 : Contenu */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100">
        <p className="font-bold text-gray-700 mb-3">③ Saisir les questions</p>

        {/* Import fichier */}
        <div className="mb-3 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-xs text-gray-500 mb-2 font-medium">📎 Ou importer un fichier (.txt, .json) :</p>
          <input ref={fileRef} type="file" accept=".txt,.json,.csv" onChange={handleFileImport} className="hidden" />
          <button type="button" onClick={() => fileRef.current.click()}
            className="px-4 py-2 text-sm font-bold rounded-lg border-2 border-gray-300 bg-white hover:bg-gray-100 transition-all">
            📂 Choisir un fichier
          </button>
        </div>

        {/* Mode texte brut */}
        {mode === 'texte' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-gray-600">Coller votre texte (format Word/DOCX) :</label>
              <button type="button" onClick={() => setRawText(EXEMPLE_TEXTE)}
                className="text-xs font-bold px-2 py-1 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200">
                Voir exemple
              </button>
            </div>
            <textarea value={rawText} onChange={e => setRawText(e.target.value)}
              placeholder={`Exemple :\n1. Quelle est la capitale du Burkina Faso ?\nA) Ouagadougou  B) Bobo-Dioulasso\nC) Koudougou  D) Banfora\nRéponse : A) Ouagadougou\nExplication : Ouagadougou est la capitale.`}
              className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl font-mono text-sm focus:border-amber-500 focus:outline-none"
              rows={12} />
            <p className="text-xs text-gray-400 mt-1">Format accepté : numéro + question, options A) B) C) D), Réponse :, Explication :</p>
            <button type="button" onClick={handlePreviewTexte} disabled={!rawText.trim()}
              className="mt-3 w-full py-3 font-extrabold text-white rounded-xl transition-all disabled:opacity-50"
              style={{ background: '#C4521A' }}>
              👁️ Aperçu des questions détectées
            </button>
          </div>
        )}

        {/* Mode JSON */}
        {mode === 'json' && (
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2">Coller votre JSON :</label>
            <textarea value={jsonData} onChange={e => setJsonData(e.target.value)}
              placeholder={`[\n  {\n    "enonce": "Question ?",\n    "option_a": "A",\n    "option_b": "B",\n    "option_c": "C",\n    "option_d": "D",\n    "reponse_correcte": "A",\n    "explication": "Explication..."\n  }\n]`}
              className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl font-mono text-sm focus:border-amber-500 focus:outline-none"
              rows={12} />
            <button type="button" onClick={handlePreviewJSON} disabled={!jsonData.trim()}
              className="mt-3 w-full py-3 font-extrabold text-white rounded-xl transition-all disabled:opacity-50"
              style={{ background: '#C4521A' }}>
              👁️ Aperçu des questions
            </button>
          </div>
        )}

        {/* Mode formulaire */}
        {mode === 'form' && (
          <div className="space-y-4">
            {formQs.map((q, idx) => (
              <div key={idx} className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-bold text-sm" style={{ color: '#8B2500' }}>Question {idx + 1}</p>
                  {formQs.length > 1 && (
                    <button type="button" onClick={() => setFormQs(formQs.filter((_, i) => i !== idx))}
                      className="text-red-500 text-xs font-bold">✕ Suppr.</button>
                  )}
                </div>
                <div className="space-y-2">
                  <textarea placeholder="Énoncé de la question *" value={q.enonce}
                    onChange={e => { const nq = [...formQs]; nq[idx].enonce = e.target.value; setFormQs(nq) }}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm" rows={2} />
                  {['a', 'b', 'c', 'd'].map(opt => (
                    <div key={opt} className="flex gap-2 items-center">
                      <span className="font-bold text-sm w-6 text-center uppercase" style={{ color: '#C4521A' }}>{opt}</span>
                      <input type="text" placeholder={`Option ${opt.toUpperCase()}${opt <= 'b' ? ' *' : ''}`}
                        value={q[`option_${opt}`]}
                        onChange={e => { const nq = [...formQs]; nq[idx][`option_${opt}`] = e.target.value; setFormQs(nq) }}
                        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm" />
                    </div>
                  ))}
                  <div className="flex gap-2 items-center">
                    <span className="text-sm font-bold text-gray-600 w-24">Réponse :</span>
                    <select value={q.reponse_correcte}
                      onChange={e => { const nq = [...formQs]; nq[idx].reponse_correcte = e.target.value; setFormQs(nq) }}
                      className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm">
                      {['A','B','C','D'].map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <input type="text" placeholder="Explication (optionnel)" value={q.explication}
                    onChange={e => { const nq = [...formQs]; nq[idx].explication = e.target.value; setFormQs(nq) }}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setFormQs([...formQs, emptyQ()])}
              className="w-full py-2.5 border-2 border-dashed border-amber-400 text-amber-700 font-bold rounded-xl text-sm hover:bg-amber-50">
              ➕ Ajouter une question
            </button>
            <button type="button" onClick={handlePreviewForm}
              className="w-full py-3 font-extrabold text-white rounded-xl transition-all"
              style={{ background: '#C4521A' }}>
              👁️ Aperçu ({formQs.filter(q => q.enonce.trim()).length} question(s))
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-3">
          <p className="text-red-700 font-semibold text-sm">❌ {error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-3">
          <p className="text-green-700 font-semibold text-sm">{success}</p>
        </div>
      )}

      {/* Aperçu avant insertion */}
      {showPreview && preview.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-extrabold" style={{ color: '#8B2500' }}>
              ④ Aperçu – {preview.length} question(s) prête(s)
            </p>
            <button type="button" onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto mb-4">
            {preview.map((q, idx) => (
              <div key={idx} className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="font-bold text-sm text-gray-800">{idx + 1}. {q.enonce || q.question_text}</p>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {['A','B','C','D'].map(l => q[`option_${l.toLowerCase()}`] && (
                    <p key={l} className={`text-xs px-2 py-1 rounded-lg ${(q.reponse_correcte || q.bonne_reponse) === l ? 'bg-green-100 text-green-700 font-bold' : 'text-gray-500'}`}>
                      {l}) {q[`option_${l.toLowerCase()}`]}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {!selectedCategory && (
            <p className="text-amber-700 text-sm font-bold mb-3">⚠️ Sélectionnez un dossier cible (étape ②)</p>
          )}

          <button type="button" onClick={handleInsert} disabled={loading || !selectedCategory}
            className="w-full py-4 font-extrabold text-white rounded-xl text-lg transition-all disabled:opacity-50"
            style={{ background: loading ? '#999' : 'linear-gradient(135deg,#C4521A,#8B2500)' }}>
            {loading ? '⏳ Insertion en cours...' : `🚀 Insérer ${preview.length} question(s) dans "${categories.find(c => c.id === selectedCategory)?.nom || '...'} "`}
          </button>
        </div>
      )}
    </div>
  )
}
