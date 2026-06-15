<script setup lang="ts">
import { ref, computed } from 'vue'
import { useInicioStore } from '@/features/inicio/store'
import { useRetornoStore } from '@/features/retorno/store'
import { useEquipamentoStore } from '@/features/equipamentos/store'
import { useAnexoStore } from '@/features/anexos/store'
import { composeEmail } from './composeEmail'
import { sendEmail } from './sendEmail'
import { saveRecord } from '@/shared/lib/db'
import { createEmpty } from '@/entities/record'
import ResumoCard from './ResumoCard.vue'

const inicioStore = useInicioStore()
const retornoStore = useRetornoStore()
const equipamentoStore = useEquipamentoStore()
const anexoStore = useAnexoStore()

const complementoCorpo = ref('')
const status = ref<'idle' | 'sending' | 'success' | 'error'>('idle')
const errorMessage = ref('')

const iniciaisFields = computed(() => [
  { label: 'UC', value: inicioStore.data.uc },
  { label: 'OS', value: inicioStore.data.os },
  { label: 'Tipo', value: inicioStore.data.tipoOrdem },
  { label: 'Parceiro/Líder', value: inicioStore.data.parceiroLider },
  { label: 'Município', value: inicioStore.data.municipio },
  { label: 'Placa', value: inicioStore.data.placa },
  { label: 'Data', value: inicioStore.data.data },
  { label: 'Hora Início', value: inicioStore.data.horaInicio },
  { label: 'Hora Fim', value: inicioStore.data.horaFim },
  { label: 'Coordenadas', value: inicioStore.data.coordenadas },
  { label: 'Notificado', value: inicioStore.data.notificado },
  { label: 'Complemento', value: inicioStore.data.complemento },
])

const retornoFields = computed(() => {
  const entries = Object.entries(retornoStore.data).filter(([, v]) => v)
  return entries.map(([key, value]) => ({
    label: key,
    value,
  }))
})

const equipamentoSummary = computed(() => {
  if (equipamentoStore.items.length === 0) return []
  return equipamentoStore.items.map((eq, i) => ({
    label: `#${i + 1}`,
    value: `${eq.status} | ${eq.categoria} | ${eq.numero}`,
  }))
})

const hasRetorno = computed(() => retornoFields.value.length > 0)
const hasEquipamentos = computed(() => equipamentoStore.items.length > 0)
const hasAnexos = computed(() => anexoStore.count > 0)

const emailPreview = computed(() => {
  return composeEmail({
    iniciais: inicioStore.data,
    retorno: retornoStore.data,
    equipamentos: equipamentoStore.items,
    complementoCorpo: complementoCorpo.value,
    attachmentCount: anexoStore.count,
  })
})

async function handleSend() {
  status.value = 'sending'
  errorMessage.value = ''

  try {
    const result = await sendEmail({
      subject: emailPreview.value.subject,
      text: emailPreview.value.text,
      attachments: anexoStore.items.map(a => ({ name: a.name, data: a.data })),
    })

    if (result.success) {
      status.value = 'success'
      const record = createEmpty({
        status: 'sent',
        iniciais: { ...inicioStore.data },
        retorno: { ...retornoStore.data },
        equipamentos: equipamentoStore.items.map(e => ({ ...e })),
        composicao: { complementoCorpo: complementoCorpo.value },
        attachmentCount: anexoStore.count,
        sentData: {
          sentAt: new Date().toISOString(),
          response: result.message,
        },
      })
      await saveRecord(record)
    } else {
      status.value = 'error'
      errorMessage.value = result.message
    }
  } catch (err) {
    status.value = 'error'
    errorMessage.value = err instanceof Error ? err.message : 'Erro ao enviar OS'
  }
}

function resetStatus() {
  status.value = 'idle'
  errorMessage.value = ''
}
</script>

<template>
  <section class="space-y-4">
    <h2 class="text-lg font-bold uppercase text-gray-800">REVISAO</h2>

    <ResumoCard title="DADOS DA OS" :fields="iniciaisFields" />

    <ResumoCard v-if="hasRetorno" title="RETORNO" :fields="retornoFields" />

    <ResumoCard v-if="hasEquipamentos" title="EQUIPAMENTOS" :fields="equipamentoSummary" />

    <ResumoCard v-if="hasAnexos" title="ANEXOS">
      <p class="text-sm text-slate-800">{{ anexoStore.count }} anexo(s) incluído(s)</p>
    </ResumoCard>

    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <label class="block text-sm font-medium text-slate-700 mb-2">
        Complemento do corpo (opcional)
      </label>
      <textarea
        v-model="complementoCorpo"
        rows="4"
        class="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
        placeholder="Informações adicionais para o corpo do email..."
      />
    </div>

    <div class="flex justify-end">
      <button
        :disabled="status === 'sending'"
        class="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        @click="handleSend"
      >
        <span v-if="status === 'sending'" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <span v-else>📨</span>
        {{ status === 'sending' ? 'Enviando...' : 'Enviar' }}
      </button>
    </div>

    <div
      v-if="status === 'success'"
      class="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800"
    >
      OS enviada com sucesso!
      <button class="ml-2 underline text-green-700 hover:text-green-900" @click="resetStatus">OK</button>
    </div>

    <div
      v-if="status === 'error'"
      class="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800"
    >
      Erro: {{ errorMessage }}
      <button class="ml-2 underline text-red-700 hover:text-red-900" @click="resetStatus">Fechar</button>
    </div>
  </section>
</template>
