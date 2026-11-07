import { MAX_SIZE, SKIP_SIZE, toBase64, loadImage } from './utils.js';

/**
 * Reduz uma imagem grande (redimensiona/JPEG) e devolve um File pronto para
 * armazenamento/envio. Pequenas e não-imagens passam intactas.
 */
export async function compressImageFile(file) {
  if (file.size <= SKIP_SIZE || !file.type.startsWith('image/')) return file;

  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let width = img.naturalWidth;
  let blob;

  // Loop de até 10 tentativas reduzindo dimensões (qualidade 0.9).
  // Na tentativa 11 (fallback) a qualidade cai para 0.7 sem mais redução de escala.
  for (let attempt = 0; attempt <= 10; attempt++) {
    const isFallback = attempt === 10;
    const quality = isFallback ? 0.7 : 0.9;
    const ratio = width / img.naturalWidth;
    canvas.width = width;
    canvas.height = Math.round(img.naturalHeight * ratio);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (blob.size <= MAX_SIZE) break;
    if (!isFallback) width = Math.round(width * 0.8);
  }

  const dot = file.name.lastIndexOf('.');
  const basename = dot > -1 ? file.name.slice(0, dot) : file.name;
  return new File([blob], basename + '_red.jpg', { type: 'image/jpeg' });
}

export async function compressAttachments(files) {
  const attachments = [];

  for (const file of files) {
    const compressed = await compressImageFile(file);
    attachments.push({
      filename: compressed.name,
      content: await toBase64(compressed),
      encoding: 'base64',
    });
  }

  return attachments;
}
