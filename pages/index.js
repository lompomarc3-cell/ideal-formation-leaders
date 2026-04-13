import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'

const APP_URL = 'https://ideal-formation-leaders.pages.dev'

// ===== DONNÉES STATIQUES =====
const CATEGORIES_DIRECT_STATIC = [
  { nom: 'Actualité / Culture générale', icone: 'globe' },
  { nom: 'Français', icone: 'book' },
  { nom: 'Littérature et art', icone: 'palette' },
  { nom: 'Histoire-Géographie', icone: 'map' },
  { nom: 'SVT', icone: 'leaf' },
  { nom: 'Psychotechniques', icone: 'brain' },
  { nom: 'Maths', icone: 'calculator' },
  { nom: 'Physique-Chimie', icone: 'flask' },
  { nom: 'Droit', icone: 'scale' },
  { nom: 'Économie', icone: 'chart' },
  { nom: 'Entraînement QCM', icone: 'pencil' },
  { nom: 'Accompagnement final', icone: 'target' }
]

const CATEGORIES_PRO_STATIC = [
  { nom: 'Spécialités Vie scolaire (CASU-AASU)', icone: 'school' },
  { nom: 'Actualités et culture générale', icone: 'newspaper' },
  { nom: 'Spécialités CISU/AISU/ENAREF', icone: 'building' },
  { nom: 'Inspectorat : IES', icone: 'search' },
  { nom: 'Inspectorat : IEPENF', icone: 'search2' },
  { nom: 'CSAPÉ', icone: 'graduation' },
  { nom: 'Agrégés', icone: 'scroll' },
  { nom: 'CAPES toutes options', icone: 'openbook' },
  { nom: 'Administrateur des hôpitaux', icone: 'hospital' },
  { nom: 'Spécialités santé', icone: 'health' },
  { nom: 'Justice', icone: 'justice' },
  { nom: 'Magistrature', icone: 'judge' },
  { nom: 'Spécialités GSP', icone: 'shield' },
  { nom: 'Spécialités police', icone: 'badge' },
  { nom: 'Administrateur civil', icone: 'clipboard' },
  { nom: 'Entraînement QCM', icone: 'pencil' },
  { nom: 'Accompagnement final', icone: 'target' }
]

