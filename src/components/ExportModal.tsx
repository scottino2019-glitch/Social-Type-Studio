import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Copy,
  Code,
  Image as ImageIcon,
  Check,
  FileJson,
  Sparkles,
  Video,
  Layers,
  FileImage,
  AlertCircle,
} from 'lucide-react';
import { CanvasBackground, CanvasElement, FormatConfig } from '../types';
import {
  exportCanvasToPng,
  exportCanvasToJpeg,
  exportCanvasToWebp,
  exportCanvasToSvg,
  copyCanvasToClipboard,
  generateStandaloneHtml,
  downloadFile,
} from '../utils/export';
import { exportCanvasToVideo } from '../utils/videoExport';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  format: FormatConfig;
  background: CanvasBackground;
  elements: CanvasElement[];
  projectName: string;
  initialTab?: 'image' | 'video' | 'html' | 'project';
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  canvasRef,
  format,
  background,
  elements,
  projectName,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'html' | 'project'>(initialTab || 'image');
  const [imageFormat, setImageFormat] = useState<'png' | 'jpeg' | 'webp' | 'svg'>('png');
  const [resolutionScale, setResolutionScale] = useState<number>(2); // 2x default for ultra sharp 2K
  const [transparentBg, setTransparentBg] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string>('Rendering in corso...');
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  // Video export state
  const [videoQuality, setVideoQuality] = useState<'hd720' | 'full1080'>('full1080');
  const [fallbackDuration, setFallbackDuration] = useState<number>(5);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [videoStageText, setVideoStageText] = useState<string>('');
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      } else if (background.type === 'video' && background.video) {
        setActiveTab('video');
      }
      setVideoError(null);
      setVideoProgress(0);
    } else {
      videoAbortRef.current?.abort();
    }
  }, [isOpen, initialTab, background.type, background.video]);

  if (!isOpen) return null;

  const targetWidth = format.width * resolutionScale;
  const targetHeight = format.height * resolutionScale;

  const handleExportImage = async () => {
    try {
      setIsExporting(true);
      setExportMessage('Incorporamento font e rendering HD...');

      const baseFileName = `${projectName.toLowerCase().replace(/\s+/g, '-')}-${format.id}-${resolutionScale}x`;

      if (imageFormat === 'png') {
        await exportCanvasToPng(canvasRef.current, {
          format,
          background,
          elements,
          scaleMultiplier: resolutionScale,
          transparentBg,
          fileName: `${baseFileName}.png`,
        });
      } else if (imageFormat === 'jpeg') {
        await exportCanvasToJpeg(canvasRef.current, {
          format,
          background,
          elements,
          scaleMultiplier: resolutionScale,
          quality: 0.95,
          fileName: `${baseFileName}.jpg`,
        });
      } else if (imageFormat === 'webp') {
        await exportCanvasToWebp(canvasRef.current, {
          format,
          background,
          elements,
          scaleMultiplier: resolutionScale,
          transparentBg,
          fileName: `${baseFileName}.webp`,
        });
      } else if (imageFormat === 'svg') {
        await exportCanvasToSvg(canvasRef.current, {
          format,
          background,
          elements,
          scaleMultiplier: resolutionScale,
          transparentBg,
          fileName: `${baseFileName}.svg`,
        });
      }

      setCopiedStatus('image-downloaded');
      setTimeout(() => setCopiedStatus(null), 3500);
    } catch (err) {
      console.error('Export Image failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyClipboardImage = async () => {
    try {
      setIsExporting(true);
      setExportMessage('Generazione PNG HD per appunti...');
      await copyCanvasToClipboard(canvasRef.current, {
        format,
        background,
        elements,
      });
      setCopiedStatus('clipboard-copied');
      setTimeout(() => setCopiedStatus(null), 3500);
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadHtml = () => {
    const htmlContent = generateStandaloneHtml(elements, background, format, projectName);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, `${projectName.toLowerCase().replace(/\s+/g, '-')}-animato.html`);
    URL.revokeObjectURL(url);
    setCopiedStatus('html-downloaded');
    setTimeout(() => setCopiedStatus(null), 3000);
  };

  const handleCopyHtmlCode = async () => {
    const htmlContent = generateStandaloneHtml(elements, background, format, projectName);
    await navigator.clipboard.writeText(htmlContent);
    setCopiedStatus('code-copied');
    setTimeout(() => setCopiedStatus(null), 3000);
  };

  const handleExportProjectJson = () => {
    const projectData = {
      version: 1,
      appName: 'Social Type Studio',
      timestamp: new Date().toISOString(),
      projectName,
      format,
      background,
      elements,
    };
    const jsonStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, `${projectName.toLowerCase().replace(/\s+/g, '-')}.socialtype`);
    URL.revokeObjectURL(url);
    setCopiedStatus('project-exported');
    setTimeout(() => setCopiedStatus(null), 3000);
  };

  const handleExportVideo = async () => {
    try {
      setIsExporting(true);
      setVideoError(null);
      setVideoProgress(1);
      setVideoStageText('Inizializzazione motore video...');

      const controller = new AbortController();
      videoAbortRef.current = controller;

      const minDim = Math.min(format.width, format.height);
      const scale = videoQuality === 'hd720' ? Math.min(1, 720 / minDim) : 1;
      const baseFileName = `${projectName.toLowerCase().replace(/\s+/g, '-')}-${format.id}`;

      await exportCanvasToVideo({
        format,
        background,
        elements,
        scale,
        fallbackDuration,
        fps: 30,
        fileName: baseFileName,
        signal: controller.signal,
        onProgress: (pct, stage) => {
          setVideoProgress(pct);
          setVideoStageText(stage);
        },
      });

      setCopiedStatus('video-downloaded');
      setTimeout(() => setCopiedStatus(null), 4000);
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        setVideoError((err as Error)?.message || 'Errore durante la creazione del video.');
      }
    } finally {
      setIsExporting(false);
      videoAbortRef.current = null;
    }
  };

  const handleCancelVideo = () => {
    videoAbortRef.current?.abort();
    setIsExporting(false);
    setVideoProgress(0);
    setVideoStageText('');
  };

  return (
    <div
      id="export-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="export-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Esporta Creazione Social</h2>
              <p className="text-xs text-slate-400">
                Formato: {format.name} ({format.width}x{format.height}) • {elements.filter((e) => !e.hidden).length} Livelli
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap ${
              activeTab === 'image'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/80 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Immagine HD
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap ${
              activeTab === 'video'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/80 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-4 h-4" />
            Video (MP4/WebM)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('html')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap ${
              activeTab === 'html'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/80 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            HTML Animato
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('project')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap ${
              activeTab === 'project'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/80 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileJson className="w-4 h-4" />
            Progetto
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'image' && (
            <div className="space-y-5">
              {/* File Type Selection */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-2">
                  Formato Immagine
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'png', label: 'PNG', desc: 'Trasparenza & Alta Definizione' },
                    { id: 'jpeg', label: 'JPEG', desc: 'Foto & Post veloci' },
                    { id: 'webp', label: 'WebP', desc: 'Nuovo formato leggero' },
                    { id: 'svg', label: 'SVG', desc: 'Vettoriale' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setImageFormat(fmt.id as 'png' | 'jpeg' | 'webp' | 'svg')}
                      className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                        imageFormat === fmt.id
                          ? 'border-indigo-500 bg-indigo-600/15 text-indigo-300'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold uppercase text-slate-100">{fmt.label}</span>
                      <span className="text-[10px] text-slate-500 leading-tight mt-1 truncate">{fmt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution options */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-2">
                  Risoluzione & Nitidezza (Font Vettoriali e Colori Intatti)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { scale: 1, label: 'Standard 1x', res: `${format.width} × ${format.height}`, desc: 'Post leggeri' },
                    {
                      scale: 2,
                      label: 'Ultra Sharp 2K (2x)',
                      res: `${targetWidth} × ${targetHeight}`,
                      desc: 'Consigliato Instagram & TikTok',
                      recommended: true,
                    },
                    {
                      scale: 3,
                      label: 'Ultra HD 4K (3x)',
                      res: `${format.width * 3} × ${format.height * 3}`,
                      desc: 'Massima Nitidezza & Stampa',
                    },
                  ].map((item) => (
                    <button
                      key={item.scale}
                      type="button"
                      onClick={() => setResolutionScale(item.scale)}
                      className={`relative p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                        resolutionScale === item.scale
                          ? 'border-indigo-500/50 bg-indigo-500/10 shadow-sm'
                          : 'border-slate-700/80 bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {item.recommended && (
                        <span className="absolute -top-2.5 right-2 px-2 py-0.5 bg-indigo-600 text-[9px] font-bold uppercase tracking-wider text-white rounded-full shadow">
                          Consigliato
                        </span>
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-100">{item.label}</div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">{item.res}</div>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-2">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Transparent BG Toggle (PNG and WebP and SVG only) */}
              {imageFormat !== 'jpeg' && (
                <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-lg">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Sfondo Trasparente</div>
                    <div className="text-[11px] text-slate-500">
                      Esporta solo testi e sticker (perfetto come adesivo o overlay video)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTransparentBg(!transparentBg)}
                    className={`w-11 h-6 rounded-full transition relative ${
                      transparentBg ? 'bg-indigo-600' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        transparentBg ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleExportImage}
                  className="flex-1 py-3 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50 text-sm"
                >
                  {isExporting ? (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-spin text-indigo-300" /> {exportMessage}
                    </span>
                  ) : copiedStatus === 'image-downloaded' ? (
                    <span className="flex items-center gap-2 text-emerald-300">
                      <Check className="w-4 h-4" /> Scaricato con Successo!
                    </span>
                  ) : (
                    <>
                      <Download className="w-4 h-4" /> Scarica {imageFormat.toUpperCase()} ({format.width * resolutionScale}×
                      {format.height * resolutionScale})
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleCopyClipboardImage}
                  className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-lg border border-slate-700 flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50 text-sm"
                >
                  {copiedStatus === 'clipboard-copied' ? (
                    <span className="flex items-center gap-2 text-emerald-400">
                      <Check className="w-4 h-4" /> Copiato negli Appunti!
                    </span>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copia Immagine HD
                    </>
                  )}
                </button>
              </div>

              {/* Quality & Font Guarantee Notice */}
              <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/20 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Garanzia Tipografica & Colori:</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  I font Google scelti e le sfumature di colore sono <strong>incorporati direttamente nel file in formato vettoriale ad alta definizione</strong>. Il file esportato preserva con precisione millimetrica caratteri speciali, ombre neon e gradienti di testo.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'video' && (
            <div className="space-y-5">
              {/* Composition Summary */}
              <div className="p-4 bg-indigo-950/35 border border-indigo-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                    <Video className="w-4 h-4 text-indigo-400" />
                    <span>
                      {background.type === 'video' && background.video && background.coverImage
                        ? 'Video + Copertina Abbinati'
                        : background.type === 'video' && background.video
                        ? 'Video di Sfondo + Testi Animati'
                        : 'Video Animato da Testi & Sfondo'}
                    </span>
                  </div>
                  {background.blur > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                      Sfocatura {background.blur}px attiva
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {background.type === 'video' && background.video && background.coverImage
                    ? (background.coverMode || 'intro') === 'intro'
                      ? `Il video verrà creato partendo dalla Copertina iniziale (${background.coverDuration ?? 2}s) seguita dal Video con tutti i testi animati, sticker e sfocatura.`
                      : (background.coverMode || 'intro') === 'framed'
                      ? 'Il video verrà creato con la Copertina sullo sfondo (con eventuale sfocatura) e il Video riprodotto nel riquadro centrale insieme a testi e sticker.'
                      : 'Il video verrà creato con il Video a schermo intero e tutti i testi animati, sticker e sfocatura.'
                    : background.type === 'video' && background.video
                    ? 'Verrà creato un file video completo unendo il video di sfondo, la sfocatura, i testi animati e gli sticker.'
                    : 'Non hai caricato un video: verrà generato un video animato delle tue scritte, sticker e sfondo.'}
                </p>
              </div>

              {/* Resolution Selector */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-2">
                  Qualità Video
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isExporting}
                    onClick={() => setVideoQuality('hd720')}
                    className={`p-3 rounded-lg border text-left transition ${
                      videoQuality === 'hd720'
                        ? 'border-indigo-500 bg-indigo-600/15 text-indigo-200'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-100">HD 720p (Veloce)</div>
                    <div className="text-[10px] text-slate-400 mt-1">Rendering più rapido, file leggero</div>
                  </button>
                  <button
                    type="button"
                    disabled={isExporting}
                    onClick={() => setVideoQuality('full1080')}
                    className={`p-3 rounded-lg border text-left transition ${
                      videoQuality === 'full1080'
                        ? 'border-indigo-500 bg-indigo-600/15 text-indigo-200'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-100">Full HD ({format.width}×{format.height})</div>
                    <div className="text-[10px] text-slate-400 mt-1">Massima qualità per Reels & TikTok</div>
                  </button>
                </div>
              </div>

              {/* Fallback Duration when no video is uploaded */}
              {!(background.type === 'video' && background.video) && (
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-2">
                    Durata Clip ({fallbackDuration} secondi)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[4, 6, 8, 10].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        disabled={isExporting}
                        onClick={() => setFallbackDuration(sec)}
                        className={`py-2 rounded-lg border text-xs font-bold transition ${
                          fallbackDuration === sec
                            ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                            : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {isExporting && (
                <div className="p-4 bg-slate-950 border border-indigo-500/30 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-indigo-300 font-semibold flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      {videoStageText || 'Creazione video in corso...'}
                    </span>
                    <span className="font-mono font-bold text-slate-200">{videoProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-200"
                      style={{ width: `${videoProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {videoError && (
                <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-lg flex items-center gap-2 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{videoError}</span>
                </div>
              )}

              {/* Create / Cancel Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleExportVideo}
                  className="flex-1 py-3 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50 text-sm"
                >
                  {isExporting ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" /> Creazione in corso...
                    </>
                  ) : copiedStatus === 'video-downloaded' ? (
                    <span className="flex items-center gap-2 text-emerald-300">
                      <Check className="w-4 h-4" /> Video Scaricato con Successo!
                    </span>
                  ) : (
                    <>
                      <Download className="w-4 h-4" /> Crea & Scarica Video
                    </>
                  )}
                </button>
                {isExporting && (
                  <button
                    type="button"
                    onClick={handleCancelVideo}
                    className="py-3 px-4 bg-slate-800 hover:bg-rose-950 text-slate-200 hover:text-rose-300 font-semibold rounded-lg border border-slate-700 text-sm transition"
                  >
                    Annulla
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'html' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-lg flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-200 leading-relaxed">
                  Il file HTML esportato è <strong>100% autonomo</strong>: include tutte le animazioni CSS, i font
                  Google integrati, il layout responsive proporzionale ({format.ratio}) e funziona ovunque senza dipendenze o server.
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadHtml}
                  className="flex-1 py-3 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition text-sm"
                >
                  {copiedStatus === 'html-downloaded' ? (
                    <span className="flex items-center gap-2 text-emerald-200">
                      <Check className="w-4 h-4" /> File HTML Scaricato!
                    </span>
                  ) : (
                    <>
                      <Download className="w-4 h-4" /> Scarica File .HTML
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCopyHtmlCode}
                  className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 flex items-center justify-center gap-2 transition text-sm"
                >
                  {copiedStatus === 'code-copied' ? (
                    <span className="flex items-center gap-2 text-emerald-400">
                      <Check className="w-4 h-4" /> Codice HTML Copiato!
                    </span>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copia Codice
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'project' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-indigo-400" />
                  Salvataggio Progetto JSON
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  Scarica il file completo di progetto per ricaricarlo in qualsiasi momento, modificare testi, font,
                  colori e sfondi senza perdere alcuna impostazione.
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportProjectJson}
                className="w-full py-3 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition text-sm"
              >
                {copiedStatus === 'project-exported' ? (
                  <span className="flex items-center gap-2 text-indigo-200">
                    <Check className="w-4 h-4" /> Progetto Salvato!
                  </span>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Scarica File Progetto (.socialtype)
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
