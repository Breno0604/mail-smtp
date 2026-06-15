import { z } from 'zod'

export const iniciaisSchema = z.object({
  uc: z.string().min(1, 'UC é obrigatória'),
  os: z.string().min(1, 'OS é obrigatória'),
  tipoOrdem: z.string().min(1, 'Tipo de Ordem é obrigatório'),
  data: z.string().min(1, 'Data é obrigatória'),
  horaInicio: z.string().min(1, 'Hora início é obrigatória'),
  horaFim: z.string().min(1, 'Hora fim é obrigatória'),
})

export type IniciaisFormData = z.infer<typeof iniciaisSchema>
