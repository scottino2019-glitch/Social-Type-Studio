import React, { useState, useRef, useEffect } from 'react';
import { CanvasElement, CanvasTextElement, CanvasImageElement } from '../types';
import { getAnimationCssRule } from '../data/animations';

interface ElementViewProps {
  element: CanvasElement;
  isSelected: boolean;
  scaleRatio: number;
  playAnimations: boolean;
  onSelect: (id: string, e: React.SyntheticEvent) => void;
  onStartDrag: (id: string, e: React.PointerEvent) => void;
  onUpdateText?: (id: string, newText: string) => void;
}

export const ElementView: React.FC<ElementViewProps> = ({
  element,
  isSelected,
  scaleRatio,
  playAnimations,
  onSelect,
  onStartDrag,
  onUpdateText,
}) => {
  if (element.hidden) return null;

  if (element.type === 'text') {
    return (
      <TextElementView
        element={element}
        isSelected={isSelected}
        scaleRatio={scaleRatio}
        playAnimations={playAnimations}
        onSelect={onSelect}
        onStartDrag={onStartDrag}
        onUpdateText={onUpdateText}
      />
    );
  }

  return (
    <ImageElementView
      element={element}
      isSelected={isSelected}
      scaleRatio={scaleRatio}
      onStartDrag={onStartDrag}
    />
  );
};

const TextElementView: React.FC<{
  element: CanvasTextElement;
  isSelected: boolean;
  scaleRatio: number;
  playAnimations: boolean;
  onSelect: (id: string, e: React.SyntheticEvent) => void;
  onStartDrag: (id: string, e: React.PointerEvent) => void;
  onUpdateText?: (id: string, newText: string) => void;
}> = ({ element, isSelected, scaleRatio, playAnimations, onSelect, onStartDrag, onUpdateText }) => {
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [editableText, setEditableText] = useState(element.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditableText(element.text);
  }, [element.text]);

  useEffect(() => {
    if (isEditingInline && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditingInline]);

  const scaledFontSize = Math.max(10, element.fontSize * scaleRatio);
  const scaledLetterSpacing = element.letterSpacing * scaleRatio;
  const scaledPadding = (element.backgroundPadding || 0) * scaleRatio;
  const scaledBorderRadius = (element.borderRadius || 0) * scaleRatio;

  // Shadow calculation
  let shadowStyle = 'none';
  if (element.shadow.enabled) {
    const blur = element.shadow.blur * scaleRatio;
    const offX = element.shadow.offsetX * scaleRatio;
    const offY = element.shadow.offsetY * scaleRatio;

    if (element.shadow.preset === 'neon') {
      shadowStyle = `0 0 ${blur * 0.4}px ${element.shadow.color}, 0 0 ${blur}px ${element.shadow.color}, 0 0 ${blur * 1.6}px ${element.shadow.color}`;
    } else if (element.shadow.preset === 'retro3d') {
      shadowStyle = `${offX}px ${offY}px 0px ${element.shadow.color}`;
    } else {
      shadowStyle = `${offX}px ${offY}px ${blur}px ${element.shadow.color}`;
    }
  }

  // Gradient or solid color
  let colorStyles: React.CSSProperties = {
    color: element.color || '#ffffff',
    WebkitTextFillColor: element.color || '#ffffff',
    backgroundImage: 'none',
    WebkitBackgroundClip: 'border-box',
    backgroundClip: 'border-box',
  };

  if (element.gradient && element.gradient.enabled && element.gradient.stops && element.gradient.stops.length > 0) {
    const stopsStr = element.gradient.stops.map((s) => `${s.color} ${s.offset}%`).join(', ');
    const bgGradient =
      element.gradient.type === 'radial'
        ? `radial-gradient(circle, ${stopsStr})`
        : `linear-gradient(${element.gradient.angle || 90}deg, ${stopsStr})`;

    colorStyles = {
      backgroundImage: bgGradient,
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      color: 'transparent',
      display: 'inline-block',
    };
  }

  // Stroke
  const strokeStyles: React.CSSProperties = element.stroke.enabled
    ? {
        WebkitTextStroke: `${element.stroke.width * scaleRatio}px ${element.stroke.color}`,
      }
    : {};

  // Animation
  const animationRule =
    playAnimations && !isEditingInline && element.animation.type !== 'none'
      ? getAnimationCssRule(element.animation.type, element.animation.duration, element.animation.iterationCount)
      : 'none';

  const handleBlur = () => {
    setIsEditingInline(false);
    if (onUpdateText && editableText !== element.text) {
      onUpdateText(element.id, editableText);
    }
  };

  return (
    <div
      id={`canvas-elem-${element.id}`}
      onPointerDown={(e) => {
        if (isEditingInline) return;
        onStartDrag(element.id, e);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setIsEditingInline(true);
      }}
      className={`absolute select-none cursor-move group transition-shadow ${
        isSelected ? '' : 'hover:ring-1 hover:ring-white/40 rounded'
      }`}
      style={{
        left: `${element.x * scaleRatio}px`,
        top: `${element.y * scaleRatio}px`,
        width: `${(element.width || 800) * scaleRatio}px`,
        textAlign: element.textAlign,
        transform: `rotate(${element.rotation}deg)`,
        transformOrigin: 'top left',
        opacity: element.opacity,
        zIndex: element.zIndex,
        touchAction: 'none',
      }}
    >
      {isEditingInline ? (
        <textarea
          ref={textareaRef}
          value={editableText}
          onChange={(e) => setEditableText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleBlur();
            }
          }}
          className="bg-slate-900/90 text-white border-2 border-indigo-500 rounded p-2 focus:outline-none resize-none"
          style={{
            fontFamily: element.fontFamily,
            fontSize: `${scaledFontSize}px`,
            fontWeight: element.fontWeight,
            letterSpacing: `${scaledLetterSpacing}px`,
            lineHeight: element.lineHeight || 1.1,
            textAlign: element.textAlign,
            width: `${Math.max(160, (element.width || 400) * scaleRatio)}px`,
            minHeight: `${Math.max(60, scaledFontSize * 2)}px`,
          }}
        />
      ) : (
        <div
          style={{
            fontFamily: element.fontFamily,
            fontSize: `${scaledFontSize}px`,
            fontWeight: element.fontWeight,
            fontStyle: element.fontStyle,
            textTransform: element.textTransform,
            textAlign: element.textAlign,
            letterSpacing: `${scaledLetterSpacing}px`,
            lineHeight: element.lineHeight,
            textShadow: shadowStyle,
            backgroundColor: element.backgroundColor || 'transparent',
            padding: scaledPadding > 0 ? `${scaledPadding}px` : undefined,
            borderRadius: scaledBorderRadius > 0 ? `${scaledBorderRadius}px` : undefined,
            animation: animationRule,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxWidth: '100%',
            ...colorStyles,
            display: 'inline-block',
            ...strokeStyles,
          }}
        >
          {element.text}
        </div>
      )}
    </div>
  );
};

