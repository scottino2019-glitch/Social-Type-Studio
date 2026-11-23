export interface GraphicSticker {
  id: string;
  name: string;
  category: 'neon' | 'badge' | 'emoji' | 'sparkle' | 'arrows' | 'retro';
  svg: string;
  previewColor?: string;
}

export const GRAPHIC_STICKERS: GraphicSticker[] = [
  // Neon & Glow
  {
    id: 'neon-star-4',
    name: 'Stella Neon 4 Punte',
    category: 'neon',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 0L58 42L100 50L58 58L50 100L42 58L0 50L42 42L50 0Z" fill="#38bdf8" filter="drop-shadow(0 0 8px #38bdf8)"/>
    </svg>`,
  },
  {
    id: 'neon-lightning',
    name: 'Fulmine Cyber',
    category: 'neon',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M55 5L20 55H45L35 95L80 40H50L65 5H55Z" fill="#facc15" filter="drop-shadow(0 0 10px #facc15)"/>
    </svg>`,
  },
  {
    id: 'neon-heart',
    name: 'Cuore Neon',
    category: 'neon',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 85C50 85 15 60 15 35C15 20 28 10 40 15C46 17 50 25 50 25C50 25 54 17 60 15C72 10 85 20 85 35C85 60 50 85 50 85Z" fill="#f43f5e" filter="drop-shadow(0 0 10px #f43f5e)"/>
    </svg>`,
  },
  {
    id: 'neon-flame',
    name: 'Fiamma Viral',
    category: 'neon',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 5C50 25 75 40 75 65C75 82 62 95 45 95C25 95 15 80 15 60C15 40 30 25 35 15C35 25 40 35 45 35C45 25 48 15 50 5Z" fill="#fb923c" filter="drop-shadow(0 0 10px #fb923c)"/>
    </svg>`,
  },

  // Social & Badges
  {
    id: 'badge-verified',
    name: 'Spunta Verificata',
    category: 'badge',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 5L61 14L76 13L81 27L93 34L90 49L97 61L88 72L88 87L73 89L64 100L50 93L36 100L27 89L12 87L12 72L3 61L10 49L7 34L19 27L24 13L39 14L50 5Z" fill="#0284c7"/>
      <path d="M32 50L44 62L68 38" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'badge-sale-hot',
    name: 'Badge Sale / Offerta',
    category: 'badge',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="44" fill="#e11d48" stroke="#ffffff" stroke-width="4"/>
      <text x="50" y="56" fill="white" font-size="18" font-weight="900" font-family="sans-serif" text-anchor="middle">HOT</text>
    </svg>`,
  },
  {
    id: 'badge-new',
    name: 'Badge NEW!',
    category: 'badge',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="24" width="84" height="52" rx="26" fill="#8b5cf6" stroke="#ffffff" stroke-width="3"/>
      <text x="50" y="58" fill="white" font-size="22" font-weight="900" font-family="sans-serif" text-anchor="middle">NEW</text>
    </svg>`,
  },
  {
    id: 'badge-crown',
    name: 'Corona Gold VIP',
    category: 'badge',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 75L20 25L40 55L50 20L60 55L80 25L90 75H10Z" fill="#eab308" stroke="#ca8a04" stroke-width="3"/>
      <circle cx="20" cy="22" r="5" fill="#fef08a"/>
      <circle cx="50" cy="17" r="6" fill="#fef08a"/>
      <circle cx="80" cy="22" r="5" fill="#fef08a"/>
    </svg>`,
  },

  // Sparkles & Aesthetics
  {
    id: 'sparkle-cluster',
    name: 'Luccichii Sparkle',
    category: 'sparkle',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M35 10L38 25L53 28L38 31L35 46L32 31L17 28L32 25L35 10Z" fill="#f472b6"/>
      <path d="M70 45L72 57L84 59L72 61L70 73L68 61L56 59L68 57L70 45Z" fill="#38bdf8"/>
      <path d="M40 68L41 76L49 77L41 78L40 86L39 78L31 77L39 76L40 68Z" fill="#facc15"/>
    </svg>`,
  },
  {
    id: 'sparkle-ring',
    name: 'Aura Stellare',
    category: 'sparkle',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="40" stroke="#c084fc" stroke-width="3" stroke-dasharray="6 8"/>
      <path d="M50 15L53 27L65 30L53 33L50 45L47 33L35 30L47 27L50 15Z" fill="#f43f5e"/>
    </svg>`,
  },

  // Arrows & Guides
  {
    id: 'arrow-neon-curved',
    name: 'Freccia Curva',
    category: 'arrows',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 75C30 30 65 25 80 40M80 40L65 35M80 40L75 55" stroke="#ec4899" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" filter="drop-shadow(0 0 6px #ec4899)"/>
    </svg>`,
  },
  {
    id: 'arrow-swipe-up',
    name: 'Swipe Up / Scopri',
    category: 'arrows',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 65L50 40L75 65" stroke="#38bdf8" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M25 45L50 20L75 45" stroke="#38bdf8" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
    </svg>`,
  },

  // Retro & Shapes
  {
    id: 'retro-smiley',
    name: 'Smiley Retro Acid',
    category: 'retro',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="42" fill="#facc15" stroke="#000000" stroke-width="5"/>
      <ellipse cx="35" cy="40" rx="5" ry="8" fill="#000000"/>
      <ellipse cx="65" cy="40" rx="5" ry="8" fill="#000000"/>
      <path d="M30 62C38 74 62 74 70 62" stroke="#000000" stroke-width="6" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'retro-sunburst',
    name: 'Raggi Sunburst 70s',
    category: 'retro',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="20" fill="#f97316"/>
      <path d="M50 5V22M50 78V95M5 50H22M78 50H95M18 18L30 30M70 70L82 82M82 18L70 30M30 70L18 82" stroke="#f97316" stroke-width="6" stroke-linecap="round"/>
    </svg>`,
  },
];

export function svgToDataUrl(svgString: string): string {
  const encoded = encodeURIComponent(svgString);
  return `data:image/svg+xml;utf8,${encoded}`;
}
