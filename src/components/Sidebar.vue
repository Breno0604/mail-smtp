<!-- src/components/Sidebar.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useFormStore } from '@/stores/form';
import { useUIStore } from '@/stores/ui';
import { db } from '@/db';
import type { RecordData } from '@/types';
import { formatDate } from '@/utils/format';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const form = useFormStore();
const ui = useUIStore();

const filter = ref('');
const records = ref<RecordData[]>([]);
const loading = ref(false);

async function loadRecords() {
  loading.value = true;
  try {
    const all = await db.records.orderBy('updatedAt').reverse().toArray();
    records.value = all;
  } finally {
    loading.value = false;
  }
}

const filteredRecords = computed(() => {
  if (!filter.value) return records.value;
  const f = filter.value.toLowerCase();
  return records.value.filter(r => 
    r.uuid.toLowerCase().includes(f) ||
    r.tipoOrdem.toLowerCase().includes(f) ||
    (r.iniciais.uc || '').toLowerCase().includes(f) ||
    (r.iniciais.os || '').toLowerCase().includes(f)
  );
});

function getRecordSummary(record: RecordData): string {
  const uc = record.iniciais?.uc || '';
  const os = record.iniciais?.os || '';
  const tipoOrdem = record.tipoOrdem || '';
  if (uc && os && tipoOrdem) return `${uc}-${os}-${tipoOrdem}`;
  if (uc && os) return `${uc}-${os}`;
  if (os) return `OS #${os}`;
  if (uc) return `UC ${uc}`;
  return '(rascunho vazio)';
}

function closeSidebar() {
  filter.value = '';
  emit('close');
}

async function editRecord(record: RecordData) {
  await form.loadRecord(record.uuid);
  closeSidebar();
}

async function deleteRecord(record: RecordData) {
  const confirmed = await ui.showConfirm(`Excluir registro ${getRecordSummary(record)}?`);
  if (confirmed) {
    await db.records.delete(record.uuid);
    await db.attachments.where('uuid').equals(record.uuid).delete();
    await loadRecords();
  }
}

watch(() => props.isOpen, (open) => {
  if (open) {
    loadRecords();
  }
});
</script>

<template>
  <Teleport to="body">
    <!-- Overlay -->
    <div 
      v-if="isOpen"
      class="sidebar-overlay open"
      @click="closeSidebar"
    />
    
    <!-- Sidebar panel -->
    <div 
      class="sidebar"
      :class="{ open: isOpen }"
    >
      <div class="sidebar-inner">
        <div class="sidebar-head">
          <h2 class="sidebar-title">Registros</h2>
          <button class="sidebar-close" @click="closeSidebar">&times;</button>
        </div>
        
        <input 
          type="search" 
          v-model="filter" 
          placeholder="Buscar por UC, OS ou tipo..." 
          autocomplete="off"
          class="w-full px-4 py-3 mb-3 border border-slate-200 rounded-[10px] text-sm font-sans text-slate-900 bg-white outline-none transition-colors focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />
        
        <div class="sidebar-list">
          <div v-if="loading" class="sidebar-empty">Carregando...</div>
          
          <div v-else-if="filteredRecords.length === 0" class="sidebar-empty">
            Nenhum registro encontrado.
          </div>
          
          <div v-else>
            <div 
              v-for="record in filteredRecords" 
              :key="record.uuid"
              class="sidebar-item"
            >
              <div class="sidebar-item-header">
                <span class="sidebar-item-title">{{ getRecordSummary(record) }}</span>
                <span 
                  :class="record.status === 'sent' ? 'status-sent' : 'status-draft'"
                  class="sidebar-status"
                >
                  {{ record.status === 'sent' ? 'Enviado' : 'Rascunho' }}
                </span>
              </div>
              <div class="sidebar-item-meta">
                {{ formatDate(record.updatedAt.split('T')[0]) }}
              </div>
              <div class="sidebar-item-actions">
                <button 
                  @click="editRecord(record)"
                  class="sidebar-btn sidebar-btn-edit"
                >
                  Editar
                </button>
                <button 
                  @click="deleteRecord(record)"
                  class="sidebar-btn sidebar-btn-delete"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
