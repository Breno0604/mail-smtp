// styles.js — constantes de classes CSS compartilhadas entre módulos.
// Evita a duplicação de strings longas de Tailwind em iniciais.js e retornos.js.
// Nota: Cores de fundo/borda são controladas via CSS (style.css) para estados dinâmicos.

export const INPUT_CLASS =
  'w-full px-3.5 py-3 border rounded-[10px] text-[15px] font-sans outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/10';

export const SELECT_CLASS = INPUT_CLASS + ' py-3';
