import { HalftoneConfig, KnockoutConfig, EdgeRefineConfig } from '../types';

/**
 * Calculates print DPI based on pixel dimension and target physical cm size
 */
export function calculateDpi(pixels: number, cm: number): number {
  if (cm <= 0) return 300;
  const inches = cm / 2.54;
  return Math.round(pixels / inches);
}

/**
 * Parses Hex color to RGB object
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Loads an image from URL or base64 into an HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Converts a Canvas to a high quality Data URL
 */
export function canvasToDataUrl(canvas: HTMLCanvasElement, mimeType: string = 'image/png'): string {
  return canvas.toDataURL(mimeType, 1.0);
}

/**
 * Auto-detects the background color by sampling perimeter pixels (corners and edges)
 */
export function autoDetectBackgroundColor(sourceCanvas: HTMLCanvasElement): string {
  const ctx = sourceCanvas.getContext('2d');
  if (!ctx) return '#ffffff';
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Sample perimeter pixels (corners + distributed along edges)
  const samplePoints: [number, number][] = [
    [0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1],
    [Math.floor(width / 2), 0], [Math.floor(width / 2), height - 1],
    [0, Math.floor(height / 2)], [width - 1, Math.floor(height / 2)],
    [Math.floor(width * 0.25), 0], [Math.floor(width * 0.75), 0],
    [0, Math.floor(height * 0.25)], [0, Math.floor(height * 0.75)],
  ];

  const colorCounts: Record<string, { count: number; r: number; g: number; b: number }> = {};
  for (const [x, y] of samplePoints) {
    const idx = (y * width + x) * 4;
    if (data[idx + 3] === 0) continue; // transparent
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    // quantize slightly to group similar shades
    const qr = Math.round(r / 8) * 8;
    const qg = Math.round(g / 8) * 8;
    const qb = Math.round(b / 8) * 8;
    const key = `${qr},${qg},${qb}`;
    if (!colorCounts[key]) {
      colorCounts[key] = { count: 0, r, g, b };
    }
    colorCounts[key].count++;
  }

  let maxCount = 0;
  let best = { r: 255, g: 255, b: 255 };
  for (const key in colorCounts) {
    if (colorCounts[key].count > maxCount) {
      maxCount = colorCounts[key].count;
      best = colorCounts[key];
    }
  }

  const toHex = (c: number) => Math.min(255, Math.max(0, c)).toString(16).padStart(2, '0');
  return `#${toHex(best.r)}${toHex(best.g)}${toHex(best.b)}`;
}

/**
 * Removes background using either Contiguous Flood-Fill (protects interior whites/details)
 * or Global Chroma Keying (removes everywhere), with tolerance, feathering, and halo defringing.
 */
