// storage.js — operações puras de localStorage, sem dependências de outros módulos.
// Quebra o ciclo de importação: state.js → persistence.js → state.js.
const UUID_KEY = "currentUUID";

export const getRawUUID = () => localStorage.getItem(UUID_KEY) || "";
export const storeUUID = (uuid) => localStorage.setItem(UUID_KEY, uuid);
export const removeUUID = () => localStorage.removeItem(UUID_KEY);
