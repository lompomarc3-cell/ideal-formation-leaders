import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'

const APP_URL = 'https://ideal-formation-leaders.pages.dev'

// ===== ICÔNES SVG =====
const ICONS = {
  home: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3L21 9.5V20a1 1 0 0 1-1 1H15v-5H9v5H4a1 1 0 0 1-1-1z"/></svg>,
  homeFill: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.1L2.5 9.5V21a1 1 0 0 0 1 1h6v-6h5v6h6a1 1 0 0 0 1-1V9.5z"/></svg>,
  competition: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L9.5 8.5H2L7.5 12.5L5.5 19.5L12 15.5L18.5 19.5L16.5 12.5L22 8.5H14.5z"/></svg>,
  competitionFill: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9.5 8.5H2L7.5 12.5L5.5 19.5L12 15.5L18.5 19.5L16.5 12.5L22 8.5H14.5z"/></svg>,
  info: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v.5M12 11.5V16"/></svg>,
  infoFill: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2zm0 5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm1 5h-2v6h2v-6z"/></svg>,
  profile: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  profileFill: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a6 6 0 1 0 0 12A6 6 0 0 0 12 2zM4 20c0-3.87 3.58-7 8-7s8 3.13 8 7H4z"/></svg>,
  share: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  logout: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  star: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  lock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  check: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  phone: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12 19.79 19.79 0 0 1 1.98 3.42 2 2 0 0 1 3.96 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  admin: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
}

// Couleurs par catégorie
const CAT_COLORS_DIRECT = ['#E55A00','#1565C0','#7B1FA2','#2E7D32','#00695C','#AD1457','#0277BD','#F57F17','#4527A0','#00838F','#558B2F','#C62828']
const CAT_COLORS_PRO = ['#1565C0','#E55A00','#6A1B9A','#0277BD','#00695C','#2E7D32','#7B1FA2','#1B5E20','#AD1457','#00838F','#4527A0','#827717','#1A237E','#37474F','#BF360C','#558B2F','#C62828']

const CAT_ICONS_DIRECT = ['globe','book','palette','map','leaf','brain','calculator','flask','scale','chart','pencil','target']
const CAT_ICONS_PRO = ['school','newspaper','building','magnifier','search2','graduation','scroll','openbook','hospital','health','justice','judge','shield','badge','clipboard','pencil','target']

const ALL_ICONS = {
  globe: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>,
  book: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  palette: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/><circle cx="7" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="7" r="1" fill="currentColor"/><circle cx="14.5" cy="6" r="1" fill="currentColor"/><circle cx="18" cy="10" r="1" fill="currentColor"/></svg>,
  map: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  leaf: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>,
  brain: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2z"/></svg>,
  calculator: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/><line x1="8" y1="18" x2="12" y2="18"/></svg>,
  flask: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H15M9 3V13L4 20H20L15 13V3M9 3H15"/><path d="M6.5 17.5h2M9 15h3"/></svg>,
  scale: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><path d="M5 21h14"/><path d="M16 7l4 7H12l4-7zM8 7L4 14h8L8 7z"/></svg>,
  chart: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  pencil: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  target: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  school: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22h20M6 22V10l6-6 6 6v12"/><path d="M9 22v-4h6v4"/></svg>,
  newspaper: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/></svg>,
  building: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="1"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  magnifier: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="7"/><line x1="21" y1="21" x2="15" y2="15"/><line x1="7.5" y1="10" x2="12.5" y2="10"/><line x1="10" y1="7.5" x2="10" y2="12.5"/></svg>,
  search2: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="7"/><line x1="21" y1="21" x2="15" y2="15"/><path d="M8 10h4M10 8v4"/></svg>,
  graduation: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>,
  scroll: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h12a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4z"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M15 17H4a2 2 0 0 1 0-4h11"/></svg>,
  openbook: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  hospital: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9m6 12V9"/><path d="M12 5v3M10.5 6.5h3"/></svg>,
  health: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/><path d="M12 8v8M8 12h8"/></svg>,
  justice: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M4 8l8 2 8-2M6 15l6 2 6-2M5 21h14"/></svg>,
  judge: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/><path d="M15 21l-3-3-3 3"/></svg>,
  shield: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
  badge: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="10" r="3"/></svg>,
  clipboard: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>,
}

