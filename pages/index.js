import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
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
  { nom: 'Inspectorat : IES', icone: 'magnifier' },
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

// ===== ICÔNES SVG MODERNES ÉPAISSES =====
const ICONS = {
  // --- Navigation ---
  home: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3L21 9.5V20a1 1 0 0 1-1 1H15v-5H9v5H4a1 1 0 0 1-1-1z"/></svg>,
  homeFill: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2.1L2.5 9.5V21a1 1 0 0 0 1 1h6v-6h5v6h6a1 1 0 0 0 1-1V9.5z"/></svg>,
  competition: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L9.5 8.5H2L7.5 12.5L5.5 19.5L12 15.5L18.5 19.5L16.5 12.5L22 8.5H14.5z"/></svg>,
  competitionFill: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2L9.5 8.5H2L7.5 12.5L5.5 19.5L12 15.5L18.5 19.5L16.5 12.5L22 8.5H14.5z"/></svg>,
  info: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v.5M12 11.5V16"/></svg>,
  infoFill: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path fillRule="evenodd" d="M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2zm0 5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm1 5h-2v6h2v-6z"/></svg>,
  profile: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  profileFill: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2a6 6 0 1 0 0 12A6 6 0 0 0 12 2zM4 20c0-3.87 3.58-7 8-7s8 3.13 8 7H4z"/></svg>,

  // --- Dossiers Concours Directs ---
  globe: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>,
  book: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  palette: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/><circle cx="7" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="7" r="1" fill="currentColor"/><circle cx="14.5" cy="6" r="1" fill="currentColor"/><circle cx="18" cy="10" r="1" fill="currentColor"/></svg>,
  map: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  leaf: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>,
  brain: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2z"/></svg>,
  calculator: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="12" y1="10" x2="14" y2="10"/><line x1="16" y1="10" x2="16" y2="10" strokeWidth="3"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="12" y1="14" x2="14" y2="14"/><line x1="16" y1="14" x2="16" y2="18"/><line x1="8" y1="18" x2="10" y2="18"/><line x1="12" y1="18" x2="14" y2="18"/></svg>,
  flask: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H15M9 3V13L4 20H20L15 13V3M9 3H15"/><path d="M6.5 17.5h2M9 15h3"/></svg>,
  scale: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><path d="M5 21h14"/><path d="M16 7l4 7H12l4-7zM8 7L4 14h8L8 7z"/></svg>,
  chart: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/><polyline points="4 14 6 12 8 14"/><polyline points="10 8 12 5 14 8"/><polyline points="16 13 18 10 20 13"/></svg>,
  pencil: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/><line x1="15" y1="5" x2="19" y2="9"/></svg>,
  target: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><line x1="12" y1="2" x2="12" y2="4" strokeWidth="2"/><line x1="12" y1="20" x2="12" y2="22" strokeWidth="2"/><line x1="2" y1="12" x2="4" y2="12" strokeWidth="2"/><line x1="20" y1="12" x2="22" y2="12" strokeWidth="2"/></svg>,

  // --- Dossiers Concours Professionnels ---
  school: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22h20M6 22V10l6-6 6 6v12"/><path d="M9 22v-4h6v4"/><path d="M10 10h4v3h-4z"/></svg>,
  newspaper: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/></svg>,
  building: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="1"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><path d="M6 11h2M10 11h2M14 11h2M6 15h2M14 15h2"/></svg>,
  magnifier: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="7"/><line x1="21" y1="21" x2="15" y2="15"/><line x1="7.5" y1="10" x2="12.5" y2="10"/><line x1="10" y1="7.5" x2="10" y2="12.5"/></svg>,
  search2: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="7"/><line x1="21" y1="21" x2="15" y2="15"/><path d="M8 10h4M10 8v4"/></svg>,
  graduation: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>,
  scroll: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h12a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4z"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M15 17H4a2 2 0 0 1 0-4h11"/><path d="M8 9h6M8 13h4"/></svg>,
  openbook: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  hospital: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9m6 12V9"/><path d="M12 5v3M10.5 6.5h3"/></svg>,
  health: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/><path d="M12 8v8M8 12h8"/></svg>,
  justice: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M4 8l8 2 8-2M6 15l6 2 6-2M5 21h14"/></svg>,
  judge: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/><path d="M15 21l-3-3-3 3"/></svg>,
  shield: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
  badge: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="10" r="3"/><path d="M9 21l3-2 3 2"/></svg>,
  clipboard: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/><line x1="9" y1="9" x2="12" y2="9"/></svg>,

  // --- Utilitaires ---
  lock: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  share: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  star: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  logout: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  check: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  phone: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12 19.79 19.79 0 0 1 1.98 3.42 2 2 0 0 1 3.96 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
}

