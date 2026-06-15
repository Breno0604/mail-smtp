import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendEmail } from './sendEmail'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('sendEmail', () => {
  it('retorna success quando response.ok', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    ) as any

    const result = await sendEmail({ subject: 'Test', text: 'Body' })
    expect(result.success).toBe(true)
    expect(result.message).toBe('OS enviada com sucesso!')
  })

  it('retorna error quando response nao ok', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'SMTP config error' }),
      })
    ) as any

    const result = await sendEmail({ subject: 'Test', text: 'Body' })
    expect(result.success).toBe(false)
    expect(result.message).toBe('SMTP config error')
  })

  it('retorna mensagem generica se nao ha error no response', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      })
    ) as any

    const result = await sendEmail({ subject: 'Test', text: 'Body' })
    expect(result.success).toBe(false)
    expect(result.message).toBe('Erro ao enviar OS')
  })

  it('retorna error de conexao quando fetch lanca excecao', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('Network failure'))) as any

    const result = await sendEmail({ subject: 'Test', text: 'Body' })
    expect(result.success).toBe(false)
    expect(result.message).toBe('Network failure')
  })

  it('mapeia attachments para formato do backend', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    ) as any
    globalThis.fetch = fetchMock

    await sendEmail({
      subject: 'Test',
      text: 'Body',
      attachments: [{ name: 'foto.jpg', data: 'data:image/jpeg;base64,abc123' }],
    })

    const callBody = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(callBody.attachments).toEqual([{ filename: 'foto.jpg', content: 'data:image/jpeg;base64,abc123' }])
  })

  it('faz post para /.netlify/functions/send', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    ) as any
    globalThis.fetch = fetchMock

    await sendEmail({ subject: 'Test', text: 'Body' })
    expect(fetchMock.mock.calls[0][0]).toBe('/.netlify/functions/send')
    expect(fetchMock.mock.calls[0][1].method).toBe('POST')
  })
})
