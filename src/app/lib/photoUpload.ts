const ONE_MB = 1_000_000;

export const PHOTO_UPLOAD_ACCEPT = "image/jpeg,image/png,image/webp";
export const PHOTO_MAX_SOURCE_BYTES = 10 * ONE_MB;
export const PHOTO_TARGET_UPLOAD_BYTES = 2 * ONE_MB;

const OUTPUT_TYPE = "image/webp";
const MAX_DIMENSION = 2200;
const MIN_DIMENSION = 960;
const INITIAL_QUALITY = 0.92;
const MIN_QUALITY = 0.72;
const QUALITY_STEP = 0.06;
const SCALE_STEP = 0.85;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read this image file."));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to optimize this image."));
          return;
        }
        resolve(blob);
      },
      OUTPUT_TYPE,
      quality
    );
  });
}

function getOutputFileName(originalName: string): string {
  const stripped = originalName.replace(/\.[^.]+$/, "");
  return `${stripped || "photo"}.webp`;
}

export async function optimizePhotoForUpload(file: File): Promise<File> {
  if (!PHOTO_UPLOAD_ACCEPT.split(",").includes(file.type)) {
    throw new Error("Unsupported format. Please use JPG, PNG, or WebP.");
  }

  if (file.size > PHOTO_MAX_SOURCE_BYTES) {
    throw new Error(`The selected file is too large. Choose a file under ${(PHOTO_MAX_SOURCE_BYTES / ONE_MB).toFixed(0)}MB.`);
  }

  const image = await loadImage(file);
  const originalWidth = image.naturalWidth || image.width;
  const originalHeight = image.naturalHeight || image.height;

  if (!originalWidth || !originalHeight) {
    throw new Error("Unable to read this image's dimensions.");
  }

  let width = originalWidth;
  let height = originalHeight;
  const largestSide = Math.max(width, height);

  if (largestSide > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / largestSide;
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Your browser could not process this image.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  const drawAndEncode = async (nextWidth: number, nextHeight: number, quality: number): Promise<Blob> => {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
    context.clearRect(0, 0, nextWidth, nextHeight);
    context.drawImage(image, 0, 0, nextWidth, nextHeight);
    return canvasToBlob(canvas, quality);
  };

  let quality = INITIAL_QUALITY;
  let blob = await drawAndEncode(width, height, quality);

  while (blob.size > PHOTO_TARGET_UPLOAD_BYTES) {
    const canLowerQuality = quality - QUALITY_STEP >= MIN_QUALITY;
    if (canLowerQuality) {
      quality -= QUALITY_STEP;
    } else {
      const maxCurrentDimension = Math.max(width, height);
      if (maxCurrentDimension <= MIN_DIMENSION) {
        break;
      }
      width = Math.max(1, Math.round(width * SCALE_STEP));
      height = Math.max(1, Math.round(height * SCALE_STEP));
      quality = INITIAL_QUALITY;
    }

    blob = await drawAndEncode(width, height, quality);
  }

  if (blob.size > PHOTO_TARGET_UPLOAD_BYTES) {
    throw new Error(
      `Unable to reduce this image enough for upload. Please choose a smaller image (target ${(PHOTO_TARGET_UPLOAD_BYTES / ONE_MB).toFixed(0)}MB).`
    );
  }

  return new File([blob], getOutputFileName(file.name), {
    type: OUTPUT_TYPE,
    lastModified: Date.now(),
  });
}
