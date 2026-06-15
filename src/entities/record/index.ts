import type { FormRecord } from '@/shared/types'
import { getAllRecords, getRecord, saveRecord, deleteRecordWithAttachments } from '@/shared/lib/db'

export type RecordStatus = 'draft' | 'sent'

export async function fetchAll(): Promise<FormRecord[]> {
  return getAllRecords()
}

export async function fetchOne(uuid: string): Promise<FormRecord | undefined> {
  return getRecord(uuid)
}

export async function persist(record: FormRecord): Promise<void> {
  return saveRecord(record)
}

export async function remove(uuid: string): Promise<void> {
  return deleteRecordWithAttachments(uuid)
}

export function createEmpty(overrides?: Partial<FormRecord>): FormRecord {
  const now = new Date().toISOString()
  return {
    uuid: crypto.randomUUID(),
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    iniciais: {
      uc: '',
      os: '',
      tipoOrdem: '',
      parceiroLider: '',
      municipio: '',
      placa: '',
      data: '',
      horaInicio: '',
      horaFim: '',
      coordenadas: 'Não disponível',
      notificado: 'NÃO',
      complemento: '',
    },
    retorno: {},
    tipoOrdem: '',
    lastTipoOrdem: '',
    equipamentos: [],
    composicao: { complementoCorpo: '' },
    attachmentCount: 0,
    sentData: null,
    ...overrides,
  }
}

export type { FormRecord }
