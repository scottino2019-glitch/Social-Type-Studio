import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';

interface SafeZoneOverlayProps {
  canvasWidth: number;
  canvasHeight: number;
}

export const SafeZoneOverlay: React.FC<SafeZoneOverlayProps> = ({ canvasWidth, canvasHeight }) => {
  // Safe zone for 9:16 Instagram / TikTok
  const topCutoff = (220 / 1920) * canvasHeight;
  const bottomCutoff = (320 / 1920) * canvasHeight;
  const sideMargin = (40 / 1080) * canvasWidth;

  return (
    <div
      id="safe-zone-overlay"
      className="canvas-overlay-guide absolute inset-0 pointer-events-none z-50 overflow-hidden"
    >
      {/* Top Bar Safe Zone (IG Story Header / Close Icon) */}
      <div
        className="absolute top-0 left-0 right-0 border-b border-rose-500/40 bg-rose-500/10 flex items-center justify-center px-4"
        style={{ height: `${topCutoff}px` }}
      >
        <span className="text-[11px] font-medium tracking-wide text-rose-400/90 bg-black/60 px-2.5 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-1.5 shadow-sm">
          <ShieldAlert className="w-3 h-3 text-rose-400" />
          Area Intestazione / Header Instagram & TikTok (Evita testi qui)
        </span>
      </div>

      {/* Bottom Bar Safe Zone (IG Story Reply / TikTok Caption & Music) */}
      <div
        className="absolute bottom-0 left-0 right-0 border-t border-rose-500/40 bg-rose-500/10 flex items-center justify-center px-4"
        style={{ height: `${bottomCutoff}px` }}
      >
        <span className="text-[11px] font-medium tracking-wide text-rose-400/90 bg-black/60 px-2.5 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-1.5 shadow-sm">
          <Info className="w-3 h-3 text-rose-400" />
          Area Barra di Risposta / Didascalia (Coperta dall'app)
        </span>
      </div>

      {/* Safe Area Box */}
      <div
        className="absolute border border-dashed border-sky-400/40 rounded-lg pointer-events-none"
        style={{
          top: `${topCutoff + 8}px`,
          bottom: `${bottomCutoff + 8}px`,
          left: `${sideMargin}px`,
          right: `${sideMargin}px`,
        }}
      >
        <div className="absolute top-2 left-2 text-[10px] font-mono text-sky-400/80 bg-sky-950/70 px-1.5 py-0.5 rounded border border-sky-500/20">
          ✓ Area Sicura Visibile
        </div>
      </div>
    </div>
  );
};
