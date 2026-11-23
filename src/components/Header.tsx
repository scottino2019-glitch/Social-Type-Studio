import React from 'react';
import {
  Sparkles,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Maximize,
  Undo2,
  Redo2,
  Download,
  ShieldCheck,
  Type,
  Image as ImageIcon,
  Share2,
  Smartphone,
  Square,
  Monitor,
} from 'lucide-react';
import { FormatConfig, SocialFormat } from '../types';
import { SOCIAL_FORMATS } from '../data/formats';

interface HeaderProps {
  projectName: string;
  onUpdateProjectName: (name: string) => void;
  currentFormat: FormatConfig;
  onChangeFormat: (format: FormatConfig) => void;
  zoomLevel: number;
  onZoomChange: (delta: number) => void;
  onResetZoom: () => void;
  playAnimations: boolean;
  onToggleAnimations: () => void;
  showSafeZone: boolean;
  onToggleSafeZone: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenExportModal: () => void;
  onAddText: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  projectName,
  onUpdateProjectName,
  currentFormat,
  onChangeFormat,
  zoomLevel,
  onZoomChange,
  onResetZoom,
  playAnimations,
  onToggleAnimations,
  showSafeZone,
  onToggleSafeZone,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenExportModal,
  onAddText,
}) => {
  return (
    <header
      id="main-app-header"
      className="h-14 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between z-30 shrink-0 select-none gap-3"
    >
      {/* Brand & Project Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white text-base shadow-[0_0_15px_rgba(79,70,229,0.5)]">
            T
          </div>
          <span className="font-bold tracking-tight text-base sm:text-lg text-slate-100 hidden sm:inline">
            TEXTRA<span className="text-indigo-400 text-xs ml-1 uppercase font-semibold">Studio</span>
          </span>
        </div>

        <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

        {/* Project Name Editable Input */}
        <input
          type="text"
          value={projectName}
          onChange={(e) => onUpdateProjectName(e.target.value)}
          className="bg-slate-800/60 hover:bg-slate-800 focus:bg-slate-950 border border-slate-700/60 focus:border-indigo-500 px-2.5 py-1 rounded-md text-xs font-medium text-slate-200 focus:outline-none w-32 sm:w-44 transition placeholder-slate-500"
          placeholder="Nome Progetto..."
          title="Modifica nome progetto"
        />
      </div>

      {/* Center Controls: Format Selector & Undo/Redo & View Controls */}
      <div className="flex items-center gap-2">
        {/* Social Format Dropdown */}
        <div className="relative">
          <select
            value={currentFormat.id}
            onChange={(e) => {
              const f = SOCIAL_FORMATS.find((item) => item.id === e.target.value);
              if (f) onChangeFormat(f);
            }}
            className="bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 rounded-md px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
          >
            {SOCIAL_FORMATS.map((fmt) => (
              <option key={fmt.id} value={fmt.id}>
                {fmt.name} ({fmt.ratio})
              </option>
            ))}
          </select>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-800 border border-slate-700/80 rounded-md p-0.5">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-700/60 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent rounded transition"
            title="Annulla (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-700/60 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent rounded transition"
            title="Ripeti (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="hidden md:flex items-center bg-slate-800 border border-slate-700/80 rounded-md p-0.5 text-xs text-slate-300">
          <button
            type="button"
            onClick={() => onZoomChange(-15)}
            className="p-1.5 hover:text-white hover:bg-slate-700/60 rounded transition"
            title="Riduci Zoom"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onResetZoom}
            className="px-2 py-0.5 hover:text-white font-mono text-[11px] font-medium"
            title="Ripristina Zoom Adattato"
          >
            {zoomLevel}%
          </button>
          <button
            type="button"
            onClick={() => onZoomChange(15)}
            className="p-1.5 hover:text-white hover:bg-slate-700/60 rounded transition"
            title="Aumenta Zoom"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live Animation Play / Pause Toggle */}
        <button
          type="button"
          onClick={onToggleAnimations}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition ${
            playAnimations
              ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
          title="Avvia/Ferma Anteprima Animazioni"
        >
          {playAnimations ? <Pause className="w-3.5 h-3.5 text-indigo-400" /> : <Play className="w-3.5 h-3.5" />}
          <span className="hidden lg:inline">{playAnimations ? 'Animazione ON' : 'Pausa'}</span>
        </button>

        {/* Story Safe Zone Guide Toggle */}
        {currentFormat.safeZoneGuide && (
          <button
            type="button"
            onClick={onToggleSafeZone}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition ${
              showSafeZone
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Guida Area Sicura Instagram/TikTok"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden xl:inline">Area Sicura</span>
          </button>
        )}
      </div>

      {/* Right Side: Quick Add Text & Primary Export Button */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => onAddText()}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-md border border-slate-700 transition shadow-sm"
        >
          <Type className="w-3.5 h-3.5 text-indigo-400" />
          <span>+ Testo</span>
        </button>

        {/* Prominent Export Button */}
        <button
          type="button"
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-4 sm:px-5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-md shadow-lg shadow-indigo-500/25 active:scale-95 transition"
        >
          <Download className="w-4 h-4" />
          <span>Esporta</span>
        </button>
      </div>
    </header>
  );
};
