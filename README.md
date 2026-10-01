# SubliDTF Studio Pro 🖨️✨

Suite integral de software basada en Inteligencia Artificial y procesamiento gráfico avanzado en tiempo real para talleres y emprendimientos de **DTF (Direct to Film)** y **Sublimación**.

Permite preparar artes de impresión profesional a 300 DPI, aplicar semitonos (*halftones*) y calado de telas, armar pliegos (*gang sheets*) con auto-nesting, previsualizar en prendas mediante Realidad Aumentada y cámara web, gestionar pedidos con fichas técnicas para termoestampadora y controlar el stock de insumos.

---

## 🚀 Requisitos Previos

- **Node.js**: v18.0.0 o superior (recomendado v20+ o v22+).
- **npm** (v9+) o **bun**.
- Clave de API de **Google Gemini** (opcional, para funciones de diagnóstico inteligente y generación de conceptos con IA).

---

## 🛠️ Instalación y Puesta en Marcha en Local

### 1. Clonar o descargar el repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd sublidtf-studio-pro
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto tomando como base `.env.example`:

```bash
cp .env.example .env
```

Edita `.env` con tus valores:
```env
# Clave de Gemini AI (obtenible en https://aistudio.google.com/)
GEMINI_API_KEY="tu_gemini_api_key_aqui"

# Puerto del servidor (opcional, por defecto 3000)
PORT=3000
```

> **Nota:** La aplicación cuenta con modo de respaldo offline: si no se configura la `GEMINI_API_KEY`, el resto de la suite (procesamiento de imágenes en canvas, semitonos, calado, pliegos, cámara AR, pedidos e inventario) continuará funcionando al 100%.

### 4. Iniciar en modo desarrollo
```bash
npm run dev
```

El servidor iniciará en:
👉 **http://localhost:3000**

---

## 📦 Scripts Disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor fullstack (Express + Vite middleware) con recarga en caliente en el puerto 3000. |
| `npm run build` | Compila y optimiza la aplicación frontend en la carpeta `dist/`. |
| `npm run start` | Inicia el servidor de producción Express sirviendo los archivos estáticos de `dist/`. |
| `npm run lint` | Ejecuta el validador de TypeScript (`tsc --noEmit`) para verificar tipado y sintaxis. |
| `npm run clean` | Elimina las carpetas temporales y builds anteriores (`dist/`). |

---

## 🏗️ Arquitectura del Proyecto

El proyecto está diseñado como una aplicación full-stack moderna:
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Canvas API y WebRTC.
- **Backend**: Express en `server.ts` con integración oficial `@google/genai` (modelo `gemini-3.8-flash`).
- **Modo Servidor**: Durante desarrollo, Express monta los middlewares de Vite; en producción, Express sirve la compilación estática de `dist/`.

### Estructura de Directorios

```
├── .env.example                # Plantilla de variables de entorno
├── index.html                  # HTML base con fuentes Plus Jakarta Sans y JetBrains Mono
├── metadata.json               # Configuración de permisos (cámara) y capacidades del applet
├── package.json                # Dependencias y scripts
├── server.ts                   # Servidor Express y endpoints de IA
├── tsconfig.json               # Configuración de TypeScript
├── vite.config.ts              # Configuración de Vite con Tailwind CSS
│
└── src/
    ├── App.tsx                 # Contenedor principal con barra de navegación superior (3 zonas)
    ├── main.tsx                # Punto de entrada de React
    ├── index.css               # Estilos globales con Tailwind CSS
    │
    ├── assets/
    │   └── images/             # Texturas de mockups fotorrealistas (remera algodón flat lay)
    │
    ├── components/
    │   ├── ArtworkEditor.tsx   # Preparador DTF: semitonos, calado, 300 DPI, borde choke y regla
    │   ├── NestingBuilder.tsx  # Armado de pliegos (Gang Sheet): auto-nesting, rotación, guías de corte
    │   ├── VirtualARPreview.tsx# Realidad Aumentada con cámara web y mockups textiles
    │   ├── OrderManager.tsx    # Gestión de pedidos, fichas técnicas y WhatsApp
    │   ├── InventoryManager.tsx# Stock de insumos, costos por cm² y calculadora de margen
    │   └── AIDesignGenerator.tsx # Generador de ideas y prompts optimizados para estampado
    │
    ├── types/
    │   └── index.ts            # Interfaces TypeScript de toda la aplicación
    │
    └── utils/
        └── imageProcessing.ts  # Algoritmos de píxeles: halftones, choke, knockout, bicubic y DPI
```

---

## 🔧 Guía para Desarrolladores: Cómo Modificar y Extender

### 1. Modificar Parámetros de Semitonos o Calado
En `src/utils/imageProcessing.ts`:
- `applyHalftone()`: Modifica la fórmula de las celdas LPI, la rotación de ángulos o el cálculo de luminancia.
- `applyEdgeChoke()`: Ajusta el algoritmo morfológico de erosión del canal alfa para cambiar el comportamiento del sangrado negativo de la base blanca.
- `applyArtisticKnockout()`: Modifica la distancia euclidiana en RGB y el radio de degradado (*feather*).

### 2. Añadir Nuevos Formatos de Pliego (Nesting)
En `src/components/NestingBuilder.tsx`, localiza la constante `presets`:
```typescript
const presets = [
  { name: 'Rollo DTF 30cm x 100cm', width: 30, height: 100 },
  { name: 'Lámina Personalizada', width: 40, height: 80 }, // <-- Añade nuevos aquí
];
```

### 3. Personalizar la Regla Textil o Medidas de Prenda
En `src/components/ArtworkEditor.tsx`, localiza `GARMENT_CHEST_WIDTH_CM`:
```typescript
const GARMENT_CHEST_WIDTH_CM: Record<'S' | 'M' | 'L' | 'XL' | 'XXL', number> = {
  S: 48,
  M: 52,
  L: 56,
  XL: 60,
  XXL: 64,
};
```
Puedes ajustar los centímetros de pecho para marcas específicas o prendas para niños/damas.

### 4. Modificar Costos Base en la Calculadora de Insumos
En `src/components/InventoryManager.tsx`:
- `costPerCm2`: Ajusta el costo por cm² estimado (por defecto `$0.0042`).
- `blankCost`: Costo unitario de la remera en blanco (por defecto `$5.50`).

### 5. Modificar Endpoints de Inteligencia Artificial
En `server.ts`:
- `/api/ai/analyze-artwork`: Prompt del sistema que audita el archivo gráfico con `gemini-3.8-flash`.
- `/api/ai/design-ideas`: Prompt para generación de estilos y paletas comerciales.

---

## 🚢 Despliegue en Producción

Para desplegar en servicios como Cloud Run, VPS o Railway:

1. Ejecuta la compilación:
   ```bash
   npm run build
   ```
2. Asegúrate de definir las variables `PORT` y `GEMINI_API_KEY`.
3. Inicia la aplicación:
   ```bash
   npm run start
   ```

---

## 📄 Licencia

Este proyecto está bajo licencia Apache-2.0. Consulta los encabezados en los archivos fuente para más información.
