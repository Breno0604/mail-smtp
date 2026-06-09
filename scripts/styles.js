// styles.js — constantes de classes CSS compartilhadas entre módulos.
// Evita a duplicação de strings longas de Tailwind em iniciais.js e retornos.js.

export const INPUT_CLASS =
  "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base font-sans text-gray-900 bg-white outline-none transition-all focus:border-blue-600 focus:ring-3 focus:ring-blue-600/15";

export const SELECT_CLASS = INPUT_CLASS + " py-3";