export function removeBackgroundAdvanced(
  sourceCanvas: HTMLCanvasElement,
  options: {
    keyColorHex: string;
    tolerance: number; // 0 - 100
    feather?: number; // 0 - 50
    mode: 'contiguous' | 'global';
    deFringe?: boolean; // remove edge color bleeding
  }
): HTMLCanvasElement {
  const { keyColorHex, tolerance, feather = 2, mode = 'contiguous', deFringe = true } = options;
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  const ctx = outputCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const target = hexToRgb(keyColorHex);
  const maxTol = (tolerance / 100) * 441.67;
  const featherRange = (feather / 100) * 150;

  const colorDist = (r: number, g: number, b: number) => {
    return Math.sqrt(
      Math.pow(r - target.r, 2) +
      Math.pow(g - target.g, 2) +
      Math.pow(b - target.b, 2)
    );
  };

  if (mode === 'global') {
    // Global removal across entire canvas
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      const dist = colorDist(data[i], data[i + 1], data[i + 2]);
      if (dist <= maxTol) {
        data[i + 3] = 0;
      } else if (dist < maxTol + featherRange && featherRange > 0) {
        const factor = (dist - maxTol) / featherRange;
        data[i + 3] = Math.round(data[i + 3] * factor);
      }
    }
  } else {
    // Contiguous Flood-Fill starting exclusively from outer borders (protects white eyes/teeth inside logo!)
    const visited = new Uint8Array(width * height);
    const queue: number[] = [];

    // Seed from all 4 borders
    for (let x = 0; x < width; x++) {
      queue.push(x, 0);
      queue.push(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
      queue.push(0, y);
      queue.push(width - 1, y);
    }

    let head = 0;
    while (head < queue.length) {
      const cx = queue[head++];
      const cy = queue[head++];
      const pIdx = cy * width + cx;
      if (visited[pIdx]) continue;
      visited[pIdx] = 1;

      const idx = pIdx * 4;
      if (data[idx + 3] === 0) continue; // already transparent

      const dist = colorDist(data[idx], data[idx + 1], data[idx + 2]);
      if (dist <= maxTol + featherRange) {
        if (dist <= maxTol) {
          data[idx + 3] = 0;
        } else if (featherRange > 0) {
          const factor = (dist - maxTol) / featherRange;
          data[idx + 3] = Math.round(data[idx + 3] * factor);
        }

        // Expand to cardinal neighbors
        if (cx > 0 && !visited[pIdx - 1]) queue.push(cx - 1, cy);
        if (cx < width - 1 && !visited[pIdx + 1]) queue.push(cx + 1, cy);
        if (cy > 0 && !visited[pIdx - width]) queue.push(cx, cy - 1);
        if (cy < height - 1 && !visited[pIdx + width]) queue.push(cx, cy + 1);
      }
    }
  }

  // De-Fringing: cleans color bleed on anti-aliased edge pixels
  if (deFringe) {
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a > 0 && a < 255) {
        const dist = colorDist(data[i], data[i + 1], data[i + 2]);
        if (dist < maxTol * 1.6) {
          data[i + 3] = Math.max(0, Math.round(a * (dist / (maxTol * 1.6))));
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return outputCanvas;
}

/**
 * Removes background color (chroma keying) with tolerance and feathering
 */
export function removeBackgroundColor(
  sourceCanvas: HTMLCanvasElement,
  keyColorHex: string,
  tolerance: number, // 0 - 100
  feather: number = 0 // 0 - 50
): HTMLCanvasElement {
  return removeBackgroundAdvanced(sourceCanvas, {
    keyColorHex,
    tolerance,
    feather,
    mode: 'global',
    deFringe: true,
  });
}

/**
 * Magic Eraser: Localized Flood-Fill from a clicked pixel (startX, startY).
 * Erases trapped background colors inside letters ('O', 'A', 'P', 'R', 'B', etc.)
 * or closed logo shapes without affecting any surrounding artwork.
 */
export function magicEraserFloodFill(
  sourceCanvas: HTMLCanvasElement,
  startX: number,
  startY: number,
  tolerance: number = 22, // 0 - 100
  feather: number = 2
): HTMLCanvasElement {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  if (startX < 0 || startX >= width || startY < 0 || startY >= height) {
    return sourceCanvas;
  }

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  const ctx = outputCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const startIdx = (startY * width + startX) * 4;
  const targetR = data[startIdx];
  const targetG = data[startIdx + 1];
  const targetB = data[startIdx + 2];
  const targetA = data[startIdx + 3];

  if (targetA === 0) {
    // Already 100% transparent, nothing to erase
    return sourceCanvas;
  }

  const maxTol = (tolerance / 100) * 441.67;
  const featherRange = (feather / 100) * 150;

  const colorDist = (r: number, g: number, b: number) => {
    return Math.sqrt(
      Math.pow(r - targetR, 2) +
      Math.pow(g - targetG, 2) +
      Math.pow(b - targetB, 2)
    );
  };

  const visited = new Uint8Array(width * height);
  const queue: number[] = [startX, startY];
  visited[startY * width + startX] = 1;

  let head = 0;
  while (head < queue.length) {
    const cx = queue[head++];
    const cy = queue[head++];
    const pIdx = cy * width + cx;
    const idx = pIdx * 4;

    if (data[idx + 3] === 0) continue;

    const dist = colorDist(data[idx], data[idx + 1], data[idx + 2]);
    if (dist <= maxTol + featherRange) {
      if (dist <= maxTol) {
        data[idx + 3] = 0; // completely transparent
      } else if (featherRange > 0) {
        const factor = (dist - maxTol) / featherRange;
        data[idx + 3] = Math.round(data[idx + 3] * factor);
      }

      // Check 4 cardinal neighbors
      if (cx > 0) {
        const nIdx = cy * width + (cx - 1);
        if (!visited[nIdx]) {
          visited[nIdx] = 1;
          queue.push(cx - 1, cy);
        }
      }
      if (cx < width - 1) {
        const nIdx = cy * width + (cx + 1);
        if (!visited[nIdx]) {
          visited[nIdx] = 1;
          queue.push(cx + 1, cy);
        }
      }
      if (cy > 0) {
        const nIdx = (cy - 1) * width + cx;
        if (!visited[nIdx]) {
          visited[nIdx] = 1;
          queue.push(cx, cy - 1);
        }
      }
      if (cy < height - 1) {
        const nIdx = (cy + 1) * width + cx;
        if (!visited[nIdx]) {
          visited[nIdx] = 1;
          queue.push(cx, cy + 1);
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return outputCanvas;
}

/**
 * Erases all enclosed holes and trapped background islands inside letters
 * and shapes matching the target color (e.g. white or light backgrounds)
 */
export function eraseAllEnclosedHoles(
  sourceCanvas: HTMLCanvasElement,
  targetColorHex: string,
  tolerance: number = 22,
  feather: number = 2
): HTMLCanvasElement {
  return removeBackgroundAdvanced(sourceCanvas, {
    keyColorHex: targetColorHex,
    tolerance,
    feather,
    mode: 'global',
    deFringe: true,
  });
}

/**
 * Morphological alpha erosion (Edge Choke / Sangrado negativo para DTF)
 * Prevents white underbase from leaking out from the design borders.
 */
export function applyEdgeChoke(
  sourceCanvas: HTMLCanvasElement,
  chokePx: number
): HTMLCanvasElement {
  if (chokePx <= 0) return sourceCanvas;

  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  const ctx = outputCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);
  const srcData = ctx.getImageData(0, 0, width, height);
  const src = srcData.data;

  const dstData = ctx.createImageData(width, height);
  const dst = dstData.data;

  // Copy RGB colors
  for (let i = 0; i < src.length; i++) {
    dst[i] = src[i];
  }

  const radius = Math.min(Math.round(chokePx), 5);

  // Erode alpha channel
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (src[idx + 3] === 0) {
        dst[idx + 3] = 0;
        continue;
      }

      let minAlpha = src[idx + 3];

      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) {
          minAlpha = 0;
          break;
        }
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy > radius * radius) continue;
          const nx = x + dx;
          if (nx < 0 || nx >= width) {
            minAlpha = 0;
            break;
          }
          const neighborAlpha = src[(ny * width + nx) * 4 + 3];
          if (neighborAlpha < minAlpha) {
            minAlpha = neighborAlpha;
          }
        }
        if (minAlpha === 0) break;
      }

      dst[idx + 3] = minAlpha;
    }
  }

  ctx.putImageData(dstData, 0, 0);
  return outputCanvas;
}

