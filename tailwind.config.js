/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Thème clair premium (inspiration Crextio / KPI dashboard)
        canvas: '#EFEDE6', // fond de page, beige chaud
        surface: '#FFFFFF', // cartes
        surface2: '#F7F5F0', // panneaux subtils
        line: '#E9E6DD', // bordures
        // Texte (échelle d'encre chaude)
        ink: {
          DEFAULT: '#17150F',
          700: '#3B382F',
          500: '#6C685E',
          400: '#6E6A5F',
        },
        // Accent de marque Atlas
        amber: {
          DEFAULT: '#EF9F27', // remplissages / accents larges (≥ 3:1 sur clair)
          soft: '#F6BC5B',
          // `deep` = amber d'ENCRE : assombri pour AA en petit texte sur fond clair
          // (#C97E12 → #8F5810 = 5.02:1 sur canvas, 5.88:1 sur blanc) et blanc AA
          // en remplissage (`bg-amber-deep text-white` → 5.9:1).
          deep: '#8F5810',
          glow: 'rgba(239, 159, 39, 0.14)',
        },
        highlight: '#F4D03F', // jaune vif pour pastilles clés
        // Carte sombre d'emphase (1 par écran max, façon "Attendance Report")
        night: {
          DEFAULT: '#16140F',
          800: '#211E17',
          700: '#2C2820',
        },
        // États sémantiques — assombris pour AA en PETIT TEXTE sur tuiles teintées
        // (`text-* ` sur `bg-*/10-15`). Mesuré ≥ 4.5:1 sur blanc/canvas/surface2 ;
        // les remplissages `bg-*/10` restent des teintes pâles inchangées à l'œil.
        ok: '#0F7048', // 5.46:1 tuile/blanc · 4.72:1 tuile/canvas (ex #1B9E6B → 3.4)
        warn: '#8A5A0F', // 5.32:1 · 4.60:1 (ex #D9921A → 2.3)
        danger: '#B0362A', // 5.40:1 · 4.67:1 (ex #D6483B → 3.8)
        info: '#2266A0', // 5.39:1 · 4.62:1 (ex #3B82C4 → 3.6)
        purple: '#7B46A0', // négociation / statuts intermédiaires (DS §1.3.5) — assombri AA

      },
      fontFamily: {
        logo: ['"Grand Hotel"', 'cursive'],
        sans: ['Dosis', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      // Rayons normalisés (doc transverse §3) : champs 6px, cartes 8px, modales 12px.
      borderRadius: {
        md: '6px',
        lg: '8px',
        xl: '6px', // champs / boutons
        '2xl': '8px', // cartes
        '3xl': '12px', // modales
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,18,15,0.04), 0 14px 34px -20px rgba(20,18,15,0.22)',
        float: '0 30px 70px -28px rgba(20,18,15,0.30)',
        glow: '0 0 0 1px rgba(239,159,39,0.30), 0 10px 36px -10px rgba(239,159,39,0.38)',
        inset: 'inset 0 1px 0 0 rgba(255,255,255,0.6)',
      },
      backgroundImage: {
        grain:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.02'/%3E%3C/svg%3E\")",
        'canvas-glow':
          'radial-gradient(120% 90% at 100% 0%, rgba(244,208,63,0.25) 0%, rgba(239,159,39,0) 45%), radial-gradient(80% 70% at 0% 100%, rgba(239,159,39,0.10) 0%, rgba(239,159,39,0) 50%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.85)', opacity: '0.6' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'pulse-ring': 'pulse-ring 2.4s ease-out infinite',
        shimmer: 'shimmer 2s infinite',
        'spin-slow': 'spin-slow 16s linear infinite',
      },
    },
  },
  plugins: [],
};
