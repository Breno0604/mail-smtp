import { DOM } from './dom.js';
import { debouncedSave } from './persistence.js';
import { addBlurValidation } from './validation.js';
import { showConfirm } from './ui.js';
import { iniciaisFields } from './fields.js';
import { captureCoordinates } from './utils.js';
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

// Criador especial: widget de coordenadas com botão de refresh.
// Retorna o group diretamente (já inclui o wrapper interno) e atualiza DOM.tipoOrdem se aplicável.
function createCoordinatesGroup(field, label) {
  const coordWrapper = document.createElement('div');
  coordWrapper.className = 'coord-wrapper';

  const input = document.createElement('input');
  input.id = field.nome;
  input.type = 'text';
  input.readOnly = true;
  input.className = INPUT_CLASS + ' bg-slate-100 cursor-not-allowed coord-input';
  input.placeholder = 'Coletando coordenadas...';

  const refreshBtn = document.createElement('button');
  refreshBtn.type = 'button';
  refreshBtn.className = 'coord-refresh';
  refreshBtn.innerHTML = '&#x21BB;';
  refreshBtn.title = 'Atualizar coordenadas';
  refreshBtn.addEventListener('click', async e => {
    e.preventDefault();
    const confirmed = await showConfirm(
      'Deseja atualizar as coordenadas GPS? A localização atual será substituída.'
    );
    if (confirmed) captureCoordinates();
  });

  const coordError = document.createElement('span');
  coordError.className = 'field-error';

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
