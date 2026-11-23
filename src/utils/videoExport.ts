import {
  CanvasBackground,
  CanvasElement,
  CanvasImageElement,
  CanvasTextElement,
  FormatConfig,
} from '../types';
import { downloadFile, triggerExportConfetti } from './export';

export interface VideoExportOptions {
  format: FormatConfig;
  background: CanvasBackground;
  elements: CanvasElement[];
  scale?: number; // e.g. 0.67 for 720p, 1 for native 1080p
  fallbackDuration?: number; // duration in seconds if no video background
  fps?: number;
  fileName?: string;
  signal?: AbortSignal;
  onProgress?: (percent: number, stage: string) => void;
}

export interface VideoExportResult {
  mimeType: string;
  extension: string;
  duration: number;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function loadVideoForExport(src: string, muted: boolean): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.playsInline = true;
    video.muted = muted;
    video.preload = 'auto';

    let settled = false;
    const cleanup = () => {
      video.onloadeddata = null;
      video.onerror = null;
    };

    video.onloadeddata = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(video);
    };

    video.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Impossibile caricare il file video per il rendering.'));
    };

    video.src = src;
    video.load();

    // Timeout fallback if metadata/data takes too long
    setTimeout(() => {
      if (!settled && video.readyState >= 2) {
        settled = true;
        cleanup();
        resolve(video);
      }
    }, 5000);
  });
}

function drawCoverFitted(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  dstX: number,
  dstY: number,
  dstW: number,
  dstH: number,
  fit: 'cover' | 'contain' | 'tile' = 'cover'
) {
  if (!srcW || !srcH) return;

  if (fit === 'contain') {
    const scale = Math.min(dstW / srcW, dstH / srcH);
    const w = srcW * scale;
    const h = srcH * scale;
    const x = dstX + (dstW - w) / 2;
    const y = dstY + (dstH - h) / 2;
    ctx.drawImage(source, x, y, w, h);
    return;
  }

  // Default: cover
  const scale = Math.max(dstW / srcW, dstH / srcH);
  const w = srcW * scale;
  const h = srcH * scale;
  const x = dstX + (dstW - w) / 2;
  const y = dstY + (dstH - h) / 2;
  ctx.drawImage(source, x, y, w, h);
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function getSupportedVideoMimeType(): { mimeType: string; extension: string } {
  const candidates: { mimeType: string; extension: string }[] = [
    { mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', extension: 'mp4' },
    { mimeType: 'video/mp4;codecs=avc1', extension: 'mp4' },
    { mimeType: 'video/mp4', extension: 'mp4' },
    { mimeType: 'video/webm;codecs=vp9,opus', extension: 'webm' },
    { mimeType: 'video/webm;codecs=vp8,opus', extension: 'webm' },
    { mimeType: 'video/webm;codecs=vp9', extension: 'webm' },
    { mimeType: 'video/webm;codecs=vp8', extension: 'webm' },
    { mimeType: 'video/webm', extension: 'webm' },
  ];

  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c.mimeType)) {
      return c;
    }
  }
  return { mimeType: '', extension: 'webm' };
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  rawText: string,
  maxWidth: number,
  letterSpacing: number
): string[] {
  const paragraphs = rawText.split('\n');
  const finalLines: string[] = [];

  for (const p of paragraphs) {
    if (!p) {
      finalLines.push('');
      continue;
    }
    const words = p.split(' ');
    let currentLine = '';
    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
      const measured = ctx.measureText(testLine).width + Math.max(0, testLine.length - 1) * letterSpacing;
      if (measured > maxWidth && currentLine) {
        finalLines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      finalLines.push(currentLine);
    }
  }
  return finalLines;
}