function Icon({ name, size = 24, color = 'currentColor' }) {
  const icon = ICONS[name]
  if (!icon) return <span style={{ fontSize: size * 0.8 }}>📋</span>
  return (
    <span style={{ color, display: 'flex', alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      {icon}
    </span>
  )
}

// ===== COULEURS ICÔNES PAR DOSSIER =====
const CAT_COLORS_DIRECT = [
  '#E55A00', '#1565C0', '#7B1FA2', '#2E7D32',
  '#00695C', '#AD1457', '#0277BD', '#F57F17',
  '#4527A0', '#00838F', '#558B2F', '#C62828'
]
const CAT_COLORS_PRO = [
  '#1565C0', '#E55A00', '#6A1B9A', '#0277BD',
  '#00695C', '#2E7D32', '#7B1FA2', '#1B5E20',
  '#AD1457', '#00838F', '#4527A0', '#827717',
  '#1A237E', '#37474F', '#BF360C', '#558B2F', '#C62828'
]

// ===== CARTE CATÉGORIE GRILLE =====
function CategoryGridCard({ cat, index, catType, colors }) {
  const iconName = cat.icone || 'book'
  const bgColor = colors[index % colors.length]
  const isAvailable = !!cat.id

  const cardContent = (
    <div style={{
      background: 'white',
      borderRadius: 20,
      padding: 0,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      border: '1.5px solid #F0E8E0',
      transition: 'all 0.2s ease',
      cursor: isAvailable ? 'pointer' : 'default',
      display: 'flex', flexDirection: 'column',
      minHeight: 140
    }}>
      {/* En-tête coloré */}
      <div style={{
        background: bgColor,
        padding: '14px 12px 10px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative', minHeight: 76
      }}>
        {/* Icône dans un cercle blanc */}
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'rgba(255,255,255,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          marginBottom: 4
        }}>
          <span style={{ color: bgColor, display: 'flex' }}>
            {ICONS[iconName] || ICONS['book']}
          </span>
        </div>
        {/* Badge libre/payant */}
        {isAvailable ? (
          <span style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(255,255,255,0.9)', borderRadius: 10,
            padding: '2px 6px', fontSize: 9, fontWeight: 700,
            color: '#2E7D32', letterSpacing: 0.2
          }}>🆓 5 Q.</span>
        ) : (
          <span style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(0,0,0,0.25)', borderRadius: 10,
            padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 2
          }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="white"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="white" strokeWidth="2.5" fill="none"/></svg>
          </span>
        )}
      </div>
      {/* Nom du dossier */}
      <div style={{ padding: '8px 10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <p style={{
          fontSize: 11.5, fontWeight: 700, color: '#333',
          lineHeight: 1.35, textAlign: 'center',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>{cat.nom}</p>
      </div>
    </div>
  )

  if (isAvailable) {
    return <Link href={`/quiz/public/${cat.id}`} style={{ display: 'block', textDecoration: 'none' }}>{cardContent}</Link>
  }
  return cardContent
}

// ===== COMPOSANT WHATSAPP FLOTTANT =====
function WhatsAppFloat() {
  return (
    <a href="https://wa.me/22676223962?text=Bonjour%20IFL%2C%20je%20voudrais%20des%20informations"
      target="_blank" rel="noopener noreferrer"
      style={{
        position: 'fixed', right: 16, bottom: 88,
        width: 52, height: 52, borderRadius: '50%',
        background: '#25D366', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(37,211,102,0.5)',
        transition: 'transform 0.2s'
      }}
      title="WhatsApp IFL">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
      </svg>
    </a>
  )
}

