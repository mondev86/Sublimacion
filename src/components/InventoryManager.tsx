import React, { useState, useEffect } from 'react';
import {
  Package,
  AlertTriangle,
  Plus,
  Minus,
  DollarSign,
  TrendingDown,
  RefreshCw,
  Droplet,
  Layers,
  Calculator,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import { InventoryItem } from '../types';

const INITIAL_INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: 'inv-1',
    name: 'Bobina Rollo DTF Premium 30cm x 100m (Cold Peel)',
    category: 'Film DTF',
    currentStock: 48,
    unit: 'm',
    minThreshold: 20,
    costPerUnit: 1.8,
    notes: 'Película tratada antiestática doble cara para secado rápido.',
  },
  {
    id: 'inv-2',
    name: 'Bobina Rollo DTF Industrial 60cm x 100m',
    category: 'Film DTF',
    currentStock: 12,
    unit: 'm',
    minThreshold: 15,
    costPerUnit: 3.4,
    notes: 'Para pliegos anchos en plotter doble cabezal.',
  },
  {
    id: 'inv-3',
    name: 'Tinta DTF Textil Blanca (White Ink Pigment)',
    category: 'Tintas',
    currentStock: 350,
    unit: 'ml',
    minThreshold: 500, // Low stock warning!
    costPerUnit: 0.08,
    notes: 'Requiere recirculación diaria en el damper para evitar sedimentación.',
  },
  {
    id: 'inv-4',
    name: 'Tinta DTF Textil CMYK (Pack x 4 colores)',
    category: 'Tintas',
    currentStock: 1200,
    unit: 'ml',
    minThreshold: 400,
    costPerUnit: 0.05,
    notes: 'Colores de alta densidad cromática base agua.',
  },
  {
    id: 'inv-5',
    name: 'Polvo Poliamida Termofusible Blanco Medio (Adhesivo)',
    category: 'Poliamida',
    currentStock: 3.5,
    unit: 'kg',
    minThreshold: 2.0,
    costPerUnit: 24.0,
    notes: 'Granulometría 80-200 micrones, tacto suave elástico.',
  },
  {
    id: 'inv-6',
    name: 'Papel de Sublimación Premium Secado Rápido A3 (100 gr)',
    category: 'Papel Sublimación',
    currentStock: 180,
    unit: 'hojas',
    minThreshold: 50,
    costPerUnit: 0.25,
    notes: 'Transferencia de color al 98% en poliéster.',
  },
  {
    id: 'inv-7',
    name: 'Tazas de Cerámica Importada AAA Sublimable 11oz',
    category: 'Textiles/Blancos',
    currentStock: 8,
    unit: 'unidades',
    minThreshold: 24, // Low stock!
    costPerUnit: 1.4,
    notes: 'Acabado ultra brillante apto microondas.',
  },
  {
    id: 'inv-8',
    name: 'Remeras Algodón Peinado 24/1 Negras (Lote S-M-L-XL)',
    category: 'Textiles/Blancos',
    currentStock: 42,
    unit: 'unidades',
    minThreshold: 20,
    costPerUnit: 5.5,
    notes: 'Tejido jersey 100% algodón ideal DTF.',
  },
  {
    id: 'inv-9',
    name: 'Cinta Térmica para Alta Temperatura (Poliamida Kapton)',
    category: 'Insumos Térmicos',
    currentStock: 6,
    unit: 'rollos',
    minThreshold: 3,
    costPerUnit: 2.0,
    notes: 'Soporta hasta 260°C sin dejar residuos de pegamento.',
  },
];

