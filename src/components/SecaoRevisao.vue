<!-- src/components/SecaoRevisao.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useFormStore } from '@/stores/form';
import { useUIStore } from '@/stores/ui';
import { useEmail } from '@/composables/useEmail';
import { useValidation } from '@/composables/useValidation';
import { useOnlineStatus } from '@/composables/useOnlineStatus';
import { useOfflineQueue } from '@/composables/useOfflineQueue';
import type { StoredAttachment } from '@/types';

const form = useFormStore();
const ui = useUIStore();
const { composeEmail } = useEmail();
const { validateAll } = useValidation();
const { isOnline } = useOnlineStatus();
const { queueSend } = useOfflineQueue();

const sending = ref(false);

const isFormValid = computed(() => {
  return form.iniciaisValido && form.tipoOrdem;
});

async function handleSend() {
  // Validate
  const validation = validateAll();
  if (!validation.valid) {
    ui.showToast(validation.errors.join('\n'), false);
    return;
  }

  // Check duplicate (status = 'sent' means this record was already sent)
  if (form.status === 'sent') {
    const confirm = await ui.showConfirm('Este registro já foi enviado. Deseja reenviar o e-mail?');
    if (!confirm) return;
  }

  if (!form.currentUUID) {
    await form.saveDraft();
  }

  // Compose payload
  const emailBody = composeEmail.value;
  const uc = form.iniciais.uc || '—';
  const os = form.iniciais.os || '—';
  const tipoOrdem = form.tipoOrdem || form.iniciais['tipo-ordem'] || '—';
  const subject = `OS #${os} - UC ${uc} - ${tipoOrdem}`;
  const compCorpo = (form.composicao['complemento-corpo'] || '').trim();
  const text = compCorpo ? `${emailBody}\n\n${compCorpo}` : emailBody;
  const attachments = form.attachments.map((att: StoredAttachment) => ({
    filename: att.name,
    content: att.data,
    type: att.type,
  }));
  
  const payload = { subject, text, attachments };

  // Offline → queue
  if (!isOnline.value) {
    await queueSend(form.currentUUID!, payload);
    ui.showToast('Offline. E-mail salvo para envio quando voltar a conexão.', true);
    return;
  }

  // Online → send
  sending.value = true;
  try {
    const response = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      form.status = 'sent';
      form.sentData = { sentAt: new Date().toISOString(), subject };
      await form.saveDraft();
      ui.showToast('E-mail enviado com sucesso!', true);
    } else {
      // Server returned an error (4xx, 5xx)
      const errBody = await response.text().catch(() => '(resposta vazia)');
      let errMsg: string;
      try {
        const parsed = JSON.parse(errBody);
        errMsg = parsed.error || errBody;
      } catch {
        errMsg = errBody;
      }
      await queueSend(form.currentUUID!, payload);
      ui.showToast(`Erro ${response.status}: ${errMsg}`, false);
    }
  } catch {
    // Network error
    await queueSend(form.currentUUID!, payload);
    ui.showToast('Servidor de envio não disponível. E-mail salvo para envio posterior.', false);
  } finally {
    sending.value = false;
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
      class="btn btn-success"
      @click="handleSend"
      :disabled="!isFormValid || sending"
    >
      {{ sending ? '⏳ Enviando...' : '📨 Enviar' }}
    </button>
  </div>
</template>