const ImageElementView: React.FC<{
  element: CanvasImageElement;
  isSelected: boolean;
  scaleRatio: number;
  onStartDrag: (id: string, e: React.PointerEvent) => void;
}> = ({ element, isSelected, scaleRatio, onStartDrag }) => {
  const scaledWidth = element.width * scaleRatio * element.scale;
  const filterStyle = `brightness(${element.filter.brightness}%) contrast(${element.filter.contrast}%) blur(${
    element.filter.blur * scaleRatio
  }px) saturate(${element.filter.saturate}%)`;

  const transformStyle = `rotate(${element.rotation}deg) ${element.flipX ? 'scaleX(-1)' : ''} ${
    element.flipY ? 'scaleY(-1)' : ''
  }`;

  return (
    <div
      id={`canvas-elem-${element.id}`}
      onPointerDown={(e) => onStartDrag(element.id, e)}
      className={`absolute select-none cursor-move group transition-shadow ${
        isSelected ? '' : 'hover:ring-1 hover:ring-white/40 rounded'
      }`}
      style={{
        left: `${element.x * scaleRatio}px`,
        top: `${element.y * scaleRatio}px`,
        zIndex: element.zIndex,
        opacity: element.opacity,
        transform: transformStyle,
        transformOrigin: 'top left',
        touchAction: 'none',
      }}
    >
      <img
        src={element.src}
        alt={element.name}
        draggable={false}
        className="pointer-events-none block"
        style={{
          width: `${scaledWidth}px`,
          height: 'auto',
          borderRadius: `${element.borderRadius * scaleRatio}px`,
          mixBlendMode: element.blendMode,
          filter: filterStyle,
        }}
      />
    </div>
  );
};
