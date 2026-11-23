import { toPng, toJpeg, toSvg, toBlob } from 'html-to-image';
import confetti from 'canvas-confetti';
import { CanvasBackground, CanvasElement, CanvasTextElement, CanvasImageElement, FormatConfig } from '../types';
import { getAllAnimationsCss, getAnimationCssRule } from '../data/animations';
import { FONTS_LIST } from '../data/fonts';

// Global cache for Base64 embedded font rules
const base64FontCache = new Map<string, string>();

// Trigger celebratory confetti on export
export function triggerExportConfetti(): void {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#38bdf8', '#f43f5e', '#a855f7', '#fbbf24', '#10b981'],
    });
  } catch {
    // Ignore if not supported
  }
}

// Download blob/dataUrl helper
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Convert an ArrayBuffer or Blob to a Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Extract clean Google Font query from a font-family string
export function getGoogleFontQueryFromFamily(fontFamily: string): string {
  if (!fontFamily) return '';
  const primaryName = fontFamily.split(',')[0].replace(/['"]/g, '').trim();
  const match = FONTS_LIST.find(
    (f) =>
      f.name.toLowerCase() === primaryName.toLowerCase() ||
      f.family.toLowerCase().includes(primaryName.toLowerCase()) ||
      fontFamily.toLowerCase().includes(f.name.toLowerCase())
  );

  if (match && match.googleFont) {
    return match.googleFont;
  }

  const genericFamilies = ['sans-serif', 'serif', 'cursive', 'monospace', 'system-ui', 'arial', 'helvetica'];
  if (primaryName && !genericFamilies.includes(primaryName.toLowerCase())) {
    return `${primaryName.replace(/\s+/g, '+')}:wght@400;600;700;800;900`;
  }
  return '';
}

// Fetch Google Font CSS and convert all remote .woff2 files into Base64 data URLs
export async function getBase64FontCssForElements(elements: CanvasElement[]): Promise<string> {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return '';

  const uniqueQueries = new Set<string>();
  elements.forEach((el) => {
    if (el.type === 'text' && el.fontFamily) {
      const q = getGoogleFontQueryFromFamily(el.fontFamily);
      if (q) uniqueQueries.add(q);
    }
  });

  if (uniqueQueries.size === 0) return '';

  const fontCssPromises = Array.from(uniqueQueries).map(async (query) => {
    if (base64FontCache.has(query)) {
      return base64FontCache.get(query)!;
    }

    try {
      const googleCssUrl = `https://fonts.googleapis.com/css2?family=${query.replace(/\s+/g, '+')}&display=swap`;
      const cssRes = await fetch(googleCssUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!cssRes.ok) return '';
      let cssText = await cssRes.text();

      const urlRegex = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g;
      const matches = Array.from(cssText.matchAll(urlRegex));

      for (const match of matches) {
        const fullMatch = match[0];
        const fontUrl = match[1].replace(/['"]/g, '');

        try {
          const fontRes = await fetch(fontUrl);
          if (fontRes.ok) {
            const fontBuffer = await fontRes.arrayBuffer();
            const base64Data = arrayBufferToBase64(fontBuffer);
            const dataUrl = `data:font/woff2;base64,${base64Data}`;
            cssText = cssText.replace(fullMatch, `url("${dataUrl}")`);
          }
        } catch {
          // Ignore failed individual font download
        }
      }

      base64FontCache.set(query, cssText);
      return cssText;
    } catch {
      return '';
    }
  });

  const results = await Promise.all(fontCssPromises);
  return results.filter(Boolean).join('\n');
}

export interface ExportOptions {
  format: FormatConfig;
  background: CanvasBackground;
  elements: CanvasElement[];
  scaleMultiplier: number;
  transparentBg?: boolean;
  fileName?: string;
  quality?: number;
}

// Build a pristine offscreen DOM node for image rasterization
export async function createOffscreenExportStage(options: ExportOptions): Promise<{
  container: HTMLElement;
  artboard: HTMLElement;
  cleanup: () => void;
}> {
  const { format, background, elements, scaleMultiplier, transparentBg } = options;
  const targetW = Math.round(format.width * (scaleMultiplier || 1));
  const targetH = Math.round(format.height * (scaleMultiplier || 1));

  // Outer hidden wrapper
  const container = document.createElement('div');
  container.id = 'offscreen-export-wrapper';
  container.style.position = 'fixed';
  container.style.left = '-100000px';
  container.style.top = '-100000px';
  container.style.width = `${targetW}px`;
  container.style.height = `${targetH}px`;
  container.style.overflow = 'hidden';
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '-99999';

  // The Artboard itself (MUST be position: relative, left: 0, top: 0 so foreignObject renders at (0, 0))
  const artboard = document.createElement('div');
  artboard.id = 'offscreen-export-artboard';
  artboard.style.position = 'relative';
  artboard.style.left = '0px';
  artboard.style.top = '0px';
  artboard.style.width = `${targetW}px`;
  artboard.style.height = `${targetH}px`;
  artboard.style.overflow = 'hidden';
  artboard.style.boxSizing = 'border-box';

  // Helper to capture a frame from a video URL if no coverImage is set
  let capturedVideoFrameUrl: string | null = null;
  if (!transparentBg && background.type === 'video' && background.video && (!background.coverImage || background.coverMode === 'framed')) {
    try {
      const liveVideo = document.querySelector('#social-artboard-stage video') as HTMLVideoElement | null;
      if (liveVideo && liveVideo.readyState >= 2 && liveVideo.videoWidth > 0) {
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = liveVideo.videoWidth;
        tmpCanvas.height = liveVideo.videoHeight;
        const tctx = tmpCanvas.getContext('2d');
        if (tctx) {
          tctx.drawImage(liveVideo, 0, 0, tmpCanvas.width, tmpCanvas.height);
          capturedVideoFrameUrl = tmpCanvas.toDataURL('image/jpeg', 0.92);
        }
      }
    } catch {
      // Ignore tainted canvas errors
    }
  }

  // Dedicated Background Media Layer (separated from overlayOpacity so blur ALWAYS renders properly)
  const bgLayer = document.createElement('div');
  bgLayer.style.position = 'absolute';
  bgLayer.style.inset = '0';
  bgLayer.style.pointerEvents = 'none';

  if (transparentBg || background.type === 'transparent') {
    artboard.style.backgroundColor = 'transparent';
  } else {
    artboard.style.backgroundColor = background.color || '#090a0f';

    if (background.type === 'solid') {
      bgLayer.style.backgroundColor = background.color || '#090a0f';
    } else if (background.type === 'gradient') {
      if (background.gradient?.type === 'radial') {
        bgLayer.style.backgroundImage = `radial-gradient(circle at center, ${background.gradient.colors.join(', ')})`;
      } else if (background.gradient?.colors) {
        bgLayer.style.backgroundImage = `linear-gradient(${background.gradient.angle || 135}deg, ${background.gradient.colors.join(', ')})`;
      }
    } else if (background.type === 'image' && background.image) {
      bgLayer.style.backgroundImage = `url("${background.image}")`;
      bgLayer.style.backgroundSize = background.imageFit || 'cover';
      bgLayer.style.backgroundPosition = 'center';
      bgLayer.style.backgroundRepeat = background.imageFit === 'tile' ? 'repeat' : 'no-repeat';
    } else if (background.type === 'video') {
      const staticBgSrc = background.coverImage || capturedVideoFrameUrl;
      if (staticBgSrc) {
        bgLayer.style.backgroundImage = `url("${staticBgSrc}")`;
        bgLayer.style.backgroundSize = 'cover';
        bgLayer.style.backgroundPosition = 'center';
        bgLayer.style.backgroundRepeat = 'no-repeat';
      } else {
        bgLayer.style.backgroundColor = background.color || '#090a0f';
      }
    } else {
      bgLayer.style.backgroundColor = background.color || '#090a0f';
    }

    if (background.blur > 0) {
      bgLayer.style.filter = `blur(${background.blur * scaleMultiplier * 2}px)`;
      bgLayer.style.transform = 'scale(1.12)';
    }

    artboard.appendChild(bgLayer);

    // If framed mode with video frame captured, render sharp video frame card on top of blurred cover
    if (background.type === 'video' && background.coverMode === 'framed' && capturedVideoFrameUrl) {
      const frameWrap = document.createElement('div');
      frameWrap.style.position = 'absolute';
      frameWrap.style.inset = '0';
      frameWrap.style.display = 'flex';
      frameWrap.style.alignItems = 'center';
      frameWrap.style.justifyContent = 'center';
      frameWrap.style.padding = `${32 * scaleMultiplier}px`;
      frameWrap.style.pointerEvents = 'none';

      const frameImg = document.createElement('img');
      frameImg.src = capturedVideoFrameUrl;
      frameImg.style.maxWidth = '90%';
      frameImg.style.maxHeight = '72%';
      frameImg.style.borderRadius = `${20 * scaleMultiplier}px`;
      frameImg.style.boxShadow = `0 ${18 * scaleMultiplier}px ${40 * scaleMultiplier}px rgba(0,0,0,0.65)`;
      frameImg.style.border = `${Math.max(1, 2 * scaleMultiplier)}px solid rgba(255,255,255,0.22)`;
      frameImg.style.objectFit = 'contain';

      frameWrap.appendChild(frameImg);
      artboard.appendChild(frameWrap);
    }
  }

  // Independent Background Tint Overlay (no longer linked to blur!)
  if (!transparentBg && background.type !== 'transparent' && background.overlayOpacity > 0) {
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.backgroundColor = background.overlayColor || '#000000';
    overlay.style.opacity = `${background.overlayOpacity}`;
    overlay.style.pointerEvents = 'none';
    artboard.appendChild(overlay);
  }

  // Inject animations stylesheet
  const animStyle = document.createElement('style');
  animStyle.textContent = getAllAnimationsCss();
  artboard.appendChild(animStyle);

  // Render elements in sorted z-index order
  const visibleElements = elements.filter((el) => !el.hidden).sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));
  const imageLoadPromises: Promise<void>[] = [];

  visibleElements.forEach((el) => {
    if (el.type === 'text') {
      const textElem = el as CanvasTextElement;
      const elemWrapper = document.createElement('div');
      elemWrapper.style.position = 'absolute';
      elemWrapper.style.left = `${textElem.x * scaleMultiplier}px`;
      elemWrapper.style.top = `${textElem.y * scaleMultiplier}px`;
      elemWrapper.style.transform = `rotate(${textElem.rotation || 0}deg)`;
      elemWrapper.style.transformOrigin = 'top left';
      elemWrapper.style.opacity = `${textElem.opacity ?? 1}`;
      elemWrapper.style.zIndex = `${(textElem.zIndex || 1) + 10}`;
      elemWrapper.style.boxSizing = 'border-box';

      // Inner text element with full styles
      const innerText = document.createElement('div');
      innerText.style.fontFamily = textElem.fontFamily;
      innerText.style.fontSize = `${textElem.fontSize * scaleMultiplier}px`;
      innerText.style.fontWeight = `${textElem.fontWeight || 400}`;
      innerText.style.fontStyle = textElem.fontStyle || 'normal';
      innerText.style.textTransform = textElem.textTransform || 'none';
      innerText.style.textAlign = textElem.textAlign || 'left';
      innerText.style.letterSpacing = `${(textElem.letterSpacing || 0) * scaleMultiplier}px`;
      innerText.style.lineHeight = `${textElem.lineHeight || 1.1}`;
      innerText.style.whiteSpace = 'pre-wrap';
      innerText.style.wordBreak = 'break-word';
      innerText.style.maxWidth = `${(textElem.width || 800) * scaleMultiplier}px`;
      innerText.style.boxSizing = 'border-box';
      innerText.textContent = textElem.text;

      // Text Shadow
      if (textElem.shadow && textElem.shadow.enabled) {
        const blur = (textElem.shadow.blur || 12) * scaleMultiplier;
        const offX = (textElem.shadow.offsetX || 0) * scaleMultiplier;
        const offY = (textElem.shadow.offsetY || 4) * scaleMultiplier;
        const col = textElem.shadow.color || '#000000';

        if (textElem.shadow.preset === 'neon') {
          innerText.style.textShadow = `0 0 ${blur * 0.4}px ${col}, 0 0 ${blur}px ${col}, 0 0 ${blur * 1.6}px ${col}`;
        } else if (textElem.shadow.preset === 'retro3d') {
          innerText.style.textShadow = `${offX}px ${offY}px 0px ${col}`;
        } else {
          innerText.style.textShadow = `${offX}px ${offY}px ${blur}px ${col}`;
        }
      } else {
        innerText.style.textShadow = 'none';
      }

      // Text Color / Gradient
      if (textElem.gradient && textElem.gradient.enabled && textElem.gradient.stops && textElem.gradient.stops.length > 0) {
        const stopsStr = textElem.gradient.stops.map((s) => `${s.color} ${s.offset}%`).join(', ');
        const bgGradient =
          textElem.gradient.type === 'radial'
            ? `radial-gradient(circle, ${stopsStr})`
            : `linear-gradient(${textElem.gradient.angle || 90}deg, ${stopsStr})`;

        innerText.style.backgroundImage = bgGradient;
        innerText.style.setProperty('-webkit-background-clip', 'text');
        innerText.style.setProperty('background-clip', 'text');
        innerText.style.setProperty('-webkit-text-fill-color', 'transparent');
        innerText.style.color = 'transparent';
        innerText.style.display = 'inline-block';
      } else {
        const solidColor = textElem.color || '#ffffff';
        innerText.style.color = solidColor;
        innerText.style.setProperty('-webkit-text-fill-color', solidColor);
        innerText.style.backgroundImage = 'none';
        innerText.style.setProperty('-webkit-background-clip', 'border-box');
        innerText.style.setProperty('background-clip', 'border-box');
        innerText.style.display = 'inline-block';
      }

      // Stroke
      if (textElem.stroke && textElem.stroke.enabled && textElem.stroke.width > 0) {
        innerText.style.setProperty(
          '-webkit-text-stroke',
          `${textElem.stroke.width * scaleMultiplier}px ${textElem.stroke.color || '#ffffff'}`
        );
      }

      // Background Box / Badge
      if (textElem.backgroundColor) {
        innerText.style.backgroundColor = textElem.backgroundColor;
        innerText.style.padding = `${(textElem.backgroundPadding || 0) * scaleMultiplier}px`;
        innerText.style.borderRadius = `${(textElem.borderRadius || 0) * scaleMultiplier}px`;
      }

      elemWrapper.appendChild(innerText);
      artboard.appendChild(elemWrapper);
    } else if (el.type === 'image') {
      const imgElem = el as CanvasImageElement;
      const elemWrapper = document.createElement('div');
      elemWrapper.style.position = 'absolute';
      elemWrapper.style.left = `${imgElem.x * scaleMultiplier}px`;
      elemWrapper.style.top = `${imgElem.y * scaleMultiplier}px`;
      elemWrapper.style.zIndex = `${(imgElem.zIndex || 1) + 10}`;
      elemWrapper.style.opacity = `${imgElem.opacity ?? 1}`;
      elemWrapper.style.boxSizing = 'border-box';

      const img = document.createElement('img');
      img.src = imgElem.src;
      img.alt = imgElem.name || 'sticker';
      img.crossOrigin = 'anonymous';
      img.style.width = `${imgElem.width * (imgElem.scale || 1) * scaleMultiplier}px`;
      img.style.height = 'auto';
      img.style.display = 'block';
      img.style.borderRadius = `${(imgElem.borderRadius || 0) * scaleMultiplier}px`;
      img.style.mixBlendMode = imgElem.blendMode || 'normal';

      const filterStyle = `brightness(${imgElem.filter?.brightness ?? 100}%) contrast(${imgElem.filter?.contrast ?? 100}%) blur(${(imgElem.filter?.blur ?? 0) * scaleMultiplier}px) saturate(${imgElem.filter?.saturate ?? 100}%)`;
      img.style.filter = filterStyle;

      const transform = `rotate(${imgElem.rotation || 0}deg) ${imgElem.flipX ? 'scaleX(-1)' : ''} ${imgElem.flipY ? 'scaleY(-1)' : ''}`;
      img.style.transform = transform;
      img.style.transformOrigin = 'center center';

      imageLoadPromises.push(
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        })
      );

      elemWrapper.appendChild(img);
      artboard.appendChild(elemWrapper);
    }
  });

  container.appendChild(artboard);
  document.body.appendChild(container);

  // Wait for image assets
  await Promise.all(imageLoadPromises);

  // Wait for document fonts
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore
    }
  }

  return {
    container,
    artboard,
    cleanup: () => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    },
  };
}

