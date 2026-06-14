<!-- src/pages/FormPage.vue -->
<script setup lang="ts">
import SecaoInicio from '@/components/SecaoInicio.vue';
import SecaoRetorno from '@/components/SecaoRetorno.vue';
import SecaoEquipamentos from '@/components/SecaoEquipamentos.vue';
import SecaoAnexos from '@/components/SecaoAnexos.vue';
import SecaoRevisao from '@/components/SecaoRevisao.vue';
</script>

<template>
  <div class="space-y-6">
    <SecaoInicio />
    <SecaoRetorno />
    <SecaoEquipamentos />
    <SecaoAnexos />
    <SecaoRevisao />
  </div>
</template>