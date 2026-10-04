/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Wand2,
  ClipboardList,
  Package,
  Plus,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
  Shirt
} from 'lucide-react';
import { ArtworkEditor } from './components/ArtworkEditor';
import { NestingBuilder } from './components/NestingBuilder';
import { VirtualARPreview } from './components/VirtualARPreview';
import { OrderManager } from './components/OrderManager';
import { InventoryManager } from './components/InventoryManager';
import { AIDesignGenerator } from './components/AIDesignGenerator';

type ActiveView = 'editor' | 'nesting' | 'ar_preview' | 'orders' | 'inventory';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('editor');
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState<boolean>(false);

  // Cross-tool shared artwork bridge
  const [nestingArtworkBridge, setNestingArtworkBridge] = useState<{
    name: string;
    url: string;
    widthCm: number;
    heightCm: number;
  } | null>(null);

  const [arDesignUrlBridge, setArDesignUrlBridge] = useState<string | null>(null);

  // Send from Editor directly to Gang Sheet
  const handleSendToNesting = (artwork: {
    name: string;
    url: string;
    widthCm: number;
    heightCm: number;
  }) => {
    setNestingArtworkBridge(artwork);
    setActiveView('nesting');
  };

  // Open in AR from Editor
  const handleOpenAR = (url: string) => {
    setArDesignUrlBridge(url);
    setActiveView('ar_preview');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#090d16] text-slate-100 font-sans">
      {/* COLLAPSIBLE TOP NAVIGATION BAR */}
      {!isNavCollapsed ? (
        <header className="h-16 px-6 border-b border-slate-800 bg-[#0e1422] flex items-center justify-between shrink-0 select-none transition-all duration-200">
          {/* Zone 1: Single element Brand wordmark */}
          <div className="flex items-center gap-3">
            <span
              className="text-lg font-extrabold tracking-tight text-white cursor-pointer hover:text-indigo-400 transition-colors"
              onClick={() => setActiveView('editor')}
            >
              SubliDTF Studio
            </span>
            <span className="text-[11px] font-mono text-indigo-400 font-semibold hidden md:inline">
              Suite DTF & Sublimación
            </span>
          </div>

          {/* Zone 2: 4-5 single-line clean navigation tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveView('editor')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeView === 'editor'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Preparador DTF
            </button>
            <button
              onClick={() => setActiveView('nesting')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeView === 'nesting'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Pliegos (Nesting)
            </button>
            <button
              onClick={() => setActiveView('ar_preview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeView === 'ar_preview'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Mockups de Estudio
            </button>
            <button
              onClick={() => setActiveView('orders')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeView === 'orders'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Pedidos
            </button>
            <button
              onClick={() => setActiveView('inventory')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeView === 'inventory'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Insumos
            </button>
          </nav>

          {/* Zone 3: 1-2 Primary Actions + Collapse Trigger */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Ideas con IA</span>
            </button>

            {/* Collapse Button */}
            <button
              onClick={() => setIsNavCollapsed(true)}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs"
              title="Ocultar barra superior para maximizar el área de trabajo y lienzo de la remera"
            >
              <ChevronUp className="w-4 h-4" />
              <span className="hidden lg:inline text-[11px] font-medium">Ocultar Barra</span>
            </button>
          </div>
        </header>
      ) : (
        /* COLLAPSED COMPACT FLOATING STRIP */
        <div className="h-9 px-4 border-b border-slate-800/90 bg-[#0c1220]/95 backdrop-blur-md flex items-center justify-between shrink-0 z-30 select-none">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsNavCollapsed(false)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-300 hover:text-white text-[11px] font-semibold transition-all shadow-sm"
              title="Expandir barra superior"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Expandir Menú</span>
            </button>
            <span className="text-xs font-bold text-white pl-1 hidden sm:inline">SubliDTF Studio</span>
          </div>

          {/* Quick Mini Tabs in collapsed state */}
          <div className="flex items-center gap-1">
            {[
              { id: 'editor', label: 'Preparador DTF' },
              { id: 'nesting', label: 'Pliegos' },
              { id: 'ar_preview', label: 'AR' },
              { id: 'orders', label: 'Pedidos' },
              { id: 'inventory', label: 'Insumos' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as ActiveView)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  activeView === tab.id
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="p-1 rounded text-amber-300 hover:text-amber-200"
              title="Ideas con IA"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* MAIN VIEWPORT - Keep views mounted to preserve undo history, canvas state, and zoom across tab switches */}
      <main className="flex-1 overflow-hidden relative w-full h-full">
        <div className={`w-full h-full ${activeView === 'editor' ? 'flex flex-col' : 'hidden'}`}>
          <ArtworkEditor
            onSendToNesting={handleSendToNesting}
            onOpenAR={handleOpenAR}
          />
        </div>

        <div className={`w-full h-full ${activeView === 'nesting' ? 'flex flex-col' : 'hidden'}`}>
          <NestingBuilder initialArtwork={nestingArtworkBridge} />
        </div>

        <div className={`w-full h-full ${activeView === 'ar_preview' ? 'flex flex-col' : 'hidden'}`}>
          <VirtualARPreview initialDesignUrl={arDesignUrlBridge || undefined} />
        </div>

        <div className={`w-full h-full ${activeView === 'orders' ? 'flex flex-col' : 'hidden'}`}>
          <OrderManager />
        </div>

        <div className={`w-full h-full ${activeView === 'inventory' ? 'flex flex-col' : 'hidden'}`}>
          <InventoryManager />
        </div>
      </main>

      {/* AI DESIGN GENERATOR MODAL */}
      <AIDesignGenerator
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </div>
  );
}