// Direct HTML5 Canvas 2D fallback renderer (guaranteed to render regardless of foreignObject/CORS)
export async function exportCanvasVia2DCanvas(options: ExportOptions): Promise<string> {
  const { format, background, elements, scaleMultiplier, transparentBg } = options;
  const targetW = Math.round(format.width * (scaleMultiplier || 1));
  const targetH = Math.round(format.height * (scaleMultiplier || 1));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get Canvas 2D context');

  // Background (with blur support + video cover/frame fallback)
  if (!transparentBg && background.type !== 'transparent') {
    const blurPx = (background.blur || 0) * scaleMultiplier * 2;
    const pad = blurPx > 0 ? blurPx * 2 + 20 : 0;

    ctx.save();
    if (blurPx > 0) {
      ctx.filter = `blur(${blurPx}px)`;
    }

    if (background.type === 'solid') {
      ctx.fillStyle = background.color || '#090a0f';
      ctx.fillRect(-pad, -pad, targetW + pad * 2, targetH + pad * 2);
    } else if (background.type === 'gradient') {
      if (background.gradient?.type === 'radial') {
        const rad = ctx.createRadialGradient(targetW / 2, targetH / 2, 0, targetW / 2, targetH / 2, Math.max(targetW, targetH) / 2);
        const colors = background.gradient.colors || ['#0f0c1b', '#1a0b2e', '#090a0f'];
        colors.forEach((col, idx) => rad.addColorStop(idx / Math.max(1, colors.length - 1), col));
        ctx.fillStyle = rad;
      } else {
        const angle = ((background.gradient?.angle || 135) * Math.PI) / 180;
        const cx = targetW / 2;
        const cy = targetH / 2;
        const len = Math.sqrt(targetW * targetW + targetH * targetH) / 2;
        const dx = Math.sin(angle) * len;
        const dy = -Math.cos(angle) * len;
        const grad = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
        const colors = background.gradient?.colors || ['#0f0c1b', '#1a0b2e', '#090a0f'];
        colors.forEach((col, idx) => grad.addColorStop(idx / Math.max(1, colors.length - 1), col));
        ctx.fillStyle = grad;
      }
      ctx.fillRect(-pad, -pad, targetW + pad * 2, targetH + pad * 2);
    } else if ((background.type === 'image' && background.image) || (background.type === 'video' && background.coverImage)) {
      const imgSrc = background.type === 'video' ? background.coverImage! : background.image!;
      try {
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        bgImg.src = imgSrc;
        await new Promise((r) => {
          if (bgImg.complete) r(null);
          bgImg.onload = () => r(null);
          bgImg.onerror = () => r(null);
        });
        const sw = bgImg.naturalWidth || targetW;
        const sh = bgImg.naturalHeight || targetH;
        const scale = Math.max((targetW + pad * 2) / sw, (targetH + pad * 2) / sh);
        const dw = sw * scale;
        const dh = sh * scale;
        ctx.drawImage(bgImg, (targetW - dw) / 2, (targetH - dh) / 2, dw, dh);
      } catch {
        ctx.fillStyle = background.color || '#090a0f';
        ctx.fillRect(-pad, -pad, targetW + pad * 2, targetH + pad * 2);
      }
    } else if (background.type === 'video') {
      const liveVideo = document.querySelector('#social-artboard-stage video') as HTMLVideoElement | null;
      if (liveVideo && liveVideo.readyState >= 2 && liveVideo.videoWidth > 0) {
        const sw = liveVideo.videoWidth;
        const sh = liveVideo.videoHeight;
        const scale = Math.max((targetW + pad * 2) / sw, (targetH + pad * 2) / sh);
        const dw = sw * scale;
        const dh = sh * scale;
        ctx.drawImage(liveVideo, (targetW - dw) / 2, (targetH - dh) / 2, dw, dh);
      } else {
        ctx.fillStyle = background.color || '#090a0f';
        ctx.fillRect(0, 0, targetW, targetH);
      }
    }
    ctx.restore();
  }

  // Draw overlay tint
  if (!transparentBg && background.overlayOpacity > 0) {
    ctx.fillStyle = background.overlayColor || '#000000';
    ctx.globalAlpha = background.overlayOpacity;
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.globalAlpha = 1.0;
  }

  // Draw elements
  const visibleElements = elements.filter((el) => !el.hidden).sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));
  for (const el of visibleElements) {
    ctx.save();
    if (el.type === 'text') {
      const textElem = el as CanvasTextElement;
      ctx.globalAlpha = textElem.opacity ?? 1;
      ctx.translate(textElem.x * scaleMultiplier, textElem.y * scaleMultiplier);
      if (textElem.rotation) {
        ctx.rotate((textElem.rotation * Math.PI) / 180);
      }

      const fontSize = textElem.fontSize * scaleMultiplier;
      const fontStyle = textElem.fontStyle === 'italic' ? 'italic ' : '';
      const fontWeight = textElem.fontWeight ? `${textElem.fontWeight} ` : '';
      ctx.font = `${fontStyle}${fontWeight}${fontSize}px ${textElem.fontFamily}`;
      ctx.textBaseline = 'top';

      if (textElem.textAlign === 'center') ctx.textAlign = 'center';
      else if (textElem.textAlign === 'right') ctx.textAlign = 'right';
      else ctx.textAlign = 'left';

      // Shadow
      if (textElem.shadow && textElem.shadow.enabled) {
        ctx.shadowColor = textElem.shadow.color || '#000000';
        ctx.shadowBlur = (textElem.shadow.blur || 12) * scaleMultiplier;
        ctx.shadowOffsetX = (textElem.shadow.offsetX || 0) * scaleMultiplier;
        ctx.shadowOffsetY = (textElem.shadow.offsetY || 4) * scaleMultiplier;
      }

      // Fill style
      if (textElem.gradient && textElem.gradient.enabled && textElem.gradient.stops && textElem.gradient.stops.length > 0) {
        const grad = ctx.createLinearGradient(0, 0, (textElem.width || 400) * scaleMultiplier, fontSize);
        textElem.gradient.stops.forEach((s) => grad.addColorStop(s.offset / 100, s.color));
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = textElem.color || '#ffffff';
      }

      const lines = textElem.text.split('\n');
      const lineHeight = fontSize * (textElem.lineHeight || 1.1);
      lines.forEach((line, idx) => {
        let textToDraw = line;
        if (textElem.textTransform === 'uppercase') textToDraw = line.toUpperCase();
        else if (textElem.textTransform === 'lowercase') textToDraw = line.toLowerCase();

        ctx.fillText(textToDraw, 0, idx * lineHeight);
        if (textElem.stroke && textElem.stroke.enabled && textElem.stroke.width > 0) {
          ctx.strokeStyle = textElem.stroke.color || '#ffffff';
          ctx.lineWidth = textElem.stroke.width * scaleMultiplier;
          ctx.strokeText(textToDraw, 0, idx * lineHeight);
        }
      });
    } else if (el.type === 'image') {
      const imgElem = el as CanvasImageElement;
      ctx.globalAlpha = imgElem.opacity ?? 1;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imgElem.src;
      await new Promise((r) => {
        if (img.complete && img.naturalWidth > 0) r(null);
        img.onload = () => r(null);
        img.onerror = () => r(null);
      });
      const drawW = imgElem.width * (imgElem.scale || 1) * scaleMultiplier;
      const drawH = (img.naturalHeight / (img.naturalWidth || 1)) * drawW;
      ctx.drawImage(img, imgElem.x * scaleMultiplier, imgElem.y * scaleMultiplier, drawW, drawH);
    }
    ctx.restore();
  }

  return canvas.toDataURL('image/png', 1.0);
}

