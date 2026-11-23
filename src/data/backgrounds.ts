export interface BackgroundPreset {
  id: string;
  name: string;
  category: 'gradient' | 'dark' | 'neon' | 'pastel' | 'luxury' | 'photo';
  type: 'solid' | 'gradient' | 'image';
  color?: string;
  gradient?: {
    type: 'linear' | 'radial';
    angle: number;
    colors: string[];
  };
  image?: string;
  preview: string;
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  // ==========================
  // NEON & CYBERPUNK
  // ==========================
  {
    id: 'cyber-grid',
    name: 'Cyber Matrix 2099',
    category: 'neon',
    type: 'gradient',
    gradient: {
      type: 'linear',
      angle: 160,
      colors: ['#050505', '#1a0826', '#041c2c'],
    },
    preview: 'linear-gradient(160deg, #050505, #1a0826, #041c2c)',
  },
  {
    id: 'electric-violet',
    name: 'Electric Neon Violet',
    category: 'neon',
    type: 'gradient',
    gradient: {
      type: 'linear',
      angle: 135,
      colors: ['#3b0764', '#1e1b4b', '#0f172a'],
    },
    preview: 'linear-gradient(135deg, #3b0764, #1e1b4b, #0f172a)',
  },
  {
    id: 'tokyo-synthwave',
    name: 'Tokyo Synthwave',
    category: 'neon',
    type: 'gradient',
    gradient: {
      type: 'linear',
      angle: 145,
      colors: ['#2e0854', '#ff007b', '#00f0ff'],
    },
    preview: 'linear-gradient(145deg, #2e0854, #ff007b, #00f0ff)',
  },
  {
    id: 'acid-green-dark',
    name: 'Acid Lime Cyber',
    category: 'neon',
    type: 'gradient',
    gradient: {
      type: 'linear',
      angle: 135,
      colors: ['#022c22', '#064e3b', '#84cc16'],
    },
    preview: 'linear-gradient(135deg, #022c22, #064e3b, #84cc16)',
  },

  // ==========================
  // SUNSET & VIBRANT GRADIENTS
  // ==========================
  {
    id: 'sunset-vibes',
    name: 'Sunset Miami Beach',
    category: 'gradient',
    type: 'gradient',
    gradient: {
      type: 'linear',
      angle: 45,
      colors: ['#f43f5e', '#fb923c', '#facc15'],
    },
    preview: 'linear-gradient(45deg, #f43f5e, #fb923c, #facc15)',
  },
  {
    id: 'aurora-borealis',
    name: 'Aurora Boreale Magica',
    category: 'gradient',
    type: 'gradient',
    gradient: {
      type: 'linear',
      angle: 120,
      colors: ['#042f2e', '#065f46', '#0284c7', '#4f46e5'],
    },
    preview: 'linear-gradient(120deg, #042f2e, #065f46, #0284c7, #4f46e5)',
  },
  {
    id: 'berry-smoothie',
    name: 'Berry Magenta Pop',
    category: 'gradient',
    type: 'gradient',
    gradient: {
      type: 'linear',
      angle: 135,
      colors: ['#831843', '#be185d', '#ec4899'],
    },
    preview: 'linear-gradient(135deg, #831843, #be185d, #ec4899)',
  },
  {
    id: 'ocean-deep',
    name: 'Oceano Abissale',
    category: 'gradient',
    type: 'gradient',
    gradient: {
      type: 'linear',
      angle: 180,
      colors: ['#082f49', '#0369a1', '#38bdf8'],
    },
    preview: 'linear-gradient(180deg, #082f49, #0369a1, #38bdf8)',
  },
  {
    id: 'cotton-candy',
    name: 'Zucchero Filato',
    category: 'gradient',
    type: 'gradient',
    gradient: {
      type: 'linear',
      angle: 60,
      colors: ['#f472b6', '#c084fc', '#60a5fa'],
    },
    preview: 'linear-gradient(60deg, #f472b6, #c084fc, #60a5fa)',
  },

  // ==========================
  // DARK & SLEEK MONOCHROME
  // ==========================
  {
    id: 'deep-midnight',
    name: 'Deep Midnight Space',
    category: 'dark',
    type: 'gradient',
    gradient: {
      type: 'linear',
      angle: 135,
      colors: ['#0f0c1b', '#1a0b2e', '#090a0f'],
    },
    preview: 'linear-gradient(135deg, #0f0c1b, #1a0b2e, #090a0f)',
  },
  {
    id: 'pure-black',
    name: 'Onyx Studio Black',
    category: 'dark',
    type: 'solid',
    color: '#09090b',
    preview: '#09090b',
  },
  {
    id: 'graphite-dark',
    name: 'Grafite & Carbone',
    category: 'dark',
    type: 'gradient',
    gradient: {
      type: 'linear',
      angle: 180,
      colors: ['#27272a', '#18181b', '#09090b'],
    },
    preview: 'linear-gradient(180deg, #27272a, #18181b, #09090b)',
  },

  // ==========================
  // LUXURY & EDITORIAL
  // ==========================
  {
    id: 'royal-gold',
    name: 'Dark Noir & Oro VIP',
    category: 'luxury',
    type: 'gradient',
    gradient: {
      type: 'radial',
      angle: 0,
      colors: ['#292524', '#1c1917', '#0c0a09'],
    },
    preview: 'radial-gradient(circle, #292524, #1c1917, #0c0a09)',
  },
  {
    id: 'emerald-luxury',
    name: 'Smeraldo Imperiale',
    category: 'luxury',
    type: 'gradient',
    gradient: {
      type: 'linear',
      angle: 150,
      colors: ['#064e3b', '#022c22', '#011910'],
    },
    preview: 'linear-gradient(150deg, #064e3b, #022c22, #011910)',
  },
  {
    id: 'burgundy-velvet',
    name: 'Velluto Bordeaux',
    category: 'luxury',
    type: 'gradient',
    gradient: {
      type: 'linear',
      angle: 135,
      colors: ['#4c0519', '#2a020d', '#0f0206'],
    },
    preview: 'linear-gradient(135deg, #4c0519, #2a020d, #0f0206)',
  },

  // ==========================
  // PASTEL & AESTHETIC LIGHT
  // ==========================
  {
    id: 'cloud-pastel',
    name: 'Pastel Aesthetic Cloud',
    category: 'pastel',
    type: 'gradient',
    gradient: {
      type: 'linear',
      angle: 135,
      colors: ['#e0e7ff', '#fce7f3', '#fed7aa'],
    },
    preview: 'linear-gradient(135deg, #e0e7ff, #fce7f3, #fed7aa)',
  },
  {
    id: 'mint-fresh',
    name: 'Menta & Eucalipto',
    category: 'pastel',
    type: 'gradient',
    gradient: {
      type: 'linear',
      angle: 180,
      colors: ['#ccfbf1', '#e0f2fe', '#f3e8ff'],
    },
    preview: 'linear-gradient(180deg, #ccfbf1, #e0f2fe, #f3e8ff)',
  },
  {
    id: 'minimal-warm',
    name: 'Avorio & Beige Chic',
    category: 'pastel',
    type: 'gradient',
    gradient: {
      type: 'linear',
      angle: 45,
      colors: ['#fafaf9', '#f5f5f4', '#e7e5e4'],
    },
    preview: 'linear-gradient(45deg, #fafaf9, #f5f5f4, #e7e5e4)',
  },
  {
    id: 'pure-white',
    name: 'Bianco Puro Studio',
    category: 'pastel',
    type: 'solid',
    color: '#ffffff',
    preview: '#ffffff',
  },

  // ==========================
  // TEXTURES & PHOTO BACKGROUNDS
  // ==========================
  {
    id: 'texture-marble',
    name: 'Marmo Nero Luxury',
    category: 'photo',
    type: 'image',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    preview: 'url(https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=60)',
  },
  {
    id: 'texture-neon-city',
    name: 'Luci Notturne Bokeh',
    category: 'photo',
    type: 'image',
    image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80',
    preview: 'url(https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=300&q=60)',
  },
  {
    id: 'texture-abstract-mesh',
    name: 'Mesh Olografica 3D',
    category: 'photo',
    type: 'image',
    image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
    preview: 'url(https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=300&q=60)',
  },
  {
    id: 'texture-paper',
    name: 'Carta Artistica Ruvida',
    category: 'photo',
    type: 'image',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80',
    preview: 'url(https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=300&q=60)',
  },
];
