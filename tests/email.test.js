import { describe, it, expect, beforeEach } from 'vitest';
import { composeEmail, applyRetornoTemplate } from '../scripts/email.js';
import { cacheDOM, DOM } from '../scripts/dom.js';
import { renderIniciais } from '../scripts/iniciais.js';
import { renderRetorno } from '../scripts/retornos.js';

describe('email', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="iniciais-campos"></div>
      <div id="equipamentos-list"></div>
      <div id="retorno-campos"></div>
      <div id="retorno-desc"></div>
      <select id="tipo-ordem">
        <option value="">Selecione</option>
        <option value="ADEQUACAO SMF">ADEQUACAO SMF</option>
      </select>
      <div id="preview-corpo">—</div>
      <div id="preview-grid"></div>
      <div id="file-count">0 / 12</div>
      <div id="file-upload-area"></div>
      <input type="file" id="file-input">
      <div id="error-msg" style="display:none"></div>
      <div class="toast" id="toast"></div>
      <div class="modal-overlay hidden" id="modal-tipo">
        <div class="modal">
          <p id="modal-tipo-text"></p>
          <button id="modal-cancel">Cancelar</button>
          <button id="modal-confirm">Alterar mesmo assim</button>
        </div>
      </div>
      <div class="lightbox-overlay hidden" id="lightbox">
        <button id="lightbox-close">✕</button>
        <img id="lightbox-img" src="" alt="Preview ampliado">
      </div>
      <div class="modal-overlay hidden" id="dup-modal">
        <div class="modal">
          <p id="dup-modal-title"></p>
          <p id="dup-modal-body"></p>
          <button id="dup-modal-cancel">Cancelar</button>
          <button id="dup-modal-confirm">Reenviar</button>
        </div>
      </div>
      <div class="modal-overlay hidden" id="confirm-modal">
        <div class="modal">
          <p id="confirm-modal-text"></p>
          <button id="confirm-modal-cancel">Cancelar</button>
          <button id="confirm-modal-ok">Confirmar</button>
        </div>
      </div>
    `;
    cacheDOM();
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
        placa: 'RHS6G02',
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

    it('should include retorno fields without header', () => {
      const data = { ...sampleData, retorno: { descricao: 'Retorno test description' } };
      const body = composeEmail(data);
      expect(body).toContain('DESCRICAO DO SERVICO:');
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
      expect(body).toContain('{descricao}');
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
      expect(body).toContain('Corte efetuado na UC');
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
      expect(body).toContain('Inspeção finalizada');
      expect(body).not.toContain('SITUACAO:');
    });
  });

  describe('applyRetornoTemplate', () => {
    it('should return null for tipo without template', () => {
      const result = applyRetornoTemplate('ADEQUACAO SMF', { retorno: {} });
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
  });
});