/**
 * Color Knockout (Calado artístico de negro o color de prenda)
 * Removes or reduces density of garment color to yield breathable, soft print
 * and save white ink & polyamide adhesive powder!
 */
export function applyArtisticKnockout(
  sourceCanvas: HTMLCanvasElement,
  config: KnockoutConfig
): HTMLCanvasElement {
  if (!config.enabled) return sourceCanvas;

  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  const ctx = outputCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const target = hexToRgb(config.targetColor);
  const maxTol = (config.tolerance / 100) * 441.67;
  const featherRange = (config.feather / 100) * 180;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const dist = Math.sqrt(
      Math.pow(r - target.r, 2) +
      Math.pow(g - target.g, 2) +
      Math.pow(b - target.b, 2)
    );

    if (dist <= maxTol) {
      data[i + 3] = 0; // Completely knocked out
    } else if (dist < maxTol + featherRange && featherRange > 0) {
      // Smooth gradient transition
      const factor = (dist - maxTol) / featherRange;
      data[i + 3] = Math.round(data[i + 3] * factor);
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return outputCanvas;
}

/**
 * High-grade Halftoning (Tramas de Semitonos para DTF & Serigrafía)
 * Transforms gradients into dot screens, ellipses, lines or diffusion.
 */
export function applyHalftone(
  sourceCanvas: HTMLCanvasElement,
  config: HalftoneConfig
): HTMLCanvasElement {
  if (!config.enabled) return sourceCanvas;

  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  const ctx = outputCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  // Read source pixel luminance
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return sourceCanvas;
  tempCtx.drawImage(sourceCanvas, 0, 0);
  const srcData = tempCtx.getImageData(0, 0, width, height).data;

  // Floyd-Steinberg Error Diffusion mode
  if (config.shape === 'diffusion') {
    const grayBuffer = new Float32Array(width * height);
    const alphaBuffer = new Uint8Array(width * height);

    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      alphaBuffer[i] = srcData[idx + 3];
      // Luminance
      const lum = 0.299 * srcData[idx] + 0.587 * srcData[idx + 1] + 0.114 * srcData[idx + 2];
      grayBuffer[i] = config.invert ? 255 - lum : lum;
    }

    const outData = ctx.createImageData(width, height);
    const out = outData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const oldVal = grayBuffer[i];
        const newVal = oldVal < 128 ? 0 : 255;
        const err = oldVal - newVal;

        const idx = i * 4;
        if (alphaBuffer[i] > 10) {
          if (newVal === 0) {
            // Ink dot
            out[idx] = srcData[idx];
            out[idx + 1] = srcData[idx + 1];
            out[idx + 2] = srcData[idx + 2];
            out[idx + 3] = alphaBuffer[i];
          } else {
            // Gap / Fabric reveal
            if (config.blendWithGarment) {
              out[idx + 3] = 0; // Transparent hole!
            } else {
              out[idx] = 255;
              out[idx + 1] = 255;
              out[idx + 2] = 255;
              out[idx + 3] = alphaBuffer[i];
            }
          }
        }

        // Diffuse error
        if (x + 1 < width) grayBuffer[i + 1] += (err * 7) / 16;
        if (x - 1 >= 0 && y + 1 < height) grayBuffer[i + width - 1] += (err * 3) / 16;
        if (y + 1 < height) grayBuffer[i + width] += (err * 5) / 16;
        if (x + 1 < width && y + 1 < height) grayBuffer[i + width + 1] += (err * 1) / 16;
      }
    }

    ctx.putImageData(outData, 0, 0);
    return outputCanvas;
  }

  // Grid Cell based Halftones (Round, Ellipse, Line)
  // Step size calculated based on LPI and image resolution
  // Typical screen cell size between 4px and 24px
  const baseStep = Math.max(3, Math.round(width / (config.lpi * 3)));
  const angleRad = (config.angle * Math.PI) / 180;
  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);

  ctx.clearRect(0, 0, width, height);

  // We sample along rotated grid
  const diag = Math.sqrt(width * width + height * height);
  const startX = -diag;
  const endX = diag * 2;
  const startY = -diag;
  const endY = diag * 2;

  for (let gy = startY; gy <= endY; gy += baseStep) {
    for (let gx = startX; gx <= endX; gx += baseStep) {
      // Map rotated coordinates back to image pixel space
      const px = Math.round(gx * cosA - gy * sinA);
      const py = Math.round(gx * sinA + gy * cosA);

      if (px < 0 || px >= width || py < 0 || py >= height) continue;

      const idx = (py * width + px) * 4;
      const alpha = srcData[idx + 3];
      if (alpha < 15) continue; // Transparent

      const r = srcData[idx];
      const g = srcData[idx + 1];
      const b = srcData[idx + 2];
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const darkness = config.invert ? lum : 1.0 - lum;

      if (darkness <= 0.05) continue;

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha / 255})`;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angleRad);

      const maxRadius = (baseStep / 2) * 1.35;
      const dotRadius = maxRadius * Math.sqrt(darkness);

      ctx.beginPath();
      if (config.shape === 'round') {
        ctx.arc(0, 0, dotRadius, 0, Math.PI * 2);
      } else if (config.shape === 'ellipse') {
        ctx.ellipse(0, 0, dotRadius * 1.3, dotRadius * 0.7, 0, 0, Math.PI * 2);
      } else if (config.shape === 'line') {
        const lineThickness = baseStep * darkness;
        ctx.rect(-baseStep / 2, -lineThickness / 2, baseStep, lineThickness);
      }
      ctx.fill();
      ctx.restore();
    }
  }

  return outputCanvas;
}

/**
 * Super-Resolution & Unsharp Mask Sharpening
 * Scales image with bicubic smoothing and sharpens edge contrast for crisp 300 DPI
 */
export function upscaleAndSharpen(
  sourceCanvas: HTMLCanvasElement,
  scaleFactor: number = 2.0,
  sharpenAmount: number = 0.4
): HTMLCanvasElement {
  const newWidth = Math.round(sourceCanvas.width * scaleFactor);
  const newHeight = Math.round(sourceCanvas.height * scaleFactor);

  const outCanvas = document.createElement('canvas');
  outCanvas.width = newWidth;
  outCanvas.height = newHeight;
  const ctx = outCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, 0, 0, newWidth, newHeight);

  if (sharpenAmount <= 0) return outCanvas;

  // Unsharp mask 3x3 convolution kernel
  const imgData = ctx.getImageData(0, 0, newWidth, newHeight);
  const src = imgData.data;
  const dstData = ctx.createImageData(newWidth, newHeight);
  const dst = dstData.data;

  const a = sharpenAmount;
  const centerWeight = 1 + 4 * a;

  for (let y = 1; y < newHeight - 1; y++) {
    for (let x = 1; x < newWidth - 1; x++) {
      const idx = (y * newWidth + x) * 4;

      for (let c = 0; c < 3; c++) {
        const top = src[((y - 1) * newWidth + x) * 4 + c];
        const bottom = src[((y + 1) * newWidth + x) * 4 + c];
        const left = src[(y * newWidth + (x - 1)) * 4 + c];
        const right = src[(y * newWidth + (x + 1)) * 4 + c];
        const center = src[idx + c];

        const val = center * centerWeight - (top + bottom + left + right) * a;
        dst[idx + c] = Math.max(0, Math.min(255, Math.round(val)));
      }
      // Preserve alpha
      dst[idx + 3] = src[idx + 3];
    }
  }

  ctx.putImageData(dstData, 0, 0);
  return outCanvas;
}

/**
 * Creates 3 default high quality demo graphic assets in transparent PNG format
 * so users can immediately test all DTF & Sublimation tools out of the box.
 */
export function createDefaultDemoArtworks(): Array<{
  id: string;
  name: string;
  url: string;
  widthPx: number;
  heightPx: number;
  targetWidthCm: number;
  targetHeightCm: number;
  dpi: number;
}> {
  // Demo 1: Cyber Streetwear Skull (Ideal for DTF & black garment knockout)
  const canvas1 = document.createElement('canvas');
  canvas1.width = 1200;
  canvas1.height = 1200;
  const ctx1 = canvas1.getContext('2d')!;

  // Dark badge background
  const grad1 = ctx1.createLinearGradient(200, 200, 1000, 1000);
  grad1.addColorStop(0, '#f59e0b');
  grad1.addColorStop(0.5, '#ef4444');
  grad1.addColorStop(1, '#8b5cf6');

  ctx1.fillStyle = grad1;
  ctx1.beginPath();
  ctx1.arc(600, 600, 480, 0, Math.PI * 2);
  ctx1.fill();

  // Geometric skull cutouts in dark/black
  ctx1.fillStyle = '#0f172a';
  ctx1.beginPath();
  // Skull crown
  ctx1.arc(600, 520, 260, Math.PI, 0);
  ctx1.lineTo(760, 680);
  ctx1.lineTo(700, 780);
  ctx1.lineTo(500, 780);
  ctx1.lineTo(440, 680);
  ctx1.closePath();
  ctx1.fill();

  // Eye sockets
  ctx1.fillStyle = '#ffffff';
  ctx1.beginPath();
  ctx1.ellipse(510, 520, 55, 75, -0.2, 0, Math.PI * 2);
  ctx1.ellipse(690, 520, 55, 75, 0.2, 0, Math.PI * 2);
  ctx1.fill();

  // Pupils
  ctx1.fillStyle = '#ef4444';
  ctx1.beginPath();
  ctx1.arc(510, 520, 24, 0, Math.PI * 2);
  ctx1.arc(690, 520, 24, 0, Math.PI * 2);
  ctx1.fill();

  // Teeth grill
  ctx1.fillStyle = '#ffffff';
  for (let t = 0; t < 6; t++) {
    ctx1.fillRect(520 + t * 28, 720, 20, 40);
  }

  // Streetwear Typography banner
  ctx1.fillStyle = '#ffffff';
  ctx1.font = '900 68px "Plus Jakarta Sans", sans-serif';
  ctx1.textAlign = 'center';
  ctx1.fillText('TOKYO APPAREL', 600, 240);
  ctx1.font = '700 38px "Plus Jakarta Sans", sans-serif';
  ctx1.fillText('DTF PREMIUM PRINT · 2026', 600, 990);

  // Demo 2: Vibrant Tropical Flamingo Sunset (Superb for Sublimation)
  const canvas2 = document.createElement('canvas');
  canvas2.width = 1200;
  canvas2.height = 1200;
  const ctx2 = canvas2.getContext('2d')!;

  const grad2 = ctx2.createLinearGradient(0, 200, 0, 1000);
  grad2.addColorStop(0, '#ec4899');
  grad2.addColorStop(0.3, '#f97316');
  grad2.addColorStop(0.7, '#eab308');
  grad2.addColorStop(1, '#06b6d4');

  ctx2.fillStyle = grad2;
  ctx2.beginPath();
  ctx2.arc(600, 600, 460, 0, Math.PI * 2);
  ctx2.fill();

  // Tropical palm silhouettes
  ctx2.fillStyle = '#090d16';
  ctx2.beginPath();
  ctx2.ellipse(600, 960, 460, 160, 0, 0, Math.PI);
  ctx2.fill();

  // Sun stripes
  ctx2.strokeStyle = '#ffffff';
  ctx2.lineWidth = 14;
  for (let s = 0; s < 5; s++) {
    ctx2.beginPath();
    ctx2.moveTo(220, 560 + s * 45);
    ctx2.lineTo(980, 560 + s * 45);
    ctx2.stroke();
  }

  // Script text
  ctx2.fillStyle = '#ffffff';
  ctx2.font = '800 74px "Plus Jakarta Sans", sans-serif';
  ctx2.textAlign = 'center';
  ctx2.fillText('TROPICAL VIBES', 600, 480);

  // Demo 3: Vintage Craft Garage Emblem
  const canvas3 = document.createElement('canvas');
  canvas3.width = 1000;
  canvas3.height = 1000;
  const ctx3 = canvas3.getContext('2d')!;

  ctx3.strokeStyle = '#38bdf8';
  ctx3.lineWidth = 18;
  ctx3.beginPath();
  ctx3.arc(500, 500, 420, 0, Math.PI * 2);
  ctx3.stroke();

  ctx3.fillStyle = '#0369a1';
  ctx3.beginPath();
  ctx3.arc(500, 500, 390, 0, Math.PI * 2);
  ctx3.fill();

  ctx3.fillStyle = '#ffffff';
  ctx3.font = '900 80px "Plus Jakarta Sans", sans-serif';
  ctx3.textAlign = 'center';
  ctx3.fillText('CUSTOM SPEED', 500, 460);
  ctx3.font = '600 42px "Plus Jakarta Sans", sans-serif';
  ctx3.fillText('WORKSHOP & GARAGE', 500, 530);
  ctx3.font = '700 32px "Plus Jakarta Sans", sans-serif';
  ctx3.fillText('★ 100% COTTON COMPATIBLE ★', 500, 600);

  return [
    {
      id: 'demo-skull',
      name: 'Streetwear_Skull_DTF.png',
      url: canvas1.toDataURL('image/png'),
      widthPx: 1200,
      heightPx: 1200,
      targetWidthCm: 28,
      targetHeightCm: 28,
      dpi: 109,
    },
    {
      id: 'demo-tropical',
      name: 'Tropical_Sunset_Subli.png',
      url: canvas2.toDataURL('image/png'),
      widthPx: 1200,
      heightPx: 1200,
      targetWidthCm: 20,
      targetHeightCm: 20,
      dpi: 152,
    },
    {
      id: 'demo-garage',
      name: 'Vintage_Motors_Badge.png',
      url: canvas3.toDataURL('image/png'),
      widthPx: 1000,
      heightPx: 1000,
      targetWidthCm: 15,
      targetHeightCm: 15,
      dpi: 169,
    },
  ];
}

/**
 * Color Adjustment parameters for Sublimation & DTF vibrancy
 */
export interface ColorAdjustmentConfig {
  brightness: number; // -50 to 50
  contrast: number; // -50 to 50
  saturation: number; // -50 to 100
  warmth: number; // -30 to 30
}

/**
 * Applies color grading, brightness, contrast, saturation, and warmth adjustments
 */
export function applyColorAdjustments(
  sourceCanvas: HTMLCanvasElement,
  config: ColorAdjustmentConfig
): HTMLCanvasElement {
  const { brightness, contrast, saturation, warmth } = config;
  if (brightness === 0 && contrast === 0 && saturation === 0 && warmth === 0) {
    return sourceCanvas;
  }

  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  const ctx = outputCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const c = Math.max(-255, Math.min(255, contrast * 2.55));
  const contrastFactor = (259 * (c + 255)) / (255 * (259 - c));
  const bOffset = brightness * 1.5;
  const satFactor = 1 + (saturation / 100);

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue; // transparent pixel

    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 1. Brightness
    if (bOffset !== 0) {
      r += bOffset;
      g += bOffset;
      b += bOffset;
    }

    // 2. Contrast
    if (contrast !== 0) {
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }

    // 3. Warmth
    if (warmth !== 0) {
      r += warmth * 0.8;
      b -= warmth * 0.8;
    }

    // 4. Saturation
    if (saturation !== 0) {
      const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
      r = gray + (r - gray) * satFactor;
      g = gray + (g - gray) * satFactor;
      b = gray + (b - gray) * satFactor;
    }

    data[i] = Math.max(0, Math.min(255, Math.round(r)));
    data[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
    data[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
  }

  ctx.putImageData(imgData, 0, 0);
  return outputCanvas;
}

/**
 * Flips canvas horizontally (mirror for sublimation) or vertically
 */
export function flipCanvas(
  sourceCanvas: HTMLCanvasElement,
  horizontal: boolean,
  vertical: boolean
): HTMLCanvasElement {
  if (!horizontal && !vertical) return sourceCanvas;
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = sourceCanvas.width;
  outputCanvas.height = sourceCanvas.height;
  const ctx = outputCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  ctx.save();
  ctx.translate(
    horizontal ? sourceCanvas.width : 0,
    vertical ? sourceCanvas.height : 0
  );
  ctx.scale(horizontal ? -1 : 1, vertical ? -1 : 1);
  ctx.drawImage(sourceCanvas, 0, 0);
  ctx.restore();
  return outputCanvas;
}

/**
 * Inverts colors of canvas preserving alpha transparency
 */
export function invertCanvasColors(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = sourceCanvas.width;
  outputCanvas.height = sourceCanvas.height;
  const ctx = outputCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return outputCanvas;
}

/**
 * Converts canvas to grayscale (Black & White) preserving alpha transparency
 */
export function grayscaleCanvas(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = sourceCanvas.width;
  outputCanvas.height = sourceCanvas.height;
  const ctx = outputCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return outputCanvas;
}

/**
 * Rotates canvas by 90, 180, or 270 degrees
 */
export function rotateCanvas(
  sourceCanvas: HTMLCanvasElement,
  degrees: 90 | 180 | 270
): HTMLCanvasElement {
  const outputCanvas = document.createElement('canvas');
  const isPerpendicular = degrees === 90 || degrees === 270;
  outputCanvas.width = isPerpendicular ? sourceCanvas.height : sourceCanvas.width;
  outputCanvas.height = isPerpendicular ? sourceCanvas.width : sourceCanvas.height;
  const ctx = outputCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  ctx.save();
  ctx.translate(outputCanvas.width / 2, outputCanvas.height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(sourceCanvas, -sourceCanvas.width / 2, -sourceCanvas.height / 2);
  ctx.restore();
  return outputCanvas;
}

/**
 * Automatically crops out all outer transparent borders,
 * returning the tight bounding box of the active graphic.
 */
export function autoTrimCanvas(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = sourceCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 5) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!found || (minX === 0 && minY === 0 && maxX === width - 1 && maxY === height - 1)) {
    return sourceCanvas;
  }

  // Add 4px padding so we don't clip anti-aliased edge
  minX = Math.max(0, minX - 4);
  minY = Math.max(0, minY - 4);
  maxX = Math.min(width - 1, maxX + 4);
  maxY = Math.min(height - 1, maxY + 4);

  const trimW = maxX - minX + 1;
  const trimH = maxY - minY + 1;

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = trimW;
  outputCanvas.height = trimH;
  const outCtx = outputCanvas.getContext('2d');
  if (!outCtx) return sourceCanvas;

  outCtx.drawImage(sourceCanvas, minX, minY, trimW, trimH, 0, 0, trimW, trimH);
  return outputCanvas;
}

/**
 * Custom Text Overlay configuration
 */
export interface TextOverlayConfig {
  text: string;
  fontFamily: string;
  fontSize: number; // e.g. 48
  color: string; // e.g. '#ffffff'
  strokeColor: string; // e.g. '#000000'
  strokeWidth: number; // 0 to 12
  shadow: boolean;
  positionYPercent: number; // 10% to 90%
}

/**
 * Renders custom text with stroke, shadow, and position on top of the image
 */
export function renderTextToCanvas(
  sourceCanvas: HTMLCanvasElement,
  config: TextOverlayConfig
): HTMLCanvasElement {
  if (!config.text.trim()) return sourceCanvas;

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = sourceCanvas.width;
  outputCanvas.height = sourceCanvas.height;
  const ctx = outputCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);

  const posX = sourceCanvas.width / 2;
  const posY = (config.positionYPercent / 100) * sourceCanvas.height;

  const responsiveFontSize = Math.round(config.fontSize * (sourceCanvas.width / 800));

  ctx.save();
  ctx.font = `bold ${responsiveFontSize}px "${config.fontFamily}", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (config.shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 4;
  }

  // Draw stroke / border first
  if (config.strokeWidth > 0) {
    ctx.strokeStyle = config.strokeColor;
    ctx.lineWidth = config.strokeWidth * (sourceCanvas.width / 800);
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.strokeText(config.text, posX, posY);
  }

  // Draw fill
  ctx.fillStyle = config.color;
  ctx.fillText(config.text, posX, posY);
  ctx.restore();

  return outputCanvas;
}

