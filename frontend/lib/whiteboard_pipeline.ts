// Browser-only pipeline: uses DOM, Canvas, and MediaPipe.
export type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ReconstructionOptions = {
  scale?: number;
  personDilate?: number;
  adaptiveBlockSize?: number;
  adaptiveC?: number;
  autoCropWhiteboard?: boolean;
  whiteboardThreshold?: number;
  minWhiteboardArea?: number;
  expectPerson?: boolean;
  minPersonAreaRatio?: number;
  modelSelection?: 0 | 1;
  locateFile?: (file: string) => string;
};

export type ReconstructionResult = {
  width: number;
  height: number;
  background: ImageData;
  canvas: ImageData;
  ink: ImageData;
  crop?: CropRect;
};

type SegmentationResult = {
  segmentationMask: CanvasImageSource;
};

const DEFAULTS: Required<ReconstructionOptions> = {
  scale: 1,
  personDilate: 8,
  adaptiveBlockSize: 31,
  adaptiveC: 5,
  autoCropWhiteboard: true,
  whiteboardThreshold: 200,
  minWhiteboardArea: 10000,
  expectPerson: true,
  minPersonAreaRatio: 0.003,
  modelSelection: 1,
  locateFile: (file: string) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
};

let selfiePromise: Promise<any> | null = null;

async function getSelfieSegmentation(
  options: Required<ReconstructionOptions>
): Promise<any> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("whiteboard_pipeline requires a browser environment");
  }

  if (!selfiePromise) {
    selfiePromise = import("@mediapipe/selfie_segmentation").then((mod: any) => {
      const SelfieSegmentation =
        mod.SelfieSegmentation || mod.default?.SelfieSegmentation;
      if (!SelfieSegmentation) {
        throw new Error("SelfieSegmentation export not found");
      }
      const selfie = new SelfieSegmentation({ locateFile: options.locateFile });
      selfie.setOptions({ modelSelection: options.modelSelection });
      return selfie;
    });
  }

  return selfiePromise;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function luma(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ensureOdd(value: number, fallback: number): number {
  const v = Math.max(3, Math.floor(value || fallback));
  return v % 2 === 0 ? v + 1 : v;
}

function countMaskPixels(mask: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i]) sum++;
  }
  return sum;
}

function dilateBinary(
  mask: Uint8Array,
  width: number,
  height: number,
  radius: number
): Uint8Array {
  if (radius <= 0) return mask;
  const out = new Uint8Array(mask.length);
  const r = Math.max(1, radius | 0);

  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - r);
    const y1 = Math.min(height - 1, y + r);
    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(width - 1, x + r);
      let hit = 0;

      for (let yy = y0; yy <= y1 && !hit; yy++) {
        let idx = yy * width + x0;
        for (let xx = x0; xx <= x1; xx++, idx++) {
          if (mask[idx]) {
            hit = 1;
            break;
          }
        }
      }
      out[y * width + x] = hit ? 255 : 0;
    }
  }

  return out;
}

function erodeBinary(
  mask: Uint8Array,
  width: number,
  height: number,
  radius: number
): Uint8Array {
  if (radius <= 0) return mask;
  const out = new Uint8Array(mask.length);
  const r = Math.max(1, radius | 0);

  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - r);
    const y1 = Math.min(height - 1, y + r);
    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(width - 1, x + r);
      let ok = 1;

      for (let yy = y0; yy <= y1 && ok; yy++) {
        let idx = yy * width + x0;
        for (let xx = x0; xx <= x1; xx++, idx++) {
          if (!mask[idx]) {
            ok = 0;
            break;
          }
        }
      }
      out[y * width + x] = ok ? 255 : 0;
    }
  }

  return out;
}

function morphOpen(
  mask: Uint8Array,
  width: number,
  height: number,
  radius: number
): Uint8Array {
  return dilateBinary(erodeBinary(mask, width, height, radius), width, height, radius);
}

function morphClose(
  mask: Uint8Array,
  width: number,
  height: number,
  radius: number
): Uint8Array {
  return erodeBinary(dilateBinary(mask, width, height, radius), width, height, radius);
}

