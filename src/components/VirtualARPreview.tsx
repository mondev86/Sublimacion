import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  CheckCircle,
  Shirt,
  Coffee,
  ShoppingBag,
  RotateCw,
  Move,
  Layers,
  Sparkles,
  Ruler,
  Upload,
  RefreshCw,
  Maximize2,
  Minimize2,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { createDefaultDemoArtworks } from '../utils/imageProcessing';

interface VirtualARPreviewProps {
  initialDesignUrl?: string;
}

type GarmentType = 'tshirt' | 'hoodie' | 'mug' | 'tote';

interface ProductConfig {
  name: string;
  image: string;
  defaultX: number;
  defaultY: number;
  defaultScale: number;
  maxW: number;
  maxH: number;
  hasCollarGuide: boolean;
  supportsColor: boolean;
  hint: string;
}

const PRODUCT_TEMPLATES: Record<GarmentType, ProductConfig> = {
  tshirt: {
    name: 'Remera Algodón',
    image: '/src/assets/images/tshirt_mockup_template_1790601196004.jpg',
    defaultX: 50,
    defaultY: 44,
    defaultScale: 1.0,
    maxW: 260,
    maxH: 260,
    hasCollarGuide: true,
    supportsColor: true,
    hint: 'Estampado DTF Textil frontal / pecho'
  },
  hoodie: {
    name: 'Buzo Hoodie',
    image: '/src/assets/images/clean_hoodie_mockup_1790773659857.jpg',
    defaultX: 50,
    defaultY: 45,
    defaultScale: 0.95,
    maxW: 250,
    maxH: 250,
    hasCollarGuide: false,
    supportsColor: true,
    hint: 'Estampado limpio en pecho sin cordones'
  },
  mug: {
    name: 'Taza Cerámica',
    image: '/src/assets/images/ceramic_mug_mockup_1790690009319.jpg',
    defaultX: 47,
    defaultY: 53,
    defaultScale: 0.65,
    maxW: 160,
    maxH: 160,
    hasCollarGuide: false,
    supportsColor: false,
    hint: 'Sublimación cilíndrica 11 oz'
  },
  tote: {
    name: 'Bolsa Tote',
    image: '/src/assets/images/totebag_mockup_template_1790690023676.jpg',
    defaultX: 50,
    defaultY: 58,
    defaultScale: 0.9,
    maxW: 240,
    maxH: 240,
    hasCollarGuide: false,
    supportsColor: true,
    hint: 'Lienzo ecológico de algodón'
  }
};