// Export canvas as High-Resolution PNG
export async function exportCanvasToPng(
  canvasDomElement: HTMLElement | null,
  options: {
    format: FormatConfig;
    background: CanvasBackground;
    elements: CanvasElement[];
    scaleMultiplier: number;
    transparentBg?: boolean;
    fileName?: string;
  }
): Promise<string> {
  const { format, background, elements, scaleMultiplier, transparentBg, fileName } = options;
  const targetW = Math.round(format.width * (scaleMultiplier || 1));
  const targetH = Math.round(format.height * (scaleMultiplier || 1));

  let cleanupFn: (() => void) | null = null;
  try {
    const embeddedFontCss = await getBase64FontCssForElements(elements);
    const stage = await createOffscreenExportStage({
      format,
      background,
      elements,
      scaleMultiplier: scaleMultiplier || 1,
      transparentBg,
    });
    cleanupFn = stage.cleanup;

    const dataUrl = await toPng(stage.artboard, {
      width: targetW,
      height: targetH,
      pixelRatio: 1,
      fontEmbedCSS: embeddedFontCss,
      skipFonts: true,
      cacheBust: true,
      backgroundColor: transparentBg ? undefined : (background.type === 'solid' ? background.color : undefined),
    });

    // Check if dataUrl is empty or trivial
    if (!dataUrl || dataUrl.length < 200) {
      throw new Error('Generated dataUrl is empty');
    }

    const finalName = fileName || `social-type-${format.id}-${Date.now()}.png`;
    downloadFile(dataUrl, finalName);
    triggerExportConfetti();
    return dataUrl;
  } catch (err) {
    console.warn('html-to-image toPng failed, using Canvas 2D fallback:', err);
    const fallbackUrl = await exportCanvasVia2DCanvas({
      format,
      background,
      elements,
      scaleMultiplier: scaleMultiplier || 1,
      transparentBg,
    });
    const finalName = fileName || `social-type-${format.id}-${Date.now()}.png`;
    downloadFile(fallbackUrl, finalName);
    triggerExportConfetti();
    return fallbackUrl;
  } finally {
    if (cleanupFn) cleanupFn();
  }
}

