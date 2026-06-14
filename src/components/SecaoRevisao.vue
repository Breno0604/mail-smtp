<!-- src/components/SecaoRevisao.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useFormStore } from '@/stores/form';
import { useEmail } from '@/composables/useEmail';
import { useValidation } from '@/composables/useValidation';
import { useOnlineStatus } from '@/composables/useOnlineStatus';
import { useOfflineQueue } from '@/composables/useOfflineQueue';

const form = useFormStore();
const { composeEmail } = useEmail();
const { validateAll } = useValidation();
const { isOnline } = useOnlineStatus();
const { queueSend } = useOfflineQueue();

const isFormValid = computed(() => {
  return form.iniciaisValido && form.tipoOrdem;
});

async function handleSend() {
  const validation = validateAll();
  if (!validation.valid) {
    alert(validation.errors.join('\n'));
    return;
  }

  if (!form.currentUUID) {
    await form.saveDraft();
  }

  const emailBody = composeEmail.value;
  
  const payload = {
    uuid: form.currentUUID,
    body: emailBody,
    complemento: form.composicao.complementoCorpo,
  };

  if (isOnline.value) {
    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        form.status = 'sent';
        form.sentData = { sentAt: new Date().toISOString() };
        await form.saveDraft();
        alert('E-mail enviado com sucesso!');
      } else {
        throw new Error('Falha no envio');
      }
    } catch {
      // Fallback to offline queue
      await queueSend(form.currentUUID!, payload);
      alert('Sem conexão. E-mail salvo para envio posterior.');
    }
  } else {
    await queueSend(form.currentUUID!, payload);
    alert('Offline. E-mail salvo para envio quando voltar a conexão.');
  }
}
</script>

<template>
  <section class="bg-white rounded-lg shadow-sm p-6" id="sec-revisao">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">5. Revisão e Envio</h2>
    
    <!-- Email Preview -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">Prévia do E-mail</label>
      <pre class="bg-gray-50 p-4 rounded-md border border-gray-200 max-h-96 overflow-auto text-sm whitespace-pre-wrap font-mono">
{{ composeEmail }}
      </pre>
    </div>

    <!-- Complemento -->
    <div class="mb-6">
      <label for="complemento" class="block text-sm font-medium text-gray-700 mb-2">Complemento (opcional)</label>
      <textarea 
        id="complemento"
        v-model="form.composicao.complementoCorpo"
        rows="3"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Texto adicional para o corpo do e-mail..."
      />
    </div>

    <!-- Status indicators -->
    <div class="flex items-center gap-4 mb-4 p-4 bg-gray-50 rounded-md">
      <div class="flex items-center gap-2">
        <span :class="isOnline ? 'text-green-600' : 'text-red-600'" class="font-medium">
          {{ isOnline ? '● Online' : '● Offline' }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <span :class="form.iniciaisValido ? 'text-green-600' : 'text-red-600'" class="font-medium">
          {{ form.iniciaisValido ? '✓ Iniciais válidos' : '✗ Iniciais incompletos' }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <span :class="form.tipoOrdem ? 'text-green-600' : 'text-red-600'" class="font-medium">
          {{ form.tipoOrdem ? '✓ Tipo de Ordem selecionado' : '✗ Tipo de Ordem não selecionado' }}
        </span>
      </div>
    </div>

    <!-- Send Button -->
    <button 
      @click="handleSend"
      :disabled="!isFormValid"
      class="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-medium"
    >
      {{ isOnline ? 'Enviar E-mail' : 'Salvar para Envio Offline' }}
    </button>
  </section>
</template>