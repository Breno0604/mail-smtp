import { MAX_SIZE, SKIP_SIZE, toBase64, blobToBase64, loadImage } from "./utils.js";

// Helper privado: desenha a imagem no canvas e retorna um blob JPEG
async function drawAndBlob(ctx, canvas, img, width, quality) {
  const ratio = width / img.naturalWidth;
  canvas.width = width;
  canvas.height = Math.round(img.naturalHeight * ratio);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

export async function compressAttachments(files) {
  const attachments = [];

  for (const file of files) {
    if (file.size <= SKIP_SIZE || !file.type.startsWith("image/")) {
      attachments.push({
        filename: file.name,
        content: await toBase64(file),
        encoding: "base64",
      });
      continue;
    }

    const img = await loadImage(file);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    let width = img.naturalWidth;
    let blob;

    // Loop de até 10 tentativas reduzindo dimensões (qualidade 0.9).
    // Na tentativa 11 (fallback) a qualidade cai para 0.7 sem mais redução de escala.
    for (let attempt = 0; attempt <= 10; attempt++) {
      const isFallback = attempt === 10;
      const quality = isFallback ? 0.7 : 0.9;
      blob = await drawAndBlob(ctx, canvas, img, width, quality);
      if (blob.size <= MAX_SIZE) break;
      if (!isFallback) width = Math.round(width * 0.8);
    }

    const dot = file.name.lastIndexOf(".");
    const basename = dot > -1 ? file.name.slice(0, dot) : file.name;
    attachments.push({
      filename: basename + "_red.jpg",
      content: await blobToBase64(blob),
      encoding: "base64",
    });
  }

  return attachments;
}
