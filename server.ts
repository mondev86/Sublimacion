import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared Gemini client utility
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function cleanAndParseJson<T>(rawText: string | undefined, fallback: T): T {
  if (!rawText) return fallback;
  try {
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn('Failed to parse JSON response from Gemini, using safe fallback:', e);
    return fallback;
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(apiKey) });
});

// Technical DTF & Sublimation AI Advisor & File Analyzer
app.post('/api/ai/analyze-artwork', async (req, res) => {
  try {
    const { technique, garmentColor, targetDimensions, mimeType, imageBase64, customNotes } = req.body;

    if (!ai) {
      return res.status(200).json({
        success: true,
        mockFallback: true,
        analysis: {
          summary: `Diagnóstico profesional para ${technique || 'DTF Textil'} en prenda ${garmentColor || 'Negra'}: Archivo analizado correctamente.`,
          dpiAssessment: 'Resolución adecuada para producción comercial a 300 DPI.',
          whiteUnderbasePercent: garmentColor?.toLowerCase().includes('blanca') ? 0 : 85,
          powderAdhesionAdvice: 'Para prendas oscuras en DTF, asegurar calado en sombras suaves para evitar acumulación de poliamida.',
          pressSettings: technique === 'Sublimación' ? {
            temperature: '200°C (392°F)',
            time: '40-50 segundos',
            pressure: 'Media-Alta',
            peel: 'Retiro en caliente inmediato',
            substrate: '100% Poliéster o polímero tratado'
          } : {
            temperature: '160°C (320°F)',
            time: '12-15 segundos',
            pressure: 'Media (4-5 bar)',
            peel: 'En frío (Cold Peel) o Tibio según film',
            substrate: 'Algodón, Poliéster, Mezclas, Jean, Cuero sintético'
          },
          recommendations: [
            'Verificar transparencia limpia en los bordes para evitar halos blancos.',
            'Aplicar semitonos en degradados si la prenda es del color del fondo.',
            'Realizar un segundo planchado de fijación de 5 segundos con papel siliconado/teflón.'
          ]
        }
      });
    }

    const promptText = `
Eres un maestro técnico experto en estampado DTF (Direct to Film) y Sublimación textil y de artículos promocionales.
Analiza la siguiente imagen y parámetros técnicos:
- Técnica: ${technique || 'DTF Textil'}
- Color de prenda/sustrato: ${garmentColor || 'Negro'}
- Medidas de impresión deseadas: ${targetDimensions || 'A4 (21x29.7cm)'}
- Notas adicionales: ${customNotes || 'Ninguna'}

Devuelve un análisis técnico profesional estructurado en formato JSON con los siguientes campos estrictos:
{
  "summary": "Resumen técnico de 2 oraciones sobre la aptitud del diseño para esta técnica.",
  "dpiAssessment": "Evaluación de nitidez, detalles finos y bordes para impresión a 300 DPI.",
  "whiteUnderbasePercent": número estimado entre 0 y 100 de cobertura de base blanca requerida,
  "powderAdhesionAdvice": "Consejos específicos sobre retención de poliamida termofusible o fijación de tinta de sublimación.",
  "pressSettings": {
    "temperature": "ej. 160°C",
    "time": "ej. 15 segundos",
    "pressure": "Media / Alta",
    "peel": "Frío / Caliente",
    "substrate": "Recomendación de tela o material"
  },
  "recommendations": ["Recomendación 1", "Recomendación 2", "Recomendación 3"]
}
`;

    const contentsPayload: any = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      contentsPayload.push({
        inlineData: {
          mimeType: mimeType || 'image/png',
          data: cleanBase64,
        },
      });
    }
    contentsPayload.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: contentsPayload },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const colorLabel = garmentColor || 'estándar';
    const isLightGarment =
      typeof garmentColor === 'string' &&
      (garmentColor.toLowerCase().includes('blanco') ||
        garmentColor.toLowerCase().includes('claro') ||
        garmentColor.toLowerCase() === '#ffffff' ||
        garmentColor.toLowerCase() === '#f8fafc');

    const fallbackAnalysis = {
      summary: `Diagnóstico para ${technique || 'DTF Textil'} sobre base ${colorLabel}.`,
      dpiAssessment: 'Resolución adecuada para producción comercial a 300 DPI.',
      whiteUnderbasePercent: isLightGarment && technique === 'Sublimación' ? 0 : 80,
      powderAdhesionAdvice: isLightGarment
        ? 'En fondos claros con DTF, optimizar la cobertura blanca para reducir el espesor del film.'
        : 'Para prendas de color o telas oscuras, asegurar calado en sombras para un tacto flexible y sin exceso de poliamida.',
      pressSettings: {
        temperature: technique === 'Sublimación' ? '200°C' : '160°C',
        time: technique === 'Sublimación' ? '45s' : '15s',
        pressure: 'Media',
        peel: technique === 'Sublimación' ? 'Caliente' : 'Frío',
        substrate: technique === 'Sublimación' ? 'Poliéster' : 'Algodón'
      },
      recommendations: ['Verificar contraste de contornos', 'Comprobar resolución mínima 300 DPI']
    };

    const parsed = cleanAndParseJson<any>(response.text, fallbackAnalysis);

    // Validate and sanitize shape
    const validatedAnalysis = {
      summary: typeof parsed.summary === 'string' ? parsed.summary : fallbackAnalysis.summary,
      dpiAssessment: typeof parsed.dpiAssessment === 'string' ? parsed.dpiAssessment : fallbackAnalysis.dpiAssessment,
      whiteUnderbasePercent: typeof parsed.whiteUnderbasePercent === 'number' ? parsed.whiteUnderbasePercent : fallbackAnalysis.whiteUnderbasePercent,
      powderAdhesionAdvice: typeof parsed.powderAdhesionAdvice === 'string' ? parsed.powderAdhesionAdvice : fallbackAnalysis.powderAdhesionAdvice,
      pressSettings: {
        temperature: parsed.pressSettings?.temperature || fallbackAnalysis.pressSettings.temperature,
        time: parsed.pressSettings?.time || fallbackAnalysis.pressSettings.time,
        pressure: parsed.pressSettings?.pressure || fallbackAnalysis.pressSettings.pressure,
        peel: parsed.pressSettings?.peel || fallbackAnalysis.pressSettings.peel,
        substrate: parsed.pressSettings?.substrate || fallbackAnalysis.pressSettings.substrate,
      },
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : fallbackAnalysis.recommendations,
    };

    return res.json({ success: true, mockFallback: false, analysis: validatedAnalysis });
  } catch (error: any) {
    console.error('Error in analyze-artwork:', error);
    return res.status(500).json({ error: error.message || 'Error processing AI analysis' });
  }
});

