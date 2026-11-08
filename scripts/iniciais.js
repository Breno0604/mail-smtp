import { DOM } from './dom.js';
import { debouncedSave } from './persistence.js';
import { addBlurValidation, validateCoordinates } from './validation.js';
import { showConfirm, showToast, clearFieldError, setFieldError } from './ui.js';
import { iniciaisFields } from './fields.js';
import { captureCoordinates, insertDecimalPoint, normalizeCoordinateSigns } from './utils.js';
import { INPUT_CLASS, SELECT_CLASS } from './styles.js';

const linhaConfig = {
  4: 'grid grid-cols-2 gap-3 mb-4',
  5: 'grid grid-cols-2 gap-3 mb-4',
  6: 'linha-data gap-3 mb-4',
};

// ── criadores de campo por tipo ───────────────────────────────────────────────

function createSelectInput(field) {
  const input = document.createElement('select');
  input.className = SELECT_CLASS;
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Selecione';
  input.appendChild(placeholder);
  (field.opcoes || []).forEach(opt => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt;
    input.appendChild(option);
  });
  return input;
}

function createNumberInput() {
  const input = document.createElement('input');
  input.type = 'text';
  input.inputMode = 'numeric';
  input.pattern = '[0-9]*';
  input.className = INPUT_CLASS;
  return input;
}

function createDateInput() {
  const input = document.createElement('input');
  input.type = 'date';
  input.className = INPUT_CLASS;
  return input;
}

function createTimeInput() {
  const input = document.createElement('input');
  input.type = 'time';
  input.step = '300';
  input.className = INPUT_CLASS;
  return input;
}

function createTextInput() {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = INPUT_CLASS;
  return input;
}

function createTextareaInput() {
  const input = document.createElement('textarea');
  input.rows = 4;
  input.className = INPUT_CLASS + ' resize-y min-h-[80px]';
  return input;
}

/**
 * Insere os sinais negativos obrigatórios sem atrapalhar a digitação:
 * repõe o cursor depois do caractere inserido antes dele.
 */
function applyCoordinateMask(input) {
  const antes = input.value;
  const depois = normalizeCoordinateSigns(antes);
  if (depois === antes) return;

  const caret = input.selectionStart ?? depois.length;
  input.value = depois;

  if (document.activeElement === input) {
    const posicao = Math.min(depois.length, caret + (depois.length - antes.length));
    input.setSelectionRange(posicao, posicao);
  }
}

/**
 * Aplica o ponto decimal automático preservando a posição do cursor.
 * Ignorado ao apagar, para não devolver o ponto que o usuário acabou de excluir.
 */
function applyDecimalPointMask(input, inputType) {
  if (String(inputType).startsWith('delete')) return;

  const antes = input.value;
  const { value, caret } = insertDecimalPoint(antes, input.selectionStart ?? antes.length);
  if (value === antes) return;

  input.value = value;
  if (document.activeElement === input) input.setSelectionRange(caret, caret);
}