// Export canvas as JPEG
export async function exportCanvasToJpeg(
  canvasDomElement: HTMLElement | null,
  options: {
    format: FormatConfig;
    background: CanvasBackground;
    elements: CanvasElement[];
    scaleMultiplier: number;
    quality?: number;
    fileName?: string;
  }
): Promise<string> {
  const { format, background, elements, scaleMultiplier, quality = 0.95, fileName } = options;
  const targetW = Math.round(format.width * (scaleMultiplier || 1));
  const targetH = Math.round(format.height * (scaleMultiplier || 1));

  let cleanupFn: (() => void) | null = null;
  try {
    const embeddedFontCss = await getBase64FontCssForElements(elements);
    const stage = await createOffscreenExportStage({
      format,
      background,
      elements,
      scaleMultiplier: scaleMultiplier || 1,
      transparentBg: false,
    });
    cleanupFn = stage.cleanup;

    const dataUrl = await toJpeg(stage.artboard, {
      width: targetW,
      height: targetH,
      quality,
      pixelRatio: 1,
      fontEmbedCSS: embeddedFontCss,
      skipFonts: true,
      cacheBust: true,
      backgroundColor: background.type === 'solid' ? background.color : '#090a0f',
    });

    const finalName = fileName || `social-type-${format.id}-${Date.now()}.jpg`;
    downloadFile(dataUrl, finalName);
    triggerExportConfetti();
    return dataUrl;
  } catch (err) {
    console.warn('toJpeg failed, using Canvas 2D fallback:', err);
    const fallbackUrl = await exportCanvasVia2DCanvas({
      format,
      background,
      elements,
      scaleMultiplier: scaleMultiplier || 1,
      transparentBg: false,
    });
    const finalName = fileName || `social-type-${format.id}-${Date.now()}.jpg`;
    downloadFile(fallbackUrl, finalName);
    triggerExportConfetti();
    return fallbackUrl;
  } finally {
    if (cleanupFn) cleanupFn();
  }
}

