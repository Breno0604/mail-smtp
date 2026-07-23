import { describe, it, expect, beforeEach } from 'vitest';
import { composeEmail, applyRetornoTemplate } from '../scripts/email.js';
import { renderIniciais } from '../scripts/iniciais.js';
import { renderRetorno } from '../scripts/retornos.js';
import { createTestDOM } from './helpers/dom-fixture.js';

describe('email', () => {
  beforeEach(() => {
    createTestDOM();
  });

  describe('composeEmail', () => {
    const sampleData = {
      iniciais: {
        coordenadas: '-3.123, -38.456',
        lider: 'ANDRE DE SOUSA CARVALHO',
        parceiro: '',
        municipio: 'FORTALEZA',
        uc: '12345',
        os: '67890',
        notificado: 'SIM',
        placa: 'RIE0D84',
        data: '2024-03-15',
        hora_inicio: '08:00',
        hora_fim: '17:00',
        'tipo-ordem': 'ADEQUACAO SMF',
      },
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
      },
      retorno: { descricao: '' },
    };

    it('should generate email body with iniciais fields', () => {
      const body = composeEmail(sampleData);
      expect(body).toContain('LIDER:');
      expect(body).toContain('ANDRE DE SOUSA CARVALHO');
      expect(body).toContain('UC:');
      expect(body).toContain('12345');
      expect(body).toContain('OS:');
      expect(body).toContain('67890');
    });

    it('should include coordenadas in email body', () => {
      const body = composeEmail(sampleData);
      expect(body).toContain('COORDENADAS:');
      expect(body).toContain('-3.123, -38.456');
    });

    it('should format date field as DD/MM/YYYY', () => {
      const data = { ...sampleData, iniciais: { ...sampleData.iniciais, data: '2024-03-15' } };
      const body = composeEmail(data);
      expect(body).toContain('15/03/2024');
    });

    it('should include "—" for empty iniciais fields', () => {
      const data = { ...sampleData, iniciais: { ...sampleData.iniciais, lider: '' } };
      const body = composeEmail(data);
      expect(body).toContain('—');
    });

    it('should include equipamentos section when equipment rows exist', () => {
      const data = {
        ...sampleData,
        equipamentos: {
          instaladoEquip: 'SIM',
          retiradoEquip: 'NAO',
          instalados: {
            medidor: '12345',
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
        },
      };
      const body = composeEmail(data);
      expect(body).toContain('EQUIPAMENTOS INSTALADOS:');
      expect(body).toContain('MEDIDOR');
      expect(body).toContain('12345');
    });

    it('should not include empty equipment fields', () => {
      const data = {
        ...sampleData,
        equipamentos: {
          instaladoEquip: 'SIM',
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
        },
      };
      const body = composeEmail(data);
      expect(body).not.toContain('EQUIPAMENTOS INSTALADOS:');
    });

    it('should normalize accented text in template output', () => {
      const data = {
        ...sampleData,
        iniciais: { ...sampleData.iniciais, 'tipo-ordem': 'CORTE POR FALTA DE PAGAMENTO' },
        equipamentos: {
          instaladoEquip: 'NAO',
          retiradoEquip: 'NAO',
          instalados: {},
          retirados: {},
        },
        retorno: {
          situacao_corte: 'CLIENTE CORTADO',
          descricao: 'João foi cortado por falta de pagamento',
        },
      };
      const body = composeEmail(data);
      expect(body).toContain('JOAO FOI CORTADO POR FALTA DE PAGAMENTO');
      expect(body).not.toContain('João');
      expect(body).not.toContain('Joao foi cortado por falta de pagamento');
    });

    it('should add empty line before and after equipamentos retirados', () => {
      const data = {
        ...sampleData,
        equipamentos: {
          instaladoEquip: 'SIM',
          retiradoEquip: 'SIM',
          instalados: {
            medidor: 'ABC123',
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
            medidor: 'XYZ789',
            conjunto: '',
            display: '',
            tc_fase_a: '',
            tc_fase_b: '',
            tc_fase_c: '',
            tp_fase_a: '',
            tp_fase_b: '',
            tp_fase_c: '',
          },
        },
      };
      const body = composeEmail(data);
      expect(body).toContain('\n\nEQUIPAMENTOS RETIRADOS:');
      expect(body).toContain('MEDIDOR: XYZ789\n\n');
    });

    it('should include retorno fields without header', () => {
      const data = { ...sampleData, retorno: { descricao: 'Retorno test description' } };
      const body = composeEmail(data);
      expect(body).toContain('RETORNO TEST DESCRIPTION');
    });

    it('should show "(NAO PREENCHIDO)" for empty retorno field', () => {
      const data = { ...sampleData, retorno: { descricao: '' } };
      const body = composeEmail(data);
      expect(body).toContain('(NAO PREENCHIDO)');
    });

    it('should return body string', () => {
      const body = composeEmail(sampleData);
      expect(typeof body).toBe('string');
      expect(body.length).toBeGreaterThan(0);
    });

    it('should exclude fields not present in data.retorno (hidden fields)', () => {
      const data = {
        iniciais: { ...sampleData.iniciais, 'tipo-ordem': 'LIGACAO NOVA MEDIA TENSAO' },
        equipamentos: [],
        retorno: { retorno_ligacao: 'VISTORIA' },
      };
      const body = composeEmail(data);
      // Template overrides field-by-field rendering for LIGACAO NOVA MEDIA TENSAO
      // VISTORIA variant selected, but no conditional blocks match (no obra, etc.)
      // Only unconditional blocks render: empty + {descricao}
      expect(body).toContain('{DESCRICAO}');
      expect(body).not.toContain('EXECUTADO:');
      expect(body).not.toContain('OBRA:');
      expect(body).not.toContain('LIGACAO:');
      expect(body).not.toContain('TOMBAMENTO:');
    });

    it('should show visible but empty fields as "(NAO PREENCHIDO)"', () => {
      const data = {
        iniciais: { ...sampleData.iniciais, 'tipo-ordem': 'LIGACAO NOVA MEDIA TENSAO' },
        equipamentos: [],
        retorno: { retorno_ligacao: '', obra: '', tipo_medicao: '' },
      };
      const body = composeEmail(data);
      expect(body).toContain('EXECUTADO:');
      expect(body).toContain('(NAO PREENCHIDO)');
    });

    it('should use template when available for CORTE POR FALTA DE PAGAMENTO', () => {
      const data = {
        iniciais: { ...sampleData.iniciais, 'tipo-ordem': 'CORTE POR FALTA DE PAGAMENTO' },
        equipamentos: {
          instaladoEquip: 'NAO',
          retiradoEquip: 'NAO',
          instalados: {},
          retirados: {},
        },
        retorno: { situacao_corte: 'CLIENTE CORTADO', descricao: 'Corte efetuado na UC' },
      };
      const body = composeEmail(data);
      expect(body).toContain('CLIENTE CORTADO.');
      expect(body).toContain('CORTE EFETUADO NA UC');
      expect(body).not.toContain('SITUACAO:');
    });

    it('should use UC CORTADA template with block-level condicao', () => {
      const data = {
        iniciais: { ...sampleData.iniciais, 'tipo-ordem': 'INSPECAO UC CORTADA I15' },
        equipamentos: {
          instaladoEquip: 'NAO',
          retiradoEquip: 'NAO',
          instalados: {},
          retirados: {},
        },
        retorno: {
          'situacao-cliente': 'CORTADO',
          'viavel-retirar': 'COM MUNK',
          ramal: 'COM RAMAL',
          medicao: 'COM MEDIÇÃO',
          jump: 'COM JUMP',
          chaves: 'COM CHAVE',
          'aplicado-toi': 'SIM',
          toi: '99999',
          descricao: 'Inspeção finalizada',
        },
      };
      const body = composeEmail(data);
      expect(body).toContain('CLIENTE ENCONTRADO CORTADO');
      expect(body).toContain('TOI: 99999');
      expect(body).toContain('INSPECAO FINALIZADA');
      expect(body).not.toContain('SITUACAO:');
    });
  });

  describe('applyRetornoTemplate', () => {
    it('should return null for tipo without template', () => {
      const result = applyRetornoTemplate('TIPO_SEM_TEMPLATE_CADASTRADO', { retorno: {} });
      expect(result).toBeNull();
    });

    it('should return null for unknown tipo', () => {
      const result = applyRetornoTemplate('TIPO INEXISTENTE', { retorno: {} });
      expect(result).toBeNull();
    });

    it('should substitute placeholders with field values', () => {
      const data = {
        retorno: {
          situacao_corte: 'CLIENTE CORTADO',
          descricao: 'Corte realizado com sucesso',
        },
      };
      const result = applyRetornoTemplate('CORTE POR FALTA DE PAGAMENTO', data);
      expect(result).toContain('CLIENTE CORTADO.');
      expect(result).toContain('Corte realizado com sucesso');
    });

    it('should work with any situacao_corte value', () => {
      const data = {
        retorno: {
          situacao_corte: 'CLIENTE VISITADO CONTA PAGA',
          descricao: 'Cliente pagou a conta',
        },
      };
      const result = applyRetornoTemplate('CORTE POR FALTA DE PAGAMENTO', data);
      expect(result).toContain('CLIENTE VISITADO CONTA PAGA.');
      expect(result).toContain('Cliente pagou a conta');
    });

    it('should handle empty field values without breaking', () => {
      const data = {
        retorno: {
          situacao_corte: 'SEM ACESSO PARA EXECUTAR O CORTE',
          descricao: '',
        },
      };
      const result = applyRetornoTemplate('CORTE POR FALTA DE PAGAMENTO', data);
      expect(result).toContain('SEM ACESSO PARA EXECUTAR O CORTE.');
    });

    it('should handle missing descricao field', () => {
      const data = {
        retorno: {
          situacao_corte: 'CLIENTE CORTADO',
        },
      };
      const result = applyRetornoTemplate('CORTE POR FALTA DE PAGAMENTO', data);
      expect(result).toContain('CLIENTE CORTADO.');
    });

    describe('block-level condicao', () => {
      const ucData = {
        retorno: {
          'situacao-cliente': 'CORTADO',
          'viavel-retirar': 'COM MUNK',
          ramal: 'COM RAMAL',
          medicao: 'COM MEDIÇÃO',
          jump: 'COM JUMP',
          chaves: 'COM CHAVE',
          'aplicado-toi': 'SIM',
          toi: '12345',
          descricao: 'Serviço concluído',
        },
      };

      it('should include TOI block when aplicado-toi is SIM', () => {
        const result = applyRetornoTemplate('INSPECAO UC CORTADA I15', ucData);
        expect(result).toContain('TOI: 12345');
      });

      it('should omit TOI block when aplicado-toi is NAO', () => {
        const data = {
          retorno: { ...ucData.retorno, 'aplicado-toi': 'NAO', toi: '' },
        };
        const result = applyRetornoTemplate('INSPECAO UC CORTADA I15', data);
        expect(result).not.toContain('TOI:');
      });

      it('should render full UC CORTADA template correctly', () => {
        const result = applyRetornoTemplate('INSPECAO UC CORTADA I15', ucData);
        expect(result).toContain(
          'CLIENTE ENCONTRADO CORTADO, COM RAMAL, COM MEDIÇÃO, COM JUMP, COM CHAVE'
        );
        expect(result).toContain('VIAVEL RETIRAR COM MUNK');
        expect(result).toContain('Serviço concluído');
      });

      it('should work for all INSPECAO UC CORTADA variants', () => {
        const resultI30 = applyRetornoTemplate('INSPECAO UC CORTADA I30', ucData);
        const resultI90 = applyRetornoTemplate('INSPECAO UC CORTADA I90', ucData);
        const resultI180 = applyRetornoTemplate('INSPECAO UC CORTADA I180', ucData);
        expect(resultI30).toBe(resultI90);
        expect(resultI90).toBe(resultI180);
        expect(resultI180).toContain('CLIENTE ENCONTRADO CORTADO');
      });
    });

    describe('LIGACAO NOVA MT template', () => {
      describe('compound (array) conditions', () => {
        it('should match AND condition when both fields match (COM MEDICAO + ACOPLADA)', () => {
          const data = {
            retorno: {
              retorno_ligacao: 'VISTORIA',
              status_medicao: 'COM MEDICAO',
              tipo_medicao: 'ACOPLADA',
            },
          };
          const result = applyRetornoTemplate('LIGACAO NOVA MEDIA TENSAO', data);
          expect(result).toContain('COM MEDICAO ACOPLADO NO LOCAL');
        });

        it('should not match AND condition when only one field matches (wrong tipo_medicao)', () => {
          const data = {
            retorno: {
              retorno_ligacao: 'VISTORIA',
              status_medicao: 'COM MEDICAO',
              tipo_medicao: 'CUBICULO',
            },
          };
          const result = applyRetornoTemplate('LIGACAO NOVA MEDIA TENSAO', data);
          expect(result).toContain('COM MEDICAO CUBICULO NO LOCAL');
          expect(result).not.toContain('COM MEDICAO ACOPLADO NO LOCAL');
        });

        it('should match the correct compound variant among many (DIRETA)', () => {
          const data = {
            retorno: {
              retorno_ligacao: 'VISTORIA',
              status_medicao: 'COM MEDICAO',
              tipo_medicao: 'DIRETA',
            },
          };
          const result = applyRetornoTemplate('LIGACAO NOVA MEDIA TENSAO', data);
          expect(result).toContain('COM MEDICAO DIRETA NO LOCAL');
          expect(result).not.toContain('ACOPLADO');
          expect(result).not.toContain('CUBICULO');
          expect(result).not.toContain('SEMI-DIRETA');
        });
      });

      describe('VISTORIA variant', () => {
        it('should render full VISTORIA template with all fields filled', () => {
          const vistoriaData = {
            retorno: {
              retorno_ligacao: 'VISTORIA',
              obra: 'CONCLUIDA',
              status_medicao: 'COM MEDICAO',
              tipo_medicao: 'ACOPLADA',
              ponto_de_entrega: 'DE ACORDO',
              medidor_bt: 'COM MEDIDOR BT',
              qtd_medidor_bt: '1',
              acesso_medicao: 'REGULAR',
              descricao: 'Vistoria finalizada sem pendências',
            },
          };
          const result = applyRetornoTemplate('LIGACAO NOVA MEDIA TENSAO', vistoriaData);
          expect(result).toContain('OBRA CONCLUIDA');
          expect(result).toContain('COM MEDICAO ACOPLADO NO LOCAL');
          expect(result).toContain('PONTO DE ENTREGA DE ACORDO COM PROJETO');
          expect(result).toContain('COM 1 MEDIDOR DE BT');
          expect(result).toContain('ACESSO A MEDICAO REGULAR');
          expect(result).toContain('Vistoria finalizada sem pendências');
        });
      });

      describe('LIGAÇÃO variant', () => {
        it('should render LIGAÇÃO template with tombamento', () => {
          const ligacaoData = {
            retorno: {
              retorno_ligacao: 'LIGAÇÃO',
              ligacao: 'CONCLUIDA',
              tombamento: 'ABC-1234',
              descricao: 'Ligação concluída com sucesso',
            },
          };
          const result = applyRetornoTemplate('LIGACAO NOVA MEDIA TENSAO', ligacaoData);
          expect(result).toContain('LIGAÇÃO CONCLUIDA');
          expect(result).toContain('TOMBAMENTO: ABC-1234');
          expect(result).toContain('Ligação concluída com sucesso');
        });

        it('should omit TOMBAMENTO line when tombamento is empty', () => {
          const ligacaoData = {
            retorno: {
              retorno_ligacao: 'LIGAÇÃO',
              ligacao: 'CONCLUIDA',
              tombamento: '',
              descricao: 'Ligação concluída',
            },
          };
          const result = applyRetornoTemplate('LIGACAO NOVA MEDIA TENSAO', ligacaoData);
          expect(result).toContain('LIGAÇÃO CONCLUIDA');
          expect(result).not.toContain('TOMBAMENTO:');
          expect(result).toContain('Ligação concluída');
        });
      });

      describe('VISTORIA + LIGAÇÃO variant', () => {
        it('should render combined template correctly', () => {
          const combinedData = {
            retorno: {
              retorno_ligacao: 'VISTORIA + LIGAÇÃO',
              ligacao: 'CONCLUIDA',
              tombamento: 'DEF-5678',
              obra: 'NAO CONCLUIDA',
              status_medicao: 'COM MEDICAO',
              tipo_medicao: 'CUBICULO',
              ponto_de_entrega: 'EM DESACORDO',
              medidor_bt: 'SEM MEDIDOR BT',
              acesso_medicao: 'IRREGULAR',
              acesso_ponto_de_entrega: 'MURO ALTO',
              descricao: 'Retorno completo',
            },
          };
          const result = applyRetornoTemplate('LIGACAO NOVA MEDIA TENSAO', combinedData);
          expect(result).toContain('LIGAÇÃO CONCLUIDA');
          expect(result).toContain('TOMBAMENTO: DEF-5678');
          expect(result).toContain('OBRA NAO CONCLUIDA');
          expect(result).toContain('COM MEDICAO CUBICULO NO LOCAL');
          expect(result).toContain('PONTO DE ENTREGA EM DESACORDO COM O PROJETO');
          expect(result).toContain('SEM MEDIDOR DE BT');
          expect(result).toContain('ACESSO A MEDICAO IRREGULAR DEVIDO MURO ALTO');
          expect(result).toContain('Retorno completo');
          expect(result).not.toContain('OBRA CONCLUIDA');
          expect(result).not.toContain('COM MEDICAO ACOPLADO NO LOCAL');
        });
      });

      describe('shared template reference', () => {
        it('should return the same string for both tipo variants', () => {
          const vistoriaData = {
            retorno: {
              retorno_ligacao: 'VISTORIA',
              obra: 'CONCLUIDA',
              status_medicao: 'COM MEDICAO',
              tipo_medicao: 'ACOPLADA',
              ponto_de_entrega: 'DE ACORDO',
              medidor_bt: 'COM MEDIDOR BT',
              qtd_medidor_bt: '1',
              acesso_medicao: 'REGULAR',
              descricao: 'Vistoria finalizada sem pendências',
            },
          };
          const result1 = applyRetornoTemplate('LIGACAO NOVA MEDIA TENSAO', vistoriaData);
          const result2 = applyRetornoTemplate('LIGACAO NOVA MT - CLIENTE LIVRE', vistoriaData);
          expect(result1).toBe(result2);
        });
      });
    });

    describe('TELEMEDICAO template', () => {
      it('should include atentende_com and realizado_telemedicao when executado is SIM', () => {
        const data = {
          retorno: {
            executado_telemedicao: 'SIM',
            atentende_com: 'CARLOS CRISTIANO',
            realizado_telemedicao: 'Manutencao realizada no medidor',
            descricao: 'Servico concluido',
          },
        };
        const result = applyRetornoTemplate('TELEMEDIÇÃO MANUTENÇÃO', data);
        expect(result).toContain('EXECUTADO: SIM');
        expect(result).toContain('ATENDENTE: CARLOS CRISTIANO');
        expect(result).toContain('REALIZADO: Manutencao realizada no medidor');
        expect(result).toContain('Servico concluido');
      });

      it('should include motivo and problem when executado is NAO', () => {
        const data = {
          retorno: {
            executado_telemedicao: 'NAO',
            motivo_cancelamento_telemedicao: 'SEM ACESSO',
            descreva_problema_telemedicao: 'Portao fechado',
            descricao: 'Nao foi possivel executar',
          },
        };
        const result = applyRetornoTemplate('TELEMEDIÇÃO MANUTENÇÃO', data);
        expect(result).toContain('EXECUTADO: NAO');
        expect(result).toContain('MOTIVO: SEM ACESSO');
        expect(result).toContain('PROBLEMA: Portao fechado');
        expect(result).toContain('Nao foi possivel executar');
      });

      it('should omit problem line when motivo is not SEM ACESSO or OUTRO MOTIVO', () => {
        const data = {
          retorno: {
            executado_telemedicao: 'NAO',
            motivo_cancelamento_telemedicao: 'MEDICAO COM BY-PASS',
            descreva_problema_telemedicao: 'N/A',
            descricao: 'By-pass detectado',
          },
        };
        const result = applyRetornoTemplate('TELEMEDIÇÃO MANUTENÇÃO', data);
        expect(result).not.toContain('PROBLEMA:');
        expect(result).toContain('MOTIVO: MEDICAO COM BY-PASS');
      });

      it('should work for all TELEMEDICAO variants', () => {
        const data = {
          retorno: {
            executado_telemedicao: 'SIM',
            atentende_com: 'TECNICO',
            realizado_telemedicao: 'OK',
            descricao: 'Teste',
          },
        };
        const r1 = applyRetornoTemplate('TELEMEDIÇÃO MANUTENÇÃO', data);
        const r2 = applyRetornoTemplate('TELEMEDIÇÃO MANUTENÇÃO CLIENTE LIVRE', data);
        const r3 = applyRetornoTemplate('TELEMEDIÇÃO MANUTENÇÃO LOTE', data);
        expect(r1).toBe(r2);
        expect(r2).toBe(r3);
      });
    });

    describe('CORTE DE UC POR DEF TECNICO template', () => {
      it('should show SIM variant', () => {
        const data = {
          retorno: {
            corte_por_defeito_tecnico: 'SIM',
            descricao: 'Corte executado',
          },
        };
        const result = applyRetornoTemplate('CORTE DE UC POR DEF TECNICO', data);
        expect(result).toContain('EXECUTADO: SIM');
        expect(result).toContain('Corte executado');
      });

      it('should show NAO variant with motivo and problem', () => {
        const data = {
          retorno: {
            corte_por_defeito_tecnico: 'NAO',
            motivo_cancelamento_corte_por_defeito_tecnico: 'SEM ACESSO',
            descreva_problema_corte_por_defeito_tecnico: 'Portao trancado',
            descricao: 'Nao executado',
          },
        };
        const result = applyRetornoTemplate('CORTE DE UC POR DEF TECNICO', data);
        expect(result).toContain('EXECUTADO: NAO');
        expect(result).toContain('MOTIVO: SEM ACESSO');
        expect(result).toContain('PROBLEMA: Portao trancado');
      });

      it('should omit problem for motivo without description', () => {
        const data = {
          retorno: {
            corte_por_defeito_tecnico: 'NAO',
            motivo_cancelamento_corte_por_defeito_tecnico: 'CLIENTE NAO PERMITIU',
            descreva_problema_corte_por_defeito_tecnico: '',
            descricao: 'Cliente nao permitiu',
          },
        };
        const result = applyRetornoTemplate('CORTE DE UC POR DEF TECNICO', data);
        expect(result).not.toContain('PROBLEMA:');
        expect(result).toContain('MOTIVO: CLIENTE NAO PERMITIU');
      });
    });

    describe('DESLIG.PROG.MANUTENCAO template', () => {
      it('should show EXECUTADO variant', () => {
        const data = {
          retorno: {
            desligamento: 'DESLIGAMENTO EXECUTADO',
            descricao: 'Desligamento realizado',
          },
        };
        const result = applyRetornoTemplate('DESLIG.PROG.MANUTENÇÃO', data);
        expect(result).toContain('DESLIGAMENTO EXECUTADO');
        expect(result).not.toContain('STATUS:');
        expect(result).not.toContain('PROBLEMA:');
      });

      it('should show status and problem for non-EXECUTADO variants', () => {
        const data = {
          retorno: {
            desligamento: 'SEM ACESSO',
            acesso_desligamento: 'Cliente nao encontrado',
            descricao: 'Desligamento nao realizado',
          },
        };
        const result = applyRetornoTemplate('DESLIG.PROG.MANUTENÇÃO', data);
        expect(result).toContain('STATUS: SEM ACESSO');
        expect(result).toContain('PROBLEMA: Cliente nao encontrado');
        expect(result).toContain('Desligamento nao realizado');
      });
    });
  });
});
