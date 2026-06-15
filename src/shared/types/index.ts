// ── Tipos de domínio compartilhados ──────────────────────────────────────────

export interface IniciaisData {
  uc: string
  os: string
  tipoOrdem: string
  parceiroLider: string
  municipio: string
  placa: string
  data: string          // YYYY-MM-DD
  horaInicio: string    // HH:mm
  horaFim: string       // HH:mm
  coordenadas: string   // "lat, lng" ou "Não disponível"
  notificado: 'SIM' | 'NÃO'
  complemento: string
}

export interface Equipment {
  status: 'Instalado' | 'Retirado'
  categoria: 'Medidor' | 'Display' | 'Conjunto' | 'TC' | 'TP'
  numero: string
}

export interface Composicao {
  complementoCorpo: string
}

export interface SentData {
  sentAt: string  // ISO 8601
  response: string
}

export interface FormRecord {
  uuid: string
  status: 'draft' | 'sent'
  createdAt: string     // ISO 8601
  updatedAt: string     // ISO 8601
  iniciais: IniciaisData
  retorno: Record<string, string>
  tipoOrdem: string
  lastTipoOrdem: string
  equipamentos: Equipment[]
  composicao: Composicao
  attachmentCount: number
  sentData: SentData | null
}

export interface Attachment {
  id: string       // "{uuid}_{index}"
  uuid: string     // FK → records.uuid
  index: number
  name: string
  type: string     // MIME type
  data: string     // Base64
}

// ── Tipos do sistema de campos ───────────────────────────────────────────────

export type FieldTipo = 'text' | 'number' | 'textarea' | 'select' | 'date' | 'time' | 'coordinates' | 'description'

export interface FieldDefinition {
  nome: string
  label: string
  tipo: FieldTipo
  linha?: number
  obrigatorio?: boolean
  opcoes?: string[]
  readonly?: boolean
  condicional?: {
    campoRef: string
    valor: string | string[]
    negado?: boolean
  }
}

export type IniciaisField = FieldDefinition

export interface RetornoField extends FieldDefinition {
  // Herda todos os campos de FieldDefinition
}

// ── Tipos de estado / store ──────────────────────────────────────────────────

export type PeriodoFiltro = 'manha' | 'tarde' | 'noite' | null

export type ToastVariant = 'success' | 'error' | 'warning'

export interface ToastState {
  show: boolean
  message: string
  variant: ToastVariant
  duration: number
}

// ── Constantes ───────────────────────────────────────────────────────────────

export const NOMES_TECNICOS = [
  "ANDRE DE SOUSA CARVALHO",
  "ANTONIO MAURIELLTON DE ARAUJO MARTINS",
  "BERKSON EVANGELISTA DE OLIVEIRA",
  "CARLOS CRISTIANO DO NASCIMENTO SILVA",
  "DIEGO DA SILVA DE LIMA",
  "DOUGLAS MONTEIRO DE ABREU",
  "FRANCISCO ADRIANO DE SOUSA VIANA",
  "JOSE DOGIVAN DA SILVA",
  "LEANDRO OLIVEIRA SOUSA",
  "MARCIO JOHNNATAN CHAGAS CAETANO",
  "RENATO RODRIGUES VIEIRA",
  "VALDI DOS SANTOS VIANA FILHO",
] as const

export const MUNICIPIOS = [
  "ACARAPE", "AQUIRAZ", "ARACOIABA", "ARATUBA", "BARREIRA",
  "BATURITE", "BEBERIBE", "CAPISTRANO", "CASCAVEL", "CAUCAIA",
  "CHOROZINHO", "EUSÉBIO", "FORTALEZA", "GUAIUBA", "GUARAMIRANGA",
  "HORIZONTE", "ITAITINGA", "ITAPIUNA", "MARACANAU", "MARANGUAPE",
  "MULUNGU", "OCARA", "PACAJUS", "PACATUBA", "PACOTI",
  "PALMACIA", "PINDORETAMA", "REDENCAO", "SAO GONCALO",
] as const

export const PLACAS = [
  "RHS6G02", "RIE0D84", "RIH3H88", "SDZ7E43", "SDZ9B15",
  "SDZ9B16", "SRT8J10", "SRW6J12", "SRW6J13", "SRW6J41",
  "TCI4F69", "TUL0I49",
] as const

export const CATEGORIAS_EQUIPAMENTO = [
  "Medidor", "Display", "Conjunto", "TC", "TP",
] as const

export const STATUS_EQUIPAMENTO = [
  "Instalado", "Retirado",
] as const
