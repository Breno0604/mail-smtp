<!-- src/components/Sidebar.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useFormStore } from '@/stores/form';
import { useUIStore } from '@/stores/ui';
import { db } from '@/db';
import type { RecordData } from '@/types';
import { formatDate } from '@/utils/format';

const form = useFormStore();
const ui = useUIStore();

const isOpen = ref(false);
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
    r.iniciais.uc?.toLowerCase().includes(f) ||
    r.iniciais.os?.toLowerCase().includes(f)
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

function openSidebar() {
  isOpen.value = true;
  loadRecords();
}

function closeSidebar() {
  isOpen.value = false;
  filter.value = '';
}

async function editRecord(record: RecordData) {
  await form.loadRecord(record.uuid);
  closeSidebar();
}

async function deleteRecord(record: RecordData) {
  const confirmed = await ui.showConfirm(`Excluir registro ${record.uuid.slice(0,8)}?`);
  if (confirmed) {
    await db.records.delete(record.uuid);
    await db.attachments.where('uuid').equals(record.uuid).delete();
    await loadRecords();
  }
}

onMounted(() => {
  loadRecords();
});
</script>

<template>
  <!-- Sidebar trigger button - rendered in header slot -->
  <button 
    v-if="!isOpen"
    @click="openSidebar"
    class="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
    aria-label="Abrir registros"
  >
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  </button>

  <!-- Sidebar overlay -->
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50">
      <!-- Backdrop -->
      <div 
        class="absolute inset-0 bg-black/50" 
        @click="closeSidebar"
      />
      
      <!-- Sidebar panel -->
      <div class="absolute left-0 top-0 h-full w-96 bg-white shadow-xl overflow-y-auto">
        <div class="p-4 border-b flex justify-between items-center">
          <h3 class="text-lg font-semibold">Registros Salvos</h3>
          <button 
            @click="closeSidebar"
            class="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        <div class="p-4 border-b">
          <input 
            type="text"
            v-model="filter"
            placeholder="Buscar por UC, OS, Tipo..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div class="p-4">
          <div v-if="loading" class="text-center text-gray-500 py-8">
            Carregando...
          </div>
          
          <div v-else-if="filteredRecords.length === 0" class="text-center text-gray-500 py-8">
            Nenhum registro encontrado.
          </div>
          
          <ul v-else class="space-y-2">
            <li 
              v-for="record in filteredRecords" 
              :key="record.uuid"
              class="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
            >
              <div @click="editRecord(record)" class="flex-1 min-w-0">
                <p class="sidebar-item-title font-medium text-sm">{{ getRecordSummary(record) }}</p>
                <p class="sidebar-item-meta text-xs text-gray-500">
                  {{ formatDate(record.updatedAt.split('T')[0]) }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <span 
                  :class="record.status === 'sent' ? 'status-sent' : 'status-draft'"
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ record.status === 'sent' ? 'Enviado' : 'Rascunho' }}
                </span>
                <div class="flex gap-1">
                  <button 
                    @click.stop="editRecord(record)"
                    class="sidebar-btn sidebar-btn-edit px-2 py-1 text-xs rounded"
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    @click.stop="deleteRecord(record)"
                    class="sidebar-btn sidebar-btn-delete px-2 py-1 text-xs rounded"
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.sidebar-item-title {
  @apply font-medium text-sm;
}
.sidebar-item-meta {
  @apply text-xs text-gray-400;
}
.status-sent {
  @apply bg-green-100 text-green-800;
}
.status-draft {
  @apply bg-yellow-100 text-yellow-800;
}
.sidebar-btn {
  @apply transition-colors;
}
.sidebar-btn-edit {
  @apply bg-blue-100 text-blue-700 hover:bg-blue-200;
}
.sidebar-btn-delete {
  @apply bg-red-100 text-red-700 hover:bg-red-200;
}
</style>