// Obtenir icon par nom de catégorie
function getCatIconName(nom, type) {
  const n = (nom || '').toLowerCase()
  if (type === 'direct') {
    if (n.includes('culture') || n.includes('actualit')) return 'globe'
    if (n.includes('fran')) return 'book'
    if (n.includes('litt') || n.includes('art')) return 'palette'
    if (n.includes('histoir') || n.includes('géograph') || n.includes('h-g')) return 'map'
    if (n.includes('svt') || n.includes('science')) return 'leaf'
    if (n.includes('psycho')) return 'brain'
    if (n.includes('math')) return 'calculator'
    if (n.includes('physique') || n.includes('chimie')) return 'flask'
    if (n.includes('droit')) return 'scale'
    if (n.includes('conom')) return 'chart'
    if (n.includes('qcm') || n.includes('entra')) return 'pencil'
    if (n.includes('accomp') || n.includes('final')) return 'target'
  } else {
    if (n.includes('vie scolaire') || n.includes('casu')) return 'school'
    if (n.includes('actualit') || n.includes('culture')) return 'newspaper'
    if (n.includes('cisu') || n.includes('enaref')) return 'building'
    if (n.includes('ies') && n.includes('inspect')) return 'magnifier'
    if (n.includes('iepenf')) return 'search2'
    if (n.includes('csap')) return 'graduation'
    if (n.includes('agrég') || n.includes('agr')) return 'scroll'
    if (n.includes('capes')) return 'openbook'
    if (n.includes('hôpital') || n.includes('hopital') || n.includes('pital')) return 'hospital'
    if (n.includes('santé') || n.includes('sant')) return 'health'
    if (n.includes('justice')) return 'justice'
    if (n.includes('magistr')) return 'judge'
    if (n.includes('gsp')) return 'shield'
    if (n.includes('police')) return 'badge'
    if (n.includes('civil') || n.includes('admin')) return 'clipboard'
    if (n.includes('qcm') || n.includes('entra')) return 'pencil'
    if (n.includes('accomp') || n.includes('final')) return 'target'
  }
  return 'book'
}