// Export canvas as WebP
export async function exportCanvasToWebp(
  canvasDomElement: HTMLElement | null,
  options: {
    format: FormatConfig;
    background: CanvasBackground;
    elements: CanvasElement[];
    scaleMultiplier: number;
    transparentBg?: boolean;
    fileName?: string;
  }
): Promise<string> {
  const { format, background, elements, scaleMultiplier, transparentBg, fileName } = options;
  const targetW = Math.round(format.width * (scaleMultiplier || 1));
  const targetH = Math.round(format.height * (scaleMultiplier || 1));

  let cleanupFn: (() => void) | null = null;
  try {
    const embeddedFontCss = await getBase64FontCssForElements(elements);
    const stage = await createOffscreenExportStage({
      format,
      background,
      elements,
      scaleMultiplier: scaleMultiplier || 1,
      transparentBg,
    });
    cleanupFn = stage.cleanup;

    const blob = await toBlob(stage.artboard, {
      type: 'image/webp',
      width: targetW,
      height: targetH,
      quality: 0.95,
      pixelRatio: 1,
      fontEmbedCSS: embeddedFontCss,
      skipFonts: true,
      cacheBust: true,
      backgroundColor: transparentBg ? undefined : (background.type === 'solid' ? background.color : undefined),
    });

    if (!blob) throw new Error('WebP generation failed');
    const url = URL.createObjectURL(blob);
    const finalName = fileName || `social-type-${format.id}-${Date.now()}.webp`;
    downloadFile(url, finalName);
    URL.revokeObjectURL(url);
    triggerExportConfetti();
    return url;
  } catch (err) {
    console.warn('toWebp failed, using Canvas 2D fallback:', err);
    const fallbackUrl = await exportCanvasVia2DCanvas({
      format,
      background,
      elements,
      scaleMultiplier: scaleMultiplier || 1,
      transparentBg,
    });
    const finalName = fileName || `social-type-${format.id}-${Date.now()}.webp`;
    downloadFile(fallbackUrl, finalName);
    triggerExportConfetti();
    return fallbackUrl;
  } finally {
    if (cleanupFn) cleanupFn();
  }
}