function computeAnimationTransform(
  el: CanvasTextElement,
  elapsedSec: number,
  scale: number
): {
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
  rotateDeg: number;
  skewXDeg: number;
  opacityMult: number;
  hueRotateDeg: number;
  brightnessMult: number;
  extraGlowPx: number;
  extraLetterSpacing: number;
} {
  const res = {
    translateX: 0,
    translateY: 0,
    scaleX: 1,
    scaleY: 1,
    rotateDeg: 0,
    skewXDeg: 0,
    opacityMult: 1,
    hueRotateDeg: 0,
    brightnessMult: 1,
    extraGlowPx: 0,
    extraLetterSpacing: 0,
  };

  const animType = el.animation?.type || 'none';
  if (animType === 'none') return res;

  const duration = Math.max(0.4, el.animation?.duration || 2);
  const progress = (elapsedSec % duration) / duration; // 0..1
  const wave = Math.sin(progress * Math.PI * 2);
  const pulse01 = (1 - Math.cos(progress * Math.PI * 2)) / 2; // 0..1..0

  switch (animType) {
    case 'floating':
      res.translateY = -16 * scale * pulse01;
      res.rotateDeg = -1.5 * pulse01;
      break;
    case 'neon-pulse':
      res.extraGlowPx = 26 * scale * pulse01;
      res.opacityMult = 0.94 + 0.06 * (1 - pulse01);
      break;
    case 'bounce-pop':
      if (progress < 0.3) {
        const k = Math.sin((progress / 0.3) * Math.PI);
        res.scaleX = 1 + 0.08 * k;
        res.scaleY = 1 - 0.06 * k;
      } else if (progress < 0.6) {
        const k = Math.sin(((progress - 0.3) / 0.3) * Math.PI);
        res.scaleX = 1 - 0.04 * k;
        res.scaleY = 1 + 0.06 * k;
      }
      break;
    case 'heartbeat':
      if (progress < 0.28) {
        const k = Math.sin((progress / 0.28) * Math.PI);
        res.scaleX = res.scaleY = 1 + 0.12 * k;
      } else if (progress >= 0.28 && progress < 0.56) {
        const k = Math.sin(((progress - 0.28) / 0.28) * Math.PI);
        res.scaleX = res.scaleY = 1 + 0.16 * k;
      }
      break;
    case 'wobble':
      res.rotateDeg = 6 * wave;
      break;
    case 'flip-3d':
      res.scaleX = 0.88 + 0.12 * Math.cos(progress * Math.PI * 2);
      res.rotateDeg = 2 * wave;
      break;
    case 'slide-up':
      res.opacityMult = 0.4 + 0.6 * pulse01;
      res.translateY = (12 - 24 * progress) * scale;
      break;
    case 'rainbow-wave':
      res.hueRotateDeg = progress * 360;
      break;
    case 'shimmer':
      res.brightnessMult = 1 + 0.35 * pulse01;
      res.extraGlowPx = 10 * scale * pulse01;
      break;
    case 'glitch':
      if (progress > 0.85) {
        const step = Math.floor((progress - 0.85) * 80);
        res.translateX = (step % 2 === 0 ? -4 : 4) * scale;
        res.translateY = (step % 3 === 0 ? 2 : -2) * scale;
        res.skewXDeg = step % 2 === 0 ? -3 : 3;
      }
      break;
    case 'typewriter':
      res.extraLetterSpacing = 4 * scale * pulse01;
      res.opacityMult = 0.88 + 0.12 * (1 - pulse01);
      break;
  }

  return res;
}

