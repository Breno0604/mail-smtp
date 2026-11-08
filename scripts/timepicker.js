// scripts/timepicker.js
// Seletor de horário em modal com duas rodas independentes (hora e minuto).
// Substitui o seletor nativo: o campo só recebe o valor depois de "Salvar".

const ITEM_HEIGHT = 44;
const MINUTE_STEP = 5;
const MINUTES_IN_HOUR = 60;

export const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

/**
 * Minutos oferecidos na roda: de 5 em 5, mais o minuto atual do campo quando
 * ele estiver fora da grade — assim abrir o modal não altera o valor salvo.
 */
export function buildMinutes(selected) {
  const minutes = [];
  for (let minute = 0; minute < MINUTES_IN_HOUR; minute += MINUTE_STEP) {
    minutes.push(minute);
  }
  if (Number.isInteger(selected) && !minutes.includes(selected)) {
    minutes.push(selected);
    minutes.sort((a, b) => a - b);
  }
  return minutes;
}

/**
 * Lê o horário do campo. Valor ausente ou inválido cai no horário atual do
 * dispositivo, arredondado para a grade de 5 minutos.
 */
export function splitTime(value, now = new Date()) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? '').trim());
  if (match) {
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour < 24 && minute < MINUTES_IN_HOUR) return { hour, minute };
  }

  const roundedMinute = Math.min(
    Math.round(now.getMinutes() / MINUTE_STEP) * MINUTE_STEP,
    MINUTES_IN_HOUR - MINUTE_STEP
  );
  return { hour: now.getHours(), minute: roundedMinute };
}

export function formatTime(hour, minute) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Item central da roda a partir da posição da rolagem. */
export function indexFromScroll(scrollTop, total) {
  const index = Math.round(scrollTop / ITEM_HEIGHT);
  return Math.min(Math.max(index, 0), Math.max(total - 1, 0));
}

// ── roda ─────────────────────────────────────────────────────────────────────

function createWheel({ unit, label }) {
  const band = document.createElement('div');
  band.className = 'time-picker-band';
  band.setAttribute('aria-hidden', 'true');

  const wheel = document.createElement('div');
  wheel.className = 'time-picker-wheel';
  wheel.dataset.unit = unit;
  wheel.setAttribute('role', 'listbox');
  wheel.setAttribute('aria-label', label);
  wheel.tabIndex = 0;

  const frame = document.createElement('div');
  frame.className = 'time-picker-frame';
  frame.append(band, wheel);

  const caption = document.createElement('span');
  caption.className = 'time-picker-caption';
  caption.textContent = label;

  const column = document.createElement('div');
  column.className = 'time-picker-column';
  column.append(caption, frame);

  let values = [];
  let index = 0;

  const options = () => [...wheel.querySelectorAll('.time-picker-option')];

  function select(next, { scroll = false } = {}) {
    index = Math.min(Math.max(next, 0), Math.max(values.length - 1, 0));
    options().forEach((option, position) => {
      const isActive = position === index;
      option.classList.toggle('active', isActive);
      option.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    if (scroll) wheel.scrollTop = index * ITEM_HEIGHT;
  }

  function spacer() {
    const element = document.createElement('div');
    element.className = 'time-picker-spacer';
    element.setAttribute('aria-hidden', 'true');
    return element;
  }

  function load(nextValues, selectedValue) {
    values = nextValues;

    const items = [spacer()];
    values.forEach(value => {
      const option = document.createElement('div');
      option.className = 'time-picker-option';
      option.dataset.value = String(value);
      option.setAttribute('role', 'option');
      option.textContent = String(value).padStart(2, '0');
      items.push(option);
    });
    items.push(spacer());

    wheel.replaceChildren(...items);
    select(Math.max(values.indexOf(selectedValue), 0), { scroll: true });
  }

  wheel.addEventListener('scroll', () => select(indexFromScroll(wheel.scrollTop, values.length)));

  wheel.addEventListener('click', event => {
    const option = event.target.closest('.time-picker-option');
    if (!option || !wheel.contains(option)) return;
    select(values.indexOf(Number(option.dataset.value)), { scroll: true });
  });

  wheel.addEventListener('keydown', event => {
    const steps = { ArrowUp: -1, ArrowDown: 1, PageUp: -5, PageDown: 5 };
    if (event.key in steps) {
      event.preventDefault();
      select(index + steps[event.key], { scroll: true });
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      select(event.key === 'Home' ? 0 : values.length - 1, { scroll: true });
    }
  });

  return {
    column,
    load,
    get value() {
      return values[index];
    },
  };
}

// ── modal ────────────────────────────────────────────────────────────────────

let ui = null;
let active = null;

function createUI() {
  const overlay = document.createElement('div');
  overlay.id = 'time-picker';
  overlay.className =
    'modal-overlay fixed inset-0 bg-black/40 z-50 flex items-center justify-center hidden';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'time-picker-title');

  const box = document.createElement('div');
  box.className = 'modal bg-white rounded-[10px] p-7 max-w-[420px] w-[90%] shadow-xl';

  const title = document.createElement('p');
  title.id = 'time-picker-title';
  title.className = 'text-base font-bold text-slate-900 mb-4 text-center';

  const hourWheel = createWheel({ unit: 'hour', label: 'Hora' });
  const minuteWheel = createWheel({ unit: 'minute', label: 'Minuto' });

  const columns = document.createElement('div');
  columns.className = 'time-picker-columns';
  columns.append(hourWheel.column, minuteWheel.column);

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.dataset.action = 'cancel';
  cancelBtn.textContent = 'Cancelar';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'btn btn-primary';
  saveBtn.dataset.action = 'save';
  saveBtn.textContent = 'Salvar';

  const actions = document.createElement('div');
  actions.className = 'flex gap-3 justify-center mt-6';
  actions.append(cancelBtn, saveBtn);

  box.append(title, columns, actions);
  overlay.append(box);
  document.body.append(overlay);

  return { overlay, title, hourWheel, minuteWheel, cancelBtn, saveBtn };
}

function ensureUI() {
  // O modal some se o body for recriado (testes); recria quando desconectado.
  if (!ui || !ui.overlay.isConnected) {
    active = null;
    ui = createUI();
  }
  return ui;
}

function close(result) {
  if (!active) return;
  const { ui: current, resolve } = active;
  active = null;

  current.overlay.classList.add('hidden');
  current.saveBtn.onclick = null;
  current.cancelBtn.onclick = null;
  current.overlay.onclick = null;

  resolve(result);
}

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && active) close(null);
});

/**
 * Abre o seletor e resolve com "HH:MM" ao salvar, ou null ao cancelar.
 * O campo não é alterado aqui — quem chamou decide o que fazer com o resultado.
 */
export function openTimePicker({ title = 'Horário', value = '', now = new Date() } = {}) {
  const current = ensureUI();
  if (active) return Promise.resolve(null);

  const { hour, minute } = splitTime(value, now);

  current.title.textContent = title;
  // Visível antes de posicionar as rodas: com o modal escondido não há layout
  // e o navegador ignora o scrollTop (abriria sempre na primeira hora).
  current.overlay.classList.remove('hidden');
  current.hourWheel.load(HOURS, hour);
  current.minuteWheel.load(buildMinutes(minute), minute);

  return new Promise(resolve => {
    active = { ui: current, resolve };

    current.saveBtn.onclick = () =>
      close(formatTime(current.hourWheel.value, current.minuteWheel.value));
    current.cancelBtn.onclick = () => close(null);
    current.overlay.onclick = event => {
      if (event.target === current.overlay) close(null);
    };

    current.saveBtn.focus();
  });
}