// Export canvas as SVG
export async function exportCanvasToSvg(
  canvasDomElement: HTMLElement | null,
  options: {
    format: FormatConfig;
    background: CanvasBackground;
    elements: CanvasElement[];
    scaleMultiplier: number;
    transparentBg?: boolean;
    fileName?: string;
  }
): Promise<string> {
  const { format, background, elements, scaleMultiplier, transparentBg, fileName } = options;
  const targetW = Math.round(format.width * (scaleMultiplier || 1));
  const targetH = Math.round(format.height * (scaleMultiplier || 1));

  let cleanupFn: (() => void) | null = null;
  try {
    const embeddedFontCss = await getBase64FontCssForElements(elements);
    const stage = await createOffscreenExportStage({
      format,
      background,
      elements,
      scaleMultiplier: scaleMultiplier || 1,
      transparentBg,
    });
    cleanupFn = stage.cleanup;

    const dataUrl = await toSvg(stage.artboard, {
      width: targetW,
      height: targetH,
      fontEmbedCSS: embeddedFontCss,
      skipFonts: true,
      cacheBust: true,
      backgroundColor: transparentBg ? undefined : (background.type === 'solid' ? background.color : undefined),
    });

    const finalName = fileName || `social-type-${format.id}-${Date.now()}.svg`;
    downloadFile(dataUrl, finalName);
    triggerExportConfetti();
    return dataUrl;
  } finally {
    if (cleanupFn) cleanupFn();
  }
}

// Copy PNG to system clipboard
export async function copyCanvasToClipboard(
  canvasDomElement: HTMLElement | null,
  options: {
    format: FormatConfig;
    background: CanvasBackground;
    elements: CanvasElement[];
  }
): Promise<boolean> {
  const { format, background, elements } = options;
  const targetW = Math.round(format.width * 2);
  const targetH = Math.round(format.height * 2);

  let cleanupFn: (() => void) | null = null;
  try {
    const embeddedFontCss = await getBase64FontCssForElements(elements);
    const stage = await createOffscreenExportStage({
      format,
      background,
      elements,
      scaleMultiplier: 2,
      transparentBg: false,
    });
    cleanupFn = stage.cleanup;

    let blob = await toBlob(stage.artboard, {
      width: targetW,
      height: targetH,
      quality: 1,
      pixelRatio: 1,
      fontEmbedCSS: embeddedFontCss,
      skipFonts: true,
      cacheBust: true,
      backgroundColor: background.type === 'solid' ? background.color : '#090a0f',
    });

    if (!blob) {
      const dataUrl = await exportCanvasVia2DCanvas({
        format,
        background,
        elements,
        scaleMultiplier: 2,
        transparentBg: false,
      });
      const res = await fetch(dataUrl);
      blob = await res.blob();
    }

    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);
      triggerExportConfetti();
      return true;
    }
    return false;
  } catch (err) {
    console.error('Clipboard copy error:', err);
    throw err;
  } finally {
    if (cleanupFn) cleanupFn();
  }
}

