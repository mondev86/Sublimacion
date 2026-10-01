import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  Copy,
  Check,
  Palette,
  Lightbulb,
  Shirt,
  RefreshCw,
  Send
} from 'lucide-react';

interface AIDesignGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt?: (prompt: string) => void;
}

export const AIDesignGenerator: React.FC<AIDesignGeneratorProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
}) => {
  const [concept, setConcept] = useState<string>('Calavera urbana neo-tradicional con rosas y tipografía vintage');
  const [niche, setNiche] = useState<string>('Streetwear / Moda Urbana');
  const [style, setStyle] = useState<string>('Ilustración vectorial alto contraste, contornos limpios sin fondo');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [ideas, setIdeas] = useState<Array<{
    title: string;
    palette: string[];
    promptSuggestion: string;
    recommendedTechnique: string;
    salesTip?: string;
  }>>([
    {
      title: 'Neon Tokyo Tiger Streetwear',
      palette: ['#0f172a', '#f97316', '#06b6d4', '#ffffff'],
      promptSuggestion: 'High contrast ferocious Japanese tiger head with cherry blossoms and kanji typography, cyber neon streetwear aesthetic, sharp clean vector outlines, transparent background, print ready 300 dpi',
      recommendedTechnique: 'DTF Textil en prenda negra',
      salesTip: 'Ideal para remeras oversize negras con calado de sombras para tacto liviano.',
    },
    {
      title: 'Retro Wave Sunset Surf',
      palette: ['#ec4899', '#eab308', '#0284c7', '#f8fafc'],
      promptSuggestion: '80s synthwave sunset with palm tree silhouettes and geometric grid waves, vibrant neon gradient splash, clean isolated transparency, high fidelity sublimation graphic',
      recommendedTechnique: 'Sublimación en remeras poliéster o tazas',
      salesTip: 'Aprovecha la gama de colores vibrantes sin límite de tintas en sublimación.',
    },
    {
      title: 'Craft Beer Vintage Brewery Emblem',
      palette: ['#1e293b', '#d97706', '#f59e0b', '#f1f5f9'],
      promptSuggestion: 'Vintage circular craft brewery badge with hops, wheat stalks and bold retro serif lettering, distressed linocut engraving texture, isolated transparent background, DTF ready',
      recommendedTechnique: 'DTF Textil o DTF UV en vasos pinta',
      salesTip: 'Excelente producto corporativo para cervecerías y bares artesanales.',
    },
  ]);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/design-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept, niche, style }),
      });
      const data = await res.json();
      if (data.ideas && data.ideas.length > 0) {
        setIdeas(data.ideas);
      }
    } catch (err) {
      console.error('Error fetching design ideas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#111726] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 bg-[#0e1422] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-sm">
              Generador de Ideas de Estampas & Prompts con IA
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-semibold"
          >
            Cerrar
          </button>
        </div>

        {/* Input Parameters */}
        <div className="p-4 bg-slate-900/50 border-b border-slate-800 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Nicho / Rubro</label>
              <select
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Streetwear / Moda Urbana">Streetwear / Moda Urbana</option>
                <option value="Bandas de Música / Rock">Bandas de Música / Rock</option>
                <option value="Gimnasio & Fitness">Gimnasio & Fitness</option>
                <option value="Cervecerías & Gastronomía">Cervecerías & Gastronomía</option>
                <option value="Gaming & Anime">Gaming & Anime</option>
                <option value="Eventos & Egresados">Eventos & Egresados</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Estilo Gráfico</label>
              <input
                type="text"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Idea o Concepto del Cliente</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Ej. Logo de león geométrico para remera deportiva..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 shrink-0"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                Generar Ideas
              </button>
            </div>
          </div>
        </div>

        {/* Ideas List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {ideas.map((idea, idx) => (
            <div
              key={idx}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2.5 text-xs hover:border-indigo-500/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white text-sm">{idea.title}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950/70 border border-indigo-800 text-indigo-300">
                    {idea.recommendedTechnique}
                  </span>
                </div>

                {/* Color Palette Swatches */}
                <div className="flex items-center gap-1">
                  {idea.palette.map((c, i) => (
                    <span
                      key={i}
                      style={{ backgroundColor: c }}
                      className="w-4 h-4 rounded-full border border-slate-700"
                      title={c}
                    />
                  ))}
                </div>
              </div>

              {/* Prompt Box */}
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed relative group">
                <p>{idea.promptSuggestion}</p>
                <button
                  onClick={() => copyToClipboard(idea.promptSuggestion, idx)}
                  className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Copiar prompt"
                >
                  {copiedIndex === idx ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {idea.salesTip && (
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] italic">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Tip de Taller: {idea.salesTip}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