/**
 * Sublimation Product Preset with standard dimensions and thermal transfer recipe
 */
export interface SublimationProductPreset {
  id: string;
  name: string;
  category: 'Tazas' | 'Textiles' | 'Accesorios' | 'Hogar';
  widthCm: number;
  heightCm: number;
  tempC: number;
  timeSec: number;
  pressure: string;
  mustMirror: boolean;
  description: string;
}

export const SUBLIMATION_PRESETS: SublimationProductPreset[] = [
  {
    id: 'mug_standard',
    name: 'Taza 11oz (Franja Completa)',
    category: 'Tazas',
    widthCm: 20.0,
    heightCm: 9.0,
    tempC: 185,
    timeSec: 180,
    pressure: 'Media',
    mustMirror: true,
    description: 'Franja panorámica estándar para taza recta de 11 oz.',
  },
  {
    id: 'mug_conic',
    name: 'Taza Cónica / Mágica',
    category: 'Tazas',
    widthCm: 21.0,
    heightCm: 9.5,
    tempC: 185,
    timeSec: 190,
    pressure: 'Media',
    mustMirror: true,
    description: 'Para tazas cónicas de 12 oz o tazas mágicas termosensibles.',
  },
  {
    id: 'chopp_beer',
    name: 'Chopp Cerámico / Vidrio',
    category: 'Tazas',
    widthCm: 21.5,
    heightCm: 11.5,
    tempC: 180,
    timeSec: 200,
    pressure: 'Media',
    mustMirror: true,
    description: 'Chopp cerámico o esmerilado de 500cc.',
  },
  {
    id: 'tshirt_a4',
    name: 'Remera Frente A4',
    category: 'Textiles',
    widthCm: 21.0,
    heightCm: 29.7,
    tempC: 195,
    timeSec: 45,
    pressure: 'Fuerte',
    mustMirror: true,
    description: 'Estampado A4 en remera poliéster o spun blanco.',
  },
  {
    id: 'tshirt_a3',
    name: 'Remera Frente A3',
    category: 'Textiles',
    widthCm: 29.7,
    heightCm: 42.0,
    tempC: 195,
    timeSec: 50,
    pressure: 'Fuerte',
    mustMirror: true,
    description: 'Estampado amplio A3 en remera o buzo poliéster.',
  },
  {
    id: 'tshirt_pocket',
    name: 'Escudo / Bolsillo Pecho',
    category: 'Textiles',
    widthCm: 9.0,
    heightCm: 9.0,
    tempC: 195,
    timeSec: 40,
    pressure: 'Fuerte',
    mustMirror: true,
    description: 'Logo de pecho izquierdo / escudo 9 x 9 cm.',
  },
  {
    id: 'cap_trucker',
    name: 'Gorra Trucker Frente',
    category: 'Accesorios',
    widthCm: 12.0,
    heightCm: 6.5,
    tempC: 190,
    timeSec: 40,
    pressure: 'Media',
    mustMirror: true,
    description: 'Frente de gorra trucker con prensa para gorras.',
  },
  {
    id: 'mousepad_rect',
    name: 'Mousepad Rectangular',
    category: 'Accesorios',
    widthCm: 22.0,
    heightCm: 18.0,
    tempC: 190,
    timeSec: 45,
    pressure: 'Media',
    mustMirror: true,
    description: 'Mousepad de neoprene con base de goma.',
  },
  {
    id: 'bottle_sports',
    name: 'Botella / Termo Deportivo',
    category: 'Accesorios',
    widthCm: 22.0,
    heightCm: 13.5,
    tempC: 180,
    timeSec: 75,
    pressure: 'Media',
    mustMirror: true,
    description: 'Botella de aluminio o termo sublimable de 600ml / 750ml.',
  },
  {
    id: 'cushion_pillow',
    name: 'Almohadón Cuadrado',
    category: 'Hogar',
    widthCm: 38.0,
    heightCm: 38.0,
    tempC: 195,
    timeSec: 50,
    pressure: 'Media-Fuerte',
    mustMirror: true,
    description: 'Funda de almohadón de tropical mecánico o microfibra.',
  },
  {
    id: 'keychain_tag',
    name: 'Llavero / Destapador Polímero',
    category: 'Hogar',
    widthCm: 5.5,
    heightCm: 5.5,
    tempC: 185,
    timeSec: 60,
    pressure: 'Media',
    mustMirror: true,
    description: 'Llavero de polímero o MDF sublimable.',
  },
];
