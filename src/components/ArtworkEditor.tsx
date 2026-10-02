import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Maximize2,
  Wand2,
  Sliders,
  Sparkles,
  Layers,
  Download,
  RotateCcw,
  Check,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Shirt,
  Send,
  Eye,
  Eraser,
  RefreshCw,
  Info,
  Ruler,
  Crosshair,
  Compass,
  Move,
  Target,
  Scissors,
  PanelRightClose,
  PanelRightOpen,
  Keyboard,
  Undo2,
  Redo2,
  Trash2,
  HelpCircle,
  X,
  Minimize2,
  RotateCw,
  FlipHorizontal,
  Type,
  Palette,
  Crop,
  Flame,
  Coffee,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  FlipVertical
} from 'lucide-react';
import {
  ArtworkFile,
  HalftoneConfig,
  KnockoutConfig,
  EdgeRefineConfig,
  AIAnalysisResult,
  TechniqueType
} from '../types';
import {
  calculateDpi,
  removeBackgroundColor,
  autoDetectBackgroundColor,
  removeBackgroundAdvanced,
  magicEraserFloodFill,
  eraseAllEnclosedHoles,
  applyEdgeChoke,
  applyHalftone,
  applyArtisticKnockout,
  upscaleAndSharpen,
  createDefaultDemoArtworks,
  loadImage,
  ColorAdjustmentConfig,
  applyColorAdjustments,
  flipCanvas,
  rotateCanvas,
  autoTrimCanvas,
  invertCanvasColors,
  grayscaleCanvas,
  TextOverlayConfig,
  renderTextToCanvas,
  SublimationProductPreset,
  SUBLIMATION_PRESETS
} from '../utils/imageProcessing';

export const GARMENT_COLOR_TEMPLATES: Record<string, { front: string; back: string; name: string }> = {
  '#0f172a': {
    name: 'Negro Carbón',
    front: '/src/assets/images/black_tshirt_front_1790943082198.jpg',
    back: '/src/assets/images/black_tshirt_back_1790943099560.jpg'
  },
  '#ffffff': {
    name: 'Blanco Puro',
    front: '/src/assets/images/white_tshirt_front_1790946146673.jpg',
    back: '/src/assets/images/white_tshirt_back_1790946159333.jpg'
  },
  '#1e3a8a': {
    name: 'Azul Marino',
    front: '/src/assets/images/navy_tshirt_front_1790946170917.jpg',
    back: '/src/assets/images/navy_tshirt_back_1790946181513.jpg'
  },
  '#374151': {
    name: 'Gris Melange',
    front: '/src/assets/images/gray_tshirt_front_1790946192852.jpg',
    back: '/src/assets/images/gray_tshirt_back_1790946204089.jpg'
  },
  '#991b1b': {
    name: 'Rojo Carmesí',
    front: '/src/assets/images/red_tshirt_front_1790946215588.jpg',
    back: '/src/assets/images/red_tshirt_back_1790946229966.jpg'
  }
};

interface ArtworkEditorProps {
  onSendToNesting?: (artwork: { name: string; url: string; widthCm: number; heightCm: number }) => void;
  onOpenAR?: (url: string) => void;
}

