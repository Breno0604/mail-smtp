// src/composables/useValidation.ts
import { useFormStore } from '@/stores/form';
import { iniciaisFields } from '@/constants/fields';

export function useValidation() {
  const form = useFormStore();

  const validateIniciais = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    iniciaisFields.forEach((field) => {
      if (field.obrigatorio) {
        const value = form.iniciais[field.nome];
        if (!value || value.trim() === '') {
          errors.push(`${field.label} é obrigatório`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  const validateRetorno = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    // const tipo = form.iniciais['tipo-ordem'] || '';
    
    // This would need the specific retorno fields for the tipo
    // For now, just return valid
    return { valid: true, errors };
  };

  const validateEquipamentos = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    form.equipamentos.forEach((eq, index) => {
      if (!eq.status || !eq.categoria || !eq.numero) {
        errors.push(`Equipamento ${index + 1}: todos os campos são obrigatórios`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  const validateAll = (): { valid: boolean; errors: string[] } => {
    const allErrors: string[] = [];
    
    const iniciaisResult = validateIniciais();
    const retornoResult = validateRetorno();
    const equipamentosResult = validateEquipamentos();

    allErrors.push(...iniciaisResult.errors);
    allErrors.push(...retornoResult.errors);
    allErrors.push(...equipamentosResult.errors);

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
    };
  };

  return {
    validateIniciais,
    validateRetorno,
    validateEquipamentos,
    validateAll,
  };
}