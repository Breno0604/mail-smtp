import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatDate,
  base64ToBlob,
  captureCoordinates,
  isValidCoordinates,
  isCoordinatesInRange,
  normalizeCoordinateSigns,
  parseCoordinates,
  MAX_SIZE,
  SKIP_SIZE,
} from '../scripts/utils.js';

describe('utils', () => {
  describe('isValidCoordinates', () => {
    it('aceita o formato -3.1245,-38.4156', () => {
      expect(isValidCoordinates('-3.1245,-38.4156')).toBe(true);
    });

    it('aceita até 8 casas decimais', () => {
      expect(isValidCoordinates('-3.12345678,-38.12345678')).toBe(true);
    });

    it('aceita uma casa decimal', () => {
      expect(isValidCoordinates('-3.1,-38.4')).toBe(true);
    });

    it('rejeita valor vazio', () => {
      expect(isValidCoordinates('')).toBe(false);
      expect(isValidCoordinates(null)).toBe(false);
    });

    it('rejeita espaço depois da vírgula', () => {
      expect(isValidCoordinates('-3.1245, -38.4156')).toBe(false);
    });

    it('rejeita espaço no início ou no fim', () => {
      expect(isValidCoordinates(' -3.1245,-38.4156')).toBe(false);
      expect(isValidCoordinates('-3.1245,-38.4156 ')).toBe(false);
    });

    it('rejeita latitude ou longitude sem sinal negativo', () => {
      expect(isValidCoordinates('3.1245,-38.4156')).toBe(false);
      expect(isValidCoordinates('-3.1245,38.4156')).toBe(false);
    });

    it('rejeita latitude com dois algarismos ou longitude com um', () => {
      expect(isValidCoordinates('-33.1245,-38.4156')).toBe(false);
      expect(isValidCoordinates('-3.1245,-8.4156')).toBe(false);
    });

    it('rejeita ausência de ponto decimal', () => {
      expect(isValidCoordinates('-3,-38.4156')).toBe(false);
      expect(isValidCoordinates('-3.1245,-38')).toBe(false);
    });

    it('rejeita mais de 8 casas decimais', () => {
      expect(isValidCoordinates('-3.123456789,-38.4156')).toBe(false);
      expect(isValidCoordinates('-3.1245,-38.123456789')).toBe(false);
    });

    it('rejeita letras, sinais extras e separadores errados', () => {
      expect(isValidCoordinates('-3.12a5,-38.4156')).toBe(false);
      expect(isValidCoordinates('--3.1245,-38.4156')).toBe(false);
      expect(isValidCoordinates('-3.1245;-38.4156')).toBe(false);
      expect(isValidCoordinates('-3.1245,-38.4156,-1.0')).toBe(false);
      expect(isValidCoordinates('3.1245,38.4156'.replace('3.1245', '+3.1245'))).toBe(false);
    });

    it('rejeita campo incompleto', () => {
      expect(isValidCoordinates('-3.1245,')).toBe(false);
      expect(isValidCoordinates('-3.1245')).toBe(false);
      expect(isValidCoordinates('-3.1245,-')).toBe(false);
      expect(isValidCoordinates(',-38.4156')).toBe(false);
    });

    it('rejeita ausência da vírgula separadora', () => {
      expect(isValidCoordinates('-3.1245-38.4156')).toBe(false);
    });

    it('aceita o exemplo da especificação com 8 casas decimais', () => {
      expect(isValidCoordinates('-3.12345678,-38.41567890')).toBe(true);
    });

    it('rejeita valores fora dos limites geográficos', () => {
      expect(isValidCoordinates('-91.12345678,-38.41567890')).toBe(false);
      expect(isValidCoordinates('-190.12345678,-38.41567890')).toBe(false);
      expect(isValidCoordinates('-3.12345678,-180.41567890')).toBe(false);
      expect(isValidCoordinates('-3.12345678,-380.41567890')).toBe(false);
    });
  });

  describe('parseCoordinates', () => {
    it('converte o texto em latitude e longitude numéricas', () => {
      expect(parseCoordinates('-3.12345678,-38.41567890')).toEqual({
        latitude: -3.12345678,
        longitude: -38.4156789,
      });
    });

    it('retorna null para formato inválido', () => {
      expect(parseCoordinates('')).toBeNull();
      expect(parseCoordinates('-3.1245, -38.4156')).toBeNull();
      expect(parseCoordinates('3.1245,-38.4156')).toBeNull();
      expect(parseCoordinates(null)).toBeNull();
    });
  });

  describe('isCoordinatesInRange', () => {
    it('aceita valores dentro dos limites', () => {
      expect(isCoordinatesInRange({ latitude: -3.1245, longitude: -38.4156 })).toBe(true);
      expect(isCoordinatesInRange({ latitude: -90, longitude: -180 })).toBe(true);
    });

    it('rejeita valores fora dos limites ou positivos', () => {
      expect(isCoordinatesInRange({ latitude: -90.5, longitude: -38.4156 })).toBe(false);
      expect(isCoordinatesInRange({ latitude: -3.1245, longitude: -180.5 })).toBe(false);
      expect(isCoordinatesInRange({ latitude: 3.1245, longitude: -38.4156 })).toBe(false);
      expect(isCoordinatesInRange({ latitude: -3.1245, longitude: 38.4156 })).toBe(false);
    });
  });

  describe('normalizeCoordinateSigns', () => {
    it('insere o sinal negativo na latitude e na longitude', () => {
      expect(normalizeCoordinateSigns('3.1245,38.4156')).toBe('-3.1245,-38.4156');
    });

    it('insere apenas o sinal que falta', () => {
      expect(normalizeCoordinateSigns('-3.1245,38.4156')).toBe('-3.1245,-38.4156');
    });

    it('conserva valores que já começam com sinal negativo', () => {
      expect(normalizeCoordinateSigns('-3.1245,-38.4156')).toBe('-3.1245,-38.4156');
    });

    it('não mexe em valores vazios ou sem vírgula inválidos', () => {
      expect(normalizeCoordinateSigns('')).toBe('');
      expect(normalizeCoordinateSigns('-')).toBe('-');
      expect(normalizeCoordinateSigns(',')).toBe(',');
    });
  });

  describe('constants', () => {
    it('MAX_SIZE should be 650 * 1024', () => {
      expect(MAX_SIZE).toBe(650 * 1024);
    });

    it('SKIP_SIZE should be 670 * 1024', () => {
      expect(SKIP_SIZE).toBe(670 * 1024);
    });

    it('SKIP_SIZE should be greater than MAX_SIZE', () => {
      expect(SKIP_SIZE).toBeGreaterThan(MAX_SIZE);
    });
  });

  describe('formatDate', () => {
    it('should format a valid ISO date string', () => {
      const result = formatDate('2024-03-15T14:30:00');
      // Date parsing may be timezone-dependent; just check structure
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    });

    it('should format midnight correctly', () => {
      const result = formatDate('2024-01-01T00:00:00');
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} 00:00$/);
    });

    it('should return empty string for null', () => {
      expect(formatDate(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatDate(undefined)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(formatDate('')).toBe('');
    });

    it('should pad single-digit months and days', () => {
      const result = formatDate('2024-03-05T06:07:00');
      expect(result).toMatch(/^05\/03\/2024 06:07$/);
    });

    it('should handle date-only strings', () => {
      const result = formatDate('2024-12-25');
      // Timezone-dependent, just check structure and that date is present
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
      // Verify the date parts parse correctly
      expect(result).toContain('/12/2024');
    });
  });

  describe('base64ToBlob', () => {
    it('should convert valid base64 string to Blob', () => {
      const base64 = btoa('hello world');
      const blob = base64ToBlob(base64, 'text/plain');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/plain');
    });

    it('should create a Blob with correct content', async () => {
      const content = 'test content';
      const base64 = btoa(content);
      const blob = base64ToBlob(base64, 'text/plain');
      const text = await blob.text();
      expect(text).toBe(content);
    });

    it('should handle empty base64 string', () => {
      const base64 = btoa('');
      const blob = base64ToBlob(base64, 'application/octet-stream');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBe(0);
    });

    it('should handle different MIME types', () => {
      const base64 = btoa('{}');
      const blob = base64ToBlob(base64, 'application/json');
      expect(blob.type).toBe('application/json');
    });

    it('should handle binary data', () => {
      const bytes = new Uint8Array([0, 1, 2, 255, 254]);
      let binary = '';
      bytes.forEach(b => {
        binary += String.fromCharCode(b);
      });
      const base64 = btoa(binary);
      const blob = base64ToBlob(base64, 'application/octet-stream');
      expect(blob.size).toBe(5);
    });
  });

  describe('captureCoordinates', () => {
    function mockGeolocation(impl) {
      const getCurrentPosition = vi.fn(impl);
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: { getCurrentPosition },
      });
      return getCurrentPosition;
    }

    beforeEach(() => {
      document.body.innerHTML = '<input id="coordenadas">';
    });

    afterEach(() => {
      delete navigator.geolocation;
    });

    it('preenche o campo e avisa a alteração quando obtém a localização', async () => {
      mockGeolocation(success => success({ coords: { latitude: -3.1, longitude: -38.4 } }));
      const input = document.getElementById('coordenadas');
      const onInput = vi.fn();
      input.addEventListener('input', onInput);

      const ok = await captureCoordinates();

      expect(ok).toBe(true);
      expect(input.value).toBe('-3.1000,-38.4000');
      expect(onInput).toHaveBeenCalledOnce();
    });

    it('recusa leitura fora do formato exigido e mantém o valor atual', async () => {
      mockGeolocation(success => success({ coords: { latitude: 3.1, longitude: -38.4 } }));
      const input = document.getElementById('coordenadas');
      input.value = '-1.0000,-2.0000';

      const ok = await captureCoordinates();

      expect(ok).toBe(false);
      expect(input.value).toBe('-1.0000,-2.0000');
    });

    it('mantém o valor existente quando a localização falha', async () => {
      mockGeolocation((_success, error) => error(new Error('permission denied')));
      const input = document.getElementById('coordenadas');
      input.value = '-1.0000, -2.0000';

      const ok = await captureCoordinates();

      expect(ok).toBe(false);
      expect(input.value).toBe('-1.0000, -2.0000');
    });

    it('retorna falso quando o navegador não oferece localização', async () => {
      const input = document.getElementById('coordenadas');
      input.value = '-1.0000, -2.0000';

      const ok = await captureCoordinates();

      expect(ok).toBe(false);
      expect(input.value).toBe('-1.0000, -2.0000');
    });

    it('retorna falso quando o campo não existe', async () => {
      document.body.innerHTML = '';

      const ok = await captureCoordinates();

      expect(ok).toBe(false);
    });
  });
});
