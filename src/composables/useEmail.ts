// src/composables/useEmail.ts
import { computed } from 'vue';
import { useFormStore } from '@/stores/form';
import { iniciaisFields, getRetornoFields } from '@/constants/fields';

/**
 * Normaliza texto: remove acentos, substitui ç→c, converte para MAIÚSCULAS
 */
export function normalizeText(str: string): string {
  if (!str) return str;
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C')
    .toUpperCase();
}

/**
 * Reverses date from YYYY-MM-DD to DD-MM-YYYY
 */
export function reverseDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return parts.reverse().join('-');
}

export function useEmail() {
  const form = useFormStore();

  const composeEmail = computed(() => {
    let body = '';

    // Iniciais fields
    iniciaisFields.forEach((field) => {
      const raw = form.iniciais[field.nome] || '';
      const val = raw && field.tipo === 'date'
        ? reverseDate(raw)
        : (raw || '\u2014');
      body += `${normalizeText(field.label)}: ${normalizeText(val)}\n`;
    });

    // Equipamentos
    if (form.equipamentos && form.equipamentos.length > 0) {
      body += '\n\nEQUIPAMENTOS:';
      form.equipamentos.forEach((eq) => {
        body += `\n${normalizeText(eq.categoria)} ${normalizeText(eq.status)} N\u00BA ${normalizeText(eq.numero || '\u2014')}`;
      });
    }

    // Retorno
    body += '\n\nRETORNO:';
    const tipo = form.iniciais['tipo-ordem'] || '';
    const retornoFields = getRetornoFields(tipo);

    retornoFields.forEach((field) => {
      if (!form.retorno || !(field.nome in form.retorno)) return;
      const val = form.retorno[field.nome];
      body += `\n${normalizeText(field.label)}: ${normalizeText(val || '(nao preenchido)')}`;
    });

    return body;
  });

  return {
    composeEmail,
    normalizeText,
    reverseDate,
  };
}