// Criador especial: widget de coordenadas com preenchimento manual e botão de localização.
// Retorna o group diretamente (já inclui o wrapper interno).
// O formato só é cobrado ao sair do campo ou no envio: enquanto digita, nada de erro.
function createCoordinatesGroup(field, label) {
  const coordWrapper = document.createElement('div');
  coordWrapper.className = 'coord-wrapper';

  const input = document.createElement('input');
  input.id = field.nome;
  input.type = 'text';
  // Teclado numérico no celular; o sinal negativo obrigatório vem do mask.
  input.inputMode = 'decimal';
  input.autocomplete = 'off';
  input.className = INPUT_CLASS + ' coord-input';
  input.placeholder = '-3.1245,-38.4156';
  if (field.obrigatorio) input.setAttribute('data-required', '');

  const refreshBtn = document.createElement('button');
  refreshBtn.type = 'button';
  refreshBtn.className = 'coord-refresh';
  refreshBtn.innerHTML = '&#x21BB;';
  refreshBtn.title = 'Atualizar coordenadas';
  refreshBtn.addEventListener('click', async e => {
    e.preventDefault();

    // Confirma apenas quando há um valor que será substituído.
    if (input.value.trim() !== '') {
      const confirmed = await showConfirm(
        'Deseja atualizar as coordenadas GPS? A localização atual será substituída.'
      );
      if (!confirmed) return;
    }

    const ok = await captureCoordinates();
    if (!ok) {
      showToast(
        'Não foi possível obter a localização. Verifique a permissão do navegador e o formato -3.12345678,-38.41567890.',
        false
      );
    }
  });

  const coordError = document.createElement('span');
  coordError.className = 'field-error';

  const limparErroCoordenadas = () => {
    input.classList.remove('error');
    clearFieldError(input);
  };

  // Regra única (formato + limites), a mesma usada na seção 1 e no envio.
  const acusarSeInvalido = () => {
    if (input.value.trim() === '') return limparErroCoordenadas();
    validateCoordinates();
  };

  input.addEventListener('input', e => {
    applyCoordinateMask(input);
    applyDecimalPointMask(input, e.inputType);
    // O aviso de formato só aparece ao sair do campo (ou no envio).
    limparErroCoordenadas();
  });

  input.addEventListener('blur', () => {
    if (input.value.trim() === '') {
      input.classList.add('error');
      setFieldError(input, 'Campo obrigatório');
      return;
    }

    acusarSeInvalido();
  });

  coordWrapper.appendChild(input);
  coordWrapper.appendChild(refreshBtn);
  coordWrapper.appendChild(coordError);

  const group = document.createElement('div');
  group.appendChild(label);
  group.appendChild(coordWrapper);
  return group;
}

// Tabela de criadores — evita if/else if encadeados em renderIniciais
export const INPUT_CREATORS = {
  select: createSelectInput,
  number: createNumberInput,
  date: createDateInput,
  time: createTimeInput,
  text: createTextInput,
  textarea: createTextareaInput,
};

// ── funções exportadas ────────────────────────────────────────────────────────

export function renderIniciais() {
  DOM.iniciaisCampos.innerHTML = '';

  let currentLinha = null;
  let wrapper = null;

  iniciaisFields.forEach(field => {
    if (field.linha !== currentLinha) {
      const config = linhaConfig[field.linha] || 'mb-4';
      wrapper = document.createElement('div');
      wrapper.className = config;
      DOM.iniciaisCampos.appendChild(wrapper);
      currentLinha = field.linha;
    }

    const label = document.createElement('label');
    label.setAttribute('for', field.nome);
    label.className = 'block font-semibold text-[13px] text-slate-600 mb-1';
    label.innerHTML =
      field.label + (field.obrigatorio ? ' <span class="text-red-600">*</span>' : '');

    // Tipo especial: coordenadas tem layout próprio
    if (field.tipo === 'coordinates') {
      const group = createCoordinatesGroup(field, label);
      wrapper.appendChild(group);
      return;
    }

    const creator = INPUT_CREATORS[field.tipo] ?? createTextInput;
    const input = creator(field);
    input.id = field.nome;
    input.placeholder = field.label;
    if (field.obrigatorio) input.setAttribute('data-required', '');

    // tipoOrdem tem getter no DOM que sempre consulta o DOM ao vivo.
    // Não é necessário (nem possível, pois DOM está congelado) reassigná-lo.

    addBlurValidation(input);
    input.addEventListener('input', debouncedSave);
    input.addEventListener('change', debouncedSave);

    const errorSpan = document.createElement('span');
    errorSpan.className = 'field-error';

    const group = document.createElement('div');
    group.appendChild(label);
    group.appendChild(input);
    group.appendChild(errorSpan);
    wrapper.appendChild(group);
  });
}
