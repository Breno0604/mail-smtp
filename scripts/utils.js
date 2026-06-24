export const MAX_SIZE = 650 * 1024;
export const SKIP_SIZE = 670 * 1024;

export function toBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

export function formatDate(iso, opts = {}) {
  if (!iso) return '';
  const pad = n => String(n).padStart(2, '0');
  if (opts.dateOnly) {
    // Extract directly from string to avoid timezone issues (date-only YYYY-MM-DD input)
    const [y, m, d] = iso.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function base64ToBlob(base64, type) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type });
}

export async function captureCoordinates() {
  const coordEl = document.getElementById('coordenadas');
  if (!coordEl) return;

  if (!navigator.geolocation) {
    coordEl.value = 'Não disponível';
    coordEl.dispatchEvent(new Event('input'));
    return;
  }

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10000,
        enableHighAccuracy: false,
      });
    });

    const lat = position.coords.latitude.toFixed(4);
    const lon = position.coords.longitude.toFixed(4);
    coordEl.value = `${lat}, ${lon}`;
    coordEl.dispatchEvent(new Event('input'));
  } catch (_err) {
    coordEl.value = 'Não disponível';
    coordEl.dispatchEvent(new Event('input'));
  }
}
