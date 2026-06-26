import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  saveDraft,
  getRecord,
  getAllRecords,
  saveAttachments,
  getAttachmentsByUuid,
  deleteRecord,
} from '../scripts/db.js';
import { generateUUID } from '../scripts/uuid.js';
import { validateBackup } from '../tools/export-indexeddb.js';

/**
 * Cria um registro de teste realista, similar aos dados salvos por persistence.js
 */
function createSampleRecord(overrides = {}) {
  const uuid = generateUUID();
  const now = new Date().toISOString();
  return {
    uuid,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    iniciais: {
      lider: 'ANDRE DE SOUSA CARVALHO',
      parceiro: 'ANTONIO MAURIELLTON DE ARAUJO MARTINS',
      municipio: 'FORTALEZA',
      uc: '12345',
      os: '67890',
      notificado: 'SIM',
      placa: 'RHS6G02',
      data: '2024-03-15',
      hora_inicio: '08:00',
      hora_fim: '17:00',
      coordenadas: '-3.7184, -38.5434',
      'tipo-ordem': 'ADEQUACAO SMF',
    },
    retorno: {
      descricao: 'Serviço de adequação realizado conforme solicitado.',
    },
    tipoOrdem: 'ADEQUACAO SMF',
    equipamentos: {
      instaladoEquip: 'SIM',
      retiradoEquip: 'SIM',
      instalados: {
        medidor: '11111',
        conjunto: '22222',
        display: '33333',
        tc_fase_a: '',
        tc_fase_b: '',
        tc_fase_c: '',
        tp_fase_a: '',
        tp_fase_b: '',
        tp_fase_c: '',
      },
      retirados: {
        medidor: '',
        conjunto: '',
        display: '44444',
        tc_fase_a: '',
        tc_fase_b: '',
        tc_fase_c: '',
        tp_fase_a: '',
        tp_fase_b: '',
        tp_fase_c: '',
      },
      checkboxes: {
        instalados: {
          medidor: true,
          conjunto: true,
          display: true,
          tc_fase_a: false,
          tc_fase_b: false,
          tc_fase_c: false,
          tp_fase_a: false,
          tp_fase_b: false,
          tp_fase_c: false,
        },
        retirados: {
          medidor: false,
          conjunto: false,
          display: true,
          tc_fase_a: false,
          tc_fase_b: false,
          tc_fase_c: false,
          tp_fase_a: false,
          tp_fase_b: false,
          tp_fase_c: false,
        },
      },
    },
    attachmentCount: 2,
    sentData: null,
    ...overrides,
  };
}

