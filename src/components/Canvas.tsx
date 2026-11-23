import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { CanvasBackground, CanvasElement, CanvasTextElement, FormatConfig } from '../types';
import { ElementView } from './ElementView';
import { SafeZoneOverlay } from './SafeZoneOverlay';
import { getAllAnimationsCss } from '../data/animations';
import { FONTS_LIST, loadSingleFont } from '../data/fonts';
import {
  RotateCw,
  Maximize2,
  Trash2,
  Copy,
  Type,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Minus,
  Sparkles,
  Palette,
  ChevronUp,
  ChevronDown,
  Lock,
  Unlock,
  Film,
  Image as ImageIcon,
  PlayCircle,
} from 'lucide-react';

interface CanvasProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  format: FormatConfig;
  background: CanvasBackground;
  elements: CanvasElement[];
  selectedId: string | null;
  zoomLevel: number;
  playAnimations: boolean;
  showSafeZone: boolean;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDuplicateElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
  onAddText?: () => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  canvasRef,
  format,
  background,
  elements,
  selectedId,
  zoomLevel,
  playAnimations,
  showSafeZone,
  onSelectElement,
  onUpdateElement,
  onDuplicateElement,
  onDeleteElement,
  onAddText,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 700,
    height: 750,
  });

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [elementStartPos, setElementStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Rotating & Resizing state
  const [isRotating, setIsRotating] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isResizingWidth, setIsResizingWidth] = useState(false);
  const [resizeStart, setResizeStart] = useState<{
    x: number;
    y: number;
    initialSize: number;
    initialWidth: number;
    boxWidthPx: number;
  }>({
    x: 0,
    y: 0,
    initialSize: 50,
    initialWidth: 600,
    boxWidthPx: 200,
  });
  const [measuredBox, setMeasuredBox] = useState<{ width: number; height: number } | null>(null);

  // Video + Copertina preview state
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const [previewLayer, setPreviewLayer] = useState<'auto' | 'cover' | 'video'>('auto');
  const [showingIntroCover, setShowingIntroCover] = useState<boolean>(false);
  const introTimerRef = useRef<number | null>(null);

  const hasVideoAndCover = background.type === 'video' && Boolean(background.video) && Boolean(background.coverImage);
  const coverMode = background.coverMode || 'intro';
  const coverDurationMs = Math.max(500, (background.coverDuration ?? 2) * 1000);

  // Manage Intro Copertina -> Video sequence playback
  useEffect(() => {
    if (introTimerRef.current) {
      window.clearTimeout(introTimerRef.current);
      introTimerRef.current = null;
    }

    if (!hasVideoAndCover) {
      setShowingIntroCover(false);
      return;
    }

    if (previewLayer === 'cover') {
      setShowingIntroCover(true);
      if (bgVideoRef.current) {
        bgVideoRef.current.pause();
        bgVideoRef.current.currentTime = 0;
      }
      return;
    }

    if (previewLayer === 'video' || coverMode !== 'intro') {
      setShowingIntroCover(false);
      if (bgVideoRef.current && bgVideoRef.current.paused) {
        bgVideoRef.current.play().catch(() => {});
      }
      return;
    }

    // Auto sequence in 'intro' mode: show cover for coverDurationMs, then play video
    setShowingIntroCover(true);
    if (bgVideoRef.current) {
      bgVideoRef.current.pause();
      bgVideoRef.current.currentTime = 0;
    }

    introTimerRef.current = window.setTimeout(() => {
      setShowingIntroCover(false);
      if (bgVideoRef.current) {
        bgVideoRef.current.currentTime = 0;
        bgVideoRef.current.play().catch(() => {});
      }
    }, coverDurationMs);

    return () => {
      if (introTimerRef.current) {
        window.clearTimeout(introTimerRef.current);
        introTimerRef.current = null;
      }
    };
  }, [hasVideoAndCover, background.video, background.coverImage, coverMode, coverDurationMs, previewLayer]);

  const handleVideoEnded = () => {
    if (hasVideoAndCover && coverMode === 'intro' && previewLayer === 'auto' && (background.videoLoop ?? true)) {
      setShowingIntroCover(true);
      if (bgVideoRef.current) {
        bgVideoRef.current.pause();
        bgVideoRef.current.currentTime = 0;
      }
      if (introTimerRef.current) window.clearTimeout(introTimerRef.current);
      introTimerRef.current = window.setTimeout(() => {
        setShowingIntroCover(false);
        if (bgVideoRef.current) {
          bgVideoRef.current.currentTime = 0;
          bgVideoRef.current.play().catch(() => {});
        }
      }, coverDurationMs);
    }
  };

  // Calculate container bounds on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth - 40,
          height: containerRef.current.clientHeight - 40,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Compute Base Canvas Display Scale to fit container comfortably
  const paddingMargin = 48;
  const maxAvailableW = Math.max(280, containerSize.width - paddingMargin);
  const maxAvailableH = Math.max(280, containerSize.height - paddingMargin);

  const scaleW = maxAvailableW / format.width;
  const scaleH = maxAvailableH / format.height;
  const baseScale = Math.min(scaleW, scaleH);
  const effectiveScale = baseScale * (zoomLevel / 100);

  const canvasDisplayWidth = format.width * effectiveScale;
  const canvasDisplayHeight = format.height * effectiveScale;

  const selectedElement = elements.find((el) => el.id === selectedId);
  const selectedText = selectedElement?.type === 'text' ? (selectedElement as CanvasTextElement) : null;

  // Background CSS construction
  let backgroundStyle: React.CSSProperties = {
    backgroundColor: background.color || '#090a0f',
  };

  if (background.type === 'solid') {
    backgroundStyle = { backgroundColor: background.color };
  } else if (background.type === 'gradient') {
    if (background.gradient.type === 'radial') {
      backgroundStyle = {
        backgroundImage: `radial-gradient(circle at center, ${background.gradient.colors.join(', ')})`,
      };
    } else {
      backgroundStyle = {
        backgroundImage: `linear-gradient(${background.gradient.angle}deg, ${background.gradient.colors.join(', ')})`,
      };
    }
  } else if (background.type === 'image' && background.image) {
    backgroundStyle = {
      backgroundImage: `url(${background.image})`,
      backgroundSize: background.imageFit,
      backgroundPosition: 'center',
      backgroundRepeat: background.imageFit === 'tile' ? 'repeat' : 'no-repeat',
    };
  } else if (background.type === 'transparent') {
    backgroundStyle = {
      backgroundColor: 'transparent',
      backgroundImage:
        'radial-gradient(#27272a 15%, transparent 16%), radial-gradient(#27272a 15%, transparent 16%)',
      backgroundSize: '16px 16px',
      backgroundPosition: '0 0, 8px 8px',
    };
  }

  // Measure exact rendered dimensions of selected element for accurate selection box
  useLayoutEffect(() => {
    if (!selectedElement) {
      setMeasuredBox(null);
      return;
    }
    const domEl = document.getElementById(`canvas-elem-${selectedElement.id}`);
    if (!domEl) {
      setMeasuredBox(null);
      return;
    }

    const syncSize = () => {
      setMeasuredBox({
        width: domEl.offsetWidth,
        height: domEl.offsetHeight,
      });
    };

    syncSize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncSize) : null;
    ro?.observe(domEl);
    return () => ro?.disconnect();
  }, [selectedElement, effectiveScale, elements]);

  // Pointer Drag on Element
  const handleStartDrag = (id: string, e: React.PointerEvent) => {
    e.stopPropagation();
    const elem = elements.find((el) => el.id === id);
    if (!elem || elem.locked) return;

    onSelectElement(id);
    setActiveDragId(id);
    setIsDragging(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setElementStartPos({ x: elem.x, y: elem.y });
  };

  // Global window pointer listeners so drag/resize/rotate NEVER get stuck or blocked
  useEffect(() => {
    if (!isDragging && !isRotating && !isResizing && !isResizingWidth) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      if (isDragging && activeDragId) {
        const deltaX = (e.clientX - dragStartPos.x) / effectiveScale;
        const deltaY = (e.clientY - dragStartPos.y) / effectiveScale;
        const newX = Math.round(elementStartPos.x + deltaX);
        const newY = Math.round(elementStartPos.y + deltaY);
        onUpdateElement(activeDragId, { x: newX, y: newY });
      } else if (isRotating && selectedElement && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const boxW =
          measuredBox?.width ??
          (selectedElement.type === 'text'
            ? (selectedElement.width || 300) * effectiveScale
            : selectedElement.width * selectedElement.scale * effectiveScale);
        const boxH =
          measuredBox?.height ??
          (selectedElement.type === 'text'
            ? selectedElement.fontSize * (selectedElement.lineHeight || 1.2) * effectiveScale
            : (selectedElement.height || 100) * selectedElement.scale * effectiveScale);

        const elemCenterX = rect.left + selectedElement.x * effectiveScale + boxW / 2;
        const elemCenterY = rect.top + selectedElement.y * effectiveScale + boxH / 2;
        const angleRad = Math.atan2(e.clientY - elemCenterY, e.clientX - elemCenterX);
        let angleDeg = Math.round((angleRad * 180) / Math.PI) + 90;
        if (angleDeg > 180) angleDeg -= 360;
        onUpdateElement(selectedElement.id, { rotation: angleDeg });
      } else if (isResizing && selectedElement) {
        const scaleDelta = (e.clientX - resizeStart.x + (e.clientY - resizeStart.y)) / 2;
        const ratio = Math.max(0.2, (resizeStart.boxWidthPx + scaleDelta) / Math.max(60, resizeStart.boxWidthPx));
        if (selectedElement.type === 'text') {
          const newFontSize = Math.max(12, Math.min(280, Math.round(resizeStart.initialSize * ratio)));
          const newWidth = Math.max(120, Math.min(format.width * 1.6, Math.round(resizeStart.initialWidth * ratio)));
          onUpdateElement(selectedElement.id, { fontSize: newFontSize, width: newWidth });
        } else if (selectedElement.type === 'image') {
          const newScale = Math.max(0.15, Math.min(6, resizeStart.initialSize * ratio));
          onUpdateElement(selectedElement.id, { scale: Number(newScale.toFixed(2)) });
        }
      } else if (isResizingWidth && selectedElement && selectedElement.type === 'text') {
        const deltaX = (e.clientX - resizeStart.x) / effectiveScale;
        const newWidth = Math.max(120, Math.min(format.width * 1.6, Math.round(resizeStart.initialWidth + deltaX)));
        onUpdateElement(selectedElement.id, { width: newWidth });
      }
    };

    const handleWindowPointerUp = () => {
      setIsDragging(false);
      setActiveDragId(null);
      setIsRotating(false);
      setIsResizing(false);
      setIsResizingWidth(false);
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, [
    isDragging,
    isRotating,
    isResizing,
    isResizingWidth,
    activeDragId,
    dragStartPos,
    elementStartPos,
    resizeStart,
    selectedElement,
    measuredBox,
    effectiveScale,
    format.width,
    canvasRef,
    onUpdateElement,
  ]);

  const selectionBoxWidth =
    measuredBox?.width ??
    (selectedElement
      ? (selectedElement.type === 'text'
          ? selectedElement.width || 300
          : selectedElement.width * selectedElement.scale) * effectiveScale
      : 100);

  const selectionBoxHeight =
    measuredBox?.height ??
    (selectedElement
      ? (selectedElement.type === 'text'
          ? selectedElement.fontSize * (selectedElement.lineHeight || 1.2) * 1.4
          : (selectedElement.height || 100) * selectedElement.scale) * effectiveScale
      : 60);

  return (
    <div
      ref={containerRef}
      id="canvas-viewport-container"
      className="relative flex-1 h-full w-full bg-slate-950 flex flex-col items-center justify-center overflow-hidden p-3 sm:p-6 select-none"
      onClick={() => onSelectElement(null)}
    >
      {/* Sleek Interface Blueprint Dot Matrix Background */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Inject Keyframe Animations dynamically */}
      <style>{getAllAnimationsCss()}</style>

      {/* Top Floating Quick Contextual Toolbar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="z-30 mb-3 px-3 py-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl flex flex-wrap items-center gap-2 max-w-full overflow-x-auto"
      >
        {selectedText ? (
          <>
            {/* Quick Font Selector */}
            <div className="flex items-center gap-1.5 border-r border-slate-800 pr-2">
              <Type className="w-4 h-4 text-indigo-400 shrink-0" />
              <select
                value={selectedText.fontFamily || "'Bebas Neue', cursive"}
                onChange={(e) => {
                  const fontObj = FONTS_LIST.find((f) => f.family === e.target.value);
                  if (fontObj) loadSingleFont(fontObj.googleFont);
                  onUpdateElement(selectedText.id, { fontFamily: e.target.value });
                }}
                className="bg-slate-950 border border-slate-700/80 rounded-md px-2 py-1 text-xs text-slate-100 font-medium focus:outline-none focus:border-indigo-500 max-w-[150px] truncate"
              >
                {FONTS_LIST.map((f) => (
                  <option key={f.name} value={f.family} style={{ fontFamily: f.family }}>
                    {f.name} ({f.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Font Size Buttons */}
            <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
              <button
                type="button"
                onClick={() =>
                  onUpdateElement(selectedText.id, { fontSize: Math.max(12, selectedText.fontSize - 4) })
                }
                className="p-1 hover:bg-slate-800 text-slate-300 rounded"
                title="Riduci font"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono text-slate-200 px-1">{selectedText.fontSize}px</span>
              <button
                type="button"
                onClick={() =>
                  onUpdateElement(selectedText.id, { fontSize: Math.min(260, selectedText.fontSize + 4) })
                }
                className="p-1 hover:bg-slate-800 text-slate-300 rounded"
                title="Ingrandisci font"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Color Picker */}
            <div className="flex items-center gap-1.5 border-r border-slate-800 pr-2">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(selectedText.color || '') ? selectedText.color : '#ffffff'}
                onChange={(e) =>
                  onUpdateElement(selectedText.id, {
                    color: e.target.value,
                    gradient: { ...selectedText.gradient, enabled: false },
                  })
                }
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                title="Colore testo"
              />
            </div>

            {/* Bold / Italic / Upper */}
            <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
              <button
                type="button"
                onClick={() =>
                  onUpdateElement(selectedText.id, {
                    fontWeight: selectedText.fontWeight >= 700 ? 400 : 700,
                  })
                }
                className={`p-1.5 rounded transition ${
                  selectedText.fontWeight >= 700 ? 'bg-indigo-600/30 text-indigo-400 font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Grassetto"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateElement(selectedText.id, {
                    fontStyle: selectedText.fontStyle === 'italic' ? 'normal' : 'italic',
                  })
                }
                className={`p-1.5 rounded transition ${
                  selectedText.fontStyle === 'italic' ? 'bg-indigo-600/30 text-indigo-400' : 'text-slate-400 hover:text-white'
                }`}
                title="Corsivo"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateElement(selectedText.id, {
                    textTransform: selectedText.textTransform === 'uppercase' ? 'none' : 'uppercase',
                  })
                }
                className={`px-1.5 py-0.5 text-[11px] font-bold rounded transition ${
                  selectedText.textTransform === 'uppercase' ? 'bg-indigo-600/30 text-indigo-400' : 'text-slate-400 hover:text-white'
                }`}
                title="Tutto Maiuscolo"
              >
                AA
              </button>
            </div>

            {/* Alignments */}
            <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
              <button
                type="button"
                onClick={() => onUpdateElement(selectedText.id, { textAlign: 'left' })}
                className={`p-1.5 rounded ${selectedText.textAlign === 'left' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onUpdateElement(selectedText.id, { textAlign: 'center' })}
                className={`p-1.5 rounded ${selectedText.textAlign === 'center' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onUpdateElement(selectedText.id, { textAlign: 'right' })}
                className={`p-1.5 rounded ${selectedText.textAlign === 'right' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Actions (Duplicate, Delete) */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onDuplicateElement(selectedText.id)}
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition"
                title="Duplica"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDeleteElement(selectedText.id)}
                className="p-1.5 hover:bg-rose-950/80 text-rose-400 rounded transition"
                title="Elimina"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">Strumenti Rapidi:</span>
            {onAddText && (
              <button
                type="button"
                onClick={() => onAddText()}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Aggiungi Testo
              </button>
            )}
            <span className="text-xs text-slate-500">
              {elements.length} elementi nella tavola da disegno • Fai doppio clic su un testo per modificarlo
            </span>
          </div>
        )}
      </div>

      {/* Artboard Wrapper (allows selection handles to sit above elements without overflow clipping) */}
      <div
        className="relative z-10"
        style={{
          width: `${canvasDisplayWidth}px`,
          height: `${canvasDisplayHeight}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Artboard Stage */}
        <div
          ref={canvasRef}
          id="social-artboard-stage"
          className="relative w-full h-full shadow-2xl shadow-black transition-all rounded-2xl sm:rounded-[1.75rem] overflow-hidden border-[6px] border-slate-900"
          style={{
            ...(background.type === 'transparent' ? backgroundStyle : { backgroundColor: background.color || '#090a0f' }),
          }}
        >
          {/* Layer 1: Dedicated Background Layer with Independent Blur */}
          {background.type !== 'transparent' && (
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden"
              style={{
                ...(background.type !== 'video' ? backgroundStyle : {}),
                filter: background.blur > 0 ? `blur(${background.blur}px)` : 'none',
                transform: background.blur > 0 ? 'scale(1.12)' : 'none',
                transition: 'filter 0.15s ease-out, transform 0.15s ease-out',
              }}
            >
              {/* Framed mode: Cover fills the blurred background */}
              {background.type === 'video' && background.coverImage && coverMode === 'framed' && (
                <img
                  src={background.coverImage}
                  alt="Copertina sfondo"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
              )}

              {/* Fullscreen video (+ Intro Cover overlay) when NOT in framed mode */}
              {background.type === 'video' && background.video && coverMode !== 'framed' && (
                <>
                  <video
                    ref={bgVideoRef}
                    src={background.video}
                    poster={background.coverImage}
                    autoPlay={!(hasVideoAndCover && coverMode === 'intro') && previewLayer !== 'cover'}
                    loop={!(hasVideoAndCover && coverMode === 'intro' && previewLayer === 'auto') && (background.videoLoop ?? true)}
                    muted={background.videoMuted ?? true}
                    playsInline
                    onEnded={handleVideoEnded}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                  {background.coverImage && (showingIntroCover || previewLayer === 'cover') && (
                    <img
                      src={background.coverImage}
                      alt="Copertina video"
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300"
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* Framed Mode Sharp Video Card in Front of Blurred Cover */}
          {background.type === 'video' && background.video && coverMode === 'framed' && (
            <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
              {previewLayer === 'cover' && background.coverImage ? (
                <img
                  src={background.coverImage}
                  alt="Anteprima Copertina"
                  className="max-w-[90%] max-h-[72%] w-auto h-auto rounded-2xl shadow-2xl border border-white/20 object-contain pointer-events-none"
                />
              ) : (
                <video
                  ref={bgVideoRef}
                  src={background.video}
                  poster={background.coverImage}
                  autoPlay
                  loop={background.videoLoop ?? true}
                  muted={background.videoMuted ?? true}
                  playsInline
                  className="max-w-[90%] max-h-[72%] w-auto h-auto rounded-2xl shadow-2xl border border-white/20 object-contain pointer-events-none bg-black"
                />
              )}
            </div>
          )}

          {/* Layer 2: Independent Background Dark Veil / Tint Overlay */}
          {background.type !== 'transparent' && background.overlayOpacity > 0 && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundColor: background.overlayColor || '#000000',
                opacity: background.overlayOpacity,
              }}
            />
          )}

          {/* Render Canvas Elements */}
          {elements.map((element) => (
            <ElementView
              key={element.id}
              element={element}
              isSelected={element.id === selectedId}
              scaleRatio={effectiveScale}
              playAnimations={playAnimations}
              onSelect={(id, e) => {
                e.stopPropagation();
                onSelectElement(id);
              }}
              onStartDrag={handleStartDrag}
              onUpdateText={(id, newText) => onUpdateElement(id, { text: newText })}
            />
          ))}

          {/* Social Format Safe Zone Guide Overlay */}
          {showSafeZone && format.safeZoneGuide && (
            <SafeZoneOverlay canvasWidth={canvasDisplayWidth} canvasHeight={canvasDisplayHeight} />
          )}
        </div>

        {/* Selected Element Transform Bounding Controls (Elevated z-40 & Unclipped) */}
        {selectedElement && !selectedElement.locked && !selectedElement.hidden && (
          <div
            className="canvas-selection-box absolute pointer-events-none border-2 border-indigo-400/90 rounded z-40"
            style={{
              left: `${selectedElement.x * effectiveScale + 6}px`,
              top: `${selectedElement.y * effectiveScale + 6}px`,
              marginLeft: '-4px',
              marginTop: '-4px',
              width: `${selectionBoxWidth + 8}px`,
              height: `${selectionBoxHeight + 8}px`,
              transform: `rotate(${selectedElement.rotation}deg)`,
              transformOrigin: '4px 4px',
            }}
          >
            {/* Rotate Handle */}
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                setIsRotating(true);
              }}
              className="pointer-events-auto absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg border border-white"
              title="Ruota elemento"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </div>

            {/* Right-Edge Width Handle (for Text Box Width / Lunghezza) */}
            {selectedElement.type === 'text' && (
              <div
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setIsResizingWidth(true);
                  setResizeStart({
                    x: e.clientX,
                    y: e.clientY,
                    initialSize: selectedElement.fontSize,
                    initialWidth: selectedElement.width || 600,
                    boxWidthPx: selectionBoxWidth,
                  });
                }}
                className="pointer-events-auto absolute top-1/2 -right-2 -translate-y-1/2 w-3 h-7 bg-white hover:bg-indigo-200 rounded-full cursor-ew-resize shadow-md border-2 border-indigo-600"
                title="Allarga / restringi riquadro testo"
              />
            )}

            {/* Corner Scale Handle (Ingrandisce / riduce tutto proporzionalmente) */}
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                setIsResizing(true);
                setResizeStart({
                  x: e.clientX,
                  y: e.clientY,
                  initialSize:
                    selectedElement.type === 'text' ? selectedElement.fontSize : selectedElement.scale,
                  initialWidth: selectedElement.width || 600,
                  boxWidthPx: selectionBoxWidth,
                });
              }}
              className="pointer-events-auto absolute -bottom-3 -right-3 w-6 h-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center cursor-se-resize shadow-lg border border-white"
              title="Ridimensiona grandezza testo/elemento"
            >
              <Maximize2 className="w-3 h-3" />
            </div>
          </div>
        )}
      </div>

      {/* Canvas Dimensions Badge Bottom Left */}
      <div className="absolute bottom-3 left-4 sm:bottom-4 sm:left-6 pointer-events-none bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 flex items-center gap-2 shadow-xl z-20">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="text-slate-300 font-medium">
          {format.name} • {format.width} × {format.height}px ({format.ratio})
        </span>
      </div>

      {/* Video + Copertina Preview Switcher Bottom Right */}
      {hasVideoAndCover && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-3 right-4 sm:bottom-4 sm:right-6 bg-slate-900/95 backdrop-blur-md border border-indigo-500/40 px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-xl z-20"
        >
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mr-1">Anteprima:</span>
          <button
            type="button"
            onClick={() => setPreviewLayer('auto')}
            className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
              previewLayer === 'auto'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <PlayCircle className="w-3 h-3" />
            {coverMode === 'intro' ? 'Sequenza' : 'Insieme'}
          </button>
          <button
            type="button"
            onClick={() => setPreviewLayer('cover')}
            className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
              previewLayer === 'cover'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            Copertina
          </button>
          <button
            type="button"
            onClick={() => setPreviewLayer('video')}
            className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
              previewLayer === 'video'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Film className="w-3 h-3" />
            Video
          </button>
        </div>
      )}
    </div>
  );
};
