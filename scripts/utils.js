export const MAX_SIZE = 650 * 1024;
export const SKIP_SIZE = 670 * 1024;

// Formato obrigatório das coordenadas: -3.12345678,-38.41567890
// latitude: sinal negativo, 1 algarismo, ponto e 1 a 8 casas decimais
// vírgula única sem espaços
// longitude: sinal negativo, 2 algarismos, ponto e 1 a 8 casas decimais
export const COORDINATES_PATTERN = /^-\d\.\d{1,8},-\d{2}\.\d{1,8}$/;

// Limites geográficos. O formato exige valores negativos (sul/oeste),
// portanto o limite superior é 0.
export const LATITUDE_LIMITS = { min: -90, max: 0 };
export const LONGITUDE_LIMITS = { min: -180, max: 0 };

/**
 * Converte o texto no par latitude/longitude.
 * @returns {{latitude: number, longitude: number}|null} null quando o formato é inválido
 */
export function parseCoordinates(value) {
  if (typeof value !== 'string' || !COORDINATES_PATTERN.test(value)) return null;
  const [latitude, longitude] = value.split(',').map(Number);
  return { latitude, longitude };
}

export function isCoordinatesInRange({ latitude, longitude }) {
  return (
    latitude >= LATITUDE_LIMITS.min &&
    latitude <= LATITUDE_LIMITS.max &&
    longitude >= LONGITUDE_LIMITS.min &&
    longitude <= LONGITUDE_LIMITS.max
  );
}

/**
 * Formato válido E dentro dos limites geográficos permitidos.
 */
export function isValidCoordinates(value) {
  const coords = parseCoordinates(value);
  return coords !== null && isCoordinatesInRange(coords);
}

/**
 * Insere o sinal negativo obrigatório quando o valor começa com algarismo
 * (o teclado numérico do celular não oferece a tecla "-").
 * Não altera valores que já começam com "-" nem entradas inválidas.
 */
export function normalizeCoordinateSigns(value) {
  if (!value) return value;

  const commaIndex = value.indexOf(',');
  const addSign = part => (/^\d/.test(part) ? `-${part}` : part);

  if (commaIndex === -1) return addSign(value);

  return `${addSign(value.slice(0, commaIndex))},${addSign(value.slice(commaIndex + 1))}`;
}

/**
 * Insere o ponto decimal do formato -3.12345678,-38.41567890 enquanto o usuário
 * digita: latitude depois do 1º algarismo e longitude depois do 2º.
 * Só age quando a seção tem exatamente esses algarismos e ainda não tem ponto,
 * então não repete a inserção nem mexe em valor já formatado.
 * @returns {{value: string, caret: number}} valor com o ponto e o cursor ajustado
 */
export function insertDecimalPoint(value, caret = value.length) {
  if (!value) return { value, caret };

  const comma = value.indexOf(',');
  const latitude = comma === -1 ? value : value.slice(0, comma);
  const longitude = comma === -1 ? null : value.slice(comma + 1);

  let index = -1;
  if (/^-\d$/.test(latitude)) {
    index = latitude.length;
  } else if (longitude !== null && /^-\d{2}$/.test(longitude)) {
    index = comma + 1 + longitude.length;
  }

  if (index === -1) return { value, caret };

  return {
    value: `${value.slice(0, index)}.${value.slice(index)}`,
    caret: caret >= index ? caret + 1 : caret,
  };
}

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

/**
 * Garante que um <select> aceite um valor que não existe mais nas opções atuais
 * (ex.: nome/placa removidos do cadastro). Sem isso, atribuir o valor zera o campo
 * e o dado antigo é perdido no próximo save.
 */
export function ensureSelectOption(el, value) {
  if (!el || el.tagName !== 'SELECT' || !value) return;
  const exists = Array.from(el.options).some(option => option.value === value);
  if (!exists) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    el.add(option);
  }
}

/**
 * Solicita a localização atual ao navegador e, se conseguir, preenche o campo.
 * Nunca sobrescreve o valor existente em caso de falha.
 * @returns {Promise<boolean>} true quando o campo foi preenchido
 */
export async function captureCoordinates() {
  const coordEl = document.getElementById('coordenadas');
  if (!coordEl || !navigator.geolocation) return false;

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10000,
        enableHighAccuracy: false,
      });
    });

    const lat = position.coords.latitude.toFixed(4);
    const lon = position.coords.longitude.toFixed(4);
    const value = `${lat},${lon}`;

    // Só aceita a leitura se ela já estiver no formato e nos limites exigidos
    // (coordenadas positivas, por exemplo, não são representáveis no formato).
    if (!isValidCoordinates(value)) return false;

    coordEl.value = value;
    coordEl.dispatchEvent(new Event('input'));
    return true;
  } catch (_err) {
    return false;
  }
}
