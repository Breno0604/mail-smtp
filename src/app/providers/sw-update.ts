/**
 * Service Worker update detection
 * Utiliza o evento `swUpdated` disparado pelo vite-plugin-pwa (autoUpdate mode)
 */

export interface SwUpdateState {
  needUpdate: boolean
  updateSW: () => Promise<void>
}

let swUpdateCallback: (() => void) | null = null

export function onSwUpdate(callback: () => void): void {
  swUpdateCallback = callback
}

export function triggerSwUpdate(): void {
  if (swUpdateCallback) {
    swUpdateCallback()
  }
}

/**
 * Registra listener para o evento 'swUpdated' do vite-plugin-pwa
 * Deve ser chamado no App.vue onMounted
 */
export function registerSwListener(): void {
  document.addEventListener('swUpdated', (() => {
    triggerSwUpdate()
  }) as EventListener)
}
