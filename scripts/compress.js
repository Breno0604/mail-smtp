import { MAX_SIZE, SKIP_SIZE, toBase64, blobToBase64, loadImage } from "./utils.js";

export async function compressAttachments(files) {
  const attachments = [];

  for (const file of files) {
    if (file.size <= SKIP_SIZE) {
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
    let quality = 0.9;
    let blob;

    for (let attempt = 0; attempt < 10; attempt++) {
      const ratio = width / img.naturalWidth;
      canvas.width = width;
      canvas.height = Math.round(img.naturalHeight * ratio);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob.size <= MAX_SIZE) break;
      width = Math.round(width * 0.8);
    }

    if (blob.size > MAX_SIZE) {
      quality = 0.7;
      const ratio = width / img.naturalWidth;
      canvas.width = width;
      canvas.height = Math.round(img.naturalHeight * ratio);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
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
