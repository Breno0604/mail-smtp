// src/utils/compress.ts
import { loadImage } from './base64';

export async function compressAttachment(
  file: File, maxWidth: number, quality: number,
): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const ratio = img.width / img.height;
    let newWidth = img.width;
    let newHeight = img.height;
    if (newWidth > maxWidth) {
      newWidth = maxWidth;
      newHeight = Math.round(maxWidth / ratio);
    }
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, newWidth, newHeight);
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => { if (blob) resolve(blob); else reject(new Error('toBlob returned null')); },
        'image/jpeg', quality,
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}