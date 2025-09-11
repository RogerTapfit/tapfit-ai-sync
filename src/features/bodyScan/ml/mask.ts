// Body silhouette segmentation using MediaPipe Tasks Vision
// Produces a normalized width profile (0..1 per image row) and a small downsampled mask
import { FilesetResolver, ImageSegmenter, type ImageSegmenterResult } from "@mediapipe/tasks-vision";

export type SegmentOutput = {
  widthProfile: number[]; // values in [0,1] per row after downsampling to H rows
  maskDownsampled: Uint8Array; // flattened HxW small mask (0 or 1)
  dims: { width: number; height: number };
};

let segmenter: ImageSegmenter | null = null;
let initPromise: Promise<void> | null = null;

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.task";
const WASM_ROOT =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

async function ensureInit() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const fileset = await FilesetResolver.forVisionTasks(WASM_ROOT);
    segmenter = await ImageSegmenter.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL },
      runningMode: "IMAGE",
      outputCategoryMask: true,
    });
  })();
  return initPromise;
}

function toHTMLImageElement(src: string | Blob | HTMLImageElement): Promise<HTMLImageElement> {
  if (src instanceof HTMLImageElement) return Promise.resolve(src);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    if (typeof src === "string") {
      img.src = src;
    } else {
      img.src = URL.createObjectURL(src);
    }
  });
}

function computeWidthProfile(mask: Uint8ClampedArray, width: number, height: number, outRows = 128): number[] {
  // Downsample vertically to outRows bands and compute normalized width per band
  const profile: number[] = new Array(outRows).fill(0);
  const rowHeight = height / outRows;
  for (let r = 0; r < outRows; r++) {
    const yStart = Math.floor(r * rowHeight);
    const yEnd = Math.min(height, Math.floor((r + 1) * rowHeight));
    let minX = width, maxX = -1;
    for (let y = yStart; y < yEnd; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const val = mask[idx];
        if (val > 127) { // foreground
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }
    if (maxX >= minX) {
      profile[r] = (maxX - minX + 1) / width;
    } else {
      profile[r] = 0;
    }
  }
  return profile;
}

function downsampleMask(mask: Uint8ClampedArray, width: number, height: number, outW = 64, outH = 64): Uint8Array {
  const out = new Uint8Array(outW * outH);
  for (let oy = 0; oy < outH; oy++) {
    for (let ox = 0; ox < outW; ox++) {
      const xCenter = Math.floor(((ox + 0.5) / outW) * width);
      const yCenter = Math.floor(((oy + 0.5) / outH) * height);
      const idx = yCenter * width + xCenter;
      out[oy * outW + ox] = mask[idx] > 127 ? 1 : 0;
    }
  }
  return out;
}

export async function segmentBody(
  image: HTMLImageElement | Blob | string
): Promise<SegmentOutput | null> {
  try {
    await ensureInit();
    if (!segmenter) throw new Error("ImageSegmenter not initialized");
    const img = await toHTMLImageElement(image);
    const res: ImageSegmenterResult = segmenter.segment(img);
    const mask = res.categoryMask?.getAsFloat32Array();
    const w = res.categoryMask?.width ?? img.naturalWidth;
    const h = res.categoryMask?.height ?? img.naturalHeight;
    if (!mask) return null;

    // Convert float scores to 0..255 uint8 (foreground ~1)
    const u8 = new Uint8ClampedArray(w * h);
    for (let i = 0; i < u8.length; i++) u8[i] = Math.round(mask[i] * 255);

    const widthProfile = computeWidthProfile(u8, w, h, 128);
    const maskDownsampled = downsampleMask(u8, w, h, 64, 64);

    return { widthProfile, maskDownsampled, dims: { width: w, height: h } };
  } catch (e) {
    console.warn("segmentBody failed", e);
    return null;
  }
}
