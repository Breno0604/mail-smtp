import { describe, it, expect } from 'vitest'
import { arrayBufferToBase64, base64ToArrayBuffer, estimateBase64Size } from './base64'

describe('arrayBufferToBase64', () => {
  it('converte ArrayBuffer para Base64', () => {
    const buf = new Uint8Array([72, 101, 108, 108, 111]).buffer
    expect(arrayBufferToBase64(buf)).toBe('SGVsbG8=')
  })

  it('converte buffer vazio', () => {
    const buf = new Uint8Array([]).buffer
    expect(arrayBufferToBase64(buf)).toBe('')
  })
})

describe('base64ToArrayBuffer', () => {
  it('converte Base64 para ArrayBuffer', () => {
    const buf = base64ToArrayBuffer('SGVsbG8=')
    const bytes = new Uint8Array(buf)
    expect(bytes).toEqual(new Uint8Array([72, 101, 108, 108, 111]))
  })

  it('faz roundtrip ida-e-volta', () => {
    const original = new Uint8Array([1, 2, 3, 255, 128, 64])
    const b64 = arrayBufferToBase64(original.buffer)
    const restored = base64ToArrayBuffer(b64)
    expect(new Uint8Array(restored)).toEqual(original)
  })
})

describe('estimateBase64Size', () => {
  it('estima tamanho em MB', () => {
    const mb = estimateBase64Size('A'.repeat(1024 * 1024))
    expect(mb).toBeGreaterThan(0.7)
    expect(mb).toBeLessThan(0.8)
  })

  it('retorna 0 para string vazia', () => {
    expect(estimateBase64Size('')).toBe(0)
  })
})
