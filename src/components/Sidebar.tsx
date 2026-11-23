import React, { useState, useRef } from 'react';
import {
  Type,
  Palette,
  Sparkles,
  Image as ImageIcon,
  Layers,
  LayoutTemplate,
  Plus,
  Trash2,
  Copy,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Sliders,
  Zap,
  Flame,
  Crown,
  Search,
  Check,
  Sticker,
  RotateCw,
  Video,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  CanvasBackground,
  CanvasElement,
  CanvasTextElement,
  CanvasImageElement,
  FontCategory,
  AnimationType,
  StylePreset,
  ProjectTemplate,
} from '../types';
import { FONTS_LIST, FONT_CATEGORIES, loadSingleFont } from '../data/fonts';
import { ANIMATIONS_LIST } from '../data/animations';
import { BACKGROUND_PRESETS } from '../data/backgrounds';
import { STYLE_PRESETS, READY_TEMPLATES } from '../data/presets';
import { GRAPHIC_STICKERS, svgToDataUrl } from '../data/stickers';

interface SidebarProps {
  elements: CanvasElement[];
  selectedId: string | null;
  background: CanvasBackground;
  onSelectElement: (id: string | null) => void;
  onAddText: (initialFont?: string) => void;
  onAddImage: (file: File) => void;
  onAddStickerSvg?: (svgDataUrl: string, name: string) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onUpdateBackground: (updates: Partial<CanvasBackground>) => void;
  onDuplicateElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
  onReorderLayer: (id: string, direction: 'up' | 'down') => void;
  onApplyStylePreset: (preset: StylePreset) => void;
  onApplyTemplate: (template: ProjectTemplate) => void;
  onOpenVideoExport?: () => void;
}

type TabType = 'testo' | 'stile' | 'animazioni' | 'sfondo' | 'sticker' | 'livelli' | 'preset';