describe('Migration Validator — roundtrip dos dados do IndexedDB', () => {
  let record;

  beforeEach(() => {
    record = createSampleRecord();
  });

  afterEach(async () => {
    const all = await getAllRecords();
    for (const r of all) {
      await deleteRecord(r.uuid);
    }
  });

  it('deve salvar e recuperar um registro completo com todos os campos', async () => {
    await saveDraft(record);

    const restored = await getRecord(record.uuid);
    expect(restored).toBeTruthy();
    expect(restored.uuid).toBe(record.uuid);
    expect(restored.status).toBe('draft');
    expect(restored.iniciais.uc).toBe('12345');
    expect(restored.iniciais.os).toBe('67890');
    expect(restored.iniciais['tipo-ordem']).toBe('ADEQUACAO SMF');
    expect(restored.retorno.descricao).toBe('Serviço de adequação realizado conforme solicitado.');
    expect(restored.tipoOrdem).toBe('ADEQUACAO SMF');
    expect(restored.equipamentos.instaladoEquip).toBe('SIM');
    expect(restored.equipamentos.retiradoEquip).toBe('SIM');
    expect(restored.equipamentos.instalados.medidor).toBe('11111');
    expect(restored.equipamentos.retirados.display).toBe('44444');
    expect(restored.attachmentCount).toBe(2);
    expect(restored.createdAt).toBeTruthy();
    expect(restored.updatedAt).toBeTruthy();
  });

  it('deve preservar status sent com sentData', async () => {
    const sentRecord = createSampleRecord({
      status: 'sent',
      sentData: {
        to: ['tecnico@enel.com'],
        subject: 'OS #67890 - UC 12345 - ADEQUACAO SMF',
        sentAt: new Date().toISOString(),
      },
    });
    await saveDraft(sentRecord);

    const restored = await getRecord(sentRecord.uuid);
    expect(restored.status).toBe('sent');
    expect(restored.sentData).toBeTruthy();
    expect(restored.sentData.to).toContain('tecnico@enel.com');
    expect(restored.sentData.subject).toContain('ADEQUACAO SMF');
  });

  it('deve preservar status changed com sentData original', async () => {
    const changedRecord = createSampleRecord({
      status: 'changed',
      sentData: {
        to: ['suporte@enel.com'],
        subject: 'OS #67890 - UC 12345 - ADEQUACAO SMF',
        sentAt: '2024-03-14T10:00:00.000Z',
      },
    });
    await saveDraft(changedRecord);

    const restored = await getRecord(changedRecord.uuid);
    expect(restored.status).toBe('changed');
    expect(restored.sentData.sentAt).toBe('2024-03-14T10:00:00.000Z');
  });

  it('deve preservar campos de retorno com condicionais (UC Cortada)', async () => {
    const ucCortadaRecord = createSampleRecord({
      tipoOrdem: 'INSPECAO UC CORTADA I15',
      iniciais: {
        ...record.iniciais,
        'tipo-ordem': 'INSPECAO UC CORTADA I15',
      },
      retorno: {
        'situacao-cliente': 'CORTADO',
        'viavel-retirar': 'COM MUNK',
        ramal: 'COM RAMAL',
        medicao: 'COM MEDIÇÃO',
        jump: 'COM JUMP',
        chaves: 'COM CHAVE',
        'aplicado-toi': 'SIM',
        toi: 'TOI-12345',
        descricao: 'Inspeção realizada com aplicação de TOI.',
      },
    });
    await saveDraft(ucCortadaRecord);

    const restored = await getRecord(ucCortadaRecord.uuid);
    expect(restored.tipoOrdem).toBe('INSPECAO UC CORTADA I15');
    expect(restored.retorno['situacao-cliente']).toBe('CORTADO');
    expect(restored.retorno['aplicado-toi']).toBe('SIM');
    expect(restored.retorno['toi']).toBe('TOI-12345');
    expect(restored.retorno['descricao']).toBe('Inspeção realizada com aplicação de TOI.');
  });

  it('deve preservar campos de retorno com condicionais negado (DESLIG.PROG)', async () => {
    const desligRecord = createSampleRecord({
      tipoOrdem: 'DESLIG.PROG.MANUTENÇÃO',
      iniciais: {
        ...record.iniciais,
        'tipo-ordem': 'DESLIG.PROG.MANUTENÇÃO',
      },
      retorno: {
        desligamento: 'SEM ACESSO',
        acesso_desligamento: 'Portão trancado',
        descricao: 'Cliente não estava no local.',
      },
    });
    await saveDraft(desligRecord);

    const restored = await getRecord(desligRecord.uuid);
    expect(restored.tipoOrdem).toBe('DESLIG.PROG.MANUTENÇÃO');
    expect(restored.retorno.desligamento).toBe('SEM ACESSO');
    expect(restored.retorno.acesso_desligamento).toBe('Portão trancado');
  });

  it('deve preservar attachmentCount zerado quando não há anexos', async () => {
    const noAttRecord = createSampleRecord({ attachmentCount: 0 });
    await saveDraft(noAttRecord);

    const restored = await getRecord(noAttRecord.uuid);
    expect(restored.attachmentCount).toBe(0);
  });

  it('deve preservar equipamentos com valores vazios (NAO/NAO)', async () => {
    const emptyEquipRecord = createSampleRecord({
      equipamentos: {
        instaladoEquip: 'NAO',
        retiradoEquip: 'NAO',
        instalados: {
          medidor: '',
          conjunto: '',
          display: '',
          tc_fase_a: '',
          tc_fase_b: '',
          tc_fase_c: '',
          tp_fase_a: '',
          tp_fase_b: '',
          tp_fase_c: '',
        },
        retirados: {
          medidor: '',
          conjunto: '',
          display: '',
          tc_fase_a: '',
          tc_fase_b: '',
          tc_fase_c: '',
          tp_fase_a: '',
          tp_fase_b: '',
          tp_fase_c: '',
        },
        checkboxes: {
          instalados: {
            medidor: false,
            conjunto: false,
            display: false,
            tc_fase_a: false,
            tc_fase_b: false,
            tc_fase_c: false,
            tp_fase_a: false,
            tp_fase_b: false,
            tp_fase_c: false,
          },
          retirados: {
            medidor: false,
            conjunto: false,
            display: false,
            tc_fase_a: false,
            tc_fase_b: false,
            tc_fase_c: false,
            tp_fase_a: false,
            tp_fase_b: false,
            tp_fase_c: false,
          },
        },
      },
    });
    await saveDraft(emptyEquipRecord);

    const restored = await getRecord(emptyEquipRecord.uuid);
    expect(restored.equipamentos.instaladoEquip).toBe('NAO');
    expect(restored.equipamentos.retiradoEquip).toBe('NAO');
    expect(restored.equipamentos.instalados.medidor).toBe('');
    expect(restored.equipamentos.instalados.conjunto).toBe('');
  });

  it('deve salvar e recuperar anexos no store separado (v3)', async () => {
    await saveDraft(record);

    const attachments = [
      { name: 'foto_medidor.jpg', type: 'image/jpeg', data: 'c29tZSBmYWtlIGltYWdlIGRhdGE=' },
      { name: 'corte_executado.jpg', type: 'image/jpeg', data: 'YW5vdGhlciBmYWtlIGltYWdl' },
    ];
    await saveAttachments(record.uuid, attachments);

    const storedAtts = await getAttachmentsByUuid(record.uuid);
    expect(storedAtts).toHaveLength(2);
    expect(storedAtts[0].name).toBe('foto_medidor.jpg');
    expect(storedAtts[1].name).toBe('corte_executado.jpg');
    expect(storedAtts[0].data).toBe('c29tZSBmYWtlIGltYWdlIGRhdGE=');
  });

  it('deve preservar created_at entre saves subsequentes', async () => {
    await saveDraft(record);

    // Simular um segundo save (como se o usuário tivesse editado)
    // Usar timestamp +5s para garantir que seja diferente do original
    const updated = { ...record, updatedAt: new Date(Date.now() + 5000).toISOString() };
    updated.iniciais = { ...updated.iniciais, placa: 'RIE0D84' };
    await saveDraft(updated);

    const restored = await getRecord(record.uuid);
    expect(restored.createdAt).toBe(record.createdAt); // createdAt NÃO muda
    expect(restored.updatedAt).not.toBe(record.updatedAt); // updatedAt muda
    expect(restored.iniciais.placa).toBe('RIE0D84');
  });

  it('deve listar múltiplos registros corretamente', async () => {
    const r1 = createSampleRecord({ iniciais: { ...record.iniciais, uc: '111', os: 'AAA' } });
    const r2 = createSampleRecord({ iniciais: { ...record.iniciais, uc: '222', os: 'BBB' } });
    const r3 = createSampleRecord({ iniciais: { ...record.iniciais, uc: '333', os: 'CCC' } });

    await saveDraft(r1);
    await saveDraft(r2);
    await saveDraft(r3);

    const all = await getAllRecords();
    expect(all).toHaveLength(3);

    const ucs = all.map(r => r.iniciais.uc).sort();
    expect(ucs).toEqual(['111', '222', '333']);
  });

  it('deve exportar dados no formato esperado pelo script de migração', async () => {
    await saveDraft(record);
    const attachments = [{ name: 'foto.jpg', type: 'image/jpeg', data: 'ZGF0YQ==' }];
    await saveAttachments(record.uuid, attachments);

    // Simula o que o export-indexeddb.js faria: ler todos os records + attachments
    const exportedRecords = await getAllRecords();
    const exportedAtts = await getAttachmentsByUuid(record.uuid);

    // Validar estrutura compatível com o schema de migração
    expect(exportedRecords).toHaveLength(1);
    expect(exportedRecords[0]).toHaveProperty('uuid');
    expect(exportedRecords[0]).toHaveProperty('status');
    expect(exportedRecords[0]).toHaveProperty('iniciais');
    expect(exportedRecords[0]).toHaveProperty('retorno');
    expect(exportedRecords[0]).toHaveProperty('equipamentos');
    expect(exportedRecords[0]).toHaveProperty('attachmentCount');

    expect(exportedAtts).toHaveLength(1);
    expect(exportedAtts[0]).toHaveProperty('name');
    expect(exportedAtts[0]).toHaveProperty('type');
    expect(exportedAtts[0]).toHaveProperty('data');

    // Verificar que o JSON serializável não perde dados
    const json = JSON.stringify(exportedRecords[0]);
    const parsed = JSON.parse(json);
    expect(parsed.uuid).toBe(record.uuid);
    expect(parsed.iniciais.uc).toBe('12345');
    expect(parsed.equipamentos.instaladoEquip).toBe('SIM');
    expect(parsed.attachmentCount).toBe(2);
  });

  it('validateBackup deve aprovar dados válidos (sem anexos)', async () => {
    // Usar record com attachmentCount=0 para não disparar validação de consistência
    const noAttRecord = createSampleRecord({ attachmentCount: 0 });
    await saveDraft(noAttRecord);

    const exportedRecords = await getAllRecords();

    const backup = {
      version: 3,
      exportedAt: new Date().toISOString(),
      recordCount: exportedRecords.length,
      attachmentCount: 0,
      records: exportedRecords,
      attachments: [],
    };

    const result = validateBackup(backup);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('validateBackup deve rejeitar dados com campos ausentes', async () => {
    const backup = {
      version: 3,
      exportedAt: new Date().toISOString(),
      recordCount: 1,
      attachmentCount: 0,
      records: [
        {
          // uuid ausente intencionalmente
          status: 'draft',
          iniciais: {},
          retorno: {},
          tipoOrdem: '',
          equipamentos: null,
          attachmentCount: 0,
          sentData: null,
        },
      ],
      attachments: [],
    };

    const result = validateBackup(backup);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('uuid');
  });

  it('deve simular ciclo completo de migração: save → export JSON → parse → validar', async () => {
    // 1. Salva record com dados reais
    const migrationRecord = createSampleRecord({
      status: 'sent',
      sentData: {
        to: ['campo@enel.com'],
        subject: 'OS #67890 - UC 12345 - ADEQUACAO SMF',
        sentAt: '2024-06-01T08:30:00.000Z',
      },
      retorno: {
        descricao: 'Serviço concluído com sucesso.',
      },
    });
    await saveDraft(migrationRecord);

    const atts = [
      { name: 'antes.jpg', type: 'image/jpeg', data: 'YW50ZXM=' },
      { name: 'depois.jpg', type: 'image/jpeg', data: 'ZGVwb2lz' },
    ];
    await saveAttachments(migrationRecord.uuid, atts);

    // 2. Exporta (simula export-indexeddb.js: getAllRecords + getAttachmentsByUuid)
    const exportedRecords = await getAllRecords();
    const exportedAtts = await getAttachmentsByUuid(migrationRecord.uuid);

    expect(exportedRecords).toHaveLength(1);
    expect(exportedAtts).toHaveLength(2);

    // 3. Serializa para JSON string (simula download do arquivo)
    const exportData = {
      version: 3,
      exportedAt: new Date().toISOString(),
      recordCount: exportedRecords.length,
      attachmentCount: exportedAtts.length,
      records: exportedRecords,
      attachments: exportedAtts,
    };
    const jsonString = JSON.stringify(exportData);
    expect(typeof jsonString).toBe('string');
    expect(jsonString.length).toBeGreaterThan(0);

    // 4. Parseia o JSON (simula importação no app Vue)
    const imported = JSON.parse(jsonString);

    // 5. Verifica que todos os campos sobrevivem ao ciclo de serialização
    expect(imported.records).toHaveLength(1);
    expect(imported.attachments).toHaveLength(2);

    const importedRecord = imported.records[0];
    expect(importedRecord.uuid).toBe(migrationRecord.uuid);
    expect(importedRecord.status).toBe('sent');
    expect(importedRecord.iniciais.uc).toBe('12345');
    expect(importedRecord.iniciais.os).toBe('67890');
    expect(importedRecord.iniciais['tipo-ordem']).toBe('ADEQUACAO SMF');
    expect(importedRecord.retorno.descricao).toBe('Serviço concluído com sucesso.');
    expect(importedRecord.tipoOrdem).toBe('ADEQUACAO SMF');
    expect(importedRecord.equipamentos.instaladoEquip).toBe('SIM');
    expect(importedRecord.equipamentos.instalados.medidor).toBe('11111');
    expect(importedRecord.equipamentos.retirados.display).toBe('44444');
    expect(importedRecord.sentData.sentAt).toBe('2024-06-01T08:30:00.000Z');
    expect(importedRecord.createdAt).toBeTruthy();
    expect(importedRecord.updatedAt).toBeTruthy();

    // 6. Verifica que attachments exportados mantêm dados
    expect(imported.attachments[0].name).toBe('antes.jpg');
    expect(imported.attachments[0].data).toBe('YW50ZXM=');
    expect(imported.attachments[1].name).toBe('depois.jpg');
    expect(imported.attachments[1].data).toBe('ZGVwb2lz');

    // 7. NÃO deve ter attachments inline no record (formato v3)
    expect(importedRecord.attachments).toBeUndefined();
  });

  it('deve simular migração de registro com campos especiais (acentos, caracteres)', async () => {
    const specialRecord = createSampleRecord({
      iniciais: {
        ...record.iniciais,
        lider: 'FRANCISCO ADRIANO DE SOUSA VIANA',
        municipio: 'MARACANAÚ',
        'tipo-ordem': 'DESLIG.PROG.MANUTENÇÃO',
        placa: 'SRW6J12',
      },
      tipoOrdem: 'DESLIG.PROG.MANUTENÇÃO',
      retorno: {
        desligamento: 'SEM ACESSO',
        acesso_desligamento: 'Portão com cerca elétrica - sem responsável',
        descricao: 'Cliente não atendeu às tentativas de contato.',
      },
    });
    await saveDraft(specialRecord);

    const exported = await getAllRecords();
    const json = JSON.stringify(exported[0]);
    const parsed = JSON.parse(json);

    // Acentos e caracteres especiais devem ser preservados
    expect(parsed.iniciais.municipio).toBe('MARACANAÚ');
    expect(parsed.iniciais['tipo-ordem']).toBe('DESLIG.PROG.MANUTENÇÃO');
    expect(parsed.tipoOrdem).toBe('DESLIG.PROG.MANUTENÇÃO');
    expect(parsed.retorno.desligamento).toBe('SEM ACESSO');
    expect(parsed.retorno.acesso_desligamento).toBe('Portão com cerca elétrica - sem responsável');
  });
});
