export type SocialFormat = 'story' | 'square' | 'portrait' | 'landscape' | 'twitter' | 'custom';

export interface FormatConfig {
  id: SocialFormat;
  name: string;
  platform: 'Instagram' | 'TikTok' | 'Facebook' | 'Twitter/X' | 'YouTube' | 'Custom';
  ratio: string;
  width: number;
  height: number;
  icon: string;
  safeZoneGuide?: boolean;
}

export type FontCategory = 'calligraphy' | 'neon' | 'retro' | 'serif' | 'display' | 'minimal';

export interface FontDefinition {
  name: string;
  family: string;
  category: FontCategory;
  googleFont: string; // URL param or family name
  weights: number[];
  italic?: boolean;
  previewText?: string;
  popular?: boolean;
}

export type AnimationType =
  | 'none'
  | 'neon-pulse'
  | 'typewriter'
  | 'floating'
  | 'glitch'
  | 'rainbow-wave'
  | 'bounce-pop'
  | 'shimmer'
  | 'flip-3d'
  | 'heartbeat'
  | 'wobble'
  | 'slide-up';

export interface AnimationConfig {
  id: AnimationType;
  name: string;
  description: string;
  duration: number; // in seconds
  iterationCount: 'infinite' | '1';
  speed: 'slow' | 'normal' | 'fast';
  keyframesCss: string;
  animationRule: (duration: number, iteration: string) => string;
}

export interface TextGradient {
  enabled: boolean;
  type: 'linear' | 'radial';
  angle: number; // degrees
  stops: { color: string; offset: number }[];
}

export interface TextStroke {
  enabled: boolean;
  color: string;
  width: number; // in px
}

export interface TextShadow {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
  preset?: 'neon' | 'retro3d' | 'soft' | 'glow' | 'hard' | 'custom';
}

export interface CanvasTextElement {
  type: 'text';
  id: string;
  text: string;
  fontFamily: string;
  fontSize: number; // base font size in px
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textAlign: 'left' | 'center' | 'right';
  letterSpacing: number; // in px
  lineHeight: number; // multiplier e.g. 1.2
  color: string;
  gradient: TextGradient;
  stroke: TextStroke;
  shadow: TextShadow;
  curved?: {
    enabled: boolean;
    radius: number;
    reverse: boolean;
  };
  animation: {
    type: AnimationType;
    duration: number;
    delay: number;
    iterationCount: 'infinite' | '1';
  };
  backgroundColor?: string;
  backgroundPadding?: number;
  borderRadius?: number;
  opacity: number;
  x: number; // in canvas px
  y: number; // in canvas px
  width: number;
  height: number;
  rotation: number; // degrees
  zIndex: number;
  locked?: boolean;
  hidden?: boolean;
}

export interface CanvasImageElement {
  type: 'image';
  id: string;
  name: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
  opacity: number;
  borderRadius: number;
  aspectRatio: number;
  flipX: boolean;
  flipY: boolean;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';
  filter: {
    brightness: number; // 0-200%
    contrast: number; // 0-200%
    blur: number; // 0-20px
    saturate: number; // 0-200%
  };
  zIndex: number;
  locked?: boolean;
  hidden?: boolean;
}

export type CanvasElement = CanvasTextElement | CanvasImageElement;

export interface CanvasBackground {
  type: 'solid' | 'gradient' | 'image' | 'video' | 'transparent';
  color: string;
  gradient: {
    type: 'linear' | 'radial';
    angle: number;
    colors: string[];
  };
  image?: string;
  coverImage?: string;
  coverDuration?: number;
  coverMode?: 'intro' | 'framed' | 'poster';
  video?: string;
  videoMuted?: boolean;
  videoLoop?: boolean;
  imageFit: 'cover' | 'contain' | 'tile';
  overlayColor: string;
  overlayOpacity: number;
  blur: number;
}

export interface StylePreset {
  id: string;
  name: string;
  category: string;
  description: string;
  badge?: string;
  textConfig: Partial<CanvasTextElement>;
  backgroundConfig: CanvasBackground;
  previewText?: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  category: 'Instagram Story' | 'TikTok Reel' | 'Post Square' | 'Cover / Banner';
  format: SocialFormat;
  elements: CanvasElement[];
  background: CanvasBackground;
  thumbnailGradient?: string;
}