export const Sidebar: React.FC<SidebarProps> = ({
  elements,
  selectedId,
  background,
  onSelectElement,
  onAddText,
  onAddImage,
  onAddStickerSvg,
  onUpdateElement,
  onUpdateBackground,
  onDuplicateElement,
  onDeleteElement,
  onReorderLayer,
  onApplyStylePreset,
  onApplyTemplate,
  onOpenVideoExport,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('testo');
  const [fontCategoryFilter, setFontCategoryFilter] = useState<string>('all');
  const [fontSearch, setFontSearch] = useState<string>('');
  const [bgCategoryFilter, setBgCategoryFilter] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);
  const bgCoverInputRef = useRef<HTMLInputElement>(null);
  const bgVideoInputRef = useRef<HTMLInputElement>(null);

  const selectedElement = elements.find((el) => el.id === selectedId);
  const isTextSelected = selectedElement?.type === 'text';
  const isImageSelected = selectedElement?.type === 'image';
  const selectedText = isTextSelected ? (selectedElement as CanvasTextElement) : null;
  const selectedImage = isImageSelected ? (selectedElement as CanvasImageElement) : null;

  // Filter fonts
  const filteredFonts = FONTS_LIST.filter((f) => {
    const matchesCat = fontCategoryFilter === 'all' || f.category === fontCategoryFilter;
    const matchesSearch = f.name.toLowerCase().includes(fontSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Filter backgrounds
  const filteredBackgrounds = BACKGROUND_PRESETS.filter((bg) => {
    return bgCategoryFilter === 'all' || bg.category === bgCategoryFilter;
  });

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const imgDataUrl = event.target.result as string;
          if (background.type === 'video' && background.video) {
            // Keep video active and attach/update cover image together!
            onUpdateBackground({
              coverImage: imgDataUrl,
              coverMode: background.coverMode || 'intro',
              coverDuration: background.coverDuration ?? 2,
            });
          } else {
            onUpdateBackground({
              type: 'image',
              image: imgDataUrl,
              coverImage: imgDataUrl,
              imageFit: 'cover',
            });
          }
        }
      };
      reader.readAsDataURL(file);
      if (bgImageInputRef.current) bgImageInputRef.current.value = '';
    }
  };

  const handleCustomCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdateBackground({
            coverImage: event.target.result as string,
            coverMode: background.coverMode || 'intro',
            coverDuration: background.coverDuration ?? 2,
          });
        }
      };
      reader.readAsDataURL(file);
      if (bgCoverInputRef.current) bgCoverInputRef.current.value = '';
    }
  };

  const handleCustomBgVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const videoUrl = URL.createObjectURL(file);
      const preservedCover =
        background.coverImage || (background.type === 'image' ? background.image : undefined);
      onUpdateBackground({
        type: 'video',
        video: videoUrl,
        coverImage: preservedCover,
        coverMode: background.coverMode || 'intro',
        coverDuration: background.coverDuration ?? 2,
        videoMuted: background.videoMuted ?? true,
        videoLoop: background.videoLoop ?? true,
        imageFit: 'cover',
      });
      if (bgVideoInputRef.current) bgVideoInputRef.current.value = '';
    }
  };

  const handleImageStickerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddImage(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddSticker = (svgString: string, name: string) => {
    if (onAddStickerSvg) {
      onAddStickerSvg(svgToDataUrl(svgString), name);
    } else {
      const dataUrl = svgToDataUrl(svgString);
      fetch(dataUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], `${name}.svg`, { type: 'image/svg+xml' });
          onAddImage(file);
        });
    }
  };

  // Helper when clicking a font: immediately load and apply or add text
  const handleSelectOrApplyFont = (fontFamily: string, googleFont: string) => {
    loadSingleFont(googleFont);
    if (selectedText) {
      onUpdateElement(selectedText.id, { fontFamily });
    } else {
      onAddText(fontFamily);
    }
  };

  return (
    <aside
      id="main-control-sidebar"
      className="w-80 md:w-96 h-full bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none z-20"
    >
      {/* Navigation Tabs Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 px-2 py-2 bg-slate-950/90 overflow-x-auto gap-1">
        {[
          { id: 'testo', label: 'Testo', icon: Type },
          { id: 'stile', label: 'Stile & FX', icon: Palette },
          { id: 'animazioni', label: 'Effetti', icon: Sparkles },
          { id: 'sfondo', label: 'Sfondo', icon: LayoutTemplate },
          { id: 'sticker', label: 'Sticker', icon: Sticker },
          { id: 'livelli', label: 'Livelli', icon: Layers },
          { id: 'preset', label: 'Preset', icon: Zap },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-md text-[11px] font-semibold transition min-w-[48px] ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 flex flex-col justify-between">
        <div className="space-y-6">
          {/* ==================================================== */}
          {/* TAB 1: TESTO & FONT ARTISTICI (80+ FONTS) */}
          {/* ==================================================== */}
          {activeTab === 'testo' && (
            <div className="space-y-5">
              {/* Add New Text Element Button */}
              <button
                type="button"
                onClick={() => onAddText()}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition active:scale-[0.98] text-sm"
              >
                <Plus className="w-4 h-4" /> Aggiungi Nuovo Testo
              </button>

              {/* Text Content Input */}
              {selectedText ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-2">
                      Contenuto Testo
                    </label>
                    <textarea
                      value={selectedText.text}
                      onChange={(e) => onUpdateElement(selectedText.id, { text: e.target.value })}
                      rows={2}
                      placeholder="Scrivi il tuo testo qui..."
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none transition"
                    />
                  </div>

                  {/* Font Size, Spacing & Line Height Sliders */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="flex justify-between text-[9px] text-slate-400 uppercase mb-1">
                        <span>Grandezza</span>
                        <span className="font-mono text-indigo-400">{selectedText.fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min={12}
                        max={220}
                        value={selectedText.fontSize}
                        onChange={(e) => onUpdateElement(selectedText.id, { fontSize: Number(e.target.value) })}
                        className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[9px] text-slate-400 uppercase mb-1">
                        <span>Spaziatura</span>
                        <span className="font-mono text-indigo-400">{selectedText.letterSpacing}px</span>
                      </div>
                      <input
                        type="range"
                        min={-2}
                        max={30}
                        value={selectedText.letterSpacing}
                        onChange={(e) => onUpdateElement(selectedText.id, { letterSpacing: Number(e.target.value) })}
                        className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[9px] text-slate-400 uppercase mb-1">
                        <span>Interlinea</span>
                        <span className="font-mono text-indigo-400">{selectedText.lineHeight || 1.1}</span>
                      </div>
                      <input
                        type="range"
                        min={0.8}
                        max={2.5}
                        step={0.05}
                        value={selectedText.lineHeight || 1.1}
                        onChange={(e) => onUpdateElement(selectedText.id, { lineHeight: Number(e.target.value) })}
                        className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Text Formatting Toolbar */}
                  <div className="flex items-center justify-between bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateElement(selectedText.id, {
                            fontWeight: selectedText.fontWeight >= 700 ? 400 : 700,
                          })
                        }
                        className={`p-2 rounded-md transition ${
                          selectedText.fontWeight >= 700
                            ? 'bg-indigo-600/20 text-indigo-400'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="Grassetto"
                      >
                        <Bold className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateElement(selectedText.id, {
                            fontStyle: selectedText.fontStyle === 'italic' ? 'normal' : 'italic',
                          })
                        }
                        className={`p-2 rounded-md transition ${
                          selectedText.fontStyle === 'italic'
                            ? 'bg-indigo-600/20 text-indigo-400'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="Corsivo"
                      >
                        <Italic className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateElement(selectedText.id, {
                            textTransform: selectedText.textTransform === 'uppercase' ? 'none' : 'uppercase',
                          })
                        }
                        className={`px-2 py-1 text-xs font-bold rounded-md transition ${
                          selectedText.textTransform === 'uppercase'
                            ? 'bg-indigo-600/20 text-indigo-400'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="Tutto Maiuscolo"
                      >
                        AA
                      </button>
                    </div>

                    <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
                      <button
                        type="button"
                        onClick={() => onUpdateElement(selectedText.id, { textAlign: 'left' })}
                        className={`p-2 rounded-md transition ${
                          selectedText.textAlign === 'left'
                            ? 'bg-indigo-600/20 text-indigo-400'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <AlignLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateElement(selectedText.id, { textAlign: 'center' })}
                        className={`p-2 rounded-md transition ${
                          selectedText.textAlign === 'center'
                            ? 'bg-indigo-600/20 text-indigo-400'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <AlignCenter className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateElement(selectedText.id, { textAlign: 'right' })}
                        className={`p-2 rounded-md transition ${
                          selectedText.textAlign === 'right'
                            ? 'bg-indigo-600/20 text-indigo-400'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <AlignRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-400">
                  💡 Clicca su un testo nella tavola per regolarlo, oppure clicca sui font sotto per applicarli subito.
                </div>
              )}

              {/* Massive 80+ Font Selection Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                    Libreria Font Artistici ({filteredFonts.length})
                  </label>
                </div>

                {/* Font Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Cerca font per nome..."
                    value={fontSearch}
                    onChange={(e) => setFontSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setFontCategoryFilter('all')}
                    className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-md whitespace-nowrap transition ${
                      fontCategoryFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Tutti ({FONTS_LIST.length})
                  </button>
                  {FONT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFontCategoryFilter(cat.id)}
                      className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-md whitespace-nowrap transition ${
                        fontCategoryFilter === cat.id
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Fonts List Cards */}
                <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto pr-1">
                  {filteredFonts.map((font) => {
                    const isSelected = selectedText?.fontFamily === font.family;
                    return (
                      <div
                        key={font.name}
                        onMouseEnter={() => loadSingleFont(font.googleFont)}
                        onClick={() => handleSelectOrApplyFont(font.family, font.googleFont)}
                        className={`p-3 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'border-indigo-500/80 bg-indigo-500/15 shadow-sm ring-1 ring-indigo-500'
                            : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div
                            className="text-xl text-slate-100 truncate"
                            style={{ fontFamily: font.family }}
                          >
                            {font.name}
                          </div>
                          <div className="text-[9px] text-slate-400 mt-1 uppercase tracking-tighter">
                            {font.previewText || font.name} • {font.category}
                          </div>
                        </div>
                        {isSelected ? (
                          <div className="flex items-center gap-1 text-indigo-400 text-xs font-semibold">
                            <Check className="w-4 h-4" />
                            <span>Attivo</span>
                          </div>
                        ) : (
                          <span className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 rounded font-medium transition">
                            Usa Font
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: STILE, COLORI, CONTORNI & OMBRE 3D */}
          {/* ==================================================== */}
          {activeTab === 'stile' && (
            <div className="space-y-6">
              {selectedText ? (
                <>
                  {/* Text Solid Color & Gradient */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                        Colore & Sfumature
                      </label>
                      <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateElement(selectedText.id, {
                              gradient: {
                                ...selectedText.gradient,
                                enabled: false,
                              },
                            })
                          }
                          className={`text-[11px] px-2.5 py-1 rounded-md transition font-semibold ${
                            !selectedText.gradient.enabled
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Colore Pieno
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateElement(selectedText.id, {
                              gradient: {
                                ...selectedText.gradient,
                                enabled: true,
                                stops:
                                  selectedText.gradient.stops.length > 0
                                    ? selectedText.gradient.stops
                                    : [
                                        { color: '#818cf8', offset: 0 },
                                        { color: '#ec4899', offset: 100 },
                                      ],
                              },
                            })
                          }
                          className={`text-[11px] px-2.5 py-1 rounded-md transition font-semibold ${
                            selectedText.gradient.enabled
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Sfumatura
                        </button>
                      </div>
                    </div>

                    {!selectedText.gradient.enabled ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={/^#[0-9a-fA-F]{6}$/.test(selectedText.color || '') ? selectedText.color : '#ffffff'}
                            onChange={(e) =>
                              onUpdateElement(selectedText.id, {
                                color: e.target.value,
                                gradient: { ...selectedText.gradient, enabled: false },
                              })
                            }
                            className="w-10 h-10 rounded-lg bg-transparent cursor-pointer border-2 border-indigo-500"
                          />
                          <input
                            type="text"
                            value={selectedText.color}
                            onChange={(e) =>
                              onUpdateElement(selectedText.id, {
                                color: e.target.value,
                                gradient: { ...selectedText.gradient, enabled: false },
                              })
                            }
                            className="w-28 bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs font-mono text-slate-200"
                          />
                        </div>
                        {/* Quick Palette */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {[
                            '#ffffff',
                            '#f43f5e',
                            '#fb923c',
                            '#facc15',
                            '#4ade80',
                            '#38bdf8',
                            '#818cf8',
                            '#c084fc',
                            '#09090b',
                          ].map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() =>
                                onUpdateElement(selectedText.id, {
                                  color: c,
                                  gradient: { ...selectedText.gradient, enabled: false },
                                })
                              }
                              className={`w-7 h-7 rounded-md border transition hover:scale-110 ${
                                selectedText.color === c ? 'border-2 border-indigo-500 shadow-md' : 'border-slate-700'
                              }`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400 font-medium">Colori Sfumatura</span>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={selectedText.gradient.stops[0]?.color || '#818cf8'}
                              onChange={(e) => {
                                const stops = [...selectedText.gradient.stops];
                                stops[0] = { color: e.target.value, offset: 0 };
                                onUpdateElement(selectedText.id, {
                                  gradient: { ...selectedText.gradient, stops },
                                });
                              }}
                              className="w-7 h-7 rounded-md bg-transparent cursor-pointer border border-slate-700"
                            />
                            <input
                              type="color"
                              value={selectedText.gradient.stops[1]?.color || '#ec4899'}
                              onChange={(e) => {
                                const stops = [...selectedText.gradient.stops];
                                stops[1] = { color: e.target.value, offset: 100 };
                                onUpdateElement(selectedText.id, {
                                  gradient: { ...selectedText.gradient, stops },
                                });
                              }}
                              className="w-7 h-7 rounded-md bg-transparent cursor-pointer border border-slate-700"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-400 uppercase mb-1.5">
                            <span>Angolo ({selectedText.gradient.angle || 90}°)</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={360}
                            value={selectedText.gradient.angle || 90}
                            onChange={(e) =>
                              onUpdateElement(selectedText.id, {
                                gradient: { ...selectedText.gradient, angle: Number(e.target.value) },
                              })
                            }
                            className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stroke / Contorno */}
                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                        Contorno & Tratto
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateElement(selectedText.id, {
                            stroke: {
                              ...selectedText.stroke,
                              enabled: !selectedText.stroke.enabled,
                              width: selectedText.stroke.width || 2,
                              color: selectedText.stroke.color || '#000000',
                            },
                          })
                        }
                        className={`text-xs px-2.5 py-1 rounded-md border transition font-semibold ${
                          selectedText.stroke.enabled
                            ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {selectedText.stroke.enabled ? 'Attivo' : 'Disattivo'}
                      </button>
                    </div>

                    {selectedText.stroke.enabled && (
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">Colore Contorno</span>
                          <input
                            type="color"
                            value={selectedText.stroke.color}
                            onChange={(e) =>
                              onUpdateElement(selectedText.id, {
                                stroke: { ...selectedText.stroke, color: e.target.value },
                              })
                            }
                            className="w-7 h-7 rounded-md bg-transparent cursor-pointer border border-slate-700"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-400 uppercase mb-1.5">
                            <span>Spessore ({selectedText.stroke.width}px)</span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={20}
                            value={selectedText.stroke.width}
                            onChange={(e) =>
                              onUpdateElement(selectedText.id, {
                                stroke: { ...selectedText.stroke, width: Number(e.target.value) },
                              })
                            }
                            className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ombra & Bagliore Neon */}
                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                        Bagliore & Ombra 3D
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateElement(selectedText.id, {
                            shadow: {
                              ...selectedText.shadow,
                              enabled: !selectedText.shadow.enabled,
                              color: selectedText.shadow.color || '#6366f1',
                              blur: selectedText.shadow.blur || 24,
                              offsetX: selectedText.shadow.offsetX || 0,
                              offsetY: selectedText.shadow.offsetY || 0,
                            },
                          })
                        }
                        className={`text-xs px-2.5 py-1 rounded-md border transition font-semibold ${
                          selectedText.shadow.enabled
                            ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {selectedText.shadow.enabled ? 'Attivo' : 'Disattivo'}
                      </button>
                    </div>

                    {selectedText.shadow.enabled && (
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: 'neon', label: 'Glow Neon', blur: 28, offX: 0, offY: 0 },
                            { id: 'retro3d', label: '3D Retro', blur: 0, offX: 6, offY: 6 },
                            { id: 'soft', label: 'Morbida', blur: 16, offX: 2, offY: 6 },
                          ].map((sh) => (
                            <button
                              key={sh.id}
                              type="button"
                              onClick={() =>
                                onUpdateElement(selectedText.id, {
                                  shadow: {
                                    ...selectedText.shadow,
                                    preset: sh.id as any,
                                    blur: sh.blur,
                                    offsetX: sh.offX,
                                    offsetY: sh.offY,
                                  },
                                })
                              }
                              className={`py-1 px-2 text-[11px] font-medium rounded-md border transition ${
                                selectedText.shadow.preset === sh.id
                                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                              }`}
                            >
                              {sh.label}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">Colore Effetto</span>
                          <input
                            type="color"
                            value={selectedText.shadow.color}
                            onChange={(e) =>
                              onUpdateElement(selectedText.id, {
                                shadow: { ...selectedText.shadow, color: e.target.value },
                              })
                            }
                            className="w-7 h-7 rounded-md bg-transparent cursor-pointer border border-slate-700"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] text-slate-400 uppercase mb-1.5">
                            <span>Intensità Blur ({selectedText.shadow.blur}px)</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={60}
                            value={selectedText.shadow.blur}
                            onChange={(e) =>
                              onUpdateElement(selectedText.id, {
                                shadow: { ...selectedText.shadow, blur: Number(e.target.value) },
                              })
                            }
                            className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sfondo Evidenziatore / Pillola */}
                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block">
                      Badge Sfondo / Pillola
                    </label>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Colore Sfondo</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedText.backgroundColor || '#000000'}
                            onChange={(e) => onUpdateElement(selectedText.id, { backgroundColor: e.target.value })}
                            className="w-7 h-7 rounded-md bg-transparent cursor-pointer border border-slate-700"
                          />
                          {selectedText.backgroundColor && (
                            <button
                              type="button"
                              onClick={() => onUpdateElement(selectedText.id, { backgroundColor: undefined })}
                              className="text-[10px] text-rose-400 hover:text-rose-300"
                            >
                              Rimuovi
                            </button>
                          )}
                        </div>
                      </div>
                      {selectedText.backgroundColor && (
                        <>
                          <div>
                            <div className="flex justify-between text-[10px] text-slate-400 uppercase mb-1.5">
                              <span>Padding ({selectedText.backgroundPadding || 12}px)</span>
                            </div>
                            <input
                              type="range"
                              min={4}
                              max={40}
                              value={selectedText.backgroundPadding || 12}
                              onChange={(e) =>
                                onUpdateElement(selectedText.id, { backgroundPadding: Number(e.target.value) })
                              }
                              className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between text-[10px] text-slate-400 uppercase mb-1.5">
                              <span>Arrotondamento ({selectedText.borderRadius || 8}px)</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={999}
                              value={selectedText.borderRadius || 8}
                              onChange={(e) =>
                                onUpdateElement(selectedText.id, { borderRadius: Number(e.target.value) })
                              }
                              className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-6 bg-slate-950/60 border border-slate-800 rounded-xl text-center space-y-3">
                  <Palette className="w-8 h-8 text-slate-500 mx-auto" />
                  <div className="text-sm font-semibold text-slate-300">Seleziona un elemento</div>
                  <p className="text-xs text-slate-400">
                    Seleziona un testo per modificarne i colori, contorni, sfumature ed effetti neon.
                  </p>
                  <button
                    type="button"
                    onClick={onAddText}
                    className="py-1.5 px-3 bg-indigo-600 text-white rounded text-xs font-semibold"
                  >
                    Aggiungi Testo
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: ANIMAZIONI GRAFICHE */}
          {/* ==================================================== */}
          {activeTab === 'animazioni' && (
            <div className="space-y-5">
              {selectedText ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-1">
                      Effetti Animati in Tempo Reale
                    </label>
                    <p className="text-xs text-slate-400 mb-3">
                      Scegli un'animazione grafica. Verrà inclusa anche nell'export in HTML autonomo.
                    </p>
                  </div>

                  {/* Animation Cards */}
                  <div className="grid grid-cols-1 gap-2">
                    {ANIMATIONS_LIST.map((anim) => {
                      const isSelected = selectedText.animation.type === anim.id;
                      return (
                        <div
                          key={anim.id}
                          onClick={() =>
                            onUpdateElement(selectedText.id, {
                              animation: {
                                ...selectedText.animation,
                                type: anim.id,
                                duration: anim.duration || 2,
                              },
                            })
                          }
                          className={`p-3 rounded-lg border text-left transition flex items-start justify-between cursor-pointer ${
                            isSelected
                              ? 'border-indigo-500/80 bg-indigo-500/15 shadow-sm'
                              : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-800/80'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-100">{anim.name}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{anim.description}</div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />}
                        </div>
                      );
                    })}
                  </div>

                  {selectedText.animation.type !== 'none' && (
                    <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg space-y-3 pt-2">
                      <div className="flex justify-between text-[10px] text-slate-400 uppercase mb-1">
                        <span>Velocità / Durata ({selectedText.animation.duration}s)</span>
                      </div>
                      <input
                        type="range"
                        min={0.5}
                        max={6}
                        step={0.1}
                        value={selectedText.animation.duration}
                        onChange={(e) =>
                          onUpdateElement(selectedText.id, {
                            animation: {
                              ...selectedText.animation,
                              duration: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 bg-slate-950/60 border border-slate-800 rounded-xl text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-slate-500 mx-auto" />
                  <div className="text-sm font-semibold text-slate-300">Seleziona un elemento</div>
                  <p className="text-xs text-slate-400">
                    Seleziona un testo per applicare animazioni come Neon Glow, Floating, Glitch o Rimbalzo.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 4: SFONDO & GRADIENTI */}
          {/* ==================================================== */}
          {activeTab === 'sfondo' && (
            <div className="space-y-5">
              {/* Custom Image/Cover & Video Upload */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block">
                  Carica Copertina e/o Video
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    ref={bgImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCustomBgUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => bgImageInputRef.current?.click()}
                    className="py-2.5 px-2 border border-dashed border-slate-700 hover:border-indigo-500 rounded-lg bg-slate-950 text-xs font-semibold text-slate-300 hover:text-white flex flex-col items-center justify-center gap-1.5 transition text-center"
                  >
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span>{background.type === 'video' ? 'Carica Copertina' : 'Copertina / Foto'}</span>
                  </button>

                  <input
                    ref={bgVideoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/*"
                    onChange={handleCustomBgVideoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => bgVideoInputRef.current?.click()}
                    className="py-2.5 px-2 border border-dashed border-indigo-700/60 hover:border-indigo-400 rounded-lg bg-indigo-950/20 text-xs font-semibold text-indigo-200 hover:text-white flex flex-col items-center justify-center gap-1.5 transition text-center"
                  >
                    <Video className="w-4 h-4 text-indigo-400" />
                    <span>Carica Video (MP4)</span>
                  </button>
                </div>
              </div>

              {/* Active Image/Cover hint when no video yet */}
              {background.type === 'image' && background.image && (
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-3">
                  <img
                    src={background.image}
                    alt="Copertina caricata"
                    className="w-11 h-11 rounded-lg object-cover border border-slate-700 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-200 truncate">Foto / Copertina attiva</div>
                    <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                      Carica un Video MP4 qui sopra per unirlo a questa copertina.
                    </div>
                  </div>
                </div>
              )}

              {/* Video + Copertina Combined Controls */}
              {background.type === 'video' && background.video && (
                <div className="p-3 bg-indigo-950/35 border border-indigo-500/40 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-slate-100">
                        {background.coverImage ? 'Video + Copertina Attivi' : 'Video di Sfondo Attivo'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (background.coverImage) {
                          onUpdateBackground({
                            type: 'image',
                            image: background.coverImage,
                            video: undefined,
                          });
                        } else {
                          onUpdateBackground({
                            type: 'solid',
                            color: '#090a0f',
                            video: undefined,
                          });
                        }
                      }}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold"
                    >
                      Rimuovi Video
                    </button>
                  </div>

                  {/* Copertina slot inside Video card */}
                  <input
                    ref={bgCoverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCustomCoverUpload}
                    className="hidden"
                  />
                  <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      {background.coverImage ? (
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={background.coverImage}
                            alt="Copertina"
                            className="w-10 h-10 rounded-md object-cover border border-indigo-500/40 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-[11px] font-bold text-slate-200">Copertina Abbinata</div>
                            <div className="text-[10px] text-emerald-400">Pronta con il video</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400">Nessuna copertina abbinata</div>
                      )}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => bgCoverInputRef.current?.click()}
                          className="text-[11px] px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 rounded font-semibold transition"
                        >
                          {background.coverImage ? 'Cambia' : '+ Copertina'}
                        </button>
                        {background.coverImage && (
                          <button
                            type="button"
                            onClick={() => onUpdateBackground({ coverImage: undefined })}
                            className="text-[10px] px-1.5 py-1 text-rose-400 hover:text-rose-300"
                            title="Rimuovi solo copertina"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Cover + Video Combination Mode */}
                    {background.coverImage && (
                      <div className="pt-2 border-t border-slate-800 space-y-2.5">
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                          Modalità Video + Copertina
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: 'intro', label: 'Intro → Video' },
                            { id: 'framed', label: 'Sfondo + Video' },
                            { id: 'poster', label: 'Poster' },
                          ].map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() =>
                                onUpdateBackground({
                                  coverMode: m.id as 'intro' | 'framed' | 'poster',
                                })
                              }
                              className={`py-1.5 px-1.5 rounded text-[10px] font-bold border transition text-center ${
                                (background.coverMode || 'intro') === m.id
                                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                              }`}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>

                        {(background.coverMode || 'intro') === 'intro' && (
                          <div>
                            <div className="flex justify-between text-[10px] text-slate-400 uppercase mb-1">
                              <span>Durata Copertina Iniziale</span>
                              <span className="font-mono text-indigo-400">{background.coverDuration ?? 2}s</span>
                            </div>
                            <input
                              type="range"
                              min={0.5}
                              max={5}
                              step={0.5}
                              value={background.coverDuration ?? 2}
                              onChange={(e) =>
                                onUpdateBackground({
                                  coverDuration: Number(e.target.value),
                                })
                              }
                              className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Audio toggle */}
                  <div className="flex items-center justify-between pt-1 border-t border-indigo-900/50">
                    <span className="text-[11px] text-slate-300">Audio Video</span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateBackground({
                          videoMuted: !background.videoMuted,
                        })
                      }
                      className={`text-xs px-2.5 py-1 rounded flex items-center gap-1 font-semibold ${
                        !background.videoMuted
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {!background.videoMuted ? (
                        <>
                          <Volume2 className="w-3 h-3" /> Attivo
                        </>
                      ) : (
                        <>
                          <VolumeX className="w-3 h-3" /> Muto
                        </>
                      )}
                    </button>
                  </div>

                  {/* Create / Export Video CTA */}
                  {onOpenVideoExport && (
                    <button
                      type="button"
                      onClick={onOpenVideoExport}
                      className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition active:scale-[0.98]"
                    >
                      <Video className="w-3.5 h-3.5" />
                      Crea & Scarica Video Finale
                    </button>
                  )}
                </div>
              )}

              {/* Background Preset Filter */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                    Sfondi & Gradienti Pronti
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
                  {filteredBackgrounds.map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => {
                        if (bg.type === 'gradient' && bg.gradient) {
                          onUpdateBackground({
                            type: 'gradient',
                            gradient: bg.gradient,
                            video: undefined,
                          });
                        } else if (bg.type === 'solid' && bg.color) {
                          onUpdateBackground({
                            type: 'solid',
                            color: bg.color,
                            video: undefined,
                          });
                        } else if (bg.type === 'image' && bg.image) {
                          if (background.type === 'video' && background.video) {
                            onUpdateBackground({
                              coverImage: bg.image,
                              coverMode: background.coverMode || 'intro',
                              coverDuration: background.coverDuration ?? 2,
                            });
                          } else {
                            onUpdateBackground({
                              type: 'image',
                              image: bg.image,
                              coverImage: bg.image,
                              imageFit: 'cover',
                            });
                          }
                        }
                      }}
                      className="h-20 rounded-lg border border-slate-800 hover:border-indigo-500 overflow-hidden relative group transition flex items-end p-2 text-left shadow-sm"
                      style={{ background: bg.preview }}
                    >
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition" />
                      <span className="text-[11px] font-bold text-white relative z-10 drop-shadow-md truncate">
                        {bg.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Overlay Sfumatura & Blur Controls */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block">
                  Regolazione Sfondo & Sfocatura
                </label>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] text-slate-400 uppercase">
                    <span>Velo Scuro ({Math.round(background.overlayOpacity * 100)}%)</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={0.9}
                    step={0.05}
                    value={background.overlayOpacity}
                    onChange={(e) =>
                      onUpdateBackground({
                        overlayOpacity: Number(e.target.value),
                        overlayColor: '#000000',
                      })
                    }
                    className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase">
                    <span>Sfocatura / Blur Sfondo ({background.blur}px)</span>
                    {background.blur > 0 && (
                      <button
                        type="button"
                        onClick={() => onUpdateBackground({ blur: 0 })}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 normal-case"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    step={1}
                    value={background.blur}
                    onChange={(e) =>
                      onUpdateBackground({
                        blur: Number(e.target.value),
                      })
                    }
                    className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 5: STICKERS & ELEMENTI GRAFICI */}
          {/* ==================================================== */}
          {activeTab === 'sticker' && (
            <div className="space-y-5">
              {/* Upload Custom Image */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-2">
                  Carica Immagine / Logo / PNG
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageStickerUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 border border-dashed border-slate-700 hover:border-indigo-500 rounded-lg bg-slate-950 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-2 transition"
                >
                  <Upload className="w-4 h-4 text-indigo-400" /> Carica Foto o Sticker Personale
                </button>
              </div>

              {/* Built-in Vector Stickers Library */}
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block">
                  Sticker Grafici Pronti (1-Click)
                </label>
                <div className="grid grid-cols-3 gap-2.5 max-h-96 overflow-y-auto pr-1">
                  {GRAPHIC_STICKERS.map((stk) => (
                    <button
                      key={stk.id}
                      type="button"
                      onClick={() => handleAddSticker(stk.svg, stk.name)}
                      className="p-3 bg-slate-950 border border-slate-800 hover:border-indigo-500 rounded-xl flex flex-col items-center justify-center gap-2 transition group hover:scale-105 shadow-sm"
                      title={stk.name}
                    >
                      <div
                        className="w-10 h-10 flex items-center justify-center pointer-events-none"
                        dangerouslySetInnerHTML={{ __html: stk.svg }}
                      />
                      <span className="text-[9px] text-slate-400 group-hover:text-white font-medium text-center truncate max-w-full">
                        {stk.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 6: LIVELLI & STRUTTURA */}
          {/* ==================================================== */}
          {activeTab === 'livelli' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  Gestione Livelli ({elements.length})
                </label>
              </div>

              <div className="space-y-1.5">
                {[...elements].reverse().map((el) => {
                  const isSelected = el.id === selectedId;
                  const isText = el.type === 'text';
                  const title = isText ? (el as CanvasTextElement).text : (el as CanvasImageElement).name;

                  return (
                    <div
                      key={el.id}
                      onClick={() => onSelectElement(el.id)}
                      className={`p-2.5 rounded-lg border flex items-center justify-between transition cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500/80 bg-indigo-500/15'
                          : 'border-slate-800 bg-slate-950/70 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        {isText ? (
                          <Type className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                        )}
                        <span className="text-xs text-slate-200 truncate font-medium">{title}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onUpdateElement(el.id, { hidden: !el.hidden })}
                          className={`p-1 rounded ${el.hidden ? 'text-rose-400 bg-rose-950/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                          title={el.hidden ? 'Mostra livello' : 'Nascondi livello'}
                        >
                          {el.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateElement(el.id, { locked: !el.locked })}
                          className={`p-1 rounded ${el.locked ? 'text-amber-400 bg-amber-950/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                          title={el.locked ? 'Sblocca livello' : 'Blocca livello'}
                        >
                          {el.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => onReorderLayer(el.id, 'up')}
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                          title="Sposta su"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onReorderLayer(el.id, 'down')}
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                          title="Sposta giù"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDuplicateElement(el.id)}
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                          title="Duplica"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteElement(el.id)}
                          className="p-1 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded"
                          title="Elimina"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 7: PRESET VIRALI & TEMPLATE */}
          {/* ==================================================== */}
          {activeTab === 'preset' && (
            <div className="space-y-6">
              {/* Ready Project Templates */}
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block">
                  Template Completi (Social)
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {READY_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => onApplyTemplate(tmpl)}
                      className="p-3 bg-slate-950 border border-slate-800 hover:border-indigo-500 rounded-xl text-left transition flex items-center justify-between group shadow-sm"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-100 group-hover:text-indigo-400">
                          {tmpl.name}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 uppercase">{tmpl.category}</div>
                      </div>
                      <span className="text-xs px-2.5 py-1 bg-indigo-600/20 text-indigo-400 rounded-md font-semibold border border-indigo-500/30">
                        Carica
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 1-Click Style Presets */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block">
                  Stili Tipografici 1-Click ({STYLE_PRESETS.length})
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-1">
                  {STYLE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onApplyStylePreset(preset)}
                      className="p-3 bg-slate-950 border border-slate-800 hover:border-indigo-500 rounded-xl text-left transition flex items-center justify-between group shadow-sm"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-400">
                            {preset.name}
                          </span>
                          {preset.badge && (
                            <span className="text-[9px] bg-pink-500/20 text-pink-400 px-1.5 py-0.5 rounded font-mono">
                              {preset.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate">{preset.description}</div>
                      </div>
                      <span className="text-xs text-indigo-400 font-bold shrink-0">Applica</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