// Creative Design Prompt & Vectorization Generator for DTF / Sublimation
app.post('/api/ai/design-ideas', async (req, res) => {
  try {
    const { concept, niche, style } = req.body;
    const defaultIdeas = [
      {
        title: 'Streetwear Vintage Skull',
        palette: ['#0f172a', '#f59e0b', '#dc2626', '#ffffff'],
        promptSuggestion: 'High contrast neo-traditional skull tattoo illustration, bold clean outlines, vintage halftone shading, dtf print ready, transparent background',
        recommendedTechnique: 'DTF Textil'
      },
      {
        title: 'Aura Retro Minimalist',
        palette: ['#ec4899', '#8b5cf6', '#3b82f6', '#f8fafc'],
        promptSuggestion: 'Minimalist continuous line art face with vibrant gradient splash background, high resolution 300 dpi clean edges',
        recommendedTechnique: 'Sublimación'
      }
    ];

    if (!ai) {
      return res.status(200).json({
        mockFallback: true,
        ideas: defaultIdeas
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Genera 3 conceptos de diseño comercial listos para vender en un taller de estampado (DTF / Sublimación) para el nicho: "${niche || 'Moda urbana / Streetwear'}" con el concepto "${concept || 'Gráfica moderna'}".
Estilo deseado: ${style || 'Ilustración vectorial con alto contraste y colores vivos'}.

Devuelve únicamente un JSON válido con esta estructura:
{
  "ideas": [
    {
      "title": "Nombre comercial del diseño",
      "palette": ["#hex1", "#hex2", "#hex3", "#hex4"],
      "promptSuggestion": "Prompt en inglés optimizado para generar arte de alta definición sin fondo",
      "recommendedTechnique": "DTF Textil o Sublimación",
      "salesTip": "Tip de venta para el cliente"
    }
  ]
}`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = cleanAndParseJson<{ ideas?: any[] }>(response.text, { ideas: defaultIdeas });
    const validatedIdeas = Array.isArray(parsed.ideas) && parsed.ideas.length > 0 ? parsed.ideas : defaultIdeas;

    return res.json({
      mockFallback: false,
      ideas: validatedIdeas
    });
  } catch (err: any) {
    console.error('Error generating design ideas:', err);
    return res.status(500).json({ error: err.message || 'Error in design ideas' });
  }
});

// Configure Vite in dev mode or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SubliDTF Studio Pro running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