async function segmentPersonMask(
  img: HTMLImageElement,
  crop: CropRect,
  width: number,
  height: number,
  options: Required<ReconstructionOptions>
): Promise<Uint8Array> {
  const selfie = await getSelfieSegmentation(options);

  let pendingResolve: ((res: SegmentationResult) => void) | null = null;
  selfie.onResults((res: SegmentationResult) => {
    if (!pendingResolve) return;
    const r = pendingResolve;
    pendingResolve = null;
    r(res);
  });

  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = width;
  srcCanvas.height = height;
  const srcCtx = srcCanvas.getContext("2d", { willReadFrequently: true });
  if (!srcCtx) {
    throw new Error("Canvas 2D context unavailable");
  }
  srcCtx.drawImage(
    img,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    width,
    height
  );

  const res = await new Promise<SegmentationResult>((resolve) => {
    pendingResolve = resolve;
    selfie.send({ image: srcCanvas });
  });

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
  if (!maskCtx) {
    throw new Error("Canvas 2D context unavailable");
  }
  maskCtx.drawImage(res.segmentationMask, 0, 0, width, height);

  const md = maskCtx.getImageData(0, 0, width, height).data;
  const mask = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < md.length; i += 4, p++) {
    mask[p] = md[i] > 128 ? 255 : 0;
  }

  return mask;
}

function detectWhiteboardBBox(
  img: HTMLImageElement,
  options: Required<ReconstructionOptions>
): CropRect | null {
  const maxDetectWidth = 320;
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;

  const scale = Math.min(1, maxDetectWidth / srcW);
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));

  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return null;
  }
  ctx.drawImage(img, 0, 0, w, h);

  const data = ctx.getImageData(0, 0, w, h).data;
  const mask = new Uint8Array(w * h);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const L = luma(data[i], data[i + 1], data[i + 2]);
    mask[p] = L >= options.whiteboardThreshold ? 255 : 0;
  }

  const closed = morphClose(mask, w, h, 2);
  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);

  let bestArea = 0;
  let bestX0 = 0;
  let bestY0 = 0;
  let bestX1 = 0;
  let bestY1 = 0;

  for (let p = 0; p < closed.length; p++) {
    if (!closed[p] || visited[p]) continue;
    let qh = 0;
    let qt = 0;
    queue[qt++] = p;
    visited[p] = 1;

    let area = 0;
    let x0 = w;
    let y0 = h;
    let x1 = 0;
    let y1 = 0;

    while (qh < qt) {
      const idx = queue[qh++];
      area++;
      const y = (idx / w) | 0;
      const x = idx - y * w;

      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;

      const yStart = Math.max(0, y - 1);
      const yEnd = Math.min(h - 1, y + 1);
      const xStart = Math.max(0, x - 1);
      const xEnd = Math.min(w - 1, x + 1);

      for (let yy = yStart; yy <= yEnd; yy++) {
        const row = yy * w;
        for (let xx = xStart; xx <= xEnd; xx++) {
          const ni = row + xx;
          if (!closed[ni] || visited[ni]) continue;
          visited[ni] = 1;
          queue[qt++] = ni;
        }
      }
    }

    if (area > bestArea) {
      bestArea = area;
      bestX0 = x0;
      bestY0 = y0;
      bestX1 = x1;
      bestY1 = y1;
    }
  }

  const minAreaScaled = options.minWhiteboardArea * scale * scale;
  if (bestArea < minAreaScaled) {
    return null;
  }

  const scaleX = srcW / w;
  const scaleY = srcH / h;

  const x = clampInt(bestX0 * scaleX, 0, srcW - 1);
  const y = clampInt(bestY0 * scaleY, 0, srcH - 1);
  const width = clampInt((bestX1 - bestX0 + 1) * scaleX, 1, srcW - x);
  const height = clampInt((bestY1 - bestY0 + 1) * scaleY, 1, srcH - y);

  return { x, y, width, height };
}

