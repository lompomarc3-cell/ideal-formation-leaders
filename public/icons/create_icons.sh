#!/bin/bash
ICONS_DIR="/home/user/ideal-formation-leaders/public/icons"

# ===== ONGLETS DE NAVIGATION =====

# 1. Accueil - Maison moderne multicolore
cat > "$ICONS_DIR/nav_home.svg" << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="hg1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B35;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#F7C59F;stop-opacity:1"/>
    </linearGradient>
    <linearGradient id="hg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#E84393;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#FF6B9D;stop-opacity:1"/>
    </linearGradient>
  </defs>
  <polygon points="32,6 4,30 10,30 10,58 26,58 26,40 38,40 38,58 54,58 54,30 60,30" fill="url(#hg1)"/>
  <polygon points="32,6 4,30 10,30 10,36 32,16 54,36 54,30 60,30" fill="url(#hg2)" opacity="0.7"/>
  <rect x="26" y="40" width="12" height="18" rx="2" fill="#7B2D8B"/>
  <rect x="39" y="34" width="12" height="8" rx="1" fill="#FFF" opacity="0.4"/>
  <rect x="13" y="34" width="12" height="8" rx="1" fill="#FFF" opacity="0.4"/>
</svg>
EOF

# 2. Concours - Trophée doré multicolore
cat > "$ICONS_DIR/nav_concours.svg" << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="tg1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFD700"/>
      <stop offset="50%" style="stop-color:#FFA500"/>
      <stop offset="100%" style="stop-color:#FF6B35"/>
    </linearGradient>
    <linearGradient id="tg2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#FFF176"/>
      <stop offset="100%" style="stop-color:#FFD700"/>
    </linearGradient>
  </defs>
  <path d="M20,8 L44,8 L44,36 C44,46 32,52 32,52 C32,52 20,46 20,36 Z" fill="url(#tg1)"/>
  <path d="M8,10 L20,10 L20,30 C15,28 10,22 8,16 Z" fill="#FFB300"/>
  <path d="M56,10 L44,10 L44,30 C49,28 54,22 56,16 Z" fill="#FFB300"/>
  <rect x="26" y="52" width="12" height="6" rx="2" fill="#8B6914"/>
  <rect x="20" y="56" width="24" height="4" rx="2" fill="#6D4C41"/>
  <polygon points="32,18 34,24 40,24 35,28 37,34 32,30 27,34 29,28 24,24 30,24" fill="#FFF176" opacity="0.9"/>
</svg>
EOF

# 3. Profil - Personne moderne colorée
cat > "$ICONS_DIR/nav_profil.svg" << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="pg1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667EEA"/>
      <stop offset="100%" style="stop-color:#764BA2"/>
    </linearGradient>
    <linearGradient id="pg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#11998E"/>
      <stop offset="100%" style="stop-color:#38EF7D"/>
    </linearGradient>
  </defs>
  <circle cx="32" cy="20" r="14" fill="url(#pg1)"/>
  <circle cx="32" cy="18" r="10" fill="#FFC107" opacity="0.9"/>
  <ellipse cx="32" cy="16" rx="7" ry="8" fill="#FFCC80"/>
  <ellipse cx="29" cy="14" rx="1.5" ry="2" fill="#5D4037"/>
  <ellipse cx="35" cy="14" rx="1.5" ry="2" fill="#5D4037"/>
  <path d="M10,58 C10,44 20,36 32,36 C44,36 54,44 54,58" fill="url(#pg2)"/>
  <ellipse cx="32" cy="36" rx="10" ry="5" fill="#FFCC80"/>
</svg>
EOF

# 4. À propos - Ampoule info colorée
cat > "$ICONS_DIR/nav_apropos.svg" << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="ig1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4FACFE"/>
      <stop offset="100%" style="stop-color:#00F2FE"/>
    </linearGradient>
    <linearGradient id="ig2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#43E97B"/>
      <stop offset="100%" style="stop-color:#38F9D7"/>
    </linearGradient>
  </defs>
  <circle cx="32" cy="32" r="28" fill="url(#ig1)" opacity="0.15"/>
  <circle cx="32" cy="20" r="8" fill="url(#ig1)"/>
  <rect x="29" y="28" width="6" height="18" rx="3" fill="url(#ig2)"/>
  <rect x="26" y="44" width="12" height="4" rx="2" fill="url(#ig1)"/>
  <circle cx="32" cy="20" r="3" fill="white" opacity="0.9"/>
  <circle cx="30" cy="18" r="1.5" fill="white"/>
</svg>
EOF

echo "Onglets de navigation créés !"
