/**
 * Captura coordenadas geográficas do navegador
 * Retorna "lat, lng" ou "Não disponível" em caso de erro
 */
export function captureCoordinates(): Promise<string> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve('Não disponível')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        resolve(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
      },
      () => {
        resolve('Não disponível')
      },
      { timeout: 10000, enableHighAccuracy: true },
    )
  })
}
