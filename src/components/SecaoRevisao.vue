<!-- src/components/SecaoRevisao.vue -->
<script setup lang="ts">
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
    complemento: form.composicao['complemento-corpo'],
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
  <!-- Section card -->
  <section class="sec-card mx-2.5 mt-4" id="sec-revisao">
    <div class="sec-head">
      <span class="sec-num">5</span> Revisão
    </div>
    <div class="sec-body">
      <!-- Email Preview -->
      <div class="email-preview bg-slate-50/70 border-2 border-slate-300 rounded-[12px] p-5">
        <div class="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-bold" id="preview-corpo">
          {{ composeEmail || '—' }}
        </div>
        <div class="mt-5 pt-4 border-t border-slate-200/60">
          <label for="complemento-corpo" class="block font-semibold text-[15px] text-slate-700 mb-2">Complemento do corpo (opcional)</label>
          <textarea 
            id="complemento-corpo"
            v-model="form.composicao['complemento-corpo']"
            rows="6"
            placeholder="Texto adicional para o corpo..."
            class="w-full px-4 py-3 border-2 border-gray-300 rounded-[10px] text-[15px] outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/10 resize-y min-h-[120px]"
          />
        </div>
      </div>
    </div>
  </section>

  <!-- Send button: outside section card, matching original layout -->
  <div class="mx-2.5 mt-4 mb-6 text-center">
    <button 
      id="btn-enviar"
      @click="handleSend"
    >
      📨 Enviar
    </button>
  </div>
</template>