export const VirtualARPreview: React.FC<VirtualARPreviewProps> = ({ initialDesignUrl }) => {
  const demos = createDefaultDemoArtworks();
  const [activeDesignUrl, setActiveDesignUrl] = useState<string>(
    initialDesignUrl || demos[0].url
  );

  useEffect(() => {
    if (initialDesignUrl) {
      setActiveDesignUrl(initialDesignUrl);
    }
  }, [initialDesignUrl]);

  // Product selection
  const [garmentType, setGarmentType] = useState<GarmentType>('tshirt');
  const [customBackdropUrl, setCustomBackdropUrl] = useState<string | null>(null);

  // Placement Ruler & Guidelines Toggle
  const [showPlacementRuler, setShowPlacementRuler] = useState<boolean>(true);

  // Design positioning on garment
  const [posX, setPosX] = useState<number>(PRODUCT_TEMPLATES.tshirt.defaultX);
  const [posY, setPosY] = useState<number>(PRODUCT_TEMPLATES.tshirt.defaultY);
  const [scale, setScale] = useState<number>(PRODUCT_TEMPLATES.tshirt.defaultScale);
  const [rotation, setRotation] = useState<number>(0);
  const [blendMode, setBlendMode] = useState<'multiply' | 'normal' | 'overlay'>('normal');
  const [opacity, setOpacity] = useState<number>(1.0);

  // Garment mockup color
  const [garmentColor, setGarmentColor] = useState<string>('#0f172a'); // default black

  // Fullscreen Theater Mode state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [fullscreenZoom, setFullscreenZoom] = useState<number>(1.0);

  // Close fullscreen with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Capture preview snapshot
  const [capturedSnapshotUrl, setCapturedSnapshotUrl] = useState<string | null>(null);

  // Canvas ref
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const customFileInputRef = useRef<HTMLInputElement | null>(null);

  // Switch product type and apply realistic defaults
  const switchProductType = (type: GarmentType) => {
    setGarmentType(type);
    setCustomBackdropUrl(null);
    const cfg = PRODUCT_TEMPLATES[type];
    setPosX(cfg.defaultX);
    setPosY(cfg.defaultY);
    setScale(cfg.defaultScale);
    setRotation(0);
  };

  // Handle custom garment photo upload
  const handleCustomBackdropUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCustomBackdropUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Pre-configured Placement Presets
  const applyPreset = (preset: 'chest_pocket' | 'front_center' | 'back_full') => {
    if (preset === 'chest_pocket') {
      setPosX(38);
      setPosY(32);
      setScale(0.45);
    } else if (preset === 'front_center') {
      setPosX(50);
      setPosY(42);
      setScale(0.85);
    } else if (preset === 'back_full') {
      setPosX(50);
      setPosY(46);
      setScale(1.2);
    }
  };

  // Capture Snapshot with watermark for customer approval
  const takeSnapshot = () => {
    const canvas = compositeCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1200;
    canvas.height = 1200;

    const currentConfig = PRODUCT_TEMPLATES[garmentType];

    const renderComposite = (backdropImg: HTMLImageElement) => {
      // 1. Draw base color background if using standard template with color support
      if (!customBackdropUrl) {
        if (currentConfig.supportsColor) {
          ctx.fillStyle = garmentColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }

      // 2. Draw template texture / custom backdrop
      ctx.drawImage(backdropImg, 0, 0, canvas.width, canvas.height);

      // 3. Draw design
      const designImg = new Image();
      designImg.crossOrigin = 'anonymous';
      designImg.onload = () => {
        const dw = ((currentConfig.maxW / 650) * canvas.width) * scale;
        const dh = ((currentConfig.maxH / 650) * canvas.height) * scale;
        const dx = (posX / 100) * canvas.width;
        const dy = (posY / 100) * canvas.height;

        ctx.save();
        ctx.translate(dx, dy);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.globalAlpha = opacity;
        
        // On dark garments, always render normal so design doesn't darken
        ctx.globalCompositeOperation = (garmentColor === '#0f172a' || garmentColor === '#000000' || blendMode === 'normal')
          ? 'source-over'
          : 'multiply';

        ctx.drawImage(designImg, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();

        // 4. Stamp Watermark Banner for customer validation
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.fillRect(0, canvas.height - 90, canvas.width, 90);

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(`MOCKUP DE PRODUCCIÓN · ${currentConfig.name.toUpperCase()}`, 40, canvas.height - 48);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(`Aprobación de muestra para cliente · Fecha: ${new Date().toLocaleDateString()}`, 40, canvas.height - 24);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setCapturedSnapshotUrl(dataUrl);
      };
      designImg.src = activeDesignUrl;
    };

    const bgImg = new Image();
    bgImg.crossOrigin = 'anonymous';
    bgImg.onload = () => renderComposite(bgImg);
    bgImg.src = customBackdropUrl || currentConfig.image;
  };

  const downloadSnapshot = () => {
    if (!capturedSnapshotUrl) return;
    const link = document.createElement('a');
    link.download = `Mockup_${PRODUCT_TEMPLATES[garmentType].name.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
    link.href = capturedSnapshotUrl;
    link.click();
  };

  const currentTemplate = PRODUCT_TEMPLATES[garmentType];

  return (
    <div className="flex flex-col xl:flex-row h-full w-full gap-4 p-4 text-slate-200">
      {/* LEFT: Studio Mockup Viewport */}
      <div className="flex-1 flex flex-col bg-[#111726] rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
        {/* Header Toolbar */}
        <div className="h-14 border-b border-slate-800 px-4 flex items-center justify-between bg-[#0e1422] shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Estudio de Mockups
            </span>
            <div className="h-4 w-px bg-slate-800" />
            
            {/* Real Product Switcher with active highlights */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-medium">
              <button
                onClick={() => switchProductType('tshirt')}
                className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                  garmentType === 'tshirt' && !customBackdropUrl
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shirt className="w-3.5 h-3.5" />
                Remera
              </button>
              <button
                onClick={() => switchProductType('hoodie')}
                className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                  garmentType === 'hoodie' && !customBackdropUrl
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Buzo Hoodie
              </button>
              <button
                onClick={() => switchProductType('mug')}
                className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                  garmentType === 'mug' && !customBackdropUrl
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                Taza
              </button>
              <button
                onClick={() => switchProductType('tote')}
                className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                  garmentType === 'tote' && !customBackdropUrl
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Bolsa Tote
              </button>
              <button
                onClick={() => customFileInputRef.current?.click()}
                className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                  customBackdropUrl
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Subir foto de tu propia prenda o maniquí"
              >
                <Upload className="w-3.5 h-3.5" />
                Subir Prenda
              </button>
              <input
                ref={customFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCustomBackdropUpload}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Placement Presets */}
            {garmentType === 'tshirt' && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => applyPreset('chest_pocket')}
                  className="px-2.5 py-1 rounded text-slate-400 hover:text-white transition-colors"
                >
                  Bolsillo
                </button>
                <button
                  onClick={() => applyPreset('front_center')}
                  className="px-2.5 py-1 rounded text-slate-400 hover:text-white transition-colors"
                >
                  Pecho Centro
                </button>
                <button
                  onClick={() => applyPreset('back_full')}
                  className="px-2.5 py-1 rounded text-slate-400 hover:text-white transition-colors"
                >
                  Espalda A3
                </button>
              </div>
            )}

            {/* Ruler Toggle */}
            <button
              onClick={() => setShowPlacementRuler(!showPlacementRuler)}
              className={`px-2.5 py-1 rounded text-xs border flex items-center gap-1.5 transition-colors ${
                showPlacementRuler
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Ruler className="w-3.5 h-3.5" />
              Guías Láser
            </button>

            {/* Vista Completa Button */}
            <button
              onClick={() => {
                setIsFullscreen(true);
                setFullscreenZoom(1.0);
              }}
              className="px-3.5 py-1.5 rounded-lg font-semibold text-xs bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm transition-all"
              title="Abrir en vista completa para apreciar mejor el diseño y los detalles"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Vista Completa</span>
            </button>

            {/* Take Snapshot Button */}
            <button
              onClick={takeSnapshot}
              className="px-3.5 py-1.5 rounded-lg font-semibold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generar Mockup PNG
            </button>
          </div>
        </div>

        {/* Viewport Display Area */}
        <div className="flex-1 relative flex items-center justify-center p-6 bg-[#090d16] overflow-hidden select-none">
          <div className="relative w-full max-w-2xl aspect-square rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center transition-colors">
            {/* Quick Fullscreen Button in corner of the mockup */}
            <button
              onClick={() => {
                setIsFullscreen(true);
                setFullscreenZoom(1.0);
              }}
              className="absolute top-3 right-3 z-30 px-2.5 py-1.5 rounded-lg bg-slate-900/85 hover:bg-slate-900 text-slate-200 hover:text-white border border-slate-700/80 backdrop-blur-md shadow-lg transition-transform hover:scale-105 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Expandir a vista completa para apreciar mejor el diseño"
            >
              <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Vista Completa</span>
            </button>

            {/* Garment Base Layer with realistic color tint */}
            <div
              className="absolute inset-0 transition-colors duration-300"
              style={{
                backgroundColor: customBackdropUrl
                  ? '#000000'
                  : currentTemplate.supportsColor
                  ? garmentColor
                  : '#ffffff',
              }}
            />

            {/* High-res generated product template texture or custom uploaded backdrop */}
            <img
              key={customBackdropUrl || currentTemplate.image}
              src={customBackdropUrl || currentTemplate.image}
              alt={currentTemplate.name}
              className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-200 ${
                customBackdropUrl
                  ? 'opacity-100 object-cover'
                  : currentTemplate.supportsColor
                  ? 'mix-blend-multiply opacity-90 object-cover'
                  : 'opacity-100 object-contain'
              }`}
            />

            {/* Laser Center Symmetry Line */}
            {showPlacementRuler && (
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px border-l border-dashed border-cyan-400/50 pointer-events-none z-10">
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-mono font-medium text-cyan-300 bg-slate-950/80 px-1.5 py-0.5 rounded shadow border border-cyan-500/30">
                  Eje Central
                </span>
              </div>
            )}

            {/* Collar Seam reference (for t-shirts only) */}
            {showPlacementRuler && currentTemplate.hasCollarGuide && !customBackdropUrl && (
              <div className="absolute top-[16%] left-1/2 -translate-x-1/2 w-36 border-b-2 border-indigo-400/50 rounded-b-full pointer-events-none z-10">
                <span className="absolute -top-3.5 right-0 translate-x-1/2 text-[8px] font-mono text-indigo-300/80 bg-slate-950/80 px-1 rounded border border-indigo-500/20">
                  Costura Cuello
                </span>
              </div>
            )}

            {/* Graphic Print Layer positioned on product - 100% Crisp on black garments! */}
            <div
              className="absolute pointer-events-none transition-transform duration-75 z-15 flex items-center justify-center"
              style={{
                left: `${posX}%`,
                top: `${posY}%`,
                width: `${((currentTemplate.maxW / 650) * 100) * scale}%`,
                height: `${((currentTemplate.maxH / 650) * 100) * scale}%`,
                transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                opacity: opacity,
                mixBlendMode: (garmentColor === '#0f172a' || garmentColor === '#000000' || blendMode === 'normal') ? 'normal' : blendMode,
              }}
            >
              {activeDesignUrl ? (
                <img
                  src={activeDesignUrl}
                  alt="Graphic Print"
                  className="w-full h-full object-contain pointer-events-none drop-shadow-xl"
                  style={{
                    filter: (garmentColor === '#0f172a' || garmentColor === '#000000')
                      ? 'drop-shadow(0 4px 14px rgba(0,0,0,0.65)) contrast(1.05)'
                      : 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))'
                  }}
                />
              ) : null}
            </div>

            {/* Placement Crosshair Guideline */}
            {showPlacementRuler && (
              <div
                className="absolute border border-indigo-400/40 rounded-lg pointer-events-none z-20"
                style={{
                  left: `${posX}%`,
                  top: `${posY}%`,
                  width: `${((currentTemplate.maxW / 650) * 100) * scale}%`,
                  height: `${((currentTemplate.maxH / 650) * 100) * scale}%`,
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                }}
              >
                <span className="absolute -top-4 left-0 text-[8px] font-mono text-indigo-300 bg-slate-950/80 px-1 rounded">
                  {currentTemplate.name} · {Math.round(scale * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Hidden Canvas for High-Res Composite export */}
          <canvas ref={compositeCanvasRef} className="hidden" />
        </div>

        {/* Bottom Swatches & Snapshot Modal Trigger */}
        <div className="h-16 border-t border-slate-800 bg-[#0e1422] px-6 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-3">
            {currentTemplate.supportsColor ? (
              <>
                <span className="text-slate-400 font-medium">Color de {currentTemplate.name}:</span>
                <div className="flex items-center gap-1.5">
                  {[
                    { hex: '#0f172a', name: 'Negro Carbón' },
                    { hex: '#ffffff', name: 'Blanco Óptico' },
                    { hex: '#1e3a8a', name: 'Azul Marino' },
                    { hex: '#991b1b', name: 'Rojo Carmesí' },
                    { hex: '#374151', name: 'Gris Jaspeado' },
                    { hex: '#14532d', name: 'Verde Militar' },
                    { hex: '#f472b6', name: 'Rosa Pastel' },
                  ].map((sw) => (
                    <button
                      key={sw.hex}
                      onClick={() => setGarmentColor(sw.hex)}
                      title={sw.name}
                      style={{ backgroundColor: sw.hex }}
                      className={`w-6 h-6 rounded-md border ${
                        garmentColor === sw.hex ? 'border-indigo-400 ring-2 ring-indigo-500/40' : 'border-slate-700'
                      } transition-all`}
                    />
                  ))}
                </div>
              </>
            ) : (
              <span className="text-slate-400 flex items-center gap-2">
                <Coffee className="w-4 h-4 text-amber-400" />
                <span>Cerámica blanca pura calidad Premium para sublimación (11 oz)</span>
              </span>
            )}
          </div>

          {capturedSnapshotUrl && (
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Mockup Generado
              </span>
              <button
                onClick={downloadSnapshot}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar Validación PNG
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Positioning & Adjustment Controls */}
      <div className="w-full xl:w-80 flex flex-col bg-[#111726] rounded-xl border border-slate-800 overflow-hidden shadow-2xl shrink-0">
        <div className="p-4 border-b border-slate-800 bg-[#0e1422]">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
            Ajuste de Estampa y Textil
          </span>
          <p className="text-[11px] text-slate-400">
            {currentTemplate.hint}
          </p>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          {/* Blend Mode Selection */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium block">Fusión con la Tela</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'normal', label: 'DTF Real (Opaco / Fiel)' },
                { id: 'multiply', label: 'Multiplicar (Telas Claras)' },
                { id: 'overlay', label: 'Superponer (Suave)' },
              ].map((bm) => (
                <button
                  key={bm.id}
                  onClick={() => setBlendMode(bm.id as any)}
                  className={`px-2 py-1.5 rounded-md font-medium text-[11px] border transition-colors ${
                    blendMode === bm.id
                      ? 'bg-indigo-600/30 border-indigo-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {bm.label.split(' ')[0]}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-500 block">
              "DTF Real (Normal)" mantiene los colores y logos 100% nítidos e intactos sobre prendas negras y oscuras.
            </span>
          </div>

          {/* Scale Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-medium">Tamaño de Estampa</label>
              <span className="font-mono text-indigo-400 font-semibold">{Math.round(scale * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="1.8"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Position Vertical (Y) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-medium">Altura en Prenda (Y)</label>
              <span className="font-mono text-indigo-400 font-semibold">{Math.round(posY)}%</span>
            </div>
            <input
              type="range"
              min="15"
              max="85"
              value={posY}
              onChange={(e) => setPosY(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Position Horizontal (X) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-medium">Centrado Horizontal (X)</label>
              <span className="font-mono text-indigo-400 font-semibold">{Math.round(posX)}%</span>
            </div>
            <input
              type="range"
              min="15"
              max="85"
              value={posX}
              onChange={(e) => setPosX(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Rotation Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-medium">Inclinación (Rotación)</label>
              <span className="font-mono text-indigo-400 font-semibold">{rotation}°</span>
            </div>
            <input
              type="range"
              min="-45"
              max="45"
              value={rotation}
              onChange={(e) => setRotation(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Select Sample Graphic */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <label className="text-slate-300 font-medium block">Diseño a Probar</label>
            <div className="grid grid-cols-3 gap-2">
              {demos.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setActiveDesignUrl(d.url)}
                  className={`p-1.5 rounded-lg border flex flex-col items-center gap-1 transition-colors ${
                    activeDesignUrl === d.url
                      ? 'bg-indigo-950/60 border-indigo-500'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <img src={d.url} alt={d.name} className="w-10 h-10 object-contain" />
                  <span className="text-[10px] text-slate-400 truncate max-w-full">
                    {d.name.split('_')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* VISTA COMPLETA (FULLSCREEN THEATER MODAL) */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-[#070b14]/98 backdrop-blur-xl flex flex-col p-3 sm:p-5 animate-in fade-in zoom-in-95 duration-150 select-none overflow-hidden">
          {/* Top Fullscreen Header & Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
                <Maximize2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base">Vista Completa del Mockup</h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                    HD Estudio
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {currentTemplate.name} · {currentTemplate.hint}
                </p>
              </div>
            </div>

            {/* Product Switcher inside Fullscreen */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-medium">
              {(['tshirt', 'hoodie', 'mug', 'tote'] as GarmentType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => switchProductType(type)}
                  className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                    garmentType === type && !customBackdropUrl
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {type === 'tshirt' && <Shirt className="w-3.5 h-3.5" />}
                  {type === 'hoodie' && <Layers className="w-3.5 h-3.5" />}
                  {type === 'mug' && <Coffee className="w-3.5 h-3.5" />}
                  {type === 'tote' && <ShoppingBag className="w-3.5 h-3.5" />}
                  <span>{PRODUCT_TEMPLATES[type].name.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* Color Swatches inside Fullscreen */}
            {currentTemplate.supportsColor && !customBackdropUrl && (
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 font-medium mr-1">Tela:</span>
                {[
                  { hex: '#0f172a', name: 'Negro Carbón' },
                  { hex: '#ffffff', name: 'Blanco Óptico' },
                  { hex: '#1e3a8a', name: 'Azul Marino' },
                  { hex: '#991b1b', name: 'Rojo Carmesí' },
                  { hex: '#374151', name: 'Gris Jaspeado' },
                  { hex: '#14532d', name: 'Verde Militar' },
                  { hex: '#f472b6', name: 'Rosa Pastel' },
                ].map((sw) => (
                  <button
                    key={sw.hex}
                    onClick={() => setGarmentColor(sw.hex)}
                    title={sw.name}
                    style={{ backgroundColor: sw.hex }}
                    className={`w-5 h-5 rounded-md border transition-all ${
                      garmentColor === sw.hex
                        ? 'border-indigo-400 ring-2 ring-indigo-500/50 scale-110 shadow-sm'
                        : 'border-slate-700 hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Tools, Zoom & Close Actions */}
            <div className="flex items-center gap-2">
              {/* Guides toggle */}
              <button
                onClick={() => setShowPlacementRuler(!showPlacementRuler)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                  showPlacementRuler
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Mostrar u ocultar guías de centrado láser"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Guías</span>
              </button>

              {/* Fullscreen Zoom Controls */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setFullscreenZoom((z) => Math.max(0.7, Math.round((z - 0.15) * 100) / 100))}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Alejar"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setFullscreenZoom(1.0)}
                  className="px-2 font-mono text-[11px] text-slate-300 hover:text-white transition-colors"
                  title="Restablecer zoom al 100%"
                >
                  {Math.round(fullscreenZoom * 100)}%
                </button>
                <button
                  onClick={() => setFullscreenZoom((z) => Math.min(2.0, Math.round((z + 0.15) * 100) / 100))}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Acercar para inspeccionar detalles del diseño"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Take snapshot directly from fullscreen */}
              <button
                onClick={takeSnapshot}
                className="px-3.5 py-1.5 rounded-lg font-semibold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-all"
                title="Generar y descargar muestra PNG con ficha técnica"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Guardar Mockup</span>
              </button>

              {/* Close Fullscreen Button */}
              <button
                onClick={() => {
                  setIsFullscreen(false);
                  setFullscreenZoom(1.0);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 flex items-center gap-1.5 text-xs font-semibold transition-colors"
                title="Cerrar vista completa (Esc)"
              >
                <X className="w-4 h-4 text-slate-400" />
                <span>Salir (Esc)</span>
              </button>
            </div>
          </div>

          {/* Central Fullscreen Viewport Area */}
          <div className="flex-1 relative flex items-center justify-center p-2 sm:p-6 overflow-auto">
            <div
              className="relative transition-transform duration-150 ease-out shadow-2xl rounded-2xl overflow-hidden border border-slate-700/80 flex items-center justify-center bg-black/40 aspect-square"
              style={{
                width: 'min(90vw, 76vh)',
                height: 'min(90vw, 76vh)',
                maxWidth: '820px',
                maxHeight: '820px',
                transform: `scale(${fullscreenZoom})`,
              }}
            >
              {/* Garment Base Layer with realistic color tint */}
              <div
                className="absolute inset-0 transition-colors duration-300"
                style={{
                  backgroundColor: customBackdropUrl
                    ? '#000000'
                    : currentTemplate.supportsColor
                    ? garmentColor
                    : '#ffffff',
                }}
              />

              {/* Product template high-res texture */}
              <img
                src={customBackdropUrl || currentTemplate.image}
                alt={currentTemplate.name}
                className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-200 ${
                  customBackdropUrl
                    ? 'opacity-100 object-cover'
                    : currentTemplate.supportsColor
                    ? 'mix-blend-multiply opacity-90 object-cover'
                    : 'opacity-100 object-contain'
                }`}
              />

              {/* Laser Center Symmetry Line */}
              {showPlacementRuler && (
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px border-l border-dashed border-cyan-400/50 pointer-events-none z-10">
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-mono font-medium text-cyan-300 bg-slate-950/80 px-1.5 py-0.5 rounded shadow border border-cyan-500/30">
                    Centro Láser
                  </span>
                </div>
              )}

              {/* Collar Seam reference (for t-shirts only) */}
              {showPlacementRuler && currentTemplate.hasCollarGuide && !customBackdropUrl && (
                <div className="absolute top-[16%] left-1/2 -translate-x-1/2 w-36 border-b-2 border-indigo-400/50 rounded-b-full pointer-events-none z-10">
                  <span className="absolute -top-3.5 right-0 translate-x-1/2 text-[8px] font-mono text-indigo-300/80 bg-slate-950/80 px-1 rounded border border-indigo-500/20">
                    Costura Cuello
                  </span>
                </div>
              )}

              {/* Side Blueprint Measurement Bracket */}
              {showPlacementRuler && posY > 18 && (
                <div
                  className="absolute pointer-events-none z-20"
                  style={{
                    left: `${Math.min(88, posX + 22 * scale)}%`,
                    top: '16%',
                    height: `${Math.max(4, posY - 16 - (12 * scale))}%`,
                  }}
                >
                  <div className="w-full h-full border-r-2 border-yellow-400/70 relative">
                    <div className="absolute top-0 right-0 w-2 h-0.5 bg-yellow-400" />
                    <div className="absolute bottom-0 right-0 w-2 h-0.5 bg-yellow-400" />
                    <span className="absolute top-1/2 left-2 -translate-y-1/2 text-[9px] font-mono font-bold text-white bg-slate-950/95 px-1.5 py-0.5 rounded shadow border border-slate-700 whitespace-nowrap">
                      ↓ {Math.max(2, Math.round(((posY - 16) / 100) * 36 * 10) / 10)} cm
                    </span>
                  </div>
                </div>
              )}

              {/* Graphic Print Layer positioned on product - 100% identical position with normal view! */}
              <div
                className="absolute pointer-events-none transition-transform duration-75 z-15 flex items-center justify-center"
                style={{
                  left: `${posX}%`,
                  top: `${posY}%`,
                  width: `${((currentTemplate.maxW / 650) * 100) * scale}%`,
                  height: `${((currentTemplate.maxH / 650) * 100) * scale}%`,
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                  opacity: opacity,
                  mixBlendMode: (garmentColor === '#0f172a' || garmentColor === '#000000' || blendMode === 'normal') ? 'normal' : blendMode,
                }}
              >
                {activeDesignUrl ? (
                  <img
                    src={activeDesignUrl}
                    alt="Graphic Print Fullscreen"
                    className="w-full h-full object-contain pointer-events-none drop-shadow-2xl"
                    style={{
                      filter: (garmentColor === '#0f172a' || garmentColor === '#000000')
                        ? 'drop-shadow(0 4px 18px rgba(0,0,0,0.75)) contrast(1.05)'
                        : 'drop-shadow(0 3px 12px rgba(0,0,0,0.30))'
                    }}
                  />
                ) : null}
              </div>

              {/* Placement Crosshair Guideline */}
              {showPlacementRuler && (
                <div
                  className="absolute border border-indigo-400/40 rounded-lg pointer-events-none z-20"
                  style={{
                    left: `${posX}%`,
                    top: `${posY}%`,
                    width: `${((currentTemplate.maxW / 650) * 100) * scale}%`,
                    height: `${((currentTemplate.maxH / 650) * 100) * scale}%`,
                    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                  }}
                >
                  <span className="absolute -top-4 left-0 text-[9px] font-mono font-medium text-indigo-300 bg-slate-950/90 px-1.5 py-0.5 rounded border border-indigo-500/30">
                    {currentTemplate.name} · {Math.round(scale * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Fullscreen Bottom Bar with Color Swatches on Mobile + Info */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 px-2 shrink-0 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span>Colores 100% nítidos con base blanca DTF. Presiona <strong>Esc</strong> para volver al editor.</span>
            </div>

            {/* Mobile color swatches bar */}
            {currentTemplate.supportsColor && !customBackdropUrl && (
              <div className="flex lg:hidden items-center gap-1.5">
                {[
                  { hex: '#0f172a', name: 'Negro' },
                  { hex: '#ffffff', name: 'Blanco' },
                  { hex: '#1e3a8a', name: 'Azul' },
                  { hex: '#991b1b', name: 'Rojo' },
                  { hex: '#374151', name: 'Gris' },
                  { hex: '#14532d', name: 'Verde' },
                  { hex: '#f472b6', name: 'Rosa' },
                ].map((sw) => (
                  <button
                    key={sw.hex}
                    onClick={() => setGarmentColor(sw.hex)}
                    style={{ backgroundColor: sw.hex }}
                    className={`w-4 h-4 rounded border ${
                      garmentColor === sw.hex ? 'border-indigo-400 ring-2 ring-indigo-500' : 'border-slate-700'
                    }`}
                  />
                ))}
              </div>
            )}

            <div className="font-mono text-[11px] text-slate-500">
              Zoom: {Math.round(fullscreenZoom * 100)}% · Posición: X {Math.round(posX)}% / Y {Math.round(posY)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
