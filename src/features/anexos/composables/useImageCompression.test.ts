import { describe, it, expect, vi, afterEach } from 'vitest'
import { useImageCompression } from './useImageCompression'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useImageCompression', () => {
  it('comprime imagem e retorna dataUrl e blob', async () => {
    const mockBlob = new Blob(['compressed'], { type: 'image/jpeg' })
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      (cb) => cb(mockBlob)
    )
    const { compressImage } = useImageCompression()

    const file = new File(['fake-image-content'], 'foto.jpg', { type: 'image/jpeg' })
    const result = await compressImage(file, 1024, 1024, 0.7, 1)
    expect(result.dataUrl).toBeTruthy()
    expect(result.dataUrl).toContain('data:')
    expect(result.blob).toBeInstanceOf(Blob)
  })

  it('usa parametros customizados', async () => {
    const mockBlob = new Blob(['compressed'], { type: 'image/jpeg' })
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      (cb) => cb(mockBlob)
    )
    const { compressImage } = useImageCompression()

    const file = new File(['test'], 'foto.jpg', { type: 'image/jpeg' })
    const result = await compressImage(file, 800, 600, 0.5, 1)
    expect(result.dataUrl).toBeTruthy()
  })
})
