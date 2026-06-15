// src/stores/form.ts
import { defineStore } from 'pinia';
import { ref, watch, computed } from 'vue';
import { db } from '@/db';
import type { RecordData, EquipamentoData, StoredAttachment } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { captureCoordinates } from '@/utils/coordinates';
import { useUIStore } from './ui';

export const useFormStore = defineStore('form', () => {
  // ── State ──────────────────────────────────────────────────────────────
  const iniciais = ref<Record<string, string>>({});
  const retorno = ref<Record<string, string>>({});
  const equipamentos = ref<EquipamentoData[]>([]);
  const attachments = ref<StoredAttachment[]>([]);
  const composicao = ref({ 'complemento-corpo': '' });
  const currentUUID = ref<string | null>(null);
  const status = ref<'draft' | 'sent'>('draft');
  const createdAt = ref<string>('');
  const updatedAt = ref<string>('');
  const sentData = ref<{ sentAt: string; response?: string } | null>(null);
  const tipoOrdem = ref<string>('');
  const iniciaisValido = ref(false);
  let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  let isLoading = false;

  // ── Computed ───────────────────────────────────────────────────────────
  const attachmentCount = computed(() => attachments.value.length);

  // ── Actions ────────────────────────────────────────────────────────────
  function resetForm() {
    iniciais.value = {};
    retorno.value = {};
    equipamentos.value = [];
    attachments.value = [];
    composicao.value = { 'complemento-corpo': '' };
    currentUUID.value = null;
    status.value = 'draft';
    createdAt.value = '';
    updatedAt.value = '';
    sentData.value = null;
    tipoOrdem.value = '';
    iniciaisValido.value = false;
  }

  function validateIniciais() {
    const uc = iniciais.value.uc?.trim();
    const os = iniciais.value.os?.trim();
    iniciaisValido.value = !!(uc && os);
  }

  function setTipoOrdem(value: string) {
    tipoOrdem.value = value;
    iniciais.value['tipo-ordem'] = value;
    // Clear retorno when tipo-ordem changes
    retorno.value = {};
  }

  function markAttachmentsDirty() {
    // Trigger reactivity for attachments
    attachments.value = [...attachments.value];
  }

  async function saveDraft() {
    if (isLoading) return;
    
    validateIniciais();
    if (!iniciaisValido.value) return;

    const now = new Date().toISOString();
    updatedAt.value = now;

    const record: RecordData = {
      uuid: currentUUID.value || uuidv4(),
      status: status.value,
      createdAt: currentUUID.value ? createdAt.value : now,
      updatedAt: now,
      iniciais: { ...iniciais.value },
      retorno: { ...retorno.value },
      tipoOrdem: tipoOrdem.value,
      equipamentos: [...equipamentos.value],
      composicao: { 'complemento-corpo': composicao.value['complemento-corpo'] },
      attachmentCount: attachments.value.length,
      sentData: sentData.value,
    };

    if (!currentUUID.value) {
      currentUUID.value = record.uuid;
      createdAt.value = record.createdAt;
    }

    try {
      await db.records.put(record);
      
      // Save attachments
      if (attachments.value.length > 0) {
        await db.attachments.bulkPut(
          attachments.value.map((att, i) => ({
            ...att,
            uuid: record.uuid,
            index: i,
          }))
        );
      }
    } catch (e) {
      console.error('Failed to save draft:', e);
    }
  }

  function debouncedSave() {
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(() => {
      saveDraft();
    }, 1000);
  }

  async function loadRecord(uuid: string) {
    isLoading = true;
    try {
      const record = await db.records.get(uuid);
      if (!record) throw new Error('Record not found');

      currentUUID.value = record.uuid;
      status.value = record.status;
      createdAt.value = record.createdAt;
      updatedAt.value = record.updatedAt;
      iniciais.value = { ...record.iniciais };
      retorno.value = { ...record.retorno };
      tipoOrdem.value = record.tipoOrdem;
      equipamentos.value = [...record.equipamentos];
      composicao.value = { 'complemento-corpo': record.composicao['complemento-corpo'] || '' };
      sentData.value = record.sentData;

      // Load attachments
      const atts = await db.attachments.where('uuid').equals(uuid).toArray();
      attachments.value = atts.sort((a, b) => a.index - b.index);

      validateIniciais();
    } finally {
      isLoading = false;
    }
  }

  async function newRecord() {
    // Save current draft if valid before creating new
    if (iniciaisValido.value) {
      await saveDraft();
    }
    resetForm();
    // Generate new UUID for the new record
    currentUUID.value = uuidv4();
    createdAt.value = new Date().toISOString();
    updatedAt.value = createdAt.value;
    
    // Auto-capture coordinates for new record
    try {
      const coords = await captureCoordinates();
      iniciais.value.coordenadas = coords;
    } catch {
      // GPS failed silently - user can click refresh button manually
      const ui = useUIStore();
      ui.showToast('GPS não disponível. Clique no botão ↻ para tentar novamente.', false);
    }
  }

  // ── Watchers ───────────────────────────────────────────────────────────
  watch(
    [iniciais, retorno, equipamentos, composicao, tipoOrdem],
    () => {
      validateIniciais();
      debouncedSave();
    },
    { deep: true }
  );

  return {
    // State
    iniciais,
    retorno,
    equipamentos,
    attachments,
    composicao,
    currentUUID,
    status,
    createdAt,
    updatedAt,
    sentData,
    tipoOrdem,
    iniciaisValido,
    attachmentCount,
    // Actions
    resetForm,
    validateIniciais,
    setTipoOrdem,
    markAttachmentsDirty,
    saveDraft,
    loadRecord,
    newRecord,
  };
});