export async function exportCanvasToVideo(options: VideoExportOptions): Promise<VideoExportResult> {
  const {
    format,
    background,
    elements,
    scale = 1,
    fallbackDuration = 5,
    fps = 30,
    fileName,
    signal,
    onProgress,
  } = options;

  if (typeof MediaRecorder === 'undefined') {
    throw new Error('Il browser attuale non supporta la registrazione video (MediaRecorder).');
  }

  onProgress?.(2, 'Caricamento font e risorse grafiche...');

  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore
    }
  }

  // Ensure even dimensions for hardware video encoders
  const targetW = Math.max(2, Math.round(format.width * scale) & ~1);
  const targetH = Math.max(2, Math.round(format.height * scale) & ~1);
  const effScale = targetW / format.width;

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Impossibile inizializzare il contesto Canvas 2D.');

  // Preload static background / cover images
  const bgImageEl =
    background.type === 'image' && background.image ? await loadImage(background.image) : null;
  const coverImageEl = background.coverImage ? await loadImage(background.coverImage) : null;

  // Preload element images
  const visibleElements = elements
    .filter((el) => !el.hidden)
    .sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));

  const elementImagesMap = new Map<string, HTMLImageElement>();
  await Promise.all(
    visibleElements
      .filter((el): el is CanvasImageElement => el.type === 'image')
      .map(async (imgEl) => {
        const loaded = await loadImage(imgEl.src);
        if (loaded) elementImagesMap.set(imgEl.id, loaded);
      })
  );

  // Load video if present
  let videoEl: HTMLVideoElement | null = null;
  let videoDur = 0;
  const hasVideoBg = background.type === 'video' && Boolean(background.video);
  if (hasVideoBg && background.video) {
    onProgress?.(8, 'Preparazione traccia video...');
    videoEl = await loadVideoForExport(background.video, background.videoMuted ?? true);
    videoDur =
      Number.isFinite(videoEl.duration) && videoEl.duration > 0.2
        ? Math.min(videoEl.duration, 120)
        : fallbackDuration;
  }

  const coverMode = background.coverMode || 'intro';
  const coverDur =
    hasVideoBg && coverImageEl && coverMode === 'intro'
      ? Math.max(0.5, background.coverDuration ?? 2)
      : 0;

  const totalDuration = hasVideoBg ? coverDur + videoDur : fallbackDuration;

  // Pre-render static blurred background/cover canvas if blur > 0 for silky 30fps performance
  const blurPx = (background.blur || 0) * effScale * 2;
  const renderBlurredStaticSource = (img: HTMLImageElement): HTMLCanvasElement => {
    const off = document.createElement('canvas');
    off.width = targetW;
    off.height = targetH;
    const octx = off.getContext('2d');
    if (octx) {
      if (blurPx > 0) {
        octx.filter = `blur(${blurPx}px)`;
        const pad = blurPx * 2 + 24;
        drawCoverFitted(
          octx,
          img,
          img.naturalWidth || targetW,
          img.naturalHeight || targetH,
          -pad,
          -pad,
          targetW + pad * 2,
          targetH + pad * 2,
          background.imageFit || 'cover'
        );
        octx.filter = 'none';
      } else {
        drawCoverFitted(
          octx,
          img,
          img.naturalWidth || targetW,
          img.naturalHeight || targetH,
          0,
          0,
          targetW,
          targetH,
          background.imageFit || 'cover'
        );
      }
    }
    return off;
  };

  const preRenderedBgImage = bgImageEl ? renderBlurredStaticSource(bgImageEl) : null;
  const preRenderedCoverImage = coverImageEl ? renderBlurredStaticSource(coverImageEl) : null;

  // Setup MediaRecorder stream (+ optional video audio track)
  const canvasStream = canvas.captureStream(fps);
  let audioCtx: AudioContext | null = null;
  const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

  if (videoEl && !(background.videoMuted ?? true)) {
    try {
      const capStream =
        (videoEl as unknown as { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream })
          .captureStream?.() ||
        (videoEl as unknown as { mozCaptureStream?: () => MediaStream }).mozCaptureStream?.();

      if (capStream && capStream.getAudioTracks().length > 0) {
        capStream.getAudioTracks().forEach((t) => tracks.push(t));
      } else {
        const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextCtor) {
          audioCtx = new AudioContextCtor();
          const source = audioCtx.createMediaElementSource(videoEl);
          const dest = audioCtx.createMediaStreamDestination();
          source.connect(dest);
          dest.stream.getAudioTracks().forEach((t) => tracks.push(t));
        }
      }
    } catch {
      // Proceed cleanly without audio if browser restricts audio capture
    }
  }

  const combinedStream = new MediaStream(tracks);
  const { mimeType, extension } = getSupportedVideoMimeType();
  const recorderOptions: MediaRecorderOptions = {
    videoBitsPerSecond: 6_000_000,
    ...(mimeType ? { mimeType } : {}),
  };

  const recorder = new MediaRecorder(combinedStream, recorderOptions);
  const chunks: BlobPart[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  // Helper to draw non-video solid/gradient background
  const drawBaseColorOrGradient = () => {
    ctx.save();
    if (blurPx > 0 && (background.type === 'gradient' || background.type === 'solid')) {
      ctx.filter = `blur(${blurPx}px)`;
    }
    if (background.type === 'gradient' && background.gradient?.colors?.length) {
      const pad = blurPx > 0 ? blurPx * 2 : 0;
      if (background.gradient.type === 'radial') {
        const grad = ctx.createRadialGradient(
          targetW / 2,
          targetH / 2,
          0,
          targetW / 2,
          targetH / 2,
          Math.max(targetW, targetH) / 2
        );
        background.gradient.colors.forEach((col, i) =>
          grad.addColorStop(i / Math.max(1, background.gradient.colors.length - 1), col)
        );
        ctx.fillStyle = grad;
      } else {
        const angle = ((background.gradient.angle || 135) * Math.PI) / 180;
        const cx = targetW / 2;
        const cy = targetH / 2;
        const len = Math.sqrt(targetW * targetW + targetH * targetH) / 2;
        const dx = Math.sin(angle) * len;
        const dy = -Math.cos(angle) * len;
        const grad = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
        background.gradient.colors.forEach((col, i) =>
          grad.addColorStop(i / Math.max(1, background.gradient.colors.length - 1), col)
        );
        ctx.fillStyle = grad;
      }
      ctx.fillRect(-pad, -pad, targetW + pad * 2, targetH + pad * 2);
    } else {
      ctx.fillStyle = background.color || '#090a0f';
      ctx.fillRect(0, 0, targetW, targetH);
    }
    ctx.restore();
  };

  const drawFrameAt = (elapsedSec: number) => {
    ctx.clearRect(0, 0, targetW, targetH);
    ctx.fillStyle = background.color || '#090a0f';
    ctx.fillRect(0, 0, targetW, targetH);

    // 1. Background Layer
    if (hasVideoBg && videoEl) {
      if (coverDur > 0 && elapsedSec < coverDur && preRenderedCoverImage) {
        // Phase 1: Intro Cover
        ctx.drawImage(preRenderedCoverImage, 0, 0, targetW, targetH);

        // Smooth crossfade during last 0.3s of cover intro
        const fadeWindow = Math.min(0.3, coverDur * 0.25);
        if (elapsedSec > coverDur - fadeWindow && videoEl.readyState >= 2) {
          const alpha = (elapsedSec - (coverDur - fadeWindow)) / fadeWindow;
          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
          if (blurPx > 0) {
            ctx.filter = `blur(${blurPx}px)`;
            const pad = blurPx * 2;
            drawCoverFitted(
              ctx,
              videoEl,
              videoEl.videoWidth || targetW,
              videoEl.videoHeight || targetH,
              -pad,
              -pad,
              targetW + pad * 2,
              targetH + pad * 2,
              'cover'
            );
          } else {
            drawCoverFitted(
              ctx,
              videoEl,
              videoEl.videoWidth || targetW,
              videoEl.videoHeight || targetH,
              0,
              0,
              targetW,
              targetH,
              'cover'
            );
          }
          ctx.restore();
        }
      } else if (coverMode === 'framed' && preRenderedCoverImage) {
        // Mode: Blurred/Styled Cover Background + Sharp Centered Video Frame
        ctx.drawImage(preRenderedCoverImage, 0, 0, targetW, targetH);

        if (videoEl.readyState >= 2 && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
          const maxFrameW = targetW * 0.88;
          const maxFrameH = targetH * 0.7;
          const vScale = Math.min(maxFrameW / videoEl.videoWidth, maxFrameH / videoEl.videoHeight);
          const fw = videoEl.videoWidth * vScale;
          const fh = videoEl.videoHeight * vScale;
          const fx = (targetW - fw) / 2;
          const fy = (targetH - fh) / 2;
          const radius = 24 * effScale;

          ctx.save();
          ctx.shadowColor = 'rgba(0,0,0,0.65)';
          ctx.shadowBlur = 32 * effScale;
          ctx.shadowOffsetY = 12 * effScale;
          drawRoundedRectPath(ctx, fx, fy, fw, fh, radius);
          ctx.fillStyle = '#000000';
          ctx.fill();
          ctx.restore();

          ctx.save();
          drawRoundedRectPath(ctx, fx, fy, fw, fh, radius);
          ctx.clip();
          ctx.drawImage(videoEl, fx, fy, fw, fh);
          ctx.restore();

          ctx.save();
          drawRoundedRectPath(ctx, fx, fy, fw, fh, radius);
          ctx.strokeStyle = 'rgba(255,255,255,0.22)';
          ctx.lineWidth = Math.max(1.5, 2 * effScale);
          ctx.stroke();
          ctx.restore();
        }
      } else if (videoEl.readyState >= 2) {
        // Fullscreen Video
        ctx.save();
        if (blurPx > 0) {
          ctx.filter = `blur(${blurPx}px)`;
          const pad = blurPx * 2 + 16;
          drawCoverFitted(
            ctx,
            videoEl,
            videoEl.videoWidth || targetW,
            videoEl.videoHeight || targetH,
            -pad,
            -pad,
            targetW + pad * 2,
            targetH + pad * 2,
            'cover'
          );
        } else {
          drawCoverFitted(
            ctx,
            videoEl,
            videoEl.videoWidth || targetW,
            videoEl.videoHeight || targetH,
            0,
            0,
            targetW,
            targetH,
            'cover'
          );
        }
        ctx.restore();
      } else if (preRenderedCoverImage) {
        ctx.drawImage(preRenderedCoverImage, 0, 0, targetW, targetH);
      }
    } else if (background.type === 'image' && preRenderedBgImage) {
      ctx.drawImage(preRenderedBgImage, 0, 0, targetW, targetH);
    } else if (background.type !== 'transparent') {
      drawBaseColorOrGradient();
    }

    // 2. Background Tint Overlay
    if (background.type !== 'transparent' && background.overlayOpacity > 0) {
      ctx.save();
      ctx.fillStyle = background.overlayColor || '#000000';
      ctx.globalAlpha = background.overlayOpacity;
      ctx.fillRect(0, 0, targetW, targetH);
      ctx.restore();
    }

    // 3. Canvas Elements (Text & Stickers)
    for (const el of visibleElements) {
      ctx.save();
      if (el.type === 'text') {
        const tEl = el as CanvasTextElement;
        const anim = computeAnimationTransform(tEl, elapsedSec, effScale);

        const baseX = tEl.x * effScale + anim.translateX;
        const baseY = tEl.y * effScale + anim.translateY;
        const fontSize = tEl.fontSize * effScale;
        const boxMaxWidth = (tEl.width || 800) * effScale;
        const fontStyle = tEl.fontStyle === 'italic' ? 'italic ' : '';
        const fontWeight = tEl.fontWeight ? `${tEl.fontWeight} ` : '';
        ctx.font = `${fontStyle}${fontWeight}${fontSize}px ${tEl.fontFamily}`;

        let rawText = tEl.text;
        if (tEl.textTransform === 'uppercase') rawText = rawText.toUpperCase();
        else if (tEl.textTransform === 'lowercase') rawText = rawText.toLowerCase();

        const letterSpacing = (tEl.letterSpacing || 0) * effScale + anim.extraLetterSpacing;
        const lines = wrapTextLines(ctx, rawText, boxMaxWidth, letterSpacing);
        const lineHeight = fontSize * (tEl.lineHeight || 1.1);
        const blockHeight = Math.max(lineHeight, lines.length * lineHeight);

        const lineWidths = lines.map(
          (l) => ctx.measureText(l).width + Math.max(0, l.length - 1) * letterSpacing
        );
        const maxLineW = Math.min(boxMaxWidth, Math.max(...lineWidths, fontSize));
        const anchorW = tEl.textAlign === 'center' ? boxMaxWidth : tEl.textAlign === 'right' ? boxMaxWidth : maxLineW;

        ctx.globalAlpha = Math.max(0, Math.min(1, (tEl.opacity ?? 1) * anim.opacityMult));

        // Apply rotation & animation scale around element center
        const pivotX = baseX + anchorW / 2;
        const pivotY = baseY + blockHeight / 2;
        ctx.translate(pivotX, pivotY);
        const totalRot = ((tEl.rotation || 0) + anim.rotateDeg) * (Math.PI / 180);
        if (totalRot !== 0) ctx.rotate(totalRot);
        if (anim.skewXDeg !== 0) ctx.transform(1, 0, Math.tan((anim.skewXDeg * Math.PI) / 180), 1, 0, 0);
        if (anim.scaleX !== 1 || anim.scaleY !== 1) ctx.scale(anim.scaleX, anim.scaleY);
        ctx.translate(-anchorW / 2, -blockHeight / 2);

        const filterParts: string[] = [];
        if (anim.hueRotateDeg !== 0) filterParts.push(`hue-rotate(${anim.hueRotateDeg}deg)`);
        if (anim.brightnessMult !== 1) filterParts.push(`brightness(${anim.brightnessMult})`);
        if (filterParts.length > 0) ctx.filter = filterParts.join(' ');

        // Background Box / Pill
        if (tEl.backgroundColor) {
          const pad = (tEl.backgroundPadding || 0) * effScale;
          const radius = (tEl.borderRadius || 0) * effScale;
          const bgW = maxLineW + pad * 2;
          const bgH = blockHeight + pad * 2;
          let bgX = -pad;
          if (tEl.textAlign === 'center') bgX = (anchorW - maxLineW) / 2 - pad;
          else if (tEl.textAlign === 'right') bgX = anchorW - maxLineW - pad;

          ctx.save();
          drawRoundedRectPath(ctx, bgX, -pad, bgW, bgH, radius);
          ctx.fillStyle = tEl.backgroundColor;
          ctx.fill();
          ctx.restore();
        }

        // Shadow
        if (tEl.shadow && tEl.shadow.enabled) {
          ctx.shadowColor = tEl.shadow.color || '#000000';
          ctx.shadowBlur = (tEl.shadow.blur || 12) * effScale + anim.extraGlowPx;
          ctx.shadowOffsetX = (tEl.shadow.offsetX || 0) * effScale;
          ctx.shadowOffsetY = (tEl.shadow.offsetY || 4) * effScale;
        } else if (anim.extraGlowPx > 0) {
          ctx.shadowColor = tEl.color || '#ffffff';
          ctx.shadowBlur = anim.extraGlowPx;
        }

        // Text Gradient or Solid Fill
        if (tEl.gradient?.enabled && tEl.gradient.stops?.length) {
          const grad = ctx.createLinearGradient(0, 0, anchorW, blockHeight);
          tEl.gradient.stops.forEach((s) => grad.addColorStop(s.offset / 100, s.color));
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = tEl.color || '#ffffff';
        }

        ctx.textBaseline = 'top';
        ctx.textAlign = tEl.textAlign === 'center' ? 'center' : tEl.textAlign === 'right' ? 'right' : 'left';
        const drawX = tEl.textAlign === 'center' ? anchorW / 2 : tEl.textAlign === 'right' ? anchorW : 0;

        lines.forEach((line, idx) => {
          const yPos = idx * lineHeight;
          ctx.fillText(line, drawX, yPos);
          if (tEl.stroke && tEl.stroke.enabled && tEl.stroke.width > 0) {
            ctx.strokeStyle = tEl.stroke.color || '#ffffff';
            ctx.lineWidth = tEl.stroke.width * effScale;
            ctx.strokeText(line, drawX, yPos);
          }
        });
      } else if (el.type === 'image') {
        const imgEl = el as CanvasImageElement;
        const loadedImg = elementImagesMap.get(imgEl.id);
        if (loadedImg) {
          const drawW = imgEl.width * (imgEl.scale || 1) * effScale;
          const naturalRatio = (loadedImg.naturalHeight || 1) / (loadedImg.naturalWidth || 1);
          const drawH = drawW * naturalRatio;
          const x = imgEl.x * effScale;
          const y = imgEl.y * effScale;

          ctx.globalAlpha = imgEl.opacity ?? 1;
          ctx.globalCompositeOperation =
            (imgEl.blendMode && imgEl.blendMode !== 'normal' ? imgEl.blendMode : 'source-over') as GlobalCompositeOperation;

          const f = imgEl.filter;
          if (f) {
            ctx.filter = `brightness(${f.brightness ?? 100}%) contrast(${f.contrast ?? 100}%) blur(${(f.blur ?? 0) * effScale}px) saturate(${f.saturate ?? 100}%)`;
          }

          ctx.translate(x + drawW / 2, y + drawH / 2);
          if (imgEl.rotation) ctx.rotate((imgEl.rotation * Math.PI) / 180);
          ctx.scale(imgEl.flipX ? -1 : 1, imgEl.flipY ? -1 : 1);

          if (imgEl.borderRadius > 0) {
            drawRoundedRectPath(ctx, -drawW / 2, -drawH / 2, drawW, drawH, imgEl.borderRadius * effScale);
            ctx.clip();
          }
          ctx.drawImage(loadedImg, -drawW / 2, -drawH / 2, drawW, drawH);
        }
      }
      ctx.restore();
    }
  };

  return await new Promise<VideoExportResult>((resolve, reject) => {
    let finished = false;
    let rafId = 0;
    let videoStarted = false;

    const cleanupAll = () => {
      cancelAnimationFrame(rafId);
      try {
        videoEl?.pause();
        if (videoEl) videoEl.src = '';
      } catch {
        // Ignore
      }
      try {
        audioCtx?.close();
      } catch {
        // Ignore
      }
    };

    if (signal) {
      signal.addEventListener('abort', () => {
        if (finished) return;
        finished = true;
        try {
          if (recorder.state !== 'inactive') recorder.stop();
        } catch {
          // Ignore
        }
        cleanupAll();
        reject(new DOMException('Esportazione video annullata', 'AbortError'));
      });
    }

    recorder.onstop = () => {
      if (finished) return;
      finished = true;
      cleanupAll();

      const finalMime = mimeType || 'video/webm';
      const blob = new Blob(chunks, { type: finalMime });
      if (blob.size < 100) {
        reject(new Error('Il video generato è vuoto. Riprova con un altro formato o durata.'));
        return;
      }
      const url = URL.createObjectURL(blob);
      const safeName = fileName
        ? fileName.endsWith(`.${extension}`)
          ? fileName
          : `${fileName}.${extension}`
        : `social-type-video-${format.id}-${Date.now()}.${extension}`;
      downloadFile(url, safeName);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      triggerExportConfetti();
      onProgress?.(100, 'Video completato!');
      resolve({ mimeType: finalMime, extension, duration: totalDuration });
    };

    recorder.onerror = () => {
      if (finished) return;
      finished = true;
      cleanupAll();
      reject(new Error('Errore durante la codifica del video.'));
    };

    // Draw initial frame before starting recorder
    drawFrameAt(0);
    recorder.start(200);
    const startTime = performance.now();

    // If no intro cover, start video immediately
    if (videoEl && coverDur === 0) {
      videoStarted = true;
      videoEl.currentTime = 0;
      videoEl.play().catch(() => {});
    }

    const step = () => {
      if (finished) return;
      const elapsedSec = (performance.now() - startTime) / 1000;

      // Transition from cover intro to video playback
      if (videoEl && !videoStarted && elapsedSec >= coverDur) {
        videoStarted = true;
        videoEl.currentTime = 0;
        videoEl.play().catch(() => {});
      }

      drawFrameAt(elapsedSec);

      const pct = Math.min(99, Math.round((elapsedSec / totalDuration) * 100));
      const stageLabel =
        coverDur > 0 && elapsedSec < coverDur
          ? `Rendering Copertina (${elapsedSec.toFixed(1)}s / ${coverDur.toFixed(1)}s)...`
          : hasVideoBg
          ? `Registrazione Video (${elapsedSec.toFixed(1)}s / ${totalDuration.toFixed(1)}s)...`
          : `Rendering Animazione (${elapsedSec.toFixed(1)}s / ${totalDuration.toFixed(1)}s)...`;

      onProgress?.(pct, stageLabel);

      if (elapsedSec >= totalDuration || (videoStarted && videoEl && videoEl.ended)) {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
        return;
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
  });
}
