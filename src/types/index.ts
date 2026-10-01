export type TechniqueType = 'DTF Textil' | 'DTF UV' | 'Sublimación';

export interface ArtworkFile {
  id: string;
  name: string;
  originalUrl: string;
  currentUrl: string;
  widthPx: number;
  heightPx: number;
  targetWidthCm: number;
  targetHeightCm: number;
  calculatedDpi: number;
  hasTransparency: boolean;
  history: string[];
}

export type HalftoneShape = 'round' | 'ellipse' | 'line' | 'diffusion';

export interface HalftoneConfig {
  enabled: boolean;
  shape: HalftoneShape;
  lpi: number; // Lines per inch: 20 to 65
  angle: number; // 0, 22.5, 45, 75
  garmentColor: string; // Background color to knockout/simulate
  invert: boolean;
  blendWithGarment: boolean;
}

export interface KnockoutConfig {
  enabled: boolean;
  targetColor: string; // '#000000' or custom
  tolerance: number; // 0 to 100
  feather: number; // 0 to 50
  smoothEdges: boolean;
}

export interface EdgeRefineConfig {
  edgeChokePx: number; // Negative bleed / choke 0 to 5
  featherPx: number; // 0 to 5
  chromaKeyColor: string | null;
  chromaTolerance: number;
}

export interface NestingItem {
  id: string;
  artworkId: string;
  name: string;
  imageUrl: string;
  xCm: number;
  yCm: number;
  widthCm: number;
  heightCm: number;
  rotation: number; // 0, 90, 180, 270
  isMirrored: boolean;
  quantity: number;
}

export interface NestingSheet {
  id: string;
  name: string;
  widthCm: number;
  heightCm: number;
  marginCm: number;
  gutterCm: number;
  showCutLines: boolean;
  isMirroredAll: boolean;
  items: NestingItem[];
}

export type OrderStatus = 'Presupuesto' | 'En Diseño' | 'En Cola de Impresión' | 'Estampado' | 'Entregado';

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string;
  technique: TechniqueType;
  itemsDescription: string;
  quantity: number;
  garmentType: string;
  garmentColor: string;
  status: OrderStatus;
  deliveryDate: string;
  totalAmount: number;
  depositAmount: number;
  notes?: string;
  previewUrl?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Film DTF' | 'Tintas' | 'Poliamida' | 'Papel Sublimación' | 'Textiles/Blancos' | 'Insumos Térmicos';
  currentStock: number;
  unit: string; // 'm', 'ml', 'kg', 'hojas', 'unidades', 'rollos'
  minThreshold: number;
  costPerUnit: number;
  notes?: string;
}

export interface PressRecommendation {
  temperature: string;
  time: string;
  pressure: string;
  peel: string;
  substrate: string;
}

export interface AIAnalysisResult {
  summary: string;
  dpiAssessment: string;
  whiteUnderbasePercent: number;
  powderAdhesionAdvice: string;
  pressSettings: PressRecommendation;
  recommendations: string[];
}
