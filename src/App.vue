<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import BaseModal from '@/shared/ui/BaseModal.vue'
import { registerSwListener } from '@/app/providers/sw-update'

const swUpdateAvailable = ref(false)

onMounted(() => {
  registerSwListener()

  // Listener para quando o SW encontrar atualização
  document.addEventListener('swUpdated', (() => {
    swUpdateAvailable.value = true
  }) as EventListener)
})

function updateSW() {
  // O vite-plugin-pwa em modo autoUpdate recarrega a página
  window.location.reload()
}
</script>

<template>
  <RouterView />

  <BaseModal
    :show="swUpdateAvailable"
    title="Sistema atualizado"
    @confirm="updateSW"
    @close="swUpdateAvailable = false"
  >
    <p>O sistema foi atualizado com sucesso. Clique em OK para recarregar.</p>
  </BaseModal>
</template>