// ===== CARTE CATÉGORIE GRILLE =====
function CategoryGridCard({ cat, index, catType, hasAccess }) {
  const colors = catType === 'direct' ? CAT_COLORS_DIRECT : CAT_COLORS_PRO
  const bgColor = colors[index % colors.length]
  const iconName = cat.icone || getCatIconName(cat.nom, catType)

  return (
    <Link href={`/quiz/${cat.id}`} style={{ display: 'block', textDecoration: 'none' }}>
      <div style={{
        background: 'white', borderRadius: 18, overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.07)', border: '1.5px solid #F0E8E0',
        minHeight: 140, display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ background: bgColor, padding: '12px 8px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 72, position: 'relative' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(0,0,0,0.15)', marginBottom: 3 }}>
            <span style={{ color: bgColor, display: 'flex' }}>{ALL_ICONS[iconName] || ALL_ICONS['book']}</span>
          </div>
          {hasAccess ? (
            <span style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(255,255,255,0.9)', borderRadius: 8, padding: '2px 5px', fontSize: 9, fontWeight: 700, color: '#2E7D32' }}>✓ Accès</span>
          ) : (
            <span style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(255,255,255,0.9)', borderRadius: 8, padding: '2px 5px', fontSize: 9, fontWeight: 700, color: '#C4521A' }}>🆓 5 Q.</span>
          )}
        </div>
        <div style={{ padding: '8px 8px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#333', lineHeight: 1.3, textAlign: 'center', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {cat.nom}
          </p>
        </div>
      </div>
    </Link>
  )
}

// ===== BARRE NAV BAS =====
function BottomNav({ active, onChange }) {
  const tabs = [
    { id: 'accueil', label: 'Accueil', icon: 'home', iconFill: 'homeFill' },
    { id: 'concours', label: 'Concours', icon: 'competition', iconFill: 'competitionFill' },
    { id: 'apropos', label: 'À propos', icon: 'info', iconFill: 'infoFill' },
    { id: 'profil', label: 'Profil', icon: 'profile', iconFill: 'profileFill' },
  ]
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, background: 'white', boxShadow: '0 -2px 20px rgba(0,0,0,0.1)', borderTop: '1px solid #F0E8E0', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex' }}>
        {tabs.map(tab => {
          const isActive = active === tab.id
          return (
            <button key={tab.id} onClick={() => onChange(tab.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 10, paddingBottom: 10, gap: 3, border: 'none', background: 'transparent', cursor: 'pointer', position: 'relative', color: isActive ? '#C4521A' : '#9CA3AF', transition: 'color 0.2s' }}>
              {isActive && <span style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 32, height: 3, borderRadius: '0 0 3px 3px', background: 'linear-gradient(90deg,#C4521A,#D4A017)' }} />}
              <span style={{ display: 'flex', transform: isActive ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s' }}>
                {isActive ? (ICONS[tab.iconFill] || ICONS[tab.icon]) : ICONS[tab.icon]}
              </span>
              <span style={{ fontSize: 10.5, fontWeight: isActive ? 700 : 500, lineHeight: 1 }}>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ===== DASHBOARD PRINCIPAL =====
export default function Dashboard() {
  const { user, loading, logout, getToken } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState({ direct: [], professionnel: [] })
  const [prices, setPrices] = useState({ direct: 5000, professionnel: 20000 })
  const [loadingData, setLoadingData] = useState(true)
  const [activeConcoursTab, setActiveConcoursTab] = useState('direct')
  const [activeMainTab, setActiveMainTab] = useState('concours')
  const [shareMsg, setShareMsg] = useState('')
  const [activeAboutTab, setActiveAboutTab] = useState('app')
  const [userProgress, setUserProgress] = useState({})

  const handleShare = async () => {
    const text = `🎓 Préparez vos concours du Burkina Faso avec IFL !\n\n✅ Des milliers de QCM\n✅ Concours directs & professionnels\n✅ Démo gratuite sans inscription\n\n👉 ${APP_URL}`
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

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadCategories()
      loadPrices()
    }
  }, [user])

  const loadCategories = async () => {
    try {
      const token = getToken()
      const [r1, r2] = await Promise.all([
        fetch('/api/quiz/categories?type=direct', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/quiz/categories?type=professionnel', { headers: { Authorization: `Bearer ${token}` } })
      ])
      const d1 = await r1.json()
      const d2 = await r2.json()
      setCategories({ direct: d1.categories || [], professionnel: d2.categories || [] })
    } catch {}
    setLoadingData(false)
  }

  const loadPrices = async () => {
    try {
      const token = getToken()
      const res = await fetch('/api/admin/prices', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.prices) {
        const priceMap = {}
        data.prices.forEach(p => { priceMap[p.type_concours] = p.prix })
        setPrices(prev => ({ ...prev, ...priceMap }))
      }
    } catch {}
  }

  const hasAccess = (type) => {
    if (!user) return false
    if (user.is_admin) return true
    const sub = user.abonnement_type
    const active = user.subscription_status === 'active'
    const notExpired = !user.abonnement_valide_jusqua || new Date(user.abonnement_valide_jusqua) > new Date()
    return active && notExpired && (sub === type || sub === 'all')
  }

  if (loading || !user) {
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

  const directAccess = hasAccess('direct')
  const proAccess = hasAccess('professionnel')

  // Nom et prénom
  const nameParts = (user.full_name || user.nom || '').trim().split(' ')
  const prenom = user.prenom || nameParts.slice(1).join(' ') || ''
  const nom = user.nom || nameParts[0] || ''
  const displayName = prenom || nom || 'Utilisateur'

  const abonnementLabel = user.is_admin
    ? '👑 Administrateur'
    : directAccess && proAccess
      ? '🏆 Accès complet'
      : directAccess
        ? '📚 Concours Directs'
        : proAccess
          ? '🎓 Concours Professionnels'
          : 'Aucun abonnement'

  const abonnementColor = (directAccess || proAccess || user.is_admin) ? '#2E7D32' : '#C4521A'

  return (
    <>
      <Head>
        <title>Mon Espace – IFL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#8B2500" />
      </Head>
      <div style={{ minHeight: '100vh', background: '#FFF8F0', paddingBottom: 80 }}>

        {/* ===== HEADER ===== */}
        <header style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 2px 16px rgba(139,37,0,0.3)' }}>
          <div style={{ maxWidth: 480, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                <img src="/logo.png" alt="IFL" style={{ width: 44, height: 44, objectFit: 'cover' }} />
              </div>
              <div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>Bonjour, {displayName} 👋</p>
                <p style={{ color: 'rgba(255,200,150,0.9)', fontSize: 11 }}>{user.is_admin ? '👑 Administrateur' : user.phone}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {user.is_admin && (
                <Link href="/admin" style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: 'white' }}>{ICONS.admin}</span> Admin
                </Link>
              )}
              <button onClick={handleShare} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'rgba(255,200,150,0.9)' }}>
                {ICONS.share}
              </button>
            </div>
          </div>
          {shareMsg && <div style={{ textAlign: 'center', paddingBottom: 6, fontSize: 13, fontWeight: 600, color: '#FFE4A0' }}>{shareMsg}</div>}
        </header>

        {/* ===== ONGLET ACCUEIL (dashboard) ===== */}
        {activeMainTab === 'accueil' && (
          <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 14px', animation: 'fadeIn 0.3s ease' }}>
            {/* Bannière admin */}
            {user.is_admin && (
              <div style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)', borderRadius: 18, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>👑 Mode Administrateur</p>
                  <p style={{ color: 'rgba(255,200,150,0.9)', fontSize: 11 }}>Vous voyez l&apos;app comme un utilisateur</p>
                </div>
                <Link href="/admin" style={{ padding: '8px 14px', background: 'white', color: '#C4521A', borderRadius: 12, fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>⚙️ Panel</Link>
              </div>
            )}

            {/* Carte abonnement */}
            <div style={{ background: 'white', borderRadius: 20, padding: '18px 16px', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `2px solid ${(directAccess || proAccess || user.is_admin) ? '#A5D6A7' : '#FFE8A0'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: (directAccess || proAccess || user.is_admin) ? '#E8F5E9' : '#FFF8E0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 26 }}>{(directAccess || proAccess || user.is_admin) ? '✅' : '⚡'}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 800, fontSize: 14, color: '#333', marginBottom: 4 }}>Abonnement</p>
                  <p style={{ fontWeight: 700, fontSize: 13, color: abonnementColor }}>{abonnementLabel}</p>
                  {!user.is_admin && user.abonnement_valide_jusqua && (
                    <p style={{ color: '#888', fontSize: 11, marginTop: 2 }}>Expire le: {new Date(user.abonnement_valide_jusqua).toLocaleDateString('fr-FR')}</p>
                  )}
                </div>
                {!directAccess && !proAccess && !user.is_admin && (
                  <Link href="/payment" style={{ padding: '8px 12px', background: 'linear-gradient(135deg,#C4521A,#D4A017)', color: 'white', borderRadius: 12, fontSize: 12, fontWeight: 800, textDecoration: 'none', flexShrink: 0 }}>S&apos;abonner</Link>
                )}
              </div>
            </div>

            {/* Accès rapides */}
            <p style={{ fontWeight: 800, fontSize: 15, color: '#8B2500', marginBottom: 12 }}>Accès rapides</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div onClick={() => setActiveMainTab('concours')} style={{ background: 'white', borderRadius: 16, padding: '16px 12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1.5px solid #FFE4CC', cursor: 'pointer' }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: '#FFF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                  <span style={{ color: '#C4521A', display: 'flex' }}>{ALL_ICONS['book']}</span>
                </div>
                <p style={{ fontWeight: 800, fontSize: 13, color: '#8B2500', marginBottom: 2 }}>Mes Concours</p>
                <p style={{ color: '#888', fontSize: 11 }}>12 + 17 dossiers</p>
              </div>
              <Link href="/demo" style={{ background: 'white', borderRadius: 16, padding: '16px 12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1.5px solid #FFE8A0', textDecoration: 'none', display: 'block' }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: '#FFF8E0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2.2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <p style={{ fontWeight: 800, fontSize: 13, color: '#8B2500', marginBottom: 2 }}>Démo gratuite</p>
                <p style={{ color: '#888', fontSize: 11 }}>10 questions</p>
              </Link>
            </div>

            {/* Stats rapides */}
            <div style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)', borderRadius: 20, padding: '18px 16px', marginBottom: 16, color: 'white' }}>
              <p style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>📊 Mes statistiques</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { val: categories.direct.length + categories.professionnel.length, label: 'Dossiers' },
                  { val: directAccess || proAccess || user.is_admin ? 'Actif' : 'Gratuit', label: 'Abonnement' },
                  { val: '5 🆓', label: 'Questions gratuites' },
                ].map((s, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: '10px 6px', textAlign: 'center' }}>
                    <p style={{ fontWeight: 900, fontSize: 16, marginBottom: 4 }}>{s.val}</p>
                    <p style={{ fontSize: 10, opacity: 0.85 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Liens utiles */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { label: '❓ Aide', href: '/help' },
                { label: '💬 WhatsApp', href: 'https://wa.me/22676223962', external: true },
                { label: '📤 Partager', onClick: handleShare },
              ].map((l, i) => (
                l.onClick
                  ? <button key={i} onClick={l.onClick} style={{ padding: '8px 16px', background: 'white', border: '1.5px solid #FFE4CC', color: '#C4521A', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{l.label}</button>
                  : <a key={i} href={l.href} target={l.external ? '_blank' : undefined} rel={l.external ? 'noopener noreferrer' : undefined} style={{ padding: '8px 16px', background: 'white', border: '1.5px solid #FFE4CC', color: '#C4521A', borderRadius: 12, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>{l.label}</a>
              ))}
            </div>
          </div>
        )}

        {/* ===== ONGLET CONCOURS ===== */}
        {activeMainTab === 'concours' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ background: 'linear-gradient(160deg,#8B2500,#C4521A)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 30px,rgba(255,255,255,0.02) 30px,rgba(255,255,255,0.02) 60px)' }} />
              <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 20px', textAlign: 'center', position: 'relative' }}>
                <h2 style={{ color: 'white', fontWeight: 900, fontSize: 20, marginBottom: 4 }}>Mes Concours</h2>
                <p style={{ color: 'rgba(255,200,150,0.9)', fontSize: 13 }}>Choisissez un dossier et commencez</p>
              </div>
            </div>

            <div style={{ maxWidth: 480, margin: '0 auto', padding: '14px 14px' }}>
              {/* Sélecteur */}
              <div style={{ display: 'flex', gap: 8, background: '#F3F4F6', borderRadius: 18, padding: 5, marginBottom: 16, boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.08)' }}>
                <button onClick={() => setActiveConcoursTab('direct')}
                  style={{ flex: 1, padding: '11px 8px', borderRadius: 14, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', background: activeConcoursTab === 'direct' ? 'linear-gradient(135deg,#C4521A,#D4A017)' : 'transparent', color: activeConcoursTab === 'direct' ? 'white' : '#6B7280', boxShadow: activeConcoursTab === 'direct' ? '0 3px 10px rgba(196,82,26,0.4)' : 'none', transition: 'all 0.25s' }}>
                  📚 Directs {directAccess || user.is_admin ? '✓' : ''}
                </button>
                <button onClick={() => setActiveConcoursTab('professionnel')}
                  style={{ flex: 1, padding: '11px 8px', borderRadius: 14, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', background: activeConcoursTab === 'professionnel' ? 'linear-gradient(135deg,#C4521A,#D4A017)' : 'transparent', color: activeConcoursTab === 'professionnel' ? 'white' : '#6B7280', boxShadow: activeConcoursTab === 'professionnel' ? '0 3px 10px rgba(196,82,26,0.4)' : 'none', transition: 'all 0.25s' }}>
                  🎓 Professionnels {proAccess || user.is_admin ? '✓' : ''}
                </button>
              </div>

              {/* Bannière accès */}
              {activeConcoursTab === 'direct' && !directAccess && !user.is_admin && (
                <div style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE4B5)', borderRadius: 16, padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid #D4A017' }}>
                  <span style={{ fontSize: 20 }}>🆓</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, color: '#7A6000', fontSize: 13 }}>5 questions gratuites par dossier</p>
                    <p style={{ color: '#957000', fontSize: 11 }}>Abonnez-vous pour tout débloquer</p>
                  </div>
                  <Link href={`/payment?type=direct&montant=${prices.direct}`} style={{ padding: '7px 12px', background: '#C4521A', color: 'white', borderRadius: 10, fontSize: 12, fontWeight: 800, textDecoration: 'none', flexShrink: 0 }}>
                    {prices.direct.toLocaleString()} FCFA
                  </Link>
                </div>
              )}
              {activeConcoursTab === 'professionnel' && !proAccess && !user.is_admin && (
                <div style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE4B5)', borderRadius: 16, padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid #D4A017' }}>
                  <span style={{ fontSize: 20 }}>🆓</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, color: '#7A6000', fontSize: 13 }}>5 questions gratuites par dossier</p>
                    <p style={{ color: '#957000', fontSize: 11 }}>Abonnez-vous pour tout débloquer</p>
                  </div>
                  <Link href={`/payment?type=professionnel&montant=${prices.professionnel}`} style={{ padding: '7px 12px', background: '#C4521A', color: 'white', borderRadius: 10, fontSize: 12, fontWeight: 800, textDecoration: 'none', flexShrink: 0 }}>
                    {prices.professionnel.toLocaleString()} FCFA
                  </Link>
                </div>
              )}

              {loadingData ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {[...Array(6)].map((_, i) => <div key={i} style={{ height: 140, background: '#f0f0f0', borderRadius: 18, animation: 'pulse 1.5s infinite' }} />)}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
                  {(activeConcoursTab === 'direct' ? categories.direct : categories.professionnel).map((cat, i) => (
                    <CategoryGridCard key={cat.id || i} cat={cat} index={i} catType={activeConcoursTab} hasAccess={activeConcoursTab === 'direct' ? (directAccess || user.is_admin) : (proAccess || user.is_admin)} />
                  ))}
                </div>
              )}

              {/* Démo */}
              <div style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE8A0)', borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid #D4A017' }}>
                <div style={{ width: 38, height: 38, background: '#D4A017', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, color: '#7A6000', fontSize: 13 }}>Démo gratuite disponible</p>
                  <p style={{ color: '#957000', fontSize: 11 }}>10 questions d&apos;entraînement</p>
                </div>
                <Link href="/demo" style={{ padding: '7px 12px', fontWeight: 700, color: 'white', borderRadius: 10, fontSize: 12, background: '#D4A017', textDecoration: 'none' }}>Essayer</Link>
              </div>
            </div>
          </div>
        )}

        {/* ===== ONGLET À PROPOS ===== */}
        {activeMainTab === 'apropos' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ background: 'linear-gradient(160deg,#8B2500,#C4521A)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 30px,rgba(255,255,255,0.02) 30px,rgba(255,255,255,0.02) 60px)' }} />
              <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 16px 24px', textAlign: 'center', position: 'relative' }}>
                <h2 style={{ color: 'white', fontWeight: 900, fontSize: 22, marginBottom: 6 }}>À propos</h2>
                <p style={{ color: 'rgba(255,200,150,0.9)', fontSize: 13 }}>Découvrez IFL, notre équipe et notre développeur</p>
              </div>
            </div>
            <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 14px' }}>
              <div style={{ display: 'flex', gap: 6, background: '#F3F4F6', borderRadius: 16, padding: 5, marginBottom: 20, boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.08)' }}>
                {[{ id: 'app', label: "L'application" }, { id: 'equipe', label: "Notre équipe" }, { id: 'dev', label: "Développeur" }].map(t => (
                  <button key={t.id} onClick={() => setActiveAboutTab(t.id)}
                    style={{ flex: 1, padding: '10px 4px', borderRadius: 12, fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer', background: activeAboutTab === t.id ? 'linear-gradient(135deg,#C4521A,#D4A017)' : 'transparent', color: activeAboutTab === t.id ? 'white' : '#6B7280', boxShadow: activeAboutTab === t.id ? '0 2px 8px rgba(196,82,26,0.3)' : 'none', transition: 'all 0.2s' }}>
                    {t.label}
                  </button>
                ))}
              </div>
              {activeAboutTab === 'app' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <div style={{ background: 'white', borderRadius: 24, padding: 24, marginBottom: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #FFE8D0' }}>
                    <div style={{ textAlign: 'center', marginBottom: 18 }}>
                      <div style={{ width: 80, height: 80, borderRadius: 22, overflow: 'hidden', margin: '0 auto 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}><img src="/logo.png" alt="IFL" style={{ width: 80, height: 80, objectFit: 'cover' }} /></div>
                      <h2 style={{ fontWeight: 900, fontSize: 18, color: '#8B2500' }}>Idéale Formation of Leaders</h2>
                    </div>
                    <p style={{ color: '#555', fontSize: 14, lineHeight: 1.7 }}>Application de préparation aux concours du Burkina Faso. Milliers de QCM, 12 dossiers directs + 17 professionnels, système de progression et explications détaillées.</p>
                  </div>
                </div>
              )}
              {activeAboutTab === 'equipe' && (
                <div style={{ background: 'white', borderRadius: 24, padding: 24, boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #FFE8D0', animation: 'fadeIn 0.3s ease' }}>
                  <h2 style={{ fontWeight: 900, fontSize: 18, color: '#8B2500', marginBottom: 14 }}>Notre équipe</h2>
                  <p style={{ color: '#555', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>Enseignants et professionnels passionnés, auteurs de documents et livres spécialisés pour les concours directs du Burkina Faso.</p>
                  <div style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE4B5)', borderRadius: 18, padding: 16, border: '2px solid #D4A017' }}>
                    <a href="tel:+22676223962" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, textDecoration: 'none' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: '#C4521A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ color: 'white' }}>{ICONS.phone}</span></div>
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#C4521A' }}>+226 76 22 39 62</span>
                    </a>
                    <a href="https://wa.me/22676223962" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#25D366' }}>WhatsApp : +226 76 22 39 62</span>
                    </a>
                  </div>
                </div>
              )}
              {activeAboutTab === 'dev' && (
                <div style={{ background: 'white', borderRadius: 24, padding: 24, boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #FFE8D0', animation: 'fadeIn 0.3s ease' }}>
                  <div style={{ textAlign: 'center', marginBottom: 18 }}>
                    <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg,#8B2500,#C4521A)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                    </div>
                    <h2 style={{ fontWeight: 900, fontSize: 20, color: '#8B2500' }}>Marc LOMPO</h2>
                    <span style={{ fontSize: 13, fontWeight: 700, padding: '4px 14px', borderRadius: 10, background: '#FFF0E8', color: '#C4521A' }}>Ingénieur Digital</span>
                  </div>
                  <p style={{ color: '#555', fontSize: 14, lineHeight: 1.7, marginBottom: 18 }}>Passionné par les technologies éducatives. Disponible pour tout projet ou partenariat.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <a href="tel:+22672662161" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', borderRadius: 16, background: '#FFF0E8', border: '1.5px solid #FFD0A0', textDecoration: 'none' }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: '#C4521A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: 'white' }}>{ICONS.phone}</span></div>
                      <div><p style={{ fontWeight: 700, fontSize: 12, color: '#8B2500' }}>Téléphone</p><p style={{ fontWeight: 900, fontSize: 15, color: '#C4521A' }}>+226 72 66 21 61</p></div>
                    </a>
                    <a href="https://wa.me/22672662161" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', borderRadius: 16, background: '#F0FFF4', border: '1.5px solid #A5D6A7', textDecoration: 'none' }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg></div>
                      <div><p style={{ fontWeight: 700, fontSize: 12, color: '#1B5E20' }}>WhatsApp</p><p style={{ fontWeight: 900, fontSize: 15, color: '#2E7D32' }}>+226 72 66 21 61</p></div>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== ONGLET PROFIL ===== */}
        {activeMainTab === 'profil' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {/* Header profil */}
            <div style={{ background: 'linear-gradient(160deg,#8B2500,#C4521A)', padding: '24px 16px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 30px,rgba(255,255,255,0.02) 30px,rgba(255,255,255,0.02) 60px)' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Avatar */}
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', border: '3px solid rgba(255,255,255,0.4)' }}>
                  <span style={{ fontSize: 36 }}>{user.is_admin ? '👑' : '👤'}</span>
                </div>
                <h2 style={{ color: 'white', fontWeight: 900, fontSize: 20, marginBottom: 4 }}>
                  {nom && prenom ? `${nom} ${prenom}` : displayName}
                </h2>
                <p style={{ color: 'rgba(255,200,150,0.9)', fontSize: 13, marginBottom: 8 }}>{user.phone}</p>
                <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '5px 16px', borderRadius: 20, backdropFilter: 'blur(4px)' }}>
                  <span style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>{abonnementLabel}</span>
                </div>
              </div>
            </div>

            <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 14px' }}>

              {/* Informations */}
              <div style={{ background: 'white', borderRadius: 20, padding: 20, marginBottom: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #FFE8D0' }}>
                <h3 style={{ fontWeight: 800, fontSize: 14, color: '#8B2500', marginBottom: 14 }}>📋 Mes informations</h3>
                {[
                  { label: 'Nom', value: nom || '—' },
                  { label: 'Prénom', value: prenom || '—' },
                  { label: 'Téléphone', value: user.phone || '—' },
                  { label: 'Rôle', value: user.is_admin ? 'Administrateur' : 'Utilisateur' },
                ].map((info, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 3 ? '1px solid #F5F0E8' : 'none' }}>
                    <span style={{ color: '#888', fontSize: 13 }}>{info.label}</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#333' }}>{info.value}</span>
                  </div>
                ))}
              </div>

              {/* Abonnement */}
              <div style={{ background: 'white', borderRadius: 20, padding: 20, marginBottom: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #FFE8D0' }}>
                <h3 style={{ fontWeight: 800, fontSize: 14, color: '#8B2500', marginBottom: 14 }}>💳 Mon abonnement</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: (directAccess || proAccess || user.is_admin) ? '#E8F5E9' : '#FFF8E0', borderRadius: 14, padding: '14px', border: `1.5px solid ${(directAccess || proAccess || user.is_admin) ? '#A5D6A7' : '#FFE8A0'}` }}>
                  <span style={{ fontSize: 28 }}>{(directAccess || proAccess || user.is_admin) ? '✅' : '⚡'}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 800, fontSize: 14, color: abonnementColor }}>{abonnementLabel}</p>
                    {!user.is_admin && user.abonnement_valide_jusqua && (
                      <p style={{ color: '#888', fontSize: 12, marginTop: 3 }}>Expire le: {new Date(user.abonnement_valide_jusqua).toLocaleDateString('fr-FR')}</p>
                    )}
                    {!directAccess && !proAccess && !user.is_admin && (
                      <p style={{ color: '#957000', fontSize: 12, marginTop: 3 }}>Abonnez-vous pour accéder aux QCM</p>
                    )}
                  </div>
                </div>
                {!directAccess && !proAccess && !user.is_admin && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                    <Link href="/payment?type=direct&montant=5000" style={{ padding: '12px 8px', textAlign: 'center', background: 'linear-gradient(135deg,#C4521A,#D4A017)', color: 'white', borderRadius: 14, fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>📚 5 000 FCFA</Link>
                    <Link href="/payment?type=professionnel&montant=20000" style={{ padding: '12px 8px', textAlign: 'center', background: 'linear-gradient(135deg,#D4A017,#F0C030)', color: 'white', borderRadius: 14, fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>🎓 20 000 FCFA</Link>
                  </div>
                )}
              </div>

              {/* Progression */}
              <div style={{ background: 'white', borderRadius: 20, padding: 20, marginBottom: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #FFE8D0' }}>
                <h3 style={{ fontWeight: 800, fontSize: 14, color: '#8B2500', marginBottom: 14 }}>📊 Ma progression</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ background: 'linear-gradient(135deg,#FFF0E8,#FFD8B0)', borderRadius: 16, padding: '14px 12px', textAlign: 'center' }}>
                    <p style={{ fontWeight: 900, fontSize: 22, color: '#C4521A' }}>{categories.direct.length}</p>
                    <p style={{ color: '#888', fontSize: 11, marginTop: 2 }}>Dossiers directs</p>
                    <p style={{ fontSize: 10, color: directAccess || user.is_admin ? '#2E7D32' : '#C4521A', fontWeight: 700, marginTop: 4 }}>{directAccess || user.is_admin ? '✓ Accès complet' : '🆓 5 Q./dossier'}</p>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg,#FFF8E0,#FFE8A0)', borderRadius: 16, padding: '14px 12px', textAlign: 'center' }}>
                    <p style={{ fontWeight: 900, fontSize: 22, color: '#D4A017' }}>{categories.professionnel.length}</p>
                    <p style={{ color: '#888', fontSize: 11, marginTop: 2 }}>Dossiers pro</p>
                    <p style={{ fontSize: 10, color: proAccess || user.is_admin ? '#2E7D32' : '#C4521A', fontWeight: 700, marginTop: 4 }}>{proAccess || user.is_admin ? '✓ Accès complet' : '🆓 5 Q./dossier'}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ background: 'white', borderRadius: 20, padding: 20, marginBottom: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #FFE8D0' }}>
                <h3 style={{ fontWeight: 800, fontSize: 14, color: '#8B2500', marginBottom: 14 }}>⚙️ Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                  {/* Partager */}
                  <button onClick={handleShare} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', borderRadius: 14, background: '#F8F9FA', border: '1.5px solid #E8ECEF', cursor: 'pointer', width: '100%' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#C4521A,#D4A017)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: 'white' }}>{ICONS.share}</span>
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#333' }}>Partager l&apos;application</p>
                      <p style={{ color: '#888', fontSize: 12 }}>Inviter des amis à utiliser IFL</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>

                  {/* Évaluer */}
                  <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', borderRadius: 14, background: '#F8F9FA', border: '1.5px solid #E8ECEF', textDecoration: 'none' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: '#FFF8E0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#D4A017' }}>{ICONS.star}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#333' }}>Évaluer l&apos;application</p>
                      <p style={{ color: '#888', fontSize: 12 }}>Laissez votre avis sur le Play Store</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </a>

                  {/* Aide */}
                  <Link href="/help" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', borderRadius: 14, background: '#F8F9FA', border: '1.5px solid #E8ECEF', textDecoration: 'none' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1565C0" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#333' }}>Centre d&apos;aide</p>
                      <p style={{ color: '#888', fontSize: 12 }}>FAQ et assistance</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </Link>

                  {/* Déconnexion */}
                  <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', borderRadius: 14, background: '#FFF5F5', border: '1.5px solid #FECACA', cursor: 'pointer', width: '100%' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#DC2626' }}>{ICONS.logout}</span>
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#DC2626' }}>Se déconnecter</p>
                      <p style={{ color: '#EF4444', fontSize: 12 }}>Quitter votre session</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
              </div>

              {/* Version */}
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <p style={{ color: '#bbb', fontSize: 11 }}>IFL v1.2.0 • © 2025 Burkina Faso</p>
              </div>
            </div>
          </div>
        )}

        {/* ===== BARRE NAV BAS ===== */}
        <BottomNav active={activeMainTab} onChange={setActiveMainTab} />

        {/* WhatsApp flottant */}
        <a href="https://wa.me/22676223962?text=Bonjour%20IFL%2C%20j'ai%20besoin%20d'aide"
          target="_blank" rel="noopener noreferrer"
          style={{ position: 'fixed', right: 16, bottom: 88, width: 52, height: 52, borderRadius: '50%', background: '#25D366', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(37,211,102,0.5)' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
        </a>

      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes pulse { 0%,100% { opacity: 0.5 } 50% { opacity: 1 } }
        @keyframes spin { to { transform: rotate(360deg) } }
        * { box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      `}</style>
    </>
  )
}
