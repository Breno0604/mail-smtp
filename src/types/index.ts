// src/types/index.ts

/** A single field definition (from fields.js) */
export interface FieldDefinition {
  linha?: number;
  nome: string;
  label: string;
  tipo: 'text' | 'number' | 'select' | 'textarea' | 'date' | 'time' | 'coordinates';
  obrigatorio?: boolean;
  readonly?: boolean;
  opcoes?: string[];
  condicional?: {
    campoRef: string;
    valor: string | string[];
    negado?: boolean;
  };
}

/** Initial form data (kebab-case keys matching field.nome) */
export interface IniciaisData {
  [key: string]: string;
}

/** Retorno form data */
export interface RetornoData {
  [key: string]: string;
}

/** Equipment row */
export interface EquipamentoData {
  status: string;
  categoria: string;
  numero: string;
}

/** A saved record in IndexedDB */
export interface RecordData {
  uuid: string;
  status: 'draft' | 'sent';
  createdAt: string;
  updatedAt: string;
  iniciais: IniciaisData;
  retorno: RetornoData;
  tipoOrdem: string;
  equipamentos: EquipamentoData[];
  composicao: { 'complemento-corpo': string };
  attachmentCount: number;
  sentData: SentData | null;
}

/** Data stored when email is sent successfully */
export interface SentData {
  sentAt: string;
  response?: string;
}

/** Serialized attachment with IndexedDB key */
export interface StoredAttachment {
  id?: number;
  uuid: string;
  index: number;
  name: string;
  type: string;
  data: string;
}

/** Pending offline email send */
export interface PendingSendData {
  id?: number;
  uuid: string;
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
}

/** Validation error for a field */
export interface FieldError {
  field: string;
  message: string;
}