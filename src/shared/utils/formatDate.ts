/**
 * Inverte data de YYYY-MM-DD para DD-MM-YYYY (uso no corpo do email)
 */
export function formatDate(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) return dateStr
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parts[2]}-${parts[1]}-${parts[0]}`
}
