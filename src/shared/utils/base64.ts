/**
 * Converte ArrayBuffer para string Base64
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Converte string Base64 para ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Estima o tamanho em MB de uma string Base64
 */
export function estimateBase64Size(base64: string): number {
  // Cada caractere Base64 ~0.75 bytes
  return (base64.length * 0.75) / (1024 * 1024)
}
