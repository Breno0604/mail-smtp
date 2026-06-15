// src/utils/coordinates.ts
export function captureCoordinates(): Promise<string> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve('Geolocalização não disponível');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
      () => resolve('Não disponível'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  });
}