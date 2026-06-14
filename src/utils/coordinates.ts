// src/utils/coordinates.ts
export function captureCoordinates(): Promise<string> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve('Geolocalizacao nao disponivel');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`),
      () => resolve('Nao disponivel'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}