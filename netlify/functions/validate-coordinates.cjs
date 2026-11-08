// Espelho CommonJS da regra de scripts/utils.js (COORDINATES_PATTERN + limites).
// A função Netlify roda em CJS e não importa os módulos ESM do front-end;
// tests/send-backend.test.js compara as duas implementações para evitar divergência.
const COORDINATES_PATTERN = /^-\d\.\d{1,8},-\d{2}\.\d{1,8}$/;

/**
 * Procura a linha "COORDENADAS:" no corpo do email e valida seu valor.
 * @param {string} text corpo do email
 * @returns {string|null} mensagem de erro, ou null quando está tudo certo
 */
function findCoordinatesError(text) {
  const line = /^COORDENADAS:[ \t]*(.*)$/m.exec(text || '');
  if (!line) return null;

  const value = line[1];

  if (!COORDINATES_PATTERN.test(value)) {
    return 'Formato de coordenadas inválido. Use -3.12345678,-38.41567890.';
  }

  const [latitude, longitude] = value.split(',').map(Number);
  if (latitude < -90 || longitude < -180) {
    return 'Coordenadas fora dos limites permitidos (latitude até -90 e longitude até -180).';
  }

  return null;
}

module.exports = { findCoordinatesError, COORDINATES_PATTERN };