function medianFromSamples(samples: Uint8Array, count: number): number {
  for (let i = 1; i < count; i++) {
    const key = samples[i];
    let j = i - 1;
    while (j >= 0 && samples[j] > key) {
      samples[j + 1] = samples[j];
      j--;
    }
    samples[j + 1] = key;
  }
  if (count === 0) return 255;
  const mid = count >> 1;
  if (count % 2) return samples[mid];
  return (samples[mid - 1] + samples[mid]) >> 1;
}

function adaptiveThresholdMeanInv(
  gray: Uint8Array,
  width: number,
  height: number,
  blockSize: number,
  C: number
): Uint8Array {
  const half = Math.floor(blockSize / 2);
  const integral = new Uint32Array((width + 1) * (height + 1));

  for (let y = 1; y <= height; y++) {
    let rowSum = 0;
    for (let x = 1; x <= width; x++) {
      const p = (y - 1) * width + (x - 1);
      rowSum += gray[p];
      const idx = y * (width + 1) + x;
      integral[idx] = integral[idx - (width + 1)] + rowSum;
    }
  }

  const out = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - half);
    const y1 = Math.min(height - 1, y + half);
    const ay0 = y0;
    const ay1 = y1 + 1;

    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - half);
      const x1 = Math.min(width - 1, x + half);
      const ax0 = x0;
      const ax1 = x1 + 1;

      const sum =
        integral[ay1 * (width + 1) + ax1] -
        integral[ay0 * (width + 1) + ax1] -
        integral[ay1 * (width + 1) + ax0] +
        integral[ay0 * (width + 1) + ax0];

      const area = (x1 - x0 + 1) * (y1 - y0 + 1);
      const mean = sum / area;
      const p = y * width + x;
      out[p] = gray[p] < mean - C ? 255 : 0;
    }
  }

  return out;
}

function boxBlurGrid(
  grid: Float32Array,
  gw: number,
  gh: number,
  iters: number
): void {
  const tmp = new Float32Array(grid.length);
  for (let t = 0; t < iters; t++) {
    tmp.set(grid);
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        let r = 0;
        let g = 0;
        let b = 0;
        let c = 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx;
            const yy = y + dy;
            if (xx < 0 || xx >= gw || yy < 0 || yy >= gh) continue;
            const j = (yy * gw + xx) * 3;
            r += tmp[j];
            g += tmp[j + 1];
            b += tmp[j + 2];
            c++;
          }
        }

        const i = (y * gw + x) * 3;
        grid[i] = r / c;
        grid[i + 1] = g / c;
        grid[i + 2] = b / c;
      }
    }
  }
}

function buildSmoothBackgroundFromBgRGB(
  bgR: Uint8Array,
  bgG: Uint8Array,
  bgB: Uint8Array,
  validBg: Uint8Array,
  width: number,
  height: number
): { bgSmoothR: Uint8Array; bgSmoothG: Uint8Array; bgSmoothB: Uint8Array } {
  const gw = 80;
  const gh = Math.max(30, Math.round((gw * height) / width));

  const sum = new Float32Array(gw * gh * 3);
  const cnt = new Uint32Array(gw * gh);

  let gr = 0;
  let gg = 0;
  let gb = 0;
  let gc = 0;

  for (let y = 0; y < height; y++) {
    const yy = Math.floor((y * gh) / height);
    for (let x = 0; x < width; x++) {
      const xx = Math.floor((x * gw) / width);
      const p = y * width + x;
      if (!validBg[p]) continue;

      const cell = yy * gw + xx;
      const i = cell * 3;
      sum[i] += bgR[p];
      sum[i + 1] += bgG[p];
      sum[i + 2] += bgB[p];
      cnt[cell]++;

      gr += bgR[p];
      gg += bgG[p];
      gb += bgB[p];
      gc++;
    }
  }

  if (gc === 0) {
    gr = gg = gb = 245;
    gc = 1;
  }
  gr /= gc;
  gg /= gc;
  gb /= gc;

  const grid = new Float32Array(gw * gh * 3);
  for (let cell = 0; cell < gw * gh; cell++) {
    const i = cell * 3;
    if (cnt[cell] > 0) {
      grid[i] = sum[i] / cnt[cell];
      grid[i + 1] = sum[i + 1] / cnt[cell];
      grid[i + 2] = sum[i + 2] / cnt[cell];
    } else {
      grid[i] = gr;
      grid[i + 1] = gg;
      grid[i + 2] = gb;
    }
  }

  boxBlurGrid(grid, gw, gh, 4);

  const bgSmoothR = new Uint8Array(width * height);
  const bgSmoothG = new Uint8Array(width * height);
  const bgSmoothB = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    const yy = Math.min(gh - 1, Math.floor((y * gh) / height));
    for (let x = 0; x < width; x++) {
      const xx = Math.min(gw - 1, Math.floor((x * gw) / width));
      const cell = (yy * gw + xx) * 3;
      const p = y * width + x;
      bgSmoothR[p] = clampInt(grid[cell], 0, 255);
      bgSmoothG[p] = clampInt(grid[cell + 1], 0, 255);
      bgSmoothB[p] = clampInt(grid[cell + 2], 0, 255);
    }
  }

  return { bgSmoothR, bgSmoothG, bgSmoothB };
}

