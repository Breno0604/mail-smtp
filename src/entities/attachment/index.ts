import type { Attachment } from '@/shared/types'
import { getAttachmentsByRecord, saveAttachment, deleteAttachment, deleteAttachmentsByRecord } from '@/shared/lib/db'

export async function fetchByRecord(uuid: string): Promise<Attachment[]> {
  return getAttachmentsByRecord(uuid)
}

export async function persist(attachment: Attachment): Promise<void> {
  return saveAttachment(attachment)
}

export async function remove(id: string): Promise<void> {
  return deleteAttachment(id)
}

export async function removeByRecord(uuid: string): Promise<void> {
  return deleteAttachmentsByRecord(uuid)
}

export function createAttachmentId(uuid: string, index: number): string {
  return `${uuid}_${index}`
}

export type { Attachment }
