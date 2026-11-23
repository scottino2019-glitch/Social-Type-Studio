import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CanvasBackground,
  CanvasElement,
  CanvasTextElement,
  CanvasImageElement,
  FormatConfig,
  StylePreset,
  ProjectTemplate,
} from './types';
import { SOCIAL_FORMATS } from './data/formats';
import { loadAllFonts } from './data/fonts';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { ExportModal } from './components/ExportModal';

interface HistoryState {
  elements: CanvasElement[];
  background: CanvasBackground;
  format: FormatConfig;
}

export default function App() {
  const [projectName, setProjectName] = useState<string>('Mio Post Social');
  const [currentFormat, setCurrentFormat] = useState<FormatConfig>(SOCIAL_FORMATS[0]); // Instagram Story 9:16 default
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [playAnimations, setPlayAnimations] = useState<boolean>(true);
  const [showSafeZone, setShowSafeZone] = useState<boolean>(true);
  const [selectedId, setSelectedId] = useState<string | null>('elem-init-text-1');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportInitialTab, setExportInitialTab] = useState<'image' | 'video' | 'html' | 'project' | undefined>(undefined);

  // Background State
  const [background, setBackground] = useState<CanvasBackground>({
    type: 'gradient',
    color: '#090a0f',
    gradient: {
      type: 'linear',
      angle: 150,
      colors: ['#0f0c1b', '#1a0b2e', '#090a0f'],
    },
    coverMode: 'intro',
    coverDuration: 2,
    overlayColor: '#000000',
    overlayOpacity: 0.1,
    blur: 0,
    imageFit: 'cover',
  });

  // Canvas Elements State
  const [elements, setElements] = useState<CanvasElement[]>([
    {
      type: 'text',
      id: 'elem-init-text-tag',
      text: '✦ TRENDING 2026 ✦',
      fontFamily: "'Outfit', sans-serif",
      fontSize: 28,
      fontWeight: 800,
      fontStyle: 'normal',
      textTransform: 'uppercase',
      textAlign: 'center',
      letterSpacing: 5,
      lineHeight: 1.2,
      color: '#38bdf8',
      backgroundColor: 'rgba(56, 189, 248, 0.12)',
      backgroundPadding: 14,
      borderRadius: 999,
      gradient: { enabled: false, type: 'linear', angle: 0, stops: [] },
      stroke: { enabled: false, color: '#000', width: 0 },
      shadow: { enabled: true, color: '#38bdf8', blur: 16, offsetX: 0, offsetY: 0, preset: 'neon' },
      animation: { type: 'neon-pulse', duration: 1.8, delay: 0, iterationCount: 'infinite' },
      opacity: 1,
      x: 300,
      y: 460,
      width: 480,
      height: 60,
      rotation: 0,
      zIndex: 2,
    },
    {
      type: 'text',
      id: 'elem-init-text-1',
      text: 'CREA IL TUO\nSTILE SOCIAL',
      fontFamily: "'Orbitron', sans-serif",
      fontSize: 88,
      fontWeight: 900,
      fontStyle: 'normal',
      textTransform: 'uppercase',
      textAlign: 'center',
      letterSpacing: 3,
      lineHeight: 1.1,
      color: '#00f0ff',
      gradient: {
        enabled: true,
        type: 'linear',
        angle: 90,
        stops: [
          { color: '#00f0ff', offset: 0 },
          { color: '#ff007b', offset: 100 },
        ],
      },
      stroke: { enabled: true, color: '#ffffff', width: 1 },
      shadow: { enabled: true, color: '#00f0ff', blur: 30, offsetX: 0, offsetY: 0, preset: 'neon' },
      animation: { type: 'floating', duration: 2.8, delay: 0, iterationCount: 'infinite' },
      opacity: 1,
      x: 100,
      y: 720,
      width: 880,
      height: 220,
      rotation: 0,
      zIndex: 3,
    },
    {
      type: 'text',
      id: 'elem-init-text-sub',
      text: 'Font artistici, animazioni grafiche ed export in alta definizione',
      fontFamily: "'Dancing Script', cursive",
      fontSize: 44,
      fontWeight: 700,
      fontStyle: 'normal',
      textTransform: 'none',
      textAlign: 'center',
      letterSpacing: 1,
      lineHeight: 1.3,
      color: '#fbcfe8',
      gradient: { enabled: false, type: 'linear', angle: 0, stops: [] },
      stroke: { enabled: false, color: '#000', width: 0 },
      shadow: { enabled: true, color: 'rgba(0,0,0,0.8)', blur: 12, offsetX: 0, offsetY: 4, preset: 'soft' },
      animation: { type: 'slide-up', duration: 2.2, delay: 0, iterationCount: 'infinite' },
      opacity: 1,
      x: 140,
      y: 1140,
      width: 800,
      height: 120,
      rotation: -1,
      zIndex: 4,
    },
  ]);

  // History for Undo/Redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isHistoryAction = useRef<boolean>(false);

  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Initialize Fonts on mount
  useEffect(() => {
    loadAllFonts();
  }, []);

  // Push state to history
  const pushHistory = useCallback(
    (newElements: CanvasElement[], newBg: CanvasBackground, newFmt: FormatConfig) => {
      if (isHistoryAction.current) {
        isHistoryAction.current = false;
        return;
      }
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        return [...next, { elements: newElements, background: newBg, format: newFmt }].slice(-30);
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 29));
    },
    [historyIndex]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isHistoryAction.current = true;
      const targetState = history[historyIndex - 1];
      setElements(targetState.elements);
      setBackground(targetState.background);
      setCurrentFormat(targetState.format);
      setHistoryIndex((prev) => prev - 1);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isHistoryAction.current = true;
      const targetState = history[historyIndex + 1];
      setElements(targetState.elements);
      setBackground(targetState.background);
      setCurrentFormat(targetState.format);
      setHistoryIndex((prev) => prev + 1);
    }
  }, [historyIndex, history]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTagName = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
      if (activeTagName === 'input' || activeTagName === 'textarea') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          e.preventDefault();
          handleDeleteElement(selectedId);
        }
      } else if (e.key === 'Escape') {
        setSelectedId(null);
      } else if (selectedId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const delta = e.shiftKey ? 10 : 2;
        setElements((prev) =>
          prev.map((el) => {
            if (el.id !== selectedId) return el;
            let newX = el.x;
            let newY = el.y;
            if (e.key === 'ArrowUp') newY -= delta;
            if (e.key === 'ArrowDown') newY += delta;
            if (e.key === 'ArrowLeft') newX -= delta;
            if (e.key === 'ArrowRight') newX += delta;
            return { ...el, x: newX, y: newY };
          })
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, handleUndo, handleRedo]);

  // Add new Text element
  const handleAddText = (initialFont?: string | unknown) => {
    const safeFont = typeof initialFont === 'string' && initialFont.trim().length > 0 ? initialFont : "'Bebas Neue', cursive";
    const newId = `elem-text-${Date.now()}`;
    const maxZ = elements.reduce((max, el) => Math.max(max, el.zIndex || 1), 1);
    const stagger = (elements.length % 4) * 45;
    const newText: CanvasTextElement = {
      type: 'text',
      id: newId,
      text: 'NUOVO TESTO',
      fontFamily: safeFont,
      fontSize: 72,
      fontWeight: 400,
      fontStyle: 'normal',
      textTransform: 'uppercase',
      textAlign: 'center',
      letterSpacing: 2,
      lineHeight: 1.1,
      color: '#ffffff',
      gradient: {
        enabled: true,
        type: 'linear',
        angle: 90,
        stops: [
          { color: '#38bdf8', offset: 0 },
          { color: '#c084fc', offset: 100 },
        ],
      },
      stroke: { enabled: false, color: '#000000', width: 0 },
      shadow: { enabled: true, color: '#38bdf8', blur: 20, offsetX: 0, offsetY: 0, preset: 'neon' },
      animation: { type: 'bounce-pop', duration: 1.5, delay: 0, iterationCount: 'infinite' },
      opacity: 1,
      x: Math.max(40, Math.round((currentFormat.width - 640) / 2)),
      y: Math.min(currentFormat.height - 200, 380 + stagger),
      width: Math.min(640, currentFormat.width - 80),
      height: 120,
      rotation: 0,
      zIndex: maxZ + 1,
    };

    const nextElements = [...elements, newText];
    setElements(nextElements);
    setSelectedId(newId);
    pushHistory(nextElements, background, currentFormat);
  };

  // Add new Image element / Sticker
  const handleAddImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const newId = `elem-img-${Date.now()}`;
        const newImg: CanvasImageElement = {
          type: 'image',
          id: newId,
          name: file.name,
          src: e.target.result as string,
          x: 240,
          y: 600,
          width: 320,
          height: 320,
          scale: 1,
          rotation: 0,
          opacity: 1,
          borderRadius: 16,
          aspectRatio: 1,
          flipX: false,
          flipY: false,
          blendMode: 'normal',
          filter: {
            brightness: 100,
            contrast: 100,
            blur: 0,
            saturate: 100,
          },
          zIndex: elements.length + 1,
        };

        const nextElements = [...elements, newImg];
        setElements(nextElements);
        setSelectedId(newId);
        pushHistory(nextElements, background, currentFormat);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddStickerSvg = (dataUrl: string, name: string) => {
    const newId = `elem-stk-${Date.now()}`;
    const newImg: CanvasImageElement = {
      type: 'image',
      id: newId,
      name: name,
      src: dataUrl,
      x: 320,
      y: 550,
      width: 220,
      height: 220,
      scale: 1,
      rotation: 0,
      opacity: 1,
      borderRadius: 0,
      aspectRatio: 1,
      flipX: false,
      flipY: false,
      blendMode: 'normal',
      filter: {
        brightness: 100,
        contrast: 100,
        blur: 0,
        saturate: 100,
      },
      zIndex: elements.length + 1,
    };
    const nextElements = [...elements, newImg];
    setElements(nextElements);
    setSelectedId(newId);
    pushHistory(nextElements, background, currentFormat);
  };

  // Update element attributes
  const handleUpdateElement = (id: string, updates: Partial<CanvasElement>) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== id) return el;
        return { ...el, ...updates } as CanvasElement;
      })
    );
  };

  // Duplicate element
  const handleDuplicateElement = (id: string) => {
    const target = elements.find((el) => el.id === id);
    if (!target) return;
    const newId = `elem-copy-${Date.now()}`;
    const cloned = {
      ...target,
      id: newId,
      x: target.x + 30,
      y: target.y + 30,
      zIndex: elements.length + 1,
    };
    const nextElements = [...elements, cloned];
    setElements(nextElements);
    setSelectedId(newId);
    pushHistory(nextElements, background, currentFormat);
  };

  // Delete element
  const handleDeleteElement = (id: string) => {
    const nextElements = elements.filter((el) => el.id !== id);
    setElements(nextElements);
    if (selectedId === id) setSelectedId(null);
    pushHistory(nextElements, background, currentFormat);
  };

  // Reorder layer
  const handleReorderLayer = (id: string, direction: 'up' | 'down') => {
    const index = elements.findIndex((el) => el.id === id);
    if (index === -1) return;
    const newElements = [...elements];
    if (direction === 'up' && index < newElements.length - 1) {
      const temp = newElements[index];
      newElements[index] = newElements[index + 1];
      newElements[index + 1] = temp;
    } else if (direction === 'down' && index > 0) {
      const temp = newElements[index];
      newElements[index] = newElements[index - 1];
      newElements[index - 1] = temp;
    }
    // Re-assign zIndexes
    newElements.forEach((el, idx) => {
      el.zIndex = idx + 1;
    });
    setElements(newElements);
    pushHistory(newElements, background, currentFormat);
  };

  // Update Background
  const handleUpdateBackground = (updates: Partial<CanvasBackground>) => {
    setBackground((prev) => {
      const next = { ...prev, ...updates };
      pushHistory(elements, next, currentFormat);
      return next;
    });
  };

  // Change Canvas Format
  const handleChangeFormat = (newFmt: FormatConfig) => {
    setCurrentFormat(newFmt);
    pushHistory(elements, background, newFmt);
  };

  // Apply 1-Click Style Preset to selected text
  const handleApplyStylePreset = (preset: StylePreset) => {
    if (selectedId) {
      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== selectedId || el.type !== 'text') return el;
          return {
            ...el,
            ...preset.textConfig,
          };
        })
      );
    }
    handleUpdateBackground(preset.backgroundConfig);
  };

  // Apply Full Template
  const handleApplyTemplate = (template: ProjectTemplate) => {
    const targetFmt = SOCIAL_FORMATS.find((f) => f.id === template.format) || currentFormat;
    setCurrentFormat(targetFmt);
    setBackground(template.background);
    setElements(template.elements);
    setSelectedId(template.elements[0]?.id || null);
    pushHistory(template.elements, template.background, targetFmt);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden font-sans select-none">
      {/* Top Navigation Bar */}
      <Header
        projectName={projectName}
        onUpdateProjectName={setProjectName}
        currentFormat={currentFormat}
        onChangeFormat={handleChangeFormat}
        zoomLevel={zoomLevel}
        onZoomChange={(delta) => setZoomLevel((z) => Math.max(30, Math.min(200, z + delta)))}
        onResetZoom={() => setZoomLevel(100)}
        playAnimations={playAnimations}
        onToggleAnimations={() => setPlayAnimations((p) => !p)}
        showSafeZone={showSafeZone}
        onToggleSafeZone={() => setShowSafeZone((s) => !s)}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenExportModal={() => {
          setExportInitialTab(undefined);
          setIsExportModalOpen(true);
        }}
        onAddText={handleAddText}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative bg-slate-950">
        {/* Left Sidebar Controls */}
        <Sidebar
          elements={elements}
          selectedId={selectedId}
          background={background}
          onSelectElement={setSelectedId}
          onAddText={handleAddText}
          onAddImage={handleAddImage}
          onAddStickerSvg={handleAddStickerSvg}
          onUpdateElement={handleUpdateElement}
          onUpdateBackground={handleUpdateBackground}
          onDuplicateElement={handleDuplicateElement}
          onDeleteElement={handleDeleteElement}
          onReorderLayer={handleReorderLayer}
          onApplyStylePreset={handleApplyStylePreset}
          onApplyTemplate={handleApplyTemplate}
          onOpenVideoExport={() => {
            setExportInitialTab('video');
            setIsExportModalOpen(true);
          }}
        />

        {/* Central Live Interactive Canvas */}
        <Canvas
          canvasRef={canvasRef}
          format={currentFormat}
          background={background}
          elements={elements}
          selectedId={selectedId}
          zoomLevel={zoomLevel}
          playAnimations={playAnimations}
          showSafeZone={showSafeZone}
          onSelectElement={setSelectedId}
          onUpdateElement={handleUpdateElement}
          onDuplicateElement={handleDuplicateElement}
          onDeleteElement={handleDeleteElement}
          onAddText={handleAddText}
        />
      </div>

      {/* High-Resolution PNG, Video & Standalone HTML Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        canvasRef={canvasRef}
        format={currentFormat}
        background={background}
        elements={elements}
        projectName={projectName}
        initialTab={exportInitialTab}
      />
    </div>
  );
}