// ===== ICÔNES SVG VECTORIELLES MODERNES =====
const SVG_ICONS = {
  // === ICÔNES DOSSIERS CONCOURS DIRECTS (thème chaud : bordeaux/orange) ===
  globe: (
    // Actualité / Culture générale – globe avec méridiens stylisés
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5"/>
      <path d="M2.5 12h19M12 2.5c-2.5 3-4 6-4 9.5s1.5 6.5 4 9.5M12 2.5c2.5 3 4 6 4 9.5s-1.5 6.5-4 9.5"/>
      <path d="M5 7.5h14M5 16.5h14"/>
    </svg>
  ),
  book: (
    // Français – livre ouvert avec signet
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 7c-1.5-2-4-3-7-3v15c3 0 5.5 1 7 3 1.5-2 4-3 7-3V4c-3 0-5.5 1-7 3z"/>
      <path d="M12 7v16M8 4v3M16 4v3"/>
    </svg>
  ),
  palette: (
    // Littérature et art – palette d'artiste
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10c0-1.1-.9-2-2-2h-2a2 2 0 0 1-2-2V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/>
      <circle cx="7.5" cy="10.5" r="1" fill="currentColor"/>
      <circle cx="10.5" cy="7.5" r="1" fill="currentColor"/>
      <circle cx="15" cy="7.5" r="1" fill="currentColor"/>
    </svg>
  ),
  map: (
    // Histoire-Géographie – carte avec épingle
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  leaf: (
    // SVT – feuille + microscope stylisé
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V12"/>
      <path d="M5 12c0-5 3-9 7-10 4 1 7 5 7 10a7 7 0 0 1-14 0z"/>
      <path d="M9 17c1-2 3-3 3-5"/>
    </svg>
  ),
  brain: (
    // Psychotechniques – cerveau stylisé
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5a3 3 0 0 0-5.99.1A3 3 0 0 0 4 8a3.5 3.5 0 0 0 .5 6.5A3.5 3.5 0 0 0 8 18h4"/>
      <path d="M12 5a3 3 0 0 1 5.99.1A3 3 0 0 1 20 8a3.5 3.5 0 0 1-.5 6.5A3.5 3.5 0 0 1 16 18h-4"/>
      <path d="M12 5v13M9 9h2M13 9h2M9 13h2M13 13h2"/>
    </svg>
  ),
  calculator: (
    // Maths – sigma + chiffres
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <path d="M7 7h4M7 12h10M7 17h4"/>
      <path d="M15 7l2 2.5L15 12"/>
    </svg>
  ),
  flask: (
    // Physique-Chimie – fiole + bulles
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6M10 3v7L5 19a1 1 0 0 0 .9 1.4h12.2A1 1 0 0 0 19 19l-5-9V3"/>
      <path d="M7.5 15h9"/>
      <circle cx="10" cy="17" r="0.8" fill="currentColor"/>
      <circle cx="13.5" cy="16" r="0.8" fill="currentColor"/>
    </svg>
  ),
  scale: (
    // Droit – balance de la justice
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18M5 21h14"/>
      <path d="M5 7h7M12 7h7"/>
      <path d="M2 11l3-4 3 4a3 3 0 0 1-6 0z"/>
      <path d="M16 11l3-4 3 4a3 3 0 0 1-6 0z"/>
    </svg>
  ),
  chart: (
    // Économie – graphique tendance haussière
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
      <path d="M3 20h18M3 20V5"/>
    </svg>
  ),
  pencil: (
    // Entraînement QCM – crayon + cases à cocher
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  target: (
    // Accompagnement final – cible avec flèche
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
      <path d="M20 4l-8 8"/>
      <path d="M16 4h4v4"/>
    </svg>
  ),

  // === ICÔNES DOSSIERS CONCOURS PROFESSIONNELS (thème riche : marine/or) ===
  school: (
    // Vie scolaire (CASU-AASU) – chapeau académique + bâtiment
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 10l10-5 10 5-10 5-10-5z"/>
      <path d="M6 12v5.5c2 1.5 10 1.5 12 0V12"/>
      <path d="M22 10v6"/>
    </svg>
  ),
  newspaper: (
    // Actualités et culture générale – journal avec colonnes
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/>
      <path d="M7 8h10M7 12h10M7 16h6"/>
      <path d="M15 12h2v4h-2z" fill="currentColor" fillOpacity="0.15"/>
    </svg>
  ),
  building: (
    // CISU/AISU/ENAREF – bâtiment administratif
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18z"/>
      <path d="M2 22h20"/>
      <path d="M9 6h2M13 6h2M9 10h2M13 10h2M9 14h2M13 14h2M9 18h6"/>
    </svg>
  ),
  search: (
    // Inspectorat IES – loupe + document
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <circle cx="11" cy="15" r="2.5"/>
      <path d="M13 17l2.5 2.5"/>
    </svg>
  ),
  search2: (
    // Inspectorat IEPENF – loupe + enfant
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7"/>
      <path d="M21 21l-4.35-4.35"/>
      <path d="M7 10h6M10 7v6"/>
    </svg>
  ),
  graduation: (
    // CSAPÉ – toque de diplômé
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 10l10-5 10 5-10 5-10-5z"/>
      <path d="M6 12.5v4c0 1.5 2.7 2.5 6 2.5s6-1 6-2.5v-4"/>
      <path d="M22 10v4.5"/>
      <circle cx="22" cy="15" r="1" fill="currentColor"/>
    </svg>
  ),
  scroll: (
    // Agrégés – parchemin/diplôme de haut niveau
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
      <line x1="6" y1="1" x2="6" y2="4"/>
      <line x1="10" y1="1" x2="10" y2="4"/>
      <line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  ),
  openbook: (
    // CAPES toutes options – livre ouvert avec stylo
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      <path d="M6 8h2M16 8h2M6 12h2M16 12h2"/>
    </svg>
  ),
  hospital: (
    // Administrateur des hôpitaux – croix médicale
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <path d="M9 22V12h6v10"/>
      <path d="M10 7h4M12 5v6"/>
    </svg>
  ),
  health: (
    // Spécialités santé – ECG + cœur
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      <path d="M12 17l-3-3a4 4 0 0 1 6-5.2A4 4 0 0 1 21 12c0 2.5-3 5-9 8"/>
    </svg>
  ),
  justice: (
    // Justice – marteau de juge
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2.5l7 7-12 12-7-7 12-12z"/>
      <path d="M2 22l4.5-4.5"/>
      <path d="M8 8l8 8"/>
    </svg>
  ),
  judge: (
    // Magistrature – balance + robe
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="6" r="3"/>
      <path d="M12 9v13"/>
      <path d="M5 21h14"/>
      <path d="M9 15h6"/>
      <path d="M3 11l9 3 9-3"/>
    </svg>
  ),
  shield: (
    // Spécialités GSP – bouclier avec étoile
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polygon points="12 8 13.5 11.5 17 11.5 14.5 13.5 15.5 17 12 15 8.5 17 9.5 13.5 7 11.5 10.5 11.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  badge: (
    // Spécialités police – badge officiel
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  ),
  clipboard: (
    // Administrateur civil – dossier + tampon
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="2"/>
      <path d="M9 12h6M9 16h4"/>
    </svg>
  ),
}

function CatIcon({ name, color = 'white' }) {
  // Mapping emoji DB → clé SVG moderne
  const EMOJI_TO_SVG = {
    '🌍': 'globe', '🌎': 'globe', '🌐': 'globe',
    '📚': 'book', '📕': 'book', '📗': 'book', '📘': 'book',
    '🎨': 'palette',
    '🗺️': 'map', '🗺': 'map', '📍': 'map', '📌': 'map',
    '🧬': 'leaf', '🌿': 'leaf', '🌱': 'leaf',
    '🧠': 'brain',
    '📐': 'calculator', '🔢': 'calculator', '🧮': 'calculator',
    '⚗️': 'flask', '⚗': 'flask', '🔬': 'flask',
    '⚖️': 'scale', '⚖': 'scale',
    '💹': 'chart', '📊': 'chart', '📈': 'chart',
    '✏️': 'pencil', '✏': 'pencil', '📝': 'pencil',
    '🎯': 'target',
    '🏫': 'school', '🏠': 'school',
    '📰': 'newspaper',
    '🏛️': 'building', '🏛': 'building',
    '🔍': 'search',
    '🔎': 'search2',
    '🎓': 'graduation',
    '📜': 'scroll',
    '📖': 'openbook',
    '🏥': 'hospital', '💉': 'hospital',
    '💊': 'health', '❤️': 'health', '❤': 'health',
    '👨‍⚖️': 'judge', '👩‍⚖️': 'judge',
    '🛡️': 'shield', '🛡': 'shield',
    '👮': 'badge', '👮‍♂️': 'badge',
    '📋': 'clipboard', '📄': 'clipboard',
  }
  // Résoudre la clé : emoji → SVG ou clé directe
  const key = EMOJI_TO_SVG[name] || name || 'book'
  const icon = SVG_ICONS[key] || SVG_ICONS['book']
  return (
    <span style={{ color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </span>
  )
}

// ===== SKELETON LOADER =====
function SkeletonCard() {
  return (
    <div className="flex-shrink-0 rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden"
      style={{ width: '150px', minWidth: '150px', height: '160px', background: '#f5f5f5', animation: 'pulse 1.5s ease-in-out infinite' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }`}</style>
    </div>
  )
}

// ===== PALETTE COULEURS INDIVIDUELLES PAR ICÔNE =====
// Concours Directs : palette verte/émeraude/teal moderne
const DIRECT_ICON_COLORS = {
  globe:      { bg: 'linear-gradient(135deg,#0891B2,#06B6D4)', border: '#A5F3FC', tag: '#E0F7FF', tagText: '#0891B2' }, // cyan
  book:       { bg: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: '#DDD6FE', tag: '#F3E8FF', tagText: '#7C3AED' }, // violet
  palette:    { bg: 'linear-gradient(135deg,#EC4899,#F472B6)', border: '#FBCFE8', tag: '#FDF2F8', tagText: '#EC4899' }, // rose
  map:        { bg: 'linear-gradient(135deg,#059669,#10B981)', border: '#A7F3D0', tag: '#ECFDF5', tagText: '#059669' }, // vert émeraude
  leaf:       { bg: 'linear-gradient(135deg,#16A34A,#22C55E)', border: '#BBF7D0', tag: '#F0FDF4', tagText: '#16A34A' }, // vert vif
  brain:      { bg: 'linear-gradient(135deg,#DC2626,#EF4444)', border: '#FECACA', tag: '#FEF2F2', tagText: '#DC2626' }, // rouge
  calculator: { bg: 'linear-gradient(135deg,#D97706,#F59E0B)', border: '#FDE68A', tag: '#FFFBEB', tagText: '#D97706' }, // ambre
  flask:      { bg: 'linear-gradient(135deg,#2563EB,#3B82F6)', border: '#BFDBFE', tag: '#EFF6FF', tagText: '#2563EB' }, // bleu
  scale:      { bg: 'linear-gradient(135deg,#B45309,#D97706)', border: '#FDE68A', tag: '#FFFBEB', tagText: '#B45309' }, // brun/or
  chart:      { bg: 'linear-gradient(135deg,#0F766E,#14B8A6)', border: '#99F6E4', tag: '#F0FDFA', tagText: '#0F766E' }, // teal
  pencil:     { bg: 'linear-gradient(135deg,#9333EA,#C084FC)', border: '#E9D5FF', tag: '#FAF5FF', tagText: '#9333EA' }, // pourpre
  target:     { bg: 'linear-gradient(135deg,#C4521A,#D4A017)', border: '#FED7AA', tag: '#FFF7ED', tagText: '#C4521A' }, // orange IFL
}

// Concours Professionnels : palette marine/or/prestige
const PRO_ICON_COLORS = {
  school:     { bg: 'linear-gradient(135deg,#1E40AF,#3B82F6)', border: '#BFDBFE', tag: '#EFF6FF', tagText: '#1E40AF' }, // bleu royal
  newspaper:  { bg: 'linear-gradient(135deg,#047857,#10B981)', border: '#A7F3D0', tag: '#ECFDF5', tagText: '#047857' }, // vert forêt
  building:   { bg: 'linear-gradient(135deg,#1D4ED8,#2563EB)', border: '#BFDBFE', tag: '#EFF6FF', tagText: '#1D4ED8' }, // bleu admin
  search:     { bg: 'linear-gradient(135deg,#6D28D9,#8B5CF6)', border: '#DDD6FE', tag: '#F5F3FF', tagText: '#6D28D9' }, // violet profond
  search2:    { bg: 'linear-gradient(135deg,#7C3AED,#A78BFA)', border: '#EDE9FE', tag: '#F5F3FF', tagText: '#7C3AED' }, // violet moyen
  graduation: { bg: 'linear-gradient(135deg,#B45309,#F59E0B)', border: '#FDE68A', tag: '#FFFBEB', tagText: '#B45309' }, // or diplôme
  scroll:     { bg: 'linear-gradient(135deg,#92400E,#D97706)', border: '#FDE68A', tag: '#FFFBEB', tagText: '#92400E' }, // brun parchemin
  openbook:   { bg: 'linear-gradient(135deg,#0369A1,#0EA5E9)', border: '#BAE6FD', tag: '#F0F9FF', tagText: '#0369A1' }, // bleu ciel
  hospital:   { bg: 'linear-gradient(135deg,#DC2626,#F87171)', border: '#FECACA', tag: '#FEF2F2', tagText: '#DC2626' }, // rouge médical
  health:     { bg: 'linear-gradient(135deg,#BE185D,#EC4899)', border: '#FBCFE8', tag: '#FDF2F8', tagText: '#BE185D' }, // rose santé
  justice:    { bg: 'linear-gradient(135deg,#1E3A5F,#1D5AB4)', border: '#C7D2FE', tag: '#EEF2FF', tagText: '#1E3A5F' }, // bleu justice
  judge:      { bg: 'linear-gradient(135deg,#374151,#6B7280)', border: '#D1D5DB', tag: '#F9FAFB', tagText: '#374151' }, // gris magistrat
  shield:     { bg: 'linear-gradient(135deg,#1F2937,#374151)', border: '#D1D5DB', tag: '#F9FAFB', tagText: '#1F2937' }, // gris GSP
  badge:      { bg: 'linear-gradient(135deg,#1E3A8A,#1D4ED8)', border: '#BFDBFE', tag: '#EFF6FF', tagText: '#1E3A8A' }, // bleu police
  clipboard:  { bg: 'linear-gradient(135deg,#065F46,#059669)', border: '#A7F3D0', tag: '#ECFDF5', tagText: '#065F46' }, // vert admin
  pencil:     { bg: 'linear-gradient(135deg,#9333EA,#C084FC)', border: '#E9D5FF', tag: '#FAF5FF', tagText: '#9333EA' }, // pourpre
  target:     { bg: 'linear-gradient(135deg,#B45309,#D97706)', border: '#FDE68A', tag: '#FFFBEB', tagText: '#B45309' }, // or cible
}

function getIconStyle(iconName, catType) {
  const isPro = catType === 'professionnel'
  const palette = isPro ? PRO_ICON_COLORS : DIRECT_ICON_COLORS
  return palette[iconName] || (isPro
    ? { bg: 'linear-gradient(135deg,#1D5AB4,#2E7DD6)', border: '#A8C4F0', tag: '#EEF3FF', tagText: '#1D5AB4' }
    : { bg: 'linear-gradient(135deg,#059669,#10B981)', border: '#A7F3D0', tag: '#ECFDF5', tagText: '#059669' }
  )
}

// ===== CARTE CATÉGORIE PUBLIQUE =====
function PublicCategoryCard({ cat, index, catType }) {
  const iconName = cat.icone || 'book'
  const isPro = catType === 'professionnel'
  const style = getIconStyle(iconName, catType)

  if (cat.id) {
    return (
      <Link
        href={`/quiz/public/${cat.id}`}
        className="flex-shrink-0 bg-white rounded-2xl overflow-hidden active:scale-95 transition-all hover:shadow-lg"
        style={{ scrollSnapAlign: 'start', width: '150px', minWidth: '150px', border: `2px solid ${style.border}`, boxShadow: `0 2px 8px ${style.border}80` }}
      >
        <div className="p-4 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: style.bg }}>
            <CatIcon name={iconName} color="white" />
          </div>
          <p className="text-xs font-bold text-gray-700 leading-tight mb-2 line-clamp-2">{cat.nom}</p>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: style.tag, color: style.tagText }}>
            🆓 5 gratuites
          </span>
        </div>
        <div className="h-1.5 w-full" style={{ background: style.bg }}></div>
      </Link>
    )
  }

  return (
    <div className="flex-shrink-0 bg-white rounded-2xl overflow-hidden"
      style={{ scrollSnapAlign: 'start', width: '150px', minWidth: '150px', border: '2px solid #E5E7EB' }}>
      <div className="p-4 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: style.bg }}>
          <CatIcon name={iconName} color="white" />
        </div>
        <p className="text-xs font-bold text-gray-700 leading-tight mb-2 line-clamp-2">{cat.nom}</p>
        <span className="text-gray-400 text-xs">🔒 Bientôt</span>
      </div>
      <div className="h-1.5 w-full" style={{ background: '#E5E7EB' }}></div>
    </div>
  )
}

// ===== PAGE PRINCIPALE =====
export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [shareMsg, setShareMsg] = useState('')
  const [categoriesDirect, setCategoriesDirect] = useState([])
  const [categoriesPro, setCategoriesPro] = useState([])
  const [loadingCats, setLoadingCats] = useState(true)
  const [activeTab, setActiveTab] = useState('accueil')  // 'accueil' | 'concours' | 'profil' | 'apropos'
  const [activeConcoursTab, setActiveConcoursTab] = useState('direct')  // 'direct' | 'professionnel'
  const [activeAboutTab, setActiveAboutTab] = useState('app')  // 'app' | 'equipe' | 'aide' | 'dev'
  const [openFaq, setOpenFaq] = useState(null)

  useEffect(() => {
    if (!loading && user) {
      // Tous les utilisateurs (admin inclus) vont vers /dashboard
      // L'admin peut accéder au panel admin via le bouton dans le dashboard
      router.push('/dashboard')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!loading && !user) loadPublicCategories()
  }, [loading, user])

  const loadPublicCategories = async () => {
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/quiz/public-categories?type=direct'),
        fetch('/api/quiz/public-categories?type=professionnel')
      ])
      const d1 = await r1.json()
      const d2 = await r2.json()
      setCategoriesDirect(d1.categories?.length > 0 ? d1.categories : CATEGORIES_DIRECT_STATIC)
      setCategoriesPro(d2.categories?.length > 0 ? d2.categories : CATEGORIES_PRO_STATIC)
    } catch {
      setCategoriesDirect(CATEGORIES_DIRECT_STATIC)
      setCategoriesPro(CATEGORIES_PRO_STATIC)
    }
    setLoadingCats(false)
  }

  const handleShare = async () => {
    const text = `🎓 Préparez vos concours du Burkina Faso avec IFL !\n\n✅ Des milliers de QCM\n✅ Concours directs – 12 dossiers (5 000 FCFA)\n✅ Concours professionnels – 17 dossiers (20 000 FCFA)\n✅ 5 questions gratuites par dossier sans inscription\n\n👉 ${APP_URL}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'IFL – Formation Burkina Faso', text, url: APP_URL })
        setShareMsg('✅ Partagé !')
      } catch (e) {
        if (e.name !== 'AbortError') window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
      }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }
    setTimeout(() => setShareMsg(''), 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)' }}>
        <div className="text-center"><div className="spinner mx-auto mb-3"></div><p className="text-white font-semibold">Chargement...</p></div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>IFL – Idéale Formation of Leaders | Concours Burkina Faso</title>
        <meta name="description" content="Préparez vos concours du Burkina Faso avec des milliers de QCM. 5 questions gratuites par dossier sans inscription. Concours directs (12 dossiers) et professionnels (17 dossiers)." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#8B2500" />
      </Head>

      <div className="min-h-screen" style={{ background: '#FFF8F0', paddingBottom: 80 }}>

        {/* ===== HEADER FIXE ===== */}
        <header style={{ background: 'linear-gradient(135deg, #8B2500 0%, #C4521A 100%)' }} className="sticky top-0 z-40 shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="logo-header" style={{ width: 44, height: 44 }}>
                <img src="/logo.png" alt="IFL" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 14 }} />
              </div>
              <div>
                <p className="text-white font-extrabold text-base leading-tight">IFL</p>
                <p className="text-orange-200 text-xs">Idéale Formation of Leaders</p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <button onClick={handleShare} className="p-2 text-orange-200 hover:text-white transition-colors" title="Partager">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              </button>
              <Link href="/login" className="px-3 py-1.5 text-xs font-bold text-white rounded-lg" style={{ background: 'rgba(255,255,255,0.2)' }}>
                Connexion
              </Link>
            </div>
          </div>
          {shareMsg && <div className="text-center py-1 text-sm font-semibold text-amber-200">{shareMsg}</div>}
        </header>

        {/* ===== ONGLET ACCUEIL ===== */}
        {activeTab === 'accueil' && (
          <div className="animate-fadeIn">
            {/* Hero Banner */}
            <div className="african-pattern" style={{ background: 'linear-gradient(160deg,#8B2500,#C4521A,#D4A017)' }}>
              <div className="max-w-lg mx-auto px-4 py-10 text-center">
                <div className="inline-block logo-hero mb-4" style={{ width: 96, height: 96 }}>
                  <img src="/logo.png" alt="IFL" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 24 }} />
                </div>
                <h1 className="text-white font-extrabold text-2xl mb-2 leading-tight">
                  Réussissez vos concours<br/>du Burkina Faso
                </h1>
                <p className="text-orange-200 text-sm mb-1">Des milliers de QCM pour vous préparer</p>
                <div className="inline-block bg-white bg-opacity-20 text-white text-xs font-bold px-3 py-1 rounded-full mb-5">
                  🆓 5 questions gratuites par dossier – sans inscription
                </div>
              </div>
            </div>

            {/* Contenu Accueil */}
            <div className="max-w-lg mx-auto px-4 py-6">

              {/* === DÉMO GRATUITE - MISE EN AVANT PRINCIPALE === */}
              <div className="rounded-3xl overflow-hidden shadow-xl mb-6 border-2 border-amber-300"
                style={{ background: 'linear-gradient(135deg, #D4A017 0%, #F0B429 50%, #D4A017 100%)' }}>
                <div className="p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-white bg-opacity-30">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <h2 className="text-white font-extrabold text-xl mb-2">Démo gratuite</h2>
                  <p className="text-amber-100 text-sm mb-1">10 questions pour découvrir IFL</p>
                  <p className="text-amber-200 text-xs mb-5">Aucune inscription requise – Commencez maintenant !</p>
                  <Link
                    href="/demo"
                    className="inline-block px-10 py-4 text-base font-extrabold rounded-2xl shadow-lg active:scale-95 transition-all"
                    style={{ background: 'white', color: '#C4521A' }}
                  >
                    🎯 Tester la démo gratuite
                  </Link>
                </div>
              </div>

              {/* Présentation rapide */}
              <p className="text-center font-extrabold text-lg mb-4" style={{ color: '#8B2500' }}>Nos offres</p>

              {/* Cartes offres */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-2xl shadow-md border-2 p-5 text-center"
                  style={{ borderColor: '#FFD0A8', cursor: 'pointer' }}
                  onClick={() => setActiveTab('concours')}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                  </div>
                  <div className="text-xs font-bold px-2 py-0.5 rounded-full mb-2 inline-block" style={{ background: '#FFF0E8', color: '#C4521A' }}>🎯 Entrée initiale</div>
                  <h3 className="font-extrabold text-sm mb-1" style={{ color: '#8B2500' }}>Concours Directs</h3>
                  <p className="text-gray-500 text-xs mb-2">12 dossiers thématiques</p>
                  <p className="text-xl font-extrabold" style={{ color: '#C4521A' }}>5 000</p>
                  <p className="text-gray-400 text-xs">FCFA</p>
                  <p className="text-xs mt-2 font-semibold" style={{ color: '#C4521A' }}>Voir les dossiers →</p>
                </div>
                <div className="bg-white rounded-2xl shadow-md border-2 p-5 text-center"
                  style={{ borderColor: '#FFD0A8', cursor: 'pointer' }}
                  onClick={() => { setActiveTab('concours'); setActiveConcoursTab('professionnel') }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'linear-gradient(135deg,#8B2500,#D4A017)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
                    </svg>
                  </div>
                  <div className="text-xs font-bold px-2 py-0.5 rounded-full mb-2 inline-block" style={{ background: '#FFF7E8', color: '#B45309' }}>🏅 Évolution de carrière</div>
                  <h3 className="font-extrabold text-sm mb-1" style={{ color: '#8B2500' }}>Professionnels</h3>
                  <p className="text-gray-500 text-xs mb-2">17 dossiers spécialisés</p>
                  <p className="text-xl font-extrabold" style={{ color: '#C4521A' }}>20 000</p>
                  <p className="text-gray-400 text-xs">FCFA</p>
                  <p className="text-xs mt-2 font-semibold" style={{ color: '#C4521A' }}>Voir les dossiers →</p>
                </div>
              </div>



              {/* Paiement Orange Money */}
              <div className="rounded-2xl p-5 mb-6 text-white" style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9500)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-extrabold text-base">Paiement Orange Money</p>
                    <p className="text-orange-100 text-xs">Simple et rapide</p>
                  </div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-xl p-3 mb-2">
                  <p className="text-xs text-orange-100 mb-1">Code USSD (appuyez pour copier) :</p>
                  <button
                    onClick={() => { navigator.clipboard?.writeText('*144*10*76223962#'); alert('✅ Code copié : *144*10*76223962#') }}
                    className="text-lg font-extrabold underline decoration-dotted active:opacity-70"
                  >*144*10*76223962#</button>
                </div>
                <p className="text-orange-100 text-sm">Bénéficiaire : <a href="tel:+22676223962" className="font-extrabold text-white underline">+226 76 22 39 62</a></p>
              </div>

              {/* Pourquoi IFL */}
              <p className="font-extrabold text-lg mb-4" style={{ color: '#8B2500' }}>Pourquoi choisir IFL ?</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>, text: 'Milliers de QCM' },
                  { svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>, text: 'Mobile-friendly' },
                  { svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, text: 'Résultats immédiats' },
                  { svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>, text: 'Tous concours BF' }
                ].map((f, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-amber-100">
                    {f.svg}
                    <p className="font-semibold text-sm text-gray-700">{f.text}</p>
                  </div>
                ))}
              </div>

              {/* CTA Inscription */}
              <div className="rounded-2xl p-6 text-center mb-6" style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)' }}>
                <p className="text-white font-extrabold text-lg mb-2">🚀 Commencez aujourd'hui !</p>
                <p className="text-orange-200 text-sm mb-4">Créez votre compte gratuitement</p>
                <div className="flex gap-3">
                  <Link href="/register" className="flex-1 py-3.5 text-center font-extrabold rounded-xl text-sm active:scale-95" style={{ background: 'white', color: '#C4521A' }}>
                    📝 S'inscrire
                  </Link>
                  <Link href="/demo" className="flex-1 py-3.5 text-center font-extrabold text-white rounded-xl text-sm border-2 border-white active:scale-95">
                    🎯 Démo gratuite
                  </Link>
                </div>
              </div>

              {/* Footer */}
              <footer className="text-center py-4 border-t border-amber-100">
                <div className="flex justify-center gap-4 flex-wrap mb-2">
                  <a href="https://wa.me/22676223962" target="_blank" rel="noopener noreferrer" className="font-semibold text-sm" style={{ color: '#C4521A' }}>
                    💬 WhatsApp: +226 76 22 39 62
                  </a>
                </div>
                <div className="flex justify-center gap-4 text-sm text-gray-500 mb-2">
                  <Link href="/login" className="hover:underline">Connexion</Link>
                  <Link href="/register" className="hover:underline">Inscription</Link>
                  <button onClick={() => setActiveTab('apropos')} className="hover:underline">Aide</button>
                  <button onClick={handleShare} className="hover:underline">Partager</button>
                </div>
                <p className="text-gray-400 text-xs">© 2025 IFL – Burkina Faso</p>
              </footer>
            </div>
          </div>
        )}

        {/* ===== ONGLET CONCOURS ===== */}
        {activeTab === 'concours' && (
          <div className="animate-fadeIn">
            {/* Sous-header Concours */}
            <div className="african-pattern" style={{ background: 'linear-gradient(160deg,#8B2500,#C4521A)' }}>
              <div className="max-w-lg mx-auto px-4 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-white font-extrabold text-2xl mb-1">Nos Concours</h2>
                    <p className="text-orange-200 text-sm">Choisissez votre catégorie et commencez</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                      <path d="M4 22h16"/>
                      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
                    </svg>
                  </div>
                </div>
                {/* Cartes résumé rapide */}
                <div className="flex gap-3 mt-4">
                  <div className="flex-1 rounded-xl p-3 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <span className="text-xl">📚</span>
                    <div>
                      <p className="text-white font-bold text-xs">Directs</p>
                      <p className="text-orange-200 text-xs">12 dossiers · 5 000 FCFA</p>
                    </div>
                  </div>
                  <div className="flex-1 rounded-xl p-3 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <span className="text-xl">🎓</span>
                    <div>
                      <p className="text-white font-bold text-xs">Professionnels</p>
                      <p className="text-orange-200 text-xs">17 dossiers · 20 000 FCFA</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sélecteur Directs / Professionnels */}
            <div className="max-w-lg mx-auto px-4 pt-5">
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setActiveConcoursTab('direct')}
                  className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeConcoursTab === 'direct' ? 'text-white shadow-lg scale-105' : 'text-gray-500 bg-white border-2 border-gray-100'}`}
                  style={activeConcoursTab === 'direct' ? { background: 'linear-gradient(135deg,#8B2500,#C4521A)', boxShadow: '0 4px 15px rgba(196,82,26,0.35)' } : {}}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                  Directs <span className="text-xs opacity-70 font-normal">(12)</span>
                </button>
                <button
                  onClick={() => setActiveConcoursTab('professionnel')}
                  className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeConcoursTab === 'professionnel' ? 'text-white shadow-lg scale-105' : 'text-gray-500 bg-white border-2 border-gray-100'}`}
                  style={activeConcoursTab === 'professionnel' ? { background: 'linear-gradient(135deg,#8B2500,#D4A017)', boxShadow: '0 4px 15px rgba(180,83,9,0.35)' } : {}}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
                  </svg>
                  Professionnels <span className="text-xs opacity-70 font-normal">(17)</span>
                </button>
              </div>

              {/* Section Concours Directs */}
              {activeConcoursTab === 'direct' && (
                <div className="animate-fadeIn">
                  {/* Bandeau identitaire DIRECTS */}
                  <div className="rounded-2xl mb-5 overflow-hidden shadow-md" style={{ background: 'linear-gradient(135deg,#8B2500 0%,#C4521A 60%,#D4A017 100%)' }}>
                    <div className="p-4 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(255,255,255,0.25)', color: 'white' }}>🎯 ENTRÉE INITIALE</span>
                        </div>
                        <h3 className="text-white font-extrabold text-lg leading-tight">Concours directs</h3>
                        <p className="text-orange-100 text-xs">Pour les candidats au premier concours</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-white font-extrabold text-xl">5 000</p>
                        <p className="text-orange-200 text-xs">FCFA</p>
                      </div>
                    </div>
                    <div className="px-4 pb-3">
                      <div className="flex items-center gap-2 text-orange-100 text-xs">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        12 dossiers thématiques · Culture générale · Sciences · Droit · Maths
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl p-3 mb-4 flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE4B5)', border: '1.5px solid #D4A017' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                    </svg>
                    <p className="text-amber-800 text-xs font-semibold">← Glissez horizontalement pour voir tous les dossiers →</p>
                  </div>

                  {loadingCats ? (
                    <div className="flex gap-3 overflow-x-hidden pb-3">
                      {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
                    </div>
                  ) : (
                    <div className="flex gap-3 overflow-x-auto pb-4"
                      style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {categoriesDirect.map((cat, i) => (
                        <PublicCategoryCard key={cat.id || i} cat={cat} index={i} catType="direct" />
                      ))}
                    </div>
                  )}

                  <div className="mt-4 rounded-2xl p-4 flex items-center justify-between border-2 bg-white" style={{ borderColor: '#C4521A' }}>
                    <div>
                      <p className="font-bold text-sm" style={{ color: '#8B2500' }}>Accès complet</p>
                      <p className="text-gray-500 text-xs">Débloquer tous les 12 dossiers</p>
                    </div>
                    <Link href="/payment?type=direct&montant=5000"
                      className="px-5 py-2.5 font-extrabold text-white rounded-xl text-sm active:scale-95 shadow-md"
                      style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)' }}>
                      5 000 FCFA →
                    </Link>
                  </div>

                  <Link href="/register" className="block mt-3 text-center py-3 font-bold rounded-xl text-sm border-2 border-orange-300"
                    style={{ color: '#C4521A', background: '#FFF8F0' }}>
                    📝 Créer un compte gratuit
                  </Link>
                </div>
              )}

              {/* Section Concours Professionnels */}
              {activeConcoursTab === 'professionnel' && (
                <div className="animate-fadeIn">
                  {/* Bandeau identitaire PROFESSIONNELS */}
                  <div className="rounded-2xl mb-5 overflow-hidden shadow-md" style={{ background: 'linear-gradient(135deg,#8B2500 0%,#C4521A 60%,#D4A017 100%)' }}>
                    <div className="p-4 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(255,255,255,0.25)', color: 'white' }}>🏅 ÉVOLUTION DE CARRIÈRE</span>
                        </div>
                        <h3 className="text-white font-extrabold text-lg leading-tight">Concours professionnels</h3>
                        <p className="text-orange-100 text-xs">Pour les agents en poste qui veulent progresser</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-white font-extrabold text-xl">20 000</p>
                        <p className="text-orange-200 text-xs">FCFA</p>
                      </div>
                    </div>
                    <div className="px-4 pb-3">
                      <div className="flex items-center gap-2 text-orange-100 text-xs">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        17 dossiers spécialisés · Santé · Justice · Police · Éducation
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl p-3 mb-4 flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE4B5)', border: '1.5px solid #D4A017' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                    </svg>
                    <p className="text-xs font-semibold text-amber-800">← Glissez horizontalement pour voir tous les dossiers →</p>
                  </div>

                  {loadingCats ? (
                    <div className="flex gap-3 overflow-x-hidden pb-3">
                      {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
                    </div>
                  ) : (
                    <div className="flex gap-3 overflow-x-auto pb-4"
                      style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {categoriesPro.map((cat, i) => (
                        <PublicCategoryCard key={cat.id || i} cat={cat} index={i} catType="professionnel" />
                      ))}
                    </div>
                  )}

                  <div className="mt-4 rounded-2xl p-4 flex items-center justify-between border-2 bg-white" style={{ borderColor: '#C4521A' }}>
                    <div>
                      <p className="font-bold text-sm" style={{ color: '#8B2500' }}>Accès complet</p>
                      <p className="text-gray-500 text-xs">Choisir votre spécialité</p>
                    </div>
                    <Link href="/select-specialty"
                      className="px-5 py-2.5 font-extrabold text-white rounded-xl text-sm active:scale-95 shadow-md"
                      style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)' }}>
                      20 000 FCFA →
                    </Link>
                  </div>

                  <Link href="/register" className="block mt-3 text-center py-3 font-bold rounded-xl text-sm border-2"
                    style={{ color: '#C4521A', background: '#FFF8F0', borderColor: '#FFD0A8' }}>
                    📝 Créer un compte gratuit
                  </Link>
                </div>
              )}

              {/* Bannière démo gratuite en bas */}
              <div className="mt-6 mb-4 rounded-2xl p-4 flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE4B5)', border: '2px solid #D4A017' }}>
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-amber-800 text-sm">Démo gratuite disponible</p>
                  <p className="text-amber-700 text-xs">10 questions d'entraînement</p>
                </div>
                <Link href="/demo" className="px-4 py-2 font-bold text-white rounded-xl text-xs active:scale-95"
                  style={{ background: '#D4A017' }}>
                  Essayer
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ===== ONGLET PROFIL ===== */}
        {activeTab === 'profil' && (
          <div className="animate-fadeIn">
            {/* Header Profil */}
            <div className="african-pattern" style={{ background: 'linear-gradient(160deg,#8B2500,#C4521A)' }}>
              <div className="max-w-lg mx-auto px-4 py-8 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.4)' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <h2 className="text-white font-extrabold text-2xl mb-1">Mon Profil</h2>
                <p className="text-orange-200 text-sm">Gérez votre compte et votre progression</p>
              </div>
            </div>

            {/* Contenu Profil - Non connecté */}
            <div className="max-w-lg mx-auto px-4 py-6">
              <div className="rounded-3xl overflow-hidden shadow-xl mb-6 border-2 border-orange-200 bg-white p-8 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'linear-gradient(135deg,#FFF0E8,#FFE0C8)' }}>
                  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <h3 className="font-extrabold text-xl text-gray-800 mb-2">Vous n'êtes pas connecté</h3>
                <p className="text-gray-500 text-sm mb-6">Connectez-vous pour accéder à votre profil, suivre votre progression et gérer votre abonnement.</p>
                <Link href="/login"
                  className="block w-full py-3.5 rounded-2xl text-white font-bold text-base shadow-md mb-3"
                  style={{ background: 'linear-gradient(135deg,#C4521A,#D4A017)' }}>
                  Se connecter
                </Link>
                <Link href="/register"
                  className="block w-full py-3.5 rounded-2xl font-bold text-base border-2"
                  style={{ borderColor: '#C4521A', color: '#C4521A' }}>
                  Créer un compte
                </Link>
              </div>

              {/* Aperçu des fonctionnalités du profil */}
              <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-5 mb-4">
                <h4 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">Ce que vous pouvez faire avec un compte :</h4>
                {[
                  { icon: '📊', text: 'Suivre votre progression par dossier' },
                  { icon: '🎓', text: 'Accéder à tous les QCM selon votre abonnement' },
                  { icon: '📱', text: 'Partager l\'application avec vos amis' },
                  { icon: '⭐', text: 'Évaluer l\'application sur le Play Store' },
                  { icon: '🔔', text: 'Recevoir les nouvelles questions' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm text-gray-600">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Bouton Partager */}
              <button
                onClick={handleShare}
                className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 shadow-md"
                style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Partager l'application
              </button>
            </div>
          </div>
        )}

        {/* ===== ONGLET À PROPOS ===== */}
        {activeTab === 'apropos' && (
          <div className="animate-fadeIn">
            {/* Sous-header À propos */}
            <div className="african-pattern" style={{ background: 'linear-gradient(160deg,#8B2500,#C4521A)' }}>
              <div className="max-w-lg mx-auto px-4 py-8 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8V8.01M12 11V16" strokeWidth="2.2"/>
                  </svg>
                </div>
                <h2 className="text-white font-extrabold text-2xl mb-1">À propos</h2>
                <p className="text-orange-200 text-sm">Découvrez IFL, notre équipe et notre développeur</p>
              </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-5">
              {/* Sous-onglets */}
              <div className="flex gap-1 bg-gray-100 rounded-2xl p-1.5 mb-6 shadow-inner overflow-x-auto">
                {[
                  { id: 'app', label: "L'appli" },
                  { id: 'equipe', label: "Équipe" },
                  { id: 'aide', label: "Aide & FAQ" },
                  { id: 'dev', label: "Développeur" }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveAboutTab(t.id)}
                    className={`flex-shrink-0 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${activeAboutTab === t.id ? 'text-white shadow-md' : 'text-gray-500'}`}
                    style={activeAboutTab === t.id ? { background: 'linear-gradient(135deg,#C4521A,#D4A017)' } : {}}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Bloc 1 : L'application */}
              {activeAboutTab === 'app' && (
                <div className="animate-fadeIn">
                  <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-6 mb-4">
                    <div className="text-center mb-5">
                      <div className="inline-block logo-rounded mb-4" style={{ width: 80, height: 80 }}>
                        <img src="/logo.png" alt="IFL" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 20 }} />
                      </div>
                      <h2 className="font-extrabold text-xl mb-1" style={{ color: '#8B2500' }}>Idéale Formation of Leaders</h2>
                      <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: '#FFF0E8', color: '#C4521A' }}>IFL</span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed mb-5">
                      <strong style={{ color: '#8B2500' }}>Idéale Formation of Leaders (IFL)</strong> est une application spécialisée dans la préparation aux concours directs et professionnels au Burkina Faso. Elle propose des milliers de QCM classés par sous-dossiers thématiques, avec un système de progression et des explications détaillées pour chaque question.
                    </p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {[
                        { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>, val: '12', label: 'Dossiers directs' },
                        { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>, val: '17', label: 'Dossiers pro' },
                        { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>, val: '5', label: 'Questions gratuites' },
                        { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>, val: '100%', label: 'Burkina Faso' }
                      ].map((s, i) => (
                        <div key={i} className="rounded-xl p-3 text-center" style={{ background: '#FFF8F0', border: '1px solid #FFE4CC' }}>
                          <div className="flex justify-center mb-1">{s.icon}</div>
                          <p className="font-extrabold text-sm" style={{ color: '#C4521A' }}>{s.val}</p>
                          <p className="text-gray-500 text-xs">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-5">
                    <h3 className="font-extrabold mb-3 flex items-center gap-2" style={{ color: '#8B2500' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2.5" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      Nos offres
                    </h3>
                    <div className="space-y-3">
                      <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg,#FFF0E8,#FFE4CC)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#C4521A' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                        </div>
                        <div>
                          <p className="font-extrabold text-sm" style={{ color: '#8B2500' }}>Concours Directs</p>
                          <p className="text-gray-500 text-xs">12 dossiers – <strong style={{ color: '#C4521A' }}>5 000 FCFA</strong></p>
                        </div>
                      </div>
                      <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg,#FFF8E0,#FFE8A0)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#D4A017' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
                        </div>
                        <div>
                          <p className="font-extrabold text-sm" style={{ color: '#8B2500' }}>Concours Professionnels</p>
                          <p className="text-gray-500 text-xs">17 dossiers – <strong style={{ color: '#C4521A' }}>20 000 FCFA</strong></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bloc 2 : Notre équipe */}
              {activeAboutTab === 'equipe' && (
                <div className="animate-fadeIn">
                  <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-6 mb-4">
                    <div className="text-center mb-5">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                        style={{ background: 'linear-gradient(135deg,#FFF0E8,#FFE0C8)' }}>
                        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                      </div>
                      <h2 className="font-extrabold text-xl" style={{ color: '#8B2500' }}>Notre équipe</h2>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed mb-4">
                      L&apos;équipe d&apos;<strong style={{ color: '#8B2500' }}>Idéale Formation of Leaders</strong> est composée d&apos;enseignants et de professionnels passionnés qui accompagnent chaque année des centaines de candidats burkinabè vers la réussite de leurs concours.
                    </p>
                    <p className="text-gray-700 text-sm leading-relaxed mb-5">
                      Notre équipe est également auteure de plusieurs documents, mémoires et livres spécialisés pour les concours directs. Notre mission est de mettre à la disposition des candidats des outils de qualité, accessibles et efficaces.
                    </p>
                    <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE4B5)', border: '2px solid #D4A017' }}>
                      <p className="font-extrabold text-amber-800 text-sm mb-3 flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2.5" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12 19.79 19.79 0 0 1 1.98 3.42 2 2 0 0 1 3.96 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        Contactez-nous
                      </p>
                      <a href="tel:+22676223962" className="flex items-center gap-3 mb-3 hover:opacity-80 transition-opacity active:scale-95">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#C4521A' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3"/></svg>
                        </div>
                        <span className="font-bold text-sm" style={{ color: '#C4521A' }}>+226 76 22 39 62</span>
                      </a>
                      <a href="https://wa.me/22676223962?text=Bonjour%20IFL" target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity active:scale-95">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#25D366' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                        </div>
                        <span className="font-bold text-sm" style={{ color: '#25D366' }}>WhatsApp : +226 76 22 39 62</span>
                      </a>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-5">
                    <h3 className="font-extrabold mb-4 flex items-center gap-2" style={{ color: '#8B2500' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                      Notre mission
                    </h3>
                    {[
                      { svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>, text: 'Des milliers de QCM mis à jour régulièrement' },
                      { svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8V8.01M12 11V16"/></svg>, text: 'Explications détaillées pour chaque question' },
                      { svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3"/></svg>, text: 'Application mobile-friendly, disponible partout' },
                      { svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>, text: 'Taux de réussite amélioré pour nos candidats' }
                    ].map((f, i) => (
                      <div key={i} className="flex items-center gap-3 mb-3 p-3 rounded-xl" style={{ background: '#FFF8F0' }}>
                        {f.svg}
                        <p className="text-gray-700 text-sm">{f.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bloc Aide & FAQ */}
              {activeAboutTab === 'aide' && (
                <div className="animate-fadeIn">
                  <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-5 mb-4">
                    <h3 className="font-extrabold mb-4 text-sm" style={{ color: '#8B2500' }}>📞 Contactez-nous</h3>
                    <div className="space-y-3">
                      <a href="https://wa.me/22676223962?text=Bonjour%20IFL%2C%20j'ai%20besoin%20d'aide"
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-4 bg-amber-50 rounded-2xl p-4 border border-amber-100 active:scale-95 transition-all">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#E8F5E9' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">WhatsApp Assistance</p>
                          <p className="text-gray-500 text-sm">+226 76 22 39 62</p>
                        </div>
                        <svg width="20" height="20" fill="none" stroke="#C4521A" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </a>
                      <div className="rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9500)' }}>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">📱</span>
                          <div>
                            <p className="font-extrabold">Paiement Orange Money</p>
                            <p className="text-orange-100 text-xs">Pour votre abonnement</p>
                          </div>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded-xl p-3 mb-2">
                          <p className="text-orange-100 text-xs">Code USSD (appuyez pour copier) :</p>
                          <button onClick={() => { if(typeof navigator !== 'undefined') navigator.clipboard?.writeText('*144*10*76223962#'); }} className="text-xl font-extrabold tracking-wider underline decoration-dotted active:opacity-70">*144*10*76223962#</button>
                        </div>
                        <p className="text-orange-100 text-sm">Bénéficiaire : <a href="tel:+22676223962" className="font-extrabold text-white underline">+226 76 22 39 62</a></p>
                        <div className="flex gap-3 mt-3">
                          <div className="flex-1 bg-white bg-opacity-15 rounded-xl p-2 text-center">
                            <p className="text-xs text-orange-100">Directs</p>
                            <p className="font-extrabold">5 000 FCFA</p>
                          </div>
                          <div className="flex-1 bg-white bg-opacity-15 rounded-xl p-2 text-center">
                            <p className="text-xs text-orange-100">Professionnels</p>
                            <p className="font-extrabold">20 000 FCFA</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-5 mb-4">
                    <h3 className="font-extrabold mb-4 text-sm" style={{ color: '#8B2500' }}>❓ Questions fréquentes</h3>
                    <div className="space-y-2">
                      {[
                        { q: "Comment m'abonner ?", a: "1. Connectez-vous ou créez un compte\n2. Allez dans \"Paiement\"\n3. Effectuez le paiement Orange Money : *144*10*76223962#\n4. Envoyez la capture via WhatsApp au +226 76 22 39 62\n5. Votre abonnement sera activé sous 24h" },
                        { q: "Comment effectuer le paiement Orange Money ?", a: "Composez *144*10*76223962# sur votre téléphone Orange, saisissez le montant (5 000 ou 20 000 FCFA), confirmez avec votre code secret.\nBénéficiaire : +226 76 22 39 62" },
                        { q: "Quelle est la durée de l'abonnement ?", a: "L'abonnement est valable 1 an à partir de la date d'activation. Vous avez accès à tous les QCM de votre formule pendant cette période." },
                        { q: "Quelle est la différence entre les deux formules ?", a: "📚 Concours Directs (5 000 FCFA) : 12 dossiers thématiques\n\n🎓 Concours Professionnels (20 000 FCFA) : 17 dossiers spécialisés" },
                        { q: "Mon abonnement n'est pas activé après paiement ?", a: "Vérifiez que vous avez bien envoyé la capture de paiement via WhatsApp au +226 76 22 39 62. L'activation prend jusqu'à 24h après réception de la preuve." },
                        { q: "Combien de questions gratuites par dossier ?", a: "5 questions gratuites sont disponibles par dossier, sans inscription requise." }
                      ].map((faq, i) => (
                        <div key={i} className="rounded-2xl border border-amber-100 overflow-hidden" style={{ background: '#FFFBF5' }}>
                          <button
                            onClick={() => setOpenFaq(openFaq === i ? null : i)}
                            className="w-full px-4 py-4 text-left flex items-center justify-between"
                          >
                            <p className="font-bold text-gray-800 text-sm pr-3">{faq.q}</p>
                            <span className="text-amber-500 text-xl font-bold flex-shrink-0 transition-transform"
                              style={{ transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>
                              +
                            </span>
                          </button>
                          {openFaq === i && (
                            <div className="px-4 pb-4">
                              <div className="h-px bg-amber-100 mb-3"></div>
                              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{faq.a}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Bloc 3 : Le développeur */}
              {activeAboutTab === 'dev' && (
                <div className="animate-fadeIn">
                  <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-6 mb-4">
                    <div className="text-center mb-5">
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-3"
                        style={{ background: 'linear-gradient(135deg,#FFF0E8,#FFE0C8)' }}>
                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                        </svg>
                      </div>
                      <h2 className="font-extrabold text-xl mb-1" style={{ color: '#8B2500' }}>Marc LOMPO</h2>
                      <p className="text-sm font-semibold px-3 py-1 rounded-full inline-block" style={{ color: '#C4521A', background: '#FFF0E8' }}>Ingénieur Digital</p>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed mb-5">
                      Passionné par les technologies éducatives, <strong style={{ color: '#8B2500' }}>Marc LOMPO</strong> conçoit des applications sur mesure pour aider les apprenants à atteindre leurs objectifs. Disponible pour tout projet ou partenariat.
                    </p>
                    <div className="space-y-3">
                      <a href="tel:+22672662161" className="flex items-center gap-4 p-4 rounded-2xl hover:opacity-80 transition-opacity active:scale-95"
                        style={{ background: 'linear-gradient(135deg,#FFF0E8,#FFE4CC)', border: '1.5px solid #FFD0A0' }}>
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#C4521A' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12 19.79 19.79 0 0 1 1.98 3.42 2 2 0 0 1 3.96 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        </div>
                        <div>
                          <p className="font-bold text-sm" style={{ color: '#8B2500' }}>Téléphone</p>
                          <p className="font-extrabold text-base" style={{ color: '#C4521A' }}>+226 72 66 21 61</p>
                        </div>
                      </a>
                      <a href="https://wa.me/22672662161?text=Bonjour%20Marc%2C%20je%20vous%20contacte%20via%20l%27application%20IFL"
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-2xl hover:opacity-80 transition-opacity active:scale-95"
                        style={{ background: 'linear-gradient(135deg,#E8FFF0,#C8FFD8)', border: '1.5px solid #A0FFB8' }}>
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#25D366' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-green-800">WhatsApp</p>
                          <p className="font-extrabold text-base text-green-700">+226 72 66 21 61</p>
                        </div>
                      </a>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-5">
                    <h3 className="font-extrabold mb-4 flex items-center gap-2" style={{ color: '#8B2500' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2.5" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                      Services proposés
                    </h3>
                    {[
                      { svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>, text: 'Développement d\'applications web' },
                      { svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/></svg>, text: 'Applications mobiles' },
                      { svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>, text: 'Plateformes éducatives' },
                      { svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>, text: 'Solutions numériques sur mesure' }
                    ].map((s, i) => (
                      <div key={i} className="flex items-center gap-3 mb-3 p-3 rounded-xl" style={{ background: '#FFF8F0' }}>
                        {s.svg}
                        <p className="text-gray-700 text-sm">{s.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== BARRE DE NAVIGATION PRINCIPALE EN BAS ===== */}
        <div className="fixed bottom-0 left-0 right-0 z-50" style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', borderTop: '1.5px solid #FFE4CC', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
          <div className="max-w-lg mx-auto flex">

            {/* Onglet Accueil */}
            <button
              onClick={() => setActiveTab('accueil')}
              className="flex-1 flex flex-col items-center py-2.5 gap-1 transition-all relative"
            >
              {activeTab === 'accueil' && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-b-full" style={{ background: 'linear-gradient(90deg,#C4521A,#D4A017)' }} />
              )}
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${activeTab === 'accueil' ? 'shadow-sm' : ''}`}
                style={{ background: activeTab === 'accueil' ? 'linear-gradient(135deg,#FFF0E8,#FFE0C8)' : 'transparent' }}>
                <svg width="22" height="22" viewBox="0 0 24 24"
                  fill={activeTab === 'accueil' ? '#C4521A' : 'none'}
                  stroke={activeTab === 'accueil' ? '#C4521A' : '#9CA3AF'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12L12 3l9 9"/>
                  <path d="M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9"/>
                </svg>
              </div>
              <span className="text-xs font-bold" style={{ color: activeTab === 'accueil' ? '#C4521A' : '#9CA3AF' }}>Accueil</span>
            </button>

            {/* Onglet Concours - Orange IFL */}
            <button
              onClick={() => setActiveTab('concours')}
              className="flex-1 flex flex-col items-center py-2.5 gap-1 transition-all relative"
            >
              {activeTab === 'concours' && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-b-full" style={{ background: 'linear-gradient(90deg,#C4521A,#D4A017)' }} />
              )}
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${activeTab === 'concours' ? 'shadow-sm' : ''}`}
                style={{ background: activeTab === 'concours' ? 'linear-gradient(135deg,#FFF0E8,#FFE0C8)' : 'transparent' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke={activeTab === 'concours' ? '#C4521A' : '#9CA3AF'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                  <path d="M4 22h16"/>
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
                </svg>
              </div>
              <span className="text-xs font-bold" style={{ color: activeTab === 'concours' ? '#C4521A' : '#9CA3AF' }}>Concours</span>
            </button>

            {/* Onglet Mon Profil */}
            <button
              onClick={() => setActiveTab('profil')}
              className="flex-1 flex flex-col items-center py-2.5 gap-1 transition-all relative"
            >
              {activeTab === 'profil' && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-b-full" style={{ background: 'linear-gradient(90deg,#C4521A,#D4A017)' }} />
              )}
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${activeTab === 'profil' ? 'shadow-sm' : ''}`}
                style={{ background: activeTab === 'profil' ? 'linear-gradient(135deg,#FFF0E8,#FFE0C8)' : 'transparent' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke={activeTab === 'profil' ? '#C4521A' : '#9CA3AF'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/>
                </svg>
              </div>
              <span className="text-xs font-bold" style={{ color: activeTab === 'profil' ? '#C4521A' : '#9CA3AF' }}>Mon Profil</span>
            </button>

            {/* Onglet À propos */}
            <button
              onClick={() => setActiveTab('apropos')}
              className="flex-1 flex flex-col items-center py-2.5 gap-1 transition-all relative"
            >
              {activeTab === 'apropos' && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-b-full" style={{ background: 'linear-gradient(90deg,#C4521A,#D4A017)' }} />
              )}
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${activeTab === 'apropos' ? 'shadow-sm' : ''}`}
                style={{ background: activeTab === 'apropos' ? 'linear-gradient(135deg,#FFF0E8,#FFE0C8)' : 'transparent' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke={activeTab === 'apropos' ? '#C4521A' : '#9CA3AF'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4"/>
                  <circle cx="12" cy="8" r="0.5" fill={activeTab === 'apropos' ? '#C4521A' : '#9CA3AF'}/>
                </svg>
              </div>
              <span className="text-xs font-bold" style={{ color: activeTab === 'apropos' ? '#C4521A' : '#9CA3AF' }}>À propos</span>
            </button>

          </div>
        </div>

      </div>
    </>
  )
}
