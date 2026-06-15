export function useImageCompression() {
  async function compressImage(file: File, maxWidth = 1024, maxHeight = 1024, quality = 0.7, maxAttempts = 10): Promise<{ dataUrl: string; blob: Blob }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas not available')); return }

        ctx.drawImage(img, 0, 0, width, height)

        function tryCompress(attempt: number) {
          const q = Math.max(0.1, quality - attempt * 0.05)
          canvas.toBlob((blob) => {
            if (!blob) { reject(new Error('Compression failed')); return }
            if (blob.size > 8 * 1024 * 1024 && attempt < maxAttempts) {
              tryCompress(attempt + 1)
              return
            }
            const reader = new FileReader()
            reader.onload = () => resolve({ dataUrl: reader.result as string, blob })
            reader.onerror = () => reject(new Error('FileReader error'))
            reader.readAsDataURL(blob)
          }, 'image/jpeg', q)
        }
        tryCompress(0)
      }
      img.onerror = () => reject(new Error('Image load error'))
      img.src = URL.createObjectURL(file)
    })
  }

  return { compressImage }
}
