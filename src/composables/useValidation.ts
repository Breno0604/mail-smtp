// src/composables/useValidation.ts
import { useFormStore } from '@/stores/form';
import { iniciaisFields, getRetornoFields } from '@/constants/fields';

export function useValidation() {
  const form = useFormStore();

  const validateIniciais = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    iniciaisFields.forEach((field) => {
      const value = form.iniciais[field.nome];
      
      if (!field.obrigatorio) return;
      if (!value || value.trim() === '') {
        errors.push(`${field.label} é obrigatório`);
      }
    });

    // Special validations
    // UC: apenas números
    const uc = form.iniciais.uc;
    if (uc && !/^\d+$/.test(uc)) {
      errors.push('UC deve conter apenas números');
    }

    // Data: não pode ser futura
    const data = form.iniciais.data;
    if (data) {
      const selectedDate = new Date(data);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate > today) {
        errors.push('Data não pode ser futura');
      }
    }

    // Hora fim deve ser diferente de hora início
    const horaInicio = form.iniciais.hora_inicio;
    const horaFim = form.iniciais.hora_fim;
    if (horaInicio && horaFim && horaInicio === horaFim) {
      errors.push('Hora fim deve ser diferente da hora início');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  const validateRetorno = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const tipo = form.iniciais['tipo-ordem'] || '';
    
    if (!tipo) return { valid: true, errors };

    const retornoFields = getRetornoFields(tipo);

    retornoFields.forEach((field) => {
      if (!field.obrigatorio) return;
      
      const value = form.retorno[field.nome];
      if (!value || value.trim() === '') {
        errors.push(`${field.label} é obrigatório`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  const validateEquipamentos = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const nums: string[] = [];

    form.equipamentos.forEach((eq, index) => {
      if (!eq.status) {
        errors.push(`Equipamento ${index + 1}: selecione o status`);
      }
      if (!eq.categoria) {
        errors.push(`Equipamento ${index + 1}: selecione a categoria`);
      }
      if (!eq.numero || eq.numero.trim() === '') {
        errors.push(`Equipamento ${index + 1}: informe o número`);
      } else {
        // Normalizar número: converter para número se possível
        const normalizedNum = isNaN(Number(eq.numero)) 
          ? eq.numero.replace(/^0+/, '') 
          : String(Number(eq.numero));
        if (nums.includes(normalizedNum)) {
          errors.push(`Equipamento ${index + 1}: número duplicado`);
        } else {
          nums.push(normalizedNum);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  const validateAnexos = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (form.attachments.length > 12) {
      errors.push('Máximo de 12 anexos permitido');
    }

    const oversized = form.attachments.filter((f: any) => f.size > 8 * 1024 * 1024);
    if (oversized.length > 0) {
      errors.push(
        'Anexo(s) excedem 8 MB: ' +
        oversized.map((f: any) => f.name).join(', ') +
        '.'
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  const validateAll = (): { valid: boolean; errors: string[] } => {
    const allErrors: string[] = [];
    
    // Section 1: Iniciais
    const s1 = validateIniciais();
    allErrors.push(...s1.errors);

    // Section 2: Retorno (only if tipo selected)
    const s2 = validateRetorno();
    allErrors.push(...s2.errors);

    // Section 3: Equipamentos
    const s3 = validateEquipamentos();
    allErrors.push(...s3.errors);

    // Section 4: Anexos
    const s4 = validateAnexos();
    allErrors.push(...s4.errors);

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
    };
  };

  return {
    validateIniciais,
    validateRetorno,
    validateEquipamentos,
    validateAnexos,
    validateAll,
  };
}