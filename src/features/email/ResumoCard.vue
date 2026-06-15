<script setup lang="ts">
defineProps<{
  title: string
  fields?: Array<{ label: string; value: string }>
}>()
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
    <h3 class="font-bold text-sm uppercase text-slate-700 mb-3">{{ title }}</h3>
    <div v-if="fields && fields.length > 0" class="space-y-1">
      <div v-for="(field, i) in fields" :key="i" class="flex gap-2 text-sm">
        <span class="text-slate-500 shrink-0">{{ field.label }}:</span>
        <span class="text-slate-800 break-all">{{ field.value }}</span>
      </div>
    </div>
    <slot />
  </div>
</template>