// ===== BARRE DE NAVIGATION BAS =====
function BottomNav({ active, onChange }) {
  const tabs = [
    { id: 'accueil', label: 'Accueil', icon: 'home', iconFill: 'homeFill' },
    { id: 'concours', label: 'Concours', icon: 'competition', iconFill: 'competitionFill' },
    { id: 'apropos', label: 'À propos', icon: 'info', iconFill: 'infoFill' },
    { id: 'profil', label: 'Profil', icon: 'profile', iconFill: 'profileFill' },
  ]

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
      background: 'white',
      boxShadow: '0 -2px 20px rgba(0,0,0,0.1)',
      borderTop: '1px solid #F0E8E0',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex' }}>
        {tabs.map(tab => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                paddingTop: 10, paddingBottom: 10, gap: 3,
                border: 'none', background: 'transparent',
                cursor: 'pointer', position: 'relative',
                color: isActive ? '#C4521A' : '#9CA3AF',
                transition: 'color 0.2s'
              }}
            >
              {isActive && (
                <span style={{
                  position: 'absolute', top: 0, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 32, height: 3, borderRadius: '0 0 3px 3px',
                  background: 'linear-gradient(90deg,#C4521A,#D4A017)'
                }} />
              )}
              <span style={{
                display: 'flex',
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.2s'
              }}>
                {isActive ? ICONS[tab.iconFill] || ICONS[tab.icon] : ICONS[tab.icon]}
              </span>
              <span style={{
                fontSize: 10.5, fontWeight: isActive ? 700 : 500,
                letterSpacing: 0.2, lineHeight: 1
              }}>{tab.label}</span>
            </button>
          )
        })}
      </div>
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
  const [activeTab, setActiveTab] = useState('accueil')
  const [activeConcoursTab, setActiveConcoursTab] = useState('direct')
  const [activeAboutTab, setActiveAboutTab] = useState('app')

  useEffect(() => {
    if (!loading && user) {
      if (user.is_admin) router.push('/admin')
      else router.push('/dashboard')
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
    const text = `🎓 Préparez vos concours du Burkina Faso avec IFL !\n\n✅ Des milliers de QCM\n✅ Concours directs – 12 dossiers (5 000 FCFA)\n✅ Concours professionnels – 17 dossiers (20 000 FCFA)\n✅ Démo gratuite sans inscription\n\n👉 ${APP_URL}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'IFL – Idéale Formation of Leaders', text, url: APP_URL })
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#8B2500,#C4521A)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: 'white', fontWeight: 600 }}>Chargement...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>IFL – Idéale Formation of Leaders | Concours Burkina Faso</title>
        <meta name="description" content="Préparez vos concours du Burkina Faso avec IFL. Milliers de QCM. Démo gratuite. Concours directs et professionnels." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#8B2500" />
      </Head>

      <div style={{ minHeight: '100vh', background: '#FFF8F0', paddingBottom: 80 }}>

        {/* ===== HEADER FIXE ===== */}
        <header style={{
          background: 'linear-gradient(135deg, #8B2500 0%, #C4521A 100%)',
          position: 'sticky', top: 0, zIndex: 40,
          boxShadow: '0 2px 16px rgba(139,37,0,0.3)'
        }}>
          <div style={{ maxWidth: 480, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                <img src="/logo.png" alt="IFL" style={{ width: 44, height: 44, objectFit: 'cover', display: 'block' }} />
              </div>
              <div>
                <p style={{ color: 'white', fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>IFL</p>
                <p style={{ color: 'rgba(255,200,150,0.9)', fontSize: 11 }}>Idéale Formation of Leaders</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={handleShare} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'rgba(255,200,150,0.9)' }}>
                {ICONS.share}
              </button>
              <Link href="/login" style={{
                padding: '7px 14px', borderRadius: 10,
                background: 'rgba(255,255,255,0.2)', color: 'white',
                fontWeight: 700, fontSize: 13, textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.3)'
              }}>Connexion</Link>
            </div>
          </div>
          {shareMsg && <div style={{ textAlign: 'center', paddingBottom: 6, fontSize: 13, fontWeight: 600, color: '#FFE4A0' }}>{shareMsg}</div>}
        </header>

        {/* ===== ONGLET ACCUEIL ===== */}
        {activeTab === 'accueil' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {/* Hero */}
            <div style={{ background: 'linear-gradient(160deg,#8B2500,#C4521A,#D4A017)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 30px,rgba(255,255,255,0.02) 30px,rgba(255,255,255,0.02) 60px)' }} />
              <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 16px 28px', textAlign: 'center', position: 'relative' }}>
                <div style={{ width: 88, height: 88, borderRadius: 24, overflow: 'hidden', margin: '0 auto 16px', boxShadow: '0 8px 28px rgba(0,0,0,0.3)' }}>
                  <img src="/logo.png" alt="IFL" style={{ width: 88, height: 88, objectFit: 'cover' }} />
                </div>
                <h1 style={{ color: 'white', fontWeight: 900, fontSize: 22, marginBottom: 8, lineHeight: 1.3 }}>
                  Réussissez vos concours<br/>du Burkina Faso
                </h1>
                <p style={{ color: 'rgba(255,200,150,0.9)', fontSize: 14, marginBottom: 6 }}>Des milliers de QCM pour vous préparer</p>
                <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.18)', color: 'white', fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 20, marginBottom: 4 }}>
                  🆓 Démo gratuite – sans inscription
                </div>
              </div>
            </div>

            <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>

              {/* === DÉMO GRATUITE – ENCART PRINCIPAL === */}
              <div style={{
                borderRadius: 24, overflow: 'hidden', marginBottom: 20,
                background: 'linear-gradient(135deg,#D4A017,#F0C030)',
                boxShadow: '0 8px 28px rgba(212,160,23,0.4)',
                border: '2px solid rgba(255,220,100,0.6)'
              }}>
                <div style={{ padding: '24px 20px', textAlign: 'center' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 20,
                    background: 'rgba(255,255,255,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 14px'
                  }}>
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <h2 style={{ color: 'white', fontWeight: 900, fontSize: 22, marginBottom: 6 }}>Démo gratuite</h2>
                  <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, marginBottom: 4 }}>10 questions pour découvrir IFL</p>
                  <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginBottom: 20 }}>Aucune inscription requise – Commencez maintenant !</p>
                  <Link href="/demo" style={{
                    display: 'inline-block', padding: '14px 36px',
                    background: 'white', color: '#C4521A',
                    fontWeight: 900, fontSize: 16, borderRadius: 16,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    textDecoration: 'none', letterSpacing: 0.3
                  }}>🎯 Tester la démo gratuite</Link>
                </div>
              </div>

              {/* Offres */}
              <p style={{ textAlign: 'center', fontWeight: 900, fontSize: 17, color: '#8B2500', marginBottom: 14 }}>Nos offres</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div onClick={() => setActiveTab('concours')} style={{
                  background: 'white', borderRadius: 20, padding: 16, textAlign: 'center',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #FFE4CC', cursor: 'pointer'
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#FFF0E8,#FFD8B0)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2.2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                  </div>
                  <h3 style={{ fontWeight: 800, fontSize: 13, color: '#8B2500', marginBottom: 4 }}>Concours Directs</h3>
                  <p style={{ color: '#888', fontSize: 11, marginBottom: 6 }}>12 dossiers</p>
                  <p style={{ fontWeight: 900, fontSize: 20, color: '#C4521A' }}>5 000</p>
                  <p style={{ color: '#aaa', fontSize: 11 }}>FCFA</p>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#C4521A', marginTop: 6 }}>Voir →</p>
                </div>
                <div onClick={() => { setActiveTab('concours'); setActiveConcoursTab('professionnel') }} style={{
                  background: 'white', borderRadius: 20, padding: 16, textAlign: 'center',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #FFE8A0', cursor: 'pointer'
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#FFF8E0,#FFE8A0)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2.2" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
                  </div>
                  <h3 style={{ fontWeight: 800, fontSize: 13, color: '#8B2500', marginBottom: 4 }}>Professionnels</h3>
                  <p style={{ color: '#888', fontSize: 11, marginBottom: 6 }}>17 dossiers</p>
                  <p style={{ fontWeight: 900, fontSize: 20, color: '#D4A017' }}>20 000</p>
                  <p style={{ color: '#aaa', fontSize: 11 }}>FCFA</p>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#D4A017', marginTop: 6 }}>Voir →</p>
                </div>
              </div>

              {/* Bannière 5 questions gratuites */}
              <div style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE8A0)', borderRadius: 16, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, border: '1.5px solid #D4A017' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: '#D4A017', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                </div>
                <div>
                  <p style={{ fontWeight: 800, color: '#7A6000', fontSize: 13 }}>5 questions gratuites par dossier</p>
                  <p style={{ color: '#957000', fontSize: 11, marginTop: 2 }}>Essayez sans compte. Inscrivez-vous pour tout débloquer !</p>
                </div>
              </div>

              {/* Paiement Orange Money */}
              <div style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9500)', borderRadius: 20, padding: '18px 16px', marginBottom: 16, color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 42, height: 42, background: 'rgba(255,255,255,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3"/></svg>
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 15 }}>Paiement Orange Money</p>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>Simple et rapide</p>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 8 }}>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, marginBottom: 4 }}>Code USSD :</p>
                  <button onClick={() => { navigator.clipboard?.writeText('*144*10*76223962#'); alert('✅ Code copié !') }}
                    style={{ fontSize: 16, fontWeight: 900, color: 'white', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>
                    *144*10*76223962#
                  </button>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>Bénéficiaire : <a href="tel:+22676223962" style={{ fontWeight: 800, color: 'white', textDecoration: 'underline' }}>+226 76 22 39 62</a></p>
              </div>

              {/* Pourquoi IFL */}
              <p style={{ fontWeight: 900, fontSize: 17, color: '#8B2500', marginBottom: 12 }}>Pourquoi choisir IFL ?</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[
                  { icon: 'openbook', text: 'Milliers de QCM' },
                  { icon: 'health', text: 'Mobile-friendly' },
                  { icon: 'target', text: 'Résultats immédiats' },
                  { icon: 'globe', text: 'Tous concours BF' },
                ].map((f, i) => (
                  <div key={i} style={{ background: 'white', borderRadius: 16, padding: '14px 12px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #FFE8D0' }}>
                    <span style={{ color: '#C4521A' }}>{ICONS[f.icon]}</span>
                    <p style={{ fontWeight: 600, fontSize: 13, color: '#333' }}>{f.text}</p>
                  </div>
                ))}
              </div>

              {/* CTA Inscription */}
              <div style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)', borderRadius: 20, padding: '20px 16px', textAlign: 'center', marginBottom: 24 }}>
                <p style={{ color: 'white', fontWeight: 900, fontSize: 18, marginBottom: 8 }}>🚀 Commencez aujourd&apos;hui !</p>
                <p style={{ color: 'rgba(255,200,150,0.9)', fontSize: 13, marginBottom: 16 }}>Créez votre compte gratuitement</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Link href="/register" style={{ flex: 1, padding: '14px 8px', textAlign: 'center', fontWeight: 800, borderRadius: 14, fontSize: 14, background: 'white', color: '#C4521A', textDecoration: 'none' }}>
                    📝 S&apos;inscrire
                  </Link>
                  <Link href="/demo" style={{ flex: 1, padding: '14px 8px', textAlign: 'center', fontWeight: 800, color: 'white', borderRadius: 14, fontSize: 14, border: '2px solid white', textDecoration: 'none' }}>
                    🎯 Démo
                  </Link>
                </div>
              </div>

              {/* Footer */}
              <footer style={{ textAlign: 'center', borderTop: '1px solid #FFE8D0', paddingTop: 16 }}>
                <a href="https://wa.me/22676223962" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, fontSize: 13, color: '#C4521A', display: 'block', marginBottom: 10, textDecoration: 'none' }}>
                  💬 WhatsApp : +226 76 22 39 62
                </a>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 13, color: '#888', marginBottom: 8 }}>
                  <Link href="/login" style={{ color: '#888', textDecoration: 'none' }}>Connexion</Link>
                  <Link href="/register" style={{ color: '#888', textDecoration: 'none' }}>Inscription</Link>
                  <Link href="/help" style={{ color: '#888', textDecoration: 'none' }}>Aide</Link>
                </div>
                <p style={{ color: '#bbb', fontSize: 11 }}>© 2025 IFL – Burkina Faso</p>
              </footer>
            </div>
          </div>
        )}

        {/* ===== ONGLET CONCOURS ===== */}
        {activeTab === 'concours' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {/* Sub-header */}
            <div style={{ background: 'linear-gradient(160deg,#8B2500,#C4521A)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 30px,rgba(255,255,255,0.02) 30px,rgba(255,255,255,0.02) 60px)' }} />
              <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 16px 24px', textAlign: 'center', position: 'relative' }}>
                <div style={{ width: 60, height: 60, borderRadius: 18, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  {ICONS.competitionFill}
                </div>
                <h2 style={{ color: 'white', fontWeight: 900, fontSize: 22, marginBottom: 6 }}>Nos Concours</h2>
                <p style={{ color: 'rgba(255,200,150,0.9)', fontSize: 13 }}>Choisissez votre catégorie et entraînez-vous</p>
              </div>
            </div>

            <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 14px' }}>
              {/* Sélecteur Directs / Pro */}
              <div style={{ display: 'flex', gap: 8, background: '#F3F4F6', borderRadius: 18, padding: 5, marginBottom: 20, boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.08)' }}>
                <button onClick={() => setActiveConcoursTab('direct')}
                  style={{
                    flex: 1, padding: '12px 8px', borderRadius: 14,
                    fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
                    background: activeConcoursTab === 'direct' ? 'linear-gradient(135deg,#C4521A,#D4A017)' : 'transparent',
                    color: activeConcoursTab === 'direct' ? 'white' : '#6B7280',
                    boxShadow: activeConcoursTab === 'direct' ? '0 3px 10px rgba(196,82,26,0.4)' : 'none',
                    transition: 'all 0.25s'
                  }}>
                  📚 Directs (12)
                </button>
                <button onClick={() => setActiveConcoursTab('professionnel')}
                  style={{
                    flex: 1, padding: '12px 8px', borderRadius: 14,
                    fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
                    background: activeConcoursTab === 'professionnel' ? 'linear-gradient(135deg,#C4521A,#D4A017)' : 'transparent',
                    color: activeConcoursTab === 'professionnel' ? 'white' : '#6B7280',
                    boxShadow: activeConcoursTab === 'professionnel' ? '0 3px 10px rgba(196,82,26,0.4)' : 'none',
                    transition: 'all 0.25s'
                  }}>
                  🎓 Professionnels (17)
                </button>
              </div>

              {/* Section Directs */}
              {activeConcoursTab === 'direct' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontWeight: 900, fontSize: 17, color: '#8B2500', marginBottom: 2 }}>Concours directs</h3>
                      <p style={{ color: '#888', fontSize: 12 }}>12 dossiers thématiques</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 900, fontSize: 19, color: '#C4521A' }}>5 000</p>
                      <p style={{ color: '#aaa', fontSize: 11 }}>FCFA accès complet</p>
                    </div>
                  </div>

                  {loadingCats ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                      {[...Array(6)].map((_, i) => (
                        <div key={i} style={{ height: 140, background: '#f0f0f0', borderRadius: 20, animation: 'pulse 1.5s infinite' }} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                      {categoriesDirect.map((cat, i) => (
                        <CategoryGridCard key={cat.id || i} cat={cat} index={i} catType="direct" colors={CAT_COLORS_DIRECT} />
                      ))}
                    </div>
                  )}

                  <div style={{ background: 'white', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1.5px solid #FFE4CC', marginBottom: 10 }}>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: 14, color: '#8B2500' }}>Accès complet</p>
                      <p style={{ color: '#888', fontSize: 12 }}>Débloquer tous les dossiers</p>
                    </div>
                    <Link href="/payment?type=direct&montant=5000" style={{
                      padding: '10px 18px', fontWeight: 800, color: 'white', borderRadius: 12,
                      fontSize: 13, background: 'linear-gradient(135deg,#C4521A,#D4A017)',
                      boxShadow: '0 3px 10px rgba(196,82,26,0.4)', textDecoration: 'none'
                    }}>5 000 FCFA →</Link>
                  </div>
                  <Link href="/register" style={{ display: 'block', textAlign: 'center', padding: '12px', fontWeight: 700, borderRadius: 14, fontSize: 13, border: '2px solid #F0A070', color: '#C4521A', background: '#FFF8F0', textDecoration: 'none', marginBottom: 16 }}>
                    📝 Créer un compte gratuit
                  </Link>
                </div>
              )}

              {/* Section Professionnels */}
              {activeConcoursTab === 'professionnel' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontWeight: 900, fontSize: 17, color: '#8B2500', marginBottom: 2 }}>Concours professionnels</h3>
                      <p style={{ color: '#888', fontSize: 12 }}>17 dossiers spécialisés</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 900, fontSize: 19, color: '#D4A017' }}>20 000</p>
                      <p style={{ color: '#aaa', fontSize: 11 }}>FCFA accès complet</p>
                    </div>
                  </div>

                  {loadingCats ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                      {[...Array(6)].map((_, i) => (
                        <div key={i} style={{ height: 140, background: '#f0f0f0', borderRadius: 20, animation: 'pulse 1.5s infinite' }} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                      {categoriesPro.map((cat, i) => (
                        <CategoryGridCard key={cat.id || i} cat={cat} index={i} catType="professionnel" colors={CAT_COLORS_PRO} />
                      ))}
                    </div>
                  )}

                  <div style={{ background: 'white', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1.5px solid #FFE8A0', marginBottom: 10 }}>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: 14, color: '#8B2500' }}>Accès complet</p>
                      <p style={{ color: '#888', fontSize: 12 }}>Débloquer tous les dossiers</p>
                    </div>
                    <Link href="/payment?type=professionnel&montant=20000" style={{
                      padding: '10px 18px', fontWeight: 800, color: 'white', borderRadius: 12,
                      fontSize: 13, background: 'linear-gradient(135deg,#D4A017,#F0C030)',
                      boxShadow: '0 3px 10px rgba(212,160,23,0.4)', textDecoration: 'none'
                    }}>20 000 FCFA →</Link>
                  </div>
                  <Link href="/register" style={{ display: 'block', textAlign: 'center', padding: '12px', fontWeight: 700, borderRadius: 14, fontSize: 13, border: '2px solid #F0A070', color: '#C4521A', background: '#FFF8F0', textDecoration: 'none', marginBottom: 16 }}>
                    📝 Créer un compte gratuit
                  </Link>
                </div>
              )}

              {/* Bannière démo */}
              <div style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE8A0)', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, border: '1.5px solid #D4A017' }}>
                <div style={{ width: 42, height: 42, background: '#D4A017', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 800, color: '#7A6000', fontSize: 13 }}>Démo gratuite disponible</p>
                  <p style={{ color: '#957000', fontSize: 11 }}>10 questions d&apos;entraînement</p>
                </div>
                <Link href="/demo" style={{ padding: '8px 14px', fontWeight: 700, color: 'white', borderRadius: 10, fontSize: 12, background: '#D4A017', textDecoration: 'none' }}>Essayer</Link>
              </div>
            </div>
          </div>
        )}

        {/* ===== ONGLET À PROPOS ===== */}
        {activeTab === 'apropos' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ background: 'linear-gradient(160deg,#8B2500,#C4521A)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 30px,rgba(255,255,255,0.02) 30px,rgba(255,255,255,0.02) 60px)' }} />
              <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 16px 24px', textAlign: 'center', position: 'relative' }}>
                <div style={{ width: 60, height: 60, borderRadius: 18, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  {ICONS.infoFill}
                </div>
                <h2 style={{ color: 'white', fontWeight: 900, fontSize: 22, marginBottom: 6 }}>À propos</h2>
                <p style={{ color: 'rgba(255,200,150,0.9)', fontSize: 13 }}>Découvrez IFL, notre équipe et notre développeur</p>
              </div>
            </div>

            <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 14px' }}>
              {/* Sous-onglets */}
              <div style={{ display: 'flex', gap: 6, background: '#F3F4F6', borderRadius: 16, padding: 5, marginBottom: 20, boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.08)' }}>
                {[
                  { id: 'app', label: "L'application" },
                  { id: 'equipe', label: "Notre équipe" },
                  { id: 'dev', label: "Développeur" }
                ].map(t => (
                  <button key={t.id} onClick={() => setActiveAboutTab(t.id)}
                    style={{
                      flex: 1, padding: '10px 4px', borderRadius: 12, fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer',
                      background: activeAboutTab === t.id ? 'linear-gradient(135deg,#C4521A,#D4A017)' : 'transparent',
                      color: activeAboutTab === t.id ? 'white' : '#6B7280',
                      boxShadow: activeAboutTab === t.id ? '0 2px 8px rgba(196,82,26,0.3)' : 'none',
                      transition: 'all 0.2s'
                    }}>{t.label}</button>
                ))}
              </div>

              {/* L'application */}
              {activeAboutTab === 'app' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <div style={{ background: 'white', borderRadius: 24, padding: 24, marginBottom: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #FFE8D0' }}>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                      <div style={{ width: 80, height: 80, borderRadius: 22, overflow: 'hidden', margin: '0 auto 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                        <img src="/logo.png" alt="IFL" style={{ width: 80, height: 80, objectFit: 'cover' }} />
                      </div>
                      <h2 style={{ fontWeight: 900, fontSize: 19, color: '#8B2500', marginBottom: 6 }}>Idéale Formation of Leaders</h2>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 10, background: '#FFF0E8', color: '#C4521A' }}>IFL</span>
                    </div>
                    <p style={{ color: '#555', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                      <strong style={{ color: '#8B2500' }}>IFL</strong> est une application de préparation aux concours directs et professionnels au Burkina Faso. Elle propose des milliers de QCM classés par dossiers thématiques, avec un système de progression et des explications détaillées.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[
                        { val: '12', label: 'Dossiers directs', icon: 'book' },
                        { val: '17', label: 'Dossiers pro', icon: 'graduation' },
                        { val: '5', label: 'Questions gratuites', icon: 'check' },
                        { val: '100%', label: 'Burkina Faso', icon: 'globe' },
                      ].map((s, i) => (
                        <div key={i} style={{ background: '#FFF8F0', borderRadius: 14, padding: '12px 8px', textAlign: 'center', border: '1px solid #FFE8D0' }}>
                          <span style={{ color: '#C4521A', display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{ICONS[s.icon]}</span>
                          <p style={{ fontWeight: 900, fontSize: 16, color: '#C4521A' }}>{s.val}</p>
                          <p style={{ color: '#888', fontSize: 11 }}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: 'white', borderRadius: 20, padding: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #FFE8D0' }}>
                    <h3 style={{ fontWeight: 800, fontSize: 15, color: '#8B2500', marginBottom: 14 }}>🎯 Nos offres</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ background: 'linear-gradient(135deg,#FFF0E8,#FFE4CC)', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: '#C4521A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: 'white' }}>{ICONS.book}</span></div>
                        <div>
                          <p style={{ fontWeight: 800, fontSize: 14, color: '#8B2500' }}>Concours Directs</p>
                          <p style={{ color: '#888', fontSize: 12 }}>12 dossiers – <strong style={{ color: '#C4521A' }}>5 000 FCFA</strong></p>
                        </div>
                      </div>
                      <div style={{ background: 'linear-gradient(135deg,#FFF8E0,#FFE8A0)', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: '#D4A017', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: 'white' }}>{ICONS.graduation}</span></div>
                        <div>
                          <p style={{ fontWeight: 800, fontSize: 14, color: '#8B2500' }}>Concours Professionnels</p>
                          <p style={{ color: '#888', fontSize: 12 }}>17 dossiers – <strong style={{ color: '#D4A017' }}>20 000 FCFA</strong></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notre équipe */}
              {activeAboutTab === 'equipe' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <div style={{ background: 'white', borderRadius: 24, padding: 24, marginBottom: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #FFE8D0' }}>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                      <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,#FFF0E8,#FFE0C8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      </div>
                      <h2 style={{ fontWeight: 900, fontSize: 19, color: '#8B2500' }}>Notre équipe</h2>
                    </div>
                    <p style={{ color: '#555', fontSize: 14, lineHeight: 1.7, marginBottom: 14 }}>
                      L&apos;équipe d&apos;<strong style={{ color: '#8B2500' }}>Idéale Formation of Leaders</strong> est composée d&apos;enseignants et de professionnels passionnés qui accompagnent chaque année des centaines de candidats burkinabè vers la réussite.
                    </p>
                    <p style={{ color: '#555', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                      Notre équipe est auteure de documents, mémoires et livres spécialisés pour les concours directs. Notre mission : mettre à disposition des outils de qualité, accessibles et efficaces.
                    </p>

                    <div style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE4B5)', borderRadius: 18, padding: 18, border: '2px solid #D4A017' }}>
                      <p style={{ fontWeight: 800, color: '#7A6000', fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#D4A017' }}>{ICONS.phone}</span> Contactez-nous
                      </p>
                      <a href="tel:+22676223962" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12, textDecoration: 'none' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#C4521A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: 'white' }}>{ICONS.phone}</span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#C4521A' }}>+226 76 22 39 62</span>
                      </a>
                      <a href="https://wa.me/22676223962?text=Bonjour%20IFL" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#25D366' }}>WhatsApp : +226 76 22 39 62</span>
                      </a>
                    </div>
                  </div>

                  <div style={{ background: 'white', borderRadius: 20, padding: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #FFE8D0' }}>
                    <h3 style={{ fontWeight: 800, fontSize: 15, color: '#8B2500', marginBottom: 14 }}>🏆 Notre mission</h3>
                    {[
                      { icon: 'openbook', text: 'Des milliers de QCM mis à jour régulièrement' },
                      { icon: 'info', text: 'Explications détaillées pour chaque question' },
                      { icon: 'health', text: 'Application mobile-friendly, disponible partout' },
                      { icon: 'target', text: 'Taux de réussite amélioré pour nos candidats' },
                    ].map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 12, background: '#FFF8F0', marginBottom: 8 }}>
                        <span style={{ color: '#C4521A', flexShrink: 0 }}>{ICONS[f.icon]}</span>
                        <p style={{ color: '#555', fontSize: 13 }}>{f.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Le développeur */}
              {activeAboutTab === 'dev' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <div style={{ background: 'white', borderRadius: 24, padding: 24, marginBottom: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #FFE8D0' }}>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                      <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg,#8B2500,#C4521A)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 4px 16px rgba(196,82,26,0.35)' }}>
                        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                      </div>
                      <h2 style={{ fontWeight: 900, fontSize: 20, color: '#8B2500', marginBottom: 6 }}>Marc LOMPO</h2>
                      <span style={{ fontSize: 13, fontWeight: 700, padding: '4px 14px', borderRadius: 10, background: '#FFF0E8', color: '#C4521A' }}>Ingénieur Digital</span>
                    </div>
                    <p style={{ color: '#555', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                      Passionné par les technologies éducatives, <strong style={{ color: '#8B2500' }}>Marc LOMPO</strong> conçoit des applications sur mesure pour aider les apprenants à atteindre leurs objectifs. Disponible pour tout projet ou partenariat.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <a href="tel:+22672662161" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', borderRadius: 16, background: 'linear-gradient(135deg,#FFF0E8,#FFE4CC)', border: '1.5px solid #FFD0A0', textDecoration: 'none' }}>
                        <div style={{ width: 46, height: 46, borderRadius: 14, background: '#C4521A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ color: 'white' }}>{ICONS.phone}</span>
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 12, color: '#8B2500' }}>Téléphone</p>
                          <p style={{ fontWeight: 900, fontSize: 16, color: '#C4521A' }}>+226 72 66 21 61</p>
                        </div>
                      </a>
                      <a href="https://wa.me/22672662161?text=Bonjour%20Marc%2C%20je%20vous%20contacte%20via%20IFL" target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', borderRadius: 16, background: '#F0FFF4', border: '1.5px solid #A5D6A7', textDecoration: 'none' }}>
                        <div style={{ width: 46, height: 46, borderRadius: 14, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 12, color: '#1B5E20' }}>WhatsApp</p>
                          <p style={{ fontWeight: 900, fontSize: 16, color: '#2E7D32' }}>+226 72 66 21 61</p>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== ONGLET PROFIL (non connecté) ===== */}
        {activeTab === 'profil' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ background: 'linear-gradient(160deg,#8B2500,#C4521A)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 30px,rgba(255,255,255,0.02) 30px,rgba(255,255,255,0.02) 60px)' }} />
              <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 16px 24px', textAlign: 'center', position: 'relative' }}>
                <div style={{ width: 60, height: 60, borderRadius: 18, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  {ICONS.profileFill}
                </div>
                <h2 style={{ color: 'white', fontWeight: 900, fontSize: 22, marginBottom: 6 }}>Mon Profil</h2>
                <p style={{ color: 'rgba(255,200,150,0.9)', fontSize: 13 }}>Connectez-vous pour accéder à votre profil</p>
              </div>
            </div>

            <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 16px' }}>
              {/* Illustration connexion requise */}
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg,#FFF0E8,#FFD8B0)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(196,82,26,0.15)' }}>
                  <span style={{ color: '#C4521A', transform: 'scale(1.8)', display: 'flex' }}>{ICONS.profile}</span>
                </div>
                <h3 style={{ fontWeight: 900, fontSize: 20, color: '#8B2500', marginBottom: 10 }}>Accès à votre profil</h3>
                <p style={{ color: '#666', fontSize: 14, lineHeight: 1.6, marginBottom: 28, padding: '0 20px' }}>
                  Connectez-vous pour accéder à votre abonnement, votre progression, et gérer votre compte.
                </p>
                <Link href="/login" style={{
                  display: 'block', padding: '16px', textAlign: 'center',
                  fontWeight: 900, fontSize: 16, borderRadius: 18,
                  background: 'linear-gradient(135deg,#C4521A,#D4A017)',
                  color: 'white', textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(196,82,26,0.4)',
                  marginBottom: 12
                }}>🔑 Se connecter</Link>
                <Link href="/register" style={{
                  display: 'block', padding: '14px', textAlign: 'center',
                  fontWeight: 700, fontSize: 15, borderRadius: 16,
                  border: '2px solid #F0A070', color: '#C4521A',
                  background: '#FFF8F0', textDecoration: 'none'
                }}>📝 Créer un compte</Link>
              </div>

              {/* Avantages du compte */}
              <div style={{ background: 'white', borderRadius: 20, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #FFE8D0' }}>
                <h3 style={{ fontWeight: 800, fontSize: 14, color: '#8B2500', marginBottom: 14 }}>Avec votre compte, accédez à :</h3>
                {[
                  { icon: 'check', text: 'Votre progression par dossier' },
                  { icon: 'check', text: 'Vos abonnements actifs' },
                  { icon: 'check', text: 'La reprise où vous vous êtes arrêté' },
                  { icon: 'check', text: 'L\'historique de vos résultats' },
                  { icon: 'share', text: 'Partager l\'application' },
                  { icon: 'star', text: 'Évaluer l\'application' },
                ].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', borderRadius: 12, background: i % 2 === 0 ? '#FFF8F0' : 'transparent', marginBottom: 4 }}>
                    <span style={{ color: i < 4 ? '#2E7D32' : '#C4521A', flexShrink: 0 }}>{ICONS[f.icon]}</span>
                    <p style={{ color: '#444', fontSize: 13 }}>{f.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== BARRE DE NAV EN BAS ===== */}
        <BottomNav active={activeTab} onChange={setActiveTab} />

        {/* WhatsApp flottant */}
        <WhatsAppFloat />

      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes pulse { 0%,100% { opacity: 0.5 } 50% { opacity: 1 } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      `}</style>
    </>
  )
}
