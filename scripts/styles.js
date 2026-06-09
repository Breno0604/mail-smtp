// styles.js — constantes de classes CSS compartilhadas entre módulos.
// Evita a duplicação de strings longas de Tailwind em iniciais.js e retornos.js.

export const INPUT_CLASS =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-base font-sans text-slate-800 bg-slate-50/50 outline-none transition-all duration-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder-slate-400";

export const SELECT_CLASS = INPUT_CLASS + " py-3";