export const InventoryManager: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('sublidtf_inventory');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading inventory from localStorage', e);
    }
    return INITIAL_INVENTORY_ITEMS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('sublidtf_inventory', JSON.stringify(items));
    } catch (e) {
      console.warn('Error saving inventory to localStorage', e);
    }
  }, [items]);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState<boolean>(false);

  // Cost calculator interactive state
  const [calcWidthCm, setCalcWidthCm] = useState<number>(28);
  const [calcHeightCm, setCalcHeightCm] = useState<number>(30);
  const [calcQuantity, setCalcQuantity] = useState<number>(20);
  const [calcMarginPercent, setCalcMarginPercent] = useState<number>(150); // 150% profit margin

  // Quick Stock adjustments
  const adjustStock = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const newStock = Math.max(0, Math.round((it.currentStock + delta) * 10) / 10);
        return { ...it, currentStock: newStock };
      })
    );
  };

  // Cost Calculator Math
  // Cost per cm² in DTF is approximately $0.0035 to $0.0055 USD (Film + White Ink + CMYK + Powder)
  const singleAreaCm2 = calcWidthCm * calcHeightCm;
  const costPerCm2 = 0.0042;
  const printCostPerUnit = Math.round(singleAreaCm2 * costPerCm2 * 100) / 100;
  const blankCost = 5.5; // Average blank cotton t-shirt
  const totalUnitCost = Math.round((printCostPerUnit + blankCost) * 100) / 100;
  const unitSalePrice = Math.round(totalUnitCost * (1 + calcMarginPercent / 100) * 100) / 100;
  const totalBatchCost = Math.round(totalUnitCost * calcQuantity * 100) / 100;
  const totalBatchSale = Math.round(unitSalePrice * calcQuantity * 100) / 100;
  const batchNetProfit = Math.round((totalBatchSale - totalBatchCost) * 100) / 100;

  const filteredItems = items.filter((it) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'low_stock') return it.currentStock <= it.minThreshold;
    return it.category === activeCategory;
  });

  const lowStockCount = items.filter((it) => it.currentStock <= it.minThreshold).length;

  return (
    <div className="flex flex-col xl:flex-row h-full w-full p-4 gap-4 text-slate-200">
      {/* LEFT: Inventory Management Table & Categories */}
      <div className="flex-1 flex flex-col bg-[#111726] rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
        {/* Top Filter Bar */}
        <div className="h-14 border-b border-slate-800 px-4 flex items-center justify-between bg-[#0e1422] shrink-0">
          <div className="flex items-center gap-3">
            <Package className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Control de Insumos & Materias Primas
            </span>
            {lowStockCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/60 border border-amber-800 text-amber-300 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {lowStockCount} por agotarse
              </span>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'low_stock', label: 'Bajo Stock' },
              { id: 'Film DTF', label: 'Film DTF' },
              { id: 'Tintas', label: 'Tintas' },
              { id: 'Poliamida', label: 'Poliamida' },
              { id: 'Textiles/Blancos', label: 'Blancos' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory Items List */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0e1422] text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Insumo</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Stock Actual</th>
                <th className="py-3 px-4">Costo Unitario</th>
                <th className="py-3 px-4">Valor Total</th>
                <th className="py-3 px-4 text-center">Ajuste Rápido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredItems.map((item) => {
                const isLow = item.currentStock <= item.minThreshold;
                const totalValue = Math.round(item.currentStock * item.costPerUnit * 100) / 100;
                return (
                  <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                    {/* Item Name */}
                    <td className="py-3 px-4 max-w-sm">
                      <span className="font-bold text-white block text-sm">{item.name}</span>
                      <p className="text-slate-400 text-[11px] truncate">{item.notes}</p>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {item.category}
                      </span>
                    </td>

                    {/* Current Stock */}
                    <td className="py-3 px-4 font-mono tabular-nums">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold text-sm ${
                            isLow ? 'text-amber-400' : 'text-slate-200'
                          }`}
                        >
                          {item.currentStock} {item.unit}
                        </span>
                        {isLow && (
                          <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" />
                            Mín: {item.minThreshold}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Cost per unit */}
                    <td className="py-3 px-4 font-mono text-slate-300 tabular-nums">
                      ${item.costPerUnit.toFixed(2)} / {item.unit}
                    </td>

                    {/* Total Stock Value */}
                    <td className="py-3 px-4 font-mono font-bold text-white tabular-nums">
                      ${totalValue.toLocaleString()}
                    </td>

                    {/* Quick increment/decrement */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => adjustStock(item.id, -1)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="Restar 1 unidad consumida"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => adjustStock(item.id, 1)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="Sumar 1 unidad recibida"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => adjustStock(item.id, 10)}
                          className="px-1.5 py-0.5 text-[10px] rounded bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 font-mono"
                          title="Sumar +10 unidades"
                        >
                          +10
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT: Production Cost & Profit Margin Calculator */}
      <div className="w-full xl:w-80 flex flex-col bg-[#111726] rounded-xl border border-slate-800 overflow-hidden shadow-2xl shrink-0">
        <div className="p-4 border-b border-slate-800 bg-[#0e1422]">
          <div className="flex items-center gap-2 mb-1">
            <Calculator className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Calculadora de Costos & Margen
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Calcula el costo real de impresión DTF por cm² y simula tus ganancias de taller.
          </p>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          {/* Print Dimensions */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 block mb-1">Ancho Estampa (cm)</label>
              <input
                type="number"
                value={calcWidthCm}
                onChange={(e) => setCalcWidthCm(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Alto Estampa (cm)</label>
              <input
                type="number"
                value={calcHeightCm}
                onChange={(e) => setCalcHeightCm(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Batch quantity */}
          <div>
            <label className="text-slate-400 block mb-1">Cantidad de Prendas en Pedido</label>
            <input
              type="number"
              min="1"
              value={calcQuantity}
              onChange={(e) => setCalcQuantity(parseInt(e.target.value, 10) || 1)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Profit Margin Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-300 font-medium">Margen de Ganancia (%)</label>
              <span className="font-mono text-indigo-400 font-bold">{calcMarginPercent}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="300"
              step="10"
              value={calcMarginPercent}
              onChange={(e) => setCalcMarginPercent(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>Mayorista (60%)</span>
              <span>Estándar (150%)</span>
              <span>Minorista (250%)</span>
            </div>
          </div>

          {/* Breakdown Summary Card */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5 text-[11px]">
            <div className="flex justify-between text-slate-400">
              <span>Superficie por estampa:</span>
              <span className="font-mono text-slate-200">{singleAreaCm2} cm²</span>
            </div>

            <div className="flex justify-between text-slate-400">
              <span>Costo estampa DTF (Insumos):</span>
              <span className="font-mono text-amber-400 font-bold">${printCostPerUnit}</span>
            </div>

            <div className="flex justify-between text-slate-400">
              <span>Costo Prenda (Remera Algodón):</span>
              <span className="font-mono text-slate-200">${blankCost.toFixed(2)}</span>
            </div>

            <div className="h-px bg-slate-800 my-1" />

            <div className="flex justify-between text-slate-300 font-semibold">
              <span>Costo Unitario Total:</span>
              <span className="font-mono text-white">${totalUnitCost}</span>
            </div>

            <div className="flex justify-between text-indigo-400 font-bold text-xs">
              <span>Precio Sugerido Venta:</span>
              <span className="font-mono">${unitSalePrice}</span>
            </div>

            <div className="h-px bg-slate-800 my-1" />

            {/* Batch Totals */}
            <div className="bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-800/50 space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Inversión Total Lote:</span>
                <span className="font-mono font-semibold">${totalBatchCost}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Facturación Total:</span>
                <span className="font-mono font-semibold text-white">${totalBatchSale}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold text-xs pt-1 border-t border-emerald-800/30">
                <span>Ganancia Neta Taller:</span>
                <span className="font-mono text-sm">+${batchNetProfit}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