export async function loadImagesFromFiles(files: FileList): Promise<HTMLImageElement[]> {
  const list = Array.from(files);
  const images: HTMLImageElement[] = [];

  for (const file of list) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();
    images.push(img);
    URL.revokeObjectURL(url);
  }

  return images;
}

export async function reconstructWhiteboard(
  images: HTMLImageElement[],
  options: ReconstructionOptions = {}
): Promise<ReconstructionResult> {
  if (!images.length) {
    throw new Error("No images provided");
  }

  const opts: Required<ReconstructionOptions> = {
    ...DEFAULTS,
    ...options,
    adaptiveBlockSize: ensureOdd(
      options.adaptiveBlockSize ?? DEFAULTS.adaptiveBlockSize,
      DEFAULTS.adaptiveBlockSize
    ),
  };

  const srcW = images[0].naturalWidth || images[0].width;
  const srcH = images[0].naturalHeight || images[0].height;

  let crop: CropRect | null = null;
  if (opts.autoCropWhiteboard) {
    crop = detectWhiteboardBBox(images[0], opts);
  }

  const cropRect = crop || { x: 0, y: 0, width: srcW, height: srcH };

  const W = Math.max(1, Math.round(cropRect.width * opts.scale));
  const H = Math.max(1, Math.round(cropRect.height * opts.scale));
  const P = W * H;
  const N = images.length;

  const frames: Uint8ClampedArray[] = [];
  const masks: Uint8Array[] = [];
  const useForBackground = new Uint8Array(N);
  const useForStroke = new Uint8Array(N);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable");
  }

  for (let i = 0; i < N; i++) {
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(
      images[i],
      cropRect.x,
      cropRect.y,
      cropRect.width,
      cropRect.height,
      0,
      0,
      W,
      H
    );

    const rgba = ctx.getImageData(0, 0, W, H).data;
    frames.push(rgba);

    let personMask = await segmentPersonMask(images[i], cropRect, W, H, opts);
    if (opts.personDilate > 0) {
      personMask = dilateBinary(personMask, W, H, opts.personDilate);
    }

    const personRatio = countMaskPixels(personMask) / P;
    if (opts.expectPerson && personRatio < opts.minPersonAreaRatio) {
      useForBackground[i] = 0;
      useForStroke[i] = 0;
      const fill = new Uint8Array(P);
      fill.fill(255);
      masks.push(fill);
    } else {
      useForBackground[i] = 1;
      useForStroke[i] = 1;
      masks.push(personMask);
    }
  }

  const bgR = new Uint8Array(P);
  const bgG = new Uint8Array(P);
  const bgB = new Uint8Array(P);
  const validBg = new Uint8Array(P);

  const sampleR = new Uint8Array(N);
  const sampleG = new Uint8Array(N);
  const sampleB = new Uint8Array(N);

  for (let p = 0; p < P; p++) {
    let count = 0;
    const i = p * 4;
    for (let k = 0; k < N; k++) {
      if (!useForBackground[k]) continue;
      if (masks[k][p]) continue;
      const fr = frames[k];
      sampleR[count] = fr[i];
      sampleG[count] = fr[i + 1];
      sampleB[count] = fr[i + 2];
      count++;
    }

    if (count === 0) {
      validBg[p] = 0;
      bgR[p] = 255;
      bgG[p] = 255;
      bgB[p] = 255;
      continue;
    }

    validBg[p] = 1;
    bgR[p] = medianFromSamples(sampleR, count);
    bgG[p] = medianFromSamples(sampleG, count);
    bgB[p] = medianFromSamples(sampleB, count);
  }

  const { bgSmoothR, bgSmoothG, bgSmoothB } = buildSmoothBackgroundFromBgRGB(
    bgR,
    bgG,
    bgB,
    validBg,
    W,
    H
  );

  for (let p = 0; p < P; p++) {
    if (validBg[p]) continue;
    bgR[p] = bgSmoothR[p];
    bgG[p] = bgSmoothG[p];
    bgB[p] = bgSmoothB[p];
  }

  const grayBg = new Uint8Array(P);
  for (let p = 0; p < P; p++) {
    grayBg[p] = clampInt(luma(bgR[p], bgG[p], bgB[p]), 0, 255);
  }

  let inkMask = adaptiveThresholdMeanInv(
    grayBg,
    W,
    H,
    opts.adaptiveBlockSize,
    opts.adaptiveC
  );
  inkMask = morphOpen(inkMask, W, H, 1);

  const strokeR = new Uint8Array(P);
  const strokeG = new Uint8Array(P);
  const strokeB = new Uint8Array(P);

  for (let p = 0; p < P; p++) {
    if (!inkMask[p]) continue;
    let count = 0;
    const i = p * 4;
    for (let k = 0; k < N; k++) {
      if (!useForStroke[k]) continue;
      if (masks[k][p]) continue;
      const fr = frames[k];
      sampleR[count] = fr[i];
      sampleG[count] = fr[i + 1];
      sampleB[count] = fr[i + 2];
      count++;
    }
    if (count === 0) {
      strokeR[p] = 255;
      strokeG[p] = 255;
      strokeB[p] = 255;
      continue;
    }
    strokeR[p] = medianFromSamples(sampleR, count);
    strokeG[p] = medianFromSamples(sampleG, count);
    strokeB[p] = medianFromSamples(sampleB, count);
  }

  const outRGBA = new Uint8ClampedArray(P * 4);
  const inkRGBA = new Uint8ClampedArray(P * 4);
  const bgRGBA = new Uint8ClampedArray(P * 4);

  for (let p = 0; p < P; p++) {
    const i = p * 4;
    bgRGBA[i] = bgR[p];
    bgRGBA[i + 1] = bgG[p];
    bgRGBA[i + 2] = bgB[p];
    bgRGBA[i + 3] = 255;

    if (inkMask[p]) {
      outRGBA[i] = strokeR[p];
      outRGBA[i + 1] = strokeG[p];
      outRGBA[i + 2] = strokeB[p];
      outRGBA[i + 3] = 255;

      inkRGBA[i] = strokeR[p];
      inkRGBA[i + 1] = strokeG[p];
      inkRGBA[i + 2] = strokeB[p];
      inkRGBA[i + 3] = 255;
    } else {
      outRGBA[i] = 255;
      outRGBA[i + 1] = 255;
      outRGBA[i + 2] = 255;
      outRGBA[i + 3] = 255;

      inkRGBA[i] = 0;
      inkRGBA[i + 1] = 0;
      inkRGBA[i + 2] = 0;
      inkRGBA[i + 3] = 0;
    }
  }

  return {
    width: W,
    height: H,
    background: new ImageData(bgRGBA, W, H),
    canvas: new ImageData(outRGBA, W, H),
    ink: new ImageData(inkRGBA, W, H),
    crop: crop || undefined,
  };
}
