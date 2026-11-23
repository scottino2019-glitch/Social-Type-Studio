import { AnimationConfig, AnimationType } from '../types';

export const ANIMATIONS_LIST: AnimationConfig[] = [
  {
    id: 'none',
    name: 'Statico (Nessuna)',
    description: 'Testo fisso senza movimento',
    duration: 0,
    iterationCount: '1',
    speed: 'normal',
    keyframesCss: '',
    animationRule: () => 'none',
  },
  {
    id: 'neon-pulse',
    name: 'Neon Pulsante Glow',
    description: 'Bagliore luminoso pulsante ad alta intensità per storie notturne',
    duration: 1.8,
    iterationCount: 'infinite',
    speed: 'normal',
    keyframesCss: `
      @keyframes anim-neon-pulse {
        0%, 100% {
          filter: drop-shadow(0 0 4px currentColor) drop-shadow(0 0 12px currentColor);
          opacity: 1;
        }
        50% {
          filter: drop-shadow(0 0 18px currentColor) drop-shadow(0 0 36px currentColor) drop-shadow(0 0 54px currentColor);
          opacity: 0.94;
        }
      }
    `,
    animationRule: (d, iter) => `anim-neon-pulse ${d}s ease-in-out ${iter}`,
  },
  {
    id: 'floating',
    name: 'Fluttuante Cosmico',
    description: 'Movimento fluttuante morbido nello spazio con leggera oscillazione',
    duration: 3,
    iterationCount: 'infinite',
    speed: 'normal',
    keyframesCss: `
      @keyframes anim-floating {
        0%, 100% {
          transform: translateY(0px) rotate(0deg);
        }
        50% {
          transform: translateY(-16px) rotate(-1.5deg);
        }
      }
    `,
    animationRule: (d, iter) => `anim-floating ${d}s ease-in-out ${iter}`,
  },
  {
    id: 'glitch',
    name: 'Glitch Cyberpunk 2077',
    description: 'Distorsione digitale e scatto RGB futuristico stile Tokyo',
    duration: 2.2,
    iterationCount: 'infinite',
    speed: 'fast',
    keyframesCss: `
      @keyframes anim-glitch {
        0%, 85%, 100% {
          transform: translate(0, 0) skew(0deg);
          filter: none;
        }
        87% {
          transform: translate(-4px, 2px) skew(-3deg);
          filter: drop-shadow(-3px 0 #00f0ff) drop-shadow(3px 0 #ff007b);
        }
        90% {
          transform: translate(4px, -2px) skew(3deg);
          filter: drop-shadow(3px 0 #00f0ff) drop-shadow(-3px 0 #ff007b);
        }
        93% {
          transform: translate(-2px, -1px) skew(-1deg);
          filter: drop-shadow(-2px 0 #00f0ff);
        }
        96% {
          transform: translate(1px, 2px) skew(1deg);
          filter: none;
        }
      }
    `,
    animationRule: (d, iter) => `anim-glitch ${d}s infinite ease-in-out`,
  },
  {
    id: 'bounce-pop',
    name: 'Pop & Rimbalzo Elastico',
    description: 'Effetto elastico dinamico ed energico per promo virali',
    duration: 1.6,
    iterationCount: 'infinite',
    speed: 'normal',
    keyframesCss: `
      @keyframes anim-bounce-pop {
        0%, 100% {
          transform: scale(1);
        }
        30% {
          transform: scale(1.08, 0.94);
        }
        50% {
          transform: scale(0.96, 1.06);
        }
        70% {
          transform: scale(1.02, 0.98);
        }
      }
    `,
    animationRule: (d, iter) => `anim-bounce-pop ${d}s cubic-bezier(0.28, 0.84, 0.42, 1) ${iter}`,
  },
  {
    id: 'rainbow-wave',
    name: 'Arcobaleno Cromatico',
    description: 'Rotazione continua dello spettro dei colori RGB',
    duration: 4,
    iterationCount: 'infinite',
    speed: 'slow',
    keyframesCss: `
      @keyframes anim-rainbow-wave {
        0% {
          filter: hue-rotate(0deg);
        }
        100% {
          filter: hue-rotate(360deg);
        }
      }
    `,
    animationRule: (d, iter) => `anim-rainbow-wave ${d}s linear ${iter}`,
  },
  {
    id: 'shimmer',
    name: 'Riflesso Metallico Oro/Argento',
    description: 'Fascio di luce che scorre sulla superficie delle lettere',
    duration: 2.5,
    iterationCount: 'infinite',
    speed: 'normal',
    keyframesCss: `
      @keyframes anim-shimmer {
        0% {
          filter: brightness(1) drop-shadow(0 0 2px rgba(255,255,255,0.2));
        }
        50% {
          filter: brightness(1.35) drop-shadow(0 0 12px rgba(255,255,255,0.8));
        }
        100% {
          filter: brightness(1) drop-shadow(0 0 2px rgba(255,255,255,0.2));
        }
      }
    `,
    animationRule: (d, iter) => `anim-shimmer ${d}s ease-in-out ${iter}`,
  },
  {
    id: 'heartbeat',
    name: 'Battito Cardiaco / Pulse',
    description: 'Pulsazione ritmica a doppio battito per richiamare attenzione',
    duration: 1.2,
    iterationCount: 'infinite',
    speed: 'fast',
    keyframesCss: `
      @keyframes anim-heartbeat {
        0%, 100% {
          transform: scale(1);
        }
        14% {
          transform: scale(1.12);
        }
        28% {
          transform: scale(1);
        }
        42% {
          transform: scale(1.16);
        }
        70% {
          transform: scale(1);
        }
      }
    `,
    animationRule: (d, iter) => `anim-heartbeat ${d}s ease-in-out ${iter}`,
  },
  {
    id: 'wobble',
    name: 'Onda Streetwear',
    description: 'Torsione ritmica e giocosa tipica dei trend TikTok',
    duration: 2,
    iterationCount: 'infinite',
    speed: 'normal',
    keyframesCss: `
      @keyframes anim-wobble {
        0%, 100% {
          transform: rotate(0deg);
        }
        20% {
          transform: rotate(-6deg);
        }
        40% {
          transform: rotate(6deg);
        }
        60% {
          transform: rotate(-3deg);
        }
        80% {
          transform: rotate(3deg);
        }
      }
    `,
    animationRule: (d, iter) => `anim-wobble ${d}s ease-in-out ${iter}`,
  },
  {
    id: 'flip-3d',
    name: 'Rotazione 3D Prospettica',
    description: 'Oscillazione prospettica tridimensionale',
    duration: 3.5,
    iterationCount: 'infinite',
    speed: 'slow',
    keyframesCss: `
      @keyframes anim-flip-3d {
        0%, 100% {
          transform: perspective(600px) rotateY(0deg) rotateX(0deg);
        }
        25% {
          transform: perspective(600px) rotateY(14deg) rotateX(-6deg);
        }
        75% {
          transform: perspective(600px) rotateY(-14deg) rotateX(6deg);
        }
      }
    `,
    animationRule: (d, iter) => `anim-flip-3d ${d}s ease-in-out ${iter}`,
  },
  {
    id: 'slide-up',
    name: 'Fade & Salita Morbida',
    description: 'Elegante comparsa dal basso con dissolvenza continua',
    duration: 2.2,
    iterationCount: 'infinite',
    speed: 'normal',
    keyframesCss: `
      @keyframes anim-slide-up {
        0% {
          opacity: 0.4;
          transform: translateY(12px);
        }
        50% {
          opacity: 1;
          transform: translateY(0);
        }
        100% {
          opacity: 0.4;
          transform: translateY(-12px);
        }
      }
    `,
    animationRule: (d, iter) => `anim-slide-up ${d}s ease-in-out ${iter}`,
  },
  {
    id: 'typewriter',
    name: 'Scatto Ritmo Typewriter',
    description: 'Cadenza e scatto a tempo per titoli d’impatto',
    duration: 1.5,
    iterationCount: 'infinite',
    speed: 'normal',
    keyframesCss: `
      @keyframes anim-typewriter {
        0%, 100% {
          letter-spacing: normal;
          opacity: 1;
        }
        50% {
          letter-spacing: 4px;
          opacity: 0.88;
        }
      }
    `,
    animationRule: (d, iter) => `anim-typewriter ${d}s ease-in-out ${iter}`,
  },
];

export function getAllAnimationsCss(): string {
  return ANIMATIONS_LIST.map((a) => a.keyframesCss).join('\n');
}

export function getAnimationCssRule(type: AnimationType, duration?: number, iteration?: 'infinite' | '1'): string {
  const anim = ANIMATIONS_LIST.find((a) => a.id === type);
  if (!anim || anim.id === 'none') return 'none';
  const d = duration ?? anim.duration;
  const iter = iteration ?? anim.iterationCount;
  return anim.animationRule(d, iter);
}
