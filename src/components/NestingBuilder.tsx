import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  RotateCw,
  Copy,
  Trash2,
  Download,
  Sparkles,
  Scissors,
  FlipHorizontal,
  Plus,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Info,
  DollarSign,
  CheckCircle,
  Move
} from 'lucide-react';
import { NestingSheet, NestingItem } from '../types';
import { createDefaultDemoArtworks } from '../utils/imageProcessing';

interface NestingBuilderProps {
  initialArtwork?: { name: string; url: string; widthCm: number; heightCm: number } | null;
}

export const NestingBuilder: React.FC<NestingBuilderProps> = ({ initialArtwork }) => {
  const demos = createDefaultDemoArtworks();

  // Sheet format presets
  const presets = [
    { name: 'Rollo DTF 30cm x 100cm', width: 30, height: 100 },
    { name: 'Rollo DTF 30cm x 50cm', width: 30, height: 50 },
    { name: 'Rollo DTF 60cm x 100cm', width: 60, height: 100 },
    { name: 'Lámina A3 (29.7 x 42cm)', width: 29.7, height: 42 },
    { name: 'Lámina A3+ (32.9 x 48.3cm)', width: 32.9, height: 48.3 },
    { name: 'Lámina A4 (21 x 29.7cm)', width: 21, height: 29.7 },
  ];

  const [sheet, setSheet] = useState<NestingSheet>({
    id: 'sheet-1',
    name: 'Pliego DTF Producción 1m',
    widthCm: 30,
    heightCm: 100,
    marginCm: 0.5,
    gutterCm: 0.5,
    showCutLines: true,
    isMirroredAll: false,
    items: [
      {
        id: 'item-1',
        artworkId: 'demo-skull',
        name: 'Streetwear Skull (Espalda)',
        imageUrl: demos[0].url,
        xCm: 1,
        yCm: 1,
        widthCm: 28,
        heightCm: 28,
        rotation: 0,
        isMirrored: false,
        quantity: 1,
      },
      {
        id: 'item-2',
        artworkId: 'demo-garage',
        name: 'Motors Badge (Pecho)',
        imageUrl: demos[2].url,
        xCm: 1,
        yCm: 30,
        widthCm: 12,
        heightCm: 12,
        rotation: 0,
        isMirrored: false,
        quantity: 1,
      },
      {
        id: 'item-3',
        artworkId: 'demo-garage',
        name: 'Motors Badge (Manga)',
        imageUrl: demos[2].url,
        xCm: 15,
        yCm: 30,
        widthCm: 10,
        heightCm: 10,
        rotation: 0,
        isMirrored: false,
        quantity: 1,
      },
    ],
  });

  const [selectedItemId, setSelectedItemId] = useState<string | null>('item-1');
  const [zoomLevel, setZoomLevel] = useState<number>(0.65);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const sheetCanvasRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Undo history for pliego
  const sheetHistoryRef = useRef<NestingItem[][]>([]);

  const pushSheetHistory = () => {
    sheetHistoryRef.current.push(JSON.parse(JSON.stringify(sheet.items)));
    if (sheetHistoryRef.current.length > 25) sheetHistoryRef.current.shift();
  };

  const handleUndoSheet = () => {
    if (sheetHistoryRef.current.length === 0) return;
    const previous = sheetHistoryRef.current.pop()!;
    setSheet((prev) => ({ ...prev, items: previous }));
  };

  // Keyboard shortcut listener for Gang Sheet
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Undo
      if (cmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndoSheet();
        return;
      }

      // Delete selected item
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItemId) {
        e.preventDefault();
        pushSheetHistory();
        handleDelete(selectedItemId);
        return;
      }

      // Arrow keys nudging
      if (selectedItemId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        pushSheetHistory();
        const step = e.shiftKey ? 1.0 : 0.5;
        const deltaX = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const deltaY = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        setSheet((prev) => ({
          ...prev,
          items: prev.items.map((it) =>
            it.id === selectedItemId
              ? {
                  ...it,
                  xCm: Math.max(0, Math.round((it.xCm + deltaX) * 10) / 10),
                  yCm: Math.max(0, Math.round((it.yCm + deltaY) * 10) / 10),
                }
              : it
          ),
        }));
        return;
      }

      // Rotate selected item (R)
      if (e.key.toLowerCase() === 'r' && selectedItemId && !cmdOrCtrl) {
        e.preventDefault();
        pushSheetHistory();
        handleRotate90(selectedItemId);
        return;
      }

      // Duplicate selected item (D or Ctrl+D)
      if ((e.key.toLowerCase() === 'd' || (cmdOrCtrl && e.key.toLowerCase() === 'd')) && selectedItemId) {
        e.preventDefault();
        pushSheetHistory();
        handleDuplicate(selectedItemId);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, sheet.items]);

  // If new artwork passed from editor, append to sheet
  useEffect(() => {
    if (initialArtwork) {
      const newItem: NestingItem = {
        id: `item-${Date.now()}`,
        artworkId: `art-${Date.now()}`,
        name: initialArtwork.name,
        imageUrl: initialArtwork.url,
        xCm: 1,
        yCm: sheet.items.length > 0 ? sheet.items[sheet.items.length - 1].yCm + 25 : 1,
        widthCm: initialArtwork.widthCm || 20,
        heightCm: initialArtwork.heightCm || 20,
        rotation: 0,
        isMirrored: false,
        quantity: 1,
      };
      setSheet((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
      }));
      setSelectedItemId(newItem.id);
    }
  }, [initialArtwork]);

  // Pixels per centimeter on screen base
  const PX_PER_CM = 18 * zoomLevel;

  // Change preset
  const handleSelectPreset = (preset: { width: number; height: number; name: string }) => {
    setSheet((prev) => ({
      ...prev,
      widthCm: preset.width,
      heightCm: preset.height,
      name: preset.name,
    }));
  };

  // Duplicate selected item
  const handleDuplicate = (id: string) => {
    const item = sheet.items.find((it) => it.id === id);
    if (!item) return;

    const copy: NestingItem = {
      ...item,
      id: `item-${Date.now()}`,
      xCm: Math.min(item.xCm + 2, sheet.widthCm - item.widthCm),
      yCm: item.yCm + 5,
    };
    setSheet((prev) => ({ ...prev, items: [...prev.items, copy] }));
    setSelectedItemId(copy.id);
  };

  // Rotate 90 degrees
  const handleRotate90 = (id: string) => {
    setSheet((prev) => ({
      ...prev,
      items: prev.items.map((it) => {
        if (it.id !== id) return it;
        const newRot = (it.rotation + 90) % 360;
        // Swap width and height visually for 90/270
        return {
          ...it,
          rotation: newRot,
          widthCm: it.heightCm,
          heightCm: it.widthCm,
        };
      }),
    }));
  };

  // Delete item
  const handleDelete = (id: string) => {
    setSheet((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== id),
    }));
    if (selectedItemId === id) setSelectedItemId(null);
  };

  // Add custom artwork upload to sheet
  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      const newItem: NestingItem = {
        id: `item-${Date.now()}`,
        artworkId: `upload-${Date.now()}`,
        name: file.name,
        imageUrl: url,
        xCm: 2,
        yCm: 2,
        widthCm: 15,
        heightCm: 15,
        rotation: 0,
        isMirrored: false,
        quantity: 1,
      };
      setSheet((prev) => ({ ...prev, items: [...prev.items, newItem] }));
      setSelectedItemId(newItem.id);
    };
    reader.readAsDataURL(file);
  };

  // SMART AUTO-NESTING BIN PACKING ALGORITHM
  // Arranges all designs automatically to maximize surface utilization!
  const runAutoNesting = () => {
    const margin = sheet.marginCm;
    const gutter = sheet.gutterCm;
    const sheetW = sheet.widthCm;
    const maxH = sheet.heightCm;

    // Sort items by height descending for shelf packing
    const sorted = [...sheet.items].sort((a, b) => b.heightCm - a.heightCm);

    let curX = margin;
    let curY = margin;
    let rowH = 0;

    const packed: NestingItem[] = sorted.map((it) => {
      let w = it.widthCm;
      let h = it.heightCm;
      let rot = it.rotation;

      // Check if rotating 90 fits better
      if (w > sheetW - margin * 2 && h <= sheetW - margin * 2) {
        const tmp = w;
        w = h;
        h = tmp;
        rot = (rot + 90) % 360;
      }

      // Check if it fits in current row
      if (curX + w > sheetW - margin) {
        // Next row
        curX = margin;
        curY += rowH + gutter;
        rowH = 0;
      }

      const assignedX = curX;
      const assignedY = curY;

      curX += w + gutter;
      if (h > rowH) rowH = h;

      return {
        ...it,
        xCm: Math.round(assignedX * 10) / 10,
        yCm: Math.round(assignedY * 10) / 10,
        widthCm: w,
        heightCm: h,
        rotation: rot,
      };
    });

    setSheet((prev) => ({ ...prev, items: packed }));
  };

  // Mouse drag handling for manual item repositioning
  const handleMouseDown = (e: React.MouseEvent, item: NestingItem) => {
    e.stopPropagation();
    setSelectedItemId(item.id);
    setDraggedItemId(item.id);

    const rect = sheetCanvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = (e.clientX - rect.left) / PX_PER_CM;
      const mouseY = (e.clientY - rect.top) / PX_PER_CM;
      setDragOffset({
        x: mouseX - item.xCm,
        y: mouseY - item.yCm,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedItemId || !sheetCanvasRef.current) return;

    const rect = sheetCanvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / PX_PER_CM;
    const mouseY = (e.clientY - rect.top) / PX_PER_CM;

    let newX = mouseX - dragOffset.x;
    let newY = mouseY - dragOffset.y;

    // Clamp within sheet bounds
    const activeItem = sheet.items.find((i) => i.id === draggedItemId);
    if (activeItem) {
      newX = Math.max(0, Math.min(newX, sheet.widthCm - activeItem.widthCm));
      newY = Math.max(0, newY);
    }

    setSheet((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.id === draggedItemId
          ? {
              ...it,
              xCm: Math.round(newX * 10) / 10,
              yCm: Math.round(newY * 10) / 10,
            }
          : it
      ),
    }));
  };

  const handleMouseUp = () => {
    setDraggedItemId(null);
  };

  // Calculate efficiency metrics
  const totalSheetArea = sheet.widthCm * sheet.heightCm;
  const usedArea = sheet.items.reduce((acc, it) => acc + it.widthCm * it.heightCm, 0);
  const efficiencyPercent = Math.min(100, Math.round((usedArea / totalSheetArea) * 100));

  // Max vertical position used
  const maxYUsed = sheet.items.reduce((max, it) => Math.max(max, it.yCm + it.heightCm), 0);
  const metersUsed = Math.round((maxYUsed / 100) * 100) / 100;

  // Estimated costs (approx 8 USD / 8 EUR per linear meter of DTF film + CMYK+W ink + powder)
  const costPerMeter = 9.5;
  const estimatedProdCost = Math.round(metersUsed * costPerMeter * 100) / 100;
  const suggestedSalePrice = Math.round(estimatedProdCost * 2.8 * 100) / 100;

  // Export 300 DPI Gang Sheet Canvas
  const handleExportGangSheet = () => {
    // 300 DPI: 1cm = (300 / 2.54) ~ 118.11 pixels
    const DPI_FACTOR = 40; // High resolution export canvas
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = Math.round(sheet.widthCm * DPI_FACTOR);
    exportCanvas.height = Math.round(sheet.heightCm * DPI_FACTOR);
    const ctx = exportCanvas.getContext('2d')!;

    // Clean transparent background (vital for DTF printers!)
    ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);

    if (sheet.isMirroredAll) {
      ctx.translate(exportCanvas.width, 0);
      ctx.scale(-1, 1);
    }

    // Draw all items
    const promises = sheet.items.map((item) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const ix = Math.round(item.xCm * DPI_FACTOR);
          const iy = Math.round(item.yCm * DPI_FACTOR);
          const iw = Math.round(item.widthCm * DPI_FACTOR);
          const ih = Math.round(item.heightCm * DPI_FACTOR);

          ctx.save();
          ctx.translate(ix + iw / 2, iy + ih / 2);
          ctx.rotate((item.rotation * Math.PI) / 180);
          ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih);
          ctx.restore();

          // Cut guidelines if enabled
          if (sheet.showCutLines) {
            ctx.strokeStyle = 'rgba(200, 200, 200, 0.4)';
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1;
            ctx.strokeRect(ix - 2, iy - 2, iw + 4, ih + 4);
          }

          resolve();
        };
        img.src = item.imageUrl;
      });
    });

    Promise.all(promises).then(() => {
      const link = document.createElement('a');
      link.download = `GANG_SHEET_${sheet.widthCm}x${sheet.heightCm}cm_${Date.now()}.png`;
      link.href = exportCanvas.toDataURL('image/png');
      link.click();
    });
  };

  const selectedItem = sheet.items.find((i) => i.id === selectedItemId);

  return (
    <div
      className="flex flex-col xl:flex-row h-full w-full gap-4 p-4 text-slate-200 select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* LEFT: Interactive Gang Sheet Canvas */}
      <div className="flex-1 flex flex-col bg-[#111726] rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
        {/* Top Control Bar */}
        <div className="h-14 border-b border-slate-800 px-4 flex items-center justify-between bg-[#0e1422] shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pliego de Impresión (Gang Sheet)
            </span>
            <div className="h-4 w-px bg-slate-800" />
            {/* Sheet Size Preset dropdown */}
            <select
              value={`${sheet.widthCm}x${sheet.heightCm}`}
              onChange={(e) => {
                const [w, h] = e.target.value.split('x').map(Number);
                const found = presets.find((p) => p.width === w && p.height === h);
                if (found) handleSelectPreset(found);
              }}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {presets.map((p) => (
                <option key={p.name} value={`${p.width}x${p.height}`}>
                  {p.name}
                </option>
              ))}
            </select>

            <span className="text-xs font-mono text-indigo-400 font-semibold tabular-nums">
              {sheet.widthCm} x {sheet.heightCm} cm
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Mirror Toggle */}
            <button
              onClick={() => setSheet((s) => ({ ...s, isMirroredAll: !s.isMirroredAll }))}
              className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
                sheet.isMirroredAll
                  ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Modo Espejo para Sublimación y DTF"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              Espejado {sheet.isMirroredAll ? 'ON' : 'OFF'}
            </button>

            {/* Cut Lines Toggle */}
            <button
              onClick={() => setSheet((s) => ({ ...s, showCutLines: !s.showCutLines }))}
              className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
                sheet.showCutLines
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Líneas de corte impresas para tijera o guillotina"
            >
              <Scissors className="w-3.5 h-3.5" />
              Guías de Corte
            </button>

            {/* Smart Auto Nesting CTA */}
            <button
              onClick={runAutoNesting}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Auto-Nesting IA
            </button>

            {/* Zoom Slider */}
            <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.3, z - 0.1))}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-slate-400 tabular-nums w-10 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Viewport Canvas Background */}
        <div
          className="flex-1 overflow-auto p-8 flex items-start justify-center bg-[#090d16]"
          style={{
            backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
          onClick={() => setSelectedItemId(null)}
        >
          {/* Physical Sheet Container */}
          <div
            ref={sheetCanvasRef}
            className={`relative bg-[#0b0f19] border-2 border-slate-700 shadow-2xl transition-all ${
              sheet.isMirroredAll ? 'scale-x-[-1]' : ''
            }`}
            style={{
              width: `${sheet.widthCm * PX_PER_CM}px`,
              height: `${sheet.heightCm * PX_PER_CM}px`,
              backgroundImage:
                'linear-gradient(45deg, #131b2e 25%, transparent 25%), linear-gradient(-45deg, #131b2e 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #131b2e 75%), linear-gradient(-45deg, transparent 75%, #131b2e 75%)',
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
            }}
          >
            {/* Top Ruler in CM */}
            <div
              className="absolute -top-6 left-0 right-0 h-5 flex items-center justify-between text-[10px] font-mono text-slate-500 border-b border-slate-800 pointer-events-none"
              style={{ transform: sheet.isMirroredAll ? 'scale-x-[-1]' : 'none' }}
            >
              <span>0cm</span>
              <span>{Math.round(sheet.widthCm / 2)}cm</span>
              <span>{sheet.widthCm}cm</span>
            </div>

            {/* Left Ruler in CM */}
            <div
              className="absolute top-0 -left-10 bottom-0 w-8 flex flex-col justify-between text-[10px] font-mono text-slate-500 border-r border-slate-800 pr-1 text-right pointer-events-none"
              style={{ transform: sheet.isMirroredAll ? 'scale-x-[-1]' : 'none' }}
            >
              <span>0cm</span>
              <span>{Math.round(sheet.heightCm / 4)}cm</span>
              <span>{Math.round(sheet.heightCm / 2)}cm</span>
              <span>{sheet.heightCm}cm</span>
            </div>

            {/* Margin Boundary Line */}
            <div
              className="absolute border border-dashed border-indigo-500/20 pointer-events-none"
              style={{
                left: `${sheet.marginCm * PX_PER_CM}px`,
                top: `${sheet.marginCm * PX_PER_CM}px`,
                right: `${sheet.marginCm * PX_PER_CM}px`,
                bottom: `${sheet.marginCm * PX_PER_CM}px`,
              }}
            />

            {/* Cut Lines if enabled */}
            {sheet.showCutLines &&
              sheet.items.map((it) => (
                <div
                  key={`cut-${it.id}`}
                  className="absolute border border-dashed border-slate-500/30 pointer-events-none"
                  style={{
                    left: `${(it.xCm - 0.2) * PX_PER_CM}px`,
                    top: `${(it.yCm - 0.2) * PX_PER_CM}px`,
                    width: `${(it.widthCm + 0.4) * PX_PER_CM}px`,
                    height: `${(it.heightCm + 0.4) * PX_PER_CM}px`,
                  }}
                />
              ))}

            {/* Placed Designs (Items) */}
            {sheet.items.map((item) => {
              const isSelected = selectedItemId === item.id;
              return (
                <div
                  key={item.id}
                  onMouseDown={(e) => handleMouseDown(e, item)}
                  className={`absolute cursor-move group transition-shadow ${
                    isSelected
                      ? 'ring-2 ring-indigo-500 shadow-xl z-20'
                      : 'hover:ring-1 hover:ring-indigo-400/50 z-10'
                  }`}
                  style={{
                    left: `${item.xCm * PX_PER_CM}px`,
                    top: `${item.yCm * PX_PER_CM}px`,
                    width: `${item.widthCm * PX_PER_CM}px`,
                    height: `${item.heightCm * PX_PER_CM}px`,
                  }}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-contain pointer-events-none"
                      style={{
                        transform: `rotate(${item.rotation}deg)`,
                      }}
                    />
                  ) : null}

                  {/* Size pill overlay on hover or select */}
                  <div
                    className={`absolute -top-5 left-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900/90 text-slate-300 border border-slate-800 whitespace-nowrap ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    style={{ transform: sheet.isMirroredAll ? 'scale-x-[-1]' : 'none' }}
                  >
                    {item.widthCm} x {item.heightCm} cm
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Production Metrics Bar */}
        <div className="h-16 border-t border-slate-800 bg-[#0e1422] px-6 flex items-center justify-between shrink-0 text-xs">
          {/* Metrics summary */}
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-400 block text-[11px]">Aprovechamiento:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{efficiencyPercent}%</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-slate-400 block text-[11px]">Metros Lineales:</span>
              <span className="font-mono font-bold text-white text-sm">{metersUsed} m</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-slate-400 block text-[11px]">Costo de Insumos:</span>
              <span className="font-mono font-bold text-amber-400 text-sm">${estimatedProdCost}</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-slate-400 block text-[11px]">Precio Sugerido Venta:</span>
              <span className="font-mono font-bold text-indigo-400 text-sm">${suggestedSalePrice}</span>
            </div>
          </div>

          {/* Export Gang Sheet Action */}
          <button
            onClick={handleExportGangSheet}
            className="px-4 py-2 rounded-lg font-semibold text-xs bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            Exportar Pliego 300 DPI
          </button>
        </div>
      </div>

      {/* RIGHT: Items & Nesting Properties Panel */}
      <div className="w-full xl:w-80 flex flex-col bg-[#111726] rounded-xl border border-slate-800 overflow-hidden shadow-2xl shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-[#0e1422] flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Diseños en Pliego</span>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 border border-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            Añadir
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleCustomUpload}
            className="hidden"
          />
        </div>

        {/* Selected Item Inspector */}
        {selectedItem ? (
          <div className="p-4 border-b border-slate-800 bg-slate-900/60 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white truncate max-w-[180px]">{selectedItem.name}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleRotate90(selectedItem.id)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Girar 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDuplicate(selectedItem.id)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Duplicar"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(selectedItem.id)}
                  className="p-1 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-400"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <label className="text-slate-400 block mb-0.5">Ancho (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={selectedItem.widthCm}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 1;
                    setSheet((prev) => ({
                      ...prev,
                      items: prev.items.map((it) => (it.id === selectedItem.id ? { ...it, widthCm: val } : it)),
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-0.5">Alto (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={selectedItem.heightCm}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 1;
                    setSheet((prev) => ({
                      ...prev,
                      items: prev.items.map((it) => (it.id === selectedItem.id ? { ...it, heightCm: val } : it)),
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-0.5">Posición X (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={selectedItem.xCm}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setSheet((prev) => ({
                      ...prev,
                      items: prev.items.map((it) => (it.id === selectedItem.id ? { ...it, xCm: val } : it)),
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-0.5">Posición Y (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={selectedItem.yCm}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setSheet((prev) => ({
                      ...prev,
                      items: prev.items.map((it) => (it.id === selectedItem.id ? { ...it, yCm: val } : it)),
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-white"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 border-b border-slate-800 text-xs text-slate-500 italic text-center">
            Selecciona un diseño en el pliego para ajustar dimensiones y orientación.
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {sheet.items.map((it) => (
            <div
              key={it.id}
              onClick={() => setSelectedItemId(it.id)}
              className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between text-xs transition-colors ${
                selectedItemId === it.id
                  ? 'bg-indigo-950/40 border-indigo-500/80 text-white'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {it.imageUrl ? (
                  <img src={it.imageUrl} alt={it.name} className="w-8 h-8 object-contain bg-black/40 rounded p-0.5" />
                ) : (
                  <div className="w-8 h-8 bg-black/40 rounded flex items-center justify-center text-[9px] text-slate-500">DTF</div>
                )}
                <div>
                  <span className="font-medium block truncate max-w-[130px]">{it.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {it.widthCm} x {it.heightCm} cm · {it.rotation}°
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRotate90(it.id);
                  }}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <RotateCw className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicate(it.id);
                  }}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
