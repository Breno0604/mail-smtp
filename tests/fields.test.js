import { describe, it, expect } from 'vitest';
import { iniciaisFields, getRetornoFields, retornoFieldsByTipo } from '../scripts/fields.js';

describe('fields', () => {
  describe('iniciaisFields', () => {
    it('should be an array', () => {
      expect(Array.isArray(iniciaisFields)).toBe(true);
    });

    it('should have at least 12 entries', () => {
      expect(iniciaisFields.length).toBeGreaterThanOrEqual(12);
    });

    it('should have exactly 12 entries', () => {
      expect(iniciaisFields.length).toBe(12);
    });

    it('should have required fields: lider, parceiro, municipio, uc, os, data, hora_inicio, hora_fim, tipo-ordem, placa, notificado', () => {
      const fields = iniciaisFields.map(f => f.nome);
      expect(fields).toContain('lider');
      expect(fields).toContain('parceiro');
      expect(fields).toContain('municipio');
      expect(fields).toContain('uc');
      expect(fields).toContain('os');
      expect(fields).toContain('data');
      expect(fields).toContain('hora_inicio');
      expect(fields).toContain('hora_fim');
      expect(fields).toContain('tipo-ordem');
      expect(fields).toContain('placa');
      expect(fields).toContain('notificado');
      expect(fields).toContain('coordenadas');
    });

    it('should have correct types for key fields', () => {
      const lider = iniciaisFields.find(f => f.nome === 'lider');
      expect(lider.tipo).toBe('select');
      expect(lider.obrigatorio).toBe(true);

      const uc = iniciaisFields.find(f => f.nome === 'uc');
      expect(uc.tipo).toBe('number');

      const data = iniciaisFields.find(f => f.nome === 'data');
      expect(data.tipo).toBe('date');

      const horaInicio = iniciaisFields.find(f => f.nome === 'hora_inicio');
      expect(horaInicio.tipo).toBe('time');

      const coordenadas = iniciaisFields.find(f => f.nome === 'coordenadas');
      expect(coordenadas.tipo).toBe('coordinates');
      expect(coordenadas.readonly).toBe(true);
    });

    it('should have select fields with options arrays', () => {
      const selectFields = iniciaisFields.filter(f => f.tipo === 'select');
      expect(selectFields.length).toBeGreaterThan(0);
      selectFields.forEach(field => {
        expect(Array.isArray(field.opcoes)).toBe(true);
        expect(field.opcoes.length).toBeGreaterThan(0);
      });
    });

    it('should have lider and parceiro with the same options array (nomesTecnicos)', () => {
      const lider = iniciaisFields.find(f => f.nome === 'lider');
      const parceiro = iniciaisFields.find(f => f.nome === 'parceiro');
      expect(lider.opcoes).toEqual(parceiro.opcoes);
    });

    it('should have at least 10 nomesTecnicos in lider options', () => {
      const lider = iniciaisFields.find(f => f.nome === 'lider');
      expect(lider.opcoes.length).toBeGreaterThanOrEqual(10);
    });

    it('should have at least 29 municipio options', () => {
      const municipio = iniciaisFields.find(f => f.nome === 'municipio');
      expect(municipio.opcoes.length).toBeGreaterThanOrEqual(29);
    });

    it('should have at least 9 placa options', () => {
      const placa = iniciaisFields.find(f => f.nome === 'placa');
      expect(placa.opcoes.length).toBeGreaterThanOrEqual(9);
    });

    it('should have at least 43 tipo-ordem options', () => {
      const tipoOrdem = iniciaisFields.find(f => f.nome === 'tipo-ordem');
      expect(tipoOrdem.opcoes.length).toBeGreaterThanOrEqual(43);
    });

    it('should have notificado with options ["SIM", "NÃO"]', () => {
      const notificado = iniciaisFields.find(f => f.nome === 'notificado');
      expect(notificado.opcoes).toEqual(['SIM', 'NÃO']);
    });

    it('should have all required fields marked as obrigatorio', () => {
      const requiredFields = iniciaisFields.filter(f => f.obrigatorio);
      expect(requiredFields.length).toBeGreaterThanOrEqual(10);
    });

    it('should have unique field names', () => {
      const names = iniciaisFields.map(f => f.nome);
      expect(new Set(names).size).toBe(names.length);
    });

    it('every field should have a label', () => {
      iniciaisFields.forEach(field => {
        expect(field.label).toBeTruthy();
      });
    });
  });

  describe('UC_CORTADA_FIELDS', () => {
    const ucCortadaTipos = [
      'INSPECAO UC CORTADA I15',
      'INSPECAO UC CORTADA I30',
      'INSPECAO UC CORTADA I90',
      'INSPECAO UC CORTADA I180',
    ];

    it('should have exactly 9 fields for each UC Cortada tipo (including descricao)', () => {
      ucCortadaTipos.forEach(tipo => {
        const fields = getRetornoFields(tipo);
        expect(fields.length).toBe(9);
      });
    });

    it('should return the same array reference for all 4 UC Cortada tipos', () => {
      const fields15 = getRetornoFields('INSPECAO UC CORTADA I15');
      const fields30 = getRetornoFields('INSPECAO UC CORTADA I30');
      const fields90 = getRetornoFields('INSPECAO UC CORTADA I90');
      const fields180 = getRetornoFields('INSPECAO UC CORTADA I180');
      expect(fields15).toBe(fields30);
      expect(fields30).toBe(fields90);
      expect(fields90).toBe(fields180);
    });

    it('should have situacao-cliente as first field with correct options', () => {
      const fields = getRetornoFields('INSPECAO UC CORTADA I15');
      const situacao = fields[0];
      expect(situacao.nome).toBe('situacao-cliente');
      expect(situacao.tipo).toBe('select');
      expect(situacao.opcoes).toEqual([
        'CORTADO',
        'AUTO RELIGADO CORTE EXECUTADO',
        'AUTO RELIGADO',
        'SOLICITOU RELIGACAO',
        'NOVO CLIENTE NO LOCAL',
      ]);
    });

    it('should have viavel-retirar as second field with correct options', () => {
      const fields = getRetornoFields('INSPECAO UC CORTADA I15');
      const viavel = fields[1];
      expect(viavel.nome).toBe('viavel-retirar');
      expect(viavel.tipo).toBe('select');
      expect(viavel.opcoes).toEqual(['COM MUNK OU GUINCHO', 'COM MUNK', 'COM LINHA VIVA', 'N/A']);
    });

    it('should have ramal and medicao on same linha (3)', () => {
      const fields = getRetornoFields('INSPECAO UC CORTADA I15');
      const ramal = fields.find(f => f.nome === 'ramal');
      const medicao = fields.find(f => f.nome === 'medicao');
      expect(ramal.linha).toBe(3);
      expect(medicao.linha).toBe(3);
    });

    it('should have jump and chaves on same linha (4)', () => {
      const fields = getRetornoFields('INSPECAO UC CORTADA I15');
      const jump = fields.find(f => f.nome === 'jump');
      const chaves = fields.find(f => f.nome === 'chaves');
      expect(jump.linha).toBe(4);
      expect(chaves.linha).toBe(4);
    });

    it('should have aplicado-toi and toi on same linha (5)', () => {
      const fields = getRetornoFields('INSPECAO UC CORTADA I15');
      const aplicadoToi = fields.find(f => f.nome === 'aplicado-toi');
      const toi = fields.find(f => f.nome === 'toi');
      expect(aplicadoToi.linha).toBe(5);
      expect(toi.linha).toBe(5);
    });

    it('should have TOI field with condicional on aplicado-toi = SIM', () => {
      const fields = getRetornoFields('INSPECAO UC CORTADA I15');
      const toi = fields.find(f => f.nome === 'toi');
      expect(toi.condicional).toEqual({
        campoRef: 'aplicado-toi',
        valor: 'SIM',
      });
    });

    it('should have descricao as last field', () => {
      const fields = getRetornoFields('INSPECAO UC CORTADA I15');
      const lastField = fields[fields.length - 1];
      expect(lastField.nome).toBe('descricao');
      expect(lastField.label).toBe('Descrição do Serviço');
      expect(lastField.tipo).toBe('textarea');
      expect(lastField.linha).toBe(6);
    });

    it('should have descricao field', () => {
      const fields = getRetornoFields('INSPECAO UC CORTADA I15');
      const descricao = fields.find(f => f.nome === 'descricao');
      expect(descricao).toBeDefined();
      expect(descricao.tipo).toBe('textarea');
    });

    it('should NOT have observacoes field (removed)', () => {
      const fields = getRetornoFields('INSPECAO UC CORTADA I15');
      const observacoes = fields.find(f => f.nome === 'observacoes');
      expect(observacoes).toBeUndefined();
    });

    it('should have exactly 9 fields (includes descricao, observacoes removed)', () => {
      const fields = getRetornoFields('INSPECAO UC CORTADA I15');
      expect(fields.length).toBe(9);
    });
  });

  describe('Campos da aba corte', () => {
    describe('CORTE POR FALTA DE PAGAMENTO', () => {
      it('should have exactly 2 fields (situacao_corte and descricao)', () => {
        const fields = getRetornoFields('CORTE POR FALTA DE PAGAMENTO');
        expect(fields.length).toBe(2);
      });

      it('should have situacao_corte as first field with 4 options', () => {
        const fields = getRetornoFields('CORTE POR FALTA DE PAGAMENTO');
        const field = fields[0];
        expect(field.nome).toBe('situacao_corte');
        expect(field.tipo).toBe('select');
        expect(field.opcoes).toEqual([
          'CLIENTE CORTADO',
          'CLIENTE VISITADO CONTA PAGA',
          'CLIENTE NAO PERMITIU O CORTE',
          'SEM ACESSO PARA EXECUTAR O CORTE',
        ]);
      });

      it('should have descricao as last field', () => {
        const fields = getRetornoFields('CORTE POR FALTA DE PAGAMENTO');
        const lastField = fields[fields.length - 1];
        expect(lastField.nome).toBe('descricao');
        expect(lastField.label).toBe('Descrição do Serviço');
        expect(lastField.tipo).toBe('textarea');
        expect(lastField.linha).toBe(2);
      });
    });

    describe('DESLIG.PROG.MANUTENÇÃO', () => {
      it('should have exactly 3 fields (desligamento, acesso_desligamento, descricao)', () => {
        const fields = getRetornoFields('DESLIG.PROG.MANUTENÇÃO');
        expect(fields.length).toBe(3);
      });

      it('should have desligamento as first field with 5 options', () => {
        const fields = getRetornoFields('DESLIG.PROG.MANUTENÇÃO');
        const field = fields[0];
        expect(field.nome).toBe('desligamento');
        expect(field.tipo).toBe('select');
        expect(field.opcoes).toEqual([
          'DESLIGAMENTO EXECUTADO',
          'CLIENTE CANCELOU DESLIGAMENTO',
          'SEM ACESSO',
          'NAO EXECUTADO PENDENCIA CLIENTE',
          'NAO EXECUTADO PENDENCIA ENEL',
        ]);
      });

      it('should have acesso_desligamento with negated conditional', () => {
        const fields = getRetornoFields('DESLIG.PROG.MANUTENÇÃO');
        const field = fields[1];
        expect(field.nome).toBe('acesso_desligamento');
        expect(field.tipo).toBe('text');
        expect(field.condicional).toEqual({
          campoRef: 'desligamento',
          valor: 'DESLIGAMENTO EXECUTADO',
          negado: true,
        });
      });

      it('should have descricao as last field', () => {
        const fields = getRetornoFields('DESLIG.PROG.MANUTENÇÃO');
        const lastField = fields[fields.length - 1];
        expect(lastField.nome).toBe('descricao');
        expect(lastField.label).toBe('Descrição do Serviço');
        expect(lastField.tipo).toBe('textarea');
        expect(lastField.linha).toBe(3);
      });
    });

    describe('LIGACAO NOVA MEDIA TENSAO', () => {
      it('should have exactly 12 fields (including descricao)', () => {
        const fields = getRetornoFields('LIGACAO NOVA MEDIA TENSAO');
        expect(fields.length).toBe(12);
      });

      it('should have retorno_ligacao as first field with 3 options', () => {
        const fields = getRetornoFields('LIGACAO NOVA MEDIA TENSAO');
        const field = fields[0];
        expect(field.nome).toBe('retorno_ligacao');
        expect(field.tipo).toBe('select');
        expect(field.opcoes).toEqual(['VISTORIA', 'VISTORIA + LIGAÇÃO', 'LIGAÇÃO']);
      });

      it('should have obra with multi-value conditional (array)', () => {
        const fields = getRetornoFields('LIGACAO NOVA MEDIA TENSAO');
        const field = fields.find(f => f.nome === 'obra');
        expect(field.condicional).toEqual({
          campoRef: 'retorno_ligacao',
          valor: ['VISTORIA', 'VISTORIA + LIGAÇÃO'],
        });
      });

      it('should have qtd_medidor_bt conditional on medidor_bt', () => {
        const fields = getRetornoFields('LIGACAO NOVA MEDIA TENSAO');
        const field = fields.find(f => f.nome === 'qtd_medidor_bt');
        expect(field.condicional).toEqual({ campoRef: 'medidor_bt', valor: 'COM MEDIDOR BT' });
      });

      it('should have ligacao conditional on retorno_ligacao = LIGAÇÃO or VISTORIA + LIGAÇÃO', () => {
        const fields = getRetornoFields('LIGACAO NOVA MEDIA TENSAO');
        const field = fields.find(f => f.nome === 'ligacao');
        expect(field.condicional).toEqual({
          campoRef: 'retorno_ligacao',
          valor: ['LIGAÇÃO', 'VISTORIA + LIGAÇÃO'],
        });
      });

      it('should have descricao as last field', () => {
        const fields = getRetornoFields('LIGACAO NOVA MEDIA TENSAO');
        const lastField = fields[fields.length - 1];
        expect(lastField.nome).toBe('descricao');
        expect(lastField.label).toBe('Descrição do Serviço');
        expect(lastField.tipo).toBe('textarea');
        expect(lastField.linha).toBe(7);
      });
    });

    describe('LIGACAO NOVA MT - CLIENTE LIVRE', () => {
      it('should return the same array reference as LIGACAO NOVA MEDIA TENSAO', () => {
        const fields1 = getRetornoFields('LIGACAO NOVA MEDIA TENSAO');
        const fields2 = getRetornoFields('LIGACAO NOVA MT - CLIENTE LIVRE');
        expect(fields1).toBe(fields2);
      });
    });
  });

  describe('Campos da aba afericao', () => {
    const afericaoTipos = ['AFERIÇÃO DE MEDIDOR', 'AFERIÇÃO MEDIDOR CLIENTE LIVRE'];

    it('should have exactly 1 field (descricao) for each AFERIÇÃO tipo', () => {
      afericaoTipos.forEach(tipo => {
        const fields = getRetornoFields(tipo);
        expect(fields.length).toBe(1);
      });
    });

    it('should have descricao with label and textarea type for both AFERIÇÃO tipos', () => {
      afericaoTipos.forEach(tipo => {
        const fields = getRetornoFields(tipo);
        const field = fields[0];
        expect(field.nome).toBe('descricao');
        expect(field.label).toBe('Descrição do Serviço');
        expect(field.tipo).toBe('textarea');
      });
    });
  });

  describe('Campos da aba telemetria', () => {
    const telemetriaTipos = [
      'TELEMEDIÇÃO MANUTENÇÃO',
      'TELEMEDIÇÃO MANUTENÇÃO CLIENTE LIVRE',
      'TELEMEDIÇÃO MANUTENÇÃO LOTE',
    ];

    it('should have exactly 6 fields for each TELEMEDIÇÃO tipo (5 + descricao)', () => {
      telemetriaTipos.forEach(tipo => {
        const fields = getRetornoFields(tipo);
        expect(fields.length).toBe(6);
      });
    });

    it('should return the same array reference for all 3 TELEMEDIÇÃO tipos', () => {
      const fields1 = getRetornoFields('TELEMEDIÇÃO MANUTENÇÃO');
      const fields2 = getRetornoFields('TELEMEDIÇÃO MANUTENÇÃO CLIENTE LIVRE');
      const fields3 = getRetornoFields('TELEMEDIÇÃO MANUTENÇÃO LOTE');
      expect(fields1).toBe(fields2);
      expect(fields2).toBe(fields3);
    });

    it('should have executado_telemedicao as first field with 2 options', () => {
      const fields = getRetornoFields('TELEMEDIÇÃO MANUTENÇÃO');
      const field = fields[0];
      expect(field.nome).toBe('executado_telemedicao');
      expect(field.tipo).toBe('select');
      expect(field.opcoes).toEqual(['SIM', 'NAO']);
      expect(field.condicional).toBeUndefined();
    });

    it('should have motivo_cancelamento_telemedicao conditional on executado_telemedicao = NAO', () => {
      const fields = getRetornoFields('TELEMEDIÇÃO MANUTENÇÃO');
      const field = fields.find(f => f.nome === 'motivo_cancelamento_telemedicao');
      expect(field.tipo).toBe('select');
      expect(field.opcoes).toEqual([
        'SEM ACESSO',
        'MEDICAO COM BY-PASS',
        'MEDICAO AVARIADA',
        'OUTRO MOTIVO',
      ]);
      expect(field.condicional).toEqual({ campoRef: 'executado_telemedicao', valor: 'NAO' });
    });

    it('should have descreva_problema_telemedicao with multi-value conditional', () => {
      const fields = getRetornoFields('TELEMEDIÇÃO MANUTENÇÃO');
      const field = fields.find(f => f.nome === 'descreva_problema_telemedicao');
      expect(field.tipo).toBe('textarea');
      expect(field.condicional).toEqual({
        campoRef: 'motivo_cancelamento_telemedicao',
        valor: ['SEM ACESSO', 'OUTRO MOTIVO'],
      });
    });

    it('should have atentende_com with label "Atendente (COM)" and conditional on executado_telemedicao = SIM', () => {
      const fields = getRetornoFields('TELEMEDIÇÃO MANUTENÇÃO');
      const field = fields.find(f => f.nome === 'atentende_com');
      expect(field.label).toBe('Atendente (COM)');
      expect(field.tipo).toBe('text');
      expect(field.condicional).toEqual({ campoRef: 'executado_telemedicao', valor: 'SIM' });
    });

    it('should have realizado_telemedicao conditional on executado_telemedicao = SIM', () => {
      const fields = getRetornoFields('TELEMEDIÇÃO MANUTENÇÃO');
      const field = fields.find(f => f.nome === 'realizado_telemedicao');
      expect(field.tipo).toBe('textarea');
      expect(field.condicional).toEqual({ campoRef: 'executado_telemedicao', valor: 'SIM' });
    });

    it('should have descricao as last field', () => {
      const fields = getRetornoFields('TELEMEDIÇÃO MANUTENÇÃO');
      const lastField = fields[fields.length - 1];
      expect(lastField.nome).toBe('descricao');
      expect(lastField.label).toBe('Descrição do Serviço');
      expect(lastField.tipo).toBe('textarea');
    });
  });

  describe('Campos da aba corte - CORTE DE UC POR DEF TECNICO', () => {
    it('should have exactly 4 fields (3 + descricao)', () => {
      const fields = getRetornoFields('CORTE DE UC POR DEF TECNICO');
      expect(fields.length).toBe(4);
    });

    it('should have corte_por_defeito_tecnico as first field with 2 options', () => {
      const fields = getRetornoFields('CORTE DE UC POR DEF TECNICO');
      const field = fields[0];
      expect(field.nome).toBe('corte_por_defeito_tecnico');
      expect(field.tipo).toBe('select');
      expect(field.opcoes).toEqual(['SIM', 'NAO']);
      expect(field.condicional).toBeUndefined();
    });

    it('should have motivo_cancelamento_corte_por_defeito_tecnico conditional on corte_por_defeito_tecnico = NAO', () => {
      const fields = getRetornoFields('CORTE DE UC POR DEF TECNICO');
      const field = fields.find(f => f.nome === 'motivo_cancelamento_corte_por_defeito_tecnico');
      expect(field.tipo).toBe('select');
      expect(field.opcoes).toEqual([
        'SEM ACESSO',
        'SOLICITACAO ENEL',
        'CLIENTE NAO PERMITIU',
        'CLIENTE CORRIGIU PROBLEMA',
        'OUTRO PROBLEMA',
      ]);
      expect(field.condicional).toEqual({ campoRef: 'corte_por_defeito_tecnico', valor: 'NAO' });
    });

    it('should have descreva_problema_corte_por_defeito_tecnico with multi-value conditional', () => {
      const fields = getRetornoFields('CORTE DE UC POR DEF TECNICO');
      const field = fields.find(f => f.nome === 'descreva_problema_corte_por_defeito_tecnico');
      expect(field.tipo).toBe('textarea');
      expect(field.condicional).toEqual({
        campoRef: 'motivo_cancelamento_corte_por_defeito_tecnico',
        valor: ['SEM ACESSO', 'OUTRO PROBLEMA'],
      });
    });

    it('should have descricao as last field', () => {
      const fields = getRetornoFields('CORTE DE UC POR DEF TECNICO');
      const lastField = fields[fields.length - 1];
      expect(lastField.nome).toBe('descricao');
      expect(lastField.label).toBe('Descrição do Serviço');
      expect(lastField.tipo).toBe('textarea');
    });
  });
});