export const ArtworkEditor: React.FC<ArtworkEditorProps> = ({ onSendToNesting, onOpenAR }) => {
  const [demoList] = useState(createDefaultDemoArtworks());
  const initialDemo = demoList[0];
  const [selectedDemoId, setSelectedDemoId] = useState<string>(initialDemo?.id || 'demo-skull');

  // Active artwork state
  const [currentImageUrl, setCurrentImageUrl] = useState<string>(initialDemo?.url || '');
  const [originalImageUrl, setOriginalImageUrl] = useState<string>(initialDemo?.url || '');
  const [imageName, setImageName] = useState<string>(initialDemo?.name || 'Streetwear_Skull_DTF.png');
  const [pixelWidth, setPixelWidth] = useState<number>(initialDemo?.widthPx || 1200);
  const [pixelHeight, setPixelHeight] = useState<number>(initialDemo?.heightPx || 1200);

  // Physical target size
  const [targetWidthCm, setTargetWidthCm] = useState<number>(initialDemo?.targetWidthCm || 28);
  const [targetHeightCm, setTargetHeightCm] = useState<number>(initialDemo?.targetHeightCm || 28);
  const [technique, setTechnique] = useState<TechniqueType>('DTF Textil');
  const [previewBgColor, setPreviewBgColor] = useState<string>('#0f172a'); // default dark t-shirt
  const [bgPreviewType, setBgPreviewType] = useState<'checker' | 'dark' | 'white' | 'garment'>('checker');

  // Background Removal Suite State
  const [bgRemoveConfig, setBgRemoveConfig] = useState<{
    enabled: boolean;
    color: string;
    tolerance: number; // 0 - 100
    feather: number; // 0 - 20
    mode: 'contiguous' | 'global';
    deFringe: boolean;
  }>({
    enabled: false,
    color: '#ffffff',
    tolerance: 22,
    feather: 3,
    mode: 'contiguous',
    deFringe: true,
  });
  const [detectedBgColor, setDetectedBgColor] = useState<string | null>(null);

  // Magic Eraser State (for holes inside letters O, A, P, R, B...)
  const [isMagicEraserActive, setIsMagicEraserActive] = useState<boolean>(false);
  const [magicEraserTolerance, setMagicEraserTolerance] = useState<number>(24); // 0 - 100
  const [magicEraserFeather, setMagicEraserFeather] = useState<number>(2); // 0 - 10

  // Sublimation & Image Manipulation State
  const [isMirrored, setIsMirrored] = useState<boolean>(false);
  const [colorConfig, setColorConfig] = useState<ColorAdjustmentConfig>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    warmth: 0,
  });
  const [textConfig, setTextConfig] = useState<TextOverlayConfig>({
    text: '',
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 44,
    color: '#ffffff',
    strokeColor: '#000000',
    strokeWidth: 4,
    shadow: true,
    positionYPercent: 85,
  });
  const [selectedSubliPresetId, setSelectedSubliPresetId] = useState<string>('mug_standard');

  // Active Tool Tab
  const [activeTab, setActiveTab] = useState<
    'bg_remove' | 'sublimation' | 'colors' | 'text' | 'placement' | 'halftone' | 'knockout' | 'edges' | 'resolution' | 'ai'
  >('bg_remove');

  // Garment Placement & Centering Ruler State
  const [placementDistanceCm, setPlacementDistanceCm] = useState<number>(7.5); // 7.5 cm from collar = 3 to 4 fingers
  const [placementOffsetXCm, setPlacementOffsetXCm] = useState<number>(0); // 0 = centered
  const [garmentSize, setGarmentSize] = useState<'S' | 'M' | 'L' | 'XL' | 'XXL'>('L');
  const [garmentSide, setGarmentSide] = useState<'front' | 'back'>('front');
  const [showLaserGuides, setShowLaserGuides] = useState<boolean>(true);
  const [showRulerCm, setShowRulerCm] = useState<boolean>(true);
  const [isRulerCardCollapsed, setIsRulerCardCollapsed] = useState<boolean>(false);
  const [isGarmentCardCollapsed, setIsGarmentCardCollapsed] = useState<boolean>(false);
  const [isTopSpecsCollapsed, setIsTopSpecsCollapsed] = useState<boolean>(false);
  const [isExpandedView, setIsExpandedView] = useState<boolean>(false);

  // Garment sizes standard chest widths in cm
  const GARMENT_CHEST_WIDTH_CM: Record<'S' | 'M' | 'L' | 'XL' | 'XXL', number> = {
    S: 48,
    M: 52,
    L: 56,
    XL: 60,
    XXL: 64,
  };

  const getFingerEquivalence = (cm: number) => {
    if (cm <= 3) return '1 a 2 dedos (cuello alto)';
    if (cm <= 5.5) return '2 a 3 dedos (juvenil/alto)';
    if (cm <= 8) return '3 a 4 dedos (estándar adultos)';
    if (cm <= 11) return '4 a 5 dedos (escote bajo)';
    if (cm <= 20) return 'Zona media / pecho';
    if (cm <= 35) return 'Zona media / torso';
    if (cm <= 48) return 'Zona baja / abdomen';
    return 'Dobladillo inferior / cintura';
  };

  type PlacementPresetId =
    | 'chest_center'
    | 'chest_high'
    | 'left_pocket'
    | 'right_pocket'
    | 'left_sleeve'
    | 'right_sleeve'
    | 'hem_left'
    | 'hem_right'
    | 'oversize_front'
    | 'belly_center'
    | 'back_yoke'
    | 'back_high'
    | 'back_center'
    | 'back_full'
    | 'back_lumbar';

  const applyPlacementPreset = (preset: PlacementPresetId) => {
    pushSnapshot();
    const aspect = pixelHeight / pixelWidth;

    const setProportionalSize = (boxW: number, boxH: number) => {
      if (aspect >= 1) {
        // Altura manda
        const h = boxH;
        const w = Math.round((h / aspect) * 10) / 10;
        setTargetWidthCm(Math.min(w, boxW));
        setTargetHeightCm(h);
      } else {
        // Ancho manda
        const w = boxW;
        const h = Math.round((w * aspect) * 10) / 10;
        setTargetWidthCm(w);
        setTargetHeightCm(Math.min(h, boxH));
      }
    };

    switch (preset) {
      case 'left_pocket':
        setPlacementDistanceCm(8.5);
        setPlacementOffsetXCm(-9.5);
        setGarmentSide('front');
        setProportionalSize(10, 10);
        showToast('📍 Bolsillo Izq. (10 × 10 cm)');
        break;
      case 'right_pocket':
        setPlacementDistanceCm(8.5);
        setPlacementOffsetXCm(9.5);
        setGarmentSide('front');
        setProportionalSize(10, 10);
        showToast('📍 Bolsillo Der. (10 × 10 cm)');
        break;
      case 'left_sleeve':
        setPlacementDistanceCm(13.5);
        setPlacementOffsetXCm(-28.5);
        setGarmentSide('front');
        setProportionalSize(8, 8);
        showToast('📍 Manga Izquierda (8 × 8 cm · bíceps)');
        break;
      case 'right_sleeve':
        setPlacementDistanceCm(13.5);
        setPlacementOffsetXCm(28.5);
        setGarmentSide('front');
        setProportionalSize(8, 8);
        showToast('📍 Manga Derecha (8 × 8 cm · bíceps)');
        break;
      case 'hem_left':
        setPlacementDistanceCm(56.0);
        setPlacementOffsetXCm(-18.0);
        setGarmentSide('front');
        setProportionalSize(6, 6);
        showToast('📍 Dobladillo Inferior Izquierdo (6 × 6 cm · bajo)');
        break;
      case 'hem_right':
        setPlacementDistanceCm(56.0);
        setPlacementOffsetXCm(18.0);
        setGarmentSide('front');
        setProportionalSize(6, 6);
        showToast('📍 Dobladillo Inferior Derecho (6 × 6 cm · bajo)');
        break;
      case 'chest_center':
        setPlacementDistanceCm(7.5);
        setPlacementOffsetXCm(0);
        setGarmentSide('front');
        setProportionalSize(28, 28);
        showToast('📍 Pecho Centro Estándar (28 × 28 cm · 3-4 dedos)');
        break;
      case 'chest_high':
        setPlacementDistanceCm(5.0);
        setPlacementOffsetXCm(0);
        setGarmentSide('front');
        setProportionalSize(22, 16);
        showToast('📍 Pecho Alto / Juvenil (22 × 16 cm · 2 dedos)');
        break;
      case 'oversize_front':
        setPlacementDistanceCm(11.5);
        setPlacementOffsetXCm(0);
        setGarmentSide('front');
        setProportionalSize(32, 40);
        showToast('📍 Streetwear Oversize (32 × 40 cm)');
        break;
      case 'belly_center':
        setPlacementDistanceCm(18.0);
        setPlacementOffsetXCm(0);
        setGarmentSide('front');
        setProportionalSize(26, 20);
        showToast('📍 Zona Baja / Abdomen (26 × 20 cm)');
        break;
      case 'back_yoke':
        setPlacementDistanceCm(3.5);
        setPlacementOffsetXCm(0);
        setGarmentSide('back');
        setProportionalSize(8, 5);
        showToast('📍 Nuca / Logo Cuello (8 × 5 cm · 1-2 dedos)');
        break;
      case 'back_high':
        setPlacementDistanceCm(5.5);
        setPlacementOffsetXCm(0);
        setGarmentSide('back');
        setProportionalSize(28, 14);
        showToast('📍 Espalda Alta (28 × 14 cm)');
        break;
      case 'back_center':
        setPlacementDistanceCm(9.0);
        setPlacementOffsetXCm(0);
        setGarmentSide('back');
        setProportionalSize(28, 24);
        showToast('📍 Espalda Omóplatos (28 × 24 cm)');
        break;
      case 'back_full':
        setPlacementDistanceCm(11.0);
        setPlacementOffsetXCm(0);
        setGarmentSide('back');
        setProportionalSize(29, 38);
        showToast('📍 Espalda Completa A3 (29 × 38 cm)');
        break;
      case 'back_lumbar':
        setPlacementDistanceCm(22.0);
        setPlacementOffsetXCm(0);
        setGarmentSide('back');
        setProportionalSize(28, 16);
        showToast('📍 Espalda Baja / Lumbar (28 × 16 cm)');
        break;
    }
  };

  // Halftone configuration - DISABLED by default so user drawings and text stay 100% solid and crisp
  const [halftoneConfig, setHalftoneConfig] = useState<HalftoneConfig>({
    enabled: false,
    shape: 'round',
    lpi: 45,
    angle: 45,
    garmentColor: '#0f172a',
    invert: false,
    blendWithGarment: true,
  });

  // Knockout configuration - DISABLED by default
  const [knockoutConfig, setKnockoutConfig] = useState<KnockoutConfig>({
    enabled: false,
    targetColor: '#0f172a',
    tolerance: 35,
    feather: 25,
    smoothEdges: true,
  });

  // Edge & Background removal configuration - DISABLED by default (no unwanted color deletion)
  const [edgeConfig, setEdgeConfig] = useState<EdgeRefineConfig>({
    edgeChokePx: 0,
    featherPx: 0,
    chromaKeyColor: null,
    chromaTolerance: 15,
  });

  // Upscale sharpening state
  const [isUpscaling, setIsUpscaling] = useState<boolean>(false);
  const [upscaleFactor, setUpscaleFactor] = useState<number>(2.0);

  // AI Advisor state
  const [isAnalyzingAI, setIsAnalyzingAI] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Zoom & view mode
  const [zoomLevel, setZoomLevel] = useState<number>(0.9);
  const [viewSplit, setViewSplit] = useState<'processed' | 'on_garment' | 'split' | 'original'>('on_garment');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDraggingOnGarment, setIsDraggingOnGarment] = useState<boolean>(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(false);

  // Shortcuts and tools collapsible dropdown state
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState<boolean>(false);
  const toolsDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(event.target as Node)) {
        setIsToolsDropdownOpen(false);
      }
    };
    if (isToolsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isToolsDropdownOpen]);

  // Shortcuts modal & toast state
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  // Undo / Redo History Stack
  interface EditorSnapshot {
    placementDistanceCm: number;
    placementOffsetXCm: number;
    targetWidthCm: number;
    targetHeightCm: number;
    garmentSize: 'S' | 'M' | 'L' | 'XL' | 'XXL';
    garmentSide: 'front' | 'back';
    currentImageUrl: string;
    originalImageUrl: string;
    imageName: string;
  }

  const undoStackRef = useRef<EditorSnapshot[]>([]);
  const redoStackRef = useRef<EditorSnapshot[]>([]);

  const takeSnapshot = (): EditorSnapshot => ({
    placementDistanceCm,
    placementOffsetXCm,
    targetWidthCm,
    targetHeightCm,
    garmentSize,
    garmentSide,
    currentImageUrl,
    originalImageUrl,
    imageName,
  });

  const pushSnapshot = () => {
    undoStackRef.current.push(takeSnapshot());
    if (undoStackRef.current.length > 30) undoStackRef.current.shift();
    redoStackRef.current = [];
  };

  const handleUndo = () => {
    if (undoStackRef.current.length === 0) {
      showToast('Nada más que deshacer');
      return;
    }
    const previous = undoStackRef.current.pop()!;
    redoStackRef.current.push(takeSnapshot());

    setPlacementDistanceCm(previous.placementDistanceCm);
    setPlacementOffsetXCm(previous.placementOffsetXCm);
    setTargetWidthCm(previous.targetWidthCm);
    setTargetHeightCm(previous.targetHeightCm);
    setGarmentSize(previous.garmentSize);
    setGarmentSide(previous.garmentSide);
    setCurrentImageUrl(previous.currentImageUrl);
    setOriginalImageUrl(previous.originalImageUrl);
    setImageName(previous.imageName);
    showToast('Deshecho (Ctrl+Z)');
  };

  const handleRedo = () => {
    if (redoStackRef.current.length === 0) {
      showToast('Nada más que rehacer');
      return;
    }
    const next = redoStackRef.current.pop()!;
    undoStackRef.current.push(takeSnapshot());

    setPlacementDistanceCm(next.placementDistanceCm);
    setPlacementOffsetXCm(next.placementOffsetXCm);
    setTargetWidthCm(next.targetWidthCm);
    setTargetHeightCm(next.targetHeightCm);
    setGarmentSize(next.garmentSize);
    setGarmentSide(next.garmentSide);
    setCurrentImageUrl(next.currentImageUrl);
    setOriginalImageUrl(next.originalImageUrl);
    setImageName(next.imageName);
    showToast('Rehecho (Ctrl+Y)');
  };

  const handleDeleteArtwork = () => {
    if (!currentImageUrl && !originalImageUrl) return;
    pushSnapshot();
    setCurrentImageUrl('');
    setOriginalImageUrl('');
    showToast('Elemento removido (Delete). Presiona Ctrl+Z para restaurar');
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing in an input or textarea
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

      // 1. Undo / Redo
      if (cmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }

      if (cmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      // 2. Delete / Remove selected element
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteArtwork();
        return;
      }

      // 3. Arrow Keys fine-tuned positioning
      const step = e.shiftKey ? 1.0 : 0.5;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        pushSnapshot();
        setPlacementDistanceCm((prev) => Math.max(1, Math.round((prev - step) * 10) / 10));
        if (viewSplit !== 'on_garment') setViewSplit('on_garment');
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        pushSnapshot();
        setPlacementDistanceCm((prev) => Math.min(60, Math.round((prev + step) * 10) / 10));
        if (viewSplit !== 'on_garment') setViewSplit('on_garment');
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        pushSnapshot();
        setPlacementOffsetXCm((prev) => Math.max(-32, Math.round((prev - step) * 10) / 10));
        if (viewSplit !== 'on_garment') setViewSplit('on_garment');
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        pushSnapshot();
        setPlacementOffsetXCm((prev) => Math.min(32, Math.round((prev + step) * 10) / 10));
        if (viewSplit !== 'on_garment') setViewSplit('on_garment');
        return;
      }

      // 4. Center estampa (C)
      if (e.key.toLowerCase() === 'c' && !cmdOrCtrl) {
        e.preventDefault();
        pushSnapshot();
        setPlacementOffsetXCm(0);
        showToast('Estampa centrada en eje láser (C)');
        return;
      }

      // 5. Flip front / back (F)
      if (e.key.toLowerCase() === 'f' && !cmdOrCtrl) {
        e.preventDefault();
        pushSnapshot();
        setGarmentSide((s) => (s === 'front' ? 'back' : 'front'));
        showToast('Vista alternada Frente / Espalda (F)');
        return;
      }

      // Escape: Exit expanded view
      if (e.key === 'Escape') {
        if (isExpandedView) {
          e.preventDefault();
          setIsExpandedView(false);
          showToast('Vista normal restaurada');
          return;
        }
      }

      // 6. Toggle ruler / guides (R)
      if (e.key.toLowerCase() === 'r' && !cmdOrCtrl) {
        e.preventDefault();
        setIsRulerCardCollapsed((prev) => {
          const next = !prev;
          showToast(next ? 'Panel de regla colapsado' : 'Panel de regla visible');
          return next;
        });
        return;
      }

      // 7. Zoom controls (+, -, 0, 1)
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoomLevel((z) => Math.min(2.5, Math.round((z + 0.1) * 100) / 100));
        return;
      }
      if (e.key === '-') {
        e.preventDefault();
        setZoomLevel((z) => Math.max(0.4, Math.round((z - 0.1) * 100) / 100));
        return;
      }
      if (e.key === '0') {
        e.preventDefault();
        setZoomLevel(0.85);
        showToast('Remera encajada a pantalla (0)');
        return;
      }
      if (e.key === '1') {
        e.preventDefault();
        setZoomLevel(1);
        showToast('Zoom al 100% (1)');
        return;
      }

      // 8. Open shortcuts modal (? or h)
      if (e.key === '?' || (e.key.toLowerCase() === 'h' && !cmdOrCtrl)) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
        return;
      }

      // 9. Close modal on Escape
      if (e.key === 'Escape') {
        setIsShortcutsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    placementDistanceCm,
    placementOffsetXCm,
    targetWidthCm,
    targetHeightCm,
    garmentSize,
    garmentSide,
    currentImageUrl,
    originalImageUrl,
    imageName,
    viewSplit
  ]);

  // Initialize with first demo
  useEffect(() => {
    const demo = demoList.find((d) => d.id === selectedDemoId) || demoList[0];
    if (demo) {
      setOriginalImageUrl(demo.url);
      setCurrentImageUrl(demo.url);
      setImageName(demo.name);
      setPixelWidth(demo.widthPx);
      setPixelHeight(demo.heightPx);
      setTargetWidthCm(demo.targetWidthCm);
      setTargetHeightCm(demo.targetHeightCm);
    }
  }, [selectedDemoId, demoList]);

  // Handle uploaded custom artwork
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setOriginalImageUrl(result);
        setCurrentImageUrl(result);
        setImageName(file.name);
        setPixelWidth(img.naturalWidth);
        setPixelHeight(img.naturalHeight);

        // Calculate proportional default cm (max 30cm)
        const aspect = img.naturalHeight / img.naturalWidth;
        const defaultWidth = 28;
        setTargetWidthCm(defaultWidth);
        setTargetHeightCm(Math.round(defaultWidth * aspect * 10) / 10);

        // Reset all filters so uploaded user artwork is 100% untouched, pure and sharp
        setHalftoneConfig((prev) => ({ ...prev, enabled: false }));
        setKnockoutConfig((prev) => ({ ...prev, enabled: false }));
        setEdgeConfig({
          edgeChokePx: 0,
          featherPx: 0,
          chromaKeyColor: null,
          chromaTolerance: 15,
        });
        setBgRemoveConfig({
          enabled: false,
          color: '#ffffff',
          tolerance: 22,
          feather: 3,
          mode: 'contiguous',
          deFringe: true,
        });
        setDetectedBgColor(null);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  // Re-run processing pipeline onto canvas
  const processImagePipeline = async () => {
    if (!originalImageUrl) return;
    setIsProcessing(true);

    // If no destructive filters are enabled, maintain the original image dataURL directly
    const hasActiveFilter =
      bgRemoveConfig.enabled ||
      isMirrored ||
      colorConfig.brightness !== 0 ||
      colorConfig.contrast !== 0 ||
      colorConfig.saturation !== 0 ||
      colorConfig.warmth !== 0 ||
      Boolean(textConfig.text.trim()) ||
      Boolean(edgeConfig.chromaKeyColor) ||
      edgeConfig.edgeChokePx > 0 ||
      knockoutConfig.enabled ||
      halftoneConfig.enabled;

    if (!hasActiveFilter) {
      setCurrentImageUrl(originalImageUrl);
      if (canvasRef.current) {
        try {
          const img = await loadImage(originalImageUrl);
          canvasRef.current.width = img.naturalWidth;
          canvasRef.current.height = img.naturalHeight;
          const destCtx = canvasRef.current.getContext('2d');
          if (destCtx) {
            destCtx.clearRect(0, 0, img.naturalWidth, img.naturalHeight);
            destCtx.drawImage(img, 0, 0);
          }
        } catch {}
      }
      setIsProcessing(false);
      return;
    }

    try {
      const img = await loadImage(originalImageUrl);
      let workingCanvas = document.createElement('canvas');
      workingCanvas.width = img.naturalWidth;
      workingCanvas.height = img.naturalHeight;
      const ctx = workingCanvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      // 0. Smart Background Removal
      if (bgRemoveConfig.enabled) {
        workingCanvas = removeBackgroundAdvanced(workingCanvas, {
          keyColorHex: bgRemoveConfig.color,
          tolerance: bgRemoveConfig.tolerance,
          feather: bgRemoveConfig.feather,
          mode: bgRemoveConfig.mode,
          deFringe: bgRemoveConfig.deFringe,
        });
      }

      // 0.2. Color Adjustments (Brightness, Contrast, Saturation, Warmth, Subli Boost)
      if (
        colorConfig.brightness !== 0 ||
        colorConfig.contrast !== 0 ||
        colorConfig.saturation !== 0 ||
        colorConfig.warmth !== 0
      ) {
        workingCanvas = applyColorAdjustments(workingCanvas, colorConfig);
      }

      // 0.3. Custom Typography / Text Overlay
      if (textConfig.text.trim()) {
        workingCanvas = renderTextToCanvas(workingCanvas, textConfig);
      }

      // 0.4. Mirroring (Flip Horizontal for Sublimation transfer)
      if (isMirrored) {
        workingCanvas = flipCanvas(workingCanvas, true, false);
      }

      // 1. Chroma Key / Old Background removal if requested
      if (edgeConfig.chromaKeyColor) {
        workingCanvas = removeBackgroundColor(
          workingCanvas,
          edgeConfig.chromaKeyColor,
          edgeConfig.chromaTolerance,
          edgeConfig.featherPx * 5
        );
      }

      // 2. Edge choke (Sangrado negativo para DTF)
      if (edgeConfig.edgeChokePx > 0) {
        workingCanvas = applyEdgeChoke(workingCanvas, edgeConfig.edgeChokePx);
      }

      // 3. Artistic Knockout of darks or shirt color
      if (knockoutConfig.enabled) {
        workingCanvas = applyArtisticKnockout(workingCanvas, knockoutConfig);
      }

      // 4. Halftoning (Tramas de semitonos)
      if (halftoneConfig.enabled) {
        workingCanvas = applyHalftone(workingCanvas, halftoneConfig);
      }

      const processedData = workingCanvas.toDataURL('image/png', 1.0);
      setCurrentImageUrl(processedData);

      // Render to visible canvas
      if (canvasRef.current) {
        const destCanvas = canvasRef.current;
        destCanvas.width = workingCanvas.width;
        destCanvas.height = workingCanvas.height;
        const destCtx = destCanvas.getContext('2d');
        if (destCtx) {
          destCtx.clearRect(0, 0, destCanvas.width, destCanvas.height);
          destCtx.drawImage(workingCanvas, 0, 0);
        }
      }
    } catch (err) {
      console.error('Error processing pipeline:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto trigger process on config change
  useEffect(() => {
    const timer = setTimeout(() => {
      processImagePipeline();
    }, 180);
    return () => clearTimeout(timer);
  }, [
    originalImageUrl,
    halftoneConfig,
    knockoutConfig,
    edgeConfig,
    bgRemoveConfig,
    colorConfig,
    textConfig,
    isMirrored
  ]);

  // Rotate 90 degrees
  const handleRotate90 = async () => {
    pushSnapshot();
    setIsProcessing(true);
    try {
      const srcUrl = currentImageUrl || originalImageUrl;
      const img = await loadImage(srcUrl);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.naturalWidth;
      tempCanvas.height = img.naturalHeight;
      const ctx = tempCanvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const rotated = rotateCanvas(tempCanvas, 90);
      const newUrl = rotated.toDataURL('image/png', 1.0);
      setCurrentImageUrl(newUrl);
      setOriginalImageUrl(newUrl);
      setPixelWidth(rotated.width);
      setPixelHeight(rotated.height);
      const oldW = targetWidthCm;
      setTargetWidthCm(targetHeightCm);
      setTargetHeightCm(oldW);
      showToast('↷ Imagen rotada 90° horario');
    } catch (err) {
      console.error('Error rotating image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-Trim empty transparent borders
  const handleAutoTrimBorders = async () => {
    pushSnapshot();
    setIsProcessing(true);
    try {
      const srcUrl = currentImageUrl || originalImageUrl;
      const img = await loadImage(srcUrl);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.naturalWidth;
      tempCanvas.height = img.naturalHeight;
      const ctx = tempCanvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const trimmed = autoTrimCanvas(tempCanvas);
      const newUrl = trimmed.toDataURL('image/png', 1.0);
      setCurrentImageUrl(newUrl);
      setOriginalImageUrl(newUrl);
      setPixelWidth(trimmed.width);
      setPixelHeight(trimmed.height);
      showToast('✂️ Bordes transparentes recortados');
    } catch (err) {
      console.error('Error auto trimming borders:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Flip Vertical
  const handleFlipVertical = async () => {
    pushSnapshot();
    setIsProcessing(true);
    try {
      const srcUrl = currentImageUrl || originalImageUrl;
      const img = await loadImage(srcUrl);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.naturalWidth;
      tempCanvas.height = img.naturalHeight;
      const ctx = tempCanvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const flipped = flipCanvas(tempCanvas, false, true);
      const newUrl = flipped.toDataURL('image/png', 1.0);
      setCurrentImageUrl(newUrl);
      setOriginalImageUrl(newUrl);
      showToast('↕ Volteado verticalmente');
    } catch (err) {
      console.error('Error flipping vertically:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Invert Colors (Negative)
  const handleInvertColors = async () => {
    pushSnapshot();
    setIsProcessing(true);
    try {
      const srcUrl = currentImageUrl || originalImageUrl;
      const img = await loadImage(srcUrl);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.naturalWidth;
      tempCanvas.height = img.naturalHeight;
      const ctx = tempCanvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const inverted = invertCanvasColors(tempCanvas);
      const newUrl = inverted.toDataURL('image/png', 1.0);
      setCurrentImageUrl(newUrl);
      setOriginalImageUrl(newUrl);
      showToast('Colores invertidos (Negativo)');
    } catch (err) {
      console.error('Error inverting colors:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Grayscale / Black & White
  const handleGrayscale = async () => {
    pushSnapshot();
    setIsProcessing(true);
    try {
      const srcUrl = currentImageUrl || originalImageUrl;
      const img = await loadImage(srcUrl);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.naturalWidth;
      tempCanvas.height = img.naturalHeight;
      const ctx = tempCanvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const gray = grayscaleCanvas(tempCanvas);
      const newUrl = gray.toDataURL('image/png', 1.0);
      setCurrentImageUrl(newUrl);
      setOriginalImageUrl(newUrl);
      showToast('Convertido a Blanco y Negro');
    } catch (err) {
      console.error('Error converting to grayscale:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Sublimation Color Boost
  const handleSubliBoost = () => {
    pushSnapshot();
    setColorConfig({
      brightness: 4,
      contrast: 16,
      saturation: 26,
      warmth: 4,
    });
    showToast('⚡ Boost de Sublimación activado (+26% viveza de color)');
  };

  const handleResetColors = () => {
    pushSnapshot();
    setColorConfig({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      warmth: 0,
    });
    showToast('Colores restaurados a valores originales');
  };

  // Apply Sublimation Product Preset
  const handleApplySubliPreset = (preset: SublimationProductPreset) => {
    pushSnapshot();
    setSelectedSubliPresetId(preset.id);
    setTargetWidthCm(preset.widthCm);
    setTargetHeightCm(preset.heightCm);
    setTechnique('Sublimación');
    if (preset.mustMirror && !isMirrored) {
      setIsMirrored(true);
    }
    showToast(`📐 Plantilla: ${preset.name} (${preset.widthCm}x${preset.heightCm} cm · ${preset.tempC}°C / ${preset.timeSec}s)`);
  };

  // Toggle Mirroring
  const handleToggleMirror = () => {
    pushSnapshot();
    setIsMirrored((prev) => {
      const next = !prev;
      showToast(next ? '🪞 Modo Espejo ACTIVADO (Obligatorio para Sublimación)' : 'Modo Espejo desactivado');
      return next;
    });
  };

  // Background Removal Handlers
  const handleAutoDetectBgRemove = async () => {
    if (!originalImageUrl) return;
    setIsProcessing(true);
    try {
      const img = await loadImage(originalImageUrl);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.naturalWidth;
      tempCanvas.height = img.naturalHeight;
      const ctx = tempCanvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const detected = autoDetectBackgroundColor(tempCanvas);
      setDetectedBgColor(detected);
      setBgRemoveConfig({
        enabled: true,
        color: detected,
        tolerance: 22,
        feather: 3,
        mode: 'contiguous',
        deFringe: true,
      });
      showToast(`Fondo detectado (${detected}) eliminado automáticamente`);
    } catch (err) {
      console.error('Error auto detecting bg:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickWhiteBgRemove = () => {
    setBgRemoveConfig({
      enabled: true,
      color: '#ffffff',
      tolerance: 18,
      feather: 3,
      mode: 'contiguous',
      deFringe: true,
    });
    showToast('Fondo blanco eliminado (JPEG a PNG)');
  };

  const handleQuickBlackBgRemove = () => {
    setBgRemoveConfig({
      enabled: true,
      color: '#000000',
      tolerance: 16,
      feather: 2,
      mode: 'contiguous',
      deFringe: true,
    });
    showToast('Fondo negro eliminado para DTF');
  };

  const handleResetBgRemove = () => {
    setBgRemoveConfig((prev) => ({ ...prev, enabled: false }));
    showToast('Fondo restaurado al original');
  };

  const handleDownloadTransparentPng = () => {
    if (!currentImageUrl) return;
    const link = document.createElement('a');
    link.download = `${imageName.replace(/\.[^/.]+$/, '')}_SinFondo_DTF.png`;
    link.href = currentImageUrl;
    link.click();
    showToast('PNG transparente descargado');
  };

  // Magic Eraser on Click (for letters O, A, P, R, D, B or enclosed trapped islands)
  const handleImageClickWithMagicEraser = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isMagicEraserActive) return;
    const imgEl = e.currentTarget;
    const rect = imgEl.getBoundingClientRect();

    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Accurate coordinate mapping to natural image resolution
    const scaleX = imgEl.naturalWidth / rect.width;
    const scaleY = imgEl.naturalHeight / rect.height;
    const targetX = Math.floor(clientX * scaleX);
    const targetY = Math.floor(clientY * scaleY);

    pushSnapshot();
    setIsProcessing(true);
    try {
      const srcUrl = currentImageUrl || originalImageUrl;
      const img = await loadImage(srcUrl);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.naturalWidth;
      tempCanvas.height = img.naturalHeight;
      const ctx = tempCanvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const resultCanvas = magicEraserFloodFill(
        tempCanvas,
        targetX,
        targetY,
        magicEraserTolerance,
        magicEraserFeather
      );

      const newUrl = resultCanvas.toDataURL('image/png', 1.0);
      setCurrentImageUrl(newUrl);
      setOriginalImageUrl(newUrl);
      showToast('✨ Hueco de letra borrado con el Borrador Mágico');
    } catch (err) {
      console.error('Error executing magic eraser on click:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Erase all enclosed holes & counter spaces in letters in 1 click
  const handleAutoEraseAllLetterHoles = async () => {
    pushSnapshot();
    setIsProcessing(true);
    try {
      const srcUrl = currentImageUrl || originalImageUrl;
      const img = await loadImage(srcUrl);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.naturalWidth;
      tempCanvas.height = img.naturalHeight;
      const ctx = tempCanvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const targetCol = bgRemoveConfig.color || '#ffffff';
      const resultCanvas = eraseAllEnclosedHoles(
        tempCanvas,
        targetCol,
        magicEraserTolerance,
        magicEraserFeather
      );

      const newUrl = resultCanvas.toDataURL('image/png', 1.0);
      setCurrentImageUrl(newUrl);
      setOriginalImageUrl(newUrl);
      showToast('✨ Todos los huecos de letras eliminados');
    } catch (err) {
      console.error('Error erasing all letter holes:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute 300 DPI Super-Resolution Upscaling
  const handleUpscaleSharpen = async () => {
    if (!currentImageUrl) return;
    setIsUpscaling(true);
    try {
      const img = await loadImage(currentImageUrl);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.naturalWidth;
      tempCanvas.height = img.naturalHeight;
      const ctx = tempCanvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const enhanced = upscaleAndSharpen(tempCanvas, upscaleFactor, 0.45);
      const enhancedUrl = enhanced.toDataURL('image/png', 1.0);

      setCurrentImageUrl(enhancedUrl);
      setPixelWidth(enhanced.width);
      setPixelHeight(enhanced.height);

      if (canvasRef.current) {
        canvasRef.current.width = enhanced.width;
        canvasRef.current.height = enhanced.height;
        const cCtx = canvasRef.current.getContext('2d');
        cCtx?.drawImage(enhanced, 0, 0);
      }
    } catch (err) {
      console.error('Error upscaling:', err);
    } finally {
      setIsUpscaling(false);
    }
  };

  // Run AI Advisor Analysis via server endpoint
  const handleAnalyzeWithAI = async () => {
    setIsAnalyzingAI(true);
    try {
      const res = await fetch('/api/ai/analyze-artwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technique,
          garmentColor: previewBgColor,
          targetDimensions: `${targetWidthCm} x ${targetHeightCm} cm`,
          mimeType: 'image/png',
          imageBase64: currentImageUrl,
          customNotes: `Resolución calculada: ${calculatedDpi} DPI. Semitonos: ${halftoneConfig.enabled ? 'Activados' : 'Desactivados'}. Calado: ${knockoutConfig.enabled ? 'Activado' : 'Desactivado'}.`
        })
      });

      const data = await res.json();
      if (data.analysis) {
        setAiAnalysis(data.analysis);
      }
    } catch (err) {
      console.error('Error analyzing artwork with AI:', err);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  // Download high-resolution PNG
  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `DTF_Optimizado_300DPI_${imageName}`;
    link.href = currentImageUrl || originalImageUrl;
    link.click();
  };

  const calculatedDpi = calculateDpi(pixelWidth, targetWidthCm);

  return (
    <div
      className={
        isExpandedView
          ? 'fixed inset-0 z-50 p-1 sm:p-2 bg-[#080d1a] flex flex-col overflow-hidden text-slate-200 shadow-2xl animate-in fade-in duration-200 w-full h-full'
          : 'flex flex-col xl:flex-row h-full w-full gap-2 sm:gap-2.5 p-1.5 sm:p-2.5 text-slate-200 overflow-hidden'
      }
    >
      {/* LEFT: Canvas & Viewport Area */}
      <div className="flex-1 flex flex-col bg-[#111726] rounded-xl border border-slate-800 overflow-hidden shadow-2xl w-full">
        {/* Viewport Toolbar */}
        <div className="h-14 border-b border-slate-800 px-2 sm:px-4 flex items-center justify-between bg-[#0e1422] shrink-0 relative z-30 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1 mr-2 overflow-hidden">
            {isExpandedView ? (
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Vista Ampliada</span>
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:inline shrink-0">Lienzo</span>
            )}
            <div className="h-4 w-px bg-slate-800 hidden md:block shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-slate-300 truncate">{imageName}</span>
            <span className="text-[11px] text-slate-500 font-mono tabular-nums hidden lg:inline shrink-0">
              {pixelWidth} x {pixelHeight} px · {calculatedDpi} DPI
            </span>
          </div>

          {/* Quick Previews & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Split Mode Selector */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-medium">
              <button
                onClick={() => {
                  setViewSplit('on_garment');
                  setActiveTab('placement');
                }}
                className={`px-2 sm:px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                  viewSplit === 'on_garment' ? 'bg-indigo-600 text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-white'
                }`}
                title="Modo Remera Textil con Medidas y Regla"
              >
                <Shirt className="w-3.5 h-3.5" />
                <span>Prenda</span>
              </button>
              <button
                onClick={() => setViewSplit('processed')}
                className={`px-2 sm:px-2.5 py-1 rounded transition-colors ${
                  viewSplit === 'processed' ? 'bg-indigo-600 text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-white'
                }`}
                title="Modo Lienzo Gráfico Puro"
              >
                Lienzo
              </button>
              <button
                onClick={() => setViewSplit('split')}
                className={`px-2 sm:px-2.5 py-1 rounded transition-colors hidden sm:block ${
                  viewSplit === 'split' ? 'bg-indigo-600 text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-white'
                }`}
                title="Comparar Original vs Procesado"
              >
                Comparar
              </button>
            </div>

            {/* Compact Zoom Controls */}
            <div className="flex items-center gap-0.5 sm:gap-1 pl-1 border-l border-slate-800">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.4, Math.round((z - 0.1) * 100) / 100))}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Alejar zoom"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(0.9)}
                className="text-xs font-mono font-bold tabular-nums px-1.5 py-0.5 rounded text-indigo-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                title="Ajustar zoom al 90%"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.min(2.5, Math.round((z + 0.1) * 100) / 100))}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Acercar zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* COLLAPSIBLE MENU: Atajos, Paneles, Utilidades y Herramientas */}
            <div className="relative" ref={toolsDropdownRef}>
              <button
                onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
                className={`px-2.5 py-1 text-xs rounded-lg border font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isToolsDropdownOpen
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md ring-2 ring-indigo-500/40'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title="Desplegar atajos, utilidades y herramientas de impresión"
              >
                <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Atajos & Más</span>
                <span className="sm:hidden">Más</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isToolsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Popover Dropdown Panel */}
              {isToolsDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-[#0c1222] border-2 border-indigo-500/80 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Keyboard className="w-4 h-4 text-indigo-400" />
                      Atajos & Herramientas
                    </span>
                    <button
                      onClick={() => setIsToolsDropdownOpen(false)}
                      className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Paneles Laterales de la Prenda & Regla */}
                  {viewSplit === 'on_garment' && (
                    <div className="space-y-1.5 bg-slate-900/90 rounded-lg p-2 border border-slate-800">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Paneles en Pantalla</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => {
                            const next = !isGarmentCardCollapsed;
                            setIsGarmentCardCollapsed(next);
                            showToast(next ? 'Panel prenda oculto' : 'Panel prenda visible');
                          }}
                          className={`px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                            !isGarmentCardCollapsed
                              ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/60'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          <Shirt className="w-3.5 h-3.5" />
                          <span>Prenda {!isGarmentCardCollapsed ? 'ON' : 'OFF'}</span>
                        </button>
                        <button
                          onClick={() => {
                            const next = !isRulerCardCollapsed;
                            setIsRulerCardCollapsed(next);
                            showToast(next ? 'Regla oculta' : 'Regla visible');
                          }}
                          className={`px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                            !isRulerCardCollapsed
                              ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/60'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          <Ruler className="w-3.5 h-3.5" />
                          <span>Regla {!isRulerCardCollapsed ? 'ON' : 'OFF'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quitar Fondo Rápido */}
                  <button
                    onClick={() => {
                      setActiveTab('bg_remove');
                      if (viewSplit === 'on_garment') setViewSplit('processed');
                      setIsToolsDropdownOpen(false);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between border bg-emerald-950/40 text-emerald-300 border-emerald-600/50 hover:bg-emerald-900/60 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Eraser className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Quitar Fondo de la Imagen</span>
                    </div>
                    <span className="text-[10px] bg-emerald-900/80 px-1.5 py-0.5 rounded text-emerald-200">Abrir</span>
                  </button>

                  {/* Historial Deshacer / Rehacer */}
                  <div className="flex items-center justify-between bg-slate-900/90 rounded-lg p-2 border border-slate-800">
                    <span className="text-xs text-slate-300 font-medium">Historial</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          handleUndo();
                          setIsToolsDropdownOpen(false);
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 cursor-pointer border border-slate-700"
                        title="Deshacer última acción (Ctrl+Z)"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        <span>Deshacer</span>
                      </button>
                      <button
                        onClick={() => {
                          handleRedo();
                          setIsToolsDropdownOpen(false);
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 cursor-pointer border border-slate-700"
                        title="Rehacer acción (Ctrl+Y)"
                      >
                        <Redo2 className="w-3.5 h-3.5" />
                        <span>Rehacer</span>
                      </button>
                    </div>
                  </div>

                  {/* Utilidades de Estampa */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Utilidades</span>

                    {/* Borrador Huecos */}
                    <button
                      onClick={() => {
                        setActiveTab('bg_remove');
                        setIsMagicEraserActive((prev) => !prev);
                        if (viewSplit === 'on_garment') setViewSplit('processed');
                        setIsToolsDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between border cursor-pointer transition-colors ${
                        isMagicEraserActive
                          ? 'bg-purple-600 text-white border-purple-400'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                        <span>Borrador Letras (O, A, P...)</span>
                      </div>
                      <span className="text-[10px] font-mono text-purple-300">{isMagicEraserActive ? 'Activo' : 'Auto'}</span>
                    </button>

                    {/* Modo Espejo */}
                    <button
                      onClick={() => {
                        handleToggleMirror();
                        setIsToolsDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between border cursor-pointer transition-colors ${
                        isMirrored
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FlipHorizontal className="w-3.5 h-3.5 text-amber-400" />
                        <span>Modo Espejo (Sublimación)</span>
                      </div>
                      <span className="text-[10px] font-mono">{isMirrored ? 'ON' : 'OFF'}</span>
                    </button>

                    {/* Rotar 90 & Auto Trim */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => {
                          handleRotate90();
                          setIsToolsDropdownOpen(false);
                        }}
                        disabled={isProcessing}
                        className="px-2 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Rotar 90°</span>
                      </button>
                      <button
                        onClick={() => {
                          handleAutoTrimBorders();
                          setIsToolsDropdownOpen(false);
                        }}
                        disabled={isProcessing}
                        className="px-2 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Crop className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Auto-Trim</span>
                      </button>
                    </div>

                    {/* Guías Láser & Giro */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => {
                          setShowLaserGuides((prev) => !prev);
                          showToast(!showLaserGuides ? 'Guías láser activadas' : 'Guías láser ocultas');
                        }}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 cursor-pointer ${
                          showLaserGuides
                            ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/50'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                        <span>{showLaserGuides ? 'Láser ON' : 'Láser OFF'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setGarmentSide((s) => (s === 'front' ? 'back' : 'front'));
                          showToast(garmentSide === 'front' ? 'Vista: Espalda' : 'Vista: Frente');
                        }}
                        className="px-2 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{garmentSide === 'front' ? 'Ver Espalda' : 'Ver Frente'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Modal de atajos & Vista ampliada */}
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setIsShortcutsModalOpen(true);
                        setIsToolsDropdownOpen(false);
                      }}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Ver Atajos de Teclado (?)</span>
                    </button>
                    <button
                      onClick={() => {
                        const next = !isExpandedView;
                        setIsExpandedView(next);
                        if (next) {
                          setIsPanelCollapsed(true);
                          setZoomLevel(0.9);
                          showToast('⛶ Vista Ampliada activada');
                        } else {
                          showToast('Vista normal restaurada');
                        }
                        setIsToolsDropdownOpen(false);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                      title="Pantalla Completa / Vista Ampliada"
                    >
                      {isExpandedView ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* PROMINENT "AJUSTES" (PANEL LATERAL) BUTTON - ALWAYS VISIBLE */}
            <button
              onClick={() => {
                const next = !isPanelCollapsed;
                setIsPanelCollapsed(next);
                showToast(next ? 'Panel lateral colapsado' : 'Panel de ajustes abierto');
              }}
              className={`px-3 py-1.5 text-xs rounded-lg border font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0 whitespace-nowrap ${
                !isPanelCollapsed
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400 ring-2 ring-indigo-500/40'
                  : 'bg-indigo-950/90 hover:bg-indigo-900 border-indigo-500/70 text-indigo-300 ring-1 ring-indigo-500/40'
              }`}
              title={!isPanelCollapsed ? 'Panel de ajustes abierto (Clic para expandir lienzo)' : 'Abrir panel lateral de ajustes'}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Ajustes</span>
              {isPanelCollapsed ? (
                <PanelRightOpen className="w-3.5 h-3.5 ml-0.5 text-indigo-300" />
              ) : (
                <PanelRightClose className="w-3.5 h-3.5 ml-0.5 text-indigo-200" />
              )}
            </button>
          </div>
        </div>

        {/* Canvas Display Viewport */}
        <div
          className="flex-1 relative flex items-center justify-center p-2 sm:p-3 overflow-auto transition-colors w-full h-full"
          style={{
            backgroundColor:
              bgPreviewType === 'checker'
                ? '#0b1120'
                : bgPreviewType === 'white'
                ? '#ffffff'
                : bgPreviewType === 'dark'
                ? '#000000'
                : previewBgColor === '#ffffff' ? '#e2e8f0' : previewBgColor,
            backgroundImage:
              bgPreviewType === 'checker'
                ? 'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)'
                : previewBgColor === '#ffffff'
                ? 'radial-gradient(#cbd5e1 1px, transparent 1px)'
                : 'radial-gradient(#1e293b 1px, transparent 1px)',
            backgroundSize: bgPreviewType === 'checker' ? '20px 20px' : '20px 20px',
            backgroundPosition: bgPreviewType === 'checker' ? '0 0, 0 10px, 10px -10px, -10px 0px' : '0 0',
          }}
        >
          {/* Floating Action Toast Notification */}
          {toastMessage && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="bg-slate-900/95 border border-indigo-500/70 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <span>{toastMessage}</span>
              </div>
            </div>
          )}

          {/* Sublimation Mirror Mode Persistent Floating Badge */}
          {isMirrored && (
            <div className="absolute top-4 right-6 z-40 pointer-events-none animate-in fade-in duration-150">
              <div className="bg-amber-500 text-slate-950 text-xs font-black uppercase px-3 py-1.5 rounded-lg shadow-2xl flex items-center gap-2 backdrop-blur-md border border-amber-300 tracking-wide">
                <FlipHorizontal className="w-4 h-4" />
                <span>🪞 Modo Espejo Activo (Sublimación)</span>
              </div>
            </div>
          )}
          {/* Main Visual Display */}
          <div
            className="relative transition-transform duration-150 ease-out shadow-2xl rounded-lg overflow-hidden"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {viewSplit === 'on_garment' ? (
              <div className="relative flex items-start justify-center gap-4 py-1 select-none w-full max-w-full">
                {/* LEFT OUTSIDE CARD: Garment Specs, Sizes & Side View (100% OUTSIDE the shirt, symmetric to right ruler) */}
                {!isGarmentCardCollapsed ? (
                  <div className="flex flex-col gap-2.5 w-56 shrink-0 select-none animate-in fade-in slide-in-from-left-2 duration-150">
                    <div className="bg-[#0e1422]/95 border-2 border-indigo-500/70 rounded-xl p-2.5 sm:p-3 shadow-2xl backdrop-blur-md space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Shirt className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="text-[11px] font-bold text-white uppercase tracking-wider">Prenda & Medidas</span>
                        </div>
                        <button
                          onClick={() => {
                            setIsGarmentCardCollapsed(true);
                            showToast('Panel de prenda colapsado');
                          }}
                          className="p-1 px-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-semibold cursor-pointer border border-slate-700"
                          title="Colapsar panel de prenda"
                        >
                          <ChevronLeft className="w-3 h-3" />
                          <span>Ocultar</span>
                        </button>
                      </div>

                      {/* Talle Selector */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Talle Prenda</span>
                          <span className="text-[9px] font-mono font-bold text-indigo-300">
                            {GARMENT_CHEST_WIDTH_CM[garmentSize]} cm pecho
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-1">
                          {(['S', 'M', 'L', 'XL', 'XXL'] as const).map((sz) => (
                            <button
                              key={sz}
                              onClick={() => {
                                setGarmentSize(sz);
                                showToast(`Talle ${sz} (${GARMENT_CHEST_WIDTH_CM[sz]} cm pecho)`);
                              }}
                              className={`py-0.5 text-center font-bold text-[11px] rounded transition-all border cursor-pointer ${
                                garmentSize === sz
                                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm ring-1 ring-indigo-400'
                                  : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                              }`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Vista Activa: Frente / Espalda */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Lado de Estampa</span>
                          <span className="text-[9px] font-bold text-indigo-400 uppercase px-1 py-0.2 rounded bg-indigo-950/80 border border-indigo-700">
                            {garmentSide === 'front' ? 'Frente' : 'Espalda'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => {
                              setGarmentSide('front');
                              showToast('Vista: Frente');
                            }}
                            className={`py-1 px-1.5 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                              garmentSide === 'front'
                                ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm ring-1 ring-indigo-400/50'
                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            <Shirt className="w-3 h-3 text-indigo-300" />
                            <span>Frente</span>
                          </button>
                          <button
                            onClick={() => {
                              setGarmentSide('back');
                              showToast('Vista: Espalda');
                            }}
                            className={`py-1 px-1.5 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                              garmentSide === 'back'
                                ? 'bg-amber-600 text-white border-amber-400 shadow-sm ring-1 ring-amber-400/50'
                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            <RotateCw className="w-3 h-3 text-amber-300" />
                            <span>Espalda</span>
                          </button>
                        </div>
                      </div>

                      {/* Ocupación en Pecho */}
                      <div className="pt-1.5 border-t border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Ocupación Pecho:</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {Math.round((targetWidthCm / GARMENT_CHEST_WIDTH_CM[garmentSize]) * 100)}%
                          </span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, Math.round((targetWidthCm / GARMENT_CHEST_WIDTH_CM[garmentSize]) * 100))}%`,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono">
                          <span>Estampa:</span>
                          <strong className="text-indigo-300">{targetWidthCm} x {targetHeightCm} cm</strong>
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono">
                          Calidad: <span className="text-emerald-400 font-semibold">{calculatedDpi} DPI</span>
                        </div>
                      </div>

                      {/* Color Prenda Swatches */}
                      <div className="pt-1.5 border-t border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide block">Color Prenda</span>
                          <span className="text-[9px] text-slate-300 font-medium">
                            {GARMENT_COLOR_TEMPLATES[previewBgColor]?.name || 'Negro Carbón'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[
                            { hex: '#0f172a', name: 'Negro' },
                            { hex: '#ffffff', name: 'Blanco' },
                            { hex: '#1e3a8a', name: 'Azul Marino' },
                            { hex: '#374151', name: 'Gris Melange' },
                            { hex: '#991b1b', name: 'Rojo Carmesí' }
                          ].map((swatch) => (
                            <button
                              key={swatch.hex}
                              onClick={() => {
                                setPreviewBgColor(swatch.hex);
                                setHalftoneConfig((prev) => ({ ...prev, garmentColor: swatch.hex }));
                                setKnockoutConfig((prev) => ({ ...prev, targetColor: swatch.hex }));
                                showToast(`Camiseta cambiada a: ${swatch.name}`);
                              }}
                              title={`Camiseta ${swatch.name}`}
                              style={{ backgroundColor: swatch.hex }}
                              className={`flex-1 h-5 rounded border transition-all cursor-pointer ${
                                previewBgColor === swatch.hex
                                  ? 'border-indigo-400 ring-2 ring-indigo-500/70 scale-105 shadow-sm'
                                  : 'border-slate-700 hover:border-slate-500'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Guías Láser Switch */}
                      <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] text-slate-300">Guías de Simetría</span>
                        <button
                          onClick={() => {
                            setShowLaserGuides(!showLaserGuides);
                            showToast(!showLaserGuides ? 'Guías láser activadas' : 'Guías láser ocultas');
                          }}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                            showLaserGuides
                              ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/50'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {showLaserGuides ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="shrink-0 select-none animate-in fade-in duration-150 flex flex-col justify-start pt-1">
                    <button
                      onClick={() => {
                        setIsGarmentCardCollapsed(false);
                        showToast('Panel de prenda desplegado');
                      }}
                      className="group bg-[#0e1422]/95 hover:bg-slate-800 border-2 border-indigo-500/70 hover:border-indigo-400 rounded-xl p-2.5 flex items-center gap-2.5 text-indigo-300 hover:text-white shadow-xl transition-all cursor-pointer backdrop-blur-md"
                      title="Desplegar panel de prenda (Talles, Frente/Espalda, Ocupación)"
                    >
                      <Shirt className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform shrink-0" />
                      <div className="text-left font-sans">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5 whitespace-nowrap">
                          <span>Prenda: Talle {garmentSize}</span>
                          <span className="text-[10px] text-indigo-400 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-700/50">
                            {garmentSide === 'front' ? 'Frente' : 'Espalda'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                          {targetWidthCm}x{targetHeightCm} cm · {Math.round((targetWidthCm / GARMENT_CHEST_WIDTH_CM[garmentSize]) * 100)}% pecho
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-indigo-400/80 group-hover:translate-x-1 transition-transform ml-1 shrink-0" />
                    </button>
                  </div>
                )}

                {/* CENTER: PURE T-SHIRT (ZERO BOXES COVERING THE NECK OR IMAGE!) */}
                  <div
                    className="relative w-[480px] h-[550px] max-w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 select-none cursor-crosshair transition-colors shrink-0"
                    style={{ backgroundColor: previewBgColor }}
                    onMouseDown={() => setIsDraggingOnGarment(true)}
                    onMouseUp={() => setIsDraggingOnGarment(false)}
                    onMouseLeave={() => setIsDraggingOnGarment(false)}
                    onMouseMove={(e) => {
                      if (!isDraggingOnGarment) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const mouseY = e.clientY - rect.top;
                      const mouseX = e.clientX - rect.left;
                      const chestWidth = GARMENT_CHEST_WIDTH_CM[garmentSize];
                      const pxPerCm = (480 * 0.70) / chestWidth;
                      const collarY = garmentSide === 'front' ? 88 : 80;
                      const newDistCm = Math.max(1, Math.min(60, (mouseY - collarY) / pxPerCm));
                      const centerX = 240;
                      const newOffsetCm = Math.max(-32, Math.min(32, (mouseX - centerX) / pxPerCm));
                      setPlacementDistanceCm(Math.round(newDistCm * 10) / 10);
                      setPlacementOffsetXCm(Math.round(newOffsetCm * 10) / 10);
                    }}
                  >
                    {/* Floating View Badge (Frente / Espalda) */}
                    <div className="absolute top-3 left-3 z-20 pointer-events-none">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border shadow-md flex items-center gap-1.5 backdrop-blur-md transition-all ${
                          garmentSide === 'front'
                            ? 'bg-slate-950/85 text-indigo-300 border-indigo-500/50'
                            : 'bg-indigo-950/90 text-amber-300 border-amber-500/60 ring-1 ring-amber-400/30'
                        }`}
                      >
                        <Shirt className="w-3.5 h-3.5" />
                        <span>{garmentSide === 'front' ? 'VISTA FRENTE' : 'VISTA ESPALDA'}</span>
                      </span>
                    </div>

                    {/* Interactive Turn T-Shirt Button directly on mockup */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = garmentSide === 'front' ? 'back' : 'front';
                        setGarmentSide(next);
                        showToast(`Girar remera a: ${next === 'front' ? 'Frente' : 'Espalda'}`);
                      }}
                      className="absolute top-3 right-3 z-30 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 text-[10px] font-bold shadow-lg flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md hover:scale-105 active:scale-95"
                      title="Girar la remera para ver el otro lado (F)"
                    >
                      <RotateCw className="w-3 h-3 text-indigo-400" />
                      <span>Girar a {garmentSide === 'front' ? 'Espalda' : 'Frente'}</span>
                    </button>

                    {/* Real cotton t-shirt texture - switches dynamically between FRONT and BACK mockup and selected COLOR */}
                    {(() => {
                      const colorTemplate = GARMENT_COLOR_TEMPLATES[previewBgColor] || GARMENT_COLOR_TEMPLATES['#0f172a'];
                      const activeImage = garmentSide === 'front' ? colorTemplate.front : colorTemplate.back;
                      return (
                        <img
                          key={`${previewBgColor}_${garmentSide}`}
                          src={activeImage}
                          alt={`Remera ${colorTemplate.name} ${garmentSide === 'front' ? 'Frente' : 'Espalda'}`}
                          className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-300 animate-in fade-in"
                        />
                      );
                    })()}

                    {/* Subtle Collar Seam Guideline - Front scoop vs Back high neck */}
                    {garmentSide === 'front' ? (
                      <div className="absolute top-[88px] left-1/2 -translate-x-1/2 w-36 h-8 border-b border-dashed border-indigo-400/40 rounded-b-full pointer-events-none z-10" />
                    ) : (
                      <div className="absolute top-[80px] left-1/2 -translate-x-1/2 w-32 h-4 border-b-2 border-dashed border-amber-400/60 rounded-b-lg pointer-events-none z-10" />
                    )}

                    {/* Laser Vertical Symmetry Line - Clean hairline, NO text box! */}
                    {showLaserGuides && (
                      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px border-l border-dashed border-cyan-400/35 pointer-events-none z-10" />
                    )}

                    {/* Laser Sisa guideline - Subtle hairline only */}
                    {showLaserGuides && (
                      <div
                        className="absolute left-5 right-5 border-t border-dashed border-slate-400/20 pointer-events-none z-10"
                        style={{
                          top: `${(garmentSide === 'front' ? 88 : 80) + (22 * (480 * 0.70)) / GARMENT_CHEST_WIDTH_CM[garmentSize]}px`,
                        }}
                      />
                    )}

                    {/* Graphic Print Layer on Garment */}
                    {(() => {
                      const chestWidth = GARMENT_CHEST_WIDTH_CM[garmentSize];
                      const pxPerCm = (480 * 0.70) / chestWidth;
                      const printW = targetWidthCm * pxPerCm;
                      const printH = targetHeightCm * pxPerCm;
                      const collarY = garmentSide === 'front' ? 88 : 80;
                      const topY = collarY + placementDistanceCm * pxPerCm;
                      const leftX = 240 + placementOffsetXCm * pxPerCm;

                      return (
                        <>
                          {/* Minimalist edge witness marks pointing to the external ruler card */}
                          {showRulerCm && (
                            <div className="absolute inset-0 pointer-events-none z-20">
                              {/* Horizontal guide from collar to right edge */}
                              <div
                                className="absolute right-0 border-t border-dashed border-yellow-400/60"
                                style={{
                                  top: `${collarY}px`,
                                  width: '32px',
                                }}
                              />
                              {/* Horizontal guide from graphic top to right edge */}
                              <div
                                className="absolute right-0 border-t border-dashed border-yellow-400/60"
                                style={{
                                  top: `${topY}px`,
                                  width: '32px',
                                }}
                              />
                              {/* Right edge caliper bracket on shirt border */}
                              <div
                                className="absolute right-0 border-r-2 border-yellow-400"
                                style={{
                                  top: `${collarY}px`,
                                  height: `${Math.max(4, topY - collarY)}px`,
                                }}
                              />
                            </div>
                          )}

                          {/* The Design Print - Crystal clear & vibrant with true colors on all shirt colors! */}
                          <div
                            className="absolute z-15 group transition-shadow cursor-move"
                            style={{
                              top: `${topY}px`,
                              left: `${leftX}px`,
                              width: `${printW}px`,
                              height: `${printH}px`,
                              transform: 'translate(-50%, 0)',
                              mixBlendMode: 'normal',
                              filter: 'drop-shadow(0 3px 12px rgba(0,0,0,0.45))',
                            }}
                          >
                            {(currentImageUrl || originalImageUrl) ? (
                              <img
                                src={currentImageUrl || originalImageUrl}
                                alt="Estampa en Prenda"
                                className="w-full h-full object-contain pointer-events-none"
                              />
                            ) : null}
                            {/* Active border & size indicator */}
                            <div className="absolute inset-0 border border-indigo-400/30 rounded pointer-events-none group-hover:border-indigo-400">
                              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-white bg-slate-950/90 px-1.5 py-0.5 rounded whitespace-nowrap border border-slate-800">
                                {targetWidthCm} x {targetHeightCm} cm
                              </span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* RIGHT OUTSIDE CARD: Measurement & Collar Distance (100% OUTSIDE the shirt, complete and fully readable) */}
                  {showRulerCm && (
                    !isRulerCardCollapsed ? (
                      <div className="flex flex-col gap-2.5 w-56 shrink-0 select-none animate-in fade-in slide-in-from-right-2 duration-150">
                        {/* The Measurement Box OUTSIDE the t-shirt */}
                        <div className="bg-[#0e1422]/95 border-2 border-yellow-400/80 rounded-xl p-2.5 sm:p-3 shadow-2xl backdrop-blur-md space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shrink-0" />
                              <span className="text-[11px] font-bold text-yellow-300 uppercase tracking-wider">Distancia Cuello</span>
                            </div>
                            <button
                              onClick={() => {
                                setIsRulerCardCollapsed(true);
                                showToast('Panel de regla colapsado (R)');
                              }}
                              className="p-1 px-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-semibold cursor-pointer border border-slate-700"
                              title="Colapsar regla para despejar la vista (R)"
                            >
                              <span>Ocultar</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-mono font-extrabold text-white tracking-tight">
                              {placementDistanceCm}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">cm</span>
                          </div>

                          <div className="pt-1.5 border-t border-slate-800">
                            <div className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                              <span>✋</span>
                              <span>{getFingerEquivalence(placementDistanceCm)}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Estándar adultos: 7 a 8 cm (3 a 4 dedos).
                            </span>
                          </div>

                          <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-300">
                            {placementOffsetXCm === 0 ? (
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                🎯 Centrado en el eje láser
                              </span>
                            ) : (
                              <span>
                                Desplazamiento: <strong className="text-white">{Math.abs(placementOffsetXCm)} cm</strong> {placementOffsetXCm < 0 ? 'a la izq.' : 'a la der.'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick Presets outside the shirt - Categorized Most Used Industry Standards */}
                        <div className="bg-slate-900/85 border border-slate-800 rounded-xl p-2.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                              Ubicaciones y Tamaños
                            </span>
                            <span className="text-[9px] text-indigo-400 font-mono font-semibold">Estándares DTF</span>
                          </div>

                          {/* Frente & Pecho */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                                Pecho & Frente
                              </span>
                              {garmentSide === 'front' && (
                                <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/60 px-1 rounded">Activo</span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-[11px]">
                              <button
                                onClick={() => applyPlacementPreset('chest_center')}
                                className={`px-2 py-1 rounded text-left truncate font-medium transition-colors border ${
                                  garmentSide === 'front' && placementDistanceCm === 7.5 && placementOffsetXCm === 0
                                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                                    : 'bg-slate-800/90 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700'
                                }`}
                                title="Pecho Centro Estándar (28 × 28 cm)"
                              >
                                Pecho Centro <span className="text-[9px] text-yellow-400 font-mono block">28 × 28 cm</span>
                              </button>
                              <button
                                onClick={() => applyPlacementPreset('chest_high')}
                                className={`px-2 py-1 rounded text-left truncate font-medium transition-colors border ${
                                  garmentSide === 'front' && placementDistanceCm === 5.0 && placementOffsetXCm === 0
                                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                                    : 'bg-slate-800/90 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700'
                                }`}
                                title="Pecho Alto / Juvenil (22 × 16 cm)"
                              >
                                Pecho Alto <span className="text-[9px] text-yellow-400 font-mono block">22 × 16 cm</span>
                              </button>
                              <button
                                onClick={() => applyPlacementPreset('left_pocket')}
                                className={`px-2 py-1 rounded text-left truncate font-medium transition-colors border ${
                                  garmentSide === 'front' && placementOffsetXCm === -9.0
                                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                                    : 'bg-slate-800/90 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700'
                                }`}
                                title="Bolsillo Izquierdo (10 × 10 cm)"
                              >
                                Bolsillo Izq. <span className="text-[9px] text-cyan-400 font-mono block">10 × 10 cm</span>
                              </button>
                              <button
                                onClick={() => applyPlacementPreset('right_pocket')}
                                className={`px-2 py-1 rounded text-left truncate font-medium transition-colors border ${
                                  garmentSide === 'front' && placementOffsetXCm === 9.0
                                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                                    : 'bg-slate-800/90 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700'
                                }`}
                                title="Bolsillo Derecho (10 × 10 cm)"
                              >
                                Bolsillo Der. <span className="text-[9px] text-cyan-400 font-mono block">10 × 10 cm</span>
                              </button>
                              <button
                                onClick={() => applyPlacementPreset('oversize_front')}
                                className={`px-2 py-1 rounded text-left truncate font-medium transition-colors border ${
                                  garmentSide === 'front' && placementDistanceCm === 11.5 && placementOffsetXCm === 0
                                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                                    : 'bg-slate-800/90 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700'
                                }`}
                                title="Streetwear Oversize (32 × 40 cm)"
                              >
                                Oversize <span className="text-[9px] text-amber-400 font-mono block">32 × 40 cm</span>
                              </button>
                              <button
                                onClick={() => applyPlacementPreset('belly_center')}
                                className={`px-2 py-1 rounded text-left truncate font-medium transition-colors border ${
                                  garmentSide === 'front' && placementDistanceCm === 18.0 && placementOffsetXCm === 0
                                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                                    : 'bg-slate-800/90 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700'
                                }`}
                                title="Zona Baja / Abdomen (26 × 20 cm)"
                              >
                                Abdomen <span className="text-[9px] text-purple-400 font-mono block">26 × 20 cm</span>
                              </button>
                            </div>
                          </div>

                          {/* Mangas & Dobladillos */}
                          <div className="pt-2 border-t border-slate-800">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">
                              Mangas & Dobladillos
                            </span>
                            <div className="grid grid-cols-2 gap-1 text-[11px]">
                              <button
                                onClick={() => applyPlacementPreset('left_sleeve')}
                                className={`px-2 py-1 rounded text-left truncate font-medium transition-colors border ${
                                  garmentSide === 'front' && placementOffsetXCm === -28.5
                                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                                    : 'bg-slate-800/90 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700'
                                }`}
                                title="Manga Izquierda (8 × 8 cm)"
                              >
                                Manga Izq. <span className="text-[9px] text-emerald-400 font-mono block">8 × 8 cm</span>
                              </button>
                              <button
                                onClick={() => applyPlacementPreset('right_sleeve')}
                                className={`px-2 py-1 rounded text-left truncate font-medium transition-colors border ${
                                  garmentSide === 'front' && placementOffsetXCm === 28.5
                                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                                    : 'bg-slate-800/90 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700'
                                }`}
                                title="Manga Derecha (8 × 8 cm)"
                              >
                                Manga Der. <span className="text-[9px] text-emerald-400 font-mono block">8 × 8 cm</span>
                              </button>
                              <button
                                onClick={() => applyPlacementPreset('hem_left')}
                                className={`px-2 py-1 rounded text-left truncate font-medium transition-colors border ${
                                  garmentSide === 'front' && placementDistanceCm >= 50 && placementOffsetXCm < 0
                                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                                    : 'bg-slate-800/90 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700'
                                }`}
                                title="Dobladillo Inferior Izquierdo (6 × 6 cm)"
                              >
                                Dobladillo Izq. <span className="text-[9px] text-pink-400 font-mono block">6 × 6 cm</span>
                              </button>
                              <button
                                onClick={() => applyPlacementPreset('hem_right')}
                                className={`px-2 py-1 rounded text-left truncate font-medium transition-colors border ${
                                  garmentSide === 'front' && placementDistanceCm >= 50 && placementOffsetXCm > 0
                                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                                    : 'bg-slate-800/90 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700'
                                }`}
                                title="Dobladillo Inferior Derecho (6 × 6 cm)"
                              >
                                Dobladillo Der. <span className="text-[9px] text-pink-400 font-mono block">6 × 6 cm</span>
                              </button>
                            </div>
                          </div>

                          {/* Espalda */}
                          <div className="pt-2 border-t border-slate-800">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                                Espalda
                              </span>
                              {garmentSide === 'back' && (
                                <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/60 px-1 rounded">Activo</span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-[11px]">
                              <button
                                onClick={() => applyPlacementPreset('back_yoke')}
                                className={`px-2 py-1 rounded text-left truncate font-medium transition-colors border ${
                                  garmentSide === 'back' && placementDistanceCm === 3.5
                                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                                    : 'bg-slate-800/90 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700'
                                }`}
                                title="Nuca / Logo Cuello (8 × 5 cm)"
                              >
                                Nuca / Logo <span className="text-[9px] text-indigo-400 font-mono block">8 × 5 cm</span>
                              </button>
                              <button
                                onClick={() => applyPlacementPreset('back_high')}
                                className={`px-2 py-1 rounded text-left truncate font-medium transition-colors border ${
                                  garmentSide === 'back' && placementDistanceCm === 5.5
                                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                                    : 'bg-slate-800/90 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700'
                                }`}
                                title="Espalda Alta (28 × 14 cm)"
                              >
                                Espalda Alta <span className="text-[9px] text-indigo-400 font-mono block">28 × 14 cm</span>
                              </button>
                              <button
                                onClick={() => applyPlacementPreset('back_center')}
                                className={`px-2 py-1 rounded text-left truncate font-medium transition-colors border ${
                                  garmentSide === 'back' && placementDistanceCm === 9.0
                                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                                    : 'bg-slate-800/90 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700'
                                }`}
                                title="Espalda Omóplatos (28 × 24 cm)"
                              >
                                Omóplatos <span className="text-[9px] text-indigo-400 font-mono block">28 × 24 cm</span>
                              </button>
                              <button
                                onClick={() => applyPlacementPreset('back_full')}
                                className={`px-2 py-1 rounded text-left truncate font-medium transition-colors border ${
                                  garmentSide === 'back' && placementDistanceCm === 11.0
                                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                                    : 'bg-slate-800/90 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700'
                                }`}
                                title="Espalda Completa A3 (29 × 38 cm)"
                              >
                                Espalda A3 <span className="text-[9px] text-indigo-400 font-mono block">29 × 38 cm</span>
                              </button>
                              <button
                                onClick={() => applyPlacementPreset('back_lumbar')}
                                className={`col-span-2 px-2 py-1 rounded text-center truncate font-medium transition-colors border ${
                                  garmentSide === 'back' && placementDistanceCm === 22.0
                                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                                    : 'bg-slate-800/90 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700'
                                }`}
                                title="Espalda Baja / Lumbar (28 × 16 cm)"
                              >
                                Espalda Baja / Lumbar <span className="text-[9px] text-indigo-400 font-mono inline ml-1.5">(28 × 16 cm)</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="shrink-0 select-none animate-in fade-in duration-150 flex flex-col justify-start pt-1">
                        <button
                          onClick={() => {
                            setIsRulerCardCollapsed(false);
                            showToast('Panel de regla desplegado (R)');
                          }}
                          className="group bg-[#0e1422]/95 hover:bg-slate-800 border-2 border-yellow-400/80 hover:border-yellow-300 rounded-xl p-2.5 flex items-center gap-2.5 text-yellow-300 hover:text-white shadow-xl transition-all cursor-pointer backdrop-blur-md"
                          title="Desplegar regla de medidas y 12 ubicaciones (R)"
                        >
                          <ChevronLeft className="w-4 h-4 text-yellow-400/80 group-hover:-translate-x-1 transition-transform mr-1 shrink-0" />
                          <Ruler className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform shrink-0" />
                          <div className="text-left font-sans">
                            <div className="text-xs font-bold text-white flex items-center gap-1.5 whitespace-nowrap">
                              <span>Regla: <strong className="text-yellow-300 font-mono">{placementDistanceCm} cm</strong></span>
                            </div>
                            <div className="text-[10px] text-amber-300/90 whitespace-nowrap">
                              ✋ {getFingerEquivalence(placementDistanceCm).split(' ')[0]} dedos · {placementOffsetXCm === 0 ? 'Centrado' : `${placementOffsetXCm} cm`}
                            </div>
                          </div>
                        </button>
                      </div>
                    )
                  )}
              </div>
            ) : viewSplit === 'split' ? (
              <div className="flex items-center">
                {/* Original half */}
                <div className="relative overflow-hidden w-64 h-96 border-r-2 border-indigo-500">
                  <span className="absolute top-2 left-2 z-10 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/70 text-white">
                    Original
                  </span>
                  {originalImageUrl ? (
                    <img
                      src={originalImageUrl}
                      alt="Original"
                      className="w-96 h-96 object-contain"
                      style={{ maxWidth: 'none' }}
                    />
                  ) : null}
                </div>
                {/* Processed half */}
                <div className="relative overflow-hidden w-64 h-96">
                  <span className="absolute top-2 right-2 z-10 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-600/90 text-white">
                    DTF Optimizado
                  </span>
                  {currentImageUrl ? (
                    <img
                      src={currentImageUrl}
                      alt="Optimizado"
                      className="w-96 h-96 object-contain -ml-32"
                      style={{ maxWidth: 'none' }}
                    />
                  ) : null}
                </div>
              </div>
            ) : viewSplit === 'original' ? (
              <div className="relative">
                {originalImageUrl ? (
                  <img
                    src={originalImageUrl}
                    alt="Original"
                    className="max-h-[500px] max-w-full object-contain"
                  />
                ) : null}
                <span className="absolute top-3 left-3 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/70 text-white">
                  Original sin procesar
                </span>
              </div>
            ) : (
              <div className="relative inline-block select-none">
                {(currentImageUrl || originalImageUrl) ? (
                  <div className="relative inline-block">
                    <img
                      src={currentImageUrl || originalImageUrl}
                      alt="Optimizado"
                      onClick={handleImageClickWithMagicEraser}
                      className={`max-h-[500px] max-w-full object-contain transition-all ${
                        isMagicEraserActive
                          ? 'cursor-crosshair ring-3 ring-purple-500/80 rounded-lg shadow-2xl brightness-105'
                          : ''
                      }`}
                      title={isMagicEraserActive ? 'Haz clic dentro de cualquier letra o isla para borrar su relleno' : ''}
                    />
                    {isMagicEraserActive && (
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-purple-950/95 border border-purple-400 text-purple-100 text-[11px] font-bold px-3 py-1 rounded-full shadow-2xl flex items-center gap-1.5 whitespace-nowrap animate-in fade-in slide-in-from-top-1 duration-150">
                        <Wand2 className="w-3.5 h-3.5 text-purple-300 animate-spin" />
                        <span>Haz clic dentro de la letra para borrar su relleno (O, A, P...)</span>
                      </div>
                    )}
                  </div>
                ) : null}
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center rounded-lg">
                    <div className="flex items-center gap-2 text-xs font-semibold text-white bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-700">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      Procesando píxeles...
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hidden reference canvas */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Canvas Bottom Action Bar */}
        <div className="h-16 border-t border-slate-800 bg-[#0e1422] px-6 flex items-center justify-between shrink-0">
          {/* Sample Preset Selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">Ejemplos Rápidos:</span>
            <div className="flex items-center gap-1.5">
              {demoList.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDemoId(d.id)}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                    selectedDemoId === d.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {d.name.split('_')[0]}
                </button>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 text-xs rounded-md font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <Upload className="w-3 h-3 text-indigo-400" />
                Subir Mi Archivo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            {onOpenAR && (
              <button
                onClick={() => onOpenAR(currentImageUrl)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600/90 hover:bg-indigo-600 text-white flex items-center gap-1.5 shadow-sm transition-all"
                title="Ver mockup en remeras, buzos, tazas y tote bags"
              >
                <Shirt className="w-3.5 h-3.5" />
                Mockup de Estudio
              </button>
            )}

            {onSendToNesting && (
              <button
                onClick={() =>
                  onSendToNesting({
                    name: imageName,
                    url: currentImageUrl,
                    widthCm: targetWidthCm,
                    heightCm: targetHeightCm,
                  })
                }
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                Armar en Pliego
              </button>
            )}

            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              Descargar 300 DPI
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: Production & AI Optimization Controls */}
      <div className={`w-full xl:w-96 flex flex-col bg-[#111726] rounded-xl border border-slate-800 overflow-hidden shadow-2xl shrink-0 transition-all ${isPanelCollapsed ? 'hidden' : 'flex'}`}>
        {/* Technique & Print Setup Header */}
        <div className="p-4 border-b border-slate-800 bg-[#0e1422]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Técnica de Estampado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                {(['DTF Textil', 'Sublimación', 'DTF UV'] as TechniqueType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTechnique(t)}
                    className={`px-2 py-1 text-[11px] font-semibold rounded transition-colors ${
                      technique === t ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setIsPanelCollapsed(true)}
                className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Ocultar panel para expandir el lienzo"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Physical Size & Real DPI indicator */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <label className="text-slate-400 text-[11px] block mb-1">Ancho Físico (cm)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.5"
                  min="5"
                  max="120"
                  value={targetWidthCm}
                  onChange={(e) => {
                    const w = parseFloat(e.target.value) || 10;
                    setTargetWidthCm(w);
                    const aspect = pixelHeight / pixelWidth;
                    setTargetHeightCm(Math.round(w * aspect * 10) / 10);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
                <span className="text-slate-500">cm</span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <label className="text-slate-400 text-[11px] block mb-1">Alto Físico (cm)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.5"
                  min="5"
                  max="200"
                  value={targetHeightCm}
                  onChange={(e) => setTargetHeightCm(parseFloat(e.target.value) || 10)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
                <span className="text-slate-500">cm</span>
              </div>
            </div>
          </div>

          {/* Real DPI Status Bar */}
          <div className="mt-3 flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Resolución de Salida:</span>
            <div className="flex items-center gap-1.5 font-mono font-bold">
              {calculatedDpi >= 280 ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {calculatedDpi} DPI (Óptimo)
                </span>
              ) : calculatedDpi >= 180 ? (
                <span className="text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {calculatedDpi} DPI (Aceptable)
                </span>
              ) : (
                <span className="text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {calculatedDpi} DPI (Baja nitidez)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Feature Tabs Bar */}
        <div className="flex items-center overflow-x-auto border-b border-slate-800 bg-[#0e1422] text-[11px] font-semibold text-center no-scrollbar">
          <button
            onClick={() => {
              setActiveTab('bg_remove');
              if (viewSplit === 'on_garment') setViewSplit('processed');
            }}
            className={`py-2.5 px-3 whitespace-nowrap transition-colors border-b-2 flex items-center justify-center gap-1 shrink-0 ${
              activeTab === 'bg_remove'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900/60 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eraser className="w-3.5 h-3.5 text-emerald-400" />
            <span>Quitar Fondo</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('sublimation');
              if (viewSplit === 'on_garment') setViewSplit('processed');
            }}
            className={`py-2.5 px-3 whitespace-nowrap transition-colors border-b-2 flex items-center justify-center gap-1 shrink-0 ${
              activeTab === 'sublimation'
                ? 'border-amber-500 text-amber-400 bg-slate-900/60 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Sublimación</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('colors');
              if (viewSplit === 'on_garment') setViewSplit('processed');
            }}
            className={`py-2.5 px-3 whitespace-nowrap transition-colors border-b-2 flex items-center justify-center gap-1 shrink-0 ${
              activeTab === 'colors'
                ? 'border-orange-500 text-orange-400 bg-slate-900/60 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-orange-400" />
            <span>Color & Boost</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('text');
              if (viewSplit === 'on_garment') setViewSplit('processed');
            }}
            className={`py-2.5 px-3 whitespace-nowrap transition-colors border-b-2 flex items-center justify-center gap-1 shrink-0 ${
              activeTab === 'text'
                ? 'border-blue-500 text-blue-400 bg-slate-900/60 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Type className="w-3.5 h-3.5 text-blue-400" />
            <span>Texto & Nombres</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('placement');
              setViewSplit('on_garment');
            }}
            className={`py-2.5 px-3 whitespace-nowrap transition-colors border-b-2 flex items-center justify-center gap-1 shrink-0 ${
              activeTab === 'placement'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/60 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ruler className="w-3 h-3 hidden sm:inline" />
            <span>Posición</span>
          </button>

          <button
            onClick={() => setActiveTab('halftone')}
            className={`py-2.5 px-3 whitespace-nowrap transition-colors border-b-2 shrink-0 ${
              activeTab === 'halftone'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/60 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Semitonos</span>
          </button>

          <button
            onClick={() => setActiveTab('knockout')}
            className={`py-2.5 px-3 whitespace-nowrap transition-colors border-b-2 shrink-0 ${
              activeTab === 'knockout'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/60 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Calado</span>
          </button>

          <button
            onClick={() => setActiveTab('edges')}
            className={`py-2.5 px-3 whitespace-nowrap transition-colors border-b-2 shrink-0 ${
              activeTab === 'edges'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/60 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Bordes</span>
          </button>

          <button
            onClick={() => setActiveTab('resolution')}
            className={`py-2.5 px-3 whitespace-nowrap transition-colors border-b-2 shrink-0 ${
              activeTab === 'resolution'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/60 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>300 DPI</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`py-2.5 px-3 whitespace-nowrap transition-colors border-b-2 shrink-0 ${
              activeTab === 'ai'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/60 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>IA</span>
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {/* TAB: QUITAR FONDO (BACKGROUND REMOVAL) */}
          {activeTab === 'bg_remove' && (
            <div className="space-y-4 text-xs">
              {/* Header Info Banner */}
              <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/40 p-3 rounded-lg border border-emerald-500/30">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-300">
                      <Eraser className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs">Quitar Fondo para DTF</h4>
                      <span className="text-[10px] text-emerald-400 font-medium">Convierte imágenes a PNG transparente sin halos</span>
                    </div>
                  </div>
                  {bgRemoveConfig.enabled && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                      Activo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Elimina fondos blancos o negros de JPEGs y fotos de clientes. El modo <strong>Contiguo</strong> protege los blancos dentro del logo (dientes, ojos, letras).
                </p>
              </div>

              {/* Instant 1-Click Action Buttons */}
              <div className="space-y-2">
                <label className="text-slate-300 font-semibold block text-[11px]">Acciones Rápidas (1 Clic)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleAutoDetectBgRemove}
                    disabled={isProcessing}
                    className="p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-left border border-emerald-400/40 shadow-sm transition-all flex items-start gap-2 col-span-2 cursor-pointer disabled:opacity-50"
                  >
                    <Wand2 className="w-4 h-4 shrink-0 text-white mt-0.5" />
                    <div>
                      <span className="block text-xs font-bold">Auto-Detectar y Quitar Fondo</span>
                      <span className="text-[10px] text-emerald-100 font-normal block">
                        Escanea bordes y elimina el fondo dominante automáticamente
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={handleQuickWhiteBgRemove}
                    disabled={isProcessing}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-medium text-left transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-white border border-slate-400 shrink-0" />
                    <div className="truncate">
                      <span className="block text-[11px] font-semibold">Fondo Blanco</span>
                      <span className="text-[9px] text-slate-400 block font-mono">JPEG a PNG</span>
                    </div>
                  </button>

                  <button
                    onClick={handleQuickBlackBgRemove}
                    disabled={isProcessing}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-medium text-left transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-600 shrink-0" />
                    <div className="truncate">
                      <span className="block text-[11px] font-semibold">Fondo Negro</span>
                      <span className="text-[9px] text-slate-400 block font-mono">Para DTF Textil</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* BORRADOR MÁGICO PARA HUECOS DE LETRAS (O, A, P, B, R...) */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/50 border-2 border-purple-500/50 space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span>Borrador Mágico de Letras e Islas</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40 font-bold">
                          Huecos O, A, P, B...
                        </span>
                      </h4>
                      <span className="text-[10px] text-purple-300 font-medium">
                        Elimina el color atrapado dentro de las letras o zonas cerradas
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300">
                  ¿Quedó fondo blanco o de color dentro de letras como <strong>O, A, P, R, D, B</strong>? Usa una de estas opciones:
                </p>

                {/* 2 Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setIsMagicEraserActive(!isMagicEraserActive);
                      if (viewSplit === 'on_garment') setViewSplit('processed');
                    }}
                    className={`p-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all border shadow-sm cursor-pointer ${
                      isMagicEraserActive
                        ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-300 ring-2 ring-purple-500/50'
                        : 'bg-slate-900 hover:bg-purple-950/60 text-purple-200 border-purple-600/50'
                    }`}
                  >
                    <Wand2 className="w-4 h-4 text-purple-300" />
                    <span>{isMagicEraserActive ? '🎯 Clic Activo (Toca la letra)' : '🪄 Borrar por Clic en Letra'}</span>
                  </button>

                  <button
                    onClick={handleAutoEraseAllLetterHoles}
                    disabled={isProcessing}
                    className="p-2.5 rounded-lg bg-purple-700/80 hover:bg-purple-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all border border-purple-400/50 shadow-sm cursor-pointer disabled:opacity-50"
                    title="Elimina todos los huecos de letras e islas en 1 clic"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>⚡ Limpiar Todos los Huecos</span>
                  </button>
                </div>

                {/* Active Indicator Banner */}
                {isMagicEraserActive && (
                  <div className="p-2 rounded-lg bg-purple-950/90 border border-purple-400/70 text-purple-100 flex items-center justify-between text-[11px] animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                      <span>Haz clic directo en cualquier hueco o letra en el lienzo para borrar su relleno.</span>
                    </div>
                    <button
                      onClick={() => setIsMagicEraserActive(false)}
                      className="text-[10px] text-purple-300 hover:text-white underline font-semibold ml-2 cursor-pointer"
                    >
                      Listo
                    </button>
                  </div>
                )}

                {/* Magic Eraser Tolerance Slider */}
                <div className="space-y-1 pt-1 border-t border-purple-900/60">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 font-medium">Sensibilidad del Borrador</span>
                    <span className="font-mono text-purple-300 font-bold">{magicEraserTolerance}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    value={magicEraserTolerance}
                    onChange={(e) => setMagicEraserTolerance(parseInt(e.target.value, 10))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>Preciso (5%)</span>
                    <span>Recomendado (20-30%)</span>
                    <span>Amplio (60%)</span>
                  </div>
                </div>
              </div>

              {/* Removal Mode Selection */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-medium text-[11px]">Método de Extracción</label>
                  <span className="text-[10px] text-indigo-400 font-mono">
                    {bgRemoveConfig.mode === 'contiguous' ? 'Protege detalles internos' : 'Elimina en todo el lienzo'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setBgRemoveConfig((prev) => ({ ...prev, mode: 'contiguous', enabled: true }))}
                    className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                      bgRemoveConfig.mode === 'contiguous' && bgRemoveConfig.enabled
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center gap-1.5">
                      <span>🛡️ Contiguo</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-800/80 text-white font-bold">DTF Pro</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Bordes hacia adentro. No borra dientes, ojos ni partes blancas interiores.
                    </span>
                  </button>

                  <button
                    onClick={() => setBgRemoveConfig((prev) => ({ ...prev, mode: 'global', enabled: true }))}
                    className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                      bgRemoveConfig.mode === 'global' && bgRemoveConfig.enabled
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center gap-1.5">
                      <span>🌐 Global</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Elimina el color en cualquier parte, incluso islas atrapadas dentro de letras.
                    </span>
                  </button>
                </div>
              </div>

              {/* Color Selection & Swatches */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-medium text-[11px]">Color de Fondo a Eliminar</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgRemoveConfig.color}
                      onChange={(e) => setBgRemoveConfig((prev) => ({ ...prev, color: e.target.value, enabled: true }))}
                      className="w-6 h-6 rounded cursor-pointer border border-slate-700 bg-transparent p-0"
                    />
                    <span className="font-mono text-xs text-slate-300 font-bold uppercase">{bgRemoveConfig.color}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {[
                    { hex: '#ffffff', name: 'Blanco Puro' },
                    { hex: '#000000', name: 'Negro' },
                    { hex: '#f8fafc', name: 'Blanco Roto' },
                    { hex: '#00ff00', name: 'Verde Croma' },
                    { hex: '#0000ff', name: 'Azul Croma' },
                    { hex: '#e2e8f0', name: 'Gris Claro' },
                  ].map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => setBgRemoveConfig((prev) => ({ ...prev, color: c.hex, enabled: true }))}
                      title={c.name}
                      style={{ backgroundColor: c.hex }}
                      className={`w-6 h-6 rounded-md border ${
                        bgRemoveConfig.color.toLowerCase() === c.hex.toLowerCase()
                          ? 'border-emerald-400 ring-2 ring-emerald-500/40 scale-110'
                          : 'border-slate-700 hover:border-slate-500'
                      } transition-all cursor-pointer`}
                    />
                  ))}
                  {detectedBgColor && (
                    <button
                      onClick={() => setBgRemoveConfig((prev) => ({ ...prev, color: detectedBgColor, enabled: true }))}
                      title={`Detectado: ${detectedBgColor}`}
                      style={{ backgroundColor: detectedBgColor }}
                      className="w-6 h-6 rounded-md border border-cyan-400 ring-1 ring-cyan-400 text-[8px] font-bold text-slate-900 flex items-center justify-center cursor-pointer ml-auto"
                    >
                      IA
                    </button>
                  )}
                </div>
              </div>

              {/* Sliders: Tolerance, Feather, DeFringe */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                {/* Tolerance */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-medium text-[11px]">Tolerancia de Color</label>
                    <span className="font-mono text-emerald-400 font-semibold">{bgRemoveConfig.tolerance}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    value={bgRemoveConfig.tolerance}
                    onChange={(e) => setBgRemoveConfig((prev) => ({ ...prev, tolerance: parseInt(e.target.value, 10), enabled: true }))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>Estricto (5%)</span>
                    <span>Recomendado (20-25%)</span>
                    <span>Amplio (80%)</span>
                  </div>
                </div>

                {/* Feathering / Suavizado */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-medium text-[11px]">Suavizado de Bordes (Feather)</label>
                    <span className="font-mono text-emerald-400 font-semibold">{bgRemoveConfig.feather} px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    value={bgRemoveConfig.feather}
                    onChange={(e) => setBgRemoveConfig((prev) => ({ ...prev, feather: parseInt(e.target.value, 10), enabled: true }))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* De-Fringing Toggle */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div>
                    <span className="font-semibold text-slate-200 block text-xs">Limpieza de Halos (De-Fringe)</span>
                    <span className="text-[10px] text-slate-400 block">Elimina bordes residuales blancos al estampar en oscuro</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={bgRemoveConfig.deFringe}
                    onChange={(e) => setBgRemoveConfig((prev) => ({ ...prev, deFringe: e.target.checked, enabled: true }))}
                    className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Transparency Verification & Test Backgrounds */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-slate-300 font-semibold block text-[11px]">Verificar Transparencia en Pantalla</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'checker', label: '🏁 Ajedrez' },
                    { id: 'dark', label: '🖤 Negro' },
                    { id: 'white', label: '🤍 Blanco' },
                    { id: 'garment', label: '👕 Prenda' },
                  ].map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => {
                        setBgPreviewType(bg.id as any);
                        if (bg.id === 'garment') setViewSplit('on_garment');
                        else if (viewSplit === 'on_garment') setViewSplit('processed');
                      }}
                      className={`py-1.5 px-2 rounded text-center border text-[10px] font-medium transition-colors cursor-pointer ${
                        bgPreviewType === bg.id
                          ? 'bg-indigo-600/40 border-indigo-500 text-white font-bold shadow-xs'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {bg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset & Export Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={handleResetBgRemove}
                  disabled={!bgRemoveConfig.enabled}
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restaurar Original
                </button>

                <button
                  onClick={handleDownloadTransparentPng}
                  className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar PNG
                </button>
              </div>
            </div>
          )}

          {/* TAB: SUBLIMACIÓN & PLANTILLAS DE PRODUCTOS */}
          {activeTab === 'sublimation' && (
            <div className="space-y-4 text-xs">
              {/* Sublimation Header Card */}
              <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-indigo-950/40 p-3.5 rounded-xl border border-amber-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Flame className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span>Sublimación & Termotransferencia</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                          Tazas, Textiles, Rígidos
                        </span>
                      </h4>
                      <span className="text-[10px] text-amber-300/90 font-medium">
                        Plantillas con medidas exactas y tabla de tiempos / temperaturas
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300">
                  La sublimación requiere imprimir en <strong>Modo Espejo</strong> sobre papel transfer especial y estampar a alta temperatura sobre poliéster o cerámicas con polímero.
                </p>

                {/* Mirror Control Warning & Toggle */}
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-amber-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FlipHorizontal className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {isMirrored ? '✓ Modo Espejo ACTIVADO' : '⚠️ Modo Espejo DESACTIVADO'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {isMirrored
                          ? 'El archivo saldrá invertido listo para transferir sin errores'
                          : 'Recuerda activar espejo antes de imprimir para que letras no salgan al revés'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleMirror}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs border transition-all cursor-pointer whitespace-nowrap ml-2 ${
                      isMirrored
                        ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400/50 shadow-sm'
                        : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/50'
                    }`}
                  >
                    {isMirrored ? 'Espejo ON' : 'Activar Espejo'}
                  </button>
                </div>
              </div>

              {/* Quick Manipulation Utilities for Sublimation & Transfer */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block text-[11px]">Manipulación Rápida de Imagen</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    onClick={handleAutoTrimBorders}
                    disabled={isProcessing}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-left transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    title="Recortar márgenes transparentes vacíos al contorno exacto"
                  >
                    <Crop className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <span className="block text-[11px] font-semibold">Auto-Recortar</span>
                      <span className="text-[9px] text-slate-400 block">Quita vacíos</span>
                    </div>
                  </button>

                  <button
                    onClick={handleRotate90}
                    disabled={isProcessing}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-left transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    title="Rotar 90° horario para acomodar franjas de tazas"
                  >
                    <RotateCw className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="block text-[11px] font-semibold">Rotar 90°</span>
                      <span className="text-[9px] text-slate-400 block">Horario</span>
                    </div>
                  </button>

                  <button
                    onClick={handleFlipVertical}
                    disabled={isProcessing}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-left transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    title="Voltear verticalmente la imagen"
                  >
                    <FlipVertical className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <span className="block text-[11px] font-semibold">Voltear Vert.</span>
                      <span className="text-[9px] text-slate-400 block">Eje Y</span>
                    </div>
                  </button>

                  <button
                    onClick={handleInvertColors}
                    disabled={isProcessing}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-left transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    title="Invertir colores (Efecto Negativo para estampas invertidas)"
                  >
                    <Palette className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="block text-[11px] font-semibold">Invertir Colores</span>
                      <span className="text-[9px] text-slate-400 block">Negativo</span>
                    </div>
                  </button>

                  <button
                    onClick={handleGrayscale}
                    disabled={isProcessing}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-left transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    title="Convertir a blanco y negro puro para sublimación vintage o monocolor"
                  >
                    <Sliders className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <span className="block text-[11px] font-semibold">Blanco & Negro</span>
                      <span className="text-[9px] text-slate-400 block">Escala Grises</span>
                    </div>
                  </button>

                  <button
                    onClick={handleToggleMirror}
                    className={`p-2 rounded-lg text-left transition-colors flex items-center gap-2 cursor-pointer border ${
                      isMirrored
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                    }`}
                    title="Modo espejo para sublimación transfer"
                  >
                    <FlipHorizontal className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="block text-[11px] font-semibold">{isMirrored ? 'Espejo ON' : 'Espejo OFF'}</span>
                      <span className="text-[9px] text-slate-400 block">Sublimar</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Sublimation Product Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold block text-[11px]">Plantillas de Productos Sublimables</label>
                  <span className="text-[10px] text-amber-400 font-mono">11 Productos</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUBLIMATION_PRESETS.map((preset) => {
                    const isSelected = selectedSubliPresetId === preset.id && targetWidthCm === preset.widthCm && targetHeightCm === preset.heightCm;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => handleApplySubliPreset(preset)}
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-950/50 border-amber-500 text-white ring-1 ring-amber-500/50 shadow-sm'
                            : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-white">{preset.name}</span>
                          <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/20">
                            {preset.widthCm} x {preset.heightCm} cm
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mb-1.5 line-clamp-1">{preset.description}</p>
                        <div className="flex items-center gap-2 text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                          <span className="text-amber-300">🌡️ {preset.tempC}°C</span>
                          <span>⏱️ {preset.timeSec}s</span>
                          <span>🔨 Presión {preset.pressure}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Thermal Parameters Guide Cheat Sheet */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold text-white text-xs">Tabla Rápida de Planchado</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-[10px] text-center font-mono">
                  <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">Tazas Rectas</span>
                    <strong className="text-amber-300">185°C · 180s</strong>
                  </div>
                  <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">Poliéster Blanco</span>
                    <strong className="text-amber-300">195°C · 45s</strong>
                  </div>
                  <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">Neoprene / Pads</span>
                    <strong className="text-amber-300">190°C · 45s</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: COLOR & BOOST DE SUBLIMACIÓN */}
          {activeTab === 'colors' && (
            <div className="space-y-4 text-xs">
              {/* Subli Boost Banner */}
              <div className="bg-gradient-to-r from-orange-950/60 via-slate-900 to-amber-950/40 p-3 rounded-lg border border-orange-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-orange-500/20 text-orange-300">
                      <Flame className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs">Ajuste de Color & Boost Sublimación</h4>
                      <span className="text-[10px] text-orange-400 font-medium">Compensa la pérdida de contraste de la prensa térmica</span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Al sublimar telas o cerámicas, las tintas suelen perder un 10-15% de viveza. El Boost de Sublimación realza tonos y sombras para un estampado radiante.
                </p>

                {/* 1-Click Sublimation Boost Button */}
                <button
                  onClick={handleSubliBoost}
                  disabled={isProcessing}
                  className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <Flame className="w-4 h-4 text-yellow-200 animate-pulse" />
                  <span>⚡ Aplicar Boost de Sublimación (+26% Saturación & Contraste)</span>
                </button>
              </div>

              {/* Sliders: Saturation, Contrast, Brightness, Warmth */}
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-3">
                {/* Saturation */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-medium text-[11px]">Saturación de Color</label>
                    <span className="font-mono text-orange-400 font-bold">{colorConfig.saturation > 0 ? `+${colorConfig.saturation}%` : `${colorConfig.saturation}%`}</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="80"
                    value={colorConfig.saturation}
                    onChange={(e) => setColorConfig((prev) => ({ ...prev, saturation: parseInt(e.target.value, 10) }))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>Desaturado (-50%)</span>
                    <span>Normal (0%)</span>
                    <span>Ultra Vívido (+80%)</span>
                  </div>
                </div>

                {/* Contrast */}
                <div className="space-y-1 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-medium text-[11px]">Contraste</label>
                    <span className="font-mono text-orange-400 font-bold">{colorConfig.contrast > 0 ? `+${colorConfig.contrast}%` : `${colorConfig.contrast}%`}</span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="50"
                    value={colorConfig.contrast}
                    onChange={(e) => setColorConfig((prev) => ({ ...prev, contrast: parseInt(e.target.value, 10) }))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>

                {/* Brightness */}
                <div className="space-y-1 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-medium text-[11px]">Brillo / Exposición</label>
                    <span className="font-mono text-orange-400 font-bold">{colorConfig.brightness > 0 ? `+${colorConfig.brightness}%` : `${colorConfig.brightness}%`}</span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    value={colorConfig.brightness}
                    onChange={(e) => setColorConfig((prev) => ({ ...prev, brightness: parseInt(e.target.value, 10) }))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>

                {/* Warmth */}
                <div className="space-y-1 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-medium text-[11px]">Calidez / Tono</label>
                    <span className="font-mono text-orange-400 font-bold">{colorConfig.warmth > 0 ? `+${colorConfig.warmth}` : `${colorConfig.warmth}`}</span>
                  </div>
                  <input
                    type="range"
                    min="-25"
                    max="25"
                    value={colorConfig.warmth}
                    onChange={(e) => setColorConfig((prev) => ({ ...prev, warmth: parseInt(e.target.value, 10) }))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>Frío / Azulado</span>
                    <span>Neutro</span>
                    <span>Cálido / Dorado</span>
                  </div>
                </div>
              </div>

              {/* Reset colors */}
              <button
                onClick={handleResetColors}
                className="w-full py-2 px-3 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restaurar Colores Originales
              </button>
            </div>
          )}

          {/* TAB: TEXTO & NOMBRES PERSONALIZADOS */}
          {activeTab === 'text' && (
            <div className="space-y-4 text-xs">
              {/* Text Overlay Header Card */}
              <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/40 p-3 rounded-lg border border-blue-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-md bg-blue-500/20 text-blue-300">
                    <Type className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">Texto & Nombres Personalizados</h4>
                    <span className="text-[10px] text-blue-400 font-medium">Ideal para tazas con nombre, números y frases</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Escribe un nombre o frase directa en el diseño sin abrir Photoshop. Con trazo/borde para que resalte sobre cualquier imagen.
                </p>
              </div>

              {/* Text Input */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block text-[11px]">Texto a incorporar</label>
                <input
                  type="text"
                  placeholder="Ej: Facundo, Feliz Día Mamá, #10..."
                  value={textConfig.text}
                  onChange={(e) => setTextConfig((prev) => ({ ...prev, text: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium text-xs focus:outline-none focus:border-blue-500"
                />
                {textConfig.text && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['FACUNDO', 'FELIZ CUMPLE', 'MAMÁ #1', 'PAPÁ #1', 'CAMPEÓN'].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setTextConfig((prev) => ({ ...prev, text: suggestion }))}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Font Family Selection */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block text-[11px]">Estilo Tipográfico</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'Plus Jakarta Sans', label: 'Moderna Bold', sample: 'SANS BOLD' },
                    { id: 'Impact', label: 'Streetwear / Impact', sample: 'IMPACT' },
                    { id: 'Georgia', label: 'Elegante Clásica', sample: 'Serif Clásica' },
                    { id: 'JetBrains Mono', label: 'Deportiva / Urbana', sample: 'MONO 10' },
                  ].map((font) => (
                    <button
                      key={font.id}
                      onClick={() => setTextConfig((prev) => ({ ...prev, fontFamily: font.id }))}
                      className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                        textConfig.fontFamily === font.id
                          ? 'bg-blue-950/60 border-blue-500 text-white font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="block text-xs font-semibold">{font.label}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5" style={{ fontFamily: font.id }}>
                        {font.sample}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size & Position */}
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-medium text-[11px]">Tamaño del Texto</label>
                    <span className="font-mono text-blue-400 font-bold">{textConfig.fontSize} px</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="90"
                    value={textConfig.fontSize}
                    onChange={(e) => setTextConfig((prev) => ({ ...prev, fontSize: parseInt(e.target.value, 10) }))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-medium text-[11px]">Posición Vertical (Altura)</label>
                    <span className="font-mono text-blue-400 font-bold">{textConfig.positionYPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="95"
                    value={textConfig.positionYPercent}
                    onChange={(e) => setTextConfig((prev) => ({ ...prev, positionYPercent: parseInt(e.target.value, 10) }))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>Arriba (15%)</span>
                    <span>Centro (50%)</span>
                    <span>Abajo (85%)</span>
                  </div>
                </div>
              </div>

              {/* Text Fill Color & Stroke (Border) */}
              <div className="space-y-2 p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-medium text-[11px]">Color de Letra</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={textConfig.color}
                      onChange={(e) => setTextConfig((prev) => ({ ...prev, color: e.target.value }))}
                      className="w-6 h-6 rounded cursor-pointer border border-slate-700 bg-transparent p-0"
                    />
                    <span className="font-mono text-xs text-white uppercase font-bold">{textConfig.color}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <label className="text-slate-300 font-medium text-[11px]">Trazo / Borde (Stroke)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textConfig.strokeColor}
                      onChange={(e) => setTextConfig((prev) => ({ ...prev, strokeColor: e.target.value }))}
                      className="w-6 h-6 rounded cursor-pointer border border-slate-700 bg-transparent p-0"
                    />
                    <span className="text-[11px] font-mono text-slate-400">{textConfig.strokeWidth} px</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  value={textConfig.strokeWidth}
                  onChange={(e) => setTextConfig((prev) => ({ ...prev, strokeWidth: parseInt(e.target.value, 10) }))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Clear Text button */}
              {textConfig.text && (
                <button
                  onClick={() => setTextConfig((prev) => ({ ...prev, text: '' }))}
                  className="w-full py-2 px-3 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  Quitar Texto del Lienzo
                </button>
              )}
            </div>
          )}

          {/* TAB 0: POSICIONAMIENTO TEXTIL & REGLA DE CENTRADO */}
          {activeTab === 'placement' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-1.5 mb-1">
                  <Ruler className="w-4 h-4 text-indigo-400" />
                  <h4 className="font-semibold text-white">Guía de Posicionamiento Textil</h4>
                </div>
                <p className="text-[11px] text-slate-400">
                  Ubicación exacta en centímetros para termoestampado profesional con regla de centrado.
                </p>
              </div>

              {/* Placement Quick Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-medium block">Ubicaciones Estándar de la Industria</label>
                  <span className="text-[10px] text-indigo-400 font-mono">12 Preajustes</span>
                </div>

                {/* Frente & Pecho */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Pecho & Frente</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'chest_center', label: 'Pecho Centro', note: '28 × 28 cm · 7.5 cm' },
                      { id: 'chest_high', label: 'Pecho Alto', note: '22 × 16 cm · 5.0 cm' },
                      { id: 'left_pocket', label: 'Bolsillo Izq.', note: '10 × 10 cm · -9.0 cm' },
                      { id: 'right_pocket', label: 'Bolsillo Der.', note: '10 × 10 cm · +9.0 cm' },
                      { id: 'oversize_front', label: 'Oversize', note: '32 × 40 cm · 11.5 cm' },
                      { id: 'belly_center', label: 'Zona Abdomen', note: '26 × 20 cm · 18.0 cm' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          applyPlacementPreset(p.id as any);
                          setViewSplit('on_garment');
                        }}
                        className={`px-2.5 py-1.5 rounded-md font-medium text-[11px] border transition-colors text-left truncate ${
                          garmentSide === 'front' &&
                          ((p.id === 'chest_center' && placementDistanceCm === 7.5 && placementOffsetXCm === 0) ||
                            (p.id === 'chest_high' && placementDistanceCm === 5.0 && placementOffsetXCm === 0) ||
                            (p.id === 'left_pocket' && placementOffsetXCm === -9.0) ||
                            (p.id === 'right_pocket' && placementOffsetXCm === 9.0) ||
                            (p.id === 'oversize_front' && placementDistanceCm === 11.5) ||
                            (p.id === 'belly_center' && placementDistanceCm === 18.0))
                            ? 'bg-indigo-600/30 border-indigo-500 text-white'
                            : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <span className="block font-semibold">{p.label}</span>
                        <span className="text-[9px] text-slate-400 block font-mono">{p.note}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mangas & Dobladillos */}
                <div className="space-y-1 pt-1.5 border-t border-slate-800/80">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Mangas & Dobladillos</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'left_sleeve', label: 'Manga Izquierda', note: '8 × 8 cm · bíceps' },
                      { id: 'right_sleeve', label: 'Manga Derecha', note: '8 × 8 cm · bíceps' },
                      { id: 'hem_left', label: 'Dobladillo Izq.', note: '6 × 6 cm · bajo' },
                      { id: 'hem_right', label: 'Dobladillo Der.', note: '6 × 6 cm · bajo' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          applyPlacementPreset(p.id as any);
                          setViewSplit('on_garment');
                        }}
                        className={`px-2.5 py-1.5 rounded-md font-medium text-[11px] border transition-colors text-left truncate ${
                          garmentSide === 'front' &&
                          ((p.id === 'left_sleeve' && placementOffsetXCm === -28.5) ||
                            (p.id === 'right_sleeve' && placementOffsetXCm === 28.5) ||
                            (p.id === 'hem_left' && placementDistanceCm >= 50 && placementOffsetXCm < 0) ||
                            (p.id === 'hem_right' && placementDistanceCm >= 50 && placementOffsetXCm > 0))
                            ? 'bg-indigo-600/30 border-indigo-500 text-white'
                            : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <span className="block font-semibold">{p.label}</span>
                        <span className="text-[9px] text-slate-400 block font-mono">{p.note}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Espalda */}
                <div className="space-y-1 pt-1.5 border-t border-slate-800/80">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Espalda</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'back_yoke', label: 'Nuca / Logo Cuello', note: '8 × 5 cm · 3.5 cm' },
                      { id: 'back_high', label: 'Espalda Alta', note: '28 × 14 cm · 5.5 cm' },
                      { id: 'back_center', label: 'Omóplatos / Centro', note: '28 × 24 cm · 9.0 cm' },
                      { id: 'back_full', label: 'Espalda Completa A3', note: '29 × 38 cm · 11.0 cm' },
                      { id: 'back_lumbar', label: 'Espalda Baja / Lumbar', note: '28 × 16 cm · 22.0 cm' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          applyPlacementPreset(p.id as any);
                          setViewSplit('on_garment');
                        }}
                        className={`px-2.5 py-1.5 rounded-md font-medium text-[11px] border transition-colors text-left truncate ${
                          garmentSide === 'back' &&
                          ((p.id === 'back_yoke' && placementDistanceCm === 3.5) ||
                            (p.id === 'back_high' && placementDistanceCm === 5.5) ||
                            (p.id === 'back_center' && placementDistanceCm === 9.0) ||
                            (p.id === 'back_full' && placementDistanceCm === 11.0) ||
                            (p.id === 'back_lumbar' && placementDistanceCm === 22.0))
                            ? 'bg-indigo-600/30 border-indigo-500 text-white'
                            : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <span className="block font-semibold">{p.label}</span>
                        <span className="text-[9px] text-slate-400 block font-mono">{p.note}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Exact Sliders & Numbers */}
              <div className="space-y-3.5 bg-slate-900/50 p-3.5 rounded-lg border border-slate-800/80">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-medium">Bajar desde la Costura del Cuello</label>
                    <span className="font-mono text-yellow-400 font-bold">{placementDistanceCm} cm</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    step="0.5"
                    value={placementDistanceCm}
                    onChange={(e) => {
                      setPlacementDistanceCm(parseFloat(e.target.value));
                      setViewSplit('on_garment');
                    }}
                    className="w-full accent-yellow-400 cursor-pointer"
                  />
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-0.5">
                    <span>Equivale a: <strong className="text-slate-200">{getFingerEquivalence(placementDistanceCm)}</strong></span>
                    <button
                      onClick={() => setPlacementDistanceCm(7.5)}
                      className="text-indigo-400 hover:underline"
                    >
                      Fijar 7.5 cm estándar
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-medium">Desplazamiento Lateral (Eje X)</label>
                    <span className="font-mono text-cyan-400 font-bold">
                      {placementOffsetXCm === 0 ? '0 cm (Centrado)' : `${placementOffsetXCm > 0 ? `+${placementOffsetXCm}` : placementOffsetXCm} cm`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-32"
                    max="32"
                    step="0.5"
                    value={placementOffsetXCm}
                    onChange={(e) => {
                      setPlacementOffsetXCm(parseFloat(e.target.value));
                      setViewSplit('on_garment');
                    }}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                    <span>Izquierda (Pecho Izq)</span>
                    <button
                      onClick={() => setPlacementOffsetXCm(0)}
                      className="text-indigo-400 hover:underline"
                    >
                      Centrar en Eje
                    </button>
                    <span>Derecha</span>
                  </div>
                </div>

                {/* Garment Size Selection */}
                <div>
                  <label className="text-slate-300 font-medium block mb-1.5">
                    Talle de Remera (Proporción Visual)
                  </label>
                  <div className="grid grid-cols-5 gap-1">
                    {(['S', 'M', 'L', 'XL', 'XXL'] as const).map((sz) => (
                      <button
                        key={sz}
                        onClick={() => {
                          setGarmentSize(sz);
                          setViewSplit('on_garment');
                        }}
                        className={`py-1 rounded font-mono font-bold text-xs border transition-colors ${
                          garmentSize === sz
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Ancho de sisa: {GARMENT_CHEST_WIDTH_CM[garmentSize]} cm. La estampa de {targetWidthCm} cm ocupa el{' '}
                    {Math.round((targetWidthCm / GARMENT_CHEST_WIDTH_CM[garmentSize]) * 100)}% del frente.
                  </span>
                </div>

                {/* Guides Toggles */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={showLaserGuides}
                      onChange={(e) => setShowLaserGuides(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-indigo-600 bg-slate-900 border-slate-700"
                    />
                    Láser de Centrado
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={showRulerCm}
                      onChange={(e) => setShowRulerCm(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-indigo-600 bg-slate-900 border-slate-700"
                    />
                    Cinta Métrica en cm
                  </label>
                </div>
              </div>

              {/* Operator Instruction Card for Heat Press */}
              <div className="bg-slate-950 p-3 rounded-lg border border-indigo-500/30 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 text-indigo-400 font-bold uppercase tracking-wider">
                  <Target className="w-3.5 h-3.5" />
                  <span>Ficha Técnica para la Termoestampadora</span>
                </div>
                <ul className="space-y-1 text-slate-300 list-decimal pl-4">
                  <li>Colocar la remera en el plato de la plancha plana y sin arrugas.</li>
                  <li>
                    Medir <strong>{placementDistanceCm} cm</strong> ({getFingerEquivalence(placementDistanceCm)}) desde la costura inferior del cuello hacia abajo.
                  </li>
                  <li>
                    {placementOffsetXCm === 0
                      ? 'Alinear el centro del film exactamente con el centro del cuello.'
                      : `Desplazar ${Math.abs(placementOffsetXCm)} cm hacia el lado ${placementOffsetXCm < 0 ? 'izquierdo' : 'derecho'}.`}
                  </li>
                  <li>
                    Temperatura: <strong>{technique === 'Sublimación' ? '200°C / 45 seg' : '160°C / 15 seg'}</strong> a presión media.
                  </li>
                  <li>
                    {technique === 'Sublimación' ? 'Retirar en caliente inmediato.' : 'Esperar a que enfríe totalmente antes de retirar el film (Cold Peel).'}
                  </li>
                </ul>
              </div>
            </div>
          )}
          {/* TAB 1: SEMITONOS (HALFTONES) */}
          {activeTab === 'halftone' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <div>
                  <h4 className="font-semibold text-white">Trama de Semitonos DTF</h4>
                  <p className="text-[11px] text-slate-400">
                    Ahorra tinta blanca y da sensación suave y transpirable.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={halftoneConfig.enabled}
                  onChange={(e) => setHalftoneConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                />
              </div>

              {halftoneConfig.enabled && (
                <div className="space-y-3.5 bg-slate-900/50 p-3.5 rounded-lg border border-slate-800/80">
                  {/* Shape Selector */}
                  <div>
                    <label className="text-slate-300 font-medium block mb-1.5">Forma de Punto de Trama</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'round', label: 'Puntos Circulares' },
                        { id: 'ellipse', label: 'Elípticos (Serigrafía)' },
                        { id: 'line', label: 'Líneas de Trama' },
                        { id: 'diffusion', label: 'Difusión Estocástica' },
                      ].map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setHalftoneConfig((prev) => ({ ...prev, shape: s.id as any }))}
                          className={`px-2.5 py-1.5 rounded-md font-medium text-[11px] border transition-colors ${
                            halftoneConfig.shape === s.id
                              ? 'bg-indigo-600/30 border-indigo-500 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* LPI (Lines per inch) */}
                  {halftoneConfig.shape !== 'diffusion' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-300 font-medium">Frecuencia de Trama (LPI)</label>
                        <span className="font-mono text-indigo-400 font-semibold">{halftoneConfig.lpi} LPI</span>
                      </div>
                      <input
                        type="range"
                        min="25"
                        max="65"
                        step="5"
                        value={halftoneConfig.lpi}
                        onChange={(e) =>
                          setHalftoneConfig((prev) => ({ ...prev, lpi: parseInt(e.target.value, 10) }))
                        }
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                        <span>30 LPI (Puntos visibles)</span>
                        <span>45 LPI (Recomendado DTF)</span>
                        <span>60 LPI (Ultra fino)</span>
                      </div>
                    </div>
                  )}

                  {/* Angle */}
                  {halftoneConfig.shape !== 'diffusion' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-300 font-medium">Ángulo de Trama</label>
                        <span className="font-mono text-indigo-400 font-semibold">{halftoneConfig.angle}°</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {[0, 22.5, 45, 75].map((ang) => (
                          <button
                            key={ang}
                            onClick={() => setHalftoneConfig((prev) => ({ ...prev, angle: ang }))}
                            className={`flex-1 py-1 rounded text-[11px] font-mono border transition-colors ${
                              halftoneConfig.angle === ang
                                ? 'bg-indigo-600/30 border-indigo-500 text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {ang}°
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Garment integration toggle */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-slate-300">Huecos transparentes para tela</span>
                    <input
                      type="checkbox"
                      checked={halftoneConfig.blendWithGarment}
                      onChange={(e) =>
                        setHalftoneConfig((prev) => ({ ...prev, blendWithGarment: e.target.checked }))
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CALADO ARTÍSTICO (COLOR KNOCKOUT) */}
          {activeTab === 'knockout' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <div>
                  <h4 className="font-semibold text-white">Calado Artístico (Knockout)</h4>
                  <p className="text-[11px] text-slate-400">
                    Elimina zonas del color de la tela para evitar estampas acartonadas.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={knockoutConfig.enabled}
                  onChange={(e) => setKnockoutConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                />
              </div>

              {knockoutConfig.enabled && (
                <div className="space-y-3.5 bg-slate-900/50 p-3.5 rounded-lg border border-slate-800/80">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Color a Calar (Tela)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={knockoutConfig.targetColor}
                        onChange={(e) => setKnockoutConfig((prev) => ({ ...prev, targetColor: e.target.value }))}
                        className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                      />
                      <span className="font-mono text-slate-300 text-xs">{knockoutConfig.targetColor}</span>
                      <button
                        onClick={() => setKnockoutConfig((prev) => ({ ...prev, targetColor: '#000000' }))}
                        className="ml-auto px-2 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                      >
                        Fijar Negro Puro
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 font-medium">Tolerancia de Calado</label>
                      <span className="font-mono text-indigo-400 font-semibold">{knockoutConfig.tolerance}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="80"
                      value={knockoutConfig.tolerance}
                      onChange={(e) =>
                        setKnockoutConfig((prev) => ({ ...prev, tolerance: parseInt(e.target.value, 10) }))
                      }
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 font-medium">Degradado Suave (Feather)</label>
                      <span className="font-mono text-indigo-400 font-semibold">{knockoutConfig.feather}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      value={knockoutConfig.feather}
                      onChange={(e) =>
                        setKnockoutConfig((prev) => ({ ...prev, feather: parseInt(e.target.value, 10) }))
                      }
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BORDES Y CHOKE (SANGRADO NEGATIVO) */}
          {activeTab === 'edges' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <h4 className="font-semibold text-white mb-1">Refinamiento de Bordes DTF</h4>
                <p className="text-[11px] text-slate-400">
                  El "Edge Choke" contrae la base blanca para que no se vea por fuera del color al transferir.
                </p>
              </div>

              <div className="space-y-3.5 bg-slate-900/50 p-3.5 rounded-lg border border-slate-800/80">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-medium">Contracción de Borde (Choke)</label>
                    <span className="font-mono text-indigo-400 font-semibold">{edgeConfig.edgeChokePx} px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="0.5"
                    value={edgeConfig.edgeChokePx}
                    onChange={(e) =>
                      setEdgeConfig((prev) => ({ ...prev, edgeChokePx: parseFloat(e.target.value) }))
                    }
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Recomendado: 1.5px (Evita el desagradable halo blanco de la poliamida)
                  </span>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Quitar Fondo por Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={edgeConfig.chromaKeyColor || '#ffffff'}
                      onChange={(e) => setEdgeConfig((prev) => ({ ...prev, chromaKeyColor: e.target.value }))}
                      className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                    />
                    <button
                      onClick={() => setEdgeConfig((prev) => ({ ...prev, chromaKeyColor: null }))}
                      className="px-2 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
                    >
                      Sin Quitar Fondo
                    </button>
                    <button
                      onClick={() => setEdgeConfig((prev) => ({ ...prev, chromaKeyColor: '#ffffff' }))}
                      className="px-2 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      Blanco
                    </button>
                  </div>
                </div>

                {edgeConfig.chromaKeyColor && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 font-medium">Tolerancia de Fondo</label>
                      <span className="font-mono text-indigo-400 font-semibold">{edgeConfig.chromaTolerance}%</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="70"
                      value={edgeConfig.chromaTolerance}
                      onChange={(e) =>
                        setEdgeConfig((prev) => ({ ...prev, chromaTolerance: parseInt(e.target.value, 10) }))
                      }
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: 300 DPI SUPER RESOLUTION */}
          {activeTab === 'resolution' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <h4 className="font-semibold text-white mb-1">Optimizador 300 DPI (Super-Resolución)</h4>
                <p className="text-[11px] text-slate-400">
                  Re-muestrea mediante interpolación bicúbica y aplica máscara de enfoque para textos y trazos nítidos.
                </p>
              </div>

              <div className="bg-slate-900/50 p-3.5 rounded-lg border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Factor de Escala:</span>
                  <div className="flex items-center gap-1">
                    {[1.5, 2.0, 3.0].map((f) => (
                      <button
                        key={f}
                        onClick={() => setUpscaleFactor(f)}
                        className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors ${
                          upscaleFactor === f
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {f}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Dimensiones Actuales:</span>
                    <span className="font-mono text-slate-200">
                      {pixelWidth} x {pixelHeight} px
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Dimensiones Proyectadas:</span>
                    <span className="font-mono text-indigo-400 font-semibold">
                      {Math.round(pixelWidth * upscaleFactor)} x {Math.round(pixelHeight * upscaleFactor)} px
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Nuevo DPI estimado:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {Math.round(calculatedDpi * upscaleFactor)} DPI
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleUpscaleSharpen}
                  disabled={isUpscaling}
                  className="w-full py-2.5 rounded-lg font-semibold text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {isUpscaling ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Procesando Super-Resolución...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      Ampliar y Enfocar a 300 DPI
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: AI ADVISOR */}
          {activeTab === 'ai' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h4 className="font-semibold text-white">Asistente Técnico IA</h4>
                </div>
                <p className="text-[11px] text-slate-400">
                  Audita el archivo contra los parámetros reales de planchado, tinta blanca y fijación.
                </p>
              </div>

              <button
                onClick={handleAnalyzeWithAI}
                disabled={isAnalyzingAI}
                className="w-full py-2.5 rounded-lg font-semibold text-xs bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                {isAnalyzingAI ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Analizando con Gemini AI...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    Auditar Archivo con IA
                  </>
                )}
              </button>

              {aiAnalysis && (
                <div className="space-y-3 bg-slate-900/70 p-3.5 rounded-lg border border-indigo-500/30">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block mb-1">
                      Diagnóstico de Producción
                    </span>
                    <p className="text-slate-300 text-xs leading-relaxed">{aiAnalysis.summary}</p>
                  </div>

                  {/* Press Settings Card */}
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-2">
                      Receta de Termoestampado
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400">Temperatura:</span>
                        <p className="font-mono font-bold text-slate-200">{aiAnalysis.pressSettings.temperature}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Tiempo:</span>
                        <p className="font-mono font-bold text-slate-200">{aiAnalysis.pressSettings.time}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Presión:</span>
                        <p className="font-mono font-bold text-slate-200">{aiAnalysis.pressSettings.pressure}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Pelado (Peel):</span>
                        <p className="font-mono font-bold text-slate-200">{aiAnalysis.pressSettings.peel}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Consejo de Adhesivo / Poliamida:
                    </span>
                    <p className="text-slate-300 text-[11px]">{aiAnalysis.powderAdhesionAdvice}</p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Recomendaciones del Taller:
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
                      {aiAnalysis.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* KEYBOARD SHORTCUTS MODAL */}
      {isShortcutsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 select-none">
          <div className="bg-[#111726] border border-slate-700/80 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-[#0e1422] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
                  <Keyboard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Atajos de Teclado del Editor</h3>
                  <p className="text-xs text-slate-400">Acelera tu flujo de trabajo de preparación y estampado</p>
                </div>
              </div>
              <button
                onClick={() => setIsShortcutsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Category 1: Posicionamiento en Prenda */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Shirt className="w-3.5 h-3.5" />
                  Posicionamiento en Prenda & Regla
                </h4>
                <div className="grid grid-cols-1 gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Ajuste fino vertical (subir / bajar 0.5 cm)</span>
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[11px] shadow-xs">↑</kbd>
                      <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[11px] shadow-xs">↓</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Ajuste fino lateral (izquierda / derecha 0.5 cm)</span>
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[11px] shadow-xs">←</kbd>
                      <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[11px] shadow-xs">→</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Paso rápido de 1.0 cm</span>
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[11px] shadow-xs">Shift</kbd>
                      <span className="text-slate-500">+</span>
                      <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[11px] shadow-xs">Flechas</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Centrar estampa en el eje láser (0 cm)</span>
                    <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[11px] shadow-xs">C</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Alternar vista Frente / Espalda</span>
                    <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[11px] shadow-xs">F</kbd>
                  </div>
                </div>
              </div>

              {/* Category 2: Historial & Acciones */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Undo2 className="w-3.5 h-3.5" />
                  Historial & Edición
                </h4>
                <div className="grid grid-cols-1 gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Deshacer última acción o movimiento</span>
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[11px] shadow-xs">Ctrl</kbd>
                      <span className="text-slate-500">+</span>
                      <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[11px] shadow-xs">Z</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Rehacer acción deshecha</span>
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[11px] shadow-xs">Ctrl</kbd>
                      <span className="text-slate-500">+</span>
                      <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[11px] shadow-xs">Y</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Eliminar / quitar arte actual del lienzo</span>
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[11px] shadow-xs">Supr / Delete</kbd>
                      <span className="text-slate-500">o</span>
                      <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[11px] shadow-xs">Backspace</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Alternar Guías Láser y Regla métrica</span>
                    <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[11px] shadow-xs">R</kbd>
                  </div>
                </div>
              </div>

              {/* Category 3: Lienzo & Zoom */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5" />
                  Lienzo, Zoom & Ayuda
                </h4>
                <div className="grid grid-cols-1 gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Acercar / Alejar zoom</span>
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[11px] shadow-xs">+</kbd>
                      <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[11px] shadow-xs">-</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Encajar prenda completa a pantalla</span>
                    <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[11px] shadow-xs">0</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Zoom al 100% real</span>
                    <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[11px] shadow-xs">1</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Abrir / cerrar lista de atajos</span>
                    <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[11px] shadow-xs">?</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Cerrar ventanas y modales</span>
                    <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[11px] shadow-xs">Esc</kbd>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-800 bg-[#0e1422] flex justify-between items-center text-[11px] text-slate-400">
              <span>Los atajos se desactivan automáticamente al escribir en campos numéricos o de texto.</span>
              <button
                onClick={() => setIsShortcutsModalOpen(false)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