// Generate standalone HTML file
export function generateStandaloneHtml(
  elements: CanvasElement[],
  background: CanvasBackground,
  format: FormatConfig,
  projectName = 'Social Type Design'
): string {
  const usedGoogleFontQueries = new Set<string>();

  elements.forEach((el) => {
    if (el.type === 'text' && el && typeof el.fontFamily === 'string') {
      const q = getGoogleFontQueryFromFamily(el.fontFamily);
      if (q) usedGoogleFontQueries.add(q);
    }
  });

  const fontQuery = Array.from(usedGoogleFontQueries)
    .map((f) => `family=${f.replace(/\s+/g, '+')}`)
    .join('&');

  const googleFontsUrl = fontQuery ? `https://fonts.googleapis.com/css2?${fontQuery}&display=swap` : '';

  let bgWrapperStyle = '';
  let bgVideoHtml = '';
  let bgFramedVideoHtml = '';

  const hasCoverAndVideo = background.type === 'video' && Boolean(background.video) && Boolean(background.coverImage);
  const coverMode = background.coverMode || 'intro';
  const coverDur = background.coverDuration ?? 2;

  if (background.type === 'solid') {
    bgWrapperStyle = `background-color: ${background.color || '#090a0f'};`;
  } else if (background.type === 'gradient') {
    if (background.gradient?.type === 'radial') {
      bgWrapperStyle = `background: radial-gradient(circle at center, ${background.gradient.colors.join(', ')});`;
    } else if (background.gradient?.colors) {
      bgWrapperStyle = `background: linear-gradient(${background.gradient.angle || 135}deg, ${background.gradient.colors.join(', ')});`;
    }
  } else if (background.type === 'image' && background.image) {
    bgWrapperStyle = `background-image: url('${background.image}'); background-size: ${background.imageFit || 'cover'}; background-position: center; background-repeat: ${background.imageFit === 'tile' ? 'repeat' : 'no-repeat'};`;
  } else if (background.type === 'video' && background.video) {
    if (hasCoverAndVideo && coverMode === 'framed') {
      bgWrapperStyle = `background-image: url('${background.coverImage}'); background-size: cover; background-position: center;`;
      bgFramedVideoHtml = `
      <div class="canvas-framed-video-wrap">
        <video
          src="${background.video}"
          poster="${background.coverImage}"
          autoplay
          ${background.videoLoop !== false ? 'loop' : ''}
          ${background.videoMuted !== false ? 'muted' : ''}
          playsinline
          class="canvas-framed-video"
        ></video>
      </div>`;
    } else {
      bgWrapperStyle = `background-color: #000;`;
      bgVideoHtml = `
      <video
        id="canvas-bg-video"
        src="${background.video}"
        ${background.coverImage ? `poster="${background.coverImage}"` : ''}
        autoplay
        ${hasCoverAndVideo && coverMode === 'intro' ? '' : background.videoLoop !== false ? 'loop' : ''}
        ${background.videoMuted !== false ? 'muted' : ''}
        playsinline
        class="canvas-video-bg"
      ></video>
      ${
        hasCoverAndVideo && coverMode === 'intro'
          ? `<img id="canvas-bg-cover" src="${background.coverImage}" alt="Copertina" class="canvas-cover-bg" />`
          : ''
      }`;
    }
  } else if (background.type === 'transparent') {
    bgWrapperStyle = `background: transparent;`;
  }

  const visibleElements = elements.filter((el) => !el.hidden);
  const elementsHtml = visibleElements
    .map((elem) => {
      if (elem.type === 'text') {
        return renderTextElementHtml(elem);
      } else {
        return renderImageElementHtml(elem);
      }
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(projectName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  ${googleFontsUrl ? `<link href="${googleFontsUrl}" rel="stylesheet">` : ''}
  <style>
    ${googleFontsUrl ? `@import url('${googleFontsUrl}');` : ''}

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      min-height: 100vh;
      background-color: #08090d;
      background-image: radial-gradient(circle at 50% 0%, #151922 0%, #08090d 75%);
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 24px 16px;
      overflow-x: hidden;
    }

    .top-header {
      width: 100%;
      max-width: 1200px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #1e293b;
    }
    .top-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #f8fafc;
      letter-spacing: -0.02em;
    }
    .top-meta {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 2px;
    }
    .header-actions {
      display: flex;
      gap: 8px;
    }
    .header-btn {
      background: #1e293b;
      color: #cbd5e1;
      border: 1px solid #334155;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .header-btn:hover {
      background: #334155;
      color: #fff;
    }
    .header-btn.active {
      background: #4f46e5;
      border-color: #6366f1;
      color: #fff;
    }

    .card-viewport {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      flex: 1;
      padding: 12px 0;
    }

    .card-scaler-box {
      transform-origin: top center;
      transition: transform 0.2s ease-out;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .artboard-card {
      position: relative;
      width: ${format.width}px;
      height: ${format.height}px;
      overflow: hidden;
      border-radius: 28px;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08);
      background-color: ${background.type === 'transparent' ? 'transparent' : background.color || '#090a0f'};
    }

    .canvas-bg-layer {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      ${bgWrapperStyle}
      ${background.blur > 0 ? `filter: blur(${background.blur * 2}px); transform: scale(1.12);` : ''}
    }

    .canvas-video-bg, .canvas-cover-bg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      pointer-events: none;
    }

    .canvas-cover-bg {
      transition: opacity 0.35s ease;
    }

    .canvas-framed-video-wrap {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px;
      pointer-events: none;
    }

    .canvas-framed-video {
      max-width: 90%;
      max-height: 72%;
      border-radius: 20px;
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.65);
      border: 2px solid rgba(255, 255, 255, 0.22);
      object-fit: contain;
    }

    .canvas-overlay {
      position: absolute;
      inset: 0;
      background-color: ${background.overlayColor || '#000'};
      opacity: ${background.overlayOpacity || 0};
      pointer-events: none;
    }

    .canvas-element-layer {
      position: absolute;
      box-sizing: border-box;
      pointer-events: auto;
      user-select: none;
    }

    ${getAllAnimationsCss()}
  </style>
</head>
<body>
  <header class="top-header">
    <div>
      <div class="top-title">${escapeHtml(projectName)}</div>
      <div class="top-meta">${format.name} (${format.width} × ${format.height}px • ${format.ratio})</div>
    </div>
    <div class="header-actions">
      <button class="header-btn active" id="btn-fit" onclick="setMode('fit')">Adatta Schermo</button>
      <button class="header-btn" id="btn-100" onclick="setMode('100')">Dimensione Reale (100%)</button>
    </div>
  </header>

  <main class="card-viewport">
    <div class="card-scaler-box" id="scaler-box">
      <div class="artboard-card">
        <div class="canvas-bg-layer">
          ${bgVideoHtml}
        </div>
        ${bgFramedVideoHtml}
        <div class="canvas-overlay"></div>
        ${elementsHtml}
      </div>
    </div>
  </main>

  <script>
    let currentMode = 'fit';
    const cardWidth = ${format.width};
    const cardHeight = ${format.height};
    const scalerBox = document.getElementById('scaler-box');
    const btnFit = document.getElementById('btn-fit');
    const btn100 = document.getElementById('btn-100');

    function updateScale() {
      if (!scalerBox) return;
      if (currentMode === '100') {
        scalerBox.style.transform = 'scale(1)';
        scalerBox.style.width = cardWidth + 'px';
        scalerBox.style.height = cardHeight + 'px';
        return;
      }

      const availableW = Math.max(280, window.innerWidth - 40);
      const availableH = Math.max(300, window.innerHeight - 140);

      const maxCardW = ${format.width >= format.height ? 960 : 480};
      const targetW = Math.min(availableW, maxCardW);

      const scaleW = targetW / cardWidth;
      const scaleH = availableH / cardHeight;
      const scale = Math.min(scaleW, scaleH);

      scalerBox.style.transform = 'scale(' + scale + ')';
      scalerBox.style.width = (cardWidth * scale) + 'px';
      scalerBox.style.height = (cardHeight * scale) + 'px';
    }

    function setMode(mode) {
      currentMode = mode;
      if (mode === 'fit') {
        btnFit.classList.add('active');
        btn100.classList.remove('active');
      } else {
        btn100.classList.add('active');
        btnFit.classList.remove('active');
      }
      updateScale();
    }

    // Cover Intro + Video sequence controller
    const bgVideo = document.getElementById('canvas-bg-video');
    const bgCover = document.getElementById('canvas-bg-cover');
    if (bgVideo && bgCover) {
      const coverMs = ${Math.round(coverDur * 1000)};
      const shouldLoop = ${background.videoLoop !== false ? 'true' : 'false'};
      function runSequence() {
        bgCover.style.opacity = '1';
        bgVideo.pause();
        bgVideo.currentTime = 0;
        setTimeout(() => {
          bgCover.style.opacity = '0';
          bgVideo.play().catch(() => {});
        }, coverMs);
      }
      bgVideo.addEventListener('ended', () => {
        if (shouldLoop) runSequence();
      });
      runSequence();
    }

    window.addEventListener('resize', updateScale);
    window.addEventListener('DOMContentLoaded', updateScale);
    updateScale();
  </script>
</body>
</html>`;
}

function renderTextElementHtml(el: CanvasTextElement): string {
  const left = el.x;
  const top = el.y;
  const width = el.width || 800;
  const rotation = el.rotation || 0;
  const opacity = el.opacity ?? 1;
  const zIndex = (el.zIndex || 1) + 5;

  let shadowCss = 'none';
  if (el.shadow && el.shadow.enabled) {
    if (el.shadow.preset === 'neon') {
      const b = el.shadow.blur || 20;
      shadowCss = `0 0 ${b * 0.4}px ${el.shadow.color}, 0 0 ${b}px ${el.shadow.color}, 0 0 ${b * 1.6}px ${el.shadow.color}`;
    } else if (el.shadow.preset === 'retro3d') {
      shadowCss = `${el.shadow.offsetX || 3}px ${el.shadow.offsetY || 3}px 0px ${el.shadow.color}`;
    } else {
      shadowCss = `${el.shadow.offsetX || 0}px ${el.shadow.offsetY || 4}px ${el.shadow.blur || 12}px ${el.shadow.color}`;
    }
  }

  let colorStyle = `color: ${el.color || '#ffffff'}; -webkit-text-fill-color: ${el.color || '#ffffff'};`;
  if (el.gradient && el.gradient.enabled && el.gradient.stops && el.gradient.stops.length > 0) {
    const stopsStr = el.gradient.stops.map((s) => `${s.color} ${s.offset}%`).join(', ');
    const bgGradient =
      el.gradient.type === 'radial'
        ? `radial-gradient(circle, ${stopsStr})`
        : `linear-gradient(${el.gradient.angle || 90}deg, ${stopsStr})`;

    colorStyle = `
      background-image: ${bgGradient};
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
    `;
  }

  const strokeStyle =
    el.stroke && el.stroke.enabled && el.stroke.width > 0
      ? `-webkit-text-stroke: ${el.stroke.width}px ${el.stroke.color};`
      : '';

  const bgBoxStyle = el.backgroundColor
    ? `background-color: ${el.backgroundColor}; padding: ${el.backgroundPadding || 0}px; border-radius: ${el.borderRadius || 0}px;`
    : '';

  const animRule = getAnimationCssRule(el.animation.type, el.animation.duration, el.animation.iterationCount);
  const animStyle = animRule !== 'none' ? `animation: ${animRule};` : '';

  const formattedText = escapeHtml(el.text).replace(/\n/g, '<br/>');

  return `
    <div class="canvas-element-layer" style="
      left: ${left}px;
      top: ${top}px;
      width: ${width}px;
      transform: rotate(${rotation}deg);
      transform-origin: top left;
      opacity: ${opacity};
      z-index: ${zIndex};
    ">
      <div class="canvas-text-inner" style="
        font-family: ${el.fontFamily};
        font-size: ${el.fontSize}px;
        font-weight: ${el.fontWeight || 400};
        font-style: ${el.fontStyle || 'normal'};
        text-transform: ${el.textTransform || 'none'};
        text-align: ${el.textAlign || 'left'};
        letter-spacing: ${el.letterSpacing || 0}px;
        line-height: ${el.lineHeight || 1.1};
        text-shadow: ${shadowCss};
        ${colorStyle}
        ${strokeStyle}
        ${bgBoxStyle}
        ${animStyle}
        display: inline-block;
        white-space: pre-wrap;
        word-break: break-word;
        box-sizing: border-box;
      ">${formattedText}</div>
    </div>
  `;
}

function renderImageElementHtml(el: CanvasImageElement): string {
  const left = el.x;
  const top = el.y;
  const width = el.width * (el.scale || 1);
  const rotation = el.rotation || 0;
  const opacity = el.opacity ?? 1;
  const zIndex = (el.zIndex || 1) + 5;

  const filterStyle = `brightness(${el.filter?.brightness ?? 100}%) contrast(${el.filter?.contrast ?? 100}%) blur(${el.filter?.blur ?? 0}px) saturate(${el.filter?.saturate ?? 100}%)`;
  const transform = `rotate(${rotation}deg) ${el.flipX ? 'scaleX(-1)' : ''} ${el.flipY ? 'scaleY(-1)' : ''}`;

  return `
    <div class="canvas-element-layer" style="
      left: ${left}px;
      top: ${top}px;
      z-index: ${zIndex};
      opacity: ${opacity};
    ">
      <img src="${el.src}" alt="${escapeHtml(el.name || 'sticker')}" style="
        width: ${width}px;
        height: auto;
        border-radius: ${el.borderRadius || 0}px;
        mix-blend-mode: ${el.blendMode || 'normal'};
        filter: ${filterStyle};
        transform: ${transform};
        transform-origin: center center;
        display: block;
      " />
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
