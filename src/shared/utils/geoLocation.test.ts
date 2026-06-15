import { describe, it, expect, vi, beforeEach } from 'vitest'
import { captureCoordinates } from './geoLocation'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('captureCoordinates', () => {
  it('retorna coordenadas formatadas quando geolocation funciona', async () => {
    const mockGetCurrentPosition = vi.fn((success) => {
      success({
        coords: { latitude: -3.123456, longitude: -45.654321 },
      })
    })
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
      writable: true,
    })

    const result = await captureCoordinates()
    expect(result).toBe('-3.123456, -45.654321')
  })

  it('retorna "Não disponível" quando geolocation não existe', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: undefined,
      configurable: true,
      writable: true,
    })

    const result = await captureCoordinates()
    expect(result).toBe('Não disponível')
  })

  it('retorna "Não disponível" quando geolocation falha', async () => {
    const mockGetCurrentPosition = vi.fn((_success, error) => {
      error(new Error('Permissão negada'))
    })
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
      writable: true,
    })

    const result = await captureCoordinates()
    expect(result).toBe('Não disponível')
  })
})
