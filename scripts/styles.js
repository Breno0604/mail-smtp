// styles.js — constantes de classes CSS compartilhadas entre módulos.
// Evita a duplicação de strings longas de Tailwind em iniciais.js e retornos.js.

export const INPUT_CLASS =
  "w-full px-3.5 py-3 border border-slate-200 rounded-[10px] text-[15px] font-sans text-slate-900 bg-white outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder-slate-400";

export const SELECT_CLASS = INPUT_CLASS + " py-